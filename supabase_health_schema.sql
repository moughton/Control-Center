-- Supabase Health & Wearable Data Ingestion Schema
-- Run this in your Supabase SQL Editor (ivdkdvtmkmpnbfandmbc)

-- 1. Renpho Smart Scale / Weight Logs
create table if not exists health_scale_logs (
  id uuid primary key default gen_random_uuid(),
  logged_at timestamp with time zone not null unique,
  weight_kg numeric(5,2) not null,
  body_fat_pct numeric(4,1),
  muscle_mass_pct numeric(4,1),
  water_pct numeric(4,1),
  created_at timestamp with time zone default now()
);

-- Enable RLS (permissive v1 policy matching app convention)
alter table health_scale_logs enable row level security;

create policy "Allow all operations v1 health_scale_logs" on health_scale_logs
  for all using (true) with check (true);

-- 2. Garmin & Wearables Daily Summary Metrics
create table if not exists health_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  logged_at date not null unique,
  steps integer,
  resting_hr integer,
  sleep_seconds integer,
  sleep_score integer,
  active_calories integer,
  hrv_avg integer,
  created_at timestamp with time zone default now()
);

alter table health_daily_metrics enable row level security;

create policy "Allow all operations v1 health_daily_metrics" on health_daily_metrics
  for all using (true) with check (true);

-- 3. Eight Sleep / Detailed Sleep Logs
create table if not exists health_sleep_logs (
  id uuid primary key default gen_random_uuid(),
  sleep_date date not null unique,
  light_sleep_seconds integer,
  deep_sleep_seconds integer,
  rem_sleep_seconds integer,
  awake_seconds integer,
  bedtime_start timestamp with time zone,
  bedtime_end timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table health_sleep_logs enable row level security;

create policy "Allow all operations v1 health_sleep_logs" on health_sleep_logs
  for all using (true) with check (true);
