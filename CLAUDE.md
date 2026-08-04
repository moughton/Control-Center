# Control Center — CLAUDE.md

Quick-capture companion PWA for the personal life-management "control center" (the Obsidian vault at `robo-documents`). Built specifically for **fast, frequent, multi-times-a-day logging** — the thing Obsidian on mobile is bad at. Obsidian remains the primary home for everything else; this app is a disposable intake tray, not a parallel vault.

## Stack

- Vite + React 19 + TypeScript, installed as a PWA (Add to Home Screen) on phone/laptop — no native builds, no app-store distribution.
- Backend: Supabase (Postgres) project `control-center` (`ivdkdvtmkmpnbfandmbc`, ca-central-1, free tier). RLS is **on** but currently permissive ("allow all, v1, no auth yet") — this is explicitly not production-secure and is deferred to a future auth facet, not something to treat as done.
- Hosted on GitHub Pages (`https://moughton.github.io/Control-Center/`) via `.github/workflows/deploy.yml`. Deploys on push to `main`. Vite `base` is `/Control-Center/` — the PWA manifest `start_url`/`scope` must stay aligned with that subpath.
- Navigation between facets is a lightweight hash router in `App.tsx` (`#gtg`, `#analytics`, `#health`, `#golf`, `#tasks` / default) with a fixed bottom tab bar — deliberately not a full router library, and deliberately hash-based (not path-based) so it works cleanly as a static GitHub Pages site with no server-side rewrite rules.

## Commands

```bash
npm run dev      # local dev server
npm run build    # tsc -b && vite build — run this before considering any change done
npm run lint     # oxlint
npx tsc --noEmit # fast type-check without a full build
```

Supabase CLI (`npx supabase`) is linked to project `ivdkdvtmkmpnbfandmbc`. DDL migrations and queries can be executed via `npx supabase db query --linked -f <script.sql>`. `.env` holds `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` and is gitignored; never commit it.

## Active Facets

Each facet is a self-contained top-level component (`RecurringTasks.tsx`, `Gtg.tsx`, `Analytics.tsx`, `Health.tsx`, `Golf.tsx`) wired into `App.tsx`'s tab bar.

- **Recurring Tasks** (`RecurringTasks.tsx`) — interval-based recurring tasks (categories with colors, due-date tracking, completion history, soft delete).
- **GTG (Grease the Groove)** (`Gtg.tsx`) — daily micro-workout rep logging (push-ups, pull-ups, etc.) with Stephen Few Bullet Charts, mandatory daily targets, target history (`gtg_target_history`), visual 7-day date ribbon, and quick reps up to 100.
- **Analytics** (`Analytics.tsx`) — consolidated multi-facet dashboard with time-window filtering (`7d`, `30d`, `ytd`, `all`), GTG volume breakdowns, category task completion stats, active streaks, and a unified activity feed.
- **Health & Wearables** (`Health.tsx`) — unified health recovery facet containing internal sub-tab navigation (`Overview`, `Garmin`, `Eight Sleep`, `Renpho Scale`).
- **Golf Performance & Live Scorecard** (`Golf.tsx`) — dedicated golf facet featuring:
  - 🏆 **Rounds & Interactive Satellite Shot Maps** ([`src/components/GolfShotMap.tsx`](file:///C:/_git/Control-Center/src/components/GolfShotMap.tsx)): Interactive Leaflet + Esri World Imagery Satellite tiles. Automatically calculates `fitBounds()` so 100% of shots on the hole are visible.
  - 🎯 **Clickable Shot List**: Clicking any shot in the log below the map focuses, zooms, and opens an info popup for that exact shot's GPS location.
  - ⛳ **Live On-Course Scorecard**: 1-tap fast score logging, hole-by-hole par/score/putts, Fairway/GIR results, intended vs actual shot shape, strike impact location, and **📍 GPS Shot Location Tagging**.
  - 📈 **3-Hole Match Play Engine (Nassau Chunks)**: Evaluates 3-hole blocks (Under par = Win 🟢, Even = Tie 🟡, Over par = Loss 🔴) with match record tracking (e.g. `5W - 0L - 1T`).

Candidate future facets discussed: meal logging (macros, prep instructions, time-of-day), hypertrophy training log, kettlebell training log, a lightweight read-only Supabase table browser.

## Database Tables & Seed

- `golf_rounds` (`id` uuid primary key, `course_name`, `played_at`, `total_score`, `total_par`, `score_to_par`, `fairways_hit`, `gir_count`, `total_putts`, `longest_drive_yds`, `segment_record`).
- `golf_round_holes` (`id` uuid primary key, `round_id`, `hole_number`, `par`, `score`, `putts`, `fairway_result`, `gir`, `segment_index`).
- `golf_shots` (`id` uuid primary key, `round_id`, `hole_number`, `shot_number`, `club_used`, `distance_yds`, `intended_shape`, `actual_shape`, `impact_location`, `latitude`, `longitude`).
- `renpho_scale_logs` (`logged_at` timestamp primary key, `weight_lbs`, `body_fat_pct`, `muscle_mass_lbs`, `water_pct`, `bmi`, `visceral_fat`, `bone_mass_lbs`).
- `garmin_activities` (`id` uuid primary key, `activity_type`, `activity_name`, `start_time`, `duration_seconds`, `calories`, `avg_hr`, `max_hr`, `distance_meters`, `notes`).
- `eight_sleep_logs` (`sleep_date` date unique, `sleep_score`, `light_sleep_seconds`, `deep_sleep_seconds`, `rem_sleep_seconds`, `awake_seconds`, `toss_and_turns`, `avg_respiratory_rate`).
- `health_daily_metrics` (`logged_at` date primary key, `steps`, `resting_hr`, `sleep_seconds`, `sleep_score`, `active_calories`, `hrv_avg`).

## Automated Ingestion Pipeline (Option B)

- **Python Sync Script**: `scripts/sync_health_data.py` uses `garminconnect` and Supabase REST API.
- **GitHub Actions Workflow**: `.github/workflows/health_sync.yml` runs a daily automated cron job at 06:00 UTC. Requires repository secrets `GARMIN_EMAIL` and `GARMIN_PASSWORD`.

## Conventions established in this codebase

- **Local-date handling**: never use `toISOString().slice(0,10)` for date-only values — that's UTC and drifts the date by ±1 near local midnight depending on timezone. Use the shared helpers in `src/lib/dates.ts` (`todayLocalISO`, `addDaysLocalISO`, `daysFromToday`, `formatDateLong`, `formatDateShort`, `getMondayLocalISO`) instead.
- **No native browser dialogs** (`window.confirm`/`alert`/`prompt`) anywhere in app code.
- **Date inputs**: always wire `onClick={openDatePicker}` (calls `.showPicker()`) on `<input type="date">`.
- **Optimistic updates**: mutating actions update local state immediately for instant feel, then re-fetch from Supabase to reconcile.
- **Modals**: shared `.modal-backdrop`/`.modal-card` CSS classes in `App.css`.
- **Mandatory categories & targets**: `recurring_tasks.category_id` is `NOT NULL`. `gtg_exercises.daily_target` is `NOT NULL` (min 1).
- **Imperial Units**: Weight & body composition in **lbs** (pounds) across Renpho scale facet and types.
- **Colors & Theme**: `src/lib/colors.ts` fixed 12-swatch palette. `src/lib/theme.ts` + `data-theme` attribute on `<html>` for Auto/Light/Dark mode.

## Testing practice

For any UI change, run `npx tsc --noEmit` and `npm run build`. Actually drive it in a real browser against dev server (`npm run dev` at `localhost:5173`) before calling it done.
