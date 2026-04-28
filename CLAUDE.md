# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Is

**たまっぷ** is a real-time bus timetable web app for students at Hosei University's Tama Campus. It shows the next buses between the campus and the nearest stations (西八王子・めじろ台・相原), and estimates arrival times to each faculty building.

Deployed as static files on a shared hosting server (ロリポップ). Built as a PWA.

## Commands

```bash
npm run dev       # Start dev server (binds to 0.0.0.0:5173)
npm run build     # Type-check + build to dist/
npm run lint      # ESLint
npm run test      # Run all tests with vitest
npm run preview   # Preview production build
```

Run a single test file:
```bash
npx vitest run test/unit_test/timehandlers.test.ts
```

## Architecture

### Routing

`HashRouter` is used (not `BrowserRouter`) because the app is deployed on shared hosting without server-side URL rewriting. Routes are defined in `src/App.tsx`.

### Data Flow (Core Feature)

All bus/train data is static JSON bundled at build time:

- `src/utils/Timetable.json` — bus timetable entries, each with `day`, `station`, `isComingToHosei`, departure/arrival times, and `stList`
- `src/utils/Holidays.json` — Japanese public holidays (`YYYY-MM-DD` → holiday name); holidays are treated as Sunday schedule
- `src/utils/ekitan.json` — train departure data for nearby stations

`Timetable.json` is **lazy-loaded** in `home.tsx` (`import()`) to avoid blocking initial render. `Holidays.json` is imported synchronously.

The main logic lives in `src/utils/timeHandlers.ts`:
- `findNextBuses()` — core function; accepts `length` to get past (negative) or future (positive) buses; uses binary search on sorted timetable; automatically rolls over to the next day
- `findFutureTrains()` / `findPastTrains()` — train departures from nearby stations; future trains sorted ascending, past trains sorted descending (direct next past first)
- `isHoliday()` — adds 9 hs (JST offset) before checking against holiday data to ensure correct date in Japanese timezone
- `getNextDay()` / `getPreviousDay()` — day-of-week helpers that treat holidays as Sunday
- `binarySearch()` — generic binary search used internally

### State Management

User preferences (selected station + direction) are stored in `localStorage` and managed by the `useUserInput` hook (`src/utils/useUserInput.ts`). State is validated with Zod on read.

### Types and Zod Schemas

All JSON data shapes and user state are validated with Zod v4 (`zod/v4`). Schemas and derived types are defined in `src/utils/types.ts`. Import as `import * as z from "zod/v4"`.

Key exported types (prefer these over redeclaring inline):
- `Bus` — a timetable entry after `getDateAddedBus()` processing; includes `date: Date` on both the bus and each `stList` item
- `TrainWithDate` — an ekitan entry with `date: Date` appended; returned by `findFutureTrains` / `findPastTrains`
- `BusSchema` — Zod schema for `Bus` (derived via `timetableSchema.element.extend(...)`)

### UI Stack

- Tailwind CSS v4 (configured via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- shadcn/ui components in `src/components/ui/` (Radix UI primitives)
- `@base-ui/react` for Tabs component
- GSAP + `@gsap/react` for animations; use `useGSAP().contextSafe()` for animation callbacks inside components
- `next-themes` for dark/light mode via `ThemeProvider`

### Path Alias

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### Supabase

`src/lib/supabase.ts` exports a Supabase client. The anon key is committed directly (it's public-safe for anon access).

### Analytics

Google Analytics 4 is initialized in `src/App.tsx` with `react-ga4`. Page views are tracked via `TrackPageViews` component on every route change.

### Constants

`src/utils/constants.ts` exports:
- `buildings` — walk-time offsets in ms from bus arrival to each faculty building
- `majorStations` — bus stop names that trigger train connection display (renders `TrainSheet` instead of plain text)
- `stationNames` — English key → Japanese display name mapping

### Discount Pages

`src/pages/discount/` contains individual pages for partner store discounts (富士そば, ハイチーズ, 国照堂). These are separate routes reachable via `/discount`.
