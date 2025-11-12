# Weather Dashboard - Frontend

A modern React weather dashboard with Ocean Professional theme. Features a debounced city search, current weather panel, 5-day forecast cards, loading and error states, and an API health indicator.

## Prerequisites

- Node.js 16+ and npm
- A weather-compatible backend or proxy reachable via `REACT_APP_API_BASE`

## Environment Variables

Create a `.env` file (see `.env.example`):

- `REACT_APP_API_BASE` (required): Base URL for API calls (e.g., http://localhost:8080 or /api). No trailing slash recommended. Absolute URLs are used as-is; relative paths (like `/api`) will use the frontend origin and work with CRA proxy.
- `REACT_APP_DEFAULT_CITY` (optional): Default city to load on startup (e.g., San Francisco).

Other environment variables may exist in this container but are not required for this UI to run.

## Run locally

1. Install dependencies
   ```
   npm install
   ```
2. Start the app
   ```
   npm start
   ```
3. Open http://localhost:3000

## Usage

- Enter a city name in the search bar and press Enter or click Search.
- The app calls:
  - `${REACT_APP_API_BASE}/weather?city={CITY}`
  - `${REACT_APP_API_BASE}/forecast?city={CITY}`
- The health indicator attempts to ping `${REACT_APP_API_BASE}/health` and handles missing endpoints gracefully.

## Theming

Ocean Professional color tokens are defined in:
- `src/theme/theme.js`
- `src/index.css` and `src/App.css` provide base CSS variables and utilities.

Colors:
- Primary: `#2563EB`
- Secondary: `#F59E0B`
- Error: `#EF4444`
- Background: `#f9fafb`
- Surface: `#ffffff`
- Text: `#111827`

## Accessibility

- Inputs and buttons include aria labels.
- Live regions update API health.

## Notes

- Do not hardcode API keys in the client.
- The WeatherService reads from `process.env.REACT_APP_API_BASE` and builds relative URLs compatible with CRA proxy.
- The app expects reasonable JSON shapes for current weather and forecast; it maps defensively to common fields.

## Build

```
npm run build
```

Outputs production build to `build/`.
