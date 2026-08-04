import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type { GarminActivity, HealthDailyMetrics } from './types'
import { formatDateShort } from './lib/dates'

function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} mins`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function metersToMiles(meters: number | null): string {
  if (!meters || meters <= 0) return ''
  const miles = meters / 1609.34
  if (miles < 0.2) return `${Math.round(meters)}m`
  return `${miles.toFixed(2)} mi`
}

function getActivityIcon(type: string, name: string): string {
  const lower = (type + ' ' + name).toLowerCase()
  if (lower.includes('plunge') || lower.includes('water') || lower.includes('swim')) return '🏊'
  if (lower.includes('golf')) return '⛳'
  if (lower.includes('run')) return '🏃'
  if (lower.includes('cycle') || lower.includes('bike')) return '🚴'
  if (lower.includes('strength') || lower.includes('weight')) return '🏋️'
  return '⌚'
}

type FilterType = 'all' | 'plunge' | 'golf' | 'running'

export default function Garmin() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyMetrics, setDailyMetrics] = useState<HealthDailyMetrics[]>([])
  const [activities, setActivities] = useState<GarminActivity[]>([])
  const [filter, setFilter] = useState<FilterType>('all')

  const [showLogModal, setShowLogModal] = useState(false)
  const [actName, setActName] = useState('')
  const [actType, setActType] = useState('open_water_swimming')
  const [durationMins, setDurationMins] = useState('')
  const [caloriesInput, setCaloriesInput] = useState('')
  const [avgHrInput, setAvgHrInput] = useState('')
  const [notesInput, setNotesInput] = useState('')

  async function loadData() {
    setLoading(true)
    setError(null)
    const [metricsRes, actRes] = await Promise.all([
      supabase.from('health_daily_metrics').select('*').order('logged_at', { ascending: false }).limit(30),
      supabase.from('garmin_activities').select('*').order('start_time', { ascending: false }),
    ])

    if (metricsRes.error) setError(metricsRes.error.message)
    else setDailyMetrics((metricsRes.data ?? []) as HealthDailyMetrics[])

    if (actRes.error) setError(actRes.error.message)
    else setActivities((actRes.data ?? []) as GarminActivity[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredActivities = useMemo(() => {
    if (filter === 'plunge') return activities.filter((a) => a.activity_name.toLowerCase().includes('plunge') || a.activity_type.includes('swim'))
    if (filter === 'golf') return activities.filter((a) => a.activity_type === 'golf' || a.activity_name.toLowerCase().includes('golf'))
    if (filter === 'running') return activities.filter((a) => a.activity_type === 'running')
    return activities
  }, [activities, filter])

  const latestMetrics = dailyMetrics[0]

  async function handleAddActivity(e: FormEvent) {
    e.preventDefault()
    if (!actName.trim() || !durationMins.trim()) return

    const durSec = Math.max(1, parseInt(durationMins.trim(), 10) * 60)
    const cal = caloriesInput.trim() ? parseInt(caloriesInput.trim(), 10) : null
    const hr = avgHrInput.trim() ? parseInt(avgHrInput.trim(), 10) : null

    const { error } = await supabase.from('garmin_activities').insert({
      activity_type: actType,
      activity_name: actName.trim(),
      start_time: new Date().toISOString(),
      duration_seconds: durSec,
      calories: cal,
      avg_hr: hr,
      notes: notesInput.trim() || null,
    })

    if (error) {
      setError(error.message)
      return
    }

    setActName('')
    setDurationMins('')
    setCaloriesInput('')
    setAvgHrInput('')
    setNotesInput('')
    setShowLogModal(false)
    loadData()
  }

  return (
    <div className="garmin-facet">
      <header className="page-header">
        <h1>Garmin Connect</h1>
        <p className="subtitle">Daily activity, HRV, and logged activities (Cold Plunges, Golf, Runs).</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading Garmin metrics…</p>
      ) : (
        <>
          {/* Daily Wearable Metrics Overview */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <span className="kpi-label">Steps Today</span>
              <span className="kpi-value">{latestMetrics?.steps ? latestMetrics.steps.toLocaleString() : '—'}</span>
              <span className="kpi-sub">Daily step count</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Resting HR</span>
              <span className="kpi-value">{latestMetrics?.resting_hr ? `${latestMetrics.resting_hr} bpm` : '—'}</span>
              <span className="kpi-sub">{latestMetrics?.hrv_avg ? `HRV: ${latestMetrics.hrv_avg} ms` : 'Resting heartbeat'}</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Active Calories</span>
              <span className="kpi-value">{latestMetrics?.active_calories ? `${latestMetrics.active_calories} kcal` : '—'}</span>
              <span className="kpi-sub">Garmin burn</span>
            </div>
          </div>

          {/* Activities Section */}
          <section className="analytics-section">
            <div className="gtg-card-header">
              <h2>Garmin Logged Activities</h2>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setShowLogModal(true)}
              >
                + Log Activity
              </button>
            </div>

            {/* Filter Chips */}
            <div className="filter-chips" style={{ marginTop: '8px' }}>
              <button
                type="button"
                className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Activities ({activities.length})
              </button>
              <button
                type="button"
                className={`filter-chip ${filter === 'plunge' ? 'active' : ''}`}
                onClick={() => setFilter('plunge')}
              >
                🏊 Cold Plunges
              </button>
              <button
                type="button"
                className={`filter-chip ${filter === 'golf' ? 'active' : ''}`}
                onClick={() => setFilter('golf')}
              >
                ⛳ Golf
              </button>
              <button
                type="button"
                className={`filter-chip ${filter === 'running' ? 'active' : ''}`}
                onClick={() => setFilter('running')}
              >
                🏃 Running
              </button>
            </div>

            {filteredActivities.length === 0 ? (
              <p className="empty-state small">No activities logged under this filter.</p>
            ) : (
              <ul className="history-list">
                {filteredActivities.map((act) => {
                  const icon = getActivityIcon(act.activity_type, act.activity_name)
                  const distStr = metersToMiles(act.distance_meters)

                  return (
                    <li key={act.id} className="log-entry-row">
                      <div>
                        <span className="activity-title">
                          {icon} {act.activity_name} ({formatDuration(act.duration_seconds)})
                        </span>
                        <span className="activity-sub">
                          {act.calories ? `${act.calories} kcal` : ''}{' '}
                          {act.avg_hr ? `· ${act.avg_hr} bpm avg HR` : ''}{' '}
                          {distStr ? `· ${distStr}` : ''}{' '}
                          {act.notes ? `(${act.notes})` : ''}
                        </span>
                      </div>
                      <span className="activity-time">{act.start_time ? formatDateShort(act.start_time.slice(0, 10)) : ''}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="modal-backdrop" onClick={() => setShowLogModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Log Garmin Activity</h2>
            <form className="add-form" onSubmit={handleAddActivity}>
              <div className="interval-label">
                <span>Activity Name:</span>
                <input
                  type="text"
                  placeholder="e.g. 5°C Cold Plunge or 18-Hole Golf"
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="interval-label">
                <span>Activity Type:</span>
                <select value={actType} onChange={(e) => setActType(e.target.value)}>
                  <option value="open_water_swimming">Open Water (Cold Plunge)</option>
                  <option value="golf">Golf</option>
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="strength_training">Strength Training</option>
                </select>
              </div>
              <div className="interval-label">
                <span>Duration (minutes):</span>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 8"
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  required
                />
              </div>
              <div className="interval-label">
                <span>Calories Burned:</span>
                <input
                  type="number"
                  placeholder="e.g. 85"
                  value={caloriesInput}
                  onChange={(e) => setCaloriesInput(e.target.value)}
                />
              </div>
              <div className="interval-label">
                <span>Avg Heart Rate (bpm):</span>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  value={avgHrInput}
                  onChange={(e) => setAvgHrInput(e.target.value)}
                />
              </div>
              <div className="interval-label">
                <span>Notes:</span>
                <input
                  type="text"
                  placeholder="e.g. Outdoor Cold Water Exposure"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Save Activity
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowLogModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
