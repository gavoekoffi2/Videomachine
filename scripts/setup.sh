#!/bin/bash
# VideoMachine Setup Script

set -e

echo "🎬 VideoMachine - Setup"
echo "========================"

# Check requirements
command -v python3 >/dev/null 2>&1 || { echo "Python3 is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "⚠️  FFmpeg not found. Install: sudo apt install ffmpeg"; }

# Backend setup
echo "📦 Setting up backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env from example. Please configure your API keys!"
fi

python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q
echo "✅ Backend dependencies installed"

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend
npm install -q
echo "✅ Frontend dependencies installed"

echo ""
echo "🚀 Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && uvicorn main:app --reload --port 8000"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "📝 Don't forget to configure backend/.env with your API keys!"
