# TASKS — traveltheworld

Strict build checklist. A task is checked only when the code exists, compiles
(`tsc --noEmit` + `next build`), and matches `ARCHITECTURE.md` / `DB_SCHEMA.md`.

## Phase 0 — Workspace & documentation
- [x] `ARCHITECTURE.md` — hierarchy, state strategy, Supabase patterns, 3D math
- [x] `DB_SCHEMA.md` — SQL, RLS, triggers, storage policies
- [x] `TASKS.md` — this checklist

## Phase 1 — Project scaffold
- [x] Next.js 15 + TypeScript + Tailwind 4 skeleton (App Router, `@/*` alias)
- [x] Brutalist design system in `globals.css` (monochrome tokens, `border-radius: 0` global, `.btn`/`.input`/`.panel` classes)
- [x] `lib/constants.ts`, `lib/types.ts` (typed `Database`), `.env.example`, README
- [x] Pre-baked country outline asset (`scripts/build-world-data.mjs` → `public/data/world-lines.json`)

## Phase 2 — Backend integration (Supabase)
- [x] `supabase/migrations/0001_init.sql` — tables, enum, RLS, `handle_new_user`, `enforce_media_limit`, storage bucket + policies
- [x] Supabase client factories: browser / server / middleware (env-guarded)
- [x] `middleware.ts` — session refresh + route protection
- [x] Auth UI: `/signup` (first/last name, email, password, CGU checkbox), `/login`, logout, `/auth/callback`
- [x] Data access layer: `lib/data/locations.ts`, `lib/data/media.ts` (signed URLs)

## Phase 3 — 3D globe & interaction
- [x] `lib/geo.ts` — lat/lon ⇄ Vector3 (Y-up, R=1) with tests-by-construction (inverse consistency)
- [x] `GlobeScene` canvas (dpr [1,2], no shadows) + `Earth` (sphere, graticule, country LineSegments from static asset)
- [x] `Markers` — shared geometry/material, selected-state inversion, click → select + fly-to
- [x] `CameraRig` — OrbitControls + slerp/eased fly-to tween, cancel on user input
- [x] Globe click raycast → lat/lon → `pendingPin` → AddLocationDialog
- [x] `SearchBar` — Nominatim forward geocoding → fly-to + pendingPin

## Phase 4 — Media pipeline & UI integration
- [x] `lib/media/image.ts` — WebP compression ≤ 2 MB (browser-image-compression)
- [x] `lib/media/video.ts` — mp4/webm check, ≤ 15 s metadata probe, MediaRecorder re-encode fallback, ≤ 25 MB
- [x] `Uploader` — pipeline → Storage upload → `media` row; 15-item cap UX
- [x] `MediaGrid` / `MediaTile` — signed URL rendering (img/video), delete (storage + row)
- [x] `LocationPanel` — pin details, media, delete location
- [x] `GlobeApp` shell + `TopBar` (brand, search, user, logout) + not-configured banner

## Phase 5 — Verification
- [x] `tsc --noEmit` clean
- [x] `next build` clean
- [~] Adversarial multi-lens review harness authored & run (finder + 2-skeptic verify); build/typecheck/visual all green
- [x] Visual smoke check of `/` and `/login` (globe renders, brutalist styling holds)
