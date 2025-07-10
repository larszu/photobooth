// server.js
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import bodyParser from 'body-parser';
// import { Gpio } from 'onoff';
import { Button, LED } from './gpio.js';
import { setWifiCredentials, deletePhoto, deleteAllPhotos } from './admin.js';
import brandingRoutes from './brandingRoutes.js';
import fileUpload from 'express-fileupload';

const __dirname = path.resolve();
const app = express();
const PORT = 3001;
const PHOTOS_DIR = path.join(__dirname, '..', 'photos'); // Ein Verzeichnis nach oben

app.use(cors());
app.use(bodyParser.json());
app.use('/photos', express.static(PHOTOS_DIR));
app.use(fileUpload());
app.use('/api/admin/branding', brandingRoutes);
app.use('/branding', express.static(path.join(__dirname, 'branding')));

let displayMode = 'gallery'; // oder 'single'

function takePhoto(callback) {
  const filename = `photo_${Date.now()}.jpg`;
  const filepath = path.join(PHOTOS_DIR, filename);
  exec(`gphoto2 --capture-image-and-download --filename=${filepath}`,(err) => {
    if (err) return callback(err);
    callback(null, filename);
  });
}

app.post('/api/camera/shoot', (req, res) => {
  takePhoto((err, filename) => {
    if (err) return res.status(500).json({ error: 'Kamera-Fehler', details: err.message });
    res.json({ success: true, filename });
  });
});

app.get('/api/photos', (req, res) => {
  fs.readdir(PHOTOS_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Dateifehler' });
    const photos = files.filter(f => f.endsWith('.jpg')).sort();
    res.json({ photos });
  });
});

app.get('/api/photos/:id', (req, res) => {
  const file = path.join(PHOTOS_DIR, req.params.id);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Nicht gefunden' });
  res.sendFile(file);
});

app.delete('/api/photos/:id', (req, res) => {
  const result = deletePhoto(req.params.id);
  if (!result.success) return res.status(404).json({ error: result.error });
  res.json({ success: true });
});

app.delete('/api/photos', (req, res) => {
  const result = deleteAllPhotos();
  res.json(result);
});

app.get('/api/qrcode', async (req, res) => {
  const { mode, photo } = req.query;
  let url;
  if (mode === 'single' && photo) {
    url = `http://${req.get('host')}/photos/${photo}`;
  } else {
    url = `http://${req.get('host')}/gallery`;
  }
  try {
    const qr = await QRCode.toDataURL(url);
    res.json({ qr, url });
  } catch (e) {
    res.status(500).json({ error: 'QR-Code-Fehler' });
  }
});

app.get('/api/mode', (req, res) => {
  res.json({ mode: displayMode });
});
app.post('/api/mode', (req, res) => {
  const { mode } = req.body;
  if (!['gallery', 'single'].includes(mode)) return res.status(400).json({ error: 'Ungültiger Modus' });
  displayMode = mode;
  res.json({ success: true, mode });
});

app.post('/api/admin/wifi', async (req, res) => {
  const { ssid, password } = req.body;
  const result = await setWifiCredentials(ssid, password);
  res.json(result);
});

// Liefert das zuletzt aufgenommene Foto (Dateiname)
app.get('/api/photos/last', (req, res) => {
  fs.readdir(PHOTOS_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: 'Dateifehler' });
    const photos = files.filter(f => f.endsWith('.jpg')).sort();
    if (photos.length === 0) return res.status(404).json({ error: 'Kein Foto vorhanden' });
    res.json({ filename: photos[photos.length - 1] });
  });
});

// QR-Code für das zuletzt aufgenommene Foto
app.get('/api/qrcode/last', async (req, res) => {
  fs.readdir(PHOTOS_DIR, async (err, files) => {
    if (err) return res.status(500).json({ error: 'Dateifehler' });
    const photos = files.filter(f => f.endsWith('.jpg')).sort();
    if (photos.length === 0) return res.status(404).json({ error: 'Kein Foto vorhanden' });
    const lastPhoto = photos[photos.length - 1];
    const url = `http://${req.get('host')}/photos/${lastPhoto}`;
    try {
      const qr = await QRCode.toDataURL(url);
      res.json({ qr, url, filename: lastPhoto });
    } catch (e) {
      res.status(500).json({ error: 'QR-Code-Fehler' });
    }
  });
});

// GPIO Setup
const shootButton = new Button(17); // BCM Pin 17
const timerButton = new Button(27); // BCM Pin 27
const statusLed = new LED(22);      // BCM Pin 22

// LED-Status zurücksetzen
statusLed.off();

// Foto aufnehmen wenn Auslöser gedrückt
shootButton.whenPressed(() => {
  statusLed.on();
  takePhoto((err, filename) => {
    if (err) {
      console.error('Kamera-Fehler:', err);
      statusLed.blink(3, 200); // Schnelles Blinken = Fehler
    } else {
      statusLed.off();
      // Event an Frontend senden (optional)
    }
  });
});

// Timer-Button Logik
let timerMode = 3; // 3, 5 oder 10 Sekunden
let timerActive = false;

timerButton.whenPressed(async () => {
  if (timerActive) return;
  
  timerActive = true;
  console.log(`Timer gestartet: ${timerMode}s`);
  
  // LED blinken während Timer läuft
  statusLed.startBlink(500);
  
  // Countdown
  await new Promise(resolve => setTimeout(resolve, timerMode * 1000));
  
  // Foto auslösen
  statusLed.stopBlink();
  statusLed.on();
  takePhoto((err, filename) => {
    if (err) {
      console.error('Timer-Foto Fehler:', err);
      statusLed.blink(3, 200);
    } else {
      statusLed.off();
    }
    timerActive = false;
  });
});

// Langer Druck auf Timer-Button: Zeit erhöhen
timerButton.whenLongPressed(() => {
  if (timerActive) return;
  
  timerMode = timerMode === 10 ? 3 : timerMode + 2;
  console.log(`Timer-Mode: ${timerMode}s`);
  statusLed.blink(timerMode === 10 ? 3 : timerMode === 5 ? 2 : 1);
});

// Cleanup bei Programmende
process.on('SIGINT', () => {
  console.log('GPIO Cleanup...');
  shootButton.cleanup();
  timerButton.cleanup();
  statusLed.cleanup();
  process.exit();
});

app.listen(PORT, () => {
  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR);
  console.log(`Fotobox-Backend läuft auf Port ${PORT}`);
});

// Beispiel: GPIO auslösen (optional)
// const trigger = new Gpio(17, 'out');
// trigger.writeSync(1);
// trigger.writeSync(0);
// Beispiel mit gpizero-Button (nur auf Pi lauffähig)
// const ausloeser = new Button(17); // Pin-Nummer anpassen
// ausloeser.whenPressed(() => takePhoto(...));
