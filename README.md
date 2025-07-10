# 📸 Raspberry Pi Fotobox - Komplette Aufbauanleitung

## 🏆 Meilenstein 1 erreicht! ✅
**Frontend-Grundfunktionalität vollständig implementiert und getestet (Juli 2025)**
- ✅ React + TypeScript Frontend läuft stabil
- ✅ Touch-optimierte Foto-Galerie funktioniert
- ✅ Einzelfoto-Anzeige mit Zoom/Swipe implementiert  
- ✅ Robustes Fallback-System ohne Backend
- ✅ Echte Fotos erfolgreich integriert
- ✅ Debug-System für Fehleranalyse verfügbar

**👉 Die Anwendung läuft unter: http://localhost:5173**

---

Diese Schritt-für-Schritt-Anleitung hilft dir, die Fotobox auf deinem Raspberry Pi 5 einzurichten - auch ohne Vorwissen!

## �️ Windows Demo-Modus (Testen ohne Raspberry Pi)

**Du möchtest die Software erst auf Windows testen? Perfekt!**

### Voraussetzungen
- Windows 10/11
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- Git ([git-scm.com](https://git-scm.com))

### Demo starten (3 Schritte)
1. **Terminal öffnen:** Windows-Taste + R → `powershell` → Enter
2. **Projekt herunterladen:**
   ```powershell
   git clone https://github.com/dein-username/photobooth.git
   cd photobooth
   ```
3. **Demo starten:**
   ```powershell
   npm install
   cd backend
   npm install
   cd ..
   npm run demo
   ```
   **Neues Terminal öffnen** (Windows-Taste + R → `powershell` → Enter):
   ```powershell
   cd photobooth
   npm run demo:frontend
   ```

### ✨ Demo-Features
- 🖼️ **5 Demo-Fotos** werden automatisch erstellt
- 📸 **"Foto aufnehmen"** erstellt neue Demo-Bilder
- 🖱️ **Maus-Bedienung:**
  - **Swipe:** Ziehen mit gedrückter Maustaste
  - **Zoom:** Mausrad oder Strg + Mausrad
  - **Tippen:** Normale Mausklicks
- 🔗 **QR-Codes** funktional (simuliert)
- 💡 **GPIO/LED** wird in der Konsole simuliert

### Browser öffnen
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend-Status: [http://localhost:3001/api/status](http://localhost:3001/api/status)

### Was passiert beim ersten Start?
- 🖼️ **5 Demo-Fotos** werden automatisch im `photos/` Ordner erstellt
- 🚀 **Backend** startet auf Port 3001 (alle APIs funktional)
- ✨ **Frontend** startet auf Port 5173 (Touch-optimierte UI)
- 📱 **Browser öffnet automatisch** die Fotobox-Oberfläche

### Testen der Demo
- **Foto aufnehmen:** Klicke den großen Auslöser-Button
- **Galerie:** Swipe durch alle Fotos (mit Maus ziehen)
- **Zoom:** Mausrad oder Strg + Mausklick
- **QR-Code:** Wird für jedes Foto generiert
- **Admin:** Über das Einstellungen-Symbol (⚙️)

---

## �🛠️ Was du brauchst

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
1. **Hardware anschließen:**
   - Touch-Display: USB-C Kabel an Pi + micro-HDMI an Pi
   - Kamera: USB-Kabel an Pi (Kamera einschalten!)
   - Netzteil: USB-C an Pi (Pi startet automatisch)
   - Ethernet oder WLAN für Internet-Zugang

2. **Erster Start:**
   - Warte bis Raspberry Pi Desktop erscheint (1-2 Minuten)
   - Führe die Setup-Assistenten durch (Land, Sprache, WLAN)
   - **Terminal öffnen:** Klicke auf das schwarze Terminal-Symbol ODER drücke Strg+Alt+T

3. **Internet-Test:**
   ```bash
   ping -c 3 google.com
   # Sollte "3 packets transmitted, 3 received" zeigen
   ```

### 3️⃣ Software installieren
Kopiere diese Befehle **einzeln** ins Terminal (nicht alle auf einmal!):

```bash
# System aktualisieren (dauert 5-10 Minuten)
sudo apt update && sudo apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git gphoto2

# Prüfe ob Node.js installiert ist
node --version
npm --version
# Sollte Version 20.x anzeigen

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

# Dependencies installieren (dauert 2-3 Minuten)
npm install
cd backend && npm install
cd ..

# Verzeichnisse anlegen
mkdir -p photos branding
sudo chown -R pi:pi photos branding
```

### 4️⃣ Hardware anschließen

1. **Kamera einrichten**:
   ```bash
   # Wechsle ins photos-Verzeichnis
   cd ~/photobooth/photos
   
   # Teste ob die Kamera erkannt wird
   gphoto2 --auto-detect
   # Sollte deine Kamera anzeigen, z.B. "Canon EOS..." oder "Nikon D..."
   
   # Teste Foto aufnehmen und downloaden
   gphoto2 --capture-image-and-download
   
   # Prüfe ob das Foto gespeichert wurde
   ls -la *.jpg *.JPG 2>/dev/null || echo "Kein Foto gefunden - prüfe Kamera!"
   ```
   - **Falls Fehler:** Kamera einschalten & in USB-Modus setzen
   - **Falls "No camera found":** USB-Kabel prüfen, Kamera-Modus wechseln

2. **GPIO-Pins (optional, nur für physische Taster)**:
   ```bash
   # GPIO-Tools installieren
   sudo apt install -y python3-gpiozero
   
   # Verkabelung (nur bei physischen Tastern):
   # - Auslöser: Pin 17 (GPIO17) -> Taster -> GND (Pin 20)
   # - Timer: Pin 27 (GPIO27) -> Taster -> GND (Pin 25) 
   # - LED: Pin 22 (GPIO22) -> LED (lange Seite) -> 220Ω Widerstand -> GND (Pin 30)
   
   # Test GPIO (optional):
   python3 -c "import RPi.GPIO as GPIO; GPIO.setmode(GPIO.BCM); print('GPIO funktioniert!')"
   ```
   **Hinweis:** Die Fotobox funktioniert auch ohne GPIO-Taster (nur Touch-Display).

3. **Router einrichten**:
   - Verbinde GL-SFT1200 mit USB
   - Öffne http://192.168.8.1
   - Standard-Login: admin/goodlife
   - Setze WLAN-Name & Passwort

### 5️⃣ Fotobox starten

**🚨 WICHTIG: Führe diese Schritte in der richtigen Reihenfolge aus!**

1. **Entwicklungsmodus** (zum Testen - empfohlen für Anfänger):
   
   **Terminal 1: Backend starten**
   ```bash
   cd ~/photobooth/backend
   
   # Für GPIO-Taster: Mit sudo starten
   sudo npm run dev
   
   # ODER ohne GPIO-Taster: Normal starten  
   # npm run dev
   ```
   **Warte bis "Server running on port 3001" erscheint!**

   **Terminal 2: Frontend starten** (neues Terminal öffnen: Strg+Shift+T)
   ```bash
   cd ~/photobooth
   npm run dev
   ```
   **Warte bis "Local: http://localhost:5173" erscheint!**

   **✅ Test: Gehe zu http://localhost:5173 im Browser**
   - Du solltest die Fotobox-Oberfläche sehen
   - Teste den "Foto aufnehmen" Button
   - Prüfe ob Fotos in der Galerie erscheinen

   **🎉 Geschafft! Die Fotobox läuft im Entwicklungsmodus.**
   
   **Für dauerhafte Nutzung:** Fahre mit Schritt 2 (Produktionsmodus) fort.

2. **Produktionsmodus** (automatischer Start beim Boot):
   
   **Schritt 1: Service-Datei erstellen**
   ```bash
   sudo nano /etc/systemd/system/photobooth.service
   ```
   
   **Schritt 2: Folgenden Inhalt in die Datei einfügen:**
   ```ini
   [Unit]
   Description=Photobooth Service
   After=network.target
   
   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/photobooth/backend
   ExecStart=/usr/bin/node server.js
   Restart=always
   RestartSec=3
   Environment=NODE_ENV=production
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   **Schritt 3: Datei speichern und schließen**
   - Drücke `Ctrl+X`
   - Dann `Y` für "Yes"
   - Dann `Enter` zum Bestätigen
   
   **Schritt 4: Service aktivieren und starten**
   ```bash
   # Service neu laden
   sudo systemctl daemon-reload
   
   # Service beim Boot aktivieren
   sudo systemctl enable photobooth
   
   # Service sofort starten
   sudo systemctl start photobooth
   
   # Status prüfen
   systemctl status photobooth
   
   # Logs anzeigen (falls Probleme)
   journalctl -u photobooth -f
   ```

## 🎯 Testen

### Schnelltest für Einsteiger:

1. **Öffne die Fotobox:**
   ```bash
   # Im Browser (oder Chrome öffnen und eingeben):
   http://localhost:5173
   ```

2. **Teste alle Funktionen der Reihe nach:**
   - [ ] **Foto aufnehmen:** Klicke den großen "Foto aufnehmen" Button
   - [ ] **Galerie:** Wische links/rechts durch die Fotos
   - [ ] **QR-Code:** Erscheint nach Foto-Aufnahme für Handy-Download
   - [ ] **Timer:** Klicke Timer-Button (3/5/10s Countdown)
   - [ ] **GPIO-Taster:** Drücke physischen Auslöser (falls angeschlossen)
   - [ ] **Admin-Panel:** Gehe zu http://localhost:5173/admin

3. **Vollbildmodus (für echte Fotobox):**
   ```bash
   chromium-browser --kiosk http://localhost:5173
   ```
   **Beenden:** Alt+F4 oder Strg+Alt+T für Terminal

### Troubleshooting:
- **Frontend lädt nicht:** Prüfe Terminal-Ausgabe, oft Port bereits belegt
- **Foto-Button funktioniert nicht:** Backend läuft nicht oder Kamera-Problem  
- **GPIO-Fehler:** Programm mit `sudo` starten oder GPIO deaktivieren
- **Kamera nicht gefunden:** USB-Kabel prüfen, Kamera in richtigen Modus
- **QR-Codes funktionieren nicht:** IP-Adresse wird automatisch erkannt
- **"Cannot GET /api/..."**: Backend nicht gestartet oder falscher Port

### Windows Demo Troubleshooting:
- **"Port 3001 bereits verwendet":** Stoppe alle Node.js Prozesse: `taskkill /F /IM node.exe`
- **"command not found":** Git und Node.js installieren (siehe Links oben)
- **PowerShell vs CMD:** Verwende PowerShell für bessere Kompatibilität
- **Fotos werden nicht angezeigt:** Backend muss zuerst laufen (Port 3001)
- **Browser öffnet nicht automatisch:** Manuell zu [http://localhost:5173](http://localhost:5173)

### API-Test (für Entwickler):
```bash
# Teste Backend-Verbindung:
curl http://localhost:3001/api/photos

# Teste Foto-API:  
curl -X POST http://localhost:3001/api/camera/shoot

# Teste QR-Code:
curl http://localhost:3001/api/qrcode/last
```

## 🚨 Problembehebung

### Die häufigsten Probleme und Lösungen:

#### Backend startet nicht
```bash
# 1. Prüfe ob Node.js installiert ist
node --version

# 2. Prüfe ob im richtigen Ordner
pwd
# Sollte /home/pi/photobooth/backend zeigen

# 3. Installiere fehlende Pakete
npm install

# 4. Starte mit Details
npm run dev
```

#### GPIO-Fehler "EINVAL: invalid argument"
```bash
# Lösung 1: Mit sudo starten
sudo npm run dev

# Lösung 2: GPIO deaktivieren (bearbeite backend/server.js)
# Kommentiere GPIO-Zeilen aus oder setze NODE_ENV=development

# Lösung 3: Prüfe Hardware
ls -l /dev/gpiomem
```

#### Kamera wird nicht erkannt
```bash
# USB-Verbindung prüfen
lsusb | grep -i canon
# oder
lsusb | grep -i nikon

# gphoto2 Kamera-Liste
gphoto2 --list-cameras

# Kamera neu anschließen
# 1. USB-Kabel ab
# 2. Kamera aus/ein  
# 3. USB wieder an
# 4. gphoto2 --auto-detect
```

#### Frontend lädt nicht (localhost:5173)
```bash
# Prüfe ob Vite läuft
ps aux | grep vite

# Port bereits belegt?
netstat -tlnp | grep 5173

# Neustart mit anderem Port
npm run dev -- --port 3000
```

#### "Permission denied" oder "EACCES" Fehler
```bash
# Ordner-Berechtigungen reparieren
sudo chown -R pi:pi ~/photobooth
chmod -R 755 ~/photobooth

# Node modules neu installieren
rm -rf node_modules package-lock.json
npm install
```

## 📱 Benutzung

### Erste Schritte nach dem Start:

1. **Fotobox öffnen:** Gehe zu http://localhost:5173 in deinem Browser
2. **Erstes Foto:** Klicke den großen "Foto aufnehmen" Button 
3. **Foto anschauen:** Das Foto erscheint automatisch in der Galerie
4. **QR-Code:** Scanne den QR-Code mit dem Handy für Download
5. **Durch Fotos wischen:** Touch oder Pfeiltasten verwenden

### Bedienung:

1. **Fotos aufnehmen**:
   - **Touch:** Großer Button unten = Sofortauslösung
   - **Touch:** Timer-Button links = 3/5/10s Countdown  
   - **Physisch:** Kurzer Tastendruck = Sofort, Langer Druck = Timer (falls GPIO angeschlossen)

2. **Fotos teilen**:
   - QR-Code erscheint nach jeder Aufnahme
   - QR-Code führt direkt zum Foto-Download
   - Funktioniert im lokalen WLAN (Handy muss im gleichen Netz sein)

3. **Admin-Zugriff**:
   - URL: http://localhost:5173/admin
   - Fotos löschen und verwalten
   - WLAN konfigurieren (Router-Einstellungen)
   - Branding/Logo anpassen

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

   # 5. Personal Access Token erstellen (für Push-Berechtigung):
   # - GitHub.com → Profilbild → Settings → Developer settings
   # - Personal access tokens → Tokens (classic) → Generate new token
   # - Note: "Photobooth"
   # - Berechtigungen: [x] repo
   # - Token sofort kopieren!
   
   # 6. Code auf GitHub hochladen:
   git push -u origin main
   # Bei Nachfrage nach Anmeldedaten:
   # - Username: dein GitHub-Username
   # - Passwort: füge den Token ein (nicht dein GitHub-Passwort!)
   ```

3. **Updates auf GitHub pushen**:
   ```bash
   git add .
   git commit -m "Update: Beschreibe deine Änderungen"
   git push
   ```

---
