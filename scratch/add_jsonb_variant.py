def generate_sql():
  return """
-- Add Postgres JSONB (Snowflake VARIANT equivalent) columns to all health & golf tables for flexible schema drift

alter table garmin_activities add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table golf_rounds add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table golf_shots add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table eight_sleep_logs add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table renpho_scale_logs add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table health_daily_metrics add column if not exists raw_payload jsonb default '{}'::jsonb;
"""

with open("supabase_add_jsonb_variant.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated supabase_add_jsonb_variant.sql successfully!")
