-- Clear sample rounds and replace with Richmond Country Club rounds
truncate table golf_shots cascade;
truncate table golf_round_holes cascade;
truncate table golf_rounds cascade;

-- Seed Richmond Country Club Rounds
insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values
  ('c3333333-3333-3333-3333-333333333333', 'Richmond Country Club', '2026-08-02T10:30:00Z', 18, 78, 72, 6, 9, 14, 11, 30, 292, '4W - 2L - 0T', 'Richmond CC Championship Tees. Great ball striking on front 9.');
insert into golf_rounds (id, course_name, played_at, total_holes, total_score, total_par, score_to_par, fairways_hit, fairways_total, gir_count, total_putts, longest_drive_yds, segment_record, notes) values
  ('d4444444-4444-4444-4444-444444444444', 'Richmond Country Club', '2026-07-26T09:15:00Z', 18, 79, 72, 7, 10, 14, 10, 32, 288, '3W - 2L - 1T', 'Richmond CC Saturday Morning Medal Round.');

insert into golf_round_holes (round_id, hole_number, par, score, putts, fairway_result, gir, segment_index) values
  ('c3333333-3333-3333-3333-333333333333', 1, 4, 4, 2, 'hit', true, 1),
  ('c3333333-3333-3333-3333-333333333333', 2, 4, 5, 2, 'hit', false, 1),
  ('c3333333-3333-3333-3333-333333333333', 3, 3, 3, 2, 'left', true, 1),
  ('c3333333-3333-3333-3333-333333333333', 4, 5, 5, 2, 'right', true, 2),
  ('c3333333-3333-3333-3333-333333333333', 5, 4, 4, 2, 'left', true, 2),
  ('c3333333-3333-3333-3333-333333333333', 6, 3, 4, 2, 'left', false, 2),
  ('c3333333-3333-3333-3333-333333333333', 7, 4, 4, 2, 'hit', true, 3),
  ('c3333333-3333-3333-3333-333333333333', 8, 5, 5, 2, 'right', true, 3),
  ('c3333333-3333-3333-3333-333333333333', 9, 4, 4, 2, 'left', true, 3),
  ('c3333333-3333-3333-3333-333333333333', 10, 4, 5, 2, 'hit', false, 4),
  ('c3333333-3333-3333-3333-333333333333', 11, 3, 3, 2, 'left', true, 4),
  ('c3333333-3333-3333-3333-333333333333', 12, 5, 5, 2, 'hit', true, 4),
  ('c3333333-3333-3333-3333-333333333333', 13, 4, 5, 2, 'hit', false, 5),
  ('c3333333-3333-3333-3333-333333333333', 14, 4, 4, 2, 'hit', true, 5),
  ('c3333333-3333-3333-3333-333333333333', 15, 3, 3, 2, 'left', true, 5),
  ('c3333333-3333-3333-3333-333333333333', 16, 5, 6, 2, 'hit', false, 6),
  ('c3333333-3333-3333-3333-333333333333', 17, 4, 4, 2, 'hit', true, 6),
  ('c3333333-3333-3333-3333-333333333333', 18, 4, 5, 2, 'hit', false, 6);

insert into golf_shots (round_id, hole_number, shot_number, club_used, distance_yds, intended_shape, actual_shape, impact_location, lie_type, latitude, longitude) values
  ('c3333333-3333-3333-3333-333333333333', 1, 1, 'Driver', 281, 'draw', 'draw', 'center', 'tee', 49.1659, -123.1311),
  ('c3333333-3333-3333-3333-333333333333', 1, 2, '8 Iron', 145, 'straight', 'straight', 'center', 'fairway', 49.1662, -123.1308),
  ('c3333333-3333-3333-3333-333333333333', 2, 1, 'Driver', 295, 'draw', 'draw', 'center', 'tee', 49.1667, -123.1303),
  ('c3333333-3333-3333-3333-333333333333', 2, 2, '8 Iron', 135, 'straight', 'straight', 'center', 'fairway', 49.167, -123.13),
  ('c3333333-3333-3333-3333-333333333333', 3, 1, '6 Iron', 192, 'draw', 'draw', 'center', 'tee', 49.1675, -123.1295),
  ('c3333333-3333-3333-3333-333333333333', 3, 2, 'Putter', 15, 'straight', 'straight', 'center', 'fairway', 49.1678, -123.1292),
  ('c3333333-3333-3333-3333-333333333333', 4, 1, 'Driver', 289, 'draw', 'draw', 'center', 'tee', 49.1683, -123.1287),
  ('c3333333-3333-3333-3333-333333333333', 4, 2, '8 Iron', 139, 'straight', 'straight', 'center', 'fairway', 49.1686, -123.1284),
  ('c3333333-3333-3333-3333-333333333333', 5, 1, 'Driver', 297, 'draw', 'draw', 'center', 'tee', 49.1691, -123.1279),
  ('c3333333-3333-3333-3333-333333333333', 5, 2, '8 Iron', 139, 'straight', 'straight', 'center', 'fairway', 49.1694, -123.1276),
  ('c3333333-3333-3333-3333-333333333333', 6, 1, '6 Iron', 184, 'draw', 'draw', 'center', 'tee', 49.1699, -123.1271),
  ('c3333333-3333-3333-3333-333333333333', 6, 2, 'Putter', 15, 'straight', 'straight', 'center', 'fairway', 49.1702, -123.1268),
  ('c3333333-3333-3333-3333-333333333333', 7, 1, 'Driver', 296, 'draw', 'draw', 'center', 'tee', 49.1707, -123.1263),
  ('c3333333-3333-3333-3333-333333333333', 7, 2, '8 Iron', 148, 'straight', 'straight', 'center', 'fairway', 49.171, -123.126),
  ('c3333333-3333-3333-3333-333333333333', 8, 1, 'Driver', 289, 'draw', 'draw', 'center', 'tee', 49.1715, -123.1255),
  ('c3333333-3333-3333-3333-333333333333', 8, 2, '8 Iron', 145, 'straight', 'straight', 'center', 'fairway', 49.1718, -123.1252),
  ('c3333333-3333-3333-3333-333333333333', 9, 1, 'Driver', 282, 'draw', 'draw', 'center', 'tee', 49.1723, -123.1247),
  ('c3333333-3333-3333-3333-333333333333', 9, 2, '8 Iron', 149, 'straight', 'straight', 'center', 'fairway', 49.1726, -123.1244),
  ('c3333333-3333-3333-3333-333333333333', 10, 1, 'Driver', 282, 'draw', 'draw', 'center', 'tee', 49.1731, -123.1239),
  ('c3333333-3333-3333-3333-333333333333', 10, 2, '8 Iron', 140, 'straight', 'straight', 'center', 'fairway', 49.1734, -123.1236),
  ('c3333333-3333-3333-3333-333333333333', 11, 1, '6 Iron', 177, 'draw', 'draw', 'center', 'tee', 49.1739, -123.1231),
  ('c3333333-3333-3333-3333-333333333333', 11, 2, 'Putter', 15, 'straight', 'straight', 'center', 'fairway', 49.1742, -123.1228),
  ('c3333333-3333-3333-3333-333333333333', 12, 1, 'Driver', 295, 'draw', 'draw', 'center', 'tee', 49.1747, -123.1223),
  ('c3333333-3333-3333-3333-333333333333', 12, 2, '8 Iron', 151, 'straight', 'straight', 'center', 'fairway', 49.175, -123.122),
  ('c3333333-3333-3333-3333-333333333333', 13, 1, 'Driver', 291, 'draw', 'draw', 'center', 'tee', 49.1755, -123.1215),
  ('c3333333-3333-3333-3333-333333333333', 13, 2, '8 Iron', 135, 'straight', 'straight', 'center', 'fairway', 49.1758, -123.1212),
  ('c3333333-3333-3333-3333-333333333333', 14, 1, 'Driver', 297, 'draw', 'draw', 'center', 'tee', 49.1763, -123.1207),
  ('c3333333-3333-3333-3333-333333333333', 14, 2, '8 Iron', 147, 'straight', 'straight', 'center', 'fairway', 49.1766, -123.1204),
  ('c3333333-3333-3333-3333-333333333333', 15, 1, '6 Iron', 185, 'draw', 'draw', 'center', 'tee', 49.1771, -123.1199),
  ('c3333333-3333-3333-3333-333333333333', 15, 2, 'Putter', 15, 'straight', 'straight', 'center', 'fairway', 49.1774, -123.1196),
  ('c3333333-3333-3333-3333-333333333333', 16, 1, 'Driver', 290, 'draw', 'draw', 'center', 'tee', 49.1779, -123.1191),
  ('c3333333-3333-3333-3333-333333333333', 16, 2, '8 Iron', 139, 'straight', 'straight', 'center', 'fairway', 49.1782, -123.1188),
  ('c3333333-3333-3333-3333-333333333333', 17, 1, 'Driver', 279, 'draw', 'draw', 'center', 'tee', 49.1787, -123.1183),
  ('c3333333-3333-3333-3333-333333333333', 17, 2, '8 Iron', 139, 'straight', 'straight', 'center', 'fairway', 49.179, -123.118),
  ('c3333333-3333-3333-3333-333333333333', 18, 1, 'Driver', 284, 'draw', 'draw', 'center', 'tee', 49.1795, -123.1175),
  ('c3333333-3333-3333-3333-333333333333', 18, 2, '8 Iron', 157, 'straight', 'straight', 'center', 'fairway', 49.1798, -123.1172);
