# 📸 Raspberry Pi Photobooth

Eine vollständige Fotobox-Lösung für Events und Hochzeiten mit React Frontend, Node.js Backend und Hardware-Integration.

## 🎯 Features

- **Touch-optimierte Benutzeroberfläche** für einfache Bedienung
- **Hardware-Button** für Foto-Auslösung (GPIO Pin 17 & 3V)
- **Professionelle Kamera-Integration** mit gphoto2
- **Galerie-System** mit Tagesordnern
- **QR-Code Sharing** für sofortiges Teilen
- **Admin-Panel** für Verwaltung und Konfiguration
- **Papierkorb-System** für versehentlich gelöschte Fotos
- **Branding-Unterstützung** (Logo und Text upload)
- **WLAN-Hotspot** für Gäste-Zugriff
- **Offline-Betrieb** kein Internet erforderlich

## 🔧 Hardware Setup

### Benötigte Komponenten

1. **Raspberry Pi 5 Model B** (empfohlen: 4GB RAM)
2. **MicroSD-Karte** (mindestens 32GB, Class 10)
3. **Offizielles Raspberry Pi Netzteil** (27W USB-C)
4. **Kamera** (getestet mit Sony Alpha-A7r)
5. **Micro USB zu USB-A Kabel** für Kamera-Verbindung
6. **Hardware-Button** (optional, für physische Auslösung)
7. **Jumper-Kabel** für GPIO-Verbindung
8. **Touchscreen**

### GPIO Hardware-Button Setup

```text
Raspberry Pi 5 GPIO Pinout:
┌─────────────────────────────┐
│  3.3V  [1] [2]  5V          │
│  GPIO2 [3] [4]  5V          │
│  GPIO3 [5] [6]  GND         │
│  GPIO4 [7] [8]  GPIO14      │
│  GND   [9] [10] GPIO15      │
│         ...                 │
│  GPIO16[33][34] GND         │
│  GPIO17[35][36] GPIO18      │ ← Pin 35 (GPIO 17)
│         ...                 │
└─────────────────────────────┘

Hardware-Button Verkabelung:
- Button Pin 1 → GPIO 17 (Pin 35)
- Button Pin 2 → +3.3V (Pin 1)

Funktionsweise:
- Ruhezustand: GPIO 17 = LOW (ohne Pull-Up)
- Button gedrückt: GPIO 17 = HIGH (+3.3V)
- Trigger: LOW→HIGH Transition
```

### Kamera-Setup

1. **Kamera anschließen**: USB-Kabel von Kamera zu Raspberry Pi
2. **Kamera-Modus**: Auf "PC" oder "Mass Storage" stellen
3. **Stromversorgung**: Kamera per Netzteil (bei längeren Sessions)

## 💻 Software-Architektur

### System-Überblick

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │ Node.js Backend │    │ Hardware Layer  │
│                 │    │                 │    │                 │
│ • Touch-UI      │◄──►│ • REST API     │◄──►│ • gphoto2       │
│ • Galerie       │    │ • WebSocket     │    │ • GPIO (lgpio)  │
│ • QR-Codes      │    │ • Datei-System  │    │ • Systemd       │
│ • Admin-Panel   │    │ • Auth-System   │    │ • WLAN-Hotspot  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Verzeichnis-Struktur

```text
photobooth/
├── README.md                    # Diese Datei
├── package.json                 # Frontend Dependencies
├── vite.config.ts              # Frontend Build-Konfiguration
├── 
├── src/                        # React Frontend
│   ├── components/             # UI-Komponenten
│   ├── pages/                  # Hauptseiten
│   ├── context/               # State Management
│   └── hooks/                 # Custom React Hooks
│
├── backend/                   # Node.js Backend
│   ├── server-raspberry.js    # Hauptserver für Raspberry Pi
│   ├── gpio-pi5-simple.js    # GPIO Hardware-Integration
│   ├── auth.js               # Authentifizierung
│   ├── brandingRoutes.js     # Branding-API
│   └── users.json           # Benutzer-Datenbank
│
├── photos/                   # Foto-Speicher
│   ├── YYYYMMDD_Photobooth/ # Tagesordner
│   └── papierkorb/          # Gelöschte Fotos
│
├── branding/                # Logos und Texte
└── public/                  # Statische Dateien
```

