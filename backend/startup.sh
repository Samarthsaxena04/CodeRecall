#!/bin/bash
# Azure App Service startup script for FastAPI backend
# NOTE: Do NOT cd to /home/site/wwwroot — Oryx extracts the app to a temp dir
# and sets CWD there before invoking this script. alembic.ini and main.py live there.

echo "=== Starting CodeRecall API ==="
echo "Python: $(python --version)"
echo "Working dir: $(pwd)"

# Run database migrations (don't exit on failure — app can still run if already up-to-date)
echo "=== Running Alembic migrations ==="
python -m alembic upgrade head || echo "WARNING: alembic upgrade head failed (tables may already exist)"

echo "=== Starting gunicorn ==="
# Start the application with gunicorn + uvicorn workers
# Azure App Service F1 (Free tier): 1 CPU core, 1 GB RAM — use 1 worker
# Azure provides PORT env var (default 8000)
gunicorn main:app \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:${PORT:-8000} \
    --timeout 120 \
    --access-logfile '-' \
    --error-logfile '-' \
    --log-level info
