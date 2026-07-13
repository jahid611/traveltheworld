# TRAVELTHEWORLD

A lightweight, Google-Earth-style 3D globe web application. Pin your places on
a photoreal interactive globe and attach client-side-optimized images and short
videos to every pin. Clean Google-Material chrome, your data only.

Built with **Next.js 15 (App Router, TypeScript)**, **React Three Fiber +
three.js**, **Tailwind CSS 4**, **Zustand**, and **Supabase** (Auth, Postgres
with Row Level Security, private Storage bucket).

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design,
[`DB_SCHEMA.md`](./DB_SCHEMA.md) for the SQL, and [`TASKS.md`](./TASKS.md)
for the build checklist.

---

## Features

- **Interactive 3D globe** — pure three.js sphere with graticule and Natural
  Earth country outlines (pre-baked static asset, no map tiles, no API keys).
- **Smooth camera fly-to** — great-circle slerp with cubic easing when you
  search or select a pin; drag to rotate, scroll to zoom.
- **Pin anywhere** — click the globe (raycast → lat/lon) or search a place
  (OpenStreetMap Nominatim) and save it with a name.
- **Media per pin** — up to **15 items per location**, enforced by a
  race-safe Postgres trigger, not just the UI.
- **Client-side media optimization** — images are resized and transcoded to
  **WebP ≤ 2 MB** before upload; videos must be **MP4/WebM ≤ 15 s**, with a
  lightweight MediaRecorder re-encode fallback for oversized files.
- **Own your data** — RLS on every table, private storage bucket with
  owner-folder policies, signed URLs for reads.
- **Google-Earth-style UI** — photoreal satellite Earth (day / specular /
  normal maps) with a fresnel atmosphere halo and starfield, plus clean Google
  Material chrome: white search pill, circular zoom controls, a live
  coordinate + camera-altitude readout, and white card panels (Roboto,
  `#1a73e8` blue).

### Earth textures

`public/textures/earth_day.jpg`, `earth_specular.jpg`, and `earth_normal.jpg`
come from the [three.js](https://github.com/mrdoob/three.js) example texture
set (NASA Blue Marble / Visible Earth derivatives, public domain). Regenerate
or swap them for higher-resolution maps at your discretion.

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   (tables, RLS policies, triggers, and the private `media` bucket).
3. In **Authentication → Providers**, keep Email enabled. For local
   development you can disable email confirmation to skip the inbox step.

### 3. Configure the environment

```bash
cp .env.example .env.local
# fill in:
# NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Without credentials the app still builds and runs in a view-only
"NOT CONFIGURED" mode.

### 4. Run

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

## Regenerating the world outline asset

`public/data/world-lines.json` is generated from the `world-atlas` (Natural
Earth 110m) dataset:

```bash
npm run world-data                # downloads the source
# or, offline:
node scripts/build-world-data.mjs path/to/countries-110m.json
```

## Project structure

```
app/            routes: / (globe), /login, /signup, /auth/callback
components/     GlobeApp shell, globe/ (R3F), hud/, panels/, media/, auth/, ui/
lib/            constants, types, geo math, zustand store, geocoding
lib/supabase/   browser / server / middleware client factories
lib/data/       typed data access (locations, media + signed URLs)
lib/media/      image (WebP ≤ 2 MB) & video (≤ 15 s) pipelines
supabase/       migrations/0001_init.sql
scripts/        build-world-data.mjs
public/data/    world-lines.json
```
