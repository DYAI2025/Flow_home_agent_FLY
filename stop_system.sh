#!/bin/bash

# Stop script for the Voice AI Agent system
# Stops the Node.js frontend, Python agent, and LiveKit container if running.

set -euo pipefail

echo "Stopping Voice AI Agent system..."

pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "python3 .*main.py" 2>/dev/null || true

if docker ps -a --format '{{.Names}}' | grep -q '^livekit-server-dev$'; then
    echo "Stopping LiveKit server container..."
    docker stop livekit-server-dev 2>/dev/null || true
fi

echo "All components stopped successfully!"
