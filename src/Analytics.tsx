import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import type { GtgExercise, GtgLog, RecurringTask, TaskCategory } from './types'
import { addDaysLocalISO, formatDateShort, todayLocalISO } from './lib/dates'
import { computeExerciseStats } from './lib/gtgStats'

type TimeRange = '7d' | '30d' | 'ytd' | 'all'

interface TaskCompletionWithTask {
  id: string
  task_id: string
  completed_at: string
  created_at: string
  task_name?: string
  category_name?: string
  category_color?: string
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  const [gtgExercises, setGtgExercises] = useState<GtgExercise[]>([])
  const [gtgLogs, setGtgLogs] = useState<GtgLog[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletionWithTask[]>([])

  async function loadData() {
    setLoading(true)
    setError(null)

    const [exRes, logsRes, tasksRes, catRes, compRes] = await Promise.all([
      supabase.from('gtg_exercises').select('*').order('created_at'),
      supabase.from('gtg_logs').select('*').order('created_at', { ascending: false }),
      supabase.from('recurring_tasks').select('*, category:task_categories(*)'),
      supabase.from('task_categories').select('*'),
      supabase.from('recurring_task_completions').select('*').order('created_at', { ascending: false }),
    ])

    if (exRes.error) setError(exRes.error.message)
    else setGtgExercises((exRes.data ?? []) as GtgExercise[])

    if (logsRes.error) setError(logsRes.error.message)
    else setGtgLogs((logsRes.data ?? []) as GtgLog[])

    if (catRes.error) setError(catRes.error.message)

    if (compRes.error) setError(compRes.error.message)

    if (catRes.data && tasksRes.data && compRes.data) {
      setCategories((catRes.data ?? []) as TaskCategory[])

      const taskMap = new Map<string, { name: string; category?: TaskCategory }>()
      for (const t of (tasksRes.data ?? []) as RecurringTask[]) {
        taskMap.set(t.id, { name: t.name, category: t.category })
      }

      const enriched = ((compRes.data ?? []) as { id: string; task_id: string; completed_at: string; created_at: string }[]).map((c) => {
        const info = taskMap.get(c.task_id)
        return {
          ...c,
          task_name: info?.name ?? 'Unknown task',
          category_name: info?.category?.name ?? 'Uncategorized',
          category_color: info?.category?.color ?? 'var(--accent)',
        }
      })
      setTaskCompletions(enriched)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const today = todayLocalISO()

  // Start date ISO based on time range
  const startDateISO = useMemo(() => {
    if (timeRange === '7d') return addDaysLocalISO(today, -6)
    if (timeRange === '30d') return addDaysLocalISO(today, -29)
    if (timeRange === 'ytd') return `${today.slice(0, 4)}-01-01`
    return '1970-01-01'
  }, [timeRange, today])

  // Filtered GTG logs
  const filteredGtgLogs = useMemo(() => {
    return gtgLogs.filter((l) => l.logged_at >= startDateISO)
  }, [gtgLogs, startDateISO])

  // Filtered Task completions (completed_at date string, e.g. "2026-08-04" or ISO timestamp)
  const filteredCompletions = useMemo(() => {
    return taskCompletions.filter((c) => {
      const dateStr = c.completed_at ? c.completed_at.slice(0, 10) : (c.created_at ? c.created_at.slice(0, 10) : '')
      return dateStr >= startDateISO
    })
  }, [taskCompletions, startDateISO])

  // Total GTG Volume & Task Completions in range
  const totalReps = useMemo(() => {
    return filteredGtgLogs.reduce((sum, l) => sum + l.reps, 0)
  }, [filteredGtgLogs])

  const totalCompletions = filteredCompletions.length

  // Reps per exercise breakdown
  const repsByExercise = useMemo(() => {
    const map = new Map<string, number>()
    for (const log of filteredGtgLogs) {
      map.set(log.exercise_id, (map.get(log.exercise_id) ?? 0) + log.reps)
    }
    return gtgExercises
      .map((ex) => ({
        exercise: ex,
        reps: map.get(ex.id) ?? 0,
      }))
      .sort((a, b) => b.reps - a.reps)
  }, [filteredGtgLogs, gtgExercises])

  // Task completions by category breakdown
  const completionsByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const comp of filteredCompletions) {
      const catName = comp.category_name ?? 'Uncategorized'
      map.set(catName, (map.get(catName) ?? 0) + 1)
    }
    return categories.map((cat) => ({
      category: cat,
      count: map.get(cat.name) ?? 0,
    })).sort((a, b) => b.count - a.count)
  }, [filteredCompletions, categories])

