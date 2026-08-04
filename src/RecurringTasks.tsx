import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type { RecurringTask } from './types'

// Local-date helpers. Deliberately NOT using toISOString() for date-only values —
// that converts to UTC, which drifts the date by ±1 depending on timezone/time-of-day
// relative to local midnight. Everything here stays in local calendar terms throughout.
function todayLocalISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDaysLocalISO(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function daysFromToday(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function dueLabel(days: number): { text: string; className: string } {
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, className: 'due overdue' }
  if (days === 0) return { text: 'Due today', className: 'due today' }
  if (days === 1) return { text: 'Due tomorrow', className: 'due soon' }
  return { text: `Due in ${days}d`, className: 'due upcoming' }
}

export default function RecurringTasks() {
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newInterval, setNewInterval] = useState(30)
  const [newDueDate, setNewDueDate] = useState('') // optional override; blank = today + interval

  async function loadTasks() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('recurring_tasks')
      .select('*')
      .eq('is_archived', false)
      .order('next_due_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function markDone(task: RecurringTask) {
    const today = todayLocalISO()
    const nextDueStr = addDaysLocalISO(today, task.interval_days)

    // Optimistic update so the tap feels instant
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, last_completed_at: today, next_due_at: nextDueStr } : t
      )
    )

    const [updateResult, insertResult] = await Promise.all([
      supabase
        .from('recurring_tasks')
        .update({ last_completed_at: today, next_due_at: nextDueStr })
        .eq('id', task.id),
      supabase.from('recurring_task_completions').insert({ task_id: task.id, completed_at: today }),
    ])

    if (updateResult.error || insertResult.error) {
      setError(updateResult.error?.message ?? insertResult.error?.message ?? 'Failed to mark done')
      loadTasks() // revert optimistic update by re-fetching real state
    } else {
      loadTasks() // re-sort by the new next_due_at
    }
  }

  async function addTask(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim() || newInterval <= 0) return

    // Default: "starting now, first due in N days" — not "due today" regardless of
    // interval, which made no sense for a freshly created task. An explicit initial
    // due date, if given, always wins.
    const initialDueDate = newDueDate || addDaysLocalISO(todayLocalISO(), newInterval)

    const { error } = await supabase.from('recurring_tasks').insert({
      name: newName.trim(),
      category: newCategory.trim() || null,
      interval_days: newInterval,
      next_due_at: initialDueDate,
    })

    if (error) {
      setError(error.message)
      return
    }

    setNewName('')
    setNewCategory('')
    setNewInterval(30)
    setNewDueDate('')
    setShowAddForm(false)
    loadTasks()
  }

  return (
    <div className="recurring-tasks">
      <header className="page-header">
        <h1>Recurring Tasks</h1>
        <p className="subtitle">Interval-based tasks with no fixed date — the "Regularly" replacement.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="empty-state">Nothing here yet — add your first recurring task below.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            const label = dueLabel(daysFromToday(task.next_due_at))
            return (
              <li key={task.id} className="task-card">
                <div className="task-info">
                  <span className="task-name">{task.name}</span>
                  {task.category && <span className="task-category">{task.category}</span>}
                  <span className={label.className}>{label.text}</span>
                </div>
                <button type="button" className="done-button" onClick={() => markDone(task)}>
                  ✓ Done
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showAddForm ? (
        <form className="add-form" onSubmit={addTask}>
          <input
            type="text"
            placeholder="Task name (e.g. Change air filter)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            required
          />
          <input
            type="text"
            placeholder="Category (optional, e.g. home-maintenance)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <label className="interval-label">
            Every
            <input
              type="number"
              min={1}
              value={newInterval}
              onChange={(e) => setNewInterval(Number(e.target.value))}
              required
            />
            days
          </label>
          <label className="due-date-label">
            First due
            <input
              type="date"
              value={newDueDate}
              min={todayLocalISO()}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <span className="due-date-hint">
              {newDueDate
                ? ''
                : `optional — defaults to ${newInterval}d from today`}
            </span>
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-button">Add</button>
            <button type="button" className="secondary-button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="add-button" onClick={() => setShowAddForm(true)}>
          + Add recurring task
        </button>
      )}
    </div>
  )
}
