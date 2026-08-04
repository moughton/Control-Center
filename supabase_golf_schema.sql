-- Drop & recreate Golf facet tables: Rounds, Hole Scorecard, Shot Details & GPS
drop table if exists golf_shots cascade;
drop table if exists golf_round_holes cascade;
drop table if exists golf_rounds cascade;

-- 1. Golf Rounds
create table golf_rounds (
  id uuid primary key default gen_random_uuid(),
  course_name text not null,
  played_at timestamp with time zone not null,
  total_holes integer default 18,
  total_score integer not null,
  total_par integer default 72,
  score_to_par integer not null,
  fairways_hit integer,
  fairways_total integer default 14,
  gir_count integer,
  total_putts integer,
  longest_drive_yds integer,
  segment_record text,
  notes text,
  created_at timestamp with time zone default now()
);
alter table golf_rounds enable row level security;
create policy "Allow all operations v1 golf_rounds" on golf_rounds for all using (true) with check (true);

-- 2. Hole-by-Hole Scorecard Data
create table golf_round_holes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references golf_rounds(id) on delete cascade,
  hole_number integer not null,
  par integer not null,
  score integer not null,
  putts integer default 2,
  fairway_result text default 'hit',
  gir boolean default true,
  segment_index integer not null,
  created_at timestamp with time zone default now()
);
alter table golf_round_holes enable row level security;
create policy "Allow all operations v1 golf_round_holes" on golf_round_holes for all using (true) with check (true);

-- 3. Shot Maps, Club Data, Intended vs Actual Shape, Impact & GPS
create table golf_shots (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references golf_rounds(id) on delete cascade,
  hole_number integer not null,
  shot_number integer not null,
  club_used text not null,
  distance_yds integer,
  intended_shape text,
  actual_shape text,
  impact_location text,
  lie_type text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamp with time zone default now()
);
alter table golf_shots enable row level security;
create policy "Allow all operations v1 golf_shots" on golf_shots for all using (true) with check (true);

-- Seed Sample Golf Rounds with 18 Holes, 3-Hole Match Play Segments, and Shot Maps
insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values
  ('a1111111-1111-1111-1111-111111111111', 'Pebble Beach Golf Links', '2026-08-01T10:00:00Z', 18, 76, 72, 4, 10, 14, 12, 31, 294, '4W - 1L - 1T', 'Solid ball striking, great cold ocean breeze');
insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values
  ('b2222222-2222-2222-2222-222222222222', 'Augusta National Golf Club', '2026-07-25T09:30:00Z', 18, 74, 72, 2, 11, 14, 14, 29, 308, '5W - 0L - 1T', 'Clean 3-hole segment control on Amen Corner');

insert into golf_round_holes (round_id, hole_number, par, score, putts, fairway_result, gir, segment_index) values
  ('a1111111-1111-1111-1111-111111111111', 1, 4, 4, 2, 'hit', true, 1),
  ('a1111111-1111-1111-1111-111111111111', 2, 5, 5, 2, 'left', true, 1),
  ('a1111111-1111-1111-1111-111111111111', 3, 4, 4, 2, 'hit', true, 1),
  ('a1111111-1111-1111-1111-111111111111', 4, 4, 5, 2, 'hit', false, 2),
  ('a1111111-1111-1111-1111-111111111111', 5, 3, 3, 2, 'left', true, 2),
  ('a1111111-1111-1111-1111-111111111111', 6, 5, 4, 1, 'hit', true, 2),
  ('a1111111-1111-1111-1111-111111111111', 7, 3, 3, 2, 'left', true, 3),
  ('a1111111-1111-1111-1111-111111111111', 8, 4, 5, 2, 'hit', false, 3),
  ('a1111111-1111-1111-1111-111111111111', 9, 4, 4, 2, 'hit', true, 3),
  ('a1111111-1111-1111-1111-111111111111', 10, 4, 4, 2, 'hit', true, 4),
  ('a1111111-1111-1111-1111-111111111111', 11, 4, 4, 2, 'hit', true, 4),
  ('a1111111-1111-1111-1111-111111111111', 12, 3, 3, 2, 'right', true, 4),
  ('a1111111-1111-1111-1111-111111111111', 13, 5, 5, 2, 'hit', true, 5),
  ('a1111111-1111-1111-1111-111111111111', 14, 5, 6, 2, 'hit', false, 5),
  ('a1111111-1111-1111-1111-111111111111', 15, 4, 4, 2, 'hit', true, 5),
  ('a1111111-1111-1111-1111-111111111111', 16, 4, 5, 2, 'hit', false, 6),
  ('a1111111-1111-1111-1111-111111111111', 17, 3, 3, 2, 'left', true, 6),
  ('a1111111-1111-1111-1111-111111111111', 18, 5, 5, 2, 'hit', true, 6);

