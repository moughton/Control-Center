# Control Center — GEMINI.md

**Read `CLAUDE.md` in this repo root first.** It has the full project context: stack, commands, facet architecture, and the conventions established so far (local-date handling, no native dialogs, optimistic updates, modal patterns, theme system, testing practice). Everything there applies regardless of which agent/CLI is doing the work — it's not Claude-specific, just named for the tool that wrote it.

This file only adds what changes moment-to-moment: what's currently in progress and not yet committed.

## Handoff: GTG stats feature (in progress, uncommitted)

Building out target/streak/personal-best/trend features for the GTG (Grease the Groove) facet, per direct user request. Scope agreed with the user:

- Optional daily rep target per exercise
- A progress bar on each exercise card showing today's total against that target (subtle, single muted color — see the "no ugly dots" convention in `CLAUDE.md`, this replaced an earlier rejected design)
- Current streak + best-streak-ever (consecutive days the target was met)
- Personal best (highest single-day rep count, with the date)
- 7-day trend mini-sparkline (monochrome, in the detail modal — not on the compact card)
- Rolling volume: this-week and year-to-date totals
- A milestone toast: brief auto-dismissing banner on a new personal best or crossing a 1,000-lifetime-rep boundary per exercise

### Done so far
- DB migration applied: `gtg_exercises.daily_target` (nullable integer) — already live in Supabase project `ivdkdvtmkmpnbfandmbc`.
- `src/types.ts`: `GtgExercise.daily_target: number | null` added.
- `src/lib/dates.ts` created — extracted the local-date helpers (`todayLocalISO`, `addDaysLocalISO`, `daysFromToday`, `formatDateLong`) out of `RecurringTasks.tsx` into a shared module, since the streak calculation needs the same day-by-day date arithmetic. `RecurringTasks.tsx` now imports from there instead of defining its own copies.

### Not started yet
- `src/Gtg.tsx` has **not** been touched for any of this. It still only shows "N reps today" per exercise with no target/streak/PB/trend logic at all. Still needed:
  1. Switch the data fetch from "today's logs only" to **all** logs per exercise (needed to compute historical daily totals for streak/PB/trend/volume) — small dataset at this app's scale, fine to aggregate client-side.
  2. A stats computation (e.g. `computeExerciseStats(logs, target, todayISO)`) returning: today's total, a daily-totals map, personal best `{reps, date}`, current streak, best streak ever, last-7-days array, this-week total, year-to-date total, lifetime total.
  3. Compact card: add the target-scaled progress bar + a small streak badge (only when a target is set — exercises without a target keep the current plain "N reps today" text).
  4. Detail modal: editable daily target field, PB with date, current/best streak, this-week/YTD totals, the 7-day trend sparkline, on top of the existing today's-entries list + delete that's already there.
  5. "+ Add exercise" form: add an optional daily-target number input.
  6. Milestone toast: ephemeral state + auto-dismiss, triggered from `logReps()` by comparing pre/post stats.
  7. New CSS for all of the above in `App.css` (progress bar, streak badge, stats rows, trend sparkline, toast).
- Not yet type-checked, built, or tested in a browser since starting this feature.

### Verification expected before calling it done
Per `CLAUDE.md`'s testing practice: `npx tsc --noEmit`, `npm run build`, then actually exercise it in a real browser against the dev server — including seeding a few days of historical `gtg_logs` rows via SQL (through the Supabase MCP tools or dashboard) to verify streak/PB/trend math, since that can't be validated by logging reps in a single live session. Clean up any seeded test data afterward.
