#!/bin/bash

# Complete Voice AI Agent Startup Script
# Starts LiveKit (optional), the Node.js frontend, and the Python agent.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR"
SERVER_DIR="$ROOT_DIR/server"
PYTHON_AGENT="$ROOT_DIR/main.py"
LOG_DIR="$ROOT_DIR"
FRONTEND_LOG="$LOG_DIR/frontend.log"
AGENT_LOG="$LOG_DIR/agent.log"

log_section() {
    echo "================================="
    echo "$1"
    echo "================================="
}

start_livekit() {
    log_section "Starting LiveKit Server"
    (cd "$SERVER_DIR" && ./start_server_docker.sh)
    if curl -fsS http://localhost:7880/ >/dev/null; then
        echo "✓ LiveKit server is running at ws://localhost:7880"
    else
        echo "! Warning: LiveKit server did not respond on http://localhost:7880" >&2
    fi
}

start_frontend() {
    log_section "Starting Node.js Frontend"
    if ! command -v npm >/dev/null 2>&1; then
        echo "npm is required but was not found in PATH." >&2
        exit 1
    fi
    (cd "$FRONTEND_DIR" && npm install >/dev/null 2>&1 || true)
    (cd "$FRONTEND_DIR" && nohup npm start >"$FRONTEND_LOG" 2>&1 &)
    FRONTEND_PID=$!
    echo "Frontend started with PID $FRONTEND_PID"
    echo "Logs: $FRONTEND_LOG"
    echo "URL: http://localhost:3000"
}

start_agent() {
    log_section "Starting Python Agent"
    if ! command -v python3 >/dev/null 2>&1; then
        echo "Python 3 is required but was not found." >&2
        exit 1
    fi
    (cd "$ROOT_DIR" && nohup python3 "$PYTHON_AGENT" >"$AGENT_LOG" 2>&1 &)
    AGENT_PID=$!
    echo "Agent started with PID $AGENT_PID"
    echo "Logs: $AGENT_LOG"
}

if [[ "${1:-}" == "with-server" ]]; then
    start_livekit
fi

start_frontend
sleep 3
start_agent

log_section "System startup complete!"
echo "1. LiveKit server: ws://localhost:7880 (if started)"
echo "2. Avatar cockpit: http://localhost:3000"
echo "3. Agent logs: $AGENT_LOG"
echo "4. Frontend logs: $FRONTEND_LOG"
echo
echo "To stop everything, run ./stop_system.sh"
