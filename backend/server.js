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
const PHOTOS_DIR = path.join(__dirname, 'photos');

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
    url = `http://<pi-ip>:3001/photos/${photo}`;
  } else {
    url = `http://<pi-ip>:3001/gallery`;
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
    const url = `http://<pi-ip>:3001/photos/${lastPhoto}`;
    try {
      const qr = await QRCode.toDataURL(url);
      res.json({ qr, url, filename: lastPhoto });
    } catch (e) {
      res.status(500).json({ error: 'QR-Code-Fehler' });
    }
  });
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
