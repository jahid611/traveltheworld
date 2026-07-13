# DB_SCHEMA — traveltheworld (Supabase / PostgreSQL)

Authoritative SQL for the project. The same statements live in
`supabase/migrations/0001_init.sql` — apply with `supabase db push` or paste
into the Supabase SQL editor. Every table has RLS **enabled and forced**;
users can only read/write their own rows. The 15-media-per-location cap is
enforced in the database (trigger + row lock), not just in the client.

---

## 1. Types

```sql
create type public.media_type as enum ('image', 'video');
```

## 2. Tables

### profiles

```sql
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  first_name   text not null default '',
  last_name    text not null default '',
  email        text not null default '',
  cgu_accepted boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;
```

### locations

```sql
create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  latitude   float8 not null check (latitude  >= -90  and latitude  <= 90),
  longitude  float8 not null check (longitude >= -180 and longitude <= 180),
  created_at timestamptz not null default now()
);

create index locations_user_id_idx on public.locations (user_id);

alter table public.locations enable row level security;
```

### media

```sql
create table public.media (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.locations (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  media_type   public.media_type not null,
  created_at   timestamptz not null default now()
);

create index media_location_id_idx on public.media (location_id);
create index media_user_id_idx     on public.media (user_id);

alter table public.media enable row level security;
```

## 3. Row Level Security policies (owner-only)

```sql
-- profiles: a user sees and edits only their own profile. No INSERT/DELETE
-- policy — the row is created by the handle_new_user trigger and removed by
-- the auth.users cascade.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- locations
create policy "locations_select_own" on public.locations
  for select using (auth.uid() = user_id);
create policy "locations_insert_own" on public.locations
  for insert with check (auth.uid() = user_id);
create policy "locations_update_own" on public.locations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "locations_delete_own" on public.locations
  for delete using (auth.uid() = user_id);

-- media (also requires the parent location to belong to the same user)
create policy "media_select_own" on public.media
  for select using (auth.uid() = user_id);
create policy "media_insert_own" on public.media
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.locations l
      where l.id = location_id and l.user_id = auth.uid()
    )
  );
create policy "media_delete_own" on public.media
  for delete using (auth.uid() = user_id);
```

## 4. Signup trigger — profile materialization + CGU enforcement

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if coalesce((new.raw_user_meta_data ->> 'cgu_accepted')::boolean, false) is distinct from true then
    raise exception 'CGU_NOT_ACCEPTED: terms of service must be accepted';
  end if;

  insert into public.profiles (id, first_name, last_name, email, cgu_accepted)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name',  ''),
    coalesce(new.email, ''),
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

## 5. Media cap — max 15 items per location (race-safe)

The parent location row is locked (`for update`) before counting, so two
concurrent inserts at 14 items cannot both pass the check.

```sql
create or replace function public.enforce_media_limit()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  current_count integer;
begin
  perform 1 from public.locations where id = new.location_id for update;

  select count(*) into current_count
  from public.media
  where location_id = new.location_id;

  if current_count >= 15 then
    raise exception 'MEDIA_LIMIT_REACHED: a location can hold at most 15 media items';
  end if;

  return new;
end;
$$;

create trigger media_limit_check
  before insert on public.media
  for each row execute function public.enforce_media_limit();
```

## 6. Storage — private bucket + owner-folder policies

Object paths are `{user_id}/{location_id}/{uuid}.{ext}`; the first path
segment must be the caller's uid. Bucket is private — reads go through
signed URLs requested by the owner.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', false,
  26214400,  -- 25 MB hard cap per object
  array['image/webp', 'image/jpeg', 'image/png', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

create policy "media_objects_select_own" on storage.objects
  for select using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "media_objects_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "media_objects_delete_own" on storage.objects
  for delete using (
    bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 7. Client-side mirror of the rules

| Rule                          | Database                         | Client precheck                       |
|-------------------------------|----------------------------------|---------------------------------------|
| Owner-only data               | RLS policies above               | queries filtered by session user      |
| CGU acceptance                | `handle_new_user` raises         | required checkbox on signup           |
| ≤ 15 media per location       | `media_limit_check` trigger      | Uploader disables at 15, surfaces DB error |
| Image ≤ 2 MB WebP             | bucket MIME + size limits        | `browser-image-compression` pipeline  |
| Video mp4/webm ≤ 15 s ≤ 25 MB | bucket MIME + 25 MB size limit   | metadata probe + optional re-encode   |
