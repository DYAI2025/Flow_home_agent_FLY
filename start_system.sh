#!/bin/bash

# Startup script for the complete Voice AI Agent with Avatar Cockpit
# Starts the Node.js frontend and the Python LiveKit agent from this repository.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR"
SERVER_DIR="$ROOT_DIR/server"
PYTHON_AGENT="main.py"

start_frontend() {
    echo "Starting Node.js frontend server..."
    (cd "$FRONTEND_DIR" && npm install >/dev/null 2>&1 || true)
    (cd "$FRONTEND_DIR" && npm start &)
    FRONTEND_PID=$!
    echo "Frontend server started with PID $FRONTEND_PID"
}

start_agent() {
    echo "Starting Python agent..."
    if ! command -v python3 >/dev/null 2>&1; then
        echo "Python 3 is required but was not found." >&2
        exit 1
    fi
    (cd "$ROOT_DIR" && python3 "$PYTHON_AGENT" &)
    AGENT_PID=$!
    echo "Python agent started with PID $AGENT_PID"
}

start_livekit() {
    echo "Starting LiveKit server..."
    (cd "$SERVER_DIR" && ./start_server_docker.sh)
    echo "LiveKit server started"
}

if [[ "${1:-}" == "with-server" ]]; then
    start_livekit
    sleep 10
fi

start_frontend
sleep 3
start_agent

echo
echo "All components started successfully!"
echo "1. LiveKit server (if started): ws://localhost:7880"
echo "2. Avatar cockpit: http://localhost:3000"
echo "3. Python agent: Connected to LiveKit server"

echo "Use stop_system.sh to stop all components."

wait $FRONTEND_PID $AGENT_PID
