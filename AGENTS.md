# AGENTS.md

## Project Context

Fitness Gram app for Trường Việt Anh. Originally built on Base44; the backend now runs on **Supabase** and the app is deployed with Docker on **Coolify**. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions (UI text and comments are in Vietnamese).

Start with `README.md` for local setup and `DEPLOY.md` for deployment.

## Key Files

- `src/`: frontend application source (React + Vite + Tailwind).
- `src/api/base44Client.js`: compatibility layer that keeps the old `base44.entities / auth / rpc` API but calls Supabase. Pages use this; prefer extending it over calling Supabase directly from pages.
- `src/api/entities.js`: entity name → Supabase table mapping and list/filter/create/update helpers.
- `supabase/migrations/`: database schema, RLS policies and the public RPCs used by parents (`lookup_students`, `get_student`, `student_bundle`).
- `src/lib/importFitnessExcel.js` + `scripts/import-excel.mjs`: Excel import (browser and local CLI).
- `base44/`: legacy Base44 entity/function definitions, no longer used at runtime.
- `.env.local`: local-only environment values; never commit secrets. Never put the Supabase `service_role` key in frontend env vars.

## Access Model

- Parents do not log in. They can only call the three RPCs above; direct table access is blocked by RLS.
- Staff log in with Supabase Auth; `profiles.role = 'admin'` grants read/write on all tables.

## Working Notes

- Run locally with `npm run dev` (needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`).
- Run `npm run lint` and `npm run build` before finishing code changes.
- Schema changes go in a new numbered file under `supabase/migrations/`.
