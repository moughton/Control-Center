
-- Update Richmond Country Club round to Par 72, Score 75 (+3)
update golf_rounds
set total_par = 72,
    total_score = 75,
    score_to_par = 3,
    notes = 'Richmond Country Club Par 72 (Out 36 / In 36). Total Score: 75 (+3)'
where course_name = 'Richmond Country Club';
