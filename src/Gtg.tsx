import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type { GtgExercise, GtgLog, GtgTargetHistory } from './types'
import {
  addDaysLocalISO,
  formatDateLong,
  formatDateShort,
  formatDayNum,
  formatWeekdayShort,
  todayLocalISO,
} from './lib/dates'
import { computeExerciseStats, type ExerciseStats } from './lib/gtgStats'

function formatTimeShort(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const QUICK_REPS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100]

function BulletChart({ current, target }: { current: number; target: number }) {
  const maxVal = Math.max(target, current, 1)
  const currentPct = Math.min(100, Math.round((current / maxVal) * 100))
  const targetPct = Math.round((target / maxVal) * 100)
  const isTargetMet = current >= target

  return (
    <div
      className="bullet-chart-container"
      title={`${current} / ${target} reps (${Math.round((current / Math.max(1, target)) * 100)}%)`}
    >
      <div className="bullet-chart-track">
        <div className="bullet-band band-low" style={{ width: `${targetPct * 0.5}%` }} />
        <div className="bullet-band band-mid" style={{ width: `${targetPct * 0.5}%` }} />
        {maxVal > target && (
          <div className="bullet-band band-over" style={{ width: `${100 - targetPct}%` }} />
        )}
        <div
          className={`bullet-measure-bar ${isTargetMet ? 'target-met' : ''}`}
          style={{ width: `${currentPct}%` }}
        />
        <div className="bullet-target-marker" style={{ left: `${targetPct}%` }} />
      </div>
    </div>
  )
}

