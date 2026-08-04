import { useEffect, useState } from 'react'
import RecurringTasks from './RecurringTasks'
import Gtg from './Gtg'
import { applyTheme, getStoredTheme, type Theme } from './lib/theme'
import './App.css'

type Facet = 'recurring-tasks' | 'gtg'

function facetFromHash(): Facet {
  return window.location.hash === '#gtg' ? 'gtg' : 'recurring-tasks'
}

const THEME_ORDER: Theme[] = ['system', 'light', 'dark']
const THEME_LABELS: Record<Theme, string> = { system: 'Auto', light: 'Light', dark: 'Dark' }

function App() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [facet, setFacet] = useState<Facet>(facetFromHash)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    function onHashChange() {
      setFacet(facetFromHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function cycleTheme() {
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length])
  }

  function navigate(next: Facet) {
    window.location.hash = next === 'recurring-tasks' ? '' : `#${next}`
    setFacet(next)
  }

  return (
    <>
      <main className="app">
        <button type="button" className="theme-toggle" onClick={cycleTheme}>
          {THEME_LABELS[theme]}
        </button>
        {facet === 'gtg' ? <Gtg /> : <RecurringTasks />}
      </main>

      <nav className="tab-bar">
        <button
          type="button"
          className={`tab-bar-item${facet === 'recurring-tasks' ? ' active' : ''}`}
          onClick={() => navigate('recurring-tasks')}
        >
          Tasks
        </button>
        <button
          type="button"
          className={`tab-bar-item${facet === 'gtg' ? ' active' : ''}`}
          onClick={() => navigate('gtg')}
        >
          GTG
        </button>
      </nav>
    </>
  )
}

export default App
