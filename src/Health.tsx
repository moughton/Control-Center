import { useState } from 'react'
import Garmin from './Garmin'
import EightSleep from './EightSleep'
import Renpho from './Renpho'

type HealthSubTab = 'overview' | 'garmin' | 'eightsleep' | 'renpho'

export default function Health() {
  const [subTab, setSubTab] = useState<HealthSubTab>('overview')

  return (
    <div className="health-facet">
      <header className="page-header">
        <h1>Health & Wearables</h1>
        <p className="subtitle">Synced metrics from Garmin, Eight Sleep, and Renpho smart scale.</p>
      </header>

      {/* Internal Sub-Tab Navigation */}
      <div className="filter-chips" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`filter-chip ${subTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSubTab('overview')}
        >
          📊 Overview
        </button>
        <button
          type="button"
          className={`filter-chip ${subTab === 'garmin' ? 'active' : ''}`}
          onClick={() => setSubTab('garmin')}
        >
          ⌚ Garmin
        </button>
        <button
          type="button"
          className={`filter-chip ${subTab === 'eightsleep' ? 'active' : ''}`}
          onClick={() => setSubTab('eightsleep')}
        >
          🛌 Eight Sleep
        </button>
        <button
          type="button"
          className={`filter-chip ${subTab === 'renpho' ? 'active' : ''}`}
          onClick={() => setSubTab('renpho')}
        >
          ⚖️ Renpho Scale
        </button>
      </div>

      {/* Sub-Tab View Rendering */}
      {subTab === 'garmin' && <Garmin />}
      {subTab === 'eightsleep' && <EightSleep />}
      {subTab === 'renpho' && <Renpho />}

      {subTab === 'overview' && (
        <div className="health-overview">
          <section className="analytics-section">
            <Garmin />
          </section>
          <section className="analytics-section" style={{ marginTop: '24px' }}>
            <EightSleep />
          </section>
          <section className="analytics-section" style={{ marginTop: '24px' }}>
            <Renpho />
          </section>
        </div>
      )}
    </div>
  )
}
