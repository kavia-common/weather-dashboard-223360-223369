import React, { useEffect, useMemo, useState } from 'react';
import './theme.css';
import './index.css';
import { fetchWeather, getFeatureFlags } from './services/apiClient';

// Helpers
function formatDay(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  } catch {
    return dateStr;
  }
}

// PUBLIC_INTERFACE
export default function App() {
  /**
   * Weather Dashboard UI
   * - Search for a location
   * - Show current conditions
   * - Show 5-day forecast
   * - Handles loading and error states
   * - Fully responsive with Ocean Professional theme
   */
  const [query, setQuery] = useState('San Francisco');
  const [data, setData] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');
  const flags = useMemo(() => getFeatureFlags(), []);

  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';

  async function load(q) {
    setError('');
    setState('loading');
    try {
      const result = await fetchWeather(q);
      setData(result);
      setState('success');
    } catch (e) {
      setError(e?.message || 'Failed to load weather.');
      setState('error');
    }
  }

  useEffect(() => {
    // Initial load for default city
    load(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a location.');
      setState('error');
      return;
    }
    load(query.trim());
  }

  const usingMock = flags.MOCK_WEATHER || !apiBase;

  return (
    <div>
      <div className="container">
        <header className="header" role="banner">
          <div className="brand" aria-label="Application brand">
            <div className="brand-badge" aria-hidden>WD</div>
            <h1 className="title">Weather Dashboard</h1>
          </div>

          <form className="search" onSubmit={onSubmit} role="search" aria-label="Search weather by location">
            <input
              aria-label="Location"
              placeholder="Search city or 'lat,lon'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputMode="text"
              autoCorrect="off"
              autoCapitalize="none"
            />
            <button type="submit" className="btn" aria-label="Search weather">
              Search
            </button>
          </form>
        </header>

        <main className="grid" role="main">
          <section className="panel" aria-labelledby="current-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 id="current-heading">Current Conditions</h2>
              <span className="badge" title={usingMock ? 'Using mock mode' : 'Using API'}>
                {usingMock ? 'Mock Mode' : 'Live API'}
              </span>
            </div>

            {state === 'loading' && <div className="state" role="status">Loading current conditions…</div>}
            {state === 'error' && (
              <div className="state error" role="alert">
                {error}
                <div style={{ marginTop: 8 }}>
                  <button className="btn secondary" onClick={() => load(query)} aria-label="Retry fetching weather">
                    Retry
                  </button>
                </div>
              </div>
            )}
            {state === 'success' && data && (
              <div className="current" aria-live="polite">
                <div style={{ fontSize: 36 }} aria-hidden>
                  {data.current.icon || '⛅️'}
                </div>
                <div>
                  <div className="temp" aria-label={`Temperature ${Math.round(data.current.temp)} degrees`}>
                    {Math.round(data.current.temp)}°
                  </div>
                  <div className="meta">
                    <span title="Condition">{data.current.condition}</span>
                    <span title="Humidity">💧 {data.current.humidity}%</span>
                    <span title="Wind">🌬️ {Math.round(data.current.wind)} km/h</span>
                    <span title="Location">📍 {data.location}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="forecast-heading">
            <h2 id="forecast-heading">5-Day Forecast</h2>
            {state === 'loading' && <div className="state" role="status">Loading forecast…</div>}
            {state === 'error' && (
              <div className="state error" role="alert">
                Unable to load forecast. You can retry above.
              </div>
            )}
            {state === 'success' && data && (
              <div className="forecast" aria-live="polite">
                {data.forecast?.length ? (
                  data.forecast.map((d, i) => (
                    <article className="card" key={`${d.date}-${i}`} aria-label={`Forecast for ${formatDay(d.date)}`}>
                      <div className="day">{formatDay(d.date)}</div>
                      <div style={{ fontSize: 24, margin: '6px 0' }} aria-hidden>{d.icon || '🌤️'}</div>
                      <div className="range" aria-label={`High ${Math.round(d.max)} low ${Math.round(d.min)}`}>
                        {Math.round(d.max)}° / {Math.round(d.min)}°
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{d.condition}</div>
                    </article>
                  ))
                ) : (
                  <div className="state">No forecast data available.</div>
                )}
              </div>
            )}
          </section>
        </main>

        <footer style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', fontSize: 12 }}>
          <div>Environment: {process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'development'}</div>
          <div>API Base: {apiBase ? 'Configured' : 'Not configured (using mock)'}</div>
        </footer>
      </div>
    </div>
  );
}
