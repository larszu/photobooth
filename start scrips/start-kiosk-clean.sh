#!/bin/bash

# Photobooth Kiosk-Modus Start-Script
# Startet das Frontend automatisch im Vollbild-Modus

echo "🚀 Starting Photobooth Kiosk Mode..."

# Warte bis X11 verfügbar ist
echo "⏳ Waiting for X11 to be ready..."
while ! xset q &>/dev/null; do
    echo "   Still waiting for X11..."
    sleep 2
done

echo "✅ X11 is ready"

# Warte bis Backend verfügbar ist
echo "⏳ Waiting for backend to be ready..."
while ! curl -s http://localhost:3001/api/status >/dev/null 2>&1; do
    echo "   Still waiting for backend..."
    sleep 2
done

echo "✅ Backend is ready"

# Bildschirmschoner und Energiesparmodus deaktivieren
echo "🔧 Configuring display settings..."
xset s off          # Bildschirmschoner aus
xset -dpms          # Display Power Management aus
xset s noblank      # Bildschirm nicht ausblenden

# Cursor verstecken (nach 0.1 Sekunden Inaktivität)
echo "🖱️ Hiding cursor..."
unclutter -idle 0.1 -root &

# Warten bis unclutter gestartet ist
sleep 1

# Chromium im Kiosk-Modus starten
echo "🌐 Starting Chromium in Kiosk Mode..."
echo "   URL: http://localhost:5173"

chromium-browser \
    --no-sandbox \
    --disable-infobars \
    --disable-restore-session-state \
    --disable-session-crashed-bubble \
    --disable-features=TranslateUI \
    --disable-web-security \
    --disable-features=VizDisplayCompositor \
    --kiosk \
    --app=http://localhost:5173 \
    --start-fullscreen \
    --window-size=1920,1080 \
    --window-position=0,0 \
    --check-for-update-interval=31536000 \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-background-networking &

CHROMIUM_PID=$!

echo "✅ Photobooth Kiosk Mode started (PID: $CHROMIUM_PID)"
echo "🖥️ Frontend should now be visible in fullscreen"

# Warte auf Chromium-Prozess
wait $CHROMIUM_PID

echo "🔄 Chromium exited, restarting in 5 seconds..."
sleep 5

# Rekursiver Neustart falls Chromium abstürzt
exec $0
