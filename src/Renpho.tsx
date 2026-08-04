import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type { RenphoScaleLog } from './types'
import { formatDateShort } from './lib/dates'

export default function Renpho() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scaleLogs, setScaleLogs] = useState<RenphoScaleLog[]>([])

  const [showLogModal, setShowLogModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [bodyFatInput, setBodyFatInput] = useState('')
  const [muscleMassInput, setMuscleMassInput] = useState('')

  async function loadData() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('renpho_scale_logs')
      .select('*')
      .order('logged_at', { ascending: false })

    if (error) setError(error.message)
    else setScaleLogs((data ?? []) as RenphoScaleLog[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = scaleLogs[0]
  const previous = scaleLogs[1]
  const weightChange = latest && previous ? (latest.weight_lbs - previous.weight_lbs).toFixed(1) : null

  async function handleAddLog(e: FormEvent) {
    e.preventDefault()
    if (!weightInput.trim()) return

    const weightLbs = parseFloat(weightInput.trim())
    const bodyFat = bodyFatInput.trim() ? parseFloat(bodyFatInput.trim()) : null
    const muscleLbs = muscleMassInput.trim() ? parseFloat(muscleMassInput.trim()) : null

    // Estimate BMI assuming 5'10"
    const bmi = roundVal((weightLbs / (70 * 70)) * 703, 1)

    const { error } = await supabase.from('renpho_scale_logs').insert({
      logged_at: new Date().toISOString(),
      weight_lbs: weightLbs,
      body_fat_pct: bodyFat,
      muscle_mass_lbs: muscleLbs,
      bmi: bmi,
    })

    if (error) {
      setError(error.message)
      return
    }

    setWeightInput('')
    setBodyFatInput('')
    setMuscleMassInput('')
    setShowLogModal(false)
    loadData()
  }

  function roundVal(val: number, decimals = 1): number {
    return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  return (
    <div className="renpho-facet">
      <header className="page-header">
        <h1>Renpho Smart Scale</h1>
        <p className="subtitle">Body composition and weight tracking in pounds (lbs).</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading scale metrics…</p>
      ) : (
        <>
          {/* Top KPI Grid */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <span className="kpi-label">Weight</span>
              <span className="kpi-value">{latest ? `${latest.weight_lbs} lbs` : '—'}</span>
              <span className="kpi-sub">
                {weightChange ? `${Number(weightChange) > 0 ? '+' : ''}${weightChange} lbs vs prev` : 'Latest reading'}
              </span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Body Fat</span>
              <span className="kpi-value">{latest?.body_fat_pct ? `${latest.body_fat_pct}%` : '—'}</span>
              <span className="kpi-sub">{latest?.water_pct ? `${latest.water_pct}% water` : 'Body composition'}</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Muscle Mass</span>
              <span className="kpi-value">{latest?.muscle_mass_lbs ? `${latest.muscle_mass_lbs} lbs` : '—'}</span>
              <span className="kpi-sub">{latest?.bmi ? `BMI: ${latest.bmi}` : 'Lean mass'}</span>
            </div>
          </div>

          {/* Scale History List */}
          <section className="analytics-section">
            <div className="gtg-card-header">
              <h2>Weight & Body Composition History</h2>
              <button
                type="button"
                className="secondary-button small"
                onClick={() => setShowLogModal(true)}
              >
                + Log Weight
              </button>
            </div>

            {scaleLogs.length === 0 ? (
              <p className="empty-state small">No scale entries logged yet.</p>
            ) : (
              <ul className="history-list">
                {scaleLogs.map((log) => (
                  <li key={log.id} className="log-entry-row">
                    <div>
                      <span className="activity-title">{log.weight_lbs} lbs</span>
                      <span className="activity-sub">
                        {log.body_fat_pct ? `${log.body_fat_pct}% fat` : ''}{' '}
                        {log.muscle_mass_lbs ? `· ${log.muscle_mass_lbs} lbs muscle` : ''}{' '}
                        {log.bmi ? `· BMI ${log.bmi}` : ''}
                      </span>
                    </div>
                    <span className="activity-time">{log.logged_at ? formatDateShort(log.logged_at.slice(0, 10)) : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="modal-backdrop" onClick={() => setShowLogModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Log Scale Reading</h2>
            <form className="add-form" onSubmit={handleAddLog}>
              <div className="interval-label">
                <span>Weight (lbs):</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 175.2"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="interval-label">
                <span>Body Fat %:</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 17.5"
                  value={bodyFatInput}
                  onChange={(e) => setBodyFatInput(e.target.value)}
                />
              </div>
              <div className="interval-label">
                <span>Muscle Mass (lbs):</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 97.5"
                  value={muscleMassInput}
                  onChange={(e) => setMuscleMassInput(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Save Reading
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
