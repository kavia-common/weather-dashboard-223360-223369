//
// Lightweight API client for the weather dashboard
// Routes all external calls through this client and reads configuration
// from environment variables to avoid hardcoded secrets or URLs.
//

// PUBLIC_INTERFACE
export function getFeatureFlags() {
  /** Returns parsed feature flags from REACT_APP_FEATURE_FLAGS (comma-separated key=value). */
  const flagsStr = process.env.REACT_APP_FEATURE_FLAGS || '';
  const flags = {};
  flagsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((kv) => {
      const [k, v] = kv.split('=');
      if (k) flags[k] = (v || 'true').toLowerCase() === 'true';
    });
  return flags;
}

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  ''; // Intentionally empty if not configured

// PUBLIC_INTERFACE
export async function fetchWeather(query) {
  /**
   * Fetches weather data for a given query (city or "lat,lon").
   * - Reads base URL from env (REACT_APP_API_BASE).
   * - Supports mock mode via feature flag MOCK_WEATHER=true in REACT_APP_FEATURE_FLAGS.
   * Returns a normalized payload:
   * {
   *   location: string,
   *   current: { temp: number, condition: string, humidity: number, wind: number, icon: string },
   *   forecast: Array<{ date: string, min: number, max: number, condition: string, icon: string }>
   * }
   */
  const flags = getFeatureFlags();
  const useMock = flags.MOCK_WEATHER || !API_BASE;

  if (useMock) {
    // Simulated network delay
    await new Promise((r) => setTimeout(r, 600));
    return mockWeather(query);
  }

  const url = `${API_BASE.replace(/\/$/, '')}/weather?query=${encodeURIComponent(
    query
  )}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      // Non-sensitive error message
      const message = `Request failed with status ${res.status}`;
      throw new Error(message);
    }

    const data = await res.json();

    // Expecting backend to return similar shape; if not, map to normalized structure here.
    return normalizeWeatherPayload(data);
  } catch (err) {
    // Avoid logging sensitive details; surface friendly message.
    const error = new Error('Unable to fetch weather. Please try again.');
    error.cause = err?.message || 'NETWORK_OR_BACKEND_ERROR';
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeWeatherPayload(data) {
  // Attempt to map common shapes to normalized format
  // If already normalized, pass through.
  if (data?.current && data?.forecast && data?.location) {
    return data;
  }

  // Example mapping if backend uses different keys
  const location =
    data?.location?.name ||
    data?.city ||
    data?.query ||
    'Unknown Location';

  const currentSource = data?.current || data?.now || {};
  const forecastSource = data?.forecast || data?.daily || [];

  const current = {
    temp:
      typeof currentSource.temp === 'number'
        ? currentSource.temp
        : currentSource.temperature ?? 0,
    condition:
      currentSource.condition ||
      currentSource.summary ||
      'Unknown',
    humidity:
      typeof currentSource.humidity === 'number'
        ? currentSource.humidity
        : 0,
    wind:
      typeof currentSource.wind === 'number'
        ? currentSource.wind
        : currentSource.wind_speed ?? 0,
    icon: currentSource.icon || '⛅️',
  };

  const forecast = Array.isArray(forecastSource)
    ? forecastSource.slice(0, 5).map((d, idx) => ({
        date: d.date || d.dt || `Day ${idx + 1}`,
        min:
          typeof d.min === 'number'
            ? d.min
            : d.temp?.min ?? 0,
        max:
          typeof d.max === 'number'
            ? d.max
            : d.temp?.max ?? 0,
        condition: d.condition || d.summary || '—',
        icon: d.icon || '🌤️',
      }))
    : [];

  return { location, current, forecast };
}

function mockWeather(query) {
  // Generate deterministic mock data based on query
  const baseTemp = 20 + Math.floor((hash(query) % 100) / 10);
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorms', 'Windy'];
  const icons = ['☀️', '🌤️', '☁️', '🌧️', '⛈️', '🌬️'];
  const idx = Math.abs(hash(query)) % conditions.length;

  const today = new Date();
  const forecast = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    const min = baseTemp + ((i % 2 === 0) ? -3 : -1);
    const max = baseTemp + ((i % 2 === 0) ? 2 : 4);
    return {
      date: d.toISOString().split('T')[0],
      min,
      max,
      condition: conditions[(idx + i) % conditions.length],
      icon: icons[(idx + i) % icons.length],
    };
  });

  return {
    location: query || 'Sample City',
    current: {
      temp: baseTemp,
      condition: conditions[idx],
      humidity: 40 + (idx * 8) % 50,
      wind: 5 + (idx * 2) % 15,
      icon: icons[idx],
    },
    forecast,
  };
}

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
