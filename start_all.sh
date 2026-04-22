#!/bin/bash

# Configuration
BACKEND_DIR="/data3/vasu/projects/game_gen/backend"
FRONTEND_DIR="/data3/vasu/projects/game_gen/frontend"
BACKEND_PORT=8006
FRONTEND_PORT=3000
export OLLAMA_MODEL="${OLLAMA_MODEL:-smollm2}"

# Function to handle script termination
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting Backend on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT &

echo "Starting Frontend on port $FRONTEND_PORT..."
cd "$FRONTEND_DIR"
npm run dev -- -p $FRONTEND_PORT &

# Wait for all background processes
wait
