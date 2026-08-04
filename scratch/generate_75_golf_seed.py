import random

def generate_sql():
  lines = [
    "-- Add recent 75 round at Richmond Country Club",
    "delete from golf_rounds where course_name = 'Richmond Country Club' and score_to_par = 3;",
    "",
  ]

  r_id = "e5555555-5555-5555-5555-555555555555"
  lines.append("insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values")
  lines.append(f"  ('{r_id}', 'Richmond Country Club', '2026-08-03T11:00:00Z', 18, 75, 72, 3, 11, 14, 13, 29, 298, '5W - 0L - 1T', 'Recent 75 round at Richmond Country Club. Outstanding iron play & 3 birdies.');\n")

  # 18 Hole pars & scores for 75 (+3)
  pars = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4]
  scores_75 = [4, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 5, 5, 4, 2, 5, 5, 3] # Total = 75 (+3), 3 birdies!

  hole_rows = []
  shot_rows = []

  base_lat = 49.1659
  base_lng = -123.1311

  for h in range(18):
    h_num = h + 1
    par = pars[h]
    score = scores_75[h]
    putts = 1 if score < par else (2 if score == par else 2)
    fw = 'hit' if par > 3 and random.random() > 0.25 else ('left' if random.random() > 0.5 else 'right')
    gir = 'true' if score <= par else 'false'
    seg_idx = (h // 3) + 1

    hole_rows.append(f"('{r_id}', {h_num}, {par}, {score}, {putts}, '{fw}', {gir}, {seg_idx})")

    # Tee shot
    club1 = "Driver" if par > 3 else ("5 Iron" if par == 3 else "3 Wood")
    dist1 = random.randint(280, 298) if club1 == "Driver" else random.randint(180, 205)
    lat1 = round(base_lat + h * 0.0008, 7)
    lng1 = round(base_lng + h * 0.0008, 7)
    shot_rows.append(f"('{r_id}', {h_num}, 1, '{club1}', {dist1}, 'draw', 'draw', 'center', 'tee', {lat1}, {lng1})")

  lines.append("insert into golf_round_holes (round_id, hole_number, par, score, putts, fairway_result, gir, segment_index) values\n  " + ",\n  ".join(hole_rows) + ";\n")
  lines.append("insert into golf_shots (round_id, hole_number, shot_number, club_used, distance_yds, intended_shape, actual_shape, impact_location, lie_type, latitude, longitude) values\n  " + ",\n  ".join(shot_rows) + ";\n")

  return "\n".join(lines)

with open("supabase_golf_75_seed.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated supabase_golf_75_seed.sql successfully!")
