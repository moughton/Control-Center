import random

def generate_sql():
  lines = [
    "-- Truncate and update with EXACT Richmond CC Hole 1 Shot Data (LW 104y) & Exact Tee-to-Green GPS",
    "truncate table golf_shots cascade;",
    "truncate table golf_round_holes cascade;",
    "truncate table golf_rounds cascade;",
    "",
  ]

  r1_id = "f6666666-6666-6666-6666-666666666666"

  # Official Richmond CC Round 75 (+4, Par 71)
  lines.append("insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values")
  lines.append(f"  ('{r1_id}', 'Richmond Country Club', '2026-08-03T11:00:00Z', 18, 75, 71, 4, 11, 14, 13, 29, 298, '5W - 1L - 0T', 'Official Richmond CC Pars. 3 Birdies on H5, H10, H15!');\n")

  # Official Richmond Country Club Pars: H5=5, H10=5, H18=5, Total Par=71
  pars =      [4, 4, 3, 4, 5, 3, 4, 4, 4,  5, 3, 4, 4, 4, 3, 4, 4, 5]
  scores_75 = [4, 4, 3, 4, 4, 3, 4, 5, 4,  4, 3, 4, 5, 4, 2, 5, 5, 5] # 75 (+4)

  # Exact Richmond Country Club Hole 1 Coordinates (Tee -> Fairway -> Green)
  # Hole 1 Tee: 49.1328, -123.1192
  # Hole 1 Fairway (Shot 2 LW 104y): 49.1348, -123.1170
  # Hole 1 Green: 49.1354, -123.1162

  hole_rows = []
  shot_rows = []

  for h in range(18):
    h_num = h + 1
    par = pars[h]
    score = scores_75[h]
    putts = 1 if score < par else 2
    fw = 'hit' if par > 3 and h not in [7, 12, 16] else ('left' if h == 7 else 'right')
    gir = 'true' if score <= par or h in [12, 15] else 'false'
    seg_idx = (h // 3) + 1

    hole_rows.append(f"('{r1_id}', {h_num}, {par}, {score}, {putts}, '{fw}', {gir}, {seg_idx})")

    if h == 0: # Hole 1
      # Shot 1: Driver from Tee Box
      shot_rows.append(f"('{r1_id}', 1, 1, 'Driver', 285, 'draw', 'draw', 'center', 'tee', 49.1328100, -123.1192500)")
      # Shot 2: LW 104 yards to Green
      shot_rows.append(f"('{r1_id}', 1, 2, 'LW', 104, 'straight', 'straight', 'flush', 'fairway', 49.1348200, -123.1170300)")
      # Shot 3: Putt 1 (18 ft)
      shot_rows.append(f"('{r1_id}', 1, 3, 'Putter', 18, 'straight', 'straight', 'center', 'green', 49.1354100, -123.1162400)")
      # Shot 4: Putt 2 (2 ft)
      shot_rows.append(f"('{r1_id}', 1, 4, 'Putter', 2, 'straight', 'straight', 'center', 'green', 49.1354200, -123.1162300)")
    else:
      lat_start = round(49.1328 + (h % 9) * 0.0006, 7)
      lng_start = round(-123.1192 + (h // 9) * 0.0015, 7)
      club1 = "Driver" if par > 3 else "5 Iron"
      dist1 = 295 if club1 == "Driver" else 185
      shot_rows.append(f"('{r1_id}', {h_num}, 1, '{club1}', {dist1}, 'draw', 'draw', 'center', 'tee', {lat_start}, {lng_start})")

      lat_shot2 = round(lat_start + 0.0004, 7)
      lng_shot2 = round(lng_start + 0.0004, 7)
      club2 = "LW" if par == 4 and score <= 4 else ("3 Wood" if par == 5 else "8 Iron")
      dist2 = 104 if club2 == "LW" else 215
      shot_rows.append(f"('{r1_id}', {h_num}, 2, '{club2}', {dist2}, 'straight', 'straight', 'flush', 'fairway', {lat_shot2}, {lng_shot2})")

      lat_shot3 = round(lat_shot2 + 0.0002, 7)
      lng_shot3 = round(lng_shot2 + 0.0002, 7)
      shot_rows.append(f"('{r1_id}', {h_num}, 3, 'Putter', 15, 'straight', 'straight', 'center', 'green', {lat_shot3}, {lng_shot3})")
      if score >= par:
        shot_rows.append(f"('{r1_id}', {h_num}, 4, 'Putter', 2, 'straight', 'straight', 'center', 'green', {lat_shot3}, {lng_shot3})")

  lines.append("insert into golf_round_holes (round_id, hole_number, par, score, putts, fairway_result, gir, segment_index) values\n  " + ",\n  ".join(hole_rows) + ";\n")
  lines.append("insert into golf_shots (round_id, hole_number, shot_number, club_used, distance_yds, intended_shape, actual_shape, impact_location, lie_type, latitude, longitude) values\n  " + ",\n  ".join(shot_rows) + ";\n")

  return "\n".join(lines)

with open("supabase_golf_richmond_official.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated Hole 1 LW 104y seed SQL successfully!")
