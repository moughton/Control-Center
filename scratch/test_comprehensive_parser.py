import os
import re
import json

foods_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Foods"

def parse_markdown_tables(content):
  """Extracts ALL markdown tables from content into structured JSON lists of rows."""
  tables = []
  raw_tables = re.findall(r"((?:\|[^\n]+\|\n)+)", content)
  for t in raw_tables:
    lines = [line.strip() for line in t.strip().split("\n") if line.strip()]
    if len(lines) < 2:
      continue
    # Parse header
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
  
  # Find all > blockquote blocks
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

def parse_food_file_comprehensive(content):
  data = {}
  data["full_markdown_content"] = content

  # Parse all tables
  tables = parse_markdown_tables(content)
  data["all_tables"] = tables

  # Parse callouts and quotes
  callouts, quotes = parse_callouts_and_quotes(content)
  data["callouts"] = callouts
  data["quotes"] = quotes

  # Extract key attributes into flat dict
  for t in tables:
    headers_str = " ".join(t["headers"]).lower()
    if "calories" in headers_str or "attribute" in headers_str:
      for r in t["rows"]:
        for k, v in r.items():
          clean_k = k.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("+", "").replace("/", "_")
          data[clean_k] = v

  return data

def test_salmon():
  path = os.path.join(foods_dir, "Salmon.md")
  with open(path, "r", encoding="utf-8") as f:
    content = f.read()
  
  result = parse_food_file_comprehensive(content)
  print("--- COMPREHENSIVE SALMON PARSE TEST ---")
  print("Tables Extracted:", len(result["all_tables"]))
  for i, t in enumerate(result["all_tables"]):
    print(f"  Table {i+1} headers: {t['headers']} ({len(t['rows'])} rows)")
  print("Callouts Extracted:", len(result["callouts"]))
  print("Quotes Extracted:", len(result["quotes"]))
  print("\nQuotes Sample:", result["quotes"])

if __name__ == "__main__":
  test_salmon()
