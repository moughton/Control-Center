# Control Center

A companion PWA for the personal life-management "control center" (the Obsidian vault at `robo-documents`). Built to solve the specific problem Obsidian is bad at: **fast, frequent, quick-capture logging** — not to duplicate things Obsidian already does well.

## Stack

Vite + React + TypeScript, installable as a PWA on Android/Windows/Mac (Add to Home Screen / Install as app — no native builds, no app-store distribution). Backend is Supabase (Postgres), project `control-center` (`ivdkdvtmkmpnbfandmbc`, ca-central-1, free tier).

## Facets

- **Recurring Tasks** (`src/RecurringTasks.tsx`) — **not the active version.** Built first as a proof of the Vite+PWA+Supabase pattern end-to-end, but Obsidian's Tasks plugin already handles interval-based recurring tasks well (a checkbox tick every N days has no real friction problem to solve) — see `Recurring Tasks.md` in the vault, which remains the actual source of truth for this. This code stays in the repo as a working reference implementation for the next facet, not as a feature to keep building on.
- **GTG** (next) — the real motivating case for this app existing at all: a running daily volume counter (e.g. 5 sessions of 20 push-ups = 100 today), logged multiple times a day. This is genuinely painful in Obsidian on mobile; it's where a dedicated app earns its place.

## Sync with Obsidian

Not built yet. Eventual design (see the Obsidian vault's own notes for the fuller discussion): capture stays fast in this app writing to Supabase; an on-demand Claude Code skill (same pattern as `generate-meal-plan`) reads from Supabase and writes into the vault — one direction, not full bidirectional sync, to avoid conflict-resolution complexity neither side needs yet.

## Development

```
npm install
cp .env.example .env   # fill in Supabase URL + publishable key
npm run dev
```
