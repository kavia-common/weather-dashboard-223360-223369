#!/bin/bash
cd /home/kavia/workspace/code-generation/weather-dashboard-223360-223369/frontend_weather_dashboard
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

