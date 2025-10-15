#!/bin/sh
set -e

echo "🚀 Starting CursorRuleCraft services..."

# Change to backend directory
cd /app/backend

# Find and run the main.js file (handles any path structure)
MAIN_FILE=$(find . -name "main.js" -type f | head -n 1)

if [ -z "$MAIN_FILE" ]; then
    echo "❌ Error: Could not find main.js in backend directory"
    find /app/backend -name "*.js" | head -20
    exit 1
fi

echo "📍 Found entry point: $MAIN_FILE"
echo "🔧 Starting backend server..."

# Start backend in background
node "$MAIN_FILE" &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start"
    exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"

# Start nginx in foreground
echo "🌐 Starting Nginx..."
exec nginx -g 'daemon off;'

