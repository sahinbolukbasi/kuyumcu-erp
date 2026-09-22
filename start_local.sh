#!/bin/bash

echo "💎 Kuyumculuk IoT ERP Sistemi Başlatılıyor..."

# 1. Backend başlat
echo "1. Python FastAPI Backend başlatılıyor (Port 8000)..."
export MASTER_PASSWORD_HASH="pbkdf2_sha256\$600000\$ec730e443f19395909ed35b54ae5bc0c\$fc198c67066318bb7b40679ec8575eede32e68801f9745f96823a174db463308"
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
