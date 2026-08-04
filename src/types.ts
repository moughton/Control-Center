export interface RecurringTask {
  id: string
  name: string
  category: string | null
  interval_days: number
  next_due_at: string // date, e.g. "2026-08-14"
  last_completed_at: string | null
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface NewRecurringTask {
  name: string
  category: string | null
  interval_days: number
  next_due_at: string
}
