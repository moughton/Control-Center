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
  created_at: string
}

export interface GtgLog {
  id: string
  exercise_id: string
  reps: number
  logged_at: string
  created_at: string
}
