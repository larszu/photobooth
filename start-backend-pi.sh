#!/bin/bash

# Photobooth Backend Startup Script für Raspberry Pi
echo "🚀 Starte Photobooth Backend..."

# Zum Photobooth Verzeichnis wechseln
cd /home/zumpe/photobooth/backend

# Alte Prozesse stoppen (falls vorhanden)
pkill -f "node server.js" 2>/dev/null || true

# Backend starten
echo "📡 Starte Backend auf Port 3001..."
nohup node server.js > photobooth.log 2>&1 &

# Kurz warten
sleep 3

# Status prüfen
if curl -f http://localhost:3001/api/status >/dev/null 2>&1; then
    echo "✅ Backend erfolgreich gestartet!"
    echo "🌐 Frontend: http://192.168.8.204:5173"
    echo "🔧 Backend: http://192.168.8.204:3001"
    echo "📸 Kamera: $(gphoto2 --auto-detect | grep Sony | cut -d' ' -f1 || echo 'Keine erkannt')"
else
    echo "❌ Backend-Start fehlgeschlagen. Prüfe photobooth.log"
    tail -10 photobooth.log
fi
