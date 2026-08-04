import { Component, useEffect, useState, type ReactNode } from 'react'
import RecurringTasks from './RecurringTasks'
import Gtg from './Gtg'
import Analytics from './Analytics'
import Health from './Health'
import Golf from './Golf'
import { applyTheme, getStoredTheme, type Theme } from './lib/theme'
import './App.css'

type Facet = 'recurring-tasks' | 'gtg' | 'analytics' | 'health' | 'golf'

function facetFromHash(): Facet {
  const hash = window.location.hash.toLowerCase()
  if (hash.includes('golf')) return 'golf'
  if (hash.includes('health')) return 'health'
  if (hash.includes('analytics')) return 'analytics'
  if (hash.includes('gtg')) return 'gtg'
  return 'recurring-tasks'
}

class FacetErrorBoundary extends Component<{ children: ReactNode; facetName: string }, { hasError: boolean; errorMsg: string }> {
  constructor(props: { children: ReactNode; facetName: string }) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || 'Unknown render error' }
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error(`Error rendering facet ${this.props.facetName}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="analytics-page">
          <header className="page-header">
            <h1>{this.props.facetName}</h1>
          </header>
          <div className="error-banner">
            Something went wrong loading this section: {this.state.errorMsg}
          </div>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: '12px' }}
            onClick={() => this.setState({ hasError: false, errorMsg: '' })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
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
      const nextFacet = facetFromHash()
      setFacet(nextFacet)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function cycleTheme() {
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length])
  }

  function navigate(next: Facet) {
    setFacet(next)
    const nextHash = next === 'recurring-tasks' ? '#' : `#${next}`
    try {
      window.history.replaceState(null, '', nextHash)
    } catch {
      window.location.hash = nextHash
    }
  }

  return (
    <>
      <main className="app">
        <button type="button" className="theme-toggle" onClick={cycleTheme}>
          {THEME_LABELS[theme]}
        </button>
        {facet === 'golf' ? (
          <FacetErrorBoundary facetName="Golf">
            <Golf />
          </FacetErrorBoundary>
        ) : facet === 'health' ? (
          <FacetErrorBoundary facetName="Health">
            <Health />
          </FacetErrorBoundary>
        ) : facet === 'analytics' ? (
          <FacetErrorBoundary facetName="Analytics">
            <Analytics />
          </FacetErrorBoundary>
        ) : facet === 'gtg' ? (
          <FacetErrorBoundary facetName="GTG">
            <Gtg />
          </FacetErrorBoundary>
        ) : (
          <FacetErrorBoundary facetName="Tasks">
            <RecurringTasks />
          </FacetErrorBoundary>
        )}
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
        <button
          type="button"
          className={`tab-bar-item${facet === 'analytics' ? ' active' : ''}`}
          onClick={() => navigate('analytics')}
        >
          Analytics
        </button>
        <button
          type="button"
          className={`tab-bar-item${facet === 'health' ? ' active' : ''}`}
          onClick={() => navigate('health')}
        >
          Health
        </button>
        <button
          type="button"
          className={`tab-bar-item${facet === 'golf' ? ' active' : ''}`}
          onClick={() => navigate('golf')}
        >
          Golf
        </button>
      </nav>
    </>
  )
}

export default App
