#!/usr/bin/env bash
# KindMinds — one-command local startup (macOS / Linux)
# Usage: ./start.sh
# Installs dependencies on first run, then starts the backend (port 8001)
# and frontend (port 4321). Press Ctrl+C to stop both.
set -e
cd "$(dirname "$0")"

# --- Backend (FastAPI) ---
if [ ! -x backend/.venv/bin/python ]; then
  PY=$(command -v python3.12 || command -v python3.11 || command -v python3.10 || true)
  if [ -z "$PY" ]; then
    echo "Python 3.10+ is required (e.g. 'brew install python@3.12')." >&2
    exit 1
  fi
  echo "Creating Python virtual environment with $PY ..."
  "$PY" -m venv backend/.venv
  backend/.venv/bin/pip install -q -r backend/requirements.txt
fi

# --- Frontend (Astro) ---
if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend dependencies ..."
  (cd frontend && npx -y pnpm@10 install)
fi

cleanup() { kill 0 2>/dev/null; }
trap cleanup EXIT INT TERM

echo "Starting backend on http://localhost:8001 (API docs: /docs)"
backend/.venv/bin/python backend/run.py &

echo "Starting frontend on http://localhost:4321"
(cd frontend && npx astro dev --host 0.0.0.0 --port 4321) &

wait
