# Photobooth Architektur Dokumentation

## Überblick
Dies ist eine Fullstack-Fotobox-Anwendung für Raspberry Pi 5, die offline funktioniert und für Touch-Bedienung optimiert ist.

## System-Architektur

### Hardware
- **Raspberry Pi 5** - Hauptsystem
- **Kamera** - Über gphoto2 angesteuert
- **GPIO** - Hardware-Integration für Buttons/LEDs
- **Touchscreen** - Primäre Benutzeroberfläche
- **WLAN Router** - Für QR-Code-basiertes Foto-Sharing

### Software-Stack

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│    Port 5173 - Vite Development        │
├─────────────────────────────────────────┤
│           Backend (Node.js)             │
│    Port 3001 - Express Server          │
├─────────────────────────────────────────┤
│         Hardware Layer                  │
│   gphoto2, GPIO, Dateisystem           │
├─────────────────────────────────────────┤
│         Operating System                │
│    Raspberry Pi OS (Debian-based)      │
└─────────────────────────────────────────┘
```

## Frontend (React/TypeScript)

### Hauptkomponenten

#### Pages
- **`CameraPage.tsx`** - Foto aufnehmen, Live-Preview, Kamera-Steuerung
- **`GalleryPage.tsx`** - Alle Fotos-Übersicht mit Sortierung
- **`FolderGalleryPage.tsx`** - Tagesordner-Ansicht mit Sortierung
- **`FoldersOverviewPage.tsx`** - Übersicht aller Tagesordner
- **`PhotoViewPage.tsx`** - Einzelfoto-Ansicht mit Sharing
- **`TrashPage.tsx`** - Papierkorb-Verwaltung
- **`AdminPage.tsx`** - Administrator-Panel

#### Komponenten
- **`PhotoSelectionBar.tsx`** - Multi-Select-Toolbar
- **`BulkSmartShareDialog.tsx`** - Mehrfach-Sharing Dialog
- **`SmartShareDialog.tsx`** - Einzelfoto-Sharing
- **`OnScreenKeyboard.tsx`** - Touch-optimierte Tastatur
- **`ProtectedRoute.tsx`** - Auth-Schutz für Admin-Bereich

#### Context & State Management
- **`AppContext.tsx`** - Globaler App-State
- **`AuthContext.tsx`** - Authentifizierung
- **`ThemeContext.tsx`** - Theme-Verwaltung

#### Hooks
- **`useGPIOWebSocket.ts`** - Hardware-GPIO Integration
- **`useVirtualKeyboard.ts`** - Virtuelle Tastatur-Logik

### UI Framework
- **Material-UI (MUI)** - Component Library
- **Touch-optimierte Bedienung** - Große Buttons, Drag & Drop
- **Responsive Design** - Mobile-first Ansatz
- **Kiosk-Modus** - Vollbild ohne Browser-UI

## Backend (Node.js/Express)

### Server-Architektur
```
/home/zumpe/photobooth/backend/
├── server-raspberry.js       # Haupt-Server (aktuell aktiv)
├── server-raspberry-current.js # Alternative Server-Version
├── package.json             # Backend Dependencies
├── node_modules/           # NPM-Pakete
└── bulk-gallery.html      # Mobile Gallery für QR-Sharing
```

### API Endpoints

#### Foto-Management
```javascript
GET    /api/photos           # Alle Fotos auflisten
GET    /api/photos/:filename # Einzelfoto-Metadaten
POST   /api/photos/capture   # Neues Foto aufnehmen
POST   /api/photos/:filename/trash # Foto in Papierkorb
DELETE /api/photos/:filename # Foto endgültig löschen
```

#### Ordner-Management
```javascript
GET    /api/folders          # Alle Tagesordner
GET    /api/folders/:folder/photos # Fotos eines Ordners
```

#### System & Status
```javascript
GET    /api/status           # Server-Status & Statistiken
GET    /api/wifi-qr         # WLAN QR-Code generieren
```

#### Admin & Branding
```javascript
GET    /api/admin/*          # Admin-Funktionen
GET    /api/branding/*       # Branding-Einstellungen
```

### Statische Dateien
```javascript
app.use('/photos', express.static('/home/zumpe/photobooth/photos'))
app.use('/bulk-gallery', serveFile('backend/bulk-gallery.html'))
```

### Hardware-Integration

#### Kamera (gphoto2)
```javascript
const { exec } = require('child_process');
// Foto aufnehmen
exec('gphoto2 --capture-image-and-download --filename photo.jpg');
```

#### GPIO (Raspberry Pi)
```javascript
// Hardware-Buttons und LEDs
const gpio = require('rpi-gpio');
// Touch-Events an Frontend weiterleiten
```

## Dateisystem-Struktur

### Foto-Speicherung
```
/home/zumpe/photobooth/photos/
├── 20250724_Photobooth/     # Tagesordner (YYYYMMDD_Photobooth)
│   ├── photo-2025-07-24T19-45-12-345Z.jpg
│   └── photo-2025-07-24T20-15-33-678Z.jpg
└── papierkorb/              # Gelöschte Fotos
    └── photo-2025-07-24T18-30-45-123Z.jpg
```

### Konfiguration
```
/home/zumpe/photobooth/
├── branding/
│   ├── branding.txt         # Branding-Text
│   └── default-logo.svg     # Logo-Dateien
├── users.json              # Admin-Benutzer
└── .env                    # Umgebungsvariablen
```

## Auto-Start System

### systemd Services
```bash
# Backend Service
/etc/systemd/system/photobooth-backend.service
User=root
WorkingDirectory=/home/zumpe/photobooth/backend
ExecStart=/usr/bin/node server-raspberry.js

# Frontend Service  
/etc/systemd/system/photobooth-frontend.service
User=zumpe
WorkingDirectory=/home/zumpe/photobooth
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0
```

### Desktop Autostart
```bash
# ~/.config/autostart/photobooth.desktop
[Desktop Entry]
Type=Application
Name=Photobooth Kiosk
Exec=/home/zumpe/photobooth/start-kiosk.sh
```

### Kiosk-Start Script
```bash
#!/bin/bash
# /home/zumpe/photobooth/start-kiosk.sh

# Warte auf System-Services
while ! curl -s http://localhost:3001/api/status; do sleep 2; done
while ! curl -s http://localhost:5173; do sleep 2; done

# Bildschirmschoner deaktivieren
xset s off
xset -dpms
xset s noblank

# Cursor verstecken
unclutter -idle 0.1 -root &

# Chromium im Kiosk-Modus
chromium-browser \
    --kiosk \
    --app=http://localhost:5173 \
    --start-fullscreen \
    --no-sandbox \
    --disable-infobars
```

## Sharing-System

### Web Share API
```javascript
// Native Device Sharing
if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/jpeg' });
    await navigator.share({
        files: [file],
        title: 'Photobooth Foto'
    });
}
```

### QR-Code System
```javascript
// QR-Code für mobile Galerie
const qrUrl = `http://${routerIP}:3001/bulk-gallery?photos=${photoIds.join(',')}`;
// Zeigt mobile-optimierte Galerie für Smartphone-Zugriff
```

### Bulk Gallery
- **`bulk-gallery.html`** - Standalone mobile Galerie
- **Touch-optimiert** - Für Smartphone-Bedienung
- **Download & Share** - Lokaler Download + native Sharing
- **Offline-fähig** - Funktioniert ohne Internet

## Sortierung & Filtering

### Intelligente Datums-Sortierung
```javascript
// Extrahiert Datum/Zeit aus Dateinamen
const getDateTimeFromFilename = (filename) => {
    // ISO Format: photo-2025-07-24T19-45-12-345Z.jpg
    const isoMatch = filename.match(/photo-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    if (isoMatch) {
        return isoMatch[1].replace(/[-:TZ]/g, ''); // YYYYMMDDHHMMSSMMM
    }
    // Fallback zu anderen Formaten...
};
```

### Sortier-Optionen
- **Neueste zuerst** (Standard) - Chronologisch absteigend
- **Älteste zuerst** - Chronologisch aufsteigend
- **Performance-optimiert** - React.useMemo für große Galerien

## Performance & Optimierung

### Frontend
- **React.useMemo** - Memoization für Sortierung
- **Lazy Loading** - Bilder werden bei Bedarf geladen
- **Virtual Scrolling** - Für große Foto-Collections
- **Image Optimization** - Automatische Thumbnail-Generierung

### Backend
- **Static File Serving** - Express.static für Bilder
- **Caching Headers** - Browser-Caching für Fotos
- **Error Handling** - Graceful Degradation bei Hardware-Fehlern

### Storage
- **Ordner-basierte Organisation** - Tagesordner für bessere Performance
- **Papierkorb-System** - Soft-Delete statt sofortigem Löschen
- **Automatische Bereinigung** - Regelmäßige Papierkorb-Leerung

## Deployment & Updates

### Entwicklung (Windows)
```bash
# Frontend Development
npm run dev

# Deployment zum Pi
scp -r src/ zumpe@192.168.8.204:/home/zumpe/photobooth/
```

### Produktion (Raspberry Pi)
```bash
# Service Neustart
sudo systemctl restart photobooth-backend.service
sudo systemctl restart photobooth-frontend.service

# Logs überprüfen
journalctl -u photobooth-backend.service -f
journalctl -u photobooth-frontend.service -f
```

## Sicherheit & Auth

### Admin-Bereich
- **Passwort-geschützt** - users.json mit gehashten Passwörtern
- **Session-basiert** - JWT-Tokens für Authentifizierung
- **Protected Routes** - React Router Guards

### Datenschutz
- **Lokale Speicherung** - Keine Cloud-Uploads
- **WLAN-isoliert** - Nur lokaler Router-Zugriff
- **Opt-in Sharing** - Benutzer entscheidet über Foto-Weitergabe

## Troubleshooting

### Häufige Probleme
1. **Backend startet nicht** → Dependencies: `cd backend && npm install`
2. **Kamera nicht erkannt** → gphoto2: `sudo apt install gphoto2`
3. **GPIO Fehler** → Berechtigungen: `sudo usermod -a -G gpio zumpe`
4. **Autostart funktioniert nicht** → Services: `systemctl status photobooth-*`

### Debug-Befehle
```bash
# Service Status
systemctl status photobooth-backend.service
systemctl status photobooth-frontend.service

# Logs
journalctl -u photobooth-backend.service -n 50
journalctl -u photobooth-frontend.service -n 50

# Prozesse
ps aux | grep node
ps aux | grep chromium

# Ports
netstat -tlnp | grep -E ':3001|:5173'
```

## Backup & Recovery

### Wichtige Dateien
```bash
# Fotos (kritisch)
/home/zumpe/photobooth/photos/

# Konfiguration
/home/zumpe/photobooth/branding/
/home/zumpe/photobooth/users.json

# Services
/etc/systemd/system/photobooth-*.service
/home/zumpe/.config/autostart/photobooth.desktop
```

### Backup-Script
```bash
#!/bin/bash
# Täglich ausführen
tar -czf "photobooth-backup-$(date +%Y%m%d).tar.gz" \
    /home/zumpe/photobooth/photos/ \
    /home/zumpe/photobooth/branding/ \
    /home/zumpe/photobooth/users.json
```

## Erweiterungen & Anpassungen

### Neue Features hinzufügen
1. **Frontend** - React-Komponente in `src/components/`
2. **Backend** - API-Endpoint in `server-raspberry.js`
3. **Routing** - React Router in `App.tsx`
4. **Styling** - Material-UI Theme in `ThemeContext.tsx`

### Hardware-Erweiterungen
- **Drucker-Integration** - CUPS + Node.js Printer
- **LED-Strips** - GPIO + PWM-Steuerung
- **Externe Buttons** - GPIO-Interrupts
- **Sound-Effekte** - ALSA + Audio-Dateien

## Lizenz & Credits
- **MIT License**
- **React** - Facebook/Meta
- **Material-UI** - MUI Team  
- **Express.js** - Node.js Foundation
- **gphoto2** - Open Source Camera Control