## 🚀 Installation

### Automatische Installation (Empfohlen)

```bash
# Repository klonen
cd /home/pi
git clone https://github.com/larszu/photobooth.git
cd photobooth

# Automatisches Setup ausführen
chmod +x setup-pi.sh
./setup-pi.sh

# Raspberry Pi neu starten
sudo reboot
```

**Nach dem Neustart:** Das System startet automatisch im Kiosk-Modus! 🎉

### Manuelle Installation (für Entwickler)

### 1. Raspberry Pi OS Setup

```bash
# 1. Raspberry Pi OS (64-bit) installieren
# 2. SSH aktivieren und WLAN konfigurieren
# 3. System aktualisieren
sudo apt update && sudo apt upgrade -y

# 4. Git installieren
sudo apt install git -y

# 5. Node.js installieren (Version 18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# 6. Systemd Services aktivieren
sudo systemctl enable ssh
```

### 2. Abhängigkeiten installieren

```bash
# gphoto2 für Kamera-Steuerung
sudo apt install gphoto2 libgphoto2-dev -y

# GPIO Library für Pi 5
sudo apt install libgpiod-dev -y
sudo pip3 install lgpio

# Sharp für Bildbearbeitung (Dependencies)
sudo apt install libvips-dev -y

# Build-Tools
sudo apt install build-essential python3-dev -y

# Desktop-Umgebung und Browser für Kiosk-Modus
sudo apt install chromium-browser unclutter -y

# Auto-Login konfigurieren
sudo systemctl set-default graphical.target
sudo systemctl enable lightdm
```

### 3. Projekt klonen und einrichten

```bash
# Repository klonen
cd /home/pi
git clone https://github.com/larszu/photobooth.git
cd photobooth

# Backend Dependencies installieren
cd backend
npm install
cd ..

# Frontend Dependencies installieren
npm install

# Frontend für Produktion bauen
npm run build
```

### 4. Auto-Start Services einrichten

#### Backend Service

```bash
# Service-Datei erstellen
sudo nano /etc/systemd/system/photobooth-backend.service
```

Inhalt der Backend Service-Datei:

```ini
[Unit]
Description=Photobooth Backend Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/photobooth/backend
ExecStart=/usr/bin/node server-raspberry.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# GPIO Berechtigungen
SupplementaryGroups=gpio
DeviceAllow=/dev/gpiochip0 rw

[Install]
WantedBy=multi-user.target
```

#### Frontend Service (Kiosk-Modus)

```bash
# Frontend Service-Datei erstellen
sudo nano /etc/systemd/system/photobooth-frontend.service
```

Inhalt der Frontend Service-Datei:

```ini
[Unit]
Description=Photobooth Frontend Kiosk
After=graphical-session.target
Wants=graphical-session.target
After=photobooth-backend.service

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
WorkingDirectory=/home/pi/photobooth
ExecStartPre=/bin/sleep 10
ExecStart=/home/pi/photobooth/start-kiosk.sh
Restart=always
RestartSec=5

[Install]
WantedBy=graphical-session.target
```

#### Auto-Start Script erstellen

```bash
# Kiosk-Start-Script erstellen
nano /home/pi/photobooth/start-kiosk.sh
```

Inhalt des Start-Scripts:

```bash
#!/bin/bash

# Warte bis X11 verfügbar ist
while ! xset q &>/dev/null; do
    echo "Waiting for X11..."
    sleep 2
done

# Bildschirmschoner deaktivieren
xset s off
xset -dpms
xset s noblank

# Cursor verstecken
unclutter -idle 0.1 -root &

# Frontend im Kiosk-Modus starten
chromium-browser \
    --no-sandbox \
    --disable-infobars \
    --disable-restore-session-state \
    --disable-session-crashed-bubble \
    --disable-features=TranslateUI \
    --kiosk \
    --app=http://localhost:5173 \
    --start-fullscreen \
    --check-for-update-interval=31536000
```

Script ausführbar machen:

```bash
chmod +x /home/pi/photobooth/start-kiosk.sh
```

Services aktivieren:

