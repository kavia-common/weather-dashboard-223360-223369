import React, { useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * SearchBar component for city lookup.
 * - Validates input for basic characters (letters, spaces, hyphens).
 * - Accessible labels and keyboard-friendly.
 */
function SearchBar({ onSearch, isLoading }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');

  const validate = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return 'Please enter a city name.';
    // Basic city validation: letters, periods, spaces, apostrophes, and hyphens
    const re = /^[a-zA-Z\u00C0-\u024F\s.'-]{2,}$/;
    if (!re.test(trimmed)) return 'City name contains invalid characters.';
    if (trimmed.length > 80) return 'City name is too long.';
    return '';
  };

  const submit = (e) => {
    e.preventDefault();
    const v = validate(value);
    if (v) {
      setErr(v);
      return;
    }
    setErr('');
    onSearch(value.trim());
  };

  return (
    <form className="searchbar" onSubmit={submit} aria-label="City search form">
      <label htmlFor="city" className="sr-only">City</label>
      <input
        id="city"
        type="text"
        name="city"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search city (e.g., London, New York)"
        aria-invalid={!!err}
        aria-describedby={err ? 'city-error' : undefined}
        autoComplete="off"
      />
      <button
        type="submit"
        className="btn search-btn"
        disabled={isLoading}
        aria-label="Search"
      >
        {isLoading ? 'Searching…' : 'Search'}
      </button>
      {err && (
        <div id="city-error" role="alert" className="alert error" style={{marginTop: '0.5rem'}}>
          <span className="alert-title">Validation</span>
          <span className="alert-message">{err}</span>
        </div>
      )}
    </form>
  );
}

export default SearchBar;
