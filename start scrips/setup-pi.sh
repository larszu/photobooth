#!/bin/bash

# Photobooth Setup Script für Raspberry Pi
# Automatisiert die Installation und Konfiguration für Auto-Start

echo "🚀 Photobooth Setup für Raspberry Pi"
echo "===================================="

# Prüfe ob wir auf einem Raspberry Pi laufen
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️ Warnung: Dieses Script ist für Raspberry Pi optimiert"
fi

# Prüfe ob Script als normaler Benutzer läuft
if [ "$EUID" -eq 0 ]; then
    echo "❌ Bitte führe dieses Script NICHT als root aus"
    echo "   Verwende: ./setup-pi.sh"
    exit 1
fi

echo ""
echo "📋 Installiere System-Dependencies..."

# System aktualisieren
sudo apt update

# Benötigte Pakete installieren
sudo apt install -y \
    chromium-browser \
    unclutter \
    lightdm \
    gphoto2 \
    libgphoto2-dev \
    libgpiod-dev \
    libvips-dev \
    build-essential \
    python3-dev \
    curl

echo ""
echo "📋 Konfiguriere Auto-Login..."

# Auto-Login konfigurieren
sudo systemctl set-default graphical.target
sudo systemctl enable lightdm

# LightDM für Auto-Login konfigurieren
if ! grep -q "autologin-user=zumpe" /etc/lightdm/lightdm.conf; then
    echo "autologin-user=zumpe" | sudo tee -a /etc/lightdm/lightdm.conf
    echo "autologin-user-timeout=0" | sudo tee -a /etc/lightdm/lightdm.conf
fi

echo ""
echo "📋 Installiere Systemd Services..."

# Backend Service installieren
sudo cp photobooth-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable photobooth-backend

# Frontend Service installieren
sudo cp photobooth-frontend.service /etc/systemd/system/
sudo systemctl enable photobooth-frontend

# Kiosk-Script ausführbar machen
chmod +x start-kiosk.sh

echo ""
echo "📋 Konfiguriere Desktop Auto-Start..."

# Auto-Start Verzeichnis erstellen
mkdir -p ~/.config/autostart

# Desktop-Eintrag kopieren
cp photobooth.desktop ~/.config/autostart/

echo ""
echo "📋 Installiere Node.js Dependencies..."

# Backend Dependencies
cd backend
npm install
cd ..

# Frontend Dependencies und Build
npm install
npm run build

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "🔄 Nächste Schritte:"
echo "1. sudo reboot  # Raspberry Pi neu starten"
echo "2. Nach dem Neustart sollte automatisch starten:"
echo "   - Backend auf Port 3001"
echo "   - Frontend im Kiosk-Modus (Vollbild)"
echo ""
echo "📊 Status prüfen:"
echo "   sudo systemctl status photobooth-backend"
echo "   sudo systemctl status photobooth-frontend"
echo ""
echo "🌐 URL nach Neustart: http://localhost:5173"
echo ""
