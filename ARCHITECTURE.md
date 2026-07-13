# ARCHITECTURE — traveltheworld

A lightweight, brutalist 3D globe web application. Users authenticate, pin
locations on an interactive globe, and attach client-side-optimized media
(images/videos) to each pin. All persistence goes through Supabase
(Auth + Postgres + Storage) with owner-only Row Level Security.

---

## 1. Stack

| Layer            | Choice                                                | Why |
|------------------|-------------------------------------------------------|-----|
| Framework        | Next.js 15 (App Router, TypeScript)                   | RSC for session gating, route handlers for auth callback |
| 3D engine        | React Three Fiber 9 + three + drei                    | Declarative scene graph, mandated pure-3D globe |
| Styling          | Tailwind CSS 4 + component classes in `globals.css`   | Brutalist system: monochrome, `border-radius: 0` everywhere |
| State            | Zustand 5 (single store)                              | Tiny, transient-update friendly (critical for R3F frame loops) |
| Backend          | Supabase (`@supabase/supabase-js` + `@supabase/ssr`)  | Auth, Postgres w/ RLS, private Storage bucket |
| Media pipeline   | `browser-image-compression` + MediaRecorder/metadata validation | Client-side pre-compression before upload; no heavyweight wasm |

The globe carries **no runtime third-party services** except Supabase and
(optionally) OpenStreetMap Nominatim for geocoding search. Country outlines
are a pre-baked static asset (`public/data/world-lines.json`), generated once
by `scripts/build-world-data.mjs` from Natural Earth 110m data.

---

## 2. Component hierarchy

```
app/layout.tsx                      RootLayout — global CSS, mono font stack, metadata
├── app/page.tsx                    Server Component — session check, redirects to /login
│   └── components/GlobeApp.tsx     Client orchestrator — data bootstrap, layout shell
│       ├── components/globe/GlobeScene.tsx      <Canvas> (dpr capped, no shadows)
│       │   ├── globe/Earth.tsx                  sphere + graticule + country outlines (LineSegments)
│       │   ├── globe/Markers.tsx                one mesh per location, SHARED geometry/material
│       │   └── globe/CameraRig.tsx              OrbitControls + eased spherical fly-to tween
│       ├── components/hud/TopBar.tsx            brand block, SearchBar, user chip, logout
│       │   └── hud/SearchBar.tsx                Nominatim forward geocoding → requestFlyTo + pendingPin
│       ├── components/panels/LocationPanel.tsx  selected pin: name, coords, media, delete
│       │   ├── media/MediaGrid.tsx              grid of MediaTile (signed URLs)
│       │   ├── media/MediaTile.tsx              <img>/<video> + delete
│       │   └── media/Uploader.tsx               file input → optimization pipeline → Storage + DB row
│       └── components/panels/AddLocationDialog.tsx  confirm pendingPin → INSERT location
├── app/login/page.tsx  → components/auth/LoginForm.tsx
├── app/signup/page.tsx → components/auth/SignUpForm.tsx   (first/last name, email, password, CGU checkbox)
├── app/auth/callback/route.ts       exchanges email-confirmation code for a session
└── middleware.ts                    refreshes Supabase session cookie, gates protected routes
```

UI primitives live in `components/ui/` (`Button`, `Input`, `Checkbox`,
`Dialog`, `Field`). They are thin wrappers over the component classes defined
in `app/globals.css` (`.btn`, `.input`, `.panel`, …).

---

## 3. State management — Zustand, single store (`lib/store.ts`)

Server state (rows) and view state (selection, camera intents) share one
store; Supabase is the source of truth and the store is a write-through cache.

```
locations: LocationRow[]                 all pins for the signed-in user
selectedLocationId: string | null        drives LocationPanel + marker highlight
flyTo: { lat, lon, distance?, key } | null   camera intent; `key` increments so
                                             repeated fly-to on the same coords retriggers
pendingPin: { lat, lon, suggestedName } | null   opens AddLocationDialog
mediaByLocation: Record<locationId, MediaItem[]> MediaRow + short-lived signedUrl
```

Rules:

- **Components never call Supabase directly.** All I/O goes through
  `lib/data/locations.ts`, `lib/data/media.ts`, `lib/auth.ts`; results are
  pushed into the store by the calling component.
- **R3F reads state transiently** where per-frame: `CameraRig` subscribes to
  `flyTo` via selector and runs its tween inside `useFrame` with local refs —
  no React re-render per frame.
- Optimistic updates only for deletes; inserts wait for the DB row (we need
  server-generated ids and trigger validation, e.g. the 15-media cap).

## 4. Supabase interaction patterns

- **Browser**: `lib/supabase/client.ts` — lazily-created singleton
  `createBrowserClient<Database>()`. Lazy so `next build` succeeds without env.
- **Server (RSC / route handlers)**: `lib/supabase/server.ts` — per-request
  `createServerClient<Database>()` bound to `cookies()`.