```bash
# Services laden und aktivieren
sudo systemctl daemon-reload
sudo systemctl enable photobooth-backend
sudo systemctl enable photobooth-frontend

# Services starten
sudo systemctl start photobooth-backend
sudo systemctl start photobooth-frontend

# Status prüfen
sudo systemctl status photobooth-backend
sudo systemctl status photobooth-frontend
```

### 5. WLAN-Hotspot konfigurieren

```bash
# hostapd und dnsmasq installieren
sudo apt install hostapd dnsmasq -y

# hostapd konfigurieren
sudo nano /etc/hostapd/hostapd.conf
```

Hostapd-Konfiguration:

```ini
# WLAN-Interface
interface=wlan0

# 5GHz und 2.4GHz Support
hw_mode=g
channel=7
ieee80211n=1
ieee80211ac=1

# SSID und Passwort
ssid=Photobooth 5
wpa_passphrase=Photobooth
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=CCMP

# Weitere Optionen
auth_algs=1
ignore_broadcast_ssid=0
```

DNSMASQ konfigurieren:

```bash
sudo nano /etc/dnsmasq.conf
```

```ini
# Erweitere bestehende Konfiguration:
interface=wlan0
dhcp-range=192.168.8.10,192.168.8.100,255.255.255.0,24h
```

Statische IP für wlan0:

```bash
sudo nano /etc/dhcpcd.conf
```

```ini
# Am Ende hinzufügen:
interface wlan0
static ip_address=192.168.8.1/24
nohook wpa_supplicant
```

Services aktivieren:

```bash
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq
sudo reboot
```

### 6. Auto-Login konfigurieren

```bash
# Auto-Login für Desktop aktivieren
sudo raspi-config
# Navigation: 1 System Options → S5 Boot / Auto Login → B4 Desktop Autologin

# Oder manuell konfigurieren:
sudo nano /etc/lightdm/lightdm.conf
```

LightDM Konfiguration:

```ini
[Seat:*]
autologin-user=pi
autologin-user-timeout=0
```

### 7. Desktop Auto-Start konfigurieren

```bash
# Desktop Auto-Start Verzeichnis erstellen
mkdir -p /home/pi/.config/autostart

# Desktop-Eintrag für Photobooth erstellen
nano /home/pi/.config/autostart/photobooth.desktop
```

Desktop-Eintrag Inhalt:

```ini
[Desktop Entry]
Type=Application
Name=Photobooth Kiosk
Exec=/home/pi/photobooth/start-kiosk.sh
Hidden=false
X-GNOME-Autostart-enabled=true
```

## 🎮 Bedienung

### Auto-Start Verhalten

Nach einem Neustart des Raspberry Pi:

1. **Automatischer Login** als Benutzer `pi`
2. **Backend startet automatisch** auf Port 3001
3. **Frontend öffnet im Kiosk-Modus** (Vollbild, kein Browser-UI)
4. **Cursor wird automatisch versteckt** bei Inaktivität
5. **Bildschirmschoner deaktiviert** für 24/7 Betrieb

### URLs und Remote-Zugriff

- **Kiosk-Modus** (lokaler Bildschirm): Automatisch nach Boot
- **Remote-Zugriff**: `http://192.168.8.1:5173`
- **Admin-Panel**: `http://192.168.8.1:5173/admin`
- **Papierkorb**: `http://192.168.8.1:5173/trash`
- **Backend-API**: `http://192.168.8.1:3001`

### Service-Kontrolle

```bash
# Services stoppen/starten
sudo systemctl stop photobooth-backend
sudo systemctl stop photobooth-frontend
sudo systemctl start photobooth-backend
sudo systemctl start photobooth-frontend

# Kiosk-Modus manuell beenden
pkill chromium-browser

# Kiosk-Modus manuell starten
/home/pi/photobooth/start-kiosk.sh &
```

### Standard Admin-Zugangsdaten

- **Benutzername**: `admin`
- **Passwort**: `photobooth2025`

### Hardware-Button

- **Funktion**: Foto auslösen (identisch zum Touch-Button)
- **Verhalten**: Navigation zur Foto-Aufnahme → Foto → Foto-Ansicht
- **GPIO**: Pin 17 (LOW→HIGH Trigger)

