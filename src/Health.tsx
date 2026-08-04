import { useState } from 'react'
import Garmin from './Garmin'
import EightSleep from './EightSleep'
import Renpho from './Renpho'
import MealPlanner from './components/MealPlanner'

type HealthSubTab = 'overview' | 'nutrition' | 'garmin' | 'eightsleep' | 'renpho'

export default function Health() {
  const [subTab, setSubTab] = useState<HealthSubTab>('nutrition')

  return (
    <div className="health-facet">
      <header className="page-header">
        <h1>Health, Nutrition & Wearables</h1>
        <p className="subtitle">AI meal planner, metabolic targets, 16:8 fasting, and wearable metrics.</p>
      </header>

      {/* Internal Sub-Tab Navigation */}
      <div className="filter-chips" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`filter-chip ${subTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setSubTab('nutrition')}
        >
          🥗 Good Energy Meal Planner
        </button>
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
      {subTab === 'nutrition' && <MealPlanner />}
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