  // GTG Stats per exercise
  const exerciseStatsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeExerciseStats>>()
    for (const ex of gtgExercises) {
      const exLogs = gtgLogs.filter((l) => l.exercise_id === ex.id)
      map.set(ex.id, computeExerciseStats(exLogs, ex.daily_target, today))
    }
    return map
  }, [gtgExercises, gtgLogs, today])

  // Active streaks count
  const activeStreaksCount = useMemo(() => {
    let count = 0
    for (const stats of exerciseStatsMap.values()) {
      if (stats.currentStreak > 0) count++
    }
    return count
  }, [exerciseStatsMap])

  // Recent timeline feed (combined GTG logs & Task completions)
  const combinedTimeline = useMemo(() => {
    const items: {
      id: string
      type: 'gtg' | 'task'
      title: string
      subtitle: string
      timestamp: string
      color?: string
    }[] = []

    for (const l of gtgLogs.slice(0, 20)) {
      const ex = gtgExercises.find((e) => e.id === l.exercise_id)
      items.push({
        id: `gtg-${l.id}`,
        type: 'gtg',
        title: `${l.reps} reps logged`,
        subtitle: ex?.name ?? 'GTG Exercise',
        timestamp: l.created_at,
      })
    }

    for (const c of taskCompletions.slice(0, 20)) {
      items.push({
        id: `task-${c.id}`,
        type: 'task',
        title: `Completed: ${c.task_name}`,
        subtitle: c.category_name ?? 'Task',
        timestamp: c.created_at,
        color: c.category_color,
      })
    }

    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 15)
  }, [gtgLogs, gtgExercises, taskCompletions])

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1>Analytics & Insights</h1>
        <p className="subtitle">Consolidated tracking across GTG workouts and recurring tasks.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* Time Range Selector */}
      <div className="filter-chips">
        <button
          type="button"
          className={`filter-chip ${timeRange === '7d' ? 'active' : ''}`}
          onClick={() => setTimeRange('7d')}
        >
          7 Days
        </button>
        <button
          type="button"
          className={`filter-chip ${timeRange === '30d' ? 'active' : ''}`}
          onClick={() => setTimeRange('30d')}
        >
          30 Days
        </button>
        <button
          type="button"
          className={`filter-chip ${timeRange === 'ytd' ? 'active' : ''}`}
          onClick={() => setTimeRange('ytd')}
        >
          Year to Date
        </button>
        <button
          type="button"
          className={`filter-chip ${timeRange === 'all' ? 'active' : ''}`}
          onClick={() => setTimeRange('all')}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <p className="empty-state">Loading metrics…</p>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <span className="kpi-label">GTG Reps</span>
              <span className="kpi-value">{totalReps.toLocaleString()}</span>
              <span className="kpi-sub">In selected period</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Tasks Done</span>
              <span className="kpi-value">{totalCompletions}</span>
              <span className="kpi-sub">Completions</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Active Streaks</span>
              <span className="kpi-value">🔥 {activeStreaksCount}</span>
              <span className="kpi-sub">Exercises meeting target</span>
            </div>
          </div>

          {/* GTG Volume Breakdown */}
          <section className="analytics-section">
            <h2>GTG Rep Volume</h2>
            {repsByExercise.length === 0 ? (
              <p className="empty-state small">No exercise logs found.</p>
            ) : (
              <div className="analytics-bar-list">
                {repsByExercise.map(({ exercise, reps }) => {
                  const maxReps = Math.max(...repsByExercise.map((r) => r.reps), 1)
                  const pct = Math.round((reps / maxReps) * 100)
                  const stats = exerciseStatsMap.get(exercise.id)

                  return (
                    <div key={exercise.id} className="analytics-bar-item">
                      <div className="analytics-bar-label-row">
                        <span className="analytics-bar-title">{exercise.name}</span>
                        <span className="analytics-bar-val">
                          {reps.toLocaleString()} reps {stats?.currentStreak ? `(🔥 ${stats.currentStreak}d)` : ''}
                        </span>
                      </div>
                      <div className="gtg-progress-bar">
                        <div className="gtg-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Recurring Tasks Breakdown */}
          <section className="analytics-section">
            <h2>Task Completions by Category</h2>
            {completionsByCategory.length === 0 ? (
              <p className="empty-state small">No task completions recorded yet.</p>
            ) : (
              <div className="analytics-bar-list">
                {completionsByCategory.map(({ category, count }) => {
                  const maxCount = Math.max(...completionsByCategory.map((c) => c.count), 1)
                  const pct = Math.round((count / maxCount) * 100)

                  return (
                    <div key={category.id} className="analytics-bar-item">
                      <div className="analytics-bar-label-row">
                        <span className="category-pill" style={{ '--cat-color': category.color } as React.CSSProperties}>
                          {category.name}
                        </span>
                        <span className="analytics-bar-val">{count} completed</span>
                      </div>
                      <div className="gtg-progress-bar">
                        <div
                          className="gtg-progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: category.color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Activity Timeline Feed */}
          <section className="analytics-section">
            <h2>Recent Activity Feed</h2>
            {combinedTimeline.length === 0 ? (
              <p className="empty-state small">No recent activity.</p>
            ) : (
              <ul className="history-list">
                {combinedTimeline.map((item) => (
                  <li key={item.id} className="log-entry-row">
                    <div className="activity-item-info">
                      <span className="activity-title">{item.title}</span>
                      <span className="activity-sub">{item.subtitle}</span>
                    </div>
                    <span className="activity-time">{item.timestamp ? formatDateShort(item.timestamp.slice(0, 10)) : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
