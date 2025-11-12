import { useEffect, useMemo, useRef, useState } from 'react';
import { theme } from '../theme/theme';

/**
 * SearchBar component
 * - Debounced input
 * - Accessible labels
 * - Emits onSearch(city) when user clicks button or presses Enter
 */
// PUBLIC_INTERFACE
export default function SearchBar({ defaultCity = '', onSearch }) {
  /** This is a public function component. */
  const [query, setQuery] = useState(defaultCity);
  const [debounced, setDebounced] = useState(defaultCity);
  const timer = useRef(null);

  const handleInput = (e) => {
    setQuery(e.target.value);
  };

  const triggerSearch = () => {
    const value = (debounced || query || '').trim();
    if (!value) return;
    if (typeof onSearch === 'function') {
      // Pass coordinate string as-is if it looks like "lat,lon"
      onSearch(value);
    }
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(timer.current);
  }, [query]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
    }
  };

  const styles = useMemo(
    () => ({
      wrapper: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        background: `linear-gradient(180deg, ${theme.gradient.from}, ${theme.gradient.to})`,
        padding: '16px',
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.md,
        border: `1px solid ${theme.colors.border}`,
      },
      input: {
        flex: 1,
        padding: '12px 14px',
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        background: theme.colors.surface,
        color: theme.colors.text,
        outline: 'none',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
      },
      button: {
        background: theme.colors.primary,
        color: '#fff',
        padding: '12px 16px',
        border: 'none',
        borderRadius: theme.radius.md,
        cursor: 'pointer',
        fontWeight: 600,
        transition: 'transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease',
        boxShadow: theme.shadow.sm,
      },
      label: {
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      },
    }),
    []
  );

  return (
    <div style={styles.wrapper}>
      <label htmlFor="city-input" style={styles.label}>
        Enter city name
      </label>
      <input
        id="city-input"
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={onKeyDown}
        placeholder="Search city (e.g., London)"
        aria-label="City name"
        style={styles.input}
      />
      <button
        type="button"
        aria-label="Search weather"
        onClick={triggerSearch}
        style={styles.button}
      >
        Search
      </button>
    </div>
  );
}
