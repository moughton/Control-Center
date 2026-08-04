import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { EightSleepLog } from './types'
import { formatDateShort } from './lib/dates'

function formatHoursMinutes(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function formatTimeOnly(isoTimestamp: string | null): string {
  if (!isoTimestamp) return ''
  return new Date(isoTimestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function EightSleep() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sleepLogs, setSleepLogs] = useState<EightSleepLog[]>([])

  async function loadData() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('eight_sleep_logs')
      .select('*')
      .order('sleep_date', { ascending: false })

    if (error) setError(error.message)
    else setSleepLogs((data ?? []) as EightSleepLog[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const latest = sleepLogs[0]
  const latestTotalSec = latest
    ? (latest.light_sleep_seconds ?? 0) + (latest.deep_sleep_seconds ?? 0) + (latest.rem_sleep_seconds ?? 0)
    : 0

  return (
    <div className="eightsleep-facet">
      <header className="page-header">
        <h1>Eight Sleep & Recovery</h1>
        <p className="subtitle">Sleep scores, sleep stage breakdowns, and respiratory recovery metrics.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading Eight Sleep metrics…</p>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <span className="kpi-label">Sleep Score</span>
              <span className="kpi-value">{latest?.sleep_score ? `${latest.sleep_score}` : '—'}</span>
              <span className="kpi-sub">Recovery rating</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Total Duration</span>
              <span className="kpi-value">{formatHoursMinutes(latestTotalSec)}</span>
              <span className="kpi-sub">Total time asleep</span>
            </div>

            <div className="analytics-kpi-card">
              <span className="kpi-label">Deep / REM</span>
              <span className="kpi-value">
                {latest ? `${formatHoursMinutes(latest.deep_sleep_seconds)} / ${formatHoursMinutes(latest.rem_sleep_seconds)}` : '—'}
              </span>
              <span className="kpi-sub">Restorative sleep</span>
            </div>
          </div>

          {/* Sleep Logs History */}
          <section className="analytics-section">
            <h2>Sleep Stages & Nightly Breakdowns</h2>

            {sleepLogs.length === 0 ? (
              <p className="empty-state small">No sleep entries logged yet.</p>
            ) : (
              <div className="analytics-bar-list">
                {sleepLogs.map((log) => {
                  const deep = log.deep_sleep_seconds ?? 0
                  const rem = log.rem_sleep_seconds ?? 0
                  const light = log.light_sleep_seconds ?? 0
                  const awake = log.awake_seconds ?? 0
                  const total = Math.max(1, deep + rem + light + awake)

                  const deepPct = Math.round((deep / total) * 100)
                  const remPct = Math.round((rem / total) * 100)
                  const lightPct = Math.round((light / total) * 100)
                  const awakePct = Math.round((awake / total) * 100)

                  return (
                    <div key={log.id} className="gtg-stats-card" style={{ marginBottom: '12px' }}>
                      <div className="gtg-stat-row">
                        <span className="analytics-bar-title">
                          {formatDateShort(log.sleep_date)}
                          {log.sleep_score ? ` · Score ${log.sleep_score}` : ''}
                        </span>
                        <span className="activity-time">
                          {formatHoursMinutes(deep + rem + light)} asleep
                        </span>
                      </div>

                      {/* Visual Sleep Stage Stack Bar */}
                      <div className="sleep-stage-bar-container">
                        <div className="sleep-stage-fill deep" style={{ width: `${deepPct}%` }} title={`Deep: ${formatHoursMinutes(deep)} (${deepPct}%)`} />
                        <div className="sleep-stage-fill rem" style={{ width: `${remPct}%` }} title={`REM: ${formatHoursMinutes(rem)} (${remPct}%)`} />
                        <div className="sleep-stage-fill light" style={{ width: `${lightPct}%` }} title={`Light: ${formatHoursMinutes(light)} (${lightPct}%)`} />
                        <div className="sleep-stage-fill awake" style={{ width: `${awakePct}%` }} title={`Awake: ${formatHoursMinutes(awake)} (${awakePct}%)`} />
                      </div>

                      <div className="gtg-stat-row" style={{ marginTop: '4px', fontSize: '11px' }}>
                        <span className="activity-sub">
                          🟣 Deep: {formatHoursMinutes(deep)} · 🔵 REM: {formatHoursMinutes(rem)} · ⚪ Light: {formatHoursMinutes(light)}
                        </span>
                        <span className="activity-sub">
                          {log.toss_and_turns ? `${log.toss_and_turns} tosses` : ''}{' '}
                          {log.avg_respiratory_rate ? `· ${log.avg_respiratory_rate} rpm` : ''}
                        </span>
                      </div>

                      {(log.bedtime_start || log.bedtime_end) && (
                        <div className="gtg-stat-row" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>In Bed: {formatTimeOnly(log.bedtime_start)} – {formatTimeOnly(log.bedtime_end)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
