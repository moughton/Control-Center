
-- Add pin_location text column to golf_round_holes for tap-to-place pin tracking
alter table golf_round_holes add column if not exists pin_location text;
