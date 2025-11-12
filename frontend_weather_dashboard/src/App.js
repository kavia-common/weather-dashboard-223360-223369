import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import SearchBar from './components/SearchBar';
import CurrentWeather from './components/CurrentWeather';
import Forecast from './components/Forecast';
import { theme } from './theme/theme';
import { getCurrentWeather, getForecast, healthcheck } from './services/WeatherService';

// PUBLIC_INTERFACE
function App() {
  /** Main Weather Dashboard App with Ocean Professional styling */
  const [city, setCity] = useState(process.env.REACT_APP_DEFAULT_CITY || 'San Francisco');
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [errorCurrent, setErrorCurrent] = useState('');
  const [errorForecast, setErrorForecast] = useState('');
  const [health, setHealth] = useState({ ok: false, status: 0 });

  const load = async (targetCity) => {
    const q = (targetCity || city || '').trim();
    if (!q) return;
    setErrorCurrent('');
    setErrorForecast('');
    setLoadingCurrent(true);
    setLoadingForecast(true);
    try {
      const [cw, fc] = await Promise.all([
        getCurrentWeather(q).catch((e) => {
          setErrorCurrent(e.message);
          return null;
        }),
        getForecast(q).catch((e) => {
          setErrorForecast(e.message);
          return [];
        }),
      ]);
      setCurrent(cw);
      setForecast(Array.isArray(fc?.list) ? fc.list : (Array.isArray(fc) ? fc : []));
    } finally {
      setLoadingCurrent(false);
      setLoadingForecast(false);
    }
  };

  useEffect(() => {
    // Health check on mount
    (async () => {
      const h = await healthcheck();
      setHealth(h);
    })();
    // Load default city on mount
    load(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (q) => {
    if (!q || q.trim().length === 0) return;
    setCity(q.trim());
    load(q.trim());
  };

  const styles = useMemo(
    () => ({
      app: {
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${theme.gradient.from}, ${theme.gradient.to})`,
      },
      container: {
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 16px 56px',
        display: 'grid',
        gap: '16px',
      },
      header: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      },
      title: {
        color: theme.colors.text,
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      subtitle: {
        color: theme.colors.textMuted,
        fontSize: 14,
      },
      grid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
      },
      row: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
      },
      health: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        padding: '6px 10px',
        borderRadius: theme.radius.full,
        border: `1px solid ${theme.colors.border}`,
        background: theme.colors.surface,
        color: health.ok ? theme.colors.text : theme.colors.error,
        boxShadow: theme.shadow.sm,
      },
      dot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: health.ok ? theme.colors.secondary : theme.colors.error,
        boxShadow: health.ok ? '0 0 0 3px rgba(245,158,11,0.2)' : '0 0 0 3px rgba(239,68,68,0.2)',
      },
      footer: {
        textAlign: 'center',
        color: theme.colors.textMuted,
        fontSize: 12,
        marginTop: 24,
      },
    }),
    [health.ok]
  );

  return (
    <div style={styles.app}>
      <main style={styles.container}>
        <section style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={styles.title}>Weather Dashboard</div>
              <div style={styles.subtitle}>Modern, responsive weather overview</div>
            </div>
            <div style={styles.health} aria-live="polite" title={`API health status: ${health.ok ? 'OK' : 'Unavailable'}`}>
              <span style={styles.dot} />
              <span>{health.ok ? `API healthy${health.status ? ` (${health.status})` : ''}` : 'API unavailable'}</span>
            </div>
          </div>

          <SearchBar defaultCity={city} onSearch={onSearch} />
        </section>

        <section style={styles.grid} aria-label="Current weather">
          <CurrentWeather data={current} loading={loadingCurrent} error={errorCurrent} />
        </section>

        <section style={styles.row} aria-label="5-day forecast">
          <Forecast days={forecast} loading={loadingForecast} error={errorForecast} />
        </section>

        <div style={styles.footer}>
          Data provided by configured backend/proxy • No secrets stored in client
        </div>
      </main>
    </div>
  );
}

export default App;
