import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type { GtgExercise, GtgLog } from './types'

// Same local-date convention as RecurringTasks — avoid UTC-based date strings.
function todayLocalISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTimeShort(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const QUICK_REPS = [5, 10, 15, 20, 25, 30]

function LogRepsPopup({
  exercise,
  onCancel,
  onLog,
}: {
  exercise: GtgExercise
  onCancel: () => void
  onLog: (reps: number) => void
}) {
  const [customReps, setCustomReps] = useState('')

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Log reps</h2>
        <p className="modal-task-name">{exercise.name}</p>
        <div className="quick-reps">
          {QUICK_REPS.map((n) => (
            <button key={n} type="button" className="quick-rep-button" onClick={() => onLog(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="custom-reps-row">
          <input
            type="number"
            min={1}
            placeholder="Custom"
            value={customReps}
            onChange={(e) => setCustomReps(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="primary-button"
            disabled={!customReps || Number(customReps) <= 0}
            onClick={() => onLog(Number(customReps))}
          >
            Log
          </button>
        </div>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function ExerciseDetailModal({
  exercise,
  logs,
  onClose,
  onDeleted,
}: {
  exercise: GtgExercise
  logs: GtgLog[]
  onClose: () => void
  onDeleted: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function deleteLog(id: string) {
    setDeletingId(id)
    setErr(null)
    const { error } = await supabase.from('gtg_logs').delete().eq('id', id)
    setDeletingId(null)
    if (error) {
      setErr(error.message)
      return
    }
    onDeleted()
  }

  const sorted = [...logs].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const total = logs.reduce((sum, l) => sum + l.reps, 0)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{exercise.name}</h2>
        <p className="modal-task-name">{total} reps today</p>
        {err && <div className="error-banner">{err}</div>}
        {sorted.length === 0 ? (
          <p className="empty-state small">No sets logged today yet.</p>
        ) : (
          <ul className="history-list">
            {sorted.map((log) => (
              <li key={log.id} className="log-entry-row">
                <span>
                  {log.reps} reps · {formatTimeShort(log.created_at)}
                </span>
                <button
                  type="button"
                  className="danger-link"
                  onClick={() => deleteLog(log.id)}
                  disabled={deletingId === log.id}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default function Gtg() {
  const [exercises, setExercises] = useState<GtgExercise[]>([])
  const [todayLogs, setTodayLogs] = useState<GtgLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [loggingExercise, setLoggingExercise] = useState<GtgExercise | null>(null)
  const [detailExercise, setDetailExercise] = useState<GtgExercise | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')

  async function loadExercises() {
    const { data, error } = await supabase.from('gtg_exercises').select('*').order('created_at')
    if (!error) setExercises((data ?? []) as GtgExercise[])
  }

  async function loadTodayLogs() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('gtg_logs')
      .select('*')
      .eq('logged_at', todayLocalISO())
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setTodayLogs((data ?? []) as GtgLog[])
    setLoading(false)
  }

  useEffect(() => {
    loadExercises()
    loadTodayLogs()
  }, [])

  const totalsByExercise = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of todayLogs) {
      map.set(log.exercise_id, (map.get(log.exercise_id) ?? 0) + log.reps)
    }
    return map
  }, [todayLogs])

  async function logReps(exercise: GtgExercise, reps: number) {
    setLoggingExercise(null)

    // Optimistic entry so the tap feels instant; loadTodayLogs() below replaces it
    // with the real row (real id) once the insert confirms.
    setTodayLogs((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        exercise_id: exercise.id,
        reps,
        logged_at: todayLocalISO(),
        created_at: new Date().toISOString(),
      },
    ])

    const { error } = await supabase
      .from('gtg_logs')
      .insert({ exercise_id: exercise.id, reps, logged_at: todayLocalISO() })

    if (error) setError(error.message)
    loadTodayLogs()
  }

  async function addExercise(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    const { error } = await supabase.from('gtg_exercises').insert({ name: newName.trim() })

    if (error) {
      setError(error.message)
      return
    }

    setNewName('')
    setShowAddForm(false)
    loadExercises()
  }

  return (
    <div className="gtg">
      <header className="page-header">
        <h1>Grease the Groove</h1>
        <p className="subtitle">Daily micro-workouts — outside the core 3-day hypertrophy routine.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : exercises.length === 0 ? (
        <p className="empty-state">Nothing here yet — add your first exercise below.</p>
      ) : (
        <ul className="task-list compact">
          {exercises.map((exercise) => {
            const total = totalsByExercise.get(exercise.id) ?? 0
            return (
              <li key={exercise.id} className="task-card compact" onClick={() => setDetailExercise(exercise)}>
                <div className="task-info">
                  <span className="task-name">{exercise.name}</span>
                  <div className="task-meta">
                    <span className="gtg-total">{total} reps today</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="done-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLoggingExercise(exercise)
                  }}
                >
                  + Log
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showAddForm ? (
        <form className="add-form" onSubmit={addExercise}>
          <input
            type="text"
            placeholder="Exercise name (e.g. Squats)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            required
          />
          <div className="form-actions">
            <button type="submit" className="primary-button">
              Add
            </button>
            <button type="button" className="secondary-button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="add-button" onClick={() => setShowAddForm(true)}>
          + Add exercise
        </button>
      )}

      {loggingExercise && (
        <LogRepsPopup
          exercise={loggingExercise}
          onCancel={() => setLoggingExercise(null)}
          onLog={(reps) => logReps(loggingExercise, reps)}
        />
      )}

      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          logs={todayLogs.filter((l) => l.exercise_id === detailExercise.id)}
          onClose={() => setDetailExercise(null)}
          onDeleted={() => loadTodayLogs()}
        />
      )}
    </div>
  )
}
