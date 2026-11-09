"""
KindMinds Backend — Startup Script
Run from project root: python backend/run.py
Or from backend/ dir: python run.py
"""
import sys
import os

# Ensure the project root is on sys.path so 'backend.app.*' imports work
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", "8001"))
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        reload_dirs=["backend/app"]
    )

