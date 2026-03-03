@echo off
setlocal

REM Azure App Service (Windows) startup for FastAPI backend
REM - Runs migrations
REM - Starts Uvicorn on the port provided by Azure (PORT)

python -m alembic upgrade head

if "%PORT%"=="" set PORT=8000

python -m uvicorn main:app --host 0.0.0.0 --port %PORT%
