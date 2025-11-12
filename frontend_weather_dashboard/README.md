# Weather Dashboard (Frontend)

Modern React single-page app that lets users search a city and view current conditions plus a 5‑day forecast. Built with a lightweight stack and an Ocean Professional theme.

## Features
- Top search bar with validation and keyboard accessibility
- Current weather summary panel
- 5‑day forecast cards
- Loading and error states
- Environment-driven API base URL
- Mock mode via feature flag for offline/demo
- Responsive layout, accessible controls

## Quick Start
1. Install dependencies
   - npm install
2. Configure environment
   - Copy .env.example to .env and adjust values as needed
3. Run the app
   - npm start
4. Build (optional)
   - npm run build

The app runs at http://localhost:3000.

## Environment Variables
- REACT_APP_API_BASE: Base URL for the weather backend (e.g., https://api.example.com)
- REACT_APP_FEATURE_FLAGS: Comma-separated flags. To enable mock mode add: mockWeather=true

Example:
REACT_APP_API_BASE=https://api.example.com
REACT_APP_FEATURE_FLAGS=mockWeather=true

If REACT_APP_API_BASE is not set or mockWeather=true is present, the app uses mock data.

## Architecture
- src/App.js: main page layout and data orchestration
- src/components/SearchBar.jsx: city input with validation and ARIA attributes
- src/components/CurrentWeatherCard.jsx: current conditions summary
- src/components/ForecastList.jsx: 5-day forecast grid
- src/services/weatherService.js: API client using fetch, env-configured base URL, mock support
- src/theme/ThemeProvider.jsx: minimal theme provider applying Ocean Professional palette
- src/App.css, src/index.css: theme and component styles

## Accessibility Notes
- Inputs include aria-labels and error messaging with role="alert"
- Keyboard navigation supported (forms/buttons focusable with visible focus ring)
- Reduced motion users respected by browser settings

## Error Handling
- Network and server errors are caught and mapped to friendly messages.
- No sensitive error details are shown to end users.

## Security and Configuration
- No hardcoded secrets. All configuration via environment variables.
- Use HTTPS endpoints in production for REACT_APP_API_BASE.

## Backend Integration
- WeatherService expects endpoints:
  - GET /weather/current?city=CityName
  - GET /weather/forecast?city=CityName&days=5
- Response shape is normalized in the service; non-breaking field name variations are handled.

## Theming
Ocean Professional palette:
- Primary #2563EB
- Secondary/Success #F59E0B
- Error #EF4444
- Background #f9fafb
- Surface #ffffff
- Text #111827
With a subtle blue-to-gray gradient used in the header.

## Testing
- npm test to run tests (existing CRA config)

