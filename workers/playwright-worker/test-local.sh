#!/bin/bash

# Test script for Playwright Worker
echo "🧪 Testing Playwright Worker..."
echo ""

# Check if Redis is running
echo "1️⃣ Checking Redis connection..."
if nc -z localhost 6379 2>/dev/null; then
    echo "✅ Redis is running on localhost:6379"
else
    echo "❌ Redis is not running. Starting Redis with Docker..."
    docker-compose up -d redis
    sleep 3
    if nc -z localhost 6379 2>/dev/null; then
        echo "✅ Redis started successfully"
    else
        echo "❌ Failed to start Redis. Run: docker-compose up -d redis"
        exit 1
    fi
fi

echo ""
echo "2️⃣ Building TypeScript..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "3️⃣ Starting Playwright Worker..."
echo "   (Press Ctrl+C to stop)"
echo ""
npm run dev
