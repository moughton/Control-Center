import random
from datetime import datetime, timedelta

def generate_sql():
  lines = [
    "-- Drop & recreate refined health tables: Renpho (lbs), Garmin Activities, Eight Sleep",
    "drop table if exists renpho_scale_logs cascade;",
    "drop table if exists garmin_activities cascade;",
    "drop table if exists eight_sleep_logs cascade;",
    "",
    "-- 1. Renpho Scale Logs (lbs)",
    "create table renpho_scale_logs (",
    "  id uuid primary key default gen_random_uuid(),",
    "  logged_at timestamp with time zone not null unique,",
    "  weight_lbs numeric(5,1) not null,",
    "  body_fat_pct numeric(4,1),",
    "  muscle_mass_lbs numeric(5,1),",
    "  water_pct numeric(4,1),",
    "  bmi numeric(4,1),",
    "  visceral_fat integer,",
    "  bone_mass_lbs numeric(4,1),",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table renpho_scale_logs enable row level security;",
    "create policy \"Allow all operations v1 renpho_scale_logs\" on renpho_scale_logs for all using (true) with check (true);",
    "",
    "-- 2. Garmin Activities (Open Water Cold Plunges, Golf, Runs, Cycling)",
    "create table garmin_activities (",
    "  id uuid primary key default gen_random_uuid(),",
    "  activity_type text not null,",
    "  activity_name text not null,",
    "  start_time timestamp with time zone not null,",
    "  duration_seconds integer not null,",
    "  calories integer,",
    "  avg_hr integer,",
    "  max_hr integer,",
    "  distance_meters numeric(8,2),",
    "  notes text,",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table garmin_activities enable row level security;",
    "create policy \"Allow all operations v1 garmin_activities\" on garmin_activities for all using (true) with check (true);",
    "",
    "-- 3. Eight Sleep Logs (Sleep Score, Stages, Toss & Turns)",
    "create table eight_sleep_logs (",
    "  id uuid primary key default gen_random_uuid(),",
    "  sleep_date date not null unique,",
    "  sleep_score integer,",
    "  light_sleep_seconds integer,",
    "  deep_sleep_seconds integer,",
    "  rem_sleep_seconds integer,",
    "  awake_seconds integer,",
    "  toss_and_turns integer,",
    "  avg_respiratory_rate numeric(4,1),",
    "  bedtime_start timestamp with time zone,",
    "  bedtime_end timestamp with time zone,",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table eight_sleep_logs enable row level security;",
    "create policy \"Allow all operations v1 eight_sleep_logs\" on eight_sleep_logs for all using (true) with check (true);",
    "",
    "-- Seed 49 Days of Refined Data (2026-06-16 to 2026-08-04)",
  ]

  today = datetime(2026, 8, 4)
  random.seed(101)

  renpho_rows = []
  activity_rows = []
  eight_sleep_rows = []

  base_weight_lbs = 175.2

  for i in range(48, -1, -1):
    dt = today - timedelta(days=i)
    date_str = dt.strftime("%Y-%m-%d")

    # Renpho Scale in LBS (175.2 lbs -> 172.4 lbs)
    w_lbs = round(base_weight_lbs - (48 - i) * 0.05 + random.uniform(-0.6, 0.6), 1)
    bf_pct = round(17.8 - (48 - i) * 0.03 + random.uniform(-0.3, 0.3), 1)
    muscle_lbs = round(97.5 + random.uniform(-0.4, 0.4), 1)
    water_pct = round(57.8 + random.uniform(-0.4, 0.4), 1)
    bmi = round(w_lbs / (70 * 70) * 703, 1) # assuming 5'10" height
    visceral = 6
    bone_lbs = 7.2
    renpho_rows.append(f"('{date_str}T07:15:00Z', {w_lbs}, {bf_pct}, {muscle_lbs}, {water_pct}, {bmi}, {visceral}, {bone_lbs})")

    # Eight Sleep Data
    sleep_score = random.randint(82, 96)
    total_sleep_sec = random.randint(25200, 30600) # 7.0h - 8.5h
    deep_sec = random.randint(5400, 7800)
    rem_sec = random.randint(5400, 7200)
    awake_sec = random.randint(600, 1800)
    light_sec = total_sleep_sec - deep_sec - rem_sec - awake_sec
    toss = random.randint(6, 16)
    resp_rate = round(random.uniform(13.8, 15.2), 1)
    b_start = f"{date_str}T22:45:00Z"
    b_end = f"{(dt + timedelta(days=1)).strftime('%Y-%m-%d')}T06:30:00Z"
    eight_sleep_rows.append(f"('{date_str}', {sleep_score}, {light_sec}, {deep_sec}, {rem_sec}, {awake_sec}, {toss}, {resp_rate}, '{b_start}', '{b_end}')")

    # Garmin Activities (Open Water Cold Plunges ~3x a week, Golf 1x weekend, Runs/Cycle)
    weekday = dt.weekday()
    if weekday in [0, 2, 4]: # Mon, Wed, Fri Open Water Cold Plunge
      dur = random.randint(300, 600) # 5-10 min
      cal = random.randint(65, 110)
      avg_hr = random.randint(92, 108)
      max_hr = random.randint(128, 145)
      activity_rows.append(f"('open_water_swimming', 'Cold Plunge', '{date_str}T07:45:00Z', {dur}, {cal}, {avg_hr}, {max_hr}, 150.0, 'Outdoor Cold Water Exposure')")

    if weekday == 5: # Saturday Golf Round
      dur = random.randint(14400, 16200) # 4h to 4.5h
      cal = random.randint(850, 1100)
      avg_hr = random.randint(98, 112)
      max_hr = random.randint(132, 148)
      dist = round(random.uniform(9500, 11200), 2)
      activity_rows.append(f"('golf', '18-Hole Golf Round', '{date_str}T10:00:00Z', {dur}, {cal}, {avg_hr}, {max_hr}, {dist}, 'Championship Course Round')")

    if weekday in [1, 3]: # Tue, Thu Morning Run
      dur = random.randint(1800, 2700) # 30-45 min
      cal = random.randint(380, 550)
      avg_hr = random.randint(142, 158)
      max_hr = random.randint(168, 178)
      dist = round(random.uniform(5000, 8000), 2) # 5k - 8k
      activity_rows.append(f"('running', 'Morning Run', '{date_str}T06:30:00Z', {dur}, {cal}, {avg_hr}, {max_hr}, {dist}, 'Tempo Pace Run')")

  lines.append("insert into renpho_scale_logs (logged_at, weight_lbs, body_fat_pct, muscle_mass_lbs, water_pct, bmi, visceral_fat, bone_mass_lbs) values\n  " + ",\n  ".join(renpho_rows) + ";\n")
  lines.append("insert into eight_sleep_logs (sleep_date, sleep_score, light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds, awake_seconds, toss_and_turns, avg_respiratory_rate, bedtime_start, bedtime_end) values\n  " + ",\n  ".join(eight_sleep_rows) + ";\n")
  lines.append("insert into garmin_activities (activity_type, activity_name, start_time, duration_seconds, calories, avg_hr, max_hr, distance_meters, notes) values\n  " + ",\n  ".join(activity_rows) + ";\n")

  return "\n".join(lines)

with open("supabase_health_refinements.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated supabase_health_refinements.sql successfully!")
