#!/bin/bash

echo "💎 Kuyumculuk IoT ERP Sistemi Başlatılıyor..."

# 1. Backend başlat
echo "1. Python FastAPI Backend başlatılıyor (Port 8000)..."
PYTHONPATH=. backend/venv/bin/python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 2. Frontend başlat
echo "2. Next.js Frontend başlatılıyor (Port 3000)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Sistem çalışıyor!"
echo "- Web Paneli: http://localhost:3000"
echo "- Backend API & Swagger: http://localhost:8000/docs"
echo "- IoT WebSocket: ws://localhost:8000/ws/live"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT
wait
