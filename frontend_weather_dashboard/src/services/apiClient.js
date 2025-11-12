//
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

/**
 * Safely join base URL with a path (with optional query).
 * Avoids double slashes and missing slash between host and path.
 */
function buildUrl(pathWithQuery) {
  const base = (API_BASE || '').replace(/\/$/, '');
  const suffix = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  return `${base}${suffix}`;
}

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

  const url = buildUrl(`/weather?query=${encodeURIComponent(query)}`);
  return await doFetchAndNormalize(url, query);
}

// PUBLIC_INTERFACE
export async function fetchWeatherByCoords(lat, lon) {
  /**
   * Fetches weather using latitude/longitude coordinates.
   * Uses endpoint: /weather?lat=..&lon=..
   * Normalizes to standard format.
   *
   * @param {number|string} lat - Latitude
   * @param {number|string} lon - Longitude
   * @returns {Promise<object>} Normalized weather payload
   */
  const flags = getFeatureFlags();
  const useMock = flags.MOCK_WEATHER || !API_BASE;

  if (useMock) {
    await new Promise((r) => setTimeout(r, 600));
    const seed = `geo:${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
    const payload = mockWeather(seed);
    return { ...payload, location: payload.location || 'My Location' };
  }

  const url = buildUrl(`/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
  return await doFetchAndNormalize(url, `geo:${lat},${lon}`);
}

async function doFetchAndNormalize(url, seedForErrorContext) {
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
    error.context = seedForErrorContext;
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
    data?.name ||
    data?.city ||
    data?.query ||
    data?.location ||
    'Unknown Location';

  // support various current keys: current, now, data.current_weather, weather, conditions
  const currentSource =
    data?.current ||
    data?.now ||
    data?.current_weather ||
    data?.weather ||
    data?.conditions ||
    (Array.isArray(data?.data) && data.data[0]) ||
    {};

  // normalize wind and humidity name variants
  const windValue =
    typeof currentSource.wind === 'number'
      ? currentSource.wind
      : typeof currentSource.wind_speed === 'number'
      ? currentSource.wind_speed
      : typeof currentSource.windSpeed === 'number'
      ? currentSource.windSpeed
      : 0;

  const humidityValue =
    typeof currentSource.humidity === 'number'
      ? currentSource.humidity
      : typeof currentSource.rh === 'number'
      ? currentSource.rh
      : typeof currentSource.humidity_pct === 'number'
      ? currentSource.humidity_pct
      : 0;

  const tempValue =
    typeof currentSource.temp === 'number'
      ? currentSource.temp
      : typeof currentSource.temperature === 'number'
      ? currentSource.temperature
      : typeof currentSource.temp_c === 'number'
      ? currentSource.temp_c
      : typeof currentSource.temp_f === 'number'
      ? ((currentSource.temp_f - 32) * 5) / 9
      : 0;

  const conditionValue =
    currentSource.condition ||
    currentSource.summary ||
    currentSource.description ||
    (typeof currentSource.text === 'string' ? currentSource.text : 'Unknown');

  const current = {
    temp: tempValue,
    condition: conditionValue,
    humidity: humidityValue,
    wind: windValue,
    icon: currentSource.icon || '⛅️',
  };

  // Forecast: support forecast, daily, data.daily, list (OpenWeather)
  const forecastSource =
    data?.forecast ||
    data?.daily ||
    data?.data?.daily ||
    data?.list ||
    [];

  const forecast = Array.isArray(forecastSource)
    ? forecastSource.slice(0, 5).map((d, idx) => {
        // date handling
        const dateVal =
          d.date ||
          d.dt ||
          d.datetime ||
          (typeof d.time === 'number' ? new Date(d.time * 1000).toISOString().split('T')[0] : `Day ${idx + 1}`);

        // temperature min/max variants
        const minVal =
          typeof d.min === 'number'
            ? d.min
            : typeof d.temp?.min === 'number'
            ? d.temp.min
            : typeof d.temperature?.min === 'number'
            ? d.temperature.min
            : 0;

        const maxVal =
          typeof d.max === 'number'
            ? d.max
            : typeof d.temp?.max === 'number'
            ? d.temp.max
            : typeof d.temperature?.max === 'number'
            ? d.temperature.max
            : 0;

        // condition/icon variants
        const condVal =
          d.condition ||
          d.summary ||
          (Array.isArray(d.weather) && d.weather[0]?.description) ||
          d.description ||
          '—';

        const iconVal =
          d.icon ||
          (Array.isArray(d.weather) && d.weather[0]?.icon) ||
          '🌤️';

        return {
          date: typeof dateVal === 'number' ? new Date(dateVal * 1000).toISOString().split('T')[0] : String(dateVal),
          min: minVal,
          max: maxVal,
          condition: condVal,
          icon: iconVal,
        };
      })
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
    const min = baseTemp + (i % 2 === 0 ? -3 : -1);
    const max = baseTemp + (i % 2 === 0 ? 2 : 4);
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
      humidity: 40 + ((idx * 8) % 50),
      wind: 5 + ((idx * 2) % 15),
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
