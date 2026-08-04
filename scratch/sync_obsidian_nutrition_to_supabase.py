import os
import re
import json
import hashlib

foods_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Foods"
recipes_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Recipes"

def calculate_md5(content):
  return hashlib.md5(content.encode("utf-8")).hexdigest()

def clean_number(val):
  if val is None: return 0
  if isinstance(val, (int, float)): return val
  val_str = str(val).strip()
  num_match = re.search(r"^([\d\.,]+)", val_str)
  if num_match:
    raw_num = num_match.group(1).replace(",", "")
    try:
      if "." in raw_num: return float(raw_num)
      else: return int(raw_num)
    except ValueError:
      pass
  return 0

def parse_all_markdown_tables(content):
  """Extracts ALL markdown tables from content into structured JSON lists of rows."""
  tables = []
  raw_tables = re.findall(r"((?:\|[^\n]+\|\n)+)", content)
  for t in raw_tables:
    lines = [line.strip() for line in t.strip().split("\n") if line.strip()]
    if len(lines) < 2:
      continue
    
    headers = [h.strip() for h in lines[0].split("|")[1:-1]]
    if not headers or all(h == "" or "---" in h for h in headers):
      continue
    
    rows = []
    for line in lines[1:]:
      if "---" in line:
        continue
      cells = [c.strip() for c in line.split("|")[1:-1]]
      if len(cells) == len(headers):
        row_obj = {}
        for h, c in zip(headers, cells):
          row_obj[h] = c
        rows.append(row_obj)
    
    if rows:
      tables.append({"headers": headers, "rows": rows})
  return tables

def parse_callouts_and_quotes(content):
  """Extracts all Obsidian blockquote callouts ([!quote], [!success], [!info], [!tip], [!warning])."""
  callouts = []
  quotes = []
  
  blocks = re.findall(r"(?:^>[^\n]*\n?)+", content, re.MULTILINE)
  for b in blocks:
    clean_text = "\n".join([line.lstrip("> ").strip() for line in b.split("\n") if line.strip()])
    c_match = re.search(r"^\[!(\w+)\]\s*(.*)", clean_text)
    if c_match:
      c_type = c_match.group(1).lower()
      c_body = clean_text[len(c_match.group(0)):].strip()
      callouts.append({"type": c_type, "title": c_match.group(2), "content": c_body})
      if c_type == "quote" or '"' in clean_text:
        quotes.append(clean_text.replace('[!quote]', '').strip())
    elif '"' in clean_text:
      quotes.append(clean_text)

  return callouts, quotes

def parse_food_file_100_percent_comprehensive(content):
  data = {}
  data["content_hash"] = calculate_md5(content)
  data["full_markdown_content"] = content

  # Portion State (Cooked vs Raw/Dry)
  if "cooked" in content.lower():
    data["portion_state"] = "cooked"
  elif "raw" in content.lower() or "dry" in content.lower():
    data["portion_state"] = "raw_dry"
  else:
    data["portion_state"] = "unspecified"

  # Tables (Macros, Quick Reference, Minerals, Vitamins, Amino Acids, Synergies)
  tables = parse_all_markdown_tables(content)
  data["tables"] = tables

  for t in tables:
    h_lower = [h.lower() for h in t["headers"]]
    h_str = " ".join(h_lower)

    if "mineral" in h_str:
      data["minerals_breakdown"] = t["rows"]
    elif "vitamin" in h_str and "amount" not in h_str:
      data["vitamins_breakdown"] = t["rows"]
    elif "amino acid" in h_str:
      data["amino_acids_breakdown"] = t["rows"]
    elif "paired with" in h_str:
      data["food_synergies"] = t["rows"]
    elif "amount" in h_str or "portion" in h_str:
      data["quick_reference_servings"] = t["rows"]
    elif "calories" in h_str or "attribute" in h_str:
      # Flat macro attributes
      for r in t["rows"]:
        if "Attribute" in r and "Value" in r:
          k = r["Attribute"].lower().replace(" ", "_").replace("(", "").replace(")", "").replace("+", "").replace("/", "_")
          data[k] = r["Value"]
        else:
          for k, v in r.items():
            clean_k = k.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("+", "").replace("/", "_")
            data[clean_k] = v

  # YAML Frontmatter if present
  fm_match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
  if fm_match:
    for line in fm_match.group(1).split("\n"):
      line = line.strip()
      if ":" in line and not line.startswith("#"):
        k, v = line.split(":", 1)
        k = k.strip().lower().replace(" ", "_")
        v = v.strip().strip('"\'')
        data[k] = v

  # Callouts and Quotes
  callouts, quotes = parse_callouts_and_quotes(content)
  data["callouts"] = callouts
  data["quotes"] = quotes

  # Sections (Dosage & Timing, Good Energy Relevance, Meal Ideas)
  dosage_match = re.search(r"## Dosage Guidance\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if dosage_match:
    data["dosage_and_timing_guidance"] = dosage_match.group(1).strip()

  meal_ideas_match = re.search(r"## Meal Ideas\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if meal_ideas_match:
    data["meal_ideas"] = meal_ideas_match.group(1).strip()

  ge_match = re.search(r"## Good Energy Relevance\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
  if ge_match:
    data["good_energy_relevance"] = ge_match.group(1).strip()

  return data

def generate_ddl_and_seed():
  sql_lines = [
    "-- Create Food Library table with 100% comprehensive raw_payload schema",
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
  print(f"Parsing {len(food_files)} Food files with 100% comprehensive extractor...")
  for ff in food_files:
    path = os.path.join(foods_dir, ff)
    with open(path, "r", encoding="utf-8") as f:
      content = f.read()
    fm = parse_food_file_100_percent_comprehensive(content)
    name = ff.replace(".md", "").replace("'", "''")
    cat = str(fm.get("food_category", "general")).replace("'", "''")
    
    cal = clean_number(fm.get("calories_per_100g", fm.get("calories", fm.get("calories_per_unit", 0))))
    pro = clean_number(fm.get("protein_per_100g", fm.get("protein", fm.get("protein_per_unit_g", 0))))
    carb = clean_number(fm.get("carbs_per_100g", fm.get("carbs", fm.get("carbs_per_unit_g", 0))))
    fat = clean_number(fm.get("fat_per_100g", fm.get("fat", fm.get("fat_per_unit_g", 0))))
    fib = clean_number(fm.get("fibre_per_100g", fm.get("fibre", fm.get("fibre_per_unit_g", 0))))
    om3 = clean_number(fm.get("omega3_per_100g_mg", fm.get("omega-3_epadha", 0)))
    soil = fm.get("seed_oil", False)
    if isinstance(soil, str): soil = soil.lower() in ["true", "yes"]

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

  print("Generated 100% comprehensive supabase_nutrition_schema_and_seed.sql successfully!")

if __name__ == "__main__":
  generate_ddl_and_seed()
