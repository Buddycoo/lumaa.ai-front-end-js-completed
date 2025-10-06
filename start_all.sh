#!/bin/bash

echo "🚀 Starting BOTH Lumaa AI Servers..."
echo "====================================="
echo ""
echo "Landing Page: http://localhost:3000"
echo "Dashboard:    http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "====================================="
echo ""

# Start landing page in background
cd landing-page && node start.js &
LANDING_PID=$!

# Wait a bit
sleep 3

# Start dashboard in background
cd ../dashboard && node start.js &
DASHBOARD_PID=$!

# Wait for Ctrl+C
trap "echo '\n\nShutting down all servers...'; kill $LANDING_PID $DASHBOARD_PID; exit" INT

# Keep script running
wait