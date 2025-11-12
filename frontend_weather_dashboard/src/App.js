import React, { useEffect, useMemo, useState } from 'react';
import './theme.css';
import './index.css';
import { fetchWeather, fetchWeatherByCoords, getFeatureFlags } from './services/apiClient';

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
   * - Detect current location (Geolocation API)
   * - Show current conditions
   * - Show 5-day forecast
   * - Handles loading and error states
   * - Persists last successful location to localStorage
   * - Accessible and responsive UI
   */
  const [query, setQuery] = useState('San Francisco');
  const [data, setData] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [notice, setNotice] = useState(
    'We use your device location only to fetch local weather. Your precise coordinates are not stored.'
  );
  const flags = useMemo(() => getFeatureFlags(), []);

  const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';

  function persistLastLocation(entry) {
    try {
      // Only store city names for search. For geo, store only the type marker and last resolved city name from API.
      localStorage.setItem('lastLocation', JSON.stringify(entry));
    } catch {
      // Ignore storage errors (Safari private mode, etc.)
    }
  }

  function readLastLocation() {
    try {
      const raw = localStorage.getItem('lastLocation');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function load(q, opts = { source: 'search' }) {
    setError('');
    setState('loading');
    try {
      const result = await fetchWeather(q);
      setData(result);
      setState('success');
      // Persist last successful search as city name
      persistLastLocation({ type: 'search', value: q });
    } catch (e) {
      setError(e?.message || 'Failed to load weather.');
      setState('error');
    }
  }

  async function loadByCoords(lat, lon) {
    setError('');
    setState('loading');
    try {
      const result = await fetchWeatherByCoords(lat, lon);
      setData(result);
      setState('success');
      // Persist type=geo and store resolved city name only (no raw coordinates)
      if (result?.location) {
        persistLastLocation({ type: 'geo', value: result.location });
      } else {
        // Fallback to a generic tag if no location name available
        persistLastLocation({ type: 'geo', value: 'My Location' });
      }
    } catch (e) {
      setError(e?.message || 'Failed to load weather.');
      setState('error');
    }
  }

  // On first load: try to load from localStorage; otherwise use default query
  useEffect(() => {
    const last = readLastLocation();
    if (last?.type === 'search' && typeof last.value === 'string' && last.value.trim()) {
      setQuery(last.value);
      load(last.value);
    } else if (last?.type === 'geo' && typeof last.value === 'string' && last.value.trim()) {
      // We only stored a label for geo; just run a normal load using the label to rehydrate in mock mode
      // In real API mode, better to re-detect or have the backend support lookup by label; we allow re-detection via button.
      setQuery(last.value);
      load(last.value);
    } else {
      load(query);
    }
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

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setState('error');
      return;
    }
    setDetecting(true);
    setNotice('Requesting permission to access your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        setDetecting(false);
        setNotice('We use your device location only to fetch local weather. Your precise coordinates are not stored.');
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          setError('Location unavailable. Please try again or use search.');
          setState('error');
          return;
        }
        // Load by coordinates
        loadByCoords(latitude, longitude);
      },
      (err) => {
        setDetecting(false);
        // Permission and other error handling with friendly messages
        let message = 'Unable to access location. You can search manually.';
        if (err?.code === 1) {
          message = 'Permission to access location was denied. You can still search by city.';
        } else if (err?.code === 2) {
          message = 'Location information is unavailable. Please try again or use search.';
        } else if (err?.code === 3) {
          message = 'Location request timed out. Please try again or use search.';
        }
        setError(message);
        setState('error');
        // Do NOT store any coordinates or geo state on failure/denial
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
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
            <button
              type="button"
              className="btn secondary"
              aria-label="Detect my location"
              onClick={handleDetectLocation}
              disabled={detecting}
              title="Use your device location to fetch local weather"
            >
              {detecting ? 'Detecting…' : 'Detect My Location'}
            </button>
          </form>
        </header>

        <div className="panel" role="note" aria-live="polite" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#6b7280', fontSize: 13 }}>{notice}</span>
            <button
              type="button"
              className="btn"
              style={{ padding: '8px 12px', fontSize: 12 }}
              aria-label="Re-detect my location"
              onClick={handleDetectLocation}
              disabled={detecting}
            >
              {detecting ? 'Locating…' : 'Re-detect'}
            </button>
          </div>
        </div>

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
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn secondary" onClick={() => load(query)} aria-label="Retry fetching weather">
                    Retry
                  </button>
                  <button
                    className="btn"
                    onClick={handleDetectLocation}
                    aria-label="Try detecting location again"
                    disabled={detecting}
                  >
                    {detecting ? 'Detecting…' : 'Try Detecting Location'}
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
