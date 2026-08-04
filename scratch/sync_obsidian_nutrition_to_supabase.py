import os
import re
import json

foods_dir = r"C:\_git\robo-documents\🎛️ Control Center Docs\📝 Reference\Nutrition\Foods"
recipes_dir = r"C:\_git\robo-documents\🎛️ Control Center Docs\📝 Reference\Nutrition\Recipes"

def parse_frontmatter(content):
  match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
  if not match:
    return {}
  yaml_text = match.group(1)
  data = {}
  for line in yaml_text.split("\n"):
    line = line.strip()
    if not line or line.startswith("#"):
      continue
    if ":" in line:
      k, v = line.split(":", 1)
      k = k.strip()
      v = v.strip().strip('"\'')
      if v.lower() == "true": v = True
      elif v.lower() == "false": v = False
      elif v == "": v = 0
      else:
        try:
          if "." in v: v = float(v)
          else: v = int(v)
        except ValueError:
          pass
      data[k] = v
  return data

def generate_ddl_and_seed():
  sql_lines = [
    "-- Create Food Library and Recipe Library tables",
    "create table if not exists food_library (",
    "  id uuid primary key default gen_random_uuid(),",
    "  name text not null unique,",
    "  food_category text,",
    "  calories_per_100g numeric default 0,",
    "  protein_per_100g numeric default 0,",
    "  carbs_per_100g numeric default 0,",
    "  fat_per_100g numeric default 0,",
    "  fibre_per_100g numeric default 0,",
    "  omega3_per_100g_mg numeric default 0,",
    "  seed_oil boolean default false,",
    "  raw_payload jsonb default '{}'::jsonb",
    ");",
    "",
    "create table if not exists recipes_library (",
    "  id uuid primary key default gen_random_uuid(),",
    "  title text not null unique,",
    "  meal_type text,",
    "  calories_per_serving numeric default 0,",
    "  protein_per_serving_g numeric default 0,",
    "  carbs_per_serving_g numeric default 0,",
    "  fat_per_serving_g numeric default 0,",
    "  recipe_source text,",
    "  ingredients jsonb default '[]'::jsonb,",
    "  raw_payload jsonb default '{}'::jsonb",
    ");",
    "",
    "create table if not exists user_nutrition_goals (",
    "  id uuid primary key default gen_random_uuid(),",
    "  updated_at date not null default current_date,",
    "  weight_lbs numeric default 165,",
    "  body_fat_pct numeric default 15,",
    "  calorie_target numeric default 2400,",
    "  protein_target_g numeric default 160,",
    "  fibre_target_g numeric default 50,",
    "  omega3_target_mg numeric default 2000,",
    "  fasting_protocol text default '16:8',",
    "  fasting_start_hour integer default 20,",
    "  fasting_end_hour integer default 12",
    ");",
    "",
    "create table if not exists weekly_meal_plans (",
    "  id uuid primary key default gen_random_uuid(),",
    "  week_start date not null,",
    "  created_at timestamp default now(),",
    "  daily_plans jsonb default '{}'::jsonb,",
    "  shopping_list jsonb default '[]'::jsonb,",
    "  notes text",
    ");",
    "",
  ]

  # Seed Foods
  food_files = [f for f in os.listdir(foods_dir) if f.endswith(".md")]
  print(f"Parsing {len(food_files)} Food files...")
  for ff in food_files:
    path = os.path.join(foods_dir, ff)
    with open(path, "r", encoding="utf-8") as f:
      content = f.read()
    fm = parse_frontmatter(content)
    name = ff.replace(".md", "").replace("'", "''")
    cat = str(fm.get("food_category", "general")).replace("'", "''")
    cal = fm.get("calories_per_100g", 0) or 0
    pro = fm.get("protein_per_100g", 0) or 0
    carb = fm.get("carbs_per_100g", 0) or 0
    fat = fm.get("fat_per_100g", 0) or 0
    fib = fm.get("fibre_per_100g", 0) or 0
    om3 = fm.get("omega3_per_100g_mg", 0) or 0
    soil = fm.get("seed_oil", False)

    sql_lines.append(
      f"insert into food_library (name, food_category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fibre_per_100g, omega3_per_100g_mg, seed_oil) values "
      f"('{name}', '{cat}', {cal}, {pro}, {carb}, {fat}, {fib}, {om3}, {str(soil).lower()}) "
      f"on conflict (name) do nothing;"
    )

  # Seed Recipes
  recipe_files = [f for f in os.listdir(recipes_dir) if f.endswith(".md")]
  print(f"Parsing {len(recipe_files)} Recipe files...")
  for rf in recipe_files:
    path = os.path.join(recipes_dir, rf)
    with open(path, "r", encoding="utf-8") as f:
      content = f.read()
    fm = parse_frontmatter(content)
    title = rf.replace(".md", "").replace("'", "''")
    mtype = str(fm.get("meal_type", "lunch")).replace("'", "''")
    cal = fm.get("calories_per_serving", 500) or 0
    pro = fm.get("protein_per_serving_g", 40) or 0
    carb = fm.get("carbs_per_serving_g", 45) or 0
    fat = fm.get("fat_per_serving_g", 18) or 0
    src = str(fm.get("recipe_source", "Obsidian Library")).replace("'", "''")

    sql_lines.append(
      f"insert into recipes_library (title, meal_type, calories_per_serving, protein_per_serving_g, carbs_per_serving_g, fat_per_serving_g, recipe_source) values "
      f"('{title}', '{mtype}', {cal}, {pro}, {carb}, {fat}, '{src}') "
      f"on conflict (title) do nothing;"
    )

  with open("supabase_nutrition_schema_and_seed.sql", "w", encoding="utf-8") as out:
    out.write("\n".join(sql_lines))

  print("Generated supabase_nutrition_schema_and_seed.sql successfully!")

if __name__ == "__main__":
  generate_ddl_and_seed()