insert into golf_shots (round_id, hole_number, shot_number, club_used, distance_yds, intended_shape, actual_shape, impact_location, lie_type, latitude, longitude) values
  ('a1111111-1111-1111-1111-111111111111', 1, 1, 'Driver', 290, 'fade', 'fade', 'center', 'tee', 36.5681, -121.9486),
  ('a1111111-1111-1111-1111-111111111111', 1, 2, '7 Iron', 151, 'straight', 'draw', 'flush', 'fairway', 36.5685, -121.9482),
  ('a1111111-1111-1111-1111-111111111111', 2, 1, 'Driver', 277, 'fade', 'fade', 'center', 'tee', 36.5691, -121.9476),
  ('a1111111-1111-1111-1111-111111111111', 2, 2, '7 Iron', 154, 'straight', 'draw', 'flush', 'fairway', 36.5695, -121.9472),
  ('a1111111-1111-1111-1111-111111111111', 3, 1, 'Driver', 285, 'fade', 'fade', 'center', 'tee', 36.5701, -121.9466),
  ('a1111111-1111-1111-1111-111111111111', 3, 2, '7 Iron', 149, 'straight', 'draw', 'flush', 'fairway', 36.5705, -121.9462),
  ('a1111111-1111-1111-1111-111111111111', 4, 1, 'Driver', 302, 'fade', 'fade', 'center', 'tee', 36.5711, -121.9456),
  ('a1111111-1111-1111-1111-111111111111', 4, 2, '7 Iron', 145, 'straight', 'draw', 'flush', 'fairway', 36.5715, -121.9452),
  ('a1111111-1111-1111-1111-111111111111', 5, 1, '5 Iron', 185, 'fade', 'fade', 'center', 'tee', 36.5721, -121.9446),
  ('a1111111-1111-1111-1111-111111111111', 5, 2, 'Putter', 25, 'straight', 'draw', 'flush', 'fairway', 36.5725, -121.9442),
  ('a1111111-1111-1111-1111-111111111111', 6, 1, 'Driver', 301, 'fade', 'fade', 'center', 'tee', 36.5731, -121.9436),
  ('a1111111-1111-1111-1111-111111111111', 6, 2, '7 Iron', 150, 'straight', 'draw', 'flush', 'fairway', 36.5735, -121.9432),
  ('a1111111-1111-1111-1111-111111111111', 7, 1, '5 Iron', 191, 'fade', 'fade', 'center', 'tee', 36.5741, -121.9426),
  ('a1111111-1111-1111-1111-111111111111', 7, 2, 'Putter', 25, 'straight', 'draw', 'flush', 'fairway', 36.5745, -121.9422),
  ('a1111111-1111-1111-1111-111111111111', 8, 1, 'Driver', 294, 'fade', 'fade', 'center', 'tee', 36.5751, -121.9416),
  ('a1111111-1111-1111-1111-111111111111', 8, 2, '7 Iron', 150, 'straight', 'draw', 'flush', 'fairway', 36.5755, -121.9412),
  ('a1111111-1111-1111-1111-111111111111', 9, 1, 'Driver', 277, 'fade', 'fade', 'center', 'tee', 36.5761, -121.9406),
  ('a1111111-1111-1111-1111-111111111111', 9, 2, '7 Iron', 147, 'straight', 'draw', 'flush', 'fairway', 36.5765, -121.9402),
  ('a1111111-1111-1111-1111-111111111111', 10, 1, 'Driver', 286, 'fade', 'fade', 'center', 'tee', 36.5771, -121.9396),
  ('a1111111-1111-1111-1111-111111111111', 10, 2, '7 Iron', 162, 'straight', 'draw', 'flush', 'fairway', 36.5775, -121.9392),
  ('a1111111-1111-1111-1111-111111111111', 11, 1, 'Driver', 284, 'fade', 'fade', 'center', 'tee', 36.5781, -121.9386),
  ('a1111111-1111-1111-1111-111111111111', 11, 2, '7 Iron', 151, 'straight', 'draw', 'flush', 'fairway', 36.5785, -121.9382),
  ('a1111111-1111-1111-1111-111111111111', 12, 1, '5 Iron', 191, 'fade', 'fade', 'center', 'tee', 36.5791, -121.9376),
  ('a1111111-1111-1111-1111-111111111111', 12, 2, 'Putter', 25, 'straight', 'draw', 'flush', 'fairway', 36.5795, -121.9372),
  ('a1111111-1111-1111-1111-111111111111', 13, 1, 'Driver', 298, 'fade', 'fade', 'center', 'tee', 36.5801, -121.9366),
  ('a1111111-1111-1111-1111-111111111111', 13, 2, '7 Iron', 164, 'straight', 'draw', 'flush', 'fairway', 36.5805, -121.9362),
  ('a1111111-1111-1111-1111-111111111111', 14, 1, 'Driver', 274, 'fade', 'fade', 'center', 'tee', 36.5811, -121.9356),
  ('a1111111-1111-1111-1111-111111111111', 14, 2, '7 Iron', 148, 'straight', 'draw', 'flush', 'fairway', 36.5815, -121.9352),
  ('a1111111-1111-1111-1111-111111111111', 15, 1, 'Driver', 283, 'fade', 'fade', 'center', 'tee', 36.5821, -121.9346),
  ('a1111111-1111-1111-1111-111111111111', 15, 2, '7 Iron', 168, 'straight', 'draw', 'flush', 'fairway', 36.5825, -121.9342),
  ('a1111111-1111-1111-1111-111111111111', 16, 1, 'Driver', 275, 'fade', 'fade', 'center', 'tee', 36.5831, -121.9336),
  ('a1111111-1111-1111-1111-111111111111', 16, 2, '7 Iron', 148, 'straight', 'draw', 'flush', 'fairway', 36.5835, -121.9332),
  ('a1111111-1111-1111-1111-111111111111', 17, 1, '5 Iron', 187, 'fade', 'fade', 'center', 'tee', 36.5841, -121.9326),
  ('a1111111-1111-1111-1111-111111111111', 17, 2, 'Putter', 25, 'straight', 'draw', 'flush', 'fairway', 36.5845, -121.9322),
  ('a1111111-1111-1111-1111-111111111111', 18, 1, 'Driver', 276, 'fade', 'fade', 'center', 'tee', 36.5851, -121.9316),
  ('a1111111-1111-1111-1111-111111111111', 18, 2, '7 Iron', 153, 'straight', 'draw', 'flush', 'fairway', 36.5855, -121.9312);
