import random
from datetime import datetime, timedelta

def generate_sql():
  lines = [
    "-- Clear sample rounds and replace with Richmond Country Club rounds",
    "truncate table golf_shots cascade;",
    "truncate table golf_round_holes cascade;",
    "truncate table golf_rounds cascade;",
    "",
    "-- Seed Richmond Country Club Rounds",
  ]

  random.seed(88)

  # Round 1: Richmond Country Club - Recent Weekend (78 +6)
  r1_id = "c3333333-3333-3333-3333-333333333333"
  lines.append("insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values")
  lines.append(f"  ('{r1_id}', 'Richmond Country Club', '2026-08-02T10:30:00Z', 18, 78, 72, 6, 9, 14, 11, 30, 292, '4W - 2L - 0T', 'Richmond CC Championship Tees. Great ball striking on front 9.');")

  # Round 2: Richmond Country Club - Previous Week (79 +7)
  r2_id = "d4444444-4444-4444-4444-444444444444"
  lines.append("insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values")
  lines.append(f"  ('{r2_id}', 'Richmond Country Club', '2026-07-26T09:15:00Z', 18, 79, 72, 7, 10, 14, 10, 32, 288, '3W - 2L - 1T', 'Richmond CC Saturday Morning Medal Round.');\n")

  # 18 Hole pars for Richmond Country Club
  pars = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4]
  scores_r1 = [4, 5, 3, 5, 4, 4, 4, 5, 4, 5, 3, 5, 5, 4, 3, 6, 4, 5] # Total = 78 (+6)

  hole_rows = []
  shot_rows = []

  # Richmond Country Club GPS coordinates ~ 49.1659° N, 123.1311° W
  base_lat = 49.1659
  base_lng = -123.1311

  for h in range(18):
    h_num = h + 1
    par = pars[h]
    score = scores_r1[h]
    putts = 1 if score < par else (2 if score == par else (2 if score == par + 1 else 3))
    fw = 'hit' if par > 3 and random.random() > 0.35 else ('left' if random.random() > 0.5 else 'right')
    gir = 'true' if (score <= par and putts <= 2) else 'false'
    seg_idx = (h // 3) + 1

    hole_rows.append(f"('{r1_id}', {h_num}, {par}, {score}, {putts}, '{fw}', {gir}, {seg_idx})")

    # Tee Shot for Richmond CC
    club1 = "Driver" if par > 3 else ("6 Iron" if par == 3 else "3 Wood")
    dist1 = random.randint(275, 298) if club1 == "Driver" else random.randint(170, 195)
    lat1 = round(base_lat + h * 0.0008, 7)
    lng1 = round(base_lng + h * 0.0008, 7)
    shot_rows.append(f"('{r1_id}', {h_num}, 1, '{club1}', {dist1}, 'draw', 'draw', 'center', 'tee', {lat1}, {lng1})")

    if score >= 3:
      club2 = "8 Iron" if par > 3 else "Putter"
      dist2 = random.randint(135, 160) if club2 != "Putter" else 15
      lat2 = round(lat1 + 0.0003, 7)
      lng2 = round(lng1 + 0.0003, 7)
      shot_rows.append(f"('{r1_id}', {h_num}, 2, '{club2}', {dist2}, 'straight', 'straight', 'center', 'fairway', {lat2}, {lng2})")

  lines.append("insert into golf_round_holes (round_id, hole_number, par, score, putts, fairway_result, gir, segment_index) values\n  " + ",\n  ".join(hole_rows) + ";\n")
  lines.append("insert into golf_shots (round_id, hole_number, shot_number, club_used, distance_yds, intended_shape, actual_shape, impact_location, lie_type, latitude, longitude) values\n  " + ",\n  ".join(shot_rows) + ";\n")

  return "\n".join(lines)

with open("supabase_golf_richmond_seed.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated supabase_golf_richmond_seed.sql successfully!")
