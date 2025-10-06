@echo off
echo 🚀 Starting Lumaa AI Backend...
echo ================================

cd backend

REM Check if virtual environment exists, create if not
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt --quiet

REM Create .env if it doesn't exist
if not exist ".env" (
    echo ⚙️  Creating .env file...
    (
        echo MONGO_URL="mongodb://localhost:27017"
        echo DB_NAME="lumaa_ai_db"
        echo DATABASE_URL="postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/lumaa_ai_db"
        echo POSTGRES_URL="postgres://postgres:YOUR_PASSWORD@localhost:5432/lumaa_ai_db"
        echo CORS_ORIGINS="http://localhost:3000"
    ) > .env
    echo ⚠️  IMPORTANT: Edit backend\.env and set your PostgreSQL password!
    pause
)

REM Run database migration
echo 🗄️  Running database migrations...
python migrate_db.py

REM Start the server
echo.
echo ✅ Backend starting on http://localhost:8001
echo ================================
echo.
uvicorn server:app --reload --host 0.0.0.0 --port 8001