//
//
// WeatherService - Handles API communication with weather backend/provider
//

const API_BASE = process.env.REACT_APP_API_BASE;

// Basic input sanitization to prevent malformed URLs and potential injection
function sanitizeCity(input) {
  if (typeof input !== 'string') return '';
  // Trim, collapse spaces, allow letters, spaces, commas, hyphens, and apostrophes
  const cleaned = input.trim().replace(/\s+/g, ' ');
  // Remove any characters that are not typical in city names
  const safe = cleaned.replace(/[^a-zA-Z\u00C0-\u024F0-9 ,.'-]/g, '');
  return safe.slice(0, 80);
}

/**
 * Build URL ensuring no double slashes and proper encoding of query values.
 * - If REACT_APP_API_BASE is absolute (http/https), return absolute URL.
 * - If REACT_APP_API_BASE is relative (e.g., "/api"), return relative URL (for CRA proxy).
 */
function buildUrl(path, params = {}) {
  const isAbsolute = typeof API_BASE === 'string' && /^https?:\/\//i.test(API_BASE);
  const base = (API_BASE || '').replace(/\/*$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(base + rel, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });
  return isAbsolute ? url.toString() : url.toString().replace(window.location.origin, ''); // relative for CRA proxy if configured
}

// PUBLIC_INTERFACE
export async function getCurrentWeather(city) {
  /**
   * Fetch current weather for a given city.
   * Uses environment-based API base, returns parsed JSON or throws Error with message.
   */
  const safeCity = sanitizeCity(city);
  if (!safeCity) throw new Error('Please provide a valid city name.');
  try {
    const res = await fetch(buildUrl('/weather', { city: safeCity }), {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch current weather (${res.status}): ${text || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Unable to load current weather. ${err.message}`);
  }
}

// PUBLIC_INTERFACE
export async function getForecast(city) {
  /**
   * Fetch 5-day forecast for a given city.
   * Returns parsed JSON or throws Error with message.
   */
  const safeCity = sanitizeCity(city);
  if (!safeCity) throw new Error('Please provide a valid city name.');
  try {
    const res = await fetch(buildUrl('/forecast', { city: safeCity }), {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch forecast (${res.status}): ${text || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Unable to load forecast. ${err.message}`);
  }
}

/**
 * Healthcheck endpoint probe. Returns { ok: boolean, status?: number }.
 * This function handles missing API base gracefully.
 */
// PUBLIC_INTERFACE
export async function healthcheck() {
  if (!API_BASE) {
    return { ok: false, status: 0 };
  }
  try {
    const res = await fetch(buildUrl('/health'), { method: 'GET' });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
