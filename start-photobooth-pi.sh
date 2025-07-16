#!/bin/bash

echo "🚀 Starte Photobooth System auf Raspberry Pi..."

# Backend starten
echo "📡 Starte Backend..."
cd /home/zumpe/photobooth/backend
pkill -f "node server.js" 2>/dev/null || true
nohup node server.js > photobooth.log 2>&1 &
BACKEND_PID=$!

sleep 2

# Frontend starten  
echo "🎨 Starte Frontend..."
cd /home/zumpe/photobooth
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

sleep 3

# Status prüfen
echo "🔍 Status prüfen..."
if curl -f http://localhost:3001/api/status >/dev/null 2>&1; then
    echo "✅ Backend läuft auf Port 3001"
else
    echo "❌ Backend nicht erreichbar"
fi

if curl -f http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ Frontend läuft auf Port 5173"  
else
    echo "❌ Frontend nicht erreichbar"
fi

echo ""
echo "🌐 URLs:"
echo "Frontend: http://192.168.8.204:5173"
echo "Backend:  http://192.168.8.204:3001"
echo ""
echo "PIDs: Backend=$BACKEND_PID, Frontend=$FRONTEND_PID"
echo "Logs: tail -f /home/zumpe/photobooth/backend/photobooth.log"
