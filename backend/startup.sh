#!/bin/bash
# Azure App Service startup script for FastAPI backend

# Run database migrations
python -m alembic upgrade head

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
