#!/bin/bash

set -e

echo "🚀 Starting AI Flowo local development environment..."

echo "📦 Installing dependencies..."
npm install

echo "🐳 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 5

echo "🗄️ Running database migrations..."
npm run db:migrate

echo "✅ Environment ready!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
echo "MinIO Console: http://localhost:9001"
echo ""
echo "Run 'npm run dev' to start development servers"
