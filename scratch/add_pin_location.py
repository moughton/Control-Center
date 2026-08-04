def generate_sql():
  return """
-- Add pin_location text column to golf_round_holes for tap-to-place pin tracking
alter table golf_round_holes add column if not exists pin_location text;
"""

with open("supabase_add_pin_location.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated supabase_add_pin_location.sql successfully!")