### WLAN-Verbindung für Gäste

- **5GHz SSID**: `Photobooth 5`
- **2.4GHz SSID**: `Photobooth 2.4`
- **Passwort**: `Photobooth`
- **Frontend-URL**: `http://192.168.8.1:5173`

## 🔧 API Endpoints

### Foto-Management

```http
POST /api/photo/take              # Foto aufnehmen
GET  /api/photos                  # Alle Fotos auflisten
GET  /api/folders                 # Foto-Ordner auflisten
GET  /api/folders/:folder/photos  # Fotos eines Ordners
```

### Papierkorb

```http
GET    /api/trash                     # Papierkorb anzeigen
POST   /api/photos/:filename/trash    # Foto in Papierkorb
POST   /api/trash/:filename/restore   # Foto wiederherstellen
DELETE /api/trash/:filename           # Foto endgültig löschen
DELETE /api/trash                     # Papierkorb leeren
```

### QR-Code Sharing

```http
GET /api/smart-share?photo=:filename      # Einfacher Share
GET /api/smart-share-v2?photo=:filename   # WLAN + Foto QR
GET /api/bulk-smart-share?photos=:list    # Mehrere Fotos
```

### Hardware

```http
POST /api/gpio/test               # GPIO-Test
GET  /api/wifi-status            # WLAN-Status
GET  /api/status                 # System-Status
```

## 🛠️ Entwicklung

### Lokale Entwicklung

```bash
# Backend starten (Development)
cd backend
npm run dev

# Frontend starten (Development)
npm run dev
```

### Debugging

```bash
# Service-Logs anzeigen
sudo journalctl -u photobooth -f

# GPIO-Status prüfen
sudo cat /sys/kernel/debug/gpio

# Kamera-Status prüfen
gphoto2 --auto-detect
gphoto2 --summary
```

## 📁 Konfiguration

### Verzeichnisse

- **Fotos**: `/home/pi/photobooth/photos/`
- **Logs**: `sudo journalctl -u photobooth`
- **Config**: `/home/pi/photobooth/backend/`

### Wichtige Dateien

- **Backend**: `backend/server-raspberry.js`
- **GPIO**: `backend/gpio-pi5-simple.js`
- **Service**: `/etc/systemd/system/photobooth.service`
- **WLAN**: `/etc/hostapd/hostapd.conf`

## 🔒 Sicherheit

- Admin-Panel mit Passwort-Schutz
- Session-basierte Authentifizierung
- Isoliertes WLAN-Netzwerk
- Keine Internet-Verbindung erforderlich

## 🐛 Troubleshooting

### Häufige Probleme

#### 1. Kamera nicht erkannt

```bash
# USB-Verbindung prüfen
lsusb | grep -i camera

# gphoto2 Test
gphoto2 --auto-detect
```

#### 2. GPIO-Button funktioniert nicht

```bash
# GPIO-Test
sudo cat /sys/class/gpio/gpio17/value

# Service-Logs
sudo journalctl -u photobooth -n 50
```

#### 3. WLAN-Hotspot nicht sichtbar

```bash
# Services prüfen
sudo systemctl status hostapd
sudo systemctl status dnsmasq

# Interface prüfen
ip addr show wlan0
```

#### 4. Frontend nicht erreichbar

```bash
# Port prüfen
sudo netstat -tlnp | grep :5173

# Service-Status
sudo systemctl status photobooth
```

## Support

Bei Problemen oder Fragen:

1. **GitHub Issues**: [photobooth/issues](https://github.com/larszu/photobooth/issues)
2. **Logs prüfen**: `sudo journalctl -u photobooth -f`
3. **System-Status**: `http://192.168.8.1:3001/api/status`

## 📜 Lizenz

MIT License - Siehe [LICENSE](LICENSE) für Details.

## 🎉 Credits

- **Hardware**: Raspberry Pi Foundation
- **Kamera**: gphoto2 Project
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **GPIO**: lgpio Library

---

**Version**: 1.0.0  
**Letztes Update**: Juli 2025  
**Getestet auf**: Raspberry Pi 5 Model B, Raspberry Pi OS (64-bit)
