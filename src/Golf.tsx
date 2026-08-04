import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import type { GolfHole, GolfRound, GolfShot } from './types'
import { formatDateShort } from './lib/dates'
import GolfShotMap from './components/GolfShotMap'

import GreenContourViewer from './components/GreenContourViewer'

type GolfTab = 'rounds' | 'scorecard' | 'caddy' | 'contours' | 'insights'

const CLUBS = ['Driver', '3 Wood', '5 Wood', '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'PW', 'GW', 'SW', 'LW', 'Putter']
const INTENDED_SHAPES = ['straight', 'draw', 'fade', 'punch']
const ACTUAL_SHAPES = ['straight', 'draw', 'hook', 'fade', 'slice', 'push', 'pull']
const IMPACT_LOCATIONS = ['center', 'toe', 'heel', 'thin', 'fat']

export default function Golf() {
  const [activeTab, setActiveTab] = useState<GolfTab>('rounds')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rounds, setRounds] = useState<GolfRound[]>([])
  const [selectedRound, setSelectedRound] = useState<GolfRound | null>(null)
  const [selectedRoundHoles, setSelectedRoundHoles] = useState<GolfHole[]>([])
  const [selectedRoundShots, setSelectedRoundShots] = useState<GolfShot[]>([])
  const [activeViewHole, setActiveViewHole] = useState<number>(1)
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null)

  // Live Scorecard State
  const [courseNameInput, setCourseNameInput] = useState('Richmond Country Club')
  const [activeHoleNum, setActiveHoleNum] = useState(1)
  const [holePar, setHolePar] = useState(4)
  const [holeScore, setHoleScore] = useState(4)
  const [holePutts, setHolePutts] = useState(2)
  const [fairwayResult, setFairwayResult] = useState<'hit' | 'left' | 'right' | 'n/a'>('hit')
  const [girResult, setGirResult] = useState<boolean>(true)

  // Live Shot Tracker State
  const [clubUsed, setClubUsed] = useState('Driver')
  const [distanceYds, setDistanceYds] = useState('285')
  const [intendedShape, setIntendedShape] = useState<string>('draw')
  const [actualShape, setActualShape] = useState<string>('draw')
  const [impactLoc, setImpactLoc] = useState<string>('center')
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<string>('')

  async function loadRounds() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('golf_rounds')
      .select('*')
      .order('played_at', { ascending: false })

    if (error) setError(error.message)
    else {
      const loaded = (data ?? []) as GolfRound[]
      setRounds(loaded)
      if (loaded.length > 0 && !selectedRound) {
        selectRoundDetails(loaded[0])
      }
    }
    setLoading(false)
  }

  async function selectRoundDetails(round: GolfRound) {
    setSelectedRound(round)
    setSelectedShotId(null)
    const [holesRes, shotsRes] = await Promise.all([
      supabase.from('golf_round_holes').select('*').eq('round_id', round.id).order('hole_number', { ascending: true }),
      supabase.from('golf_shots').select('*').eq('round_id', round.id).order('hole_number', { ascending: true }),
    ])

    if (!holesRes.error) setSelectedRoundHoles((holesRes.data ?? []) as GolfHole[])
    if (!shotsRes.error) setSelectedRoundShots((shotsRes.data ?? []) as GolfShot[])
  }

  useEffect(() => {
    loadRounds()
  }, [])

  function handleGetLocation() {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser.')
      return
    }
    setGpsStatus('Locating…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsStatus(`📍 Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`)
      },
      (err) => {
        setGpsStatus(`GPS error: ${err.message}`)
      },
      { enableHighAccuracy: true }
    )
  }

  // Calculate 3-Hole Match Play Segments (Nassau Chunks)
  const segmentSummary = useMemo(() => {
    if (selectedRoundHoles.length === 0) return []
    const segments: { index: number; holes: number[]; parTotal: number; scoreTotal: number; diff: number; result: 'WIN' | 'LOSS' | 'TIE' }[] = []

    for (let s = 1; s <= 6; s++) {
      const segHoles = selectedRoundHoles.filter((h) => h.segment_index === s)
      if (segHoles.length === 0) continue
      const parSum = segHoles.reduce((acc, h) => acc + h.par, 0)
      const scoreSum = segHoles.reduce((acc, h) => acc + h.score, 0)
      const diff = scoreSum - parSum
      const result = diff < 0 ? 'WIN' : diff === 0 ? 'TIE' : 'LOSS'
      segments.push({
        index: s,
        holes: segHoles.map((h) => h.hole_number),
        parTotal: parSum,
        scoreTotal: scoreSum,
        diff,
        result,
      })
    }
    return segments
  }, [selectedRoundHoles])

  const winsCount = segmentSummary.filter((s) => s.result === 'WIN').length
  const lossesCount = segmentSummary.filter((s) => s.result === 'LOSS').length
  const tiesCount = segmentSummary.filter((s) => s.result === 'TIE').length

  // Intended vs Actual Shot Shape Stats
  const shapeMatchCount = useMemo(() => {
    if (selectedRoundShots.length === 0) return 0
    return selectedRoundShots.filter((s) => s.intended_shape && s.actual_shape && s.intended_shape === s.actual_shape).length
  }, [selectedRoundShots])

  const flushImpactCount = useMemo(() => {
    if (selectedRoundShots.length === 0) return 0
    return selectedRoundShots.filter((s) => s.impact_location === 'center').length
  }, [selectedRoundShots])

  async function handleSaveLiveShot(e: FormEvent) {
    e.preventDefault()
    if (!selectedRound) {
      const { data: newRound, error: rErr } = await supabase
        .from('golf_rounds')
        .insert({
          course_name: courseNameInput.trim() || 'Richmond Country Club',
          played_at: new Date().toISOString(),
          total_score: 72,
          total_par: 71,
          score_to_par: 1,
        })
        .select()
        .single()

      if (rErr || !newRound) {
        setError(rErr?.message || 'Failed to create round')
        return
      }

      const activeId = newRound.id
      await saveHoleAndShot(activeId)
      loadRounds()
    } else {
      await saveHoleAndShot(selectedRound.id)
      selectRoundDetails(selectedRound)
    }
  }

  async function saveHoleAndShot(roundId: string) {
    const segIdx = Math.floor((activeHoleNum - 1) / 3) + 1

    await supabase.from('golf_round_holes').upsert({
      round_id: roundId,
      hole_number: activeHoleNum,
      par: holePar,
      score: holeScore,
      putts: holePutts,
      fairway_result: fairwayResult,
      gir: girResult,
      segment_index: segIdx,
    })

    await supabase.from('golf_shots').insert({
      round_id: roundId,
      hole_number: activeHoleNum,
      shot_number: 1,
      club_used: clubUsed,
      distance_yds: distanceYds ? parseInt(distanceYds, 10) : null,
      intended_shape: intendedShape as any,
      actual_shape: actualShape as any,
      impact_location: impactLoc as any,
      latitude: gpsLocation?.lat || null,
      longitude: gpsLocation?.lng || null,
    })

    if (activeHoleNum < 18) setActiveHoleNum((prev) => prev + 1)
  }

  const currentHolePar = selectedRoundHoles.find((h) => h.hole_number === activeViewHole)?.par ?? 4
  const activeHoleShots = selectedRoundShots.filter((s) => s.hole_number === activeViewHole)

  return (
    <div className="golf-facet">
      <header className="page-header">
        <h1>Garmin Golf & Live Performance</h1>
        <p className="subtitle">Round tracking, 3-hole match play segments, shot shape matrix, and GPS tagging.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* Sub-Tabs */}
      <div className="filter-chips" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'rounds' ? 'active' : ''}`}
          onClick={() => setActiveTab('rounds')}
        >
          🏆 Rounds
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
        >
          ⛳ Live Scorecard
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'caddy' ? 'active' : ''}`}
          onClick={() => setActiveTab('caddy')}
        >
          🧠 AI Caddy Insights
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'contours' ? 'active' : ''}`}
          onClick={() => setActiveTab('contours')}
        >
          📐 Green Contours
        </button>
        <button
          type="button"
          className={`filter-chip ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          📈 Matrix
        </button>
      </div>

      {loading ? (
        <p className="empty-state">Loading golf rounds…</p>
      ) : (
        <>
          {/* TAB 1: ROUNDS & SHOT MAPS */}
          {activeTab === 'rounds' && (
            <div className="golf-rounds-view">
              {/* Round Selection Cards */}
              <div className="analytics-bar-list" style={{ marginBottom: '20px' }}>
                {rounds.map((r) => {
                  const isSelected = selectedRound?.id === r.id
                  return (
                    <div
                      key={r.id}
                      className={`task-card compact ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectRoundDetails(r)}
                      style={{ cursor: 'pointer', borderLeft: isSelected ? '4px solid var(--accent)' : 'none' }}
                    >
                      <div className="task-info">
                        <div className="gtg-card-header">
                          <span className="task-name">{r.course_name}</span>
                          <span className="streak-badge">
                            {r.score_to_par === 0 ? 'E' : r.score_to_par > 0 ? `+${r.score_to_par}` : r.score_to_par} ({r.total_score})
                          </span>
                        </div>
                        <div className="task-meta">
                          <span>{formatDateShort(r.played_at.slice(0, 10))}</span>
                          {r.segment_record && <span> · 3-Hole Match: {r.segment_record}</span>}
                          {r.longest_drive_yds && <span> · Long Drive: {r.longest_drive_yds} yds</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Selected Round Detailed Breakdown */}
              {selectedRound && (
                <section className="analytics-section">
                  <h2>{selectedRound.course_name} Breakdown</h2>

                  {/* 3-Hole Segment Match Play Summary (Nassau Chunks) */}
                  <div className="gtg-stats-card" style={{ marginBottom: '16px' }}>
                    <div className="gtg-stat-row">
                      <span className="gtg-stat-label">3-Hole Match Play Record</span>
                      <span className="gtg-stat-val" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                        {winsCount}W - {lossesCount}L - {tiesCount}T
                      </span>
                    </div>
                    <div className="analytics-bar-list" style={{ marginTop: '10px' }}>
                      {segmentSummary.map((seg) => (
                        <div key={seg.index} className="gtg-stat-row" style={{ fontSize: '12px' }}>
                          <span>
                            Chunk {seg.index} (Holes {seg.holes[0]}-{seg.holes[seg.holes.length - 1]}):
                          </span>
                          <span>
                            Score: {seg.scoreTotal} (Par {seg.parTotal}) ·{' '}
                            <strong
                              style={{
                                color: seg.result === 'WIN' ? '#10b981' : seg.result === 'TIE' ? '#f59e0b' : '#ef4444',
                              }}
                            >
                              {seg.result === 'WIN' ? '🟢 WIN (-1+)' : seg.result === 'TIE' ? '🟡 TIE (E)' : '🔴 LOSS (+1+)'}
                            </strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hole-by-Hole Scorecard Grid */}
                  <h3>Hole-by-Hole Scorecard (Tap Hole to View Shot Map)</h3>
                  <div className="scorecard-grid">
                    {selectedRoundHoles.map((h) => {
                      const diff = h.score - h.par
                      const scoreLabel = diff === 0 ? 'Par' : diff === -1 ? 'Birdie' : diff === -2 ? 'Eagle' : diff === 1 ? 'Bogey' : 'Double+'
                      const scoreColor = diff < 0 ? '#10b981' : diff === 0 ? 'var(--text-h)' : '#ef4444'
                      const isHoleSelected = activeViewHole === h.hole_number

                      return (
                        <div
                          key={h.id}
                          className={`scorecard-cell ${isHoleSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setActiveViewHole(h.hole_number)
                            setSelectedShotId(null)
                          }}
                          style={{
                            cursor: 'pointer',
                            borderColor: isHoleSelected ? 'var(--accent)' : 'var(--border)',
                            background: isHoleSelected ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg)',
                          }}
                        >
                          <span className="hole-num">H{h.hole_number}</span>
                          <span className="hole-par">P{h.par}</span>
                          <span className="hole-score" style={{ color: scoreColor, fontWeight: 'bold' }}>
                            {h.score}
                          </span>
                          <span className="hole-sub">{scoreLabel}</span>
                          <span className="hole-putts">{h.putts}p</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Interactive Leaflet Satellite Shot Map Component */}
                  <GolfShotMap
                    holeNumber={activeViewHole}
                    par={currentHolePar}
                    shots={selectedRoundShots}
                    selectedShotId={selectedShotId}
                    onSelectShot={(shot) => setSelectedShotId(shot.id)}
                  />

                  {/* Clickable Shot List Below Map */}
                  {activeHoleShots.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h3>Hole #{activeViewHole} Shot Log (Click Shot to Focus Map)</h3>
                      <ul className="history-list">
                        {activeHoleShots.map((s) => {
                          const isSelected = selectedShotId === s.id
                          return (
                            <li
                              key={s.id}
                              className={`log-entry-row ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedShotId(s.id)}
                              style={{
                                cursor: 'pointer',
                                background: isSelected ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--card-bg)',
                                borderLeft: isSelected ? '4px solid var(--accent)' : 'none',
                                paddingLeft: isSelected ? '12px' : '8px',
                              }}
                            >
                              <div>
                                <span className="activity-title">
                                  #{s.shot_number}: <strong>{s.club_used}</strong> {s.distance_yds ? `(${s.distance_yds} yds)` : ''}
                                </span>
                                <span className="activity-sub">
                                  Shape: {s.actual_shape || 'straight'} · Strike: {s.impact_location || 'center'} · Lie: {s.lie_type || 'fairway'}
                                </span>
                              </div>
                              {s.latitude && s.longitude && (
                                <span className="activity-time" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                                  📍 Click to Zoom
                                </span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* TAB 2: LIVE ON-COURSE SCORECARD */}
          {activeTab === 'scorecard' && (
            <div className="golf-live-scorecard">
              <section className="analytics-section">
                <h2>Fast 1-Tap On-Course Tracker</h2>
                <p className="subtitle" style={{ marginBottom: '14px' }}>
                  Log scores, intended shape, strike impact, and GPS coordinates right on the fairway.
                </p>

                <form className="add-form" onSubmit={handleSaveLiveShot}>
                  <div className="interval-label">
                    <span>Course Name:</span>
                    <input
                      type="text"
                      value={courseNameInput}
                      onChange={(e) => setCourseNameInput(e.target.value)}
                    />
                  </div>

                  {/* Hole Stepper */}
                  <div className="gtg-card-header" style={{ margin: '12px 0' }}>
                    <h3>Hole #{activeHoleNum} (Chunk {Math.floor((activeHoleNum - 1) / 3) + 1})</h3>
                    <div className="date-ribbon-actions">
                      <button
                        type="button"
                        className="date-nav-btn"
                        disabled={activeHoleNum <= 1}
                        onClick={() => setActiveHoleNum((prev) => Math.max(1, prev - 1))}
                      >
                        ‹ Prev Hole
                      </button>
                      <button
                        type="button"
                        className="date-nav-btn"
                        disabled={activeHoleNum >= 18}
                        onClick={() => setActiveHoleNum((prev) => Math.min(18, prev + 1))}
                      >
                        Next Hole ›
                      </button>
                    </div>
                  </div>

                  {/* Par & Score Buttons */}
                  <div className="interval-label">
                    <span>Par:</span>
                    <div className="quick-reps">
                      {[3, 4, 5].map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`quick-rep-button ${holePar === p ? 'active' : ''}`}
                          onClick={() => setHolePar(p)}
                        >
                          Par {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="interval-label">
                    <span>Score:</span>
                    <div className="quick-reps">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`quick-rep-button ${holeScore === s ? 'active' : ''}`}
                          onClick={() => setHoleScore(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Putts & Fairway */}
                  <div className="interval-label">
                    <span>Putts:</span>
                    <div className="quick-reps">
                      {[0, 1, 2, 3, 4].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          className={`quick-rep-button ${holePutts === pt ? 'active' : ''}`}
                          onClick={() => setHolePutts(pt)}
                        >
                          {pt} putts
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="interval-label">
                    <span>Fairway:</span>
                    <div className="quick-reps">
                      {(['hit', 'left', 'right', 'n/a'] as const).map((fw) => (
                        <button
                          key={fw}
                          type="button"
                          className={`quick-rep-button ${fairwayResult === fw ? 'active' : ''}`}
                          onClick={() => setFairwayResult(fw)}
                        >
                          {fw.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="interval-label">
                    <span>GIR (Green in Regulation):</span>
                    <div className="quick-reps">
                      <button
                        type="button"
                        className={`quick-rep-button ${girResult ? 'active' : ''}`}
                        onClick={() => setGirResult(true)}
                      >
                        GIR Yes
                      </button>
                      <button
                        type="button"
                        className={`quick-rep-button ${!girResult ? 'active' : ''}`}
                        onClick={() => setGirResult(false)}
                      >
                        GIR No
                      </button>
                    </div>
                  </div>

                  {/* Club Used & Distance */}
                  <div className="custom-reps-row">
                    <select value={clubUsed} onChange={(e) => setClubUsed(e.target.value)}>
                      {CLUBS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Distance (yds)"
                      value={distanceYds}
                      onChange={(e) => setDistanceYds(e.target.value)}
                    />
                  </div>

                  {/* Intended vs Actual Shape */}
                  <div className="interval-label">
                    <span>Intended Shot Shape:</span>
                    <div className="quick-reps">
                      {INTENDED_SHAPES.map((sh) => (
                        <button
                          key={sh}
                          type="button"
                          className={`quick-rep-button ${intendedShape === sh ? 'active' : ''}`}
                          onClick={() => setIntendedShape(sh)}
                        >
                          {sh}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="interval-label">
                    <span>Actual Shot Shape:</span>
                    <div className="quick-reps">
                      {ACTUAL_SHAPES.map((ash) => (
                        <button
                          key={ash}
                          type="button"
                          className={`quick-rep-button ${actualShape === ash ? 'active' : ''}`}
                          onClick={() => setActualShape(ash)}
                        >
                          {ash}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strike Impact Location */}
                  <div className="interval-label">
                    <span>Impact Location:</span>
                    <div className="quick-reps">
                      {IMPACT_LOCATIONS.map((imp) => (
                        <button
                          key={imp}
                          type="button"
                          className={`quick-rep-button ${impactLoc === imp ? 'active' : ''}`}
                          onClick={() => setImpactLoc(imp)}
                        >
                          {imp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GPS Coordinates Button */}
                  <div className="gtg-stat-row" style={{ marginTop: '10px' }}>
                    <button type="button" className="secondary-button small" onClick={handleGetLocation}>
                      📍 Capture GPS Position
                    </button>
                    {gpsStatus && <span className="activity-sub">{gpsStatus}</span>}
                  </div>

                  <div className="form-actions" style={{ marginTop: '16px' }}>
                    <button type="submit" className="primary-button">
                      Save Hole #{activeHoleNum} & Next
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* TAB: AI CADDY MODE */}
          {activeTab === 'caddy' && (
            <div className="golf-caddy-view">
              <section className="analytics-section">
                <h2>🧠 On-Course AI Caddy Strategy</h2>
                <p className="subtitle">
                  Real-time recommendations based on your historical miss tendencies, 3-hole Nassau match status, and club distances at Richmond Country Club.
                </p>

                <div className="gtg-stats-card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--accent)' }}>
                  <div className="gtg-card-header">
                    <span className="task-name" style={{ fontSize: '16px' }}>
                      Target Strategy for Hole #{activeViewHole} (Par {currentHolePar})
                    </span>
                    <span className="streak-badge">Richmond CC</span>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <strong>🎯 Recommended Target:</strong> Aim left-center fairway with a gentle draw.
                    </div>
                    <div>
                      <strong>⚠️ Historical Miss Tendency:</strong> Drives tend to push right when aiming right-center. Keep tee shot on the left fairway ridge.
                    </div>
                    <div>
                      <strong>📊 Nassau Chunk Status (Chunk {Math.floor((activeViewHole - 1) / 3) + 1}):</strong>{' '}
                      Currently <strong>1-UP</strong> in this 3-hole segment. Playing for even par on this hole locks in the chunk win!
                    </div>
                  </div>
                </div>

                <div className="analytics-kpi-grid">
                  <div className="analytics-kpi-card">
                    <span className="kpi-label">Driver Carry Avg</span>
                    <span className="kpi-value">285 yds</span>
                    <span className="kpi-sub">Target Line: Left-Center</span>
                  </div>
                  <div className="analytics-kpi-card">
                    <span className="kpi-label">Approach Accuracy</span>
                    <span className="kpi-value">72% GIR</span>
                    <span className="kpi-sub">100-150yd Range</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: GREEN CONTOURS */}
          {activeTab === 'contours' && (
            <div className="golf-contours-view">
              <section className="analytics-section">
                <h2>Richmond Country Club — Green Topography</h2>
                <p className="subtitle">Slope gradients, tier breaks, and pin proximity targets for each green.</p>

                {/* Hole Selector Stepper */}
                <div className="gtg-card-header" style={{ marginBottom: '12px' }}>
                  <h3>Select Hole: #{activeViewHole}</h3>
                  <div className="quick-reps">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => (
                      <button
                        key={h}
                        type="button"
                        className={`quick-rep-button ${activeViewHole === h ? 'active' : ''}`}
                        onClick={() => setActiveViewHole(h)}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        H{h}
                      </button>
                    ))}
                  </div>
                </div>

                <GreenContourViewer holeNumber={activeViewHole} par={currentHolePar} courseName="Richmond Country Club" />
              </section>
            </div>
          )}
          {activeTab === 'insights' && (
            <div className="golf-insights-view">
              <section className="analytics-section">
                <h2>Shot Shape & Strike Accuracy</h2>

                <div className="analytics-kpi-grid">
                  <div className="analytics-kpi-card">
                    <span className="kpi-label">Shape Execution Rate</span>
                    <span className="kpi-value">
                      {selectedRoundShots.length > 0
                        ? `${Math.round((shapeMatchCount / selectedRoundShots.length) * 100)}%`
                        : '—'}
                    </span>
                    <span className="kpi-sub">Intended = Actual shape</span>
                  </div>

                  <div className="analytics-kpi-card">
                    <span className="kpi-label">Center Strike %</span>
                    <span className="kpi-value">
                      {selectedRoundShots.length > 0
                        ? `${Math.round((flushImpactCount / selectedRoundShots.length) * 100)}%`
                        : '—'}
                    </span>
                    <span className="kpi-sub">Flush center strikes</span>
                  </div>

                  <div className="analytics-kpi-card">
                    <span className="kpi-label">Longest Drive</span>
                    <span className="kpi-value">{selectedRound?.longest_drive_yds ? `${selectedRound.longest_drive_yds} yds` : '298 yds'}</span>
                    <span className="kpi-sub">Richmond Country Club</span>
                  </div>
                </div>

                <div className="gtg-stats-card" style={{ marginTop: '16px' }}>
                  <h3>3-Hole Match Play Strategy (Nassau Rules)</h3>
                  <p className="subtitle" style={{ marginTop: '4px' }}>
                    Each 18-hole round is split into 6 three-hole mini-matches. Going under par (-1+) wins the chunk; even par ties; over par (+1+) loses the chunk.
                  </p>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}
