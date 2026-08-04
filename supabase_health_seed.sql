-- Seed realistic health data into Supabase health tables

insert into health_scale_logs (logged_at, weight_kg, body_fat_pct, muscle_mass_pct, water_pct)
values
  ('2026-08-04T07:15:00Z', 78.4, 16.8, 44.2, 58.1),
  ('2026-08-03T07:20:00Z', 78.6, 17.0, 44.0, 58.0),
  ('2026-08-02T07:10:00Z', 78.9, 17.2, 43.8, 57.8),
  ('2026-08-01T07:25:00Z', 79.1, 17.3, 43.7, 57.6),
  ('2026-07-31T07:12:00Z', 79.3, 17.5, 43.5, 57.5)
on conflict (logged_at) do update set
  weight_kg = excluded.weight_kg,
  body_fat_pct = excluded.body_fat_pct,
  muscle_mass_pct = excluded.muscle_mass_pct;

insert into health_daily_metrics (logged_at, steps, resting_hr, sleep_seconds, active_calories, hrv_avg)
values
  ('2026-08-04', 8420, 56, 27600, 480, 68),
  ('2026-08-03', 10540, 55, 28800, 620, 72),
  ('2026-08-02', 9120, 57, 26400, 510, 65),
  ('2026-08-01', 12300, 54, 29400, 710, 74),
  ('2026-07-31', 7890, 58, 25200, 430, 62)
on conflict (logged_at) do update set
  steps = excluded.steps,
  resting_hr = excluded.resting_hr,
  sleep_seconds = excluded.sleep_seconds;

insert into health_sleep_logs (sleep_date, light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds, awake_seconds, bedtime_start, bedtime_end)
values
  ('2026-08-04', 14400, 6600, 6600, 1800, '2026-08-03T23:00:00Z', '2026-08-04T06:40:00Z'),
  ('2026-08-03', 15000, 7200, 6600, 1200, '2026-08-02T22:45:00Z', '2026-08-03T06:45:00Z'),
  ('2026-08-02', 13800, 6000, 6600, 2400, '2026-08-01T23:30:00Z', '2026-08-02T07:00:00Z')
on conflict (sleep_date) do update set
  deep_sleep_seconds = excluded.deep_sleep_seconds,
  rem_sleep_seconds = excluded.rem_sleep_seconds;
