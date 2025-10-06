@echo off
echo 🚀 Starting Lumaa AI Frontend...
echo ================================

cd frontend

REM Check if node_modules exists, install if not
if not exist "node_modules" (
    echo 📦 Installing dependencies (this may take a few minutes)...
    call yarn install || call npm install
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo ⚙️  Creating .env file...
    echo REACT_APP_BACKEND_URL=http://localhost:8001 > .env
)

REM Start the development server
echo.
echo ✅ Frontend starting on http://localhost:3000
echo ================================
echo.
call yarn start || call npm start