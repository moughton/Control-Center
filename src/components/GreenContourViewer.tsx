import { useState, type MouseEvent } from 'react'

interface GreenContourViewerProps {
  holeNumber: number
  par: number
  courseName?: string
  initialPinLocation?: string | null
  onPinPlaced?: (pinLabel: string, pos: { xPct: number; yPct: number }) => void
}

const GREEN_DEPTHS: Record<number, string> = {
  1: '27.0 yds',
  2: '30.6 yds',
  3: '31.9 yds',
  4: '28.8 yds',
  5: '37.2 yds',
  6: '35.3 yds',
  7: '35.1 yds',
  8: '30.6 yds',
  9: '28.4 yds',
  10: '35.8 yds',
  11: '38.2 yds',
  12: '32.2 yds',
  13: '33.6 yds',
  14: '30.8 yds',
  15: '31.1 yds',
  16: '30.9 yds',
  17: '28.8 yds',
  18: '29.2 yds',
}

export default function GreenContourViewer({
  holeNumber,
  par,
  courseName = 'Richmond Country Club',
  initialPinLocation,
  onPinPlaced,
}: GreenContourViewerProps) {
  const depthLabel = GREEN_DEPTHS[holeNumber] || '30.0 yds'
  const imgUrl = `${import.meta.env.BASE_URL}assets/greens/h${holeNumber}.png`

  const [pinPos, setPinPos] = useState<{ xPct: number; yPct: number } | null>(null)
  const [pinLabel, setPinLabel] = useState<string | null>(initialPinLocation || null)

  function handleImageClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const xPct = Math.round((x / rect.width) * 100)
    const yPct = Math.round((y / rect.height) * 100)

    const vert = yPct < 35 ? 'Back' : yPct > 65 ? 'Front' : 'Center'
    const horiz = xPct < 40 ? 'Left' : xPct > 60 ? 'Right' : 'Center'
    const locationStr = `${vert}-${horiz}`

    setPinPos({ xPct, yPct })
    setPinLabel(locationStr)

    if (onPinPlaced) {
      onPinPlaced(locationStr, { xPct, yPct })
    }
  }

  return (
    <div className="green-contour-card" style={{ background: '#042f2e', color: 'white', borderRadius: '12px', padding: '16px', marginTop: '16px', border: '1px solid #0d9488' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#5eead4' }}>
            ⛳ {courseName} — Hole #{holeNumber} Green Topography (Par {par})
          </h3>
          <span style={{ fontSize: '12px', color: '#99f6e4' }}>
            StrackaLine Green Book · Depth: <strong>{depthLabel}</strong>
          </span>
        </div>
        {pinLabel && (
          <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
            📍 Pin: {pinLabel}
          </span>
        )}
      </div>

      {/* Tap-to-Place Pin Container */}
      <div
        onClick={handleImageClick}
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(94, 234, 212, 0.3)',
          background: '#022c22',
          textAlign: 'center',
          padding: '8px 0',
          cursor: 'crosshair',
        }}
      >
        <img
          src={imgUrl}
          alt={`Richmond Country Club Hole ${holeNumber} Green Contour Map`}
          style={{ maxWidth: '100%', maxHeight: '650px', objectFit: 'contain', borderRadius: '6px' }}
        />

        {/* Tapped Pin Marker Flag */}
        {pinPos && (
          <div
            style={{
              position: 'absolute',
              left: `${pinPos.xPct}%`,
              top: `${pinPos.yPct}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              ⛳ Pin ({pinLabel})
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px', color: '#99f6e4' }}>
        <span>👇 Tap anywhere on green map to set Pin Location</span>
        <span>⛳ Green Depth: {depthLabel}</span>
      </div>
    </div>
  )
}
