import random
from datetime import datetime, timedelta

def generate_sql():
  lines = [
    "-- Drop & recreate Golf facet tables: Rounds, Hole Scorecard, Shot Details & GPS",
    "drop table if exists golf_shots cascade;",
    "drop table if exists golf_round_holes cascade;",
    "drop table if exists golf_rounds cascade;",
    "",
    "-- 1. Golf Rounds",
    "create table golf_rounds (",
    "  id uuid primary key default gen_random_uuid(),",
    "  course_name text not null,",
    "  played_at timestamp with time zone not null,",
    "  total_holes integer default 18,",
    "  total_score integer not null,",
    "  total_par integer default 72,",
    "  score_to_par integer not null,",
    "  fairways_hit integer,",
    "  fairways_total integer default 14,",
    "  gir_count integer,",
    "  total_putts integer,",
    "  longest_drive_yds integer,",
    "  segment_record text,",
    "  notes text,",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table golf_rounds enable row level security;",
    "create policy \"Allow all operations v1 golf_rounds\" on golf_rounds for all using (true) with check (true);",
    "",
    "-- 2. Hole-by-Hole Scorecard Data",
    "create table golf_round_holes (",
    "  id uuid primary key default gen_random_uuid(),",
    "  round_id uuid references golf_rounds(id) on delete cascade,",
    "  hole_number integer not null,",
    "  par integer not null,",
    "  score integer not null,",
    "  putts integer default 2,",
    "  fairway_result text default 'hit',",
    "  gir boolean default true,",
    "  segment_index integer not null,",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table golf_round_holes enable row level security;",
    "create policy \"Allow all operations v1 golf_round_holes\" on golf_round_holes for all using (true) with check (true);",
    "",
    "-- 3. Shot Maps, Club Data, Intended vs Actual Shape, Impact & GPS",
    "create table golf_shots (",
    "  id uuid primary key default gen_random_uuid(),",
    "  round_id uuid references golf_rounds(id) on delete cascade,",
    "  hole_number integer not null,",
    "  shot_number integer not null,",
    "  club_used text not null,",
    "  distance_yds integer,",
    "  intended_shape text,",
    "  actual_shape text,",
    "  impact_location text,",
    "  lie_type text,",
    "  latitude numeric(10,7),",
    "  longitude numeric(10,7),",
    "  created_at timestamp with time zone default now()",
    ");",
    "alter table golf_shots enable row level security;",
    "create policy \"Allow all operations v1 golf_shots\" on golf_shots for all using (true) with check (true);",
    "",
    "-- Seed Sample Golf Rounds with 18 Holes, 3-Hole Match Play Segments, and Shot Maps",
  ]

  random.seed(77)

  # Sample Round 1: Pebble Beach Links (+4 76)
  r1_id = "a1111111-1111-1111-1111-111111111111"
  lines.append(f"insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values")
  lines.append(f"  ('{r1_id}', 'Pebble Beach Golf Links', '2026-08-01T10:00:00Z', 18, 76, 72, 4, 10, 14, 12, 31, 294, '4W - 1L - 1T', 'Solid ball striking, great cold ocean breeze');")

  # Sample Round 2: Augusta National (+2 74)
  r2_id = "b2222222-2222-2222-2222-222222222222"
  lines.append(f"insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values")
  lines.append(f"  ('{r2_id}', 'Augusta National Golf Club', '2026-07-25T09:30:00Z', 18, 74, 72, 2, 11, 14, 14, 29, 308, '5W - 0L - 1T', 'Clean 3-hole segment control on Amen Corner');\n")

  # Generate 18 Holes for Round 1
  pars = [4, 5, 4, 4, 3, 5, 3, 4, 4, 4, 4, 3, 5, 5, 4, 4, 3, 5]
  scores_r1 = [4, 5, 4, 5, 3, 4, 3, 5, 4, 4, 4, 3, 5, 6, 4, 5, 3, 5] # Total = 76 (+4)

  hole_rows = []
  shot_rows = []

  base_lat = 36.5681
  base_lng = -121.9486

  for h in range(18):
    h_num = h + 1
    par = pars[h]
    score = scores_r1[h]
    putts = 1 if score < par else (2 if score == par else (2 if score == par + 1 else 3))
    fw = 'hit' if par > 3 and random.random() > 0.3 else ('left' if random.random() > 0.5 else 'right')
    gir = 'true' if (score <= par and putts <= 2) else 'false'
    seg_idx = (h // 3) + 1

    hole_rows.append(f"('{r1_id}', {h_num}, {par}, {score}, {putts}, '{fw}', {gir}, {seg_idx})")

    # Shots for this hole
    # Shot 1: Tee Shot
    club1 = "Driver" if par > 3 else ("5 Iron" if par == 3 else "3 Wood")
    dist1 = random.randint(270, 302) if club1 == "Driver" else random.randint(185, 210)
    lat1 = round(base_lat + h * 0.001, 7)
    lng1 = round(base_lng + h * 0.001, 7)
    shot_rows.append(f"('{r1_id}', {h_num}, 1, '{club1}', {dist1}, 'fade', 'fade', 'center', 'tee', {lat1}, {lng1})")

    # Shot 2: Approach Shot
    if score >= 3:
      club2 = "7 Iron" if par > 3 else "Putter"
      dist2 = random.randint(145, 170) if club2 != "Putter" else 25
      lat2 = round(lat1 + 0.0004, 7)
      lng2 = round(lng1 + 0.0004, 7)
      shot_rows.append(f"('{r1_id}', {h_num}, 2, '{club2}', {dist2}, 'straight', 'draw', 'flush', 'fairway', {lat2}, {lng2})")

  lines.append("insert into golf_round_holes (round_id, hole_number, par, score, putts, fairway_result, gir, segment_index) values\n  " + ",\n  ".join(hole_rows) + ";\n")
  lines.append("insert into golf_shots (round_id, hole_number, shot_number, club_used, distance_yds, intended_shape, actual_shape, impact_location, lie_type, latitude, longitude) values\n  " + ",\n  ".join(shot_rows) + ";\n")

  return "\n".join(lines)

with open("supabase_golf_schema.sql", "w", encoding="utf-8") as f:
  f.write(generate_sql())

print("Generated supabase_golf_schema.sql successfully!")
