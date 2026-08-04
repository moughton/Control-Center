import os
import re
import json
import hashlib

foods_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Foods"
recipes_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Recipes"

def calculate_md5(content):
  return hashlib.md5(content.encode("utf-8")).hexdigest()

def parse_food_file(content):
  """
  Parses a Food markdown file, extracting data from:
  1. 2-Column Vertical Table (| Attribute | Value |)
  2. Food Synergies Table (| Paired With | Synergy | Mechanism |)
  3. Sections (Dosage Guidance, Good Energy Relevance)
  """
  data = {}
  data["content_hash"] = calculate_md5(content)

  # 1. Parse 2-Column Vertical Table (| Attribute | Value |)
  table_rows = re.findall(r"^\|([^|]+)\|([^|]+)\|\s*$", content, re.MULTILINE)
  for row in table_rows:
    attr = row[0].strip()
    val = row[1].strip()

    if attr.lower() in ["attribute", "---", "variety", "paired with"]:
      continue

    clean_key = attr.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("+", "")
    
    clean_val = val
    if val.lower() in ["yes", "true"]: clean_val = True
    elif val.lower() in ["no", "false"]: clean_val = False
    else:
      num_match = re.search(r"^([\d\.,]+)", val)
      if num_match:
        raw_num = num_match.group(1).replace(",", "")
        try:
          if "." in raw_num: clean_val = float(raw_num)
          else: clean_val = int(raw_num)
        except ValueError:
          pass

    data[clean_key] = clean_val

  # 2. Parse Food Synergies Table
  synergies = []
  synergy_rows = re.findall(r"^\|([^|]+)\|([^|]+)\|([^|]+)\|\s*$", content, re.MULTILINE)
  for s_row in synergy_rows:
    paired = s_row[0].strip().replace("[[", "").replace("]]", "")
    synergy = s_row[1].strip()
    mechanism = s_row[2].strip()
    if paired.lower() in ["paired with", "---", "amount (cooked)"]:
      continue
    synergies.append({"paired_with": paired, "synergy": synergy, "mechanism": mechanism})

  if synergies:
    data["food_synergies"] = synergies

  # 3. Parse Dosage Guidance Section
  dosage_match = re.search(r"## Dosage Guidance\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if dosage_match:
    data["dosage_guidance"] = dosage_match.group(1).strip()

  # 4. Parse Good Energy Relevance Section
  ge_match = re.search(r"## Good Energy Relevance\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if ge_match:
    data["good_energy_relevance"] = ge_match.group(1).strip()

  return data

def generate_ddl_and_seed():
  sql_lines = [
    "-- Create Food Library table",
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
  ]

  # Seed Foods
  food_files = [f for f in os.listdir(foods_dir) if f.endswith(".md")]
  print(f"Parsing {len(food_files)} Food files...")
  for ff in food_files:
    path = os.path.join(foods_dir, ff)
    with open(path, "r", encoding="utf-8") as f:
      content = f.read()
    fm = parse_food_file(content)
    name = ff.replace(".md", "").replace("'", "''")
    cat = str(fm.get("food_category", "general")).replace("'", "''")
    cal = fm.get("calories_per_100g", fm.get("calories", 0)) or 0
    pro = fm.get("protein_per_100g", fm.get("protein", 0)) or 0
    carb = fm.get("carbs_per_100g", fm.get("carbs", 0)) or 0
    fat = fm.get("fat_per_100g", fm.get("fat", 0)) or 0
    fib = fm.get("fibre_per_100g", fm.get("fibre", 0)) or 0
    om3 = fm.get("omega3_per_100g_mg", fm.get("omega-3_epadha", 0)) or 0
    soil = fm.get("seed_oil", False)

    raw_json = json.dumps(fm).replace("'", "''")

    sql_lines.append(
      f"insert into food_library (name, food_category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fibre_per_100g, omega3_per_100g_mg, seed_oil, raw_payload) values "
      f"('{name}', '{cat}', {cal}, {pro}, {carb}, {fat}, {fib}, {om3}, {str(soil).lower()}, '{raw_json}'::jsonb) "
      f"on conflict (name) do update set "
      f"calories_per_100g = excluded.calories_per_100g, protein_per_100g = excluded.protein_per_100g, "
      f"raw_payload = excluded.raw_payload;"
    )

  with open("supabase_nutrition_schema_and_seed.sql", "w", encoding="utf-8") as out:
    out.write("\n".join(sql_lines))

  print("Generated supabase_nutrition_schema_and_seed.sql successfully!")

if __name__ == "__main__":
  generate_ddl_and_seed()
