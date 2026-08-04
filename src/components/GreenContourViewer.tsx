import { useState } from 'react'

interface GreenContourViewerProps {
  holeNumber: number
  par: number
  courseName?: string
}

export default function GreenContourViewer({ holeNumber, par, courseName = 'Richmond Country Club' }: GreenContourViewerProps) {
  const [activeLayer, setActiveLayer] = useState<'contour' | 'slopes' | 'yardages'>('contour')

  return (
    <div className="green-contour-card" style={{ background: '#042f2e', color: 'white', borderRadius: '12px', padding: '16px', marginTop: '16px', border: '1px solid #0d9488' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#5eead4' }}>
            ⛳ {courseName} — Hole #{holeNumber} Green Topography (Par {par})
          </h3>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>High-Resolution Slope & Contour Map</span>
        </div>
        <div className="filter-chips" style={{ margin: 0 }}>
          <button
            type="button"
            className={`filter-chip ${activeLayer === 'contour' ? 'active' : ''}`}
            onClick={() => setActiveLayer('contour')}
            style={{ fontSize: '10px', padding: '3px 8px' }}
          >
            Contour
          </button>
          <button
            type="button"
            className={`filter-chip ${activeLayer === 'slopes' ? 'active' : ''}`}
            onClick={() => setActiveLayer('slopes')}
            style={{ fontSize: '10px', padding: '3px 8px' }}
          >
            Slopes
          </button>
          <button
            type="button"
            className={`filter-chip ${activeLayer === 'yardages' ? 'active' : ''}`}
            onClick={() => setActiveLayer('yardages')}
            style={{ fontSize: '10px', padding: '3px 8px' }}
          >
            Yardages
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '240px', background: '#022c22', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(94, 234, 212, 0.2)' }}>
        <svg viewBox="0 0 300 220" style={{ width: '100%', height: '100%' }}>
          <defs>
            <radialGradient id="greenSlope" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>
          </defs>

          {/* Green Shape */}
          <path d="M 80 110 Q 110 30 180 50 Q 240 70 230 150 Q 210 200 130 190 Q 70 170 80 110 Z" fill="url(#greenSlope)" stroke="#5eead4" strokeWidth="2" />

          {/* Contour Lines */}
          <path d="M 100 110 Q 130 50 170 70 Q 210 90 200 140 Q 180 180 120 160 Z" fill="none" stroke="#a7f3d0" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
          <path d="M 120 110 Q 140 70 160 80 Q 180 100 170 130 Q 160 150 130 140 Z" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="2,2" opacity="0.8" />

          {/* Slope Arrows */}
          {activeLayer !== 'yardages' && (
            <g>
              <line x1="140" y1="80" x2="140" y2="100" stroke="#fbbf24" strokeWidth="1.5" />
              <line x1="170" y1="110" x2="190" y2="125" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="145" y="95" fill="#fef08a" fontSize="9">1.8% Down</text>
              <text x="195" y="125" fill="#fef08a" fontSize="9">2.4% Right</text>
            </g>
          )}

          {/* Pin Flag Marker */}
          <circle cx="150" cy="100" r="4" fill="#ffffff" />
          <line x1="150" y1="100" x2="150" y2="70" stroke="#ffffff" strokeWidth="2" />
          <polygon points="150,70 165,76 150,82" fill="#ef4444" />

          {/* Yardage Grid Markers */}
          {activeLayer === 'yardages' && (
            <g fontSize="9" fill="#e0f2fe" fontWeight="bold">
              <text x="70" y="35">Back: 148y</text>
              <text x="150" y="25" textAnchor="middle">Pin: 136y</text>
              <text x="210" y="35">Front: 122y</text>
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px', color: '#99f6e4' }}>
        <span>⛳ Pin Position: Center-Left</span>
        <span>📐 Tier: Dual-Level Slope</span>
        <span>🎯 Target Proximity: Right-Center Ridge</span>
      </div>
    </div>
  )
}
