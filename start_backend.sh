#!/bin/bash

echo "🚀 Starting Lumaa AI Backend..."
echo "================================"

cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="lumaa_ai_db"
DATABASE_URL="postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/lumaa_ai_db"
POSTGRES_URL="postgres://postgres:YOUR_PASSWORD@localhost:5432/lumaa_ai_db"
CORS_ORIGINS="http://localhost:3000"
EOF
    echo "⚠️  IMPORTANT: Edit backend/.env and set your PostgreSQL password!"
    echo "Press Enter after you've updated the password..."
    read
fi

# Run database migration
echo "🗄️  Running database migrations..."
python migrate_db.py

# Start the server
echo ""
echo "✅ Backend starting on http://localhost:8001"
echo "================================"
echo ""
uvicorn server:app --reload --host 0.0.0.0 --port 8001