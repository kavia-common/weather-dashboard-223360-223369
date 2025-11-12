import { useMemo } from 'react';
import { theme } from '../theme/theme';

/**
 * CurrentWeather component
 * Displays temperature, icon, description, humidity, wind, feels like, high/low
 */
// PUBLIC_INTERFACE
export default function CurrentWeather({ data, loading, error }) {
  /** This is a public function component. */
  const styles = useMemo(
    () => ({
      card: {
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.md,
        padding: '20px',
        color: theme.colors.text,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      },
      title: {
        fontSize: '18px',
        fontWeight: 700,
      },
      chip: {
        background: theme.colors.secondary,
        color: '#111827',
        borderRadius: theme.radius.full,
        padding: '6px 10px',
        fontSize: '12px',
        fontWeight: 700,
        boxShadow: theme.shadow.inset,
      },
      main: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center',
      },
      temp: {
        fontSize: '48px',
        fontWeight: 800,
      },
      desc: {
        color: theme.colors.textMuted,
        marginTop: '4px',
      },
      meta: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: '16px',
      },
      pill: {
        background: `linear-gradient(180deg, ${theme.gradient.from}, ${theme.gradient.to})`,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        padding: '10px 12px',
        fontSize: '14px',
        textAlign: 'center',
      },
      error: {
        color: theme.colors.error,
        fontWeight: 600,
      },
      skeleton: {
        height: '120px',
        background: `linear-gradient(90deg, #f0f0f0 0%, #fafafa 50%, #f0f0f0 100%)`,
        borderRadius: theme.radius.md,
        animation: 'pulse 1.4s ease-in-out infinite',
      },
      icon: {
        width: '72px',
        height: '72px',
      },
      '@keyframes pulse': {},
    }),
    []
  );

  if (loading) {
    return (
      <div style={styles.card} aria-busy="true">
        <div style={styles.skeleton} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.card}>
        <div style={styles.error} role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={styles.card}>
        <div style={{ color: theme.colors.textMuted }}>Search a city to view weather.</div>
      </div>
    );
  }

  // Assume a common shape; map defensively
  const {
    city = '',
    country = '',
    temperature,
    temp = temperature, // alias
    temp_min,
    temp_max,
    feels_like,
    description,
    icon,
    humidity,
    wind_speed,
    wind = {},
  } = data || {};

  const windSpeed = typeof wind_speed === 'number' ? wind_speed : wind.speed;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.title} aria-live="polite">
          {city || data.name || '—'} {country ? `• ${country}` : ''}
        </div>
        <div style={styles.chip}>Current</div>
      </div>

      <div style={styles.main}>
        <div>
          <div style={styles.temp}>
            {Math.round(temp ?? 0)}
            <span style={{ fontSize: 18, marginLeft: 4 }}>°</span>
          </div>
          <div style={styles.desc}>{description || (data.weather && data.weather[0]?.description) || '—'}</div>
        </div>
        <div>
          {icon || (data.weather && data.weather[0]?.icon) ? (
            <img
              style={styles.icon}
              src={
                icon
                  ? icon
                  : `https://openweathermap.org/img/wn/${data.weather[0]?.icon}@2x.png`
              }
              alt="weather icon"
            />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: theme.radius.md, background: '#eee' }} />
          )}
        </div>
      </div>

      <div style={styles.meta}>
        <div style={styles.pill}>
          Feels like: <strong>{Math.round(feels_like ?? temp ?? 0)}°</strong>
        </div>
        <div style={styles.pill}>
          High/Low: <strong>{Math.round((temp_max ?? temp) ?? 0)}° / {Math.round((temp_min ?? temp) ?? 0)}°</strong>
        </div>
        <div style={styles.pill}>
          Humidity: <strong>{Math.round(humidity ?? 0)}%</strong>
        </div>
        <div style={styles.pill}>
          Wind: <strong>{typeof windSpeed === 'number' ? `${windSpeed} m/s` : '—'}</strong>
        </div>
      </div>
    </div>
  );
}
