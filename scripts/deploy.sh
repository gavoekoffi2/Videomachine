#!/bin/bash
# VideoMachine VPS Deployment Script

set -e

echo "🚀 VideoMachine - Deploying to VPS..."

# Pull latest
git pull origin claude/saas-video-generator-F9IUY

# Build and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://$(hostname -I | awk '{print $1}')"
echo "📡 API: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
docker-compose ps
