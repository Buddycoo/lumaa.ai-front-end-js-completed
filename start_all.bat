@echo off
echo 🚀 Starting BOTH Lumaa AI Servers...
echo =====================================
echo.
echo Landing Page: http://localhost:3000
echo Dashboard:    http://localhost:4000
echo.
echo Press Ctrl+C to stop all servers
echo =====================================
echo.

start "Landing Page" cmd /k "cd landing-page && node start.js"
timeout /t 3 /nobreak > nul
start "Dashboard" cmd /k "cd dashboard && node start.js"

echo.
echo ✅ Both servers starting in separate windows!
echo Close the windows to stop the servers.
pause