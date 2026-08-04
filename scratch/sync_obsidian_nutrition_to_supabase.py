import os
import re
import json
import hashlib

foods_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Foods"

def calculate_md5(content):
  return hashlib.md5(content.encode("utf-8")).hexdigest()

def parse_food_file(content, filename):
  """
  Parses a Food markdown file comprehensively, extracting:
  - 2-Column Vertical Table OR YAML Frontmatter
  - Portion State (Cooked vs Raw vs Dry)
  - Quotes ([!quote])
  - Overview / Sports Nutrition Snapshot ([!success])
  - Quick Reference Portion Conversions
  - Food Synergies Table
  - Dosage & Timing Guidance (with timing notes)
  - Meal Ideas & Pairings
  - Full Micronutrient Details (Vitamins, Minerals, Amino Acids, Polyphenols)
  """
  data = {}
  data["content_hash"] = calculate_md5(content)

  # Portion State (Cooked vs Raw)
  if "cooked" in content.lower():
    data["portion_state"] = "cooked"
  elif "raw" in content.lower() or "dry" in content.lower():
    data["portion_state"] = "raw_dry"
  else:
    data["portion_state"] = "unspecified"

  # Quotes ([!quote] or blockquote)
  quotes = re.findall(r"^>\s+\[!quote\]\s*\n>\s+\"(.*)\"", content, re.MULTILINE)
  if not quotes:
    quotes = re.findall(r"\"([^\"]{20,})\"", content)
  if quotes:
    data["quotes"] = [q.strip() for q in quotes if len(q) > 15][:3]

  # Overview Snapshot ([!success] callout)
  snapshot = re.search(r"^>\s+\[!success\]\s*(.*?)(?=\n---|^\n|\Z)", content, re.DOTALL | re.MULTILINE)
  if snapshot:
    data["sports_nutrition_snapshot"] = snapshot.group(1).replace(">", "").strip()

  # 1. Parse 2-Column Vertical Table (| Attribute | Value |)
  table_rows = re.findall(r"^\|([^|]+)\|([^|]+)\|\s*$", content, re.MULTILINE)
  for row in table_rows:
    attr = row[0].strip()
    val = row[1].strip()

    if attr.lower() in ["attribute", "---", "variety", "paired with", "amount", "mineral", "vitamin", "amino acid", "paired with"]:
      continue

    clean_key = attr.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("+", "").replace("/", "_")
    
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

  # 2. Parse YAML Frontmatter if present
  fm_match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
  if fm_match:
    yaml_text = fm_match.group(1)
    for line in yaml_text.split("\n"):
      line = line.strip()
      if not line or line.startswith("#"): continue
      if ":" in line:
        k, v = line.split(":", 1)
        k = k.strip().lower().replace(" ", "_")
        v = v.strip().strip('"\'')
        if v.lower() == "true": v = True
        elif v.lower() == "false": v = False
        elif v == "": v = 0
        else:
          try:
            if "." in v: v = float(v)
            else: v = int(v)
          except ValueError: pass
        if k not in data:
          data[k] = v

  # 3. Parse Quick Reference Portion Conversions Table
  quick_ref_match = re.search(r"### Quick Reference.*?\n(\|.*?)(?=\n\n|\n#|\Z)", content, re.DOTALL)
  if quick_ref_match:
    q_rows = re.findall(r"^\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|(?:([^|]+)\|)?", quick_ref_match.group(1), re.MULTILINE)
    portion_list = []
    for r in q_rows:
      amt = r[0].strip()
      if amt.lower() in ["amount", "---", "amount (cooked)", "amount (raw)"]: continue
      portion_list.append({
        "portion": amt,
        "calories": r[1].strip(),
        "protein": r[2].strip(),
        "fat": r[3].strip()
      })
    if portion_list:
      data["quick_reference_servings"] = portion_list

  # 4. Parse Food Synergies Table
  synergies = []
  synergy_rows = re.findall(r"^\|([^|]+)\|([^|]+)\|([^|]+)\|\s*$", content, re.MULTILINE)
  for s_row in synergy_rows:
    paired = s_row[0].strip().replace("[[", "").replace("]]", "")
    synergy = s_row[1].strip()
    mechanism = s_row[2].strip()
    if paired.lower() in ["paired with", "---", "amount (cooked)", "amount (raw)", "mineral", "vitamin", "amino acid", "variety"]: continue
    synergies.append({"paired_with": paired, "synergy": synergy, "mechanism": mechanism})
  if synergies:
    data["food_synergies"] = synergies

  # 5. Parse Dosage & Timing Guidance Section
  dosage_match = re.search(r"## Dosage Guidance\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if dosage_match:
    data["dosage_and_timing_guidance"] = dosage_match.group(1).strip()

  # 6. Parse Meal Ideas Section
  meal_ideas_match = re.search(r"## Meal Ideas\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if meal_ideas_match:
    data["meal_ideas"] = meal_ideas_match.group(1).strip()

  # 7. Parse Good Energy Relevance Section
  ge_match = re.search(r"## Good Energy Relevance\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if ge_match:
    data["good_energy_relevance"] = ge_match.group(1).strip()

  return data

def generate_ddl_and_seed():
  sql_lines = [
    "-- Create Food Library table with rich JSONB schema",
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

  food_files = [f for f in os.listdir(foods_dir) if f.endswith(".md")]
  print(f"Parsing {len(food_files)} Food files...")
  for ff in food_files:
    path = os.path.join(foods_dir, ff)
    with open(path, "r", encoding="utf-8") as f:
      content = f.read()
    fm = parse_food_file(content, ff)
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