- **Middleware**: `lib/supabase/middleware.ts` implements the canonical
  `updateSession` pattern (refresh JWT, rewrite cookies on request AND
  response). `middleware.ts` then redirects unauthenticated users to `/login`
  for every route except `/login`, `/signup`, `/auth/*`.
  If env vars are absent (e.g. CI build), middleware becomes a no-op and the
  UI shows a "SUPABASE NOT CONFIGURED" banner instead of crashing.
- **Auth**: `signUp` carries `first_name`, `last_name`, `cgu_accepted` in
  `raw_user_meta_data`; a `SECURITY DEFINER` trigger (`handle_new_user`)
  materializes the `profiles` row server-side. CGU acceptance is validated
  client-side (checkbox required) **and** server-side (trigger rejects
  signups without `cgu_accepted: true`).
- **Storage**: private bucket `media`. Object path is
  `{user_id}/{location_id}/{uuid}.{ext}` — the first path segment must equal
  `auth.uid()` per storage RLS. Reads use signed URLs (1 h TTL) fetched in
  batch per location and cached in the store.
- Session persistence relies on `@supabase/ssr` cookie storage; JWT
  verification happens in Postgres via `auth.uid()` inside every RLS policy —
  the client is never trusted.

## 5. 3D mathematics & camera mechanics

**Coordinate mapping** (`lib/geo.ts`) — three.js is Y-up; we place the north
pole on +Y, (lat 0, lon 0) on +Z, longitude increasing eastward:

```
φ = lat·π/180,  λ = lon·π/180
x = R · cos φ · sin λ
y = R · sin φ
z = R · cos φ · cos λ
```

with exact inverse `vector3ToLatLon` (used when the user clicks the globe:
raycast hit point → lat/lon → pendingPin). `GLOBE_RADIUS = 1`; markers sit at
`R + MARKER_ALTITUDE` to avoid z-fighting.

**Fly-to tween** (`CameraRig`): on a new `flyTo.key`, capture the camera's
current direction `d0 = normalize(cameraPos)` and radius `r0`; compute target
direction `d1` from lat/lon and target radius `r1`. Each frame with
`t = easeInOutCubic(elapsed / DURATION)`:

```
dir    = slerp(d0, d1, t)        // great-circle path, no gimbal issues
radius = r0 + (r1 − r0) · t
camera.position = dir · radius   // OrbitControls target stays at origin
```

OrbitControls is disabled during the tween and re-enabled at t = 1. User
input (pointerdown) cancels an in-flight tween — the user always wins.

**Render performance**:

- Marker geometry + materials are **module-level singletons** shared by every
  marker mesh; per-marker highlight is done by swapping between two shared
  materials, never by cloning.
- Country outlines and graticule are each a single `LineSegments` with one
  pre-computed `BufferGeometry` (built once in `useMemo` from the static
  asset; disposed on unmount).
- `<Canvas dpr={[1, 2]}>`, antialias on, shadows off, no postprocessing.
- Raycasting for globe clicks targets only the picking sphere mesh, and a
  click is ignored when the pointer moved > a few px (drag vs. click).

## 6. Media optimization pipeline (`lib/media/`)

**Images** (`image.ts`): `browser-image-compression` →
WebP, `maxSizeMB: 2`, `maxWidthOrHeight: 2560`, web-worker on. Output is
re-checked ≤ 2 MB or the upload is refused. Uploaded as
`image/webp` with a `.webp` extension.

**Videos** (`video.ts`):
1. Container check: `video/mp4` or `video/webm` only.
2. Metadata probe via a detached `<video>` element: duration must be ≤ 15 s.
3. Bitrate guard: if the file exceeds `MAX_VIDEO_BYTES` (24 MB ≈ 12.8 Mbps
   at 15 s), attempt a **lightweight re-encode**: draw to canvas +
   `captureStream()` + `MediaRecorder` (WebM/VP9→VP8 fallback,
   2.5 Mbps video / 96 kbps audio). If unsupported or still too large, refuse
   with an explicit brutalist error. No FFmpeg.wasm — keeps bundle light.

**Caps** — client prechecks, server enforces: 15 media per location via a
`BEFORE INSERT` trigger with a row lock (see `DB_SCHEMA.md`); Storage bucket
also carries a per-file size limit and MIME allow-list.

## 7. Directory map

```
app/            routes (page/layout/route handlers) + globals.css
components/     GlobeApp + globe/ hud/ panels/ media/ auth/ ui/
lib/            constants, types, geo, store, geocode, auth
lib/supabase/   client / server / middleware factories
lib/data/       typed data-access (locations, media)
lib/media/      image + video optimization pipeline
supabase/       migrations/0001_init.sql (schema + RLS + triggers + storage)
scripts/        build-world-data.mjs (one-shot asset generation)
public/data/    world-lines.json (pre-baked country outlines)
```

## 8. Design system — brutalism

- Strict monochrome: `#050505 / #0d0d0d / #262626 / #737373 / #ededed`.
  Emphasis by **inversion** (white block, black text), never by color.
- `border-radius: 0` enforced globally (`* { border-radius: 0 !important }`).
- Monospace-first type stack, uppercase micro-labels with wide tracking.
- 1px/2px solid borders, hard edges, no shadows-as-decoration; offset
  hard shadow (`4px 4px 0 0`) only to lift dialogs.
