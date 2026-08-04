def generate_sql():
  return """
-- Clean out fabricated/synthetic seed data from golf tables
truncate table golf_shots cascade;
"""

with open("scratch/clean_synthetic_data.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated scratch/clean_synthetic_data.sql successfully!")
