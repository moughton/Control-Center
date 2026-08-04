import random
from datetime import datetime, timedelta

def generate_sql():
  lines = [
    "-- Drop and Recreate Health Tables for clean 49-day seed",
    "drop table if exists health_scale_logs cascade;",
    "drop table if exists health_daily_metrics cascade;",
    "drop table if exists health_sleep_logs cascade;",
    "",
    "-- 1. Renpho Smart Scale / Weight Logs (Primary key: logged_at date)",
    "create table health_scale_logs (",
    "  logged_at date primary key,",
    "  weight_kg numeric(5,2) not null,",
    "  body_fat_pct numeric(4,1),",
    "  muscle_mass_pct numeric(4,1),",
    "  water_pct numeric(4,1),",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table health_scale_logs enable row level security;",
    "create policy \"Allow all operations v1 health_scale_logs\" on health_scale_logs for all using (true) with check (true);",
    "",
    "-- 2. Garmin & Wearables Daily Metrics (Primary key: logged_at date)",
    "create table health_daily_metrics (",
    "  logged_at date primary key,",
    "  steps integer,",
    "  resting_hr integer,",
    "  sleep_seconds integer,",
    "  sleep_score integer,",
    "  active_calories integer,",
    "  hrv_avg integer,",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table health_daily_metrics enable row level security;",
    "create policy \"Allow all operations v1 health_daily_metrics\" on health_daily_metrics for all using (true) with check (true);",
    "",
    "-- 3. Eight Sleep Detailed Sleep Logs (Primary key: sleep_date date)",
    "create table health_sleep_logs (",
    "  sleep_date date primary key,",
    "  light_sleep_seconds integer,",
    "  deep_sleep_seconds integer,",
    "  rem_sleep_seconds integer,",
    "  awake_seconds integer,",
    "  bedtime_start timestamp with time zone,",
    "  bedtime_end timestamp with time zone,",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table health_sleep_logs enable row level security;",
    "create policy \"Allow all operations v1 health_sleep_logs\" on health_sleep_logs for all using (true) with check (true);",
    "",
    "-- Seed 49 days of historical data (2026-06-16 to 2026-08-04)",
  ]

  today = datetime(2026, 8, 4)
  random.seed(42) # deterministic realistic seed

  scale_rows = []
  daily_rows = []
  sleep_rows = []

  base_weight = 79.5
  for i in range(48, -1, -1):
    dt = today - timedelta(days=i)
    date_str = dt.strftime("%Y-%m-%d")

    # Scale data (weight trending down slightly 79.5 -> 78.2)
    weight = round(base_weight - (48 - i) * 0.025 + random.uniform(-0.3, 0.3), 2)
    body_fat = round(17.5 - (48 - i) * 0.015 + random.uniform(-0.2, 0.2), 1)
    muscle = round(43.5 + (48 - i) * 0.01 + random.uniform(-0.1, 0.1), 1)
    water = round(57.5 + random.uniform(-0.3, 0.3), 1)
    scale_rows.append(f"('{date_str}', {weight}, {body_fat}, {muscle}, {water})")

    # Daily Garmin metrics
    is_weekend = dt.weekday() >= 5
    steps = random.randint(10000, 14500) if is_weekend else random.randint(7500, 11500)
    resting_hr = random.randint(52, 58)
    sleep_sec = random.randint(24000, 30600) # 6.6h to 8.5h
    sleep_score = random.randint(78, 94)
    active_cal = random.randint(450, 780)
    hrv = random.randint(62, 78)
    daily_rows.append(f"('{date_str}', {steps}, {resting_hr}, {sleep_sec}, {sleep_score}, {active_cal}, {hrv})")

    # Eight Sleep detailed stages
    deep_sec = random.randint(5400, 7800) # 1.5h to 2.1h
    rem_sec = random.randint(5400, 7200) # 1.5h to 2.0h
    light_sec = sleep_sec - deep_sec - rem_sec - random.randint(600, 1800)
    awake_sec = sleep_sec - (light_sec + deep_sec + rem_sec)
    bedtime_start = f"{date_str}T22:45:00Z"
    bedtime_end = f"{(dt + timedelta(days=1)).strftime('%Y-%m-%d')}T06:45:00Z"
    sleep_rows.append(f"('{date_str}', {light_sec}, {deep_sec}, {rem_sec}, {awake_sec}, '{bedtime_start}', '{bedtime_end}')")

  lines.append("insert into health_scale_logs (logged_at, weight_kg, body_fat_pct, muscle_mass_pct, water_pct) values\n  " + ",\n  ".join(scale_rows) + ";\n")
  lines.append("insert into health_daily_metrics (logged_at, steps, resting_hr, sleep_seconds, sleep_score, active_calories, hrv_avg) values\n  " + ",\n  ".join(daily_rows) + ";\n")
  lines.append("insert into health_sleep_logs (sleep_date, light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds, awake_seconds, bedtime_start, bedtime_end) values\n  " + ",\n  ".join(sleep_rows) + ";\n")

  return "\n".join(lines)

with open("supabase_health_49days_recreate.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated supabase_health_49days_recreate.sql successfully!")
