# Project Brief: Body Fat / Weight Loss Tracking App

## Project Overview

A web-based application designed to help users lose body fat by aggregating data from existing tracking tools — MyFitnessPal (nutrition) and Weight Gurus (body composition) — and transforming that data into personalized insight, trend analysis, and motivational feedback. The app is not a replacement for logging tools; it is an intelligence and visualization layer that sits on top of them.

## Objectives

1. **Make tracking effortless and consistent.** Since data entry happens in external apps, the focus here is on seamless CSV/export import, automatic data validation, and a frictionless upload experience that takes under 10 seconds.

2. **Deliver personalized, actionable insight.** Go beyond raw numbers and charts. Surface trend analysis, calorie-weight correlations, TDEE estimates derived from real data, and weekly summary reports that answer "is what I'm doing actually working?"

3. **Sustain motivation through visible progress and accountability.** Smooth out daily noise with trend lines, celebrate milestones, track streaks, and present the long-term journey in a way that keeps users engaged through plateaus.

## Target Audience

Intermediate fitness trackers who are already logging food and body weight consistently but are not getting enough insight from their existing tools. These users are comfortable with data, understand that daily weight fluctuates, and want trend-based intelligence rather than day-to-day numbers. They are self-directed and motivated but need a coach-like analytical layer to stay on track during the long middle stretch of a fat loss journey.

## Data Sources

- **Nutrition data:** MyFitnessPal — exported logs (CSV) processed by the app
- **Body composition data:** Weight Gurus — daily CSV export containing weight and body fat percentage measurements

## App Sections

### 1. Dashboard
The home screen providing a single-glance summary: today's weight/body fat reading, calorie status from the latest MFP import, trend direction (up/down/flat), and progress toward the user's goal.

### 2. Body Composition Trends
Smoothed trend lines (7-day moving average, adjustable) for weight and body fat percentage over selectable time ranges (7 days, 30 days, 90 days, all-time). Includes rate-of-loss calculations and projected goal completion dates.

### 3. Nutrition Overview
Processes MFP export data to show calorie and macro trends over time. Focuses on weekly averages and week-over-week changes rather than individual daily logs, and correlates intake patterns with weight trend data.

### 4. Progress & Milestones
Dedicated motivation section featuring milestone tracking (auto-detected and user-defined), a visual progress timeline, streak counters for data import consistency, and a personal records board (lowest weight, lowest body fat %, best weekly average, longest streak).

### 5. Data Import
Drag-and-drop upload area for Weight Gurus CSVs and MFP exports. Includes auto-detection of file format, data validation, duplicate/gap detection, import history log, and confirmation summaries.

### 6. Settings & Goals
User configuration for target weight, target body fat percentage, preferred rate of loss, units (lbs/kg), and date format preferences.

## Features & Functionality

### Objective 1 — Effortless, Consistent Tracking
- CSV Import & Sync: drag-and-drop upload with auto-detection, validation, and confirmation
- Import History & Data Health: log of imports, record counts, gap detection, and gentle nudges for stale data
- Daily Snapshot: auto-assembled "today" card combining latest weight/body fat and nutrition data

### Objective 2 — Personalized, Actionable Insight
- Smoothed Trend Lines: moving average filters (7-day default) for weight and body fat
- Rate-of-Loss Calculator: weekly rate of loss with dynamic goal completion projection
- Calorie-Weight Correlation: weekly average calorie intake plotted against weight trend
- Weekly Summary Report: automated digest covering averages, trends, macros, and a key insight
- Deficit Estimator: TDEE estimation derived from actual intake and weight change data over time

### Objective 3 — Sustained Motivation & Visible Progress
- Milestone Tracker: auto-detected and user-defined milestones with celebration moments
- Progress Timeline: visual journey view from start to present with key milestones marked
- Streak Counter: consecutive days with weight and nutrition data imported
- Personal Records Board: lowest weight, lowest body fat %, best weekly average, longest streak

## Tech Stack

| Layer        | Technology                  | Notes                                      |
|--------------|-----------------------------|--------------------------------------------|
| Framework    | Next.js + React             | Hosted on Vercel (free tier)               |
| UI Library   | MUI (Material UI)           | Material Design components, built-in dark mode |
| Database     | Supabase (PostgreSQL)       | Free tier — 500MB storage, REST API, JS client |
| Hosting      | Vercel                      | Free tier, zero-config Next.js deployment  |
| Font         | Inter (Google Fonts)        | Weights: 400, 500, 700                     |

## Design System

### Light Theme
| Role       | Color   | Hex       |
|------------|---------|-----------|
| Primary    | Deep Teal    | `#0D9488` |
| Secondary  | Slate Blue-Gray | `#475569` |
| Accent     | Amber        | `#F59E0B` |
| Background | Off-White    | `#F8FAFC` |
| Cards      | White        | `#FFFFFF` |
| Borders    | Light Gray   | `#E2E8F0` |

### Dark Theme
| Role       | Color   | Hex       |
|------------|---------|-----------|
| Primary    | Light Teal   | `#2DD4BF` |
| Secondary  | Cool Gray    | `#94A3B8` |
| Accent     | Light Amber  | `#FBBF24` |
| Background | Deep Navy    | `#0F172A` |
| Cards      | Dark Slate   | `#1E293B` |
| Borders    | Medium Slate | `#334155` |

## Development Approach

- The initial test user is the developer (Michael)
- Single-user app — no authentication or login required during development
- Start with core functionality (data import, dashboard, trends) before building motivation features
- Keep the app focused — no meal planning, exercise tracking, or social features
- Prioritize the analytical layer that MFP and Weight Gurus do not provide
- Weekly Summary Report is a dedicated page (not a modal or card)
- All sections should include "no data yet" empty states with onboarding prompts guiding the user to import data
