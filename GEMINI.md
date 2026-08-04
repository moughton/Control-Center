# Control Center — GEMINI.md

**Read `CLAUDE.md` in this repo root first.** It has the full project context: stack, commands, facet architecture, and the conventions established so far (local-date handling, no native dialogs, optimistic updates, modal patterns, theme system, testing practice). Everything there applies regardless of which agent/CLI is doing the work — it's not Claude-specific, just named for the tool that wrote it.

This file only adds what changes moment-to-moment: what's currently in progress and not yet committed.

## Branch: `gemini`

### GTG Stats, Bullet Graphs & Target History (Completed)
- **Mandatory Daily Target**: Enforced `daily_target` as mandatory (`NOT NULL`, min 1) when creating or managing exercises.
- **Stephen Few Bullet Graph**: Replaced basic progress bar with a 3-band qualitative Bullet Graph (`BulletChart`) displaying actual reps vs vertical target marker line on exercise cards & detail modal.
- **Target History Table & Engine** ([`supabase_gtg_targets_schema.sql`](file:///C:/_git/Control-Center/supabase_gtg_targets_schema.sql)): Created `gtg_target_history` table live in Supabase. Evaluates daily targets dynamically over time (`getTargetForDate`) so historical streaks and progress accurately retain target changes.
- **Target History Manager**: Detail modal allows updating target and effective date, displaying a chronological history of past targets.
- **Extended Quick Reps**: Quick-select rep choices extended up to 100 (`[5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100]`).
- **Visual Date Ribbon & Past-Date Logging**: Interactive 7-day visual date strip with calendar date picker, previous/next day stepping, and past-date rep logging. Restricted from navigating into future dates, with Today pinned as a permanent option.

### Consolidated Analytics Dashboard (Completed)
- **Analytics Facet** ([`src/Analytics.tsx`](file:///C:/_git/Control-Center/src/Analytics.tsx)): Built multi-facet analytics dashboard wired into `#analytics` tab in [`src/App.tsx`](file:///C:/_git/Control-Center/src/App.tsx).
- **Time Window Filters**: `7 Days`, `30 Days`, `Year to Date`, `All Time`.
- **Top KPI Cards**: GTG Total Reps, Task Completion Count, Active Target Streaks.
- **Volume & Task Breakdowns**: Rep distribution per exercise and completions per category (styled with category color swatches).
- **Unified Activity Feed**: Chronological list of recent GTG workout logs and task completions.

### Dedicated Golf Facet & Live On-Course Scorecard (Completed & Live)
- **Golf Facet** ([`src/Golf.tsx`](file:///C:/_git/Control-Center/src/Golf.tsx)): Dedicated golf facet wired into `#golf` tab in [`src/App.tsx`](file:///C:/_git/Control-Center/src/App.tsx).
- **Rounds & Shot Maps**: Displays Garmin round logs, scorecards, 3-hole match segment records, and shot breakdown logs.
- **3-Hole Match Play Engine (Nassau Chunks)**: Evaluates 3-hole blocks (Under par = Win 🟢, Even = Tie 🟡, Over par = Loss 🔴) with match record tracking (e.g. `4W - 1L - 1T`).
- **Live On-Course Scorecard**: 1-tap fast score logging, hole-by-hole par/score/putts, Fairway/GIR results, intended vs actual shot shape, strike impact location, and **📍 GPS Shot Location Tagging** via `navigator.geolocation`.
- **Database Tables Executed**: Created `golf_rounds`, `golf_round_holes`, and `golf_shots` live on Supabase project `ivdkdvtmkmpnbfandmbc`.

### Status
- Branch `gemini` checked out.
- Type check (`npx tsc --noEmit`) passes cleanly.
- Build (`npm run build`) succeeds cleanly.
