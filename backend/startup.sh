# Backend startup script
#!/bin/bash
set -e

cd /data3/vasu/projects/game_gen/backend

if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv .venv
fi

source .venv/bin/activate

echo "Installing dependencies..."
uv pip install fastapi==0.109.0 uvicorn[standard]==0.27.0 python-multipart==0.0.6 "sqlalchemy[asyncio]>=2.0.36" aiosqlite==0.19.0 ollama==0.1.4

echo "Starting D&D Simulator Backend on http://localhost:8001"
echo "Database: ./data/dd_simulator.db"
export OLLAMA_MODEL="${OLLAMA_MODEL:-smollm2}"
echo "LLM: ${OLLAMA_MODEL} (via Ollama on port 11434)"

uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload --log-level info
