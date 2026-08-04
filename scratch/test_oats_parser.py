import os
import re
import json

foods_dir = r"C:\_git\robo-documents\🎛️ Control Center\Supabase Data\Foods"

from test_comprehensive_parser import parse_food_file_comprehensive

def test_oats():
  path = os.path.join(foods_dir, "Oats.md")
  with open(path, "r", encoding="utf-8") as f:
    content = f.read()

  result = parse_food_file_comprehensive(content)
  print("--- COMPREHENSIVE OATS PARSE TEST ---")
  print("Tables Extracted:", len(result["all_tables"]))
  for i, t in enumerate(result["all_tables"]):
    print(f"\nTable {i+1} headers:", t["headers"])
    print("Sample row:", t["rows"][0] if t["rows"] else "empty")
  print("\nCallouts Extracted:", len(result["callouts"]))
  print("Quotes Extracted:", len(result["quotes"]))

if __name__ == "__main__":
  test_oats()
