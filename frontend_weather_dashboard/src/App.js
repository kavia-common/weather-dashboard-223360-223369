import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import SearchBar from './components/SearchBar';
import CurrentWeatherCard from './components/CurrentWeatherCard';
import ForecastList from './components/ForecastList';
import { ThemeProvider } from './theme/ThemeProvider';
import weatherService from './services/weatherService';

/**
 * Weather Dashboard App
 * - Provides city search
 * - Displays current weather and 5-day forecast
 * - Uses environment-driven configuration and optional mock data
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);

  // Apply theme to document root for CSS variables if needed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const isMockEnabled = useMemo(() => {
    const flags = (process.env.REACT_APP_FEATURE_FLAGS || '').toLowerCase();
    return flags.split(',').map(f => f.trim()).includes('mockweather=true');
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSearch = async (value) => {
    setCity(value);
    setStatus('loading');
    setError('');
    setCurrent(null);
    setForecast([]);

    try {
      const [cw, fc] = await Promise.all([
        weatherService.getCurrentWeather(value, { mock: isMockEnabled }),
        weatherService.getForecast(value, { mock: isMockEnabled }),
      ]);
      setCurrent(cw);
      setForecast(fc);
      setStatus('success');
    } catch (e) {
      // Avoid exposing sensitive details to UI
      setError(e?.userMessage || 'Unable to fetch weather data. Please try again later.');
      setStatus('error');
    }
  };

  return (
    <ThemeProvider themeMode={theme}>
      <div className="wd-app">
        <header className="wd-header" role="banner">
          <div className="wd-header-inner">
            <div className="brand">
              <span className="brand-logo" aria-hidden="true">⛅</span>
              <h1 className="brand-title">Weather Dashboard</h1>
            </div>
            <div className="header-actions">
              <button
                className="btn theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
            </div>
          </div>
          <div className="wd-hero">
            <SearchBar
              onSearch={handleSearch}
              isLoading={status === 'loading'}
            />
          </div>
        </header>

        <main className="wd-main" role="main">
          {status === 'idle' && (
            <p className="muted tip">Search for a city to see current conditions and a 5-day forecast.</p>
          )}

          {status === 'loading' && (
            <div className="loader" aria-live="polite" aria-busy="true">
              Loading weather data…
            </div>
          )}

          {status === 'error' && (
            <div className="alert error" role="alert">
              <span className="alert-title">Error</span>
              <span className="alert-message">{error}</span>
            </div>
          )}

          {status === 'success' && current && (
            <>
              <CurrentWeatherCard city={city} data={current} />
              <ForecastList items={forecast} />
            </>
          )}
        </main>

        <footer className="wd-footer" role="contentinfo">
          <p className="muted small">
            API Base: {(process.env.REACT_APP_API_BASE || 'not set')}
            {' '}| Mock: {isMockEnabled ? 'enabled' : 'disabled'}
          </p>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
