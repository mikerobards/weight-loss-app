# Claude Code Development Guide: Body Fat / Weight Loss Tracking App

This document breaks the Project Brief into sequential development tasks for Claude Code. Each phase builds on the previous one. Complete all steps within a phase before moving to the next.

Reference the **Project-Brief.md** file for full details on design, features, and tech stack.

---

## Phase 1: Project Setup & Configuration

### Task 1.1 — Initialize the Next.js Project

- Create a new Next.js project with TypeScript enabled
- Configure the project for Vercel deployment
- Set up the project directory structure:

  ```text
  /src
    /app          — Next.js App Router pages and layouts
    /components   — Reusable React components
    /lib          — Utility functions, data processing, API helpers
    /hooks        — Custom React hooks
    /types        — TypeScript type definitions
    /styles       — Global styles and theme configuration
  ```

### Task 1.2 — Install Dependencies

- Install MUI (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
- Install Supabase client (`@supabase/supabase-js`)
- Install charting library (`recharts` — lightweight, React-native, works well with MUI)
- Install CSV parsing library (`papaparse`)
- Install date utility library (`date-fns`)
- Install Google Font: Inter (via `@fontsource/inter` or Next.js font optimization)

### Task 1.3 — Configure the MUI Theme

- Create a custom MUI theme file at `/src/styles/theme.ts`
- Define the light theme using the Project Brief color palette:
  - Primary: `#0D9488`, Secondary: `#475569`, Accent: `#F59E0B`
  - Background: `#F8FAFC`, Cards/Paper: `#FFFFFF`, Borders: `#E2E8F0`
- Define the dark theme:
  - Primary: `#2DD4BF`, Secondary: `#94A3B8`, Accent: `#FBBF24`
  - Background: `#0F172A`, Cards/Paper: `#1E293B`, Borders: `#334155`
- Set Inter as the default font family (weights 400, 500, 700)
- Implement a ThemeProvider with a toggle for light/dark mode, persisted via cookie or local state

### Task 1.4 — Set Up Supabase

- **Prerequisite:** The developer must create a free Supabase account at <https://supabase.com> and create a new project. This provides the URL and anon key needed below.
- No authentication or login is required — this is a single-user app during development
- Configure the Supabase client in `/src/lib/supabase.ts`
- Add environment variables to `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL=https://fydcfuqwntjhbglijroo.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=` (developer will add this manually)
- Add `.env.local` to `.gitignore`

---

## Phase 2: Database Schema & Data Layer

### Task 2.1 — Create Database Tables

Create the following tables in Supabase:

**`weight_logs`**

| Column       | Type        | Notes                          |
| ------------ | ----------- | ------------------------------ |
| id           | uuid (PK)   | Auto-generated                 |
| date         | date        | Unique — one entry per day     |
| weight       | decimal     | In user's preferred unit       |
| body_fat_pct | decimal     | Body fat percentage (nullable) |
| created_at   | timestamptz | Auto-generated                 |

**`nutrition_logs`**

| Column     | Type        | Notes                      |
| ---------- | ----------- | -------------------------- |
| id         | uuid (PK)   | Auto-generated             |
| date       | date        | Unique — one entry per day |
| calories   | integer     | Total daily calories       |
| protein_g  | decimal     | Grams of protein           |
| carbs_g    | decimal     | Grams of carbohydrates     |
| fat_g      | decimal     | Grams of fat               |
| created_at | timestamptz | Auto-generated             |

**`import_history`**

| Column          | Type        | Notes                         |
| --------------- | ----------- | ----------------------------- |
| id              | uuid (PK)   | Auto-generated                |
| source          | text        | "weight_gurus" or "mfp"       |
| file_name       | text        | Original file name            |
| records_added   | integer     | Number of new records         |
| records_skipped | integer     | Duplicates or invalid records |
| imported_at     | timestamptz | Auto-generated                |

**`user_settings`**

| Column           | Type        | Notes                      |
| ---------------- | ----------- | -------------------------- |
| id               | uuid (PK)   | Auto-generated             |
| target_weight    | decimal     | Goal weight                |
| target_body_fat  | decimal     | Goal body fat % (nullable) |
| weekly_loss_rate | decimal     | Preferred lbs/week         |
| unit_system      | text        | "imperial" or "metric"     |
| created_at       | timestamptz | Auto-generated             |
| updated_at       | timestamptz | Auto-updated               |

**`milestones`**

| Column      | Type        | Notes                       |
| ----------- | ----------- | --------------------------- |
| id          | uuid (PK)   | Auto-generated              |
| title       | text        | e.g., "First 5 lbs lost"    |
| type        | text        | "auto" or "custom"          |
| achieved    | boolean     | Default false               |
| achieved_at | date        | Nullable, set when achieved |
| created_at  | timestamptz | Auto-generated              |

### Task 2.2 — Build Data Access Functions

- Create `/src/lib/database.ts` with typed functions for all CRUD operations
- Include functions for:
  - Inserting and querying weight logs (with date range filters)
  - Inserting and querying nutrition logs (with date range filters)
  - Logging imports to import_history
  - Reading/updating user settings
  - Creating, reading, and updating milestones
- All functions should use the Supabase JS client and return typed results

---

## Phase 3: CSV Import & Data Processing

### Task 3.1 — Build CSV Parsers

- Create `/src/lib/parsers/weightGurus.ts`:
  - Parse Weight Gurus CSV format (detect column headers automatically)
  - Extract date, weight, and body fat percentage fields
  - Validate data types and flag invalid rows
  - Return structured array of `WeightLog` objects
- Create `/src/lib/parsers/myFitnessPal.ts`:
  - Parse MFP export format (detect column headers automatically)
  - Extract date, calories, protein, carbs, and fat fields
  - Validate data types and flag invalid rows
  - Return structured array of `NutritionLog` objects

### Task 3.2 — Build the Import Processing Pipeline

- Create `/src/lib/importProcessor.ts`:
  - Accept parsed data arrays
  - Check for duplicate dates against existing database records
  - Separate new records from duplicates
  - Batch insert new records into Supabase
  - Log the import to `import_history`
  - Return a summary: records added, records skipped, any errors

### Task 3.3 — Build the Data Import UI

- Create a Data Import page at `/src/app/import/page.tsx`
- Implement drag-and-drop file upload area (accept .csv files)
- Auto-detect whether the file is from Weight Gurus or MFP based on headers
- Show a preview table of parsed data before confirming import
- Display validation warnings (missing fields, suspicious values)
- Show import confirmation summary with record counts
- Include an import history table showing past imports

---

## Phase 4: Dashboard

### Task 4.1 — Build the Dashboard Layout

- Create the Dashboard page at `/src/app/page.tsx` (home route)
- Include a responsive layout with the following card components:
  - Daily Snapshot card (latest weight, body fat, calorie intake)
  - Trend Direction indicator (up/down/flat with arrow icon)
  - Goal Progress card (current vs. target, percentage complete)
  - Mini trend chart (last 14 days of weight data, sparkline style)
  - Data freshness indicator (last import date, nudge if stale)

### Task 4.2 — Build the App Shell & Navigation

- Create a persistent sidebar or top navigation with links to all seven sections:
  - Dashboard, Body Composition Trends, Nutrition Overview, Weekly Report, Progress & Milestones, Data Import, Settings
- Include a dark mode toggle in the navigation bar
- Use MUI's responsive drawer pattern (sidebar on desktop, hamburger menu on mobile)
- Highlight the active page in navigation

---

## Phase 5: Body Composition Trends

### Task 5.1 — Build Trend Calculation Utilities

- Create `/src/lib/analytics/trends.ts`:
  - Simple moving average function (configurable window: 7, 14, 21 days)
  - Rate-of-loss calculator (lbs or kg per week based on trend data)
  - Goal projection calculator (estimated date to reach target weight at current rate)
  - Data gap interpolation (handle missing days gracefully)

### Task 5.2 — Build the Trends Page

- Create the Body Composition Trends page at `/src/app/trends/page.tsx`
- Implement interactive charts using Recharts:
  - Weight trend line with raw data points and smoothed moving average overlay
  - Body fat percentage trend line (same treatment)
  - Time range selector (7 days, 30 days, 90 days, all-time)
  - Adjustable moving average window
- Display summary stats: current rate of loss, projected goal date, total lost to date

---

## Phase 6: Nutrition Overview

### Task 6.1 — Build Nutrition Analytics

- Create `/src/lib/analytics/nutrition.ts`:
  - Weekly average calorie calculation
  - Weekly average macro breakdown (protein, carbs, fat)
  - Week-over-week change calculations
  - Calorie-weight correlation: compare weekly avg calories to weekly avg weight change

### Task 6.2 — Build the Nutrition Page

- Create the Nutrition Overview page at `/src/app/nutrition/page.tsx`
- Implement charts:
  - Weekly average calorie trend line
  - Macro breakdown bar chart (stacked, by week)
  - Calorie vs. weight change correlation chart
- Display the Deficit Estimator: estimated TDEE based on actual intake and weight change data
- Include a weekly summary card with the latest week's key nutrition stats

---

## Phase 7: Progress & Milestones

### Task 7.1 — Build Milestone Logic

- Create `/src/lib/analytics/milestones.ts`:
  - Auto-detection functions for common milestones:
    - Weight loss thresholds (every 5 lbs)
    - Body fat percentage thresholds (every 1%)
    - Logging streaks (7, 14, 30, 60, 90 days)
  - Personal record detection (new lowest weight, new lowest body fat %)
  - Run milestone checks after each data import

### Task 7.2 — Build the Progress Page

- Create the Progress & Milestones page at `/src/app/progress/page.tsx`
- Implement:
  - Milestone list (achieved and upcoming) with celebration styling using the accent color
  - Progress timeline: visual journey from starting point to current with milestones marked
  - Streak counter display (current streak and longest streak)
  - Personal records board (card layout with trophy/medal icons)
- Allow users to add custom milestones

---

## Phase 8: Settings & Goals

### Task 8.1 — Build the Settings Page

- Create the Settings page at `/src/app/settings/page.tsx`
- Implement a form with:
  - Target weight input
  - Target body fat percentage input (optional)
  - Preferred weekly rate of loss selector (0.5, 1.0, 1.5, 2.0 lbs/week)
  - Unit system toggle (Imperial / Metric)
  - Dark mode preference (Light / Dark / System)
- Save settings to the `user_settings` table in Supabase
- Load existing settings on page mount

---

## Phase 9: Weekly Summary Report

### Task 9.1 — Build the Weekly Report Generator

- Create `/src/lib/analytics/weeklyReport.ts`:
  - Calculate the past 7 days' averages for weight, body fat, calories, and macros
  - Determine trend direction and rate of change
  - Compare to the previous 7-day period
  - Generate a single "key insight" string (e.g., "Your average intake dropped 200 cal/day and your trend is down 1.1 lbs")

### Task 9.2 — Build the Weekly Report Page

- Create the Weekly Report page at `/src/app/weekly-report/page.tsx`
- Display the current week's report with:
  - Average weight, body fat, calories, and macro breakdown
  - Comparison to previous week (with up/down indicators)
  - Trend direction and rate of change
  - Key insight card highlighted with accent color
- Include a week selector to browse past weekly reports
- Add navigation link to the app sidebar/nav

---

## Phase 10: Polish & Deployment

### Task 10.1 — Responsive Design Pass

- Test and refine all pages for mobile, tablet, and desktop breakpoints
- Ensure charts resize and remain readable on small screens
- Verify dark mode renders correctly across all components

### Task 10.2 — Error Handling & Edge Cases

- Handle empty states gracefully on every page — show a friendly "No data yet" message with a clear call-to-action directing the user to the Data Import page
- Add error boundaries for chart rendering failures
- Validate all form inputs with helpful error messages
- Handle CSV parsing errors with user-friendly feedback

### Task 10.3 — Performance Optimization

- Implement data fetching with appropriate caching (SWR or React Query)
- Lazy load chart components to reduce initial bundle size
- Optimize Supabase queries (add indexes on date columns)

### Task 10.4 — Deploy to Vercel

- Connect the GitHub repository to Vercel
- Configure environment variables in Vercel dashboard (Supabase URL and key)
- Run a production build and verify deployment
- Test all features on the live deployment

---

## Notes for Claude Code

- Always reference `Project-Brief.md` for design tokens, color values, and feature specifications
- Use TypeScript strictly — define types for all data structures in `/src/types/`
- Follow Next.js App Router conventions (not Pages Router)
- Keep components small and focused — one component per file
- Use MUI's `sx` prop for component-level styling and the theme for global tokens
- When building charts, use the primary color (`#0D9488` / `#2DD4BF`) for the main data series and the accent color (`#F59E0B` / `#FBBF24`) for highlights and annotations
- Test each phase before moving to the next — ensure data flows correctly from import through to visualization
