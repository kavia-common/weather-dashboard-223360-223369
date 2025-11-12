//
// Geocoding client with environment-aware base URL and mock fallback.
// Provides an autocomplete-style lookup for city names returning an array of
// { id, name, state, country, lat, lon, label } entries.
//
// PUBLIC_INTERFACE
export function getGeocodeFeatureFlags() {
  /** Returns flags parsed from REACT_APP_FEATURE_FLAGS for geocoding feature toggles. */
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
  ''; // empty -> mock mode

function buildUrl(pathWithQuery) {
  const base = (API_BASE || '').replace(/\/$/, '');
  const suffix = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  return `${base}${suffix}`;
}

/**
 * Normalize a geocoding result into { id, name, state, country, lat, lon, label }.
 * Accepts a variety of shapes (OpenWeather Map Geocoding API or custom /geocode backend).
 */
function normalizeGeocodeItem(item, idx = 0) {
  const name = item?.name || item?.city || item?.locality || item?.title || 'Unknown';
  const state =
    item?.state ||
    item?.region ||
    item?.admin1 ||
    item?.province ||
    '';
  const country = item?.country || item?.country_code || item?.cc || '';
  const lat =
    typeof item?.lat === 'number'
      ? item.lat
      : typeof item?.latitude === 'number'
      ? item.latitude
      : parseFloat(item?.coord?.lat ?? NaN);
  const lon =
    typeof item?.lon === 'number'
      ? item.lon
      : typeof item?.lng === 'number'
      ? item.lng
      : typeof item?.longitude === 'number'
      ? item.longitude
      : parseFloat(item?.coord?.lon ?? NaN);

  const labelParts = [name, state, country].filter(Boolean);
  const label = labelParts.join(', ');
  const id = String(item?.id ?? `${name}-${state}-${country}-${lat},${lon}-${idx}`);
  return { id, name, state, country, lat, lon, label };
}

/**
 * Normalize a geocoding response into an array of normalized items.
 */
function normalizeGeocodeResponse(data) {
  if (!data) return [];
  const list = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];
  return list
    .map((it, i) => normalizeGeocodeItem(it, i))
    .filter((it) => Number.isFinite(it.lat) && Number.isFinite(it.lon));
}

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function mockGeocode(query) {
  // deterministic mock suggestions for a query, produces up to 5 variants
  const baseCities = [
    { name: 'San Francisco', state: 'CA', country: 'US', lat: 37.7749, lon: -122.4194 },
    { name: 'San Francisco', state: 'Cordoba', country: 'AR', lat: -31.4201, lon: -64.1888 },
    { name: 'Paris', state: 'Île-de-France', country: 'FR', lat: 48.8566, lon: 2.3522 },
    { name: 'Paris', state: 'Texas', country: 'US', lat: 33.6609, lon: -95.5555 },
    { name: 'Springfield', state: 'IL', country: 'US', lat: 39.7817, lon: -89.6501 },
    { name: 'Springfield', state: 'MA', country: 'US', lat: 42.1015, lon: -72.5898 },
    { name: 'Berlin', state: '', country: 'DE', lat: 52.52, lon: 13.405 },
    { name: 'Sydney', state: 'NSW', country: 'AU', lat: -33.8688, lon: 151.2093 },
  ];
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const filtered = baseCities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5);
  if (filtered.length) {
    return filtered.map((c, i) => ({
      id: `${c.name}-${c.state}-${c.country}-${i}`,
      name: c.name,
      state: c.state,
      country: c.country,
      lat: c.lat,
      lon: c.lon,
      label: [c.name, c.state, c.country].filter(Boolean).join(', '),
    }));
  }
  // fallback to synthetic city names
  const base = Math.abs(hash(q)) % 90;
  return Array.from({ length: 3 }).map((_, i) => {
    const lat = (base + i * 2) - 45;
    const lon = ((base * 3 + i * 7) % 180) - 90;
    const name = `${query} City ${i + 1}`;
    const state = i === 0 ? 'Central' : i === 1 ? 'North' : 'South';
    const country = i % 2 === 0 ? 'US' : 'GB';
    return {
      id: `${name}-${i}`,
      name,
      state,
      country,
      lat,
      lon,
      label: [name, state, country].filter(Boolean).join(', '),
    };
  });
}

// PUBLIC_INTERFACE
export async function geocodeQuery(query) {
  /**
   * Autocomplete geocoding lookup for user-entered query text.
   * - If REACT_APP_API_BASE is set, calls `${API_BASE}/geocode?q=...`
   * - Otherwise uses mockGeocode
   * - Returns Array<{ id, name, state, country, lat, lon, label }>
   */
  const flags = getGeocodeFeatureFlags();
  const useMock = flags.MOCK_WEATHER || !API_BASE; // reuse same mock flag as weather

  if (!query || !query.trim()) return [];
  const q = query.trim();

  if (useMock) {
    await new Promise((r) => setTimeout(r, 250));
    return mockGeocode(q);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = buildUrl(`/geocode?q=${encodeURIComponent(q)}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Geocoding failed (${res.status})`);
    }
    const data = await res.json();
    return normalizeGeocodeResponse(data);
  } catch (e) {
    // Fail closed with empty list; let caller show an error if needed
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
