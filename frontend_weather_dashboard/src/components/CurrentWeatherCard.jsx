import React from 'react';

/**
 * PUBLIC_INTERFACE
 * CurrentWeatherCard displays current weather summary for a city.
 * Expects data with fields: tempC, condition, humidity, windKph, feelsLikeC, icon(optional)
 */
function CurrentWeatherCard({ city, data }) {
  const {
    tempC,
    condition,
    humidity,
    windKph,
    feelsLikeC,
    icon
  } = data || {};

  return (
    <section className="current-card" aria-label={`Current weather in ${city}`}>
      <div>
        <div className="header">
          <h2 className="city">{city}</h2>
          <span className="meta">{condition}</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'.25rem'}}>
          <div className="temperature">{Math.round(tempC)}°C</div>
          {typeof feelsLikeC === 'number' && (
            <div className="muted">Feels like {Math.round(feelsLikeC)}°C</div>
          )}
          <div aria-hidden="true" style={{marginLeft:'auto', fontSize:'2rem'}}>
            {icon || '🌤️'}
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="label">Humidity</div>
          <div className="value">{Math.round(humidity)}%</div>
        </div>
        <div className="stat">
          <div className="label">Wind</div>
          <div className="value">{Math.round(windKph)} km/h</div>
        </div>
        <div className="stat">
          <div className="label">Condition</div>
          <div className="value">{condition}</div>
        </div>
      </div>
    </section>
  );
}

export default CurrentWeatherCard;
