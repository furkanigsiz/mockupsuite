#!/bin/sh
set -e

echo "🚀 Starting MockupSuite development server..."

# Create a timestamp file to track container restarts
TIMESTAMP_FILE="/app/public/.container-start-time"
mkdir -p /app/public
echo "$(date +%s%N)" > "$TIMESTAMP_FILE"

echo "✅ Container start time: $(cat $TIMESTAMP_FILE)"
echo "✅ Starting Vite dev server with HMR..."

# Start the development server
exec npm run dev -- --host 0.0.0.0 --force
