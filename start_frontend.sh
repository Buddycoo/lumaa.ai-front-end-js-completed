#!/bin/bash

echo "🚀 Starting Lumaa AI Frontend..."
echo "================================"

cd frontend

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a few minutes)..."
    yarn install || npm install
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
fi

# Start the development server
echo ""
echo "✅ Frontend starting on http://localhost:3000"
echo "================================"
echo ""
yarn start || npm start