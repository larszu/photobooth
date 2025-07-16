#!/bin/bash
# Auto-Login Script für Raspberry Pi Backend

# Passwort automatisch eingeben und Backend starten
expect << 'EOF'
spawn ssh zumpe@192.168.8.204 "cd photobooth/backend && pkill -f 'node server.js' 2>/dev/null || true && nohup node server.js > photobooth.log 2>&1 & && echo 'Backend gestartet'"
expect "password:"
send "photobooth2025\r"
expect eof
EOF

echo "Backend sollte jetzt laufen auf http://192.168.8.204:3001"
