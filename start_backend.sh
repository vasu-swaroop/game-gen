#!/bin/bash
cd /data3/vasu/projects/game_gen/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8006