function DateRibbon({
  selectedDate,
  onSelectDate,
  totalsByDate,
}: {
  selectedDate: string
  onSelectDate: (dateISO: string) => void
  totalsByDate: Map<string, number>
}) {
  const today = todayLocalISO()
  const isToday = selectedDate >= today

  function handleSelectDate(dateISO: string) {
    if (dateISO > today) return
    onSelectDate(dateISO)
  }

  const days: string[] = useMemo(() => {
    const sixDaysBeforeToday = addDaysLocalISO(today, -6)
    if (selectedDate >= sixDaysBeforeToday && selectedDate <= today) {
      const list: string[] = []
      for (let i = 6; i >= 0; i--) {
        list.push(addDaysLocalISO(today, -i))
      }
      return list
    } else {
      const list: string[] = [selectedDate]
      for (let i = 5; i >= 1; i--) {
        list.push(addDaysLocalISO(today, -i))
      }
      list.push(today)
      return list
    }
  }, [selectedDate, today])

  function openDatePicker(e: React.MouseEvent<HTMLInputElement>) {
    try {
      e.currentTarget.showPicker()
    } catch {
      // fallback
    }
  }

  return (
    <div className="date-ribbon-container">
      <div className="date-ribbon-header">
        <div className="date-ribbon-title">
          <span>{formatDateShort(selectedDate > today ? today : selectedDate)}</span>
          {!isToday && (
            <button type="button" className="today-chip-btn" onClick={() => handleSelectDate(today)}>
              Today
            </button>
          )}
        </div>
        <div className="date-ribbon-actions">
          <button
            type="button"
            className="date-nav-btn"
            title="Previous Day"
            onClick={() => handleSelectDate(addDaysLocalISO(selectedDate, -1))}
          >
            ‹
          </button>
          <button
            type="button"
            className="date-nav-btn"
            title="Next Day"
            disabled={selectedDate >= today}
            onClick={() => handleSelectDate(addDaysLocalISO(selectedDate, 1))}
          >
            ›
          </button>
          <label className="date-picker-wrapper">
            <button type="button" className="date-nav-btn" title="Pick Date">
              📅
            </button>
            <input
              type="date"
              className="date-picker-input"
              value={selectedDate}
              max={today}
              onClick={openDatePicker}
              onChange={(e) => e.target.value && handleSelectDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="date-strip">
        {days.map((dISO) => {
          const active = dISO === selectedDate
          const reps = totalsByDate.get(dISO) ?? 0
          const dayLabel = dISO === today ? 'Today' : formatWeekdayShort(dISO)
          const dayNum = formatDayNum(dISO)

          return (
            <button
              key={dISO}
              type="button"
              className={`date-pill ${active ? 'active' : ''}`}
              onClick={() => onSelectDate(dISO)}
            >
              <span className="date-pill-day">{dayLabel}</span>
              <span className="date-pill-num">{dayNum}</span>
              <span className="date-pill-reps">{reps > 0 ? `${reps}r` : '—'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LogRepsPopup({
  exercise,
  selectedDate,
  onCancel,
  onLog,
}: {
  exercise: GtgExercise
  selectedDate: string
  onCancel: () => void
  onLog: (reps: number) => void
}) {
  const [customReps, setCustomReps] = useState('')
  const dateLabel = selectedDate === todayLocalISO() ? 'Today' : formatDateShort(selectedDate)

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Log reps ({dateLabel})</h2>
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
  stats,
  logs,
  targetHistory,
  selectedDate,
  onClose,
  onDeleted,
  onExerciseUpdated,
}: {
  exercise: GtgExercise
  stats: ExerciseStats
  logs: GtgLog[]
  targetHistory: GtgTargetHistory[]
  selectedDate: string
  onClose: () => void
  onDeleted: () => void
  onExerciseUpdated: () => void
}) {
  const [targetInput, setTargetInput] = useState(exercise.daily_target.toString())
  const [effectiveFromInput, setEffectiveFromInput] = useState(todayLocalISO())
  const [savingTarget, setSavingTarget] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setTargetInput(exercise.daily_target.toString())
  }, [exercise.daily_target])

  async function handleSaveTarget(e: FormEvent) {
    e.preventDefault()
    if (!targetInput.trim() || parseInt(targetInput.trim(), 10) <= 0) return

    setSavingTarget(true)
    setErr(null)
    const newTarget = Math.max(1, parseInt(targetInput.trim(), 10))
    const effectiveDate = effectiveFromInput || todayLocalISO()

    // 1. Insert/upsert into gtg_target_history
    const { error: histErr } = await supabase.from('gtg_target_history').upsert({
      exercise_id: exercise.id,
      daily_target: newTarget,
      effective_from: effectiveDate,
    })

    if (histErr) {
      setErr(histErr.message)
      setSavingTarget(false)
      return
    }

    // 2. If effectiveDate <= today, also update gtg_exercises.daily_target
    if (effectiveDate <= todayLocalISO()) {
      await supabase.from('gtg_exercises').update({ daily_target: newTarget }).eq('id', exercise.id)
    }

    setSavingTarget(false)
    onExerciseUpdated()
  }

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

  const selectedDateLogs = logs.filter((l) => l.logged_at === selectedDate)
  const sortedSelectedDateLogs = [...selectedDateLogs].sort((a, b) => b.created_at.localeCompare(a.created_at))

  const sparklineMax = Math.max(
    stats.selectedDateTarget,
    ...stats.last7Days.map((d) => d.reps),
    1
  )

  const dateHeading = selectedDate === todayLocalISO() ? "Today's Sets" : `Sets on ${formatDateShort(selectedDate)}`

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{exercise.name}</h2>
        {err && <div className="error-banner">{err}</div>}

        {/* Bullet Chart Summary */}
        <div className="history-section">
          <h3>Daily Progress (Bullet Chart)</h3>
          <BulletChart current={stats.selectedDateTotal} target={stats.selectedDateTarget} />
          <div className="bullet-legend">
            <span>{stats.selectedDateTotal} / {stats.selectedDateTarget} reps</span>
            <span>Target Line: {stats.selectedDateTarget}</span>
          </div>
        </div>

        {/* Daily Target Update Form */}
        <form className="gtg-target-form" onSubmit={handleSaveTarget}>
          <div className="due-date-label">
            <span>Update Daily Target:</span>
            <input
              type="number"
              min={1}
              required
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
            />
            <span>Effective from:</span>
            <input
              type="date"
              value={effectiveFromInput}
              max={todayLocalISO()}
              onChange={(e) => setEffectiveFromInput(e.target.value)}
            />
            <button type="submit" className="secondary-button small" disabled={savingTarget}>
              {savingTarget ? 'Saving…' : 'Update Target'}
            </button>
          </div>
        </form>

        {/* Overview Stats */}
        <div className="gtg-stats-card">
          <div className="gtg-stat-row">
            <span className="gtg-stat-label">Personal Best</span>
            <span className="gtg-stat-val">
              {stats.personalBest.reps > 0
                ? `${stats.personalBest.reps} reps (${formatDateLong(stats.personalBest.date!)})`
                : 'None yet'}
            </span>
          </div>
          <div className="gtg-stat-row">
            <span className="gtg-stat-label">Streak</span>
            <span className="gtg-stat-val">
              {stats.currentStreak}d (Best: {stats.bestStreak}d)
            </span>
          </div>
          <div className="gtg-stat-row">
            <span className="gtg-stat-label">This Week</span>
            <span className="gtg-stat-val">{stats.thisWeekTotal} reps</span>
          </div>
          <div className="gtg-stat-row">
            <span className="gtg-stat-label">Year to Date</span>
            <span className="gtg-stat-val">{stats.ytdTotal} reps</span>
          </div>
          <div className="gtg-stat-row">
            <span className="gtg-stat-label">Lifetime Total</span>
            <span className="gtg-stat-val">{stats.lifetimeTotal.toLocaleString()} reps</span>
          </div>
        </div>

        {/* Target History Section */}
        {targetHistory.length > 0 && (
          <div className="history-section">
            <h3>Target History</h3>
            <ul className="history-list">
              {targetHistory.map((h) => (
                <li key={h.id} className="log-entry-row">
                  <span className="activity-title">{h.daily_target} reps / day</span>
                  <span className="activity-time">Effective {formatDateShort(h.effective_from)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 7-Day Trend Sparkline */}
        <div className="history-section">
          <h3>7-Day Trend</h3>
          <div className="gtg-sparkline">
            {stats.last7Days.map((d) => {
              const heightPct = Math.round((d.reps / sparklineMax) * 100)
              const metTarget = d.reps >= d.target
              const isSelected = d.dateISO === selectedDate
              return (
                <div key={d.dateISO} className="sparkline-col">
                  <span className="sparkline-val">{d.reps > 0 ? d.reps : ''}</span>
                  <div className="sparkline-bar-container">
                    <div
                      className={`sparkline-bar ${metTarget ? 'target-met' : ''} ${isSelected ? 'selected-day' : ''}`}
                      style={{ height: `${Math.max(heightPct, d.reps > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <span className={`sparkline-lbl ${isSelected ? 'active' : ''}`}>{d.dayLabel}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Date Entries */}
        <div className="history-section">
          <h3>
            {dateHeading} ({stats.selectedDateTotal} reps)
          </h3>
          {sortedSelectedDateLogs.length === 0 ? (
            <p className="empty-state small">No sets logged on this date.</p>
          ) : (
            <ul className="history-list">
              {sortedSelectedDateLogs.map((log) => (
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
        </div>

        <button type="button" className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default function Gtg() {
  const [exercises, setExercises] = useState<GtgExercise[]>([])
  const [allLogs, setAllLogs] = useState<GtgLog[]>([])
  const [targetHistoryList, setTargetHistoryList] = useState<GtgTargetHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(todayLocalISO())

  const [loggingExercise, setLoggingExercise] = useState<GtgExercise | null>(null)
  const [detailExercise, setDetailExercise] = useState<GtgExercise | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('20')

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr))
    }, 4000)
  }

  async function loadExercises() {
    const { data, error } = await supabase.from('gtg_exercises').select('*').order('created_at')
    if (!error) setExercises((data ?? []) as GtgExercise[])
  }

  async function loadAllLogs() {
    const { data, error } = await supabase
      .from('gtg_logs')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setAllLogs((data ?? []) as GtgLog[])
  }

  async function loadTargetHistory() {
    const { data, error } = await supabase
      .from('gtg_target_history')
      .select('*')
      .order('effective_from', { ascending: true })
    if (!error) setTargetHistoryList((data ?? []) as GtgTargetHistory[])
  }

  async function loadInitialData() {
    setLoading(true)
    setError(null)
    await Promise.all([loadExercises(), loadAllLogs(), loadTargetHistory()])
    setLoading(false)
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  const totalsByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of allLogs) {
      map.set(log.logged_at, (map.get(log.logged_at) ?? 0) + log.reps)
    }
    return map
  }, [allLogs])

  const targetHistoryByExercise = useMemo(() => {
    const map = new Map<string, GtgTargetHistory[]>()
    for (const h of targetHistoryList) {
      const existing = map.get(h.exercise_id) ?? []
      existing.push(h)
      map.set(h.exercise_id, existing)
    }
    return map
  }, [targetHistoryList])

  const statsByExercise = useMemo(() => {
    const today = todayLocalISO()
    const map = new Map<string, ExerciseStats>()
    for (const ex of exercises) {
      const exLogs = allLogs.filter((l) => l.exercise_id === ex.id)
      const exHistory = targetHistoryByExercise.get(ex.id) ?? []
      map.set(ex.id, computeExerciseStats(exLogs, ex.daily_target, today, selectedDate, exHistory))
    }
    return map
  }, [exercises, allLogs, selectedDate, targetHistoryByExercise])

  async function logReps(exercise: GtgExercise, reps: number) {
    setLoggingExercise(null)
    const today = todayLocalISO()
    const exHistory = targetHistoryByExercise.get(exercise.id) ?? []

    const oldStats = statsByExercise.get(exercise.id) ?? computeExerciseStats([], exercise.daily_target, today, selectedDate, exHistory)

    const newLog: GtgLog = {
      id: `optimistic-${Date.now()}`,
      exercise_id: exercise.id,
      reps,
      logged_at: selectedDate,
      created_at: new Date().toISOString(),
    }

    const exLogs = allLogs.filter((l) => l.exercise_id === exercise.id)
    const newStats = computeExerciseStats([...exLogs, newLog], exercise.daily_target, today, selectedDate, exHistory)

    // Check PB milestone
    if (newStats.personalBest.reps > oldStats.personalBest.reps && oldStats.personalBest.reps > 0) {
      showToast(`🎉 New Personal Best! ${newStats.personalBest.reps} reps in a single day!`)
    } else if (
      Math.floor(newStats.lifetimeTotal / 1000) > Math.floor(oldStats.lifetimeTotal / 1000) &&
      oldStats.lifetimeTotal > 0
    ) {
      const thousandCount = Math.floor(newStats.lifetimeTotal / 1000) * 1000
      showToast(`🔥 Milestone reached! ${thousandCount.toLocaleString()} lifetime reps on ${exercise.name}!`)
    }

    setAllLogs((prev) => [...prev, newLog])

    const { error } = await supabase
      .from('gtg_logs')
      .insert({ exercise_id: exercise.id, reps, logged_at: selectedDate })

    if (error) setError(error.message)
    loadAllLogs()
  }

  async function addExercise(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newTarget.trim()) return

    const targetVal = Math.max(1, parseInt(newTarget.trim(), 10))

    // 1. Insert exercise with mandatory daily_target
    const { data: exData, error: exErr } = await supabase
      .from('gtg_exercises')
      .insert({ name: newName.trim(), daily_target: targetVal })
      .select()
      .single()

    if (exErr) {
      setError(exErr.message)
      return
    }

    if (exData) {
      // 2. Insert initial target history
      await supabase.from('gtg_target_history').insert({
        exercise_id: exData.id,
        daily_target: targetVal,
        effective_from: todayLocalISO(),
      })
    }

    setNewName('')
    setNewTarget('20')
    setShowAddForm(false)
    loadExercises()
    loadTargetHistory()
  }

  const isTodaySelected = selectedDate === todayLocalISO()

  return (
    <div className="gtg">
      {toastMessage && <div className="toast-banner">{toastMessage}</div>}

      <header className="page-header">
        <h1>Grease the Groove</h1>
        <p className="subtitle">Daily micro-workouts — outside the core 3-day hypertrophy routine.</p>
      </header>

      {/* Visual Date Ribbon */}
      <DateRibbon
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        totalsByDate={totalsByDate}
      />

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : exercises.length === 0 ? (
        <p className="empty-state">Nothing here yet — add your first exercise below.</p>
      ) : (
        <ul className="task-list compact">
          {exercises.map((exercise) => {
            const exHistory = targetHistoryByExercise.get(exercise.id) ?? []
            const stats = statsByExercise.get(exercise.id) ?? computeExerciseStats([], exercise.daily_target, todayLocalISO(), selectedDate, exHistory)
            const dateSuffix = isTodaySelected ? 'today' : `on ${formatDateShort(selectedDate)}`

            return (
              <li key={exercise.id} className="task-card compact" onClick={() => setDetailExercise(exercise)}>
                <div className="task-info" style={{ width: '100%' }}>
                  <div className="gtg-card-header">
                    <span className="task-name">{exercise.name}</span>
                    {stats.currentStreak > 0 && (
                      <span className="streak-badge" title={`Streak: ${stats.currentStreak}d`}>
                        🔥 {stats.currentStreak}d
                      </span>
                    )}
                  </div>
                  <div className="task-meta">
                    <span className="gtg-total">
                      {stats.selectedDateTotal} / {stats.selectedDateTarget} reps {dateSuffix}
                    </span>
                  </div>

                  {/* Stephen Few Bullet Chart */}
                  <BulletChart current={stats.selectedDateTotal} target={stats.selectedDateTarget} />
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
          <div className="interval-label">
            <span>Daily target:</span>
            <input
              type="number"
              min={1}
              placeholder="Daily target (e.g. 20)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button">
              Add Exercise
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
          selectedDate={selectedDate}
          onCancel={() => setLoggingExercise(null)}
          onLog={(reps) => logReps(loggingExercise, reps)}
        />
      )}

      {detailExercise && (
        <ExerciseDetailModal
          exercise={exercises.find((e) => e.id === detailExercise.id) ?? detailExercise}
          stats={statsByExercise.get(detailExercise.id) ?? computeExerciseStats([], detailExercise.daily_target, todayLocalISO(), selectedDate, targetHistoryByExercise.get(detailExercise.id) ?? [])}
          logs={allLogs.filter((l) => l.exercise_id === detailExercise.id)}
          targetHistory={targetHistoryByExercise.get(detailExercise.id) ?? []}
          selectedDate={selectedDate}
          onClose={() => setDetailExercise(null)}
          onDeleted={() => loadAllLogs()}
          onExerciseUpdated={() => {
            loadExercises()
            loadAllLogs()
            loadTargetHistory()
          }}
        />
      )}
    </div>
  )
}
