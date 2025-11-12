//
//
// WeatherService - Handles API communication with weather backend/provider
//

/**
 * WeatherService - Handles API communication with weather backend/provider.
 * Supports querying by:
 * - city: "/weather?city=London"
 * - coordinates: "/weather?lat=...&lon=..."
 * If your backend expects different parameter names (e.g., q/location/zipcode), adjust PARAMS below.
 */

const API_BASE = process.env.REACT_APP_API_BASE;

// Canonical parameter names expected by the backend. Change here if backend differs.
const PARAMS = {
  city: 'city', // or 'q' / 'location'
  lat: 'lat',
  lon: 'lon',
};

/**
 * Basic input sanitization for city names to avoid malformed URLs.
 * Allows letters, numbers, spaces, commas, hyphens, apostrophes and periods.
 */
function sanitizeCity(input) {
  if (typeof input !== 'string') return '';
  const cleaned = input.trim().replace(/\s+/g, ' ');
  const safe = cleaned.replace(/[^a-zA-Z\u00C0-\u024F0-9 ,.'-]/g, '');
  return safe.slice(0, 80);
}

/**
 * Parse potential coordinate input.
 * Accepts:
 * - object: { lat: number|string, lon: number|string }
 * - string: "lat,lon" (comma separated) or "lat lon"
 * Returns { lat:number, lon:number } if valid, otherwise null.
 */
function parseCoords(input) {
  // object form
  if (input && typeof input === 'object' && ('lat' in input || 'lon' in input || 'lng' in input)) {
    const lat = Number(input.lat);
    const lon = Number(input.lon ?? input.lng);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    return null;
  }
  // string form: "12.34,56.78" or "12.34 56.78"
  if (typeof input === 'string') {
    const s = input.trim();
    const match = s.match(/^\s*(-?\d+(\.\d+)?)\s*[, ]\s*(-?\d+(\.\d+)?)\s*$/);
    if (match) {
      const lat = Number(match[1]);
      const lon = Number(match[3]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    }
  }
  return null;
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

/**
 * Map HTTP errors to user-friendly messages, especially for 400/404 "no results".
 */
function toUserError(prefix, res, bodyText) {
  if (res.status === 404) {
    return new Error(`${prefix}: no results found (404).`);
  }
  if (res.status === 400) {
    return new Error(`${prefix}: invalid location (400). Please try a city (e.g., "London") or "lat,lon".`);
  }
  return new Error(`${prefix} (${res.status}): ${bodyText || res.statusText}`);
}

/**
 * Build params from a query which may be a city string or coordinates.
 */
function buildLocationParams(query) {
  const coords = parseCoords(query);
  if (coords) {
    return { [PARAMS.lat]: coords.lat, [PARAMS.lon]: coords.lon };
  }
  const city = sanitizeCity(typeof query === 'string' ? query : '');
  if (city) {
    return { [PARAMS.city]: city };
  }
  return null;
}

// PUBLIC_INTERFACE
export async function getCurrentWeather(query) {
  /**
   * Fetch current weather for a given location (city or coordinates).
   * Uses environment-based API base, returns parsed JSON or throws Error with message.
   * @param {string|{lat:number, lon:number}} query - City name (e.g., "London") or coordinates object/string "lat,lon".
   */
  const params = buildLocationParams(query);
  if (!params) throw new Error('Please provide a valid city or coordinates (e.g., "37.77,-122.42").');
  try {
    const res = await fetch(buildUrl('/weather', params), {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw toUserError('Failed to fetch current weather', res, text);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Unable to load current weather. ${err.message}`);
  }
}

// PUBLIC_INTERFACE
export async function getForecast(query) {
  /**
   * Fetch 5-day forecast for a given location (city or coordinates).
   * Returns parsed JSON or throws Error with message.
   * @param {string|{lat:number, lon:number}} query - City name or coordinates.
   */
  const params = buildLocationParams(query);
  if (!params) throw new Error('Please provide a valid city or coordinates (e.g., "37.77,-122.42").');
  try {
    const res = await fetch(buildUrl('/forecast', params), {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw toUserError('Failed to fetch forecast', res, text);
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
