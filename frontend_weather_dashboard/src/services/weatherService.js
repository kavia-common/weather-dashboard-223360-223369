const BASE_URL = process.env.REACT_APP_API_BASE;

/**
 * Map a network or parsing error to a user-friendly error with internal detail hidden.
 */
function toUserError(err, code = 'REQUEST_FAILED') {
  const error = new Error('Request failed');
  error.code = code;
  error.userMessage = 'A network or service error occurred while fetching weather data.';
  // Avoid attaching sensitive info to error object surfaced to UI
  return error;
}

/**
 * Utility: format date labels for next 5 days
 */
function nextDaysLabels() {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const days = [];
  const d = new Date();
  for (let i = 1; i <= 5; i++) {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    days.push(formatter.format(nd));
  }
  return days;
}

/**
 * Provide mock weather data for demo or offline mode.
 */
function buildMock(city) {
  const seed = (city || 'City').length;
  const base = 12 + (seed % 10);
  const conds = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Windy'];
  const cond = conds[seed % conds.length];
  const iconMap = {
    Sunny: '☀️', 'Partly Cloudy': '⛅', Cloudy: '☁️', 'Light Rain': '🌦️', Windy: '🌬️',
  };
  const current = {
    tempC: base + 4,
    feelsLikeC: base + 2,
    condition: cond,
    humidity: 45 + (seed % 30),
    windKph: 5 + (seed % 20),
    icon: iconMap[cond] || '⛅',
  };
  const days = nextDaysLabels().map((day, i) => ({
    day,
    highC: base + 5 + i,
    lowC: base - 1 - (i % 2),
    summary: conds[(seed + i) % conds.length],
    icon: iconMap[conds[(seed + i) % conds.length]] || '⛅',
  }));
  return { current, forecast: days };
}

/**
 * Build request URL with query params; simple encoder to avoid injection.
 */
function buildUrl(path, params = {}) {
  const u = new URL((BASE_URL || '').replace(/\/+$/, '') + '/' + path.replace(/^\/+/, ''));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.toString();
}

/**
 * PUBLIC_INTERFACE
 * getCurrentWeather(city): Fetch current weather for a city.
 */
async function getCurrentWeather(city, opts = {}) {
  const { mock } = opts;
  if (mock || !BASE_URL) {
    return buildMock(city).current;
  }
  try {
    const url = buildUrl('/weather/current', { city });
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      throw toUserError(new Error('Bad status'), 'HTTP_' + res.status);
    }
    const data = await res.json();
    // Normalize expected fields
    return {
      tempC: data.tempC ?? data.temperatureC ?? 0,
      feelsLikeC: data.feelsLikeC ?? data.feels_like_c ?? data.apparentTempC ?? undefined,
      condition: data.condition ?? data.summary ?? 'Unknown',
      humidity: data.humidity ?? 0,
      windKph: data.windKph ?? data.wind_kph ?? 0,
      icon: data.icon || undefined,
    };
  } catch (e) {
    throw toUserError(e);
  }
}

/**
 * PUBLIC_INTERFACE
 * getForecast(city): Fetch 5-day forecast for a city.
 */
async function getForecast(city, opts = {}) {
  const { mock } = opts;
  if (mock || !BASE_URL) {
    return buildMock(city).forecast;
  }
  try {
    const url = buildUrl('/weather/forecast', { city, days: 5 });
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      throw toUserError(new Error('Bad status'), 'HTTP_' + res.status);
    }
    const data = await res.json();
    // Expect an array of daily entries; normalize fields
    return (data.days || data || []).slice(0, 5).map((d) => ({
      day: d.day || d.dateLabel || d.date || '',
      highC: d.highC ?? d.maxC ?? d.max ?? 0,
      lowC: d.lowC ?? d.minC ?? d.min ?? 0,
      summary: d.summary ?? d.condition ?? '—',
      icon: d.icon || undefined,
    }));
  } catch (e) {
    throw toUserError(e);
  }
}

const api = { getCurrentWeather, getForecast };
export default api;
