import { useMemo } from 'react';
import { theme } from '../theme/theme';

/**
 * Forecast component
 * Renders up to 5 forecast day cards with day name, icon, min/max temperatures
 */
// PUBLIC_INTERFACE
export default function Forecast({ days, loading, error }) {
  /** This is a public function component. */
  const styles = useMemo(
    () => ({
      wrapper: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(140px, 1fr))',
        gap: '12px',
      },
      card: {
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.sm,
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      },
      cardHover: {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadow.md,
      },
      day: { fontWeight: 700, color: theme.colors.text },
      icon: { width: '52px', height: '52px', margin: '8px 0' },
      temps: { display: 'flex', gap: '8px', fontWeight: 700 },
      min: { color: theme.colors.textMuted, fontWeight: 600 },
      error: { color: theme.colors.error, fontWeight: 600 },
      skeleton: {
        height: '100px',
        background: `linear-gradient(90deg, #f0f0f0 0%, #fafafa 50%, #f0f0f0 100%)`,
        borderRadius: theme.radius.md,
        animation: 'pulse 1.4s ease-in-out infinite',
      },
      container: {
        background: `linear-gradient(180deg, ${theme.gradient.from}, ${theme.gradient.to})`,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: '16px',
        boxShadow: theme.shadow.md,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      },
      title: { fontWeight: 800, color: theme.colors.text },
    }),
    []
  );

  if (loading) {
    return (
      <div style={styles.container} aria-busy="true">
        <div style={styles.header}>
          <div style={styles.title}>5-day Forecast</div>
        </div>
        <div style={styles.wrapper}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.skeleton} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.title}>5-day Forecast</div>
        </div>
        <div style={styles.error} role="alert">{error}</div>
      </div>
    );
  }

  const items = Array.isArray(days) ? days.slice(0, 5) : [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>5-day Forecast</div>
      </div>
      <div style={styles.wrapper}>
        {items.map((d, idx) => {
          const date = d.date || d.dt_txt || d.dt || d.time;
          const weekday = (() => {
            try {
              const dt = typeof date === 'number' ? new Date(date * 1000) : new Date(date);
              return dt.toLocaleDateString(undefined, { weekday: 'short' });
            } catch {
              return 'Day';
            }
          })();
          const icon = d.icon || (d.weather && d.weather[0]?.icon);
          const min = Math.round(d.temp_min ?? d.min ?? (d.main?.temp_min ?? 0));
          const max = Math.round(d.temp_max ?? d.max ?? (d.main?.temp_max ?? 0));

          return (
            <div
              key={idx}
              style={styles.card}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = theme.shadow.md)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = theme.shadow.sm)}
            >
              <div style={styles.day}>{weekday}</div>
              {icon ? (
                <img
                  style={styles.icon}
                  src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                  alt="forecast icon"
                />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: theme.radius.md, background: '#eee', margin: '8px 0' }} />
              )}
              <div style={styles.temps}>
                <div>{max}°</div>
                <div style={styles.min}>{min}°</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
