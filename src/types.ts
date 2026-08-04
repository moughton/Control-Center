export interface TaskCategory {
  id: string
  name: string
  color: string
  created_at: string
}

export interface RecurringTask {
  id: string
  name: string
  category_id: string
  category: TaskCategory // joined via category_id
  interval_days: number
  next_due_at: string // date, e.g. "2026-08-14"
  last_completed_at: string | null
  notes: string | null // shown in UI as "Description"
  is_archived: boolean
  created_at: string
  updated_at: string
  completions: { completed_at: string }[] // embedded, ascending by completed_at
}

export interface NewRecurringTask {
  name: string
  category_id: string
  interval_days: number
  next_due_at: string
  notes: string | null
}

export interface RecurringTaskCompletion {
  id: string
  task_id: string
  completed_at: string
  note: string | null
  created_at: string
}

export interface GtgExercise {
  id: string
  name: string
  daily_target: number
  created_at: string
}

export interface GtgTargetHistory {
  id: string
  exercise_id: string
  daily_target: number
  effective_from: string
  created_at: string
}

export interface GtgLog {
  id: string
  exercise_id: string
  reps: number
  logged_at: string
  created_at: string
}

export interface HealthDailyMetrics {
  id: string
  logged_at: string
  steps: number | null
  resting_hr: number | null
  sleep_seconds: number | null
  sleep_score: number | null
  active_calories: number | null
  hrv_avg: number | null
  created_at: string
}

export interface RenphoScaleLog {
  id: string
  logged_at: string
  weight_lbs: number
  body_fat_pct: number | null
  muscle_mass_lbs: number | null
  water_pct: number | null
  bmi: number | null
  visceral_fat: number | null
  bone_mass_lbs: number | null
  created_at: string
}

export interface GarminActivity {
  id: string
  activity_type: string
  activity_name: string
  start_time: string
  duration_seconds: number
  calories: number | null
  avg_hr: number | null
  max_hr: number | null
  distance_meters: number | null
  notes: string | null
  created_at: string
}

export interface EightSleepLog {
  id: string
  sleep_date: string
  sleep_score: number | null
  light_sleep_seconds: number | null
  deep_sleep_seconds: number | null
  rem_sleep_seconds: number | null
  awake_seconds: number | null
  toss_and_turns: number | null
  avg_respiratory_rate: number | null
  bedtime_start: string | null
  bedtime_end: string | null
  created_at: string
}

export interface GolfRound {
  id: string
  course_name: string
  played_at: string
  total_holes: number
  total_score: number
  total_par: number
  score_to_par: number
  fairways_hit: number | null
  fairways_total: number | null
  gir_count: number | null
  total_putts: number | null
  longest_drive_yds: number | null
  segment_record: string | null
  notes: string | null
  created_at: string
}

export interface GolfHole {
  id: string
  round_id: string
  hole_number: number
  par: number
  score: number
  putts: number
  fairway_result: 'hit' | 'left' | 'right' | 'n/a'
  gir: boolean
  segment_index: number
  created_at: string
}

export interface GolfShot {
  id: string
  round_id: string
  hole_number: number
  shot_number: number
  club_used: string
  distance_yds: number | null
  intended_shape: 'straight' | 'draw' | 'fade' | 'punch' | null
  actual_shape: 'straight' | 'draw' | 'hook' | 'fade' | 'slice' | 'push' | 'pull' | null
  impact_location: 'center' | 'toe' | 'heel' | 'thin' | 'fat' | null
  lie_type: 'tee' | 'fairway' | 'rough' | 'sand' | 'green' | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

