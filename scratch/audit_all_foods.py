import os
import re
import json

foods_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Foods"

def audit_foods():
  files = [f for f in os.listdir(foods_dir) if f.endswith(".md")]
  print(f"Auditing {len(files)} Food files...")

  section_counts = {}
  callout_counts = {}
  has_quote = 0
  has_quick_ref = 0
  has_cooked_raw = 0
  has_dosage = 0
  has_meal_ideas = 0
  has_synergies = 0

  all_food_summaries = []

  for ff in files:
    path = os.path.join(foods_dir, ff)
    with open(path, "r", encoding="utf-8") as f:
      content = f.read()

    sections = re.findall(r"^##\s+(.*)", content, re.MULTILINE)
    callouts = re.findall(r"^>\s+\[!(\w+)\]", content, re.MULTILINE)
    quotes = re.findall(r"^>\s+\[!quote\]|>\s+\"([^\"]+)\"", content, re.MULTILINE)
    quick_refs = re.findall(r"Quick Reference|Per 100g|Amount \(cooked\)|Amount \(raw\)", content, re.IGNORECASE)
    cooked_raw = re.findall(r"cooked|raw|dry|prepared", content, re.IGNORECASE)
    dosages = re.findall(r"Dosage|Timing|Target|Frequency", content, re.IGNORECASE)
    meal_ideas = re.findall(r"Meal Ideas|Pairs well with|Recipes", content, re.IGNORECASE)
    synergies = re.findall(r"Food Synergies|Synergy|Paired With", content, re.IGNORECASE)

    for sec in sections:
      sec_clean = sec.strip()
      section_counts[sec_clean] = section_counts.get(sec_clean, 0) + 1

    for c in callouts:
      callout_counts[c] = callout_counts.get(c, 0) + 1

    if quotes: has_quote += 1
    if quick_refs: has_quick_ref += 1
    if cooked_raw: has_cooked_raw += 1
    if dosages: has_dosage += 1
    if meal_ideas: has_meal_ideas += 1
    if synergies: has_synergies += 1

    all_food_summaries.append({
      "filename": ff,
      "sections": sections,
      "callouts": callouts,
      "has_quote": len(quotes) > 0,
      "has_quick_ref": len(quick_refs) > 0,
      "has_dosage": len(dosages) > 0,
      "has_meal_ideas": len(meal_ideas) > 0
    })

  print("--- AUDIT RESULTS ACROSS 43 FOODS ---")
  print(f"Total Foods: {len(files)}")
  print(f"Foods with Quotes: {has_quote}/{len(files)}")
  print(f"Foods with Quick Reference / Portion Tables: {has_quick_ref}/{len(files)}")
  print(f"Foods specifying Cooked vs Raw: {has_cooked_raw}/{len(files)}")
  print(f"Foods with Dosage & Timing Guidance: {has_dosage}/{len(files)}")
  print(f"Foods with Meal Ideas & Pairings: {has_meal_ideas}/{len(files)}")
  print(f"Foods with Food Synergies: {has_synergies}/{len(files)}")

  print("\n--- TOP SECTION HEADERS FOUND ---")
  for k, v in sorted(section_counts.items(), key=lambda x: x[1], reverse=True)[:20]:
    print(f"  * {k}: {v} files")

  print("\n--- CALLOUT TYPES FOUND ---")
  for k, v in sorted(callout_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  * [!{k}]: {v} files")

if __name__ == "__main__":
  audit_foods()
