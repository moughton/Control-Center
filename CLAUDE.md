# Control Center — CLAUDE.md

Quick-capture companion PWA for the personal life-management "control center" (the Obsidian vault at `robo-documents`). Built specifically for **fast, frequent, multi-times-a-day logging** — the thing Obsidian on mobile is bad at. Obsidian remains the primary home for everything else; this app is a disposable intake tray, not a parallel vault.

## Stack

- Vite + React 19 + TypeScript, installed as a PWA (Add to Home Screen) on phone/laptop — no native builds, no app-store distribution.
- Backend: Supabase (Postgres) project `control-center` (`ivdkdvtmkmpnbfandmbc`, ca-central-1, free tier). RLS is **on** but currently permissive ("allow all, v1, no auth yet") — this is explicitly not production-secure and is deferred to a future auth facet, not something to treat as done.
- Hosted on GitHub Pages (`https://moughton.github.io/Control-Center/`) via `.github/workflows/deploy.yml`. Deploys on push to `main`. Vite `base` is `/Control-Center/` — the PWA manifest `start_url`/`scope` must stay aligned with that subpath.
- Navigation between facets is a lightweight hash router in `App.tsx` (`#gtg` etc.) with a fixed bottom tab bar — deliberately not a full router library, and deliberately hash-based (not path-based) so it works cleanly as a static GitHub Pages site with no server-side rewrite rules.

## Commands

```
npm run dev      # local dev server
npm run build     # tsc -b && vite build — run this before considering any change done
npm run lint      # oxlint
npx tsc --noEmit  # fast type-check without a full build
```

Supabase schema changes go through the Supabase MCP tools (`apply_migration` for DDL, `execute_sql` for one-off data fixes) — there is no local Supabase CLI/migrations folder in this repo. `.env` holds `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` and is gitignored; never commit it. The publishable key is safe for client exposure but still shouldn't hit git history as a matter of practice.

## Facets

Each facet is a self-contained top-level component (`RecurringTasks.tsx`, `Gtg.tsx`, ...) wired into `App.tsx`'s tab bar. A facet only gets built here if it solves a problem Obsidian is genuinely bad at (fast/frequent capture) — not to duplicate things Obsidian already does well.

- **Recurring Tasks** — interval-based recurring tasks (categories with colors, due-date tracking, completion history, soft delete). Originally built as a proof-of-concept before Obsidian's Tasks plugin was found to already cover this well; it has since grown into a fully-featured facet in its own right through iterative use.
- **GTG (Grease the Groove)** — daily micro-workout rep logging (push-ups, pull-ups, etc.) outside the core hypertrophy routine, with running daily totals, targets, streaks, and personal bests. This is the facet that most directly justifies the app's existence — logging a rep count multiple times a day is exactly what's painful in Obsidian on mobile.

Candidate future facets discussed but not yet started: meal logging (macros, prep instructions, time-of-day), hypertrophy training log, kettlebell training log, a consolidated analytics dashboard, a lightweight read-only Supabase table browser.

## Conventions established in this codebase

- **Local-date handling**: never use `toISOString().slice(0,10)` for date-only values — that's UTC and drifts the date by ±1 near local midnight depending on timezone. Use the shared helpers in `src/lib/dates.ts` (`todayLocalISO`, `addDaysLocalISO`, `daysFromToday`, `formatDateLong`) instead. This bit us once already (a task created "due today" rendered as "due tomorrow").
- **No native browser dialogs** (`window.confirm`/`alert`/`prompt`) anywhere in app code — they block Claude-in-Chrome browser-automation testing sessions, and they're worse mobile UX anyway. Destructive actions (delete task, delete category) use an inline two-step "Delete → Confirm delete / Cancel" pattern instead. See `CategoryRow`/`TaskDetailModal` in `RecurringTasks.tsx` for the pattern.
- **Date inputs**: always wire `onClick={openDatePicker}` (calls `.showPicker()`) on `<input type="date">` — otherwise only the tiny native icon opens the calendar, not the whole field, which is a bad mobile tap target.
- **Optimistic updates**: mutating actions (mark done, log reps) update local state immediately for instant feel, then re-fetch from Supabase to reconcile. See `markDone` in `RecurringTasks.tsx` / `logReps` in `Gtg.tsx`.
- **Modals**: shared `.modal-backdrop`/`.modal-card` CSS classes in `App.css`, backdrop-click-to-close with `e.stopPropagation()` on the card. Reused across every facet rather than each one rolling its own.
- **Subtle data visualization only**: a small colored-dot "consistency sparkline" was tried and explicitly rejected by the user as ugly. Prefer minimal, muted, single-purpose indicators (e.g. the thin green/yellow/red "burndown" progress bar on task cards) over anything busy or multi-colored-dot-like. When in doubt, put richer stats in a detail modal rather than cluttering the compact list card.
- **Mandatory categories**: `recurring_tasks.category_id` is `NOT NULL` with a permanent "Uncategorized" fallback category — there is no "no category" state in the UI or data model.
- **Colors**: category colors are chosen from the fixed 12-swatch palette in `src/lib/colors.ts`, not a free color picker.
- **Theme**: `src/lib/theme.ts` + `data-theme` attribute on `<html>` gives a manual Auto/Light/Dark toggle that overrides `prefers-color-scheme` in both directions. Any new CSS color variable needs a value in all three places in `index.css` (base `:root`, the dark `@media` block, and both `:root[data-theme=...]` overrides).

## Testing practice

For any UI change, actually drive it in a real browser via Claude-in-Chrome (dev server on `localhost:5173`) before calling it done — click through the golden path, check the console for errors, verify Supabase state directly via the Supabase MCP tools when in doubt. Several real bugs (timezone drift, duplicate React keys, a stray test category) were only caught this way, not by type-checking alone.

## Sync with Obsidian

Not built yet. Planned design: capture stays fast in this app writing to Supabase; a future on-demand Claude Code skill (same pattern as `generate-meal-plan` in the `control-center` skills repo) reads from Supabase and writes into the vault. One-directional only (Supabase → Obsidian), not full bidirectional sync, to avoid conflict-resolution complexity neither side needs yet. The `updated_at` + auto-update-trigger pattern already on `recurring_tasks` exists to support a future "most-recent-write-wins" rule if that ever changes.
