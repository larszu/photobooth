# 🔄 Migration von Windows zu Raspberry Pi

## 📋 Hauptunterschiede

### 1. 📸 **Kamera-System**
```javascript
// Windows (Mock)
const mockCamera = {
  takePhoto: () => {
    // Erstellt SVG-Dateien als Demo
  }
};

// Raspberry Pi (Echte Kamera)
class RaspberryPiCamera {
  async takePhoto() {
    // Verwendet gphoto2 für echte Fotos
    const command = `gphoto2 --capture-image-and-download --filename="${filepath}"`;
    await execAsync(command);
  }
}
```

### 2. 💡 **GPIO-System**
```javascript
// Windows (Mock)
const mockGpio = {
  blinkLed: () => console.log('💡 Mock: LED Blink')
};

// Raspberry Pi (Echte Hardware)
import { setupGpio, blinkLed } from './gpio.js';
blinkLed(); // Steuert echte LEDs über GPIO
```

### 3. 📦 **Dependencies**

#### Windows (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sharp": "^0.32.6",
    "qrcode": "^1.5.3"
  }
}
```

#### Raspberry Pi (package-raspberry.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sharp": "^0.32.6", 
    "qrcode": "^1.5.3",
    "onoff": "^6.0.3",           // GPIO-Steuerung
    "pigpio-client": "^1.4.0",   // Erweiterte GPIO
    "node-gphoto2": "^0.0.8"     // Kamera-Integration
  }
}
```

### 4. 🔧 **System-Setup**

#### Windows
- Keine Hardware-Installation nötig
- Mock-Modus für Entwicklung
- Sofort lauffähig

#### Raspberry Pi
```bash
# Hardware-Dependencies installieren
sudo apt install -y gphoto2 libgphoto2-dev pigpio

# GPIO-Daemon starten
sudo systemctl enable pigpiod
sudo systemctl start pigpiod

# Benutzer-Berechtigungen
sudo usermod -a -G gpio $USER
```

## 🚀 **Migration Steps**

### 1. Code-Änderungen
```bash
# Kopiere die Raspberry Pi Version
cp server-windows.js server-raspberry.js
cp package-windows.json package-raspberry.json

# Ersetze Mock-Funktionen durch Hardware-Integration
# (siehe server-raspberry.js)
```

### 2. Hardware anschließen
```
GPIO 18 ──[220Ω]──> LED ──> GND
GPIO 2  ──> Button ──> GND
USB ──> DSLR/Webcam
```

### 3. Installation auf Pi
```bash
# Repository klonen
git clone https://github.com/larszu/photobooth.git
cd photobooth/backend

# Pi-spezifische Pakete
cp package-raspberry.json package.json
npm install

# Hardware-Setup
npm run install-deps
npm run setup-gpio
```

### 4. Server starten
```bash
# Manuell
node server-raspberry.js

# Als Service
sudo systemctl start photobooth
```

## 🎯 **Was bleibt gleich**

✅ **Alle APIs identisch** - Frontend funktioniert ohne Änderungen
✅ **Dateistruktur** - Photos, Papierkorb, Branding
✅ **Admin-Panel** - Gleiche Web-Oberfläche  
✅ **QR-Codes** - Smart Share funktioniert identisch
✅ **Galerie** - Gleiche Foto-Verwaltung

## 🔧 **Was sich ändert**

🔄 **Mock → Hardware** - Echte Fotos statt SVG-Demos
🔄 **Console → GPIO** - Echte LEDs statt Log-Ausgaben
🔄 **Sofort → Setup** - Hardware-Konfiguration erforderlich
🔄 **Entwicklung → Produktion** - Für echten Betrieb optimiert

## 📊 **Performance-Vergleich**

| Aspekt | Windows | Raspberry Pi 5 |
|--------|---------|----------------|
| Boot-Zeit | ~3s | ~30s |
| Foto-Aufnahme | Sofort (Mock) | ~2-5s (echt) |
| LED-Response | Sofort (Mock) | ~50ms (echt) |
| Memory | ~50MB | ~80MB |
| CPU | Niedrig | Mittel |

## 🛠️ **Konfigurationsmöglichkeiten**

### GPIO-Pins anpassen
```javascript
// gpio.js
const LED_PIN = 18;    // Änderbar
const BUTTON_PIN = 2;  // Änderbar
```

### Kamera-Einstellungen
```javascript
// server-raspberry.js
const command = `gphoto2 --capture-image-and-download 
  --filename="${filepath}" 
  --set-config imageformat=1    // JPEG
  --set-config imagesize=0`;    // Groß
```

### Netzwerk-Zugriff
```javascript
// Beide Versionen
app.listen(PORT, '0.0.0.0', () => {
  // Pi: Zugriff von allen Geräten im Netzwerk
  // Windows: Nur lokaler Zugriff
});
```

## 🚨 **Bekannte Probleme & Lösungen**

### Problem: GPIO-Berechtigung
```bash
# Lösung
sudo usermod -a -G gpio $USER
sudo reboot
```

### Problem: Kamera nicht erkannt
```bash
# Prüfen
lsusb
gphoto2 --auto-detect

# Lösung
sudo apt install -y gphoto2 libgphoto2-dev
```

### Problem: Port bereits belegt
```bash
# Lösung
sudo netstat -tulpn | grep :3001
sudo kill -9 [PID]
```

## 📝 **Empfohlener Workflow**

1. **Entwicklung auf Windows** mit Mock-Modus
2. **Testing der APIs** mit Frontend
3. **Migration auf Pi** für Hardware-Integration
4. **Produktiv-Deployment** auf Raspberry Pi

So kannst du alle Features erst entwickeln und testen, bevor du auf die Hardware gehst! 🎯
