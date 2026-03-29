# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: Next.js 16 Breaking Changes

This project uses **Next.js 16.2.1** which has breaking changes from prior versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (especially `01-app/` for App Router). Do not rely on training data for Next.js APIs — check the docs first.

## Build & Development Commands

```bash
# Dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Run production server
npm start

# Lint
npm run lint

# TypeScript type check (no emit)
node node_modules/typescript/lib/tsc.js --noEmit
```

**Note:** npm scripts use `node node_modules/next/dist/bin/next ...` directly because node_modules/.bin wrappers are broken on this machine (Node.js v24). Use the npm scripts as-is.

## Tech Stack

- **Framework:** Next.js 16.2.1 (App Router), React 19.2.4, TypeScript 5.9.3 (strict)
- **UI:** Material UI 7 + Emotion, Inter font, Recharts for charts
- **Database:** Supabase (PostgreSQL) — client-side REST only, no API routes
- **Data:** PapaParse (CSV parsing), date-fns (date utilities)
- **Deployment:** Vercel

## Architecture Overview

### Page Pattern

All pages are client components with force-dynamic rendering (no SSG — data is per-user). Every page follows this pattern:

```tsx
'use client';
export const dynamic = 'force-dynamic';
// useEffect → fetch data → loading/error/render states
```

### Data Layer

- **`src/lib/supabase.ts`** — Singleton Supabase client, lazy-initialized from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- **`src/lib/database.ts`** — All CRUD operations. `get*` functions with optional date filters, `upsert*` for idempotent inserts (unique date constraint)
- No API routes — pages query Supabase directly via the client

### Import Pipeline

CSV files (Weight Gurus body composition, MyFitnessPal nutrition) are parsed by `src/lib/parsers/`, returning `{ records, errors }` for partial success. `src/lib/importProcessor.ts` deduplicates against existing dates and upserts.

### Analytics

Pure functions in `src/lib/analytics/` — accept typed data arrays, return computed results. Includes: moving averages, rate of loss, goal projection, weekly nutrition aggregation, TDEE estimation, milestone detection, streaks, weekly reports.

### Theme

MUI theme in `src/styles/theme.ts` (teal primary, slate secondary, amber accent). `ThemeRegistry` component provides dark/light mode toggle persisted to localStorage.

### Navigation

`AppNav` component: permanent side drawer on desktop (240px), temporary drawer on mobile. Pages: Dashboard, Trends, Nutrition, Weekly Report, Progress, Import, Settings.

## Database Schema

5 Supabase tables — schema SQL in `src/lib/migrations/001_initial_schema.sql`:
- **weight_logs** — date (unique), weight, body_fat_pct
- **nutrition_logs** — date (unique), calories, protein_g, carbs_g, fat_g
- **import_history** — source ('weight_gurus'|'mfp'), file_name, records_added/skipped
- **user_settings** — target_weight, target_body_fat, weekly_loss_rate, unit_system
- **milestones** — title, type ('auto'|'custom'), achieved, achieved_at

## Key Types

All in `src/types/index.ts`: `WeightLog`, `NutritionLog`, `ImportHistory`, `UserSettings`, `Milestone`, `TimeRange` ('7d'|'30d'|'90d'|'all'), `MovingAverageWindow` (7|14|21).

## Conventions

- All dates as ISO strings: `YYYY-MM-DD`
- Always use `@/*` path alias (maps to `./src/*`), never relative `../`
- Use date-fns for date math, avoid native `Date` constructors
- Arrow functions for components
- MUI components for all UI — no custom CSS
- ESLint flat config format (ESLint 9+)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://fydcfuqwntjhbglijroo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Related Docs

- **Project-Brief.md** — Full feature specs and design system
- **Claude-Code-Guide.md** — Sequential development phases
