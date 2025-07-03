# 📸 Raspberry Pi Fotobox - Komplette Aufbauanleitung

Diese Schritt-für-Schritt-Anleitung hilft dir, die Fotobox auf deinem Raspberry Pi 5 einzurichten - auch ohne Vorwissen!

## 🛠️ Was du brauchst

1. **Hardware**:
   - Raspberry Pi 5 (4GB oder 8GB RAM)
   - Micro SD-Karte (min. 32GB, Class 10)
   - Offizielles Pi 5 Netzteil (5V/5A USB-C)
   - Touch-Display (z.B. 8.9" 2560x1600)
   - Digitalkamera (DSLR/DSLM mit USB)
   - GL-SFT1200 Mini-Router
   - USB-Kabel für Kamera
   - Optional: 
     - 2 Taster für Auslöser/Timer
     - 1 LED für Status
     - Gehäuse/Stativ

2. **Software** (wird automatisch installiert):
   - Raspberry Pi OS
   - Node.js
   - gphoto2
   - Git

## 🚀 Installation in 5 Schritten

### 1️⃣ Raspberry Pi OS installieren
1. Lade den "Raspberry Pi Imager" von [raspberrypi.com/software](https://www.raspberrypi.com/software/) herunter
2. Starte den Imager und klicke auf "CHOOSE OS"
3. Wähle "Raspberry Pi OS (64-bit)" mit Desktop
4. Klicke auf das Zahnrad (⚙️) für erweiterte Optionen:
   - Aktiviere SSH
   - Setze Benutzername (z.B. `pi`) und Passwort
   - Konfiguriere WLAN (für ersten Setup)
5. Wähle deine SD-Karte und klicke "WRITE"
6. Warte bis zum Ende und stecke die SD-Karte in den Pi

### 2️⃣ Ersteinrichtung
1. Schließe an:
   - Touch-Display via USB-C & micro-HDMI
   - Kamera via USB
   - Netzteil
2. Erster Start:
   - Warte bis zum Desktop
   - Führe die Ersteinrichtung durch
   - Öffne ein Terminal mit Strg+Alt+T

### 3️⃣ Software installieren
Kopiere diese Befehle einzeln ins Terminal:

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git gphoto2

# Variante 1: Direkt von GitHub (empfohlen)
git clone https://github.com/deinname/photobooth
cd photobooth

# ODER Variante 2: Von deinem Computer kopieren
# Auf deinem Computer:
# - Komprimiere den photobooth-Ordner als ZIP
# - Kopiere die ZIP auf einen USB-Stick
# Auf dem Raspberry Pi:
# - Stick einstecken
# - ZIP in dein Home-Verzeichnis kopieren
# - Entpacken mit:
#   unzip photobooth.zip
#   cd photobooth

# Dependencies installieren
npm install
cd backend && npm install
cd ..

# Verzeichnisse anlegen
mkdir -p photos branding
sudo chown -R pi:pi photos branding

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# Photobooth für Raspberry Pi 5

## Übersicht

Diese Anwendung ist eine Fullstack-Fotobox für den Raspberry Pi 5 mit Touch-Display, gphoto2-kompatibler Kamera und GL-SFT1200 Router.

### Features
- Fotos aufnehmen, speichern und anzeigen
- Galerie- und Einzelbildansicht
- QR-Code-Generierung für Foto-Links
- Admin-Oberfläche für WLAN und Fotoverwaltung
- Touch-optimierte, moderne UI
- REST-API für Frontend und Admin

## Projektstruktur
- **/src**: Frontend (React + TypeScript, Vite)
- **/backend**: Backend (Node.js + Express, wird noch erstellt)
- **/photos**: Gespeicherte Fotos

## Setup & Start
1. **Frontend installieren & starten**
   ```bash
   npm install
   npm run dev
   ```
2. **Backend folgt**

## Hinweise
- Hardware-Integration (Kamera, GPIO) erfolgt im Backend.
- Die Anwendung funktioniert auch offline im lokalen Netzwerk.

---

Weitere Details und Backend-Code folgen.

### 4️⃣ Hardware anschließen

1. **Kamera einrichten**:
   ```bash
   # Teste ob die Kamera erkannt wird
   gphoto2 --auto-detect
   # Sollte deine Kamera anzeigen
   
   # Teste Foto aufnehmen
   gphoto2 --capture-image-and-download
   ```
   - Falls Fehler: Kamera einschalten & in USB-Modus

2. **GPIO-Pins (optional)**:
   ```bash
   # GPIO-Tools installieren
   sudo apt install -y python3-gpiozero
   
   # Verbinde wie folgt:
   # - Auslöser: Pin 17 -> Taster -> GND
   # - Timer: Pin 27 -> Taster -> GND
   # - LED: Pin 22 -> LED -> 220Ω -> GND
   ```

3. **Router einrichten**:
   - Verbinde GL-SFT1200 mit USB
   - Öffne http://192.168.8.1
   - Standard-Login: admin/goodlife
   - Setze WLAN-Name & Passwort

### 5️⃣ Fotobox starten

1. **Entwicklungsmodus** (zum Testen):
   ```bash
   # Terminal 1: Frontend
   cd ~/photobooth
   npm run dev

   # Terminal 2: Backend
   cd ~/photobooth/backend
   npm run dev
   ```

2. **Produktionsmodus** (automatischer Start):
   ```bash
   # Erstelle Systemd Service
   sudo nano /etc/systemd/system/photobooth.service
   ```
   Füge ein:
   ```ini
   [Unit]
   Description=Photobooth
   After=network.target

   [Service]
   ExecStart=/usr/bin/npm start
   WorkingDirectory=/home/pi/photobooth
   User=pi
   Environment=NODE_ENV=production
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Dann:
   ```bash
   # Service aktivieren
   sudo systemctl enable photobooth
   sudo systemctl start photobooth
   
   # Status prüfen
   systemctl status photobooth
   ```

## 🎯 Testen

1. **Öffne Chrome im Kiosk-Modus**:
   ```bash
   chromium-browser --kiosk http://localhost:5173
   ```

2. **Funktionen testen**:
   - [ ] Touch & Swipe in Galerie
   - [ ] Foto aufnehmen (Touch & Buttons)
   - [ ] Timer (3/5/10s)
   - [ ] QR-Codes scannen
   - [ ] Admin-Panel (`http://localhost:5173/admin`)

## 🚨 Problembehebung

### Kamera wird nicht erkannt
```bash
# USB-Verbindung prüfen
lsusb
# Sollte deine Kamera zeigen

# gphoto2 Kamera-Liste
gphoto2 --list-cameras
```

### GPIO-Fehler
```bash
# Berechtigungen prüfen
ls -l /dev/gpiomem
# Sollte pi-Gruppe gehören

# GPIO-Status
gpio readall
```

### Dienst startet nicht
```bash
# Logs anzeigen
journalctl -u photobooth -f

# Neustart erzwingen
sudo systemctl restart photobooth
```

## 📱 Benutzung

1. **Fotos aufnehmen**:
   - Touch: Großer Button unten = Sofortauslösung
   - Touch: Timer-Button links = 3/5/10s Countdown
   - Physisch: Kurzer Druck = Sofort, Langer Druck = Timer

2. **Fotos teilen**:
   - QR-Code erscheint nach Aufnahme
   - Führt direkt zum Foto
   - Funktioniert im lokalen WLAN

3. **Admin-Zugriff**:
   - URL: http://localhost:5173/admin
   - Fotos löschen
   - WLAN konfigurieren
   - Branding anpassen

## 🆘 Hilfe & Support

Bei Problemen:
1. Prüfe die Logs (`journalctl -u photobooth -f`)
2. Stelle sicher, dass alle Kabel fest sitzen
3. Teste die Kamera direkt mit gphoto2
4. Öffne ein Issue auf GitHub

## 🔄 Updates

```bash
cd ~/photobooth
git pull
npm install
cd backend && npm install
cd ..
sudo systemctl restart photobooth
```

## 🌐 Projekt auf GitHub speichern

0. **Git für Windows installieren** (nur einmalig):
   - Lade Git von [git-scm.com/download/win](https://git-scm.com/download/win) herunter
   - Führe den Installer aus
   - Wähle bei der Installation:
     - "Git from the command line and also from 3rd-party software"
     - "Use Visual Studio Code as Git's default editor"
     - Alle anderen Optionen können auf Standard bleiben
   - Nach der Installation: PowerShell neu öffnen
   - Teste die Installation mit: `git --version`

1. **GitHub Repository erstellen**:
   - Gehe zu [github.com](https://github.com) und logge dich ein
   - Klicke auf "New" (grüner Button)
   - Name: `photobooth`
   - Beschreibung: `Raspberry Pi Fotobox mit Touch-Display und DSLR-Kamera`
   - Wähle "Public" oder "Private"
   - Klicke "Create repository"

2. **Lokales Projekt mit GitHub verbinden**:
   ```bash
   # 1. Öffne Git Bash direkt im photobooth-Ordner:
   # - Rechtsklick auf den photobooth-Ordner
   # - Wähle "Git Bash Here"
   # Oder alternativ:
   cd c:\Users\dein_name\Documents\photobooth    # wenn du Git Bash manuell öffnest

   # 3. Git-Benutzer einrichten (nur beim ersten Mal):
   git config --global user.email "deine.email@beispiel.com"
   git config --global user.name "Dein Name"

   # 4. Initialisiere Git und commit die Dateien:
   git init
   git add .
   git commit -m "Initial commit"
   
   # 4. Kopiere die Repository-URL von GitHub (grüner "Code" Button)
   # und ersetze DEIN_USERNAME mit deinem GitHub Benutzernamen:
   git remote add origin https://github.com/DEIN_USERNAME/photobooth.git
   git branch -M main
   git push -u origin main
   ```

3. **Updates auf GitHub pushen**:
   ```bash
   git add .
   git commit -m "Update: Beschreibe deine Änderungen"
   git push
   ```

---
