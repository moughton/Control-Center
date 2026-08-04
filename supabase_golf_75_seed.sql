-- Add recent 75 round at Richmond Country Club
delete from golf_rounds where course_name = 'Richmond Country Club' and score_to_par = 3;

insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values
  ('e5555555-5555-5555-5555-555555555555', 'Richmond Country Club', '2026-08-03T11:00:00Z', 18, 75, 72, 3, 11, 14, 13, 29, 298, '5W - 0L - 1T', 'Recent 75 round at Richmond Country Club. Outstanding iron play & 3 birdies.');

insert into golf_round_holes (round_id, hole_number, par, score, putts, fairway_result, gir, segment_index) values
  ('e5555555-5555-5555-5555-555555555555', 1, 4, 4, 2, 'hit', true, 1),
  ('e5555555-5555-5555-5555-555555555555', 2, 4, 4, 2, 'hit', true, 1),
  ('e5555555-5555-5555-5555-555555555555', 3, 3, 3, 2, 'left', true, 1),
  ('e5555555-5555-5555-5555-555555555555', 4, 5, 4, 1, 'hit', true, 2),
  ('e5555555-5555-5555-5555-555555555555', 5, 4, 4, 2, 'hit', true, 2),
  ('e5555555-5555-5555-5555-555555555555', 6, 3, 3, 2, 'right', true, 2),
  ('e5555555-5555-5555-5555-555555555555', 7, 4, 4, 2, 'hit', true, 3),
  ('e5555555-5555-5555-5555-555555555555', 8, 5, 5, 2, 'hit', true, 3),
  ('e5555555-5555-5555-5555-555555555555', 9, 4, 4, 2, 'hit', true, 3),
  ('e5555555-5555-5555-5555-555555555555', 10, 4, 4, 2, 'left', true, 4),
  ('e5555555-5555-5555-5555-555555555555', 11, 3, 3, 2, 'right', true, 4),
  ('e5555555-5555-5555-5555-555555555555', 12, 5, 5, 2, 'left', true, 4),
  ('e5555555-5555-5555-5555-555555555555', 13, 4, 5, 2, 'hit', false, 5),
  ('e5555555-5555-5555-5555-555555555555', 14, 4, 4, 2, 'hit', true, 5),
  ('e5555555-5555-5555-5555-555555555555', 15, 3, 2, 1, 'left', true, 5),
  ('e5555555-5555-5555-5555-555555555555', 16, 5, 5, 2, 'right', true, 6),
  ('e5555555-5555-5555-5555-555555555555', 17, 4, 5, 2, 'hit', false, 6),
  ('e5555555-5555-5555-5555-555555555555', 18, 4, 3, 1, 'hit', true, 6);

insert into golf_shots (round_id, hole_number, shot_number, club_used, distance_yds, intended_shape, actual_shape, impact_location, lie_type, latitude, longitude) values
  ('e5555555-5555-5555-5555-555555555555', 1, 1, 'Driver', 282, 'draw', 'draw', 'center', 'tee', 49.1659, -123.1311),
  ('e5555555-5555-5555-5555-555555555555', 2, 1, 'Driver', 290, 'draw', 'draw', 'center', 'tee', 49.1667, -123.1303),
  ('e5555555-5555-5555-5555-555555555555', 3, 1, '5 Iron', 199, 'draw', 'draw', 'center', 'tee', 49.1675, -123.1295),
  ('e5555555-5555-5555-5555-555555555555', 4, 1, 'Driver', 285, 'draw', 'draw', 'center', 'tee', 49.1683, -123.1287),
  ('e5555555-5555-5555-5555-555555555555', 5, 1, 'Driver', 293, 'draw', 'draw', 'center', 'tee', 49.1691, -123.1279),
  ('e5555555-5555-5555-5555-555555555555', 6, 1, '5 Iron', 191, 'draw', 'draw', 'center', 'tee', 49.1699, -123.1271),
  ('e5555555-5555-5555-5555-555555555555', 7, 1, 'Driver', 285, 'draw', 'draw', 'center', 'tee', 49.1707, -123.1263),
  ('e5555555-5555-5555-5555-555555555555', 8, 1, 'Driver', 283, 'draw', 'draw', 'center', 'tee', 49.1715, -123.1255),
  ('e5555555-5555-5555-5555-555555555555', 9, 1, 'Driver', 282, 'draw', 'draw', 'center', 'tee', 49.1723, -123.1247),
  ('e5555555-5555-5555-5555-555555555555', 10, 1, 'Driver', 282, 'draw', 'draw', 'center', 'tee', 49.1731, -123.1239),
  ('e5555555-5555-5555-5555-555555555555', 11, 1, '5 Iron', 182, 'draw', 'draw', 'center', 'tee', 49.1739, -123.1231),
  ('e5555555-5555-5555-5555-555555555555', 12, 1, 'Driver', 295, 'draw', 'draw', 'center', 'tee', 49.1747, -123.1223),
  ('e5555555-5555-5555-5555-555555555555', 13, 1, 'Driver', 288, 'draw', 'draw', 'center', 'tee', 49.1755, -123.1215),
  ('e5555555-5555-5555-5555-555555555555', 14, 1, 'Driver', 285, 'draw', 'draw', 'center', 'tee', 49.1763, -123.1207),
  ('e5555555-5555-5555-5555-555555555555', 15, 1, '5 Iron', 190, 'draw', 'draw', 'center', 'tee', 49.1771, -123.1199),
  ('e5555555-5555-5555-5555-555555555555', 16, 1, 'Driver', 286, 'draw', 'draw', 'center', 'tee', 49.1779, -123.1191),
  ('e5555555-5555-5555-5555-555555555555', 17, 1, 'Driver', 286, 'draw', 'draw', 'center', 'tee', 49.1787, -123.1183),
  ('e5555555-5555-5555-5555-555555555555', 18, 1, 'Driver', 290, 'draw', 'draw', 'center', 'tee', 49.1795, -123.1175);
