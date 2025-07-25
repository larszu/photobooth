const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const cors = require('cors');
const util = require('util');
const execPromise = util.promisify(exec);
const multer = require('multer');

const app = express();
const PORT = 3001;

// CORS konfigurieren
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3001', // Backend Port
    'http://192.168.8.204:5173', // Remote Vite
    'http://192.168.8.204:3001', // Remote Backend
    'http://192.168.8.204', // Production
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// GPIO Setup (nur auf Raspberry Pi)
let GPIO = null;
let isRaspberryPi = false;

try {
  // Prüfe ob wir auf einem Raspberry Pi sind
  const fs_sync = require('fs');
  if (fs_sync.existsSync('/proc/cpuinfo')) {
    const cpuinfo = fs_sync.readFileSync('/proc/cpuinfo', 'utf8');
    if (cpuinfo.includes('Raspberry Pi')) {
      isRaspberryPi = true;
      console.log('Raspberry Pi erkannt, initialisiere GPIO...');
      
      try {
        // Versuche GPIO-Bibliothek zu laden (rpi-gpio oder andere)
        const rpiGpio = require('rpi-gpio');
        GPIO = rpiGpio;
        
        // GPIO 18 (Pin 12) als Input mit Pull-up konfigurieren
        GPIO.setup(18, GPIO.DIR_IN, GPIO.EDGE_FALLING, (err) => {
          if (err) {
            console.error('GPIO Setup Error:', err);
          } else {
            console.log('GPIO 18 als Input mit Pull-up konfiguriert');
            
            // Event Listener für GPIO 18
            GPIO.on('change', (channel, value) => {
              if (channel === 18 && value === false) { // Fallende Flanke (Button gedrückt)
                console.log('Hardware Button gedrückt!');
                // Hier könnte eine Foto-Aufnahme ausgelöst werden
                // triggerPhotoCapture();
              }
            });
          }
        });
      } catch (gpioErr) {
        console.warn('GPIO-Bibliothek nicht verfügbar:', gpioErr.message);
        GPIO = null;
      }
    }
  }
} catch (err) {
  console.warn('Konnte Raspberry Pi Status nicht prüfen:', err.message);
}

if (!isRaspberryPi) {
  console.log('Nicht auf Raspberry Pi - GPIO deaktiviert');
}

// Ordner erstellen falls nicht vorhanden
const photosDir = path.join(__dirname, 'photos');
const trashDir = path.join(photosDir, 'papierkorb');

async function ensureDirectories() {
  try {
    await fs.mkdir(photosDir, { recursive: true });
    await fs.mkdir(trashDir, { recursive: true });
    console.log('Verzeichnisse erstellt/überprüft');
  } catch (err) {
    console.error('Fehler beim Erstellen der Verzeichnisse:', err);
  }
}

ensureDirectories();

