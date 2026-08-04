interface GreenContourViewerProps {
  holeNumber: number
  par: number
  courseName?: string
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

export default function GreenContourViewer({ holeNumber, par, courseName = 'Richmond Country Club' }: GreenContourViewerProps) {
  const depthLabel = GREEN_DEPTHS[holeNumber] || '30.0 yds'
  const imgUrl = `${import.meta.env.BASE_URL}assets/greens/h${holeNumber}.png`

  return (
    <div className="green-contour-card" style={{ background: '#042f2e', color: 'white', borderRadius: '12px', padding: '16px', marginTop: '16px', border: '1px solid #0d9488' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#5eead4' }}>
            ⛳ {courseName} — Hole #{holeNumber} Green Topography (Par {par})
          </h3>
          <span style={{ fontSize: '12px', color: '#99f6e4' }}>StrackaLine Green Book · Total Depth: <strong>{depthLabel}</strong></span>
        </div>
      </div>

      <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(94, 234, 212, 0.3)', background: '#022c22', textAlign: 'center', padding: '8px 0' }}>
        <img
          src={imgUrl}
          alt={`Richmond Country Club Hole ${holeNumber} Green Contour Map`}
          style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '6px' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px', color: '#99f6e4' }}>
        <span>📐 StrackaLine Scale: 3/8" = 5 yds</span>
        <span>⛳ Green Depth: {depthLabel}</span>
        <span>🎯 Source: RCC Official Green Book</span>
      </div>
    </div>
  )
}
