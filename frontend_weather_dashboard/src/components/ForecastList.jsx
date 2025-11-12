import React from 'react';

/**
 * PUBLIC_INTERFACE
 * ForecastList renders a set of forecast items for upcoming days.
 * Each item supports: day, icon(optional), highC, lowC, summary
 */
function ForecastList({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-label="5-day forecast">
      <div className="forecast-grid">
        {items.map((it, idx) => (
          <article className="forecast-card" key={`${it.day}-${idx}`} aria-label={`Forecast for ${it.day}`}>
            <div className="day">{it.day}</div>
            <div className="icon" aria-hidden="true">{it.icon || '⛅'}</div>
            <div className="temps" aria-label={`High ${Math.round(it.highC)} degrees, Low ${Math.round(it.lowC)} degrees`}>
              <span className="temp-high">{Math.round(it.highC)}°</span>
              <span className="temp-low">{Math.round(it.lowC)}°</span>
            </div>
            <div className="muted small">{it.summary}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ForecastList;
