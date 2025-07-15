# 🍓 Raspberry Pi Setup Anleitung

## 📋 Systemanforderungen

- **Raspberry Pi 5** (empfohlen) oder Pi 4
- **Raspberry Pi OS Lite** (64-bit, Bookworm)
- **USB-Kamera** oder **DSLR** mit gphoto2 Support
- **LEDs und Buttons** (optional)
- **Mindestens 8GB microSD-Karte**

## 🔧 Hardware-Setup

### GPIO-Verkabelung
```
├── LED (Foto-Indikator)
│   ├── GPIO 18 (Pin 12) → LED Anode (+)
│   └── GND (Pin 6) → LED Kathode (-) über 220Ω Widerstand
│
├── Button (Foto-Trigger)
│   ├── GPIO 2 (Pin 3) → Button Pin 1
│   └── GND (Pin 9) → Button Pin 2
│
└── Kamera
    └── USB-Port → DSLR/USB-Kamera
```

## 🚀 Installation

### 1. System vorbereiten
```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 18+ installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git installieren
sudo apt install -y git
```

### 2. Hardware-Dependencies installieren
```bash
# gphoto2 für Kamera-Unterstützung
sudo apt install -y gphoto2 libgphoto2-dev

# pigpio für GPIO-Steuerung
sudo apt install -y pigpio python3-pigpio

# pigpio daemon aktivieren und starten
sudo systemctl enable pigpiod
sudo systemctl start pigpiod

# Zusätzliche Tools
sudo apt install -y build-essential python3-dev
```

### 3. Projekt klonen und einrichten
```bash
# Repository klonen
git clone https://github.com/larszu/photobooth.git
cd photobooth/backend

# Raspberry Pi Package-Konfiguration kopieren
cp package-raspberry.json package.json

# Dependencies installieren
npm install

# Berechtigung für GPIO
sudo usermod -a -G gpio $USER
sudo usermod -a -G dialout $USER

# Neustart für Gruppenmitgliedschaft
sudo reboot
```

### 4. Kamera konfigurieren

#### Für DSLR-Kameras:
```bash
# Kamera-Kompatibilität prüfen
gphoto2 --auto-detect

# Kamera-Einstellungen testen
gphoto2 --capture-image-and-download
```

#### Für USB-Webcams:
```bash
# V4L2 Tools installieren
sudo apt install -y v4l-utils

# Verfügbare Kameras anzeigen
v4l2-ctl --list-devices
```

### 5. Server konfigurieren

#### Automatischen Start einrichten:
```bash
# Systemd Service erstellen
sudo nano /etc/systemd/system/photobooth.service
```

Service-Datei Inhalt:
```ini
[Unit]
Description=Photobooth Backend
After=network.target pigpiod.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/photobooth/backend
ExecStart=/usr/bin/node server-raspberry.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Service aktivieren:
```bash
sudo systemctl daemon-reload
sudo systemctl enable photobooth
sudo systemctl start photobooth
```

## 🔧 Konfiguration

### 1. Hardware-Pins anpassen
In `gpio.js` die Pin-Konfiguration ändern:
```javascript
const LED_PIN = 18;    // GPIO 18 für LED
const BUTTON_PIN = 2;  // GPIO 2 für Button
```

### 2. Kamera-Einstellungen
In `server-raspberry.js` die Kamera-Kommandos anpassen:
```javascript
// Für andere gphoto2-Einstellungen
const command = `gphoto2 --capture-image-and-download --filename="${filepath}" --set-config imageformat=1`;
```

### 3. Netzwerk-Konfiguration
```bash
# WiFi-Hotspot einrichten (optional)
sudo apt install -y hostapd dnsmasq

# Statische IP konfigurieren
sudo nano /etc/dhcpcd.conf
```

## 🧪 Testen

### 1. Hardware-Test
```bash
# GPIO-Test
node -e "
import('./gpio.js').then(gpio => {
  gpio.setupGpio().then(() => {
    gpio.blinkLed();
    setTimeout(() => process.exit(0), 2000);
  });
});
"

# Kamera-Test
gphoto2 --capture-image-and-download --filename=test.jpg
```

### 2. Server-Test
```bash
# Server starten
npm start

# API testen
curl http://localhost:3001/api/status
curl -X POST http://localhost:3001/api/photo/take
```

## 🚨 Troubleshooting

### GPIO-Probleme
```bash
# pigpio-Status prüfen
sudo systemctl status pigpiod

# GPIO-Berechtigungen prüfen
groups $USER

# pigpio manuell starten
sudo pigpiod
```

### Kamera-Probleme
```bash
# USB-Geräte auflisten
lsusb

# Kamera-Log prüfen
gphoto2 --debug --auto-detect

# Kamera zurücksetzen
gphoto2 --reset
```

### Performance-Optimierung
```bash
# GPU-Memory Split
sudo raspi-config
# Advanced Options → Memory Split → 128

# Swap vergrößern
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## 📊 Monitoring

### System-Status
```bash
# Service-Status
sudo systemctl status photobooth

# Logs anzeigen
sudo journalctl -u photobooth -f

# System-Ressourcen
htop
```

### Web-Interface
- **Frontend**: `http://[raspberry-pi-ip]:5173`
- **Admin Panel**: `http://[raspberry-pi-ip]:5173/admin`
- **API Status**: `http://[raspberry-pi-ip]:3001/api/status`

## 🔧 Erweiterte Konfiguration

### Mehrere Kameras
```javascript
// In server-raspberry.js
const cameras = [
  { name: 'main', port: 'usb:', config: {...} },
  { name: 'backup', port: 'usb:', config: {...} }
];
```

### Custom GPIO-Layout
```javascript
// In gpio.js
const GPIO_CONFIG = {
  LED_READY: 18,
  LED_CAPTURE: 19,
  BUTTON_CAPTURE: 2,
  BUTTON_ADMIN: 3,
  BUZZER: 20
};
```

### Backup und Updates
```bash
# Automatisches Backup
rsync -av /home/pi/photobooth/ /media/usb/backup/

# Update vom Git
cd /home/pi/photobooth
git pull origin main
npm install
sudo systemctl restart photobooth
```

## 📝 Unterschiede zur Windows-Version

| Feature | Windows | Raspberry Pi |
|---------|---------|-------------|
| Kamera | Mock (SVG) | gphoto2 (echte Fotos) |
| GPIO | Mock (Console) | Hardware (LEDs/Buttons) |
| Performance | Hoch | Mittel |
| Hardware | Nicht benötigt | GPIO, Kamera erforderlich |
| Deployment | Entwicklung | Produktion |

## 🆘 Support

Bei Problemen:
1. **Logs prüfen**: `sudo journalctl -u photobooth -f`
2. **Hardware testen**: GPIO und Kamera einzeln
3. **Community**: GitHub Issues
4. **Dokumentation**: `/docs` Verzeichnis
