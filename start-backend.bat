@echo off
echo Starte Photobooth Backend auf Raspberry Pi...
echo.
echo Verwende Passwort: photobooth2025
echo.

rem Backend starten
ssh zumpe@192.168.8.204 "cd photobooth/backend && pkill -f 'node server.js' 2>/dev/null || true && nohup node server.js > photobooth.log 2>&1 &"

echo.
echo Backend sollte jetzt laufen!
echo Frontend: http://192.168.8.204:5173
echo Backend: http://192.168.8.204:3001
pause
