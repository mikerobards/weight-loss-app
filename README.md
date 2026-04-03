# WeightIQ

A web app that imports MyFitnessPal and Weight Gurus CSV exports and turns them into an intelligence and visualization layer for weight loss and body fat tracking. It surfaces trend analysis, calorie-weight correlations, TDEE estimates, and weekly reports — the analytical layer that MFP and Weight Gurus don't provide.

## Features

- **Dashboard** — Today's weight/body fat, calorie status, trend direction, goal progress, and a 14-day chart
- **Body Composition Trends** — Smoothed trend lines (7/14/21-day moving average) for weight and body fat over selectable time ranges, rate-of-loss calculations, and projected goal completion dates
- **Nutrition Overview** — Weekly calorie and macro averages from MFP data, week-over-week changes, and TDEE estimation from observed intake vs. weight change
- **Weekly Report** — Automated digest with averages, trends, macros, and key insights
- **Progress & Milestones** — Auto-detected milestones (5-lb increments, 1% body fat drops), streak counters, and personal records
- **Data Import** — Drag-and-drop CSV upload with auto-detection of Weight Gurus vs. MFP format, validation, duplicate handling, and import history
- **Settings** — Target weight, target body fat, preferred rate of loss, unit system (imperial/metric)

## Tech Stack

| Layer     | Technology                           |
| --------- | ------------------------------------ |
| Framework | Next.js 16, React 19, TypeScript 5.9 |
| UI        | Material UI 7, Emotion, Recharts     |
| Database  | Supabase (PostgreSQL)                |
| Hosting   | Vercel                               |

## Getting Started

### Prerequisites

- Node.js 18.17+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

   ```bash
   git clone <repo-url>
   cd weight-loss-app
   npm install
   ```

2. Create `.env.local` with your Supabase credentials:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. Run the database migration in the Supabase SQL editor:
   - Open `src/lib/migrations/001_initial_schema.sql` and execute it in your Supabase project's SQL editor

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm start`     | Run production server    |
| `npm run lint`  | Run ESLint               |

## Project Structure

```text
src/
  app/            Pages (Dashboard, Import, Trends, Nutrition, Weekly Report, Progress, Settings)
  components/     AppNav, ThemeRegistry, EmptyState
  lib/
    database.ts   Supabase CRUD operations
    supabase.ts   Client singleton
    importProcessor.ts
    analytics/    trends, nutrition, milestones, weeklyReport
    parsers/      myFitnessPal, weightGurus CSV parsers
    migrations/   Database schema SQL
  styles/         MUI theme (light/dark)
  types/          TypeScript interfaces
```

## License

Private project — not licensed for distribution.