// Hilfsfunktion für gphoto2 mit Timeout
async function executeWithTimeout(command, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
    }, timeoutMs);

    exec(command, (error, stdout, stderr) => {
      clearTimeout(timeout);
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Multer für Datei-Uploads konfigurieren
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, photosDir);
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    cb(null, `upload_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// API Routen
app.get('/api/photos', async (req, res) => {
  try {
    const files = await fs.readdir(photosDir);
    const photoFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file) && !file.startsWith('.')
    );
    
    // Nach Änderungszeit sortieren (neueste zuerst)
    const photosWithStats = await Promise.all(
      photoFiles.map(async (file) => {
        const filePath = path.join(photosDir, file);
        const stats = await fs.stat(filePath);
        return { filename: file, mtime: stats.mtime };
      })
    );
    
    photosWithStats.sort((a, b) => b.mtime - a.mtime);
    
    res.json({ 
      success: true, 
      photos: photosWithStats.map(p => p.filename)
    });
  } catch (err) {
    console.error('Fehler beim Laden der Fotos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Foto aufnehmen
app.post('/api/capture', async (req, res) => {
  console.log('Foto-Aufnahme gestartet...');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `photo_${timestamp}.jpg`;
    const outputPath = path.join(photosDir, filename);

    // gphoto2 Befehl mit Timeout
    const command = `gphoto2 --capture-image-and-download --filename "${outputPath}"`;
    console.log('Führe gphoto2 Befehl aus:', command);
    
    try {
      const result = await executeWithTimeout(command, 5000); // 5 Sekunden Timeout
      console.log('gphoto2 stdout:', result.stdout);
      if (result.stderr) console.log('gphoto2 stderr:', result.stderr);
    } catch (timeoutError) {
      console.error('gphoto2 Timeout:', timeoutError.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Kamera-Timeout: Bitte prüfen Sie die Kamera-Verbindung' 
      });
    }
    
    // Prüfen ob Datei erstellt wurde
    try {
      await fs.access(outputPath);
      console.log('Foto erfolgreich gespeichert:', filename);
      res.json({ 
        success: true, 
        filename: filename,
        path: outputPath
      });
    } catch (accessErr) {
      console.error('Foto wurde nicht erstellt:', accessErr);
      res.status(500).json({ 
        success: false, 
        error: 'Foto konnte nicht gespeichert werden' 
      });
    }
    
  } catch (err) {
    console.error('Fehler bei Foto-Aufnahme:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// QR-Code für Foto generieren
app.get('/api/photos/:photoId/qr', async (req, res) => {
  try {
    const photoId = decodeURIComponent(req.params.photoId);
    const photoUrl = `http://192.168.8.204:3001/photos/${encodeURIComponent(photoId)}`;
    
    console.log('Generiere QR-Code für:', photoUrl);
    
    const qrCode = await QRCode.toDataURL(photoUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({ 
      success: true, 
      qr_code: qrCode,
      url: photoUrl
    });
  } catch (err) {
    console.error('Fehler beim Generieren des QR-Codes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Statische Dateien für Fotos
app.use('/photos', express.static(photosDir));

// Foto löschen (in Papierkorb verschieben)
app.delete('/api/photos/:photoId', async (req, res) => {
  try {
    const photoId = decodeURIComponent(req.params.photoId);
    const sourcePath = path.join(photosDir, photoId);
    const targetPath = path.join(trashDir, photoId);
    
    await fs.rename(sourcePath, targetPath);
    console.log(`Foto in Papierkorb verschoben: ${photoId}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Fotos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Papierkorb-Fotos abrufen
app.get('/api/trash', async (req, res) => {
  try {
    const files = await fs.readdir(trashDir);
    const photoFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif)$/i.test(file) && !file.startsWith('.')
    );
    
    res.json({ 
      success: true, 
      photos: photoFiles
    });
  } catch (err) {
    console.error('Fehler beim Laden der Papierkorb-Fotos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Foto aus Papierkorb wiederherstellen
app.post('/api/trash/:photoId/restore', async (req, res) => {
  try {
    const photoId = decodeURIComponent(req.params.photoId);
    const sourcePath = path.join(trashDir, photoId);
    const targetPath = path.join(photosDir, photoId);
    
    await fs.rename(sourcePath, targetPath);
    console.log(`Foto wiederhergestellt: ${photoId}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Wiederherstellen des Fotos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Foto endgültig löschen
app.delete('/api/trash/:photoId', async (req, res) => {
  try {
    const photoId = decodeURIComponent(req.params.photoId);
    const filePath = path.join(trashDir, photoId);
    
    await fs.unlink(filePath);
    console.log(`Foto endgültig gelöscht: ${photoId}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim endgültigen Löschen des Fotos:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Statische Dateien für Papierkorb
app.use('/trash', express.static(trashDir));

// Branding-Routen
app.get('/api/branding', async (req, res) => {
  try {
    const brandingPath = path.join(__dirname, 'branding', 'branding.txt');
    
    try {
      const brandingText = await fs.readFile(brandingPath, 'utf8');
      const trimmedText = brandingText.trim();
      
      if (trimmedText) {
        res.json({
          success: true,
          type: 'text',
          text: trimmedText
        });
      } else {
        res.json({
          success: true,
          type: 'text',
          text: ''
        });
      }
    } catch (err) {
      // Datei existiert nicht oder kann nicht gelesen werden
      res.json({
        success: true,
        type: 'text',
        text: ''
      });
    }
  } catch (err) {
    console.error('Fehler beim Laden des Brandings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/branding', async (req, res) => {
  try {
    const { type, text, logo } = req.body;
    const brandingDir = path.join(__dirname, 'branding');
    const brandingPath = path.join(brandingDir, 'branding.txt');
    
    // Branding-Verzeichnis erstellen falls nicht vorhanden
    await fs.mkdir(brandingDir, { recursive: true });
    
    if (type === 'text') {
      await fs.writeFile(brandingPath, text || '', 'utf8');
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Speichern des Brandings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Datei-Upload für Branding-Logo
app.post('/api/branding/upload', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen' });
    }
    
    const logoPath = `/photos/${req.file.filename}`;
    res.json({ 
      success: true, 
      logoPath: logoPath 
    });
  } catch (err) {
    console.error('Fehler beim Logo-Upload:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin-API für Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  // Einfache Passwort-Prüfung (in Production sollte dies sicherer sein)
  if (password === 'admin123') {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ success: false, error: 'Falsches Passwort' });
  }
});

// Server starten
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Photobooth-Server läuft auf Port ${PORT}`);
  console.log(`Raspberry Pi Modus: ${isRaspberryPi ? 'Aktiviert' : 'Deaktiviert'}`);
  console.log(`GPIO: ${GPIO ? 'Verfügbar' : 'Nicht verfügbar'}`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\nServer wird heruntergefahren...');
  
  if (GPIO && isRaspberryPi) {
    try {
      GPIO.destroy(() => {
        console.log('GPIO aufgeräumt');
        process.exit(0);
      });
    } catch (err) {
      console.error('Fehler beim GPIO Cleanup:', err);
      process.exit(1);
    }
  } else {
    process.exit(0);
  }
});
