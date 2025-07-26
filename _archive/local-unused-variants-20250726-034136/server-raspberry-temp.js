// Raspberry Pi Version des Servers mit GPIO und gphoto2
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';

// Import Auth-Modul
import { login, verifyToken, requireAuth, getAuthStatus, changePassword } from './auth.js';
import brandingRoutes from './brandingRoutes.js';
import { getGPIOInstance } from './gpio-pi5-simple.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Performance-Optimierung
app.set('x-powered-by', false);
app.use(express.json({ limit: '10mb' }));

// Session und Cookie Middleware
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'photobooth-session-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // In Produktion auf true setzen (HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
}));

// Konfiguration
const PHOTOS_DIR = path.join(__dirname, '../photos');
const BRANDING_DIR = path.join(__dirname, '../branding');
const TRASH_DIR = path.join(PHOTOS_DIR, 'papierkorb');
const BRANDING_FILE = path.join(BRANDING_DIR, 'branding.json');

// Middleware
app.use(cors());
app.use(express.json());

// Multer f├╝r Datei-Uploads
const upload = multer({ dest: 'uploads/' });

// Stelle sicher, dass die Verzeichnisse existieren
console.log('­ƒôü Checking and creating directories...');
[PHOTOS_DIR, BRANDING_DIR, TRASH_DIR].forEach(dir => {
  console.log(`­ƒôü Checking directory: ${dir}`);
  if (!fs.existsSync(dir)) {
    console.log(`­ƒôü Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`­ƒôü Directory created: ${fs.existsSync(dir) ? 'SUCCESS' : 'FAILED'}`);
  } else {
    console.log(`­ƒôü Directory exists: ${dir}`);
  }
});

// === HELPER FUNCTIONS ===

// Erstelle Tagesordner falls er nicht existiert
function createTodayFolder() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const folderName = `${year}${month}${day}_Photobooth`;
  const folderPath = path.join(PHOTOS_DIR, folderName);
  
  if (!fs.existsSync(folderPath)) {
    console.log(`­ƒôü Creating today's folder: ${folderName}`);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`­ƒôü Folder created successfully: ${folderPath}`);
  }
  
  return {
    folderName,
    folderPath
  };
}

// Hole alle Tagesordner (f├╝r Galerie) - nur Ordner mit Fotos
function getAllPhotoFolders() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    return [];
  }
  
  const items = fs.readdirSync(PHOTOS_DIR);
  const folders = items.filter(item => {
    const itemPath = path.join(PHOTOS_DIR, item);
    const isDirectory = fs.statSync(itemPath).isDirectory();
    const isDateFolder = /^\d{8}_Photobooth$/.test(item); // YYYYMMDD_Photobooth format
    const isNotTrash = item !== 'papierkorb';
    
    if (!isDirectory || !isDateFolder || !isNotTrash) {
      return false;
    }
    
    // Pr├╝fe ob der Ordner tats├ñchlich Fotos enth├ñlt
    try {
      const files = fs.readdirSync(itemPath);
      const hasPhotos = files.some(file => /\.(jpg|jpeg|png|svg)$/i.test(file));
      
      // Nur f├╝r die Anzeige filtern, nicht automatisch l├Âschen
      return hasPhotos;
    } catch (error) {
      console.warn(`ÔÜá´©Å Error checking folder ${item}:`, error);
      return false;
    }
  });
  
  return folders.sort().reverse(); // Neueste zuerst
}

// Hole alle Fotos aus allen Tagesordnern
function getAllPhotosFromFolders() {
  const folders = getAllPhotoFolders();
  let allPhotos = [];
  
  folders.forEach(folderName => {
    const folderPath = path.join(PHOTOS_DIR, folderName);
    try {
      const files = fs.readdirSync(folderPath);
      const photos = files
        .filter(file => /\.(jpg|jpeg|png|svg)$/i.test(file))
        .map(file => {
          const filepath = path.join(folderPath, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            path: `/photos/${folderName}/${file}`,
            folder: folderName,
            fullPath: filepath,
            size: stats.size,
            created: stats.ctime.toISOString()
          };
        });
      
      allPhotos = allPhotos.concat(photos);
    } catch (error) {
      console.error(`ÔØî Error reading folder ${folderName}:`, error);
    }
  });
  
  // Nach Erstellungsdatum sortieren (neueste zuerst)
  return allPhotos.sort((a, b) => new Date(b.created) - new Date(a.created));
}

// Hilfsfunktion: Pr├╝fe und l├Âsche leere Ordner
function cleanupEmptyFolders() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    return;
  }
  
  const items = fs.readdirSync(PHOTOS_DIR);
  let deletedFolders = 0;
  
  items.forEach(item => {
    const itemPath = path.join(PHOTOS_DIR, item);
    
    try {
      const isDirectory = fs.statSync(itemPath).isDirectory();
      const isDateFolder = /^\d{8}_Photobooth$/.test(item);
      const isNotTrash = item !== 'papierkorb';
      
      if (isDirectory && isDateFolder && isNotTrash) {
        const files = fs.readdirSync(itemPath);
        const hasPhotos = files.some(file => /\.(jpg|jpeg|png|svg)$/i.test(file));
        
        if (!hasPhotos) {
          console.log(`­ƒùæ´©Å Cleaning up empty folder: ${item}`);
          fs.rmSync(itemPath, { recursive: true, force: true });
          deletedFolders++;
        }
      }
    } catch (error) {
      console.warn(`ÔÜá´©Å Error cleaning folder ${item}:`, error);
    }
  });
  
  if (deletedFolders > 0) {
    console.log(`Ô£à Cleaned up ${deletedFolders} empty folder(s)`);
  }
}

// === STATIC FILE SERVING ===

// Fotos statisch bereitstellen
app.use('/photos', express.static(PHOTOS_DIR));

// Branding-Dateien statisch bereitstellen
app.use('/branding', express.static(BRANDING_DIR));

// Download-Endpunkt f├╝r Fotos mit korrekten Headern
app.get('/api/photos/:folder/:filename/download', (req, res) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const filename = decodeURIComponent(req.params.filename);
    
    console.log(`­ƒôÑ Download request: ${folder}/${filename}`);
    
    const photoPath = path.join(PHOTOS_DIR, folder, filename);
    
    // Pr├╝fe ob Datei existiert
    if (!fs.existsSync(photoPath)) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht gefunden'
      });
    }
    
    // Stelle sicher, dass Dateiname .jpg Endung hat
    let downloadFilename = filename;
    if (!downloadFilename.toLowerCase().endsWith('.jpg')) {
      const nameWithoutExt = path.parse(downloadFilename).name;
      downloadFilename = `${nameWithoutExt}.jpg`;
    }
    
    // Setze Download-Header
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Type', 'image/jpeg');
    
    // Sende Datei
    res.sendFile(photoPath);
    
  } catch (error) {
    console.error('ÔØî Error in photo download:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Herunterladen des Fotos'
    });
  }
});

// Download-Endpunkt f├╝r Fotos ohne Folder mit korrekten Headern
app.get('/api/photos/:filename/download', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    console.log(`­ƒôÑ Download request: ${filename}`);
    
    // Finde das Foto in allen Ordnern
    const allPhotos = getAllPhotosFromFolders();
    const photo = allPhotos.find(p => 
      p.filename === filename || 
      p.filename === path.basename(filename)
    );
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht gefunden'
      });
    }
    
    const photoPath = path.join(PHOTOS_DIR, photo.folder, photo.filename);
    
    // Stelle sicher, dass Dateiname .jpg Endung hat
    let downloadFilename = photo.filename;
    if (!downloadFilename.toLowerCase().endsWith('.jpg')) {
      const nameWithoutExt = path.parse(downloadFilename).name;
      downloadFilename = `${nameWithoutExt}.jpg`;
    }
    
    // Setze Download-Header
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Content-Type', 'image/jpeg');
    
    // Sende Datei
    res.sendFile(photoPath);
    
  } catch (error) {
    console.error('ÔØî Error in photo download:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Herunterladen des Fotos'
    });
  }
});

// Frontend HTML-Seite servieren
app.get('/', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath);
  } catch (error) {
    console.error('ÔØî Error serving frontend:', error);
    res.status(500).send('Frontend nicht verf├╝gbar');
  }
});

// Raspberry Pi Camera Klasse mit gphoto2
class RaspberryPiCamera {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Stoppe blockierende Services automatisch
      console.log('­ƒöº Freigabe der Kamera von blockierenden Services...');
      
      try {
        // Stoppe gvfs-gphoto2-volume-monitor (l├ñuft oft automatisch)
        await execAsync('sudo pkill -f gvfs-gphoto2-volume-monitor || true');
        await execAsync('sudo systemctl stop gvfs-daemon 2>/dev/null || true');
        console.log('Ô£à Blockierende Services gestoppt');
      } catch (serviceError) {
        console.log('Ôä╣´©Å Service-Stop nicht n├Âtig oder fehlgeschlagen (normal bei ersten Start)');
      }
      
      // Kurz warten damit Services vollst├ñndig stoppen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Pr├╝fe ob gphoto2 verf├╝gbar ist
      await execAsync('which gphoto2');
      
      // Pr├╝fe ob Kamera erkannt wird
      const { stdout } = await execAsync('gphoto2 --auto-detect');
      console.log('­ƒôÀ Camera detection:', stdout);
      
      // Teste Kamera-Zugriff
      try {
        await execAsync('gphoto2 --get-config /main/status', { timeout: 5000 });
        console.log('Ô£à Camera access test successful');
      } catch (accessError) {
        console.warn('ÔÜá´©Å Camera access test failed, aber trotzdem fortfahren:', accessError.message);
      }
      
      this.isInitialized = true;
      console.log('Ô£à Camera initialized successfully');
    } catch (error) {
      console.warn('ÔÜá´©Å Camera initialization failed, using fallback mode:', error.message);
      this.isInitialized = false;
    }
  }

  async takePhoto() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `photo-${timestamp}.jpg`;
      
      // Erstelle Tagesordner falls n├Âtig
      const { folderName, folderPath } = createTodayFolder();
      const filepath = path.join(folderPath, filename);
      
      if (this.isInitialized) {
        // Echte Foto-Aufnahme mit gphoto2
        const command = `gphoto2 --capture-image-and-download --filename="${filepath}"`;
        await execAsync(command);
        console.log('­ƒô© Real photo captured with gphoto2:', filename);
      } else {
        // Fallback: Erstelle Demo-Foto
        const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#333">
            Raspberry Pi Photo: ${filename}
          </text>
          <text x="400" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">
            Generated: ${new Date().toLocaleString()}
          </text>
        </svg>`;
        fs.writeFileSync(filepath, svg);
        console.log('­ƒô© Fallback photo created:', filename);
      }
      
      return {
        success: true,
        filename: filename,
        filepath: filepath,
        folder: folderName,
        relativePath: `${folderName}/${filename}`
      };
    } catch (error) {
      console.error('ÔØî Error taking photo:', error);
      throw error;
    }
  }

  async getPreview() {
    try {
      if (this.isInitialized) {
        // Echte Vorschau mit gphoto2
        const tempPath = `/tmp/preview-${Date.now()}.jpg`;
        await execAsync(`gphoto2 --capture-preview --filename="${tempPath}"`);
        
        const imageBuffer = fs.readFileSync(tempPath);
        const base64 = imageBuffer.toString('base64');
        
        // Temp-Datei l├Âschen
        fs.unlinkSync(tempPath);
        
        return { 
          success: true, 
          preview: `data:image/jpeg;base64,${base64}` 
        };
      } else {
        console.log('­ƒæÇ Camera preview (fallback mode)');
        return { 
          success: true, 
          preview: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...' 
        };
      }
    } catch (error) {
      console.error('ÔØî Error getting preview:', error);
      return { 
        success: false, 
        preview: null 
      };
    }
  }
}

// Initialisiere GPIO und Kamera
// WebSocket f├╝r GPIO-Navigation
import { WebSocketServer } from 'ws';

// WebSocket Server f├╝r GPIO-Events
const wss = new WebSocketServer({ port: 3002 });
let wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('´┐¢ WebSocket client connected');
  wsClients.add(ws);
  
  ws.on('close', () => {
    console.log('­ƒôí WebSocket client disconnected');
    wsClients.delete(ws);
  });
});

// Funktion um alle WebSocket-Clients zu benachrichtigen
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  wsClients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(messageStr);
    }
  });
}

console.log('­ƒöº Initializing Raspberry Pi hardware...');
const camera = new RaspberryPiCamera();

// GPIO Setup f├╝r Raspberry Pi 5
try {
  const gpio = getGPIOInstance();
  
  // GPIO f├╝r Pi 5 initialisieren
  const gpioInitialized = await gpio.initialize();
  
  if (gpioInitialized) {
    // GPIO Button Event Handler - kompletter Foto-Workflow wie Touch-Button
    gpio.setPhotoCallback(async () => {
      console.log('­ƒöÿ GPIO Button pressed - starting complete photo workflow...');
      
      // 1. Navigation zur Photo-Seite ├╝ber WebSocket
      broadcastToClients({
        type: 'navigate',
        path: '/photo/new'
      });
      
      // 2. Kurz warten damit Navigation stattfindet
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 3. Foto machen (gleicher Workflow wie Touch-Button)
      try {
        const result = await camera.takePhoto();
        if (result.success) {
          console.log(`Ô£à GPIO Photo taken: ${result.filename}`);
          
          // 4. Navigation zur Foto-Ansicht des neuen Fotos (wie Touch-Button)
          const photoPath = result.folder ? `${result.folder}/${result.filename}` : result.filename;
          console.log(`­ƒöÿ GPIO navigating to photo view: /view/${photoPath}`);
          
          broadcastToClients({
            type: 'navigate',
            path: `/view/${encodeURIComponent(photoPath)}`
          });
          
          // 5. Optional: Frontend ├╝ber erfolgreiches Foto informieren
          broadcastToClients({
            type: 'photo-taken',
            filename: result.filename,
            folder: result.folder,
            photoPath: photoPath,
            success: true
          });
        } else {
          console.error('ÔØî GPIO Photo failed');
          broadcastToClients({
            type: 'photo-taken',
            success: false,
            error: 'Photo capture failed'
          });
        }
      } catch (error) {
        console.error('ÔØî GPIO Photo error:', error);
        broadcastToClients({
          type: 'photo-taken',
          success: false,
          error: error.message
        });
      }
    });
    
    console.log('Ô£à GPIO Pi 5 initialized with photo callback');
    console.log('­ƒôí WebSocket server running on port 3002');
  } else {
    console.warn('ÔÜá´©Å GPIO initialization failed, continuing without GPIO');
  }
} catch (error) {
  console.error('ÔØî GPIO initialization failed:', error);
}

// Camera Setup  
camera.initialize();

// === PHOTO API ROUTES ===

// Foto aufnehmen
app.post('/api/photo/take', async (req, res) => {
  console.log('­ƒô© Photo take request received');
  
  try {
    // GPIO Button Feedback entfernt da keine LED vorhanden
    const result = await camera.takePhoto();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Foto erfolgreich aufgenommen',
        filename: result.filename,
        folder: result.folder,
        filepath: `/photos/${result.relativePath}`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Fehler beim Aufnehmen des Fotos'
      });
    }
  } catch (error) {
    console.error('ÔØî Error taking photo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aufnehmen des Fotos: ' + error.message
    });
  }
});

// Alle Fotos auflisten
app.get('/api/photos', (req, res) => {
  try {
    if (!fs.existsSync(PHOTOS_DIR)) {
      return res.json({ success: true, photos: [] });
    }

    // Hole alle Fotos aus allen Tagesordnern
    const allPhotos = getAllPhotosFromFolders();
    
    // F├╝r Kompatibilit├ñt mit der Frontend-Galerie: erstelle Pfade f├╝r die Anzeige
    const photoFilenames = allPhotos.map(photo => `${photo.folder}/${photo.filename}`);

    console.log(`­ƒôè Found ${allPhotos.length} photos in ${getAllPhotoFolders().length} folders`);
    
    res.json({
      success: true,
      photos: photoFilenames, // F├╝r die Galerie (mit Ordnerpfad)
      photosDetailed: allPhotos, // F├╝r andere Zwecke
      folders: getAllPhotoFolders(), // Liste der verf├╝gbaren Ordner
      count: allPhotos.length
    });
  } catch (error) {
    console.error('ÔØî Error listing photos:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Auflisten der Fotos: ' + error.message
    });
  }
});

// Neue Route: Alle Foto-Ordner mit Metadaten auflisten
app.get('/api/folders', (req, res) => {
  try {
    const folders = getAllPhotoFolders();
    const foldersWithMetadata = folders.map(folderName => {
      const folderPath = path.join(PHOTOS_DIR, folderName);
      const files = fs.readdirSync(folderPath);
      const photos = files.filter(file => /\.(jpg|jpeg|png|svg)$/i.test(file));
      
      // Erste Foto als Thumbnail
      const firstPhoto = photos.length > 0 ? photos[0] : null;
      
      // Datum aus Ordnername extrahieren (YYYYMMDD_Photobooth)
      const dateMatch = folderName.match(/^(\d{4})(\d{2})(\d{2})_Photobooth$/);
      const date = dateMatch ? `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1]}` : folderName;
      
      return {
        name: folderName,
        displayName: date,
        photoCount: photos.length,
        thumbnail: firstPhoto ? `/api/photos/${encodeURIComponent(firstPhoto)}/thumbnail?size=300` : null,
        path: folderName
      };
    });

    res.json({
      success: true,
      folders: foldersWithMetadata
    });
  } catch (error) {
    console.error('ÔØî Error listing folders:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Auflisten der Ordner: ' + error.message
    });
  }
});

// Fotos eines bestimmten Ordners auflisten
app.get('/api/folders/:folderName/photos', (req, res) => {
  try {
    const { folderName } = req.params;
    const folderPath = path.join(PHOTOS_DIR, folderName);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({
        success: false,
        message: 'Ordner nicht gefunden'
      });
    }

    const files = fs.readdirSync(folderPath);
    const photos = files
      .filter(file => /\.(jpg|jpeg|png|svg)$/i.test(file))
      .map(file => {
        const filepath = path.join(folderPath, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          path: `/photos/${folderName}/${file}`,
          folder: folderName,
          size: stats.size,
          created: stats.ctime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({
      success: true,
      folder: folderName,
      photos: photos,
      count: photos.length
    });
  } catch (error) {
    console.error('ÔØî Error listing folder photos:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Auflisten der Ordner-Fotos: ' + error.message
    });
  }
});

// Server Status
app.get('/api/status', (req, res) => {
  console.log('­ƒôè Status request received');
  
  // Sammle Verzeichnisinformationen
  let photosExist = fs.existsSync(PHOTOS_DIR);
  let trashExist = fs.existsSync(TRASH_DIR);
  
  let photosFiles = [];
  let trashFiles = [];
  
  if (photosExist) {
    try {
      // Z├ñhle alle Fotos in allen Ordnern
      const allPhotos = getAllPhotosFromFolders();
      photosFiles = allPhotos.map(p => p.filename);
    } catch (error) {
      console.error('Error reading photos:', error);
    }
  }
  
  if (trashExist) {
    try {
      trashFiles = fs.readdirSync(TRASH_DIR).filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));
    } catch (error) {
      console.error('Error reading trash:', error);
    }
  }
  
  res.json({
    success: true,
    message: 'Server l├ñuft',
    timestamp: new Date().toISOString(),
    directories: {
      photosDir: PHOTOS_DIR,
      trashDir: TRASH_DIR,
      photosDirExists: photosExist,
      trashDirExists: trashExist
    },
    files: {
      photosCount: photosFiles.length,
      trashCount: trashFiles.length,
      photosFiles: photosFiles,
      trashFiles: trashFiles
    }
  });
});

// === THUMBNAIL API ===

// Thumbnail f├╝r einzelnes Foto generieren
app.get('/api/photos/:filename/thumbnail', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const size = parseInt(req.query.size) || 300; // Standard 300px Breite
    
    console.log(`­ƒôÀ Thumbnail request: ${filename} (${size}px)`);
    
    // Finde das Foto in allen Ordnern
    const allPhotos = getAllPhotosFromFolders();
    const photo = allPhotos.find(p => 
      p.filename === filename || 
      p.filename === path.basename(filename)
    );
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht gefunden'
      });
    }
    
    // Thumbnail generieren mit Sharp
    const thumbnailBuffer = await sharp(photo.fullPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Cache-Header setzen
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400', // 24h Cache
      'Content-Length': thumbnailBuffer.length
    });
    
    res.send(thumbnailBuffer);
  } catch (error) {
    console.error('ÔØî Error generating thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des Thumbnails: ' + error.message
    });
  }
});

// Trash Thumbnail f├╝r einzelnes Foto generieren
app.get('/api/trash/:filename/thumbnail', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const size = parseInt(req.query.size) || 300;
    const filepath = path.join(TRASH_DIR, filename);
    
    console.log(`­ƒùæ´©Å­ƒôÀ Trash thumbnail request: ${filename} (${size}px)`);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht im Papierkorb gefunden'
      });
    }
    
    // Thumbnail generieren
    const thumbnailBuffer = await sharp(filepath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': thumbnailBuffer.length
    });
    
    res.send(thumbnailBuffer);
  } catch (error) {
    console.error('ÔØî Error generating trash thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des Thumbnails: ' + error.message
    });
  }
});

// === PAPIERKORB SYSTEM ===

// Papierkorb anzeigen
app.get('/api/trash', (req, res) => {
  try {
    console.log('­ƒùæ´©Å GET /api/trash called');
    
    // Stelle sicher, dass der Papierkorb-Ordner existiert
    if (!fs.existsSync(TRASH_DIR)) {
      fs.mkdirSync(TRASH_DIR, { recursive: true });
      return res.json({ success: true, photos: [] });
    }
    
    const allFiles = fs.readdirSync(TRASH_DIR);
    const files = allFiles
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
      })
      .map(file => {
        const filepath = path.join(TRASH_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          url: `/api/trash/image/${file}`,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    res.json({ success: true, photos: files });
  } catch (error) {
    console.error('ÔØî Error reading trash:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Lesen des Papierkorbs: ' + error.message
    });
  }
});

// Trash Bild servieren
app.get('/api/trash/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(TRASH_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Bild nicht gefunden'
      });
    }

    res.sendFile(filepath);
  } catch (error) {
    console.error('ÔØî Error serving trash image:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Bildes: ' + error.message
    });
  }
});

// Alle Fotos in den Papierkorb verschieben
app.delete('/api/photos', (req, res) => {
  try {
    console.log('­ƒùæ´©Å === DELETE /api/photos called - Moving all photos to trash ===');
    
    // Stelle sicher, dass der Papierkorb-Ordner existiert
    if (!fs.existsSync(TRASH_DIR)) {
      fs.mkdirSync(TRASH_DIR, { recursive: true });
    }
    
    // Metadaten-Datei laden oder erstellen
    const metadataPath = path.join(TRASH_DIR, '.metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (error) {
        console.warn('ÔÜá´©Å Could not read metadata file, creating new one');
        metadata = {};
      }
    }
    
    let movedCount = 0;
    let errorCount = 0;
    
    // Hole alle Fotos aus allen Tagesordnern
    const allPhotos = getAllPhotosFromFolders();
    console.log(`­ƒôü Found ${allPhotos.length} photos to move to trash`);
    
    allPhotos.forEach((photo) => {
      try {
        // Datei in den Papierkorb verschieben
        const trashPath = path.join(TRASH_DIR, photo.filename);
        
        // Falls eine Datei mit dem gleichen Namen bereits im Papierkorb existiert,
        // f├╝ge Timestamp hinzu
        let finalTrashPath = trashPath;
        if (fs.existsSync(trashPath)) {
          const ext = path.extname(photo.filename);
          const basename = path.basename(photo.filename, ext);
          const timestamp = Date.now();
          finalTrashPath = path.join(TRASH_DIR, `${basename}_${timestamp}${ext}`);
        }
        
        // Urspr├╝nglichen Ordner aus dem Pfad ermitteln
        const originalFolder = path.basename(path.dirname(photo.fullPath));
        
        fs.renameSync(photo.fullPath, finalTrashPath);
        
        // Metadaten f├╝r dieses Foto hinzuf├╝gen
        const trashFilename = path.basename(finalTrashPath);
        metadata[trashFilename] = {
          originalName: photo.filename,
          originalFolder: originalFolder,
          deletedAt: new Date().toISOString()
        };
        
        // Falls der Dateiname ge├ñndert wurde, erstelle auch einen Eintrag f├╝r den urspr├╝nglichen Namen
        if (trashFilename !== photo.filename) {
          metadata[photo.filename] = {
            originalName: photo.filename,
            originalFolder: originalFolder,
            deletedAt: new Date().toISOString(),
            actualTrashName: trashFilename
          };
        }
        
        movedCount++;
        console.log(`Ô£à Moved: ${photo.filename} -> trash (from ${originalFolder})`);
        
      } catch (moveError) {
        console.error(`ÔØî Error moving photo ${photo.filename}:`, moveError);
        errorCount++;
      }
    });
    
    // Metadaten speichern
    try {
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`­ƒôï Metadata saved for ${Object.keys(metadata).length} entries`);
    } catch (metadataError) {
      console.error('ÔØî Error saving metadata:', metadataError);
    }
    
    console.log(`­ƒùæ´©Å Operation complete: ${movedCount} moved, ${errorCount} errors`);
    
    // Pr├╝fe und l├Âsche leere Ordner
    cleanupEmptyFolders();
    
    res.json({
      success: true,
      message: `${movedCount} Fotos in den Papierkorb verschoben`,
      details: {
        moved: movedCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('ÔØî Error moving photos to trash:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Verschieben der Fotos in den Papierkorb: ' + error.message
    });
  }
});

// Einzelnes Foto aus dem Papierkorb endg├╝ltig l├Âschen
app.delete('/api/trash/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(TRASH_DIR, filename);
    
    console.log(`­ƒùæ´©Å DELETE /api/trash/${filename} called`);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht im Papierkorb gefunden'
      });
    }
    
    // Datei endg├╝ltig l├Âschen
    fs.unlinkSync(filepath);
    console.log(`Ô£à Permanently deleted: ${filename}`);
    
    res.json({
      success: true,
      message: `Foto "${filename}" wurde endg├╝ltig gel├Âscht`
    });
  } catch (error) {
    console.error('ÔØî Error permanently deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim endg├╝ltigen L├Âschen: ' + error.message
    });
  }
});

// Einzelnes Foto aus dem Papierkorb wiederherstellen
app.post('/api/trash/:filename/restore', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    console.log(`­ƒöä POST /api/trash/${filename}/restore called`);
    
    // Metadaten laden um urspr├╝nglichen Ordner zu finden und tats├ñchlichen Dateinamen zu ermitteln
    const metadataPath = path.join(TRASH_DIR, '.metadata.json');
    let originalFolder = null;
    let originalName = filename;
    let actualTrashFilename = filename; // Der tats├ñchliche Dateiname im Papierkorb
    
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Zuerst mit dem gegebenen Dateinamen suchen
        if (metadata[filename]) {
          originalFolder = metadata[filename].originalFolder;
          originalName = metadata[filename].originalName;
          // Pr├╝fe ob es einen Verweis auf den tats├ñchlichen Namen im Papierkorb gibt
          actualTrashFilename = metadata[filename].actualTrashName || filename;
          console.log(`­ƒôï Found metadata for ${filename} -> original folder: ${originalFolder}, actual trash name: ${actualTrashFilename}`);
        } else {
          // Falls nicht gefunden, suche in allen Metadaten nach einem Eintrag mit diesem originalName
          const metadataEntry = Object.entries(metadata).find(([key, data]) => 
            data.originalName === filename
          );
          
          if (metadataEntry) {
            const [trashName, data] = metadataEntry;
            originalFolder = data.originalFolder;
            originalName = data.originalName;
            actualTrashFilename = trashName;
            console.log(`­ƒôï Found metadata by originalName: ${filename} -> trash name: ${trashName}, original folder: ${originalFolder}`);
          } else {
            console.log(`ÔÜá´©Å No metadata found for ${filename}`);
          }
        }
      } catch (error) {
        console.warn('ÔÜá´©Å Could not read metadata file:', error);
      }
    }
    
    // Verwende den tats├ñchlichen Dateinamen im Papierkorb
    const trashPath = path.join(TRASH_DIR, actualTrashFilename);
    
    // Pr├╝fe ob die Datei im Papierkorb existiert
    if (!fs.existsSync(trashPath)) {
      return res.status(404).json({
        success: false,
        message: `Foto nicht im Papierkorb gefunden: ${actualTrashFilename}`
      });
    }
    
    // Bestimme den Zielordner
    let targetFolder;
    if (originalFolder) {
      // Wiederherstellen in urspr├╝nglichen Ordner
      targetFolder = path.join(PHOTOS_DIR, originalFolder);
      // Erstelle den urspr├╝nglichen Ordner falls er nicht mehr existiert
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
        console.log(`­ƒôü Recreated original folder: ${originalFolder}`);
      }
    } else {
      // Fallback: heutigen Ordner verwenden
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const todayFolderName = `${today.slice(0, 4)}${today.slice(4, 6)}${today.slice(6)}_Photobooth`;
      targetFolder = path.join(PHOTOS_DIR, todayFolderName);
      // Erstelle den heutigen Ordner falls er nicht existiert
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }
      console.log(`­ƒôü Using fallback folder (no metadata): ${todayFolderName}`);
    }
    
    const restorePath = path.join(targetFolder, originalName);
    
    // Falls eine Datei mit dem gleichen Namen bereits existiert, f├╝ge Timestamp hinzu
    let finalRestorePath = restorePath;
    if (fs.existsSync(restorePath)) {
      const ext = path.extname(originalName);
      const basename = path.basename(originalName, ext);
      const timestamp = Date.now();
      finalRestorePath = path.join(targetFolder, `${basename}_restored_${timestamp}${ext}`);
    }
    
    // Datei aus dem Papierkorb zur├╝ck verschieben
    fs.renameSync(trashPath, finalRestorePath);
    
    // Metadaten-Eintrag entfernen
    if (fs.existsSync(metadataPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        delete metadata[filename];
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      } catch (error) {
        console.warn('ÔÜá´©Å Could not update metadata file');
      }
    }
    
    console.log(`Ô£à Restored: ${filename} -> ${path.relative(PHOTOS_DIR, finalRestorePath)} (to original folder: ${originalFolder || 'fallback'})`);
    
    res.json({
      success: true,
      message: `Foto "${originalName}" wurde in "${path.basename(targetFolder)}" wiederhergestellt`,
      restoredTo: path.relative(PHOTOS_DIR, finalRestorePath),
      originalFolder: originalFolder || 'fallback'
    });
  } catch (error) {
    console.error('ÔØî Error restoring photo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Wiederherstellen: ' + error.message
    });
  }
});

// Kompletten Papierkorb leeren (alle Fotos endg├╝ltig l├Âschen)
app.delete('/api/trash', (req, res) => {
  try {
    console.log('­ƒùæ´©Å DELETE /api/trash called - Emptying entire trash');
    
    if (!fs.existsSync(TRASH_DIR)) {
      return res.json({
        success: true,
        message: 'Papierkorb ist bereits leer',
        deletedCount: 0
      });
    }
    
    const allFiles = fs.readdirSync(TRASH_DIR);
    const imageFiles = allFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    
    let deletedCount = 0;
    let errorCount = 0;
    
    imageFiles.forEach(file => {
      try {
        const filepath = path.join(TRASH_DIR, file);
        fs.unlinkSync(filepath);
        deletedCount++;
        console.log(`Ô£à Permanently deleted: ${file}`);
      } catch (deleteError) {
        console.error(`ÔØî Error deleting ${file}:`, deleteError);
        errorCount++;
      }
    });
    
    // Metadaten-Datei ebenfalls l├Âschen/zur├╝cksetzen
    const metadataPath = path.join(TRASH_DIR, '.metadata.json');
    if (fs.existsSync(metadataPath)) {
      try {
        fs.unlinkSync(metadataPath);
        console.log('Ô£à Metadata file removed');
      } catch (metaError) {
        console.warn('ÔÜá´©Å Could not remove metadata file:', metaError);
      }
    }
    
    console.log(`­ƒùæ´©Å Trash emptied: ${deletedCount} deleted, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: `Papierkorb geleert: ${deletedCount} Fotos endg├╝ltig gel├Âscht`,
      deletedCount: deletedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('ÔØî Error emptying trash:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Leeren des Papierkorbs: ' + error.message
    });
  }
});

// ===== AUTH ROUTES =====

// Login-Route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Benutzername und Passwort erforderlich'
    });
  }
  
  const result = await login(username, password);
  
  if (result.success) {
    // Token in Session und Cookie speichern
    req.session.token = result.token;
    req.session.user = result.user;
    
    res.cookie('authToken', result.token, {
      httpOnly: true,
      secure: false, // In Produktion auf true setzen
      maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    });
    
    res.json({
      success: true,
      message: 'Erfolgreich angemeldet',
      user: result.user,
      token: result.token
    });
  } else {
    res.status(401).json(result);
  }
});

// Logout-Route
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('ÔØî Session destroy error:', err);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abmelden'
      });
    }
    
    res.clearCookie('authToken');
    res.json({
      success: true,
      message: 'Erfolgreich abgemeldet'
    });
  });
});

// Auth-Status pr├╝fen
app.get('/api/auth/status', (req, res) => {
  const status = getAuthStatus(req);
  res.json(status);
});

// Passwort ├ñndern
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const username = req.user.username;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Altes und neues Passwort erforderlich'
    });
  }
  
  const result = await changePassword(username, oldPassword, newPassword);
  res.json(result);
});

// Gesch├╝tzte Admin-Routen - Authentifizierung erforderlich
app.use('/api/admin', requireAuth);

// Branding-Routen (gesch├╝tzt)
app.use('/api/admin/branding', brandingRoutes);

// Server starten
app.listen(PORT, () => {
  console.log();
  console.log('­ƒÜÇ Photobooth Backend (Raspberry Pi) gestartet!');
  console.log(`­ƒôí Server l├ñuft auf: http://192.168.8.204:${PORT}`);
  console.log(`­ƒôü Fotos-Verzeichnis: ${PHOTOS_DIR}`);
  console.log(`­ƒùæ´©Å Papierkorb-Verzeichnis: ${TRASH_DIR}`);
  console.log(`­ƒÄ¿ Branding-Verzeichnis: ${BRANDING_DIR}`);
  console.log();
  
  // Verzeichnis-Status anzeigen
  const photosExist = fs.existsSync(PHOTOS_DIR);
  const trashExist = fs.existsSync(TRASH_DIR);
  const brandingExist = fs.existsSync(BRANDING_DIR);
  
  let photosCount = 0;
  let trashCount = 0;
  
  if (photosExist) {
    try {
      const allPhotos = getAllPhotosFromFolders();
      photosCount = allPhotos.length;
    } catch (error) {
      console.error('Error counting photos:', error);
    }
  }
  
  if (trashExist) {
    try {
      const trashFiles = fs.readdirSync(TRASH_DIR).filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));
      trashCount = trashFiles.length;
    } catch (error) {
      console.error('Error counting trash:', error);
    }
  }
  
  console.log('­ƒôè Verzeichnis-Status:');
  console.log(`   ­ƒôü PHOTOS_DIR exists: ${photosExist}`);
  console.log(`   ­ƒùæ´©Å TRASH_DIR exists: ${trashExist}`);
  console.log(`   ­ƒÄ¿ BRANDING_DIR exists: ${brandingExist}`);
  console.log(`   ­ƒôè Fotos im Verzeichnis: ${photosCount}`);
  console.log(`   ­ƒùæ´©Å Fotos im Papierkorb: ${trashCount}`);
  console.log();
  console.log('­ƒöº Raspberry Pi Hardware:');
  console.log('   ­ƒô© Kamera: gphoto2 (Hardware)');
  console.log('   ´┐¢ GPIO: Pin 17 Button (Hardware)');
  console.log('   ­ƒû╝´©Å Fotos: Funktional');
  console.log('   ­ƒùæ´©Å Papierkorb: Funktional');
  console.log();
  console.log('­ƒôÂ WLAN-Konfiguration:');
  console.log('   ­ƒîÉ 5GHz SSID: "Photobooth 5"');
  console.log('   ­ƒîÉ 2.4GHz SSID: "Photobooth 2.4"');
  console.log('   ­ƒöÉ Passwort: "Photobooth"');
  console.log('   ­ƒîì Router IP: 192.168.8.1');
  console.log();
  console.log('­ƒîÉ Test die API:');
  console.log(`   curl http://192.168.8.204:${PORT}/api/status`);
  console.log(`   curl http://192.168.8.204:${PORT}/api/photos`);
  console.log(`   curl http://192.168.8.204:${PORT}/api/trash`);
  console.log(`   curl -X DELETE http://192.168.8.204:${PORT}/api/photos`);
  console.log();
  console.log('Ô£¿ Frontend erreichbar auf: http://192.168.8.204:5173');
  console.log('Ô£¿ Admin Panel: http://192.168.8.204:5173/admin');
  console.log('Ô£¿ Papierkorb: http://192.168.8.204:5173/trash');
  console.log();
});

// === EINZELNE FOTO/ORDNER PAPIERKORB APIs ===

// Einzelnes Foto in den Papierkorb verschieben
app.post('/api/photos/:filename/trash', (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`­ƒùæ´©Å POST /api/photos/${filename}/trash called`);
    
    // Suche das Foto in allen Ordnern
    let sourceFile = null;
    let sourcePath = null;
    
    // Pr├╝fe alle Unterordner in PHOTOS_DIR
    const findPhotoInFolders = (dir) => {
      const folders = fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => path.join(dir, dirent.name));
      
      for (const folder of folders) {
        const photoPath = path.join(folder, filename);
        if (fs.existsSync(photoPath)) {
          return photoPath;
        }
      }
      return null;
    };
    
    sourcePath = findPhotoInFolders(PHOTOS_DIR);
    
    if (!sourcePath) {
      return res.status(404).json({
        success: false,
        message: `Foto nicht gefunden: ${filename}`
      });
    }
    
    // Ziel im Papierkorb
    const targetPath = path.join(TRASH_DIR, filename);
    
    // Wenn bereits im Papierkorb, Dateiname ├ñndern
    let finalTargetPath = targetPath;
    let counter = 1;
    while (fs.existsSync(finalTargetPath)) {
      const ext = path.extname(filename);
      const basename = path.basename(filename, ext);
      finalTargetPath = path.join(TRASH_DIR, `${basename}_${counter}${ext}`);
      counter++;
    }
    
    // Urspr├╝nglichen Ordner ermitteln
    const originalFolder = path.basename(path.dirname(sourcePath));
    
    // Foto verschieben
    fs.renameSync(sourcePath, finalTargetPath);
    
    // Metadaten f├╝r Wiederherstellung speichern
    const metadataPath = path.join(TRASH_DIR, '.metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (error) {
        console.warn('ÔÜá´©Å Could not read metadata file, creating new one');
        metadata = {};
      }
    }
    
    // Metadaten f├╝r dieses Foto hinzuf├╝gen - verwende den tats├ñchlichen Dateinamen im Papierkorb als Key
    const trashFilename = path.basename(finalTargetPath);
    metadata[trashFilename] = {
      originalName: filename,
      originalFolder: originalFolder,
      deletedAt: new Date().toISOString()
    };
    
    // Falls der Dateiname ge├ñndert wurde, erstelle auch einen Eintrag f├╝r den urspr├╝nglichen Namen
    // Das hilft bei der Suche w├ñhrend der Wiederherstellung
    if (trashFilename !== filename) {
      metadata[filename] = {
        originalName: filename,
        originalFolder: originalFolder,
        deletedAt: new Date().toISOString(),
        actualTrashName: trashFilename // Verweis auf den tats├ñchlichen Namen im Papierkorb
      };
    }
    
    // Metadaten speichern
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`Ô£à Photo moved to trash: ${filename} -> ${path.basename(finalTargetPath)} (from ${originalFolder})`);
    
    // Pr├╝fe und l├Âsche leere Ordner
    cleanupEmptyFolders();

    res.json({
      success: true,
      message: `Foto "${filename}" in den Papierkorb verschoben`,
      originalName: filename,
      trashName: path.basename(finalTargetPath),
      originalFolder: originalFolder
    });
  } catch (error) {
    console.error(`ÔØî Error moving photo ${req.params.filename} to trash:`, error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Verschieben ins Papierkorb: ' + error.message
    });
  }
});

// Alle Fotos eines Ordners in den Papierkorb verschieben
app.post('/api/folders/:folderName/trash', (req, res) => {
  try {
    const { folderName } = req.params;
    console.log(`­ƒùæ´©Å POST /api/folders/${folderName}/trash called`);
    
    const folderPath = path.join(PHOTOS_DIR, folderName);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({
        success: false,
        message: `Ordner nicht gefunden: ${folderName}`
      });
    }
    
    // Alle Fotos im Ordner finden
    const allFiles = fs.readdirSync(folderPath);
    const photoFiles = allFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    });
    
    if (photoFiles.length === 0) {
      return res.json({
        success: true,
        message: `Ordner "${folderName}" ist bereits leer`,
        movedCount: 0
      });
    }
    
    let movedCount = 0;
    let errorCount = 0;
    const movedFiles = [];
    
    // Metadaten laden/erstellen
    const metadataPath = path.join(TRASH_DIR, '.metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (error) {
        console.warn('ÔÜá´©Å Could not read metadata file, creating new one');
        metadata = {};
      }
    }
    
    // Jedes Foto in den Papierkorb verschieben
    photoFiles.forEach(file => {
      try {
        const sourcePath = path.join(folderPath, file);
        let targetPath = path.join(TRASH_DIR, file);
        
        // Wenn bereits im Papierkorb, Dateiname ├ñndern
        let counter = 1;
        while (fs.existsSync(targetPath)) {
          const ext = path.extname(file);
          const basename = path.basename(file, ext);
          targetPath = path.join(TRASH_DIR, `${basename}_${counter}${ext}`);
          counter++;
        }
        
        fs.renameSync(sourcePath, targetPath);
        
        // Metadaten f├╝r dieses Foto hinzuf├╝gen
        metadata[path.basename(targetPath)] = {
          originalName: file,
          originalFolder: folderName,
          deletedAt: new Date().toISOString()
        };
        
        movedFiles.push({
          original: file,
          trash: path.basename(targetPath)
        });
        movedCount++;
        console.log(`Ô£à Photo moved to trash: ${file} -> ${path.basename(targetPath)} (from ${folderName})`);
      } catch (moveError) {
        console.error(`ÔØî Error moving ${file} to trash:`, moveError);
        errorCount++;
      }
    });
    
    // Metadaten speichern
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Ordner l├Âschen wenn er jetzt leer ist
    try {
      const remainingFiles = fs.readdirSync(folderPath);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(folderPath);
        console.log(`­ƒôü Empty folder removed: ${folderName}`);
      }
    } catch (removeError) {
      console.log(`ÔÜá´©Å Could not remove empty folder ${folderName}:`, removeError.message);
    }
    
    console.log(`­ƒùæ´©Å Folder content moved to trash: ${movedCount} photos moved, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: `${movedCount} Fotos aus "${folderName}" in den Papierkorb verschoben`,
      movedCount: movedCount,
      errors: errorCount,
      movedFiles: movedFiles
    });
  } catch (error) {
    console.error(`ÔØî Error moving folder ${req.params.folderName} to trash:`, error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Verschieben des Ordner-Inhalts: ' + error.message
    });
  }
});

// Bulk Gallery Page - Mobile-optimierte Seite f├╝r mehrere Fotos
app.get('/bulk-gallery', (req, res) => {
  try {
    const bulkGalleryPath = path.join(__dirname, 'bulk-gallery.html');
    res.sendFile(bulkGalleryPath);
  } catch (error) {
    console.error('ÔØî Error serving bulk gallery page:', error);
    res.status(500).send('Fehler beim Laden der Bulk-Galerie-Seite');
  }
});

// Mobile Logo Upload Page - Mobile-optimierte Seite f├╝r Logo-Upload
app.get('/mobile-logo-upload', (req, res) => {
  try {
    const mobileLogoUploadPath = path.join(__dirname, 'mobile-logo-upload.html');
    res.sendFile(mobileLogoUploadPath);
  } catch (error) {
    console.error('ÔØî Error serving mobile logo upload page:', error);
    res.status(500).send('Fehler beim Laden der mobilen Logo-Upload-Seite');
  }
});

// === WIFI STATUS API (f├╝r Smart Share V2) ===

// WiFi-Status abfragen (Raspberry Pi mit echten WLAN-Daten)
app.get('/api/wifi-status', async (req, res) => {
  try {
    console.log('­ƒôÂ GET /api/wifi-status called');
    
    let wifiStatus = {
      success: true,
      connected: false,
      clientIP: '192.168.8.204', // Raspberry Pi IP
      wifiConfig: {
        enabled: true,
        ssid: 'Photobooth 5', // Standard 5GHz SSID
        ssid24: 'Photobooth 2.4', // 2.4GHz SSID
        hasPassword: true,
        password: 'Photobooth'
      }
    };

    try {
      // Pr├╝fe WLAN-Verbindung ├╝ber iwconfig
      const { stdout } = await execAsync('iwconfig wlan0');
      if (stdout.includes('ESSID:')) {
        wifiStatus.connected = true;
        console.log('­ƒôÂ WiFi connected');
      }
    } catch (error) {
      console.warn('ÔÜá´©Å Could not check WiFi status:', error.message);
    }
    
    res.json(wifiStatus);
  } catch (error) {
    console.error('ÔØî Error getting wifi status:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des WLAN-Status: ' + error.message
    });
  }
});

// === SMART SHARE API ===

// Smart Share V1 (Original)
app.get('/api/smart-share', async (req, res) => {
  try {
    // Get filename from query parameter and decode it
    const encodedFilename = req.query.photo;
    if (!encodedFilename) {
      return res.status(400).json({
        success: false,
        message: 'Photo parameter is required'
      });
    }
    
    const filename = decodeURIComponent(encodedFilename);
    console.log('­ƒöù Smart Share request for:', filename);
    
    // Pr├╝fe ob das Foto existiert
    const allPhotos = getAllPhotosFromFolders();
    const photo = allPhotos.find(p => 
      p.filename === path.basename(filename) || 
      `${p.folder}/${p.filename}` === filename
    );
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht gefunden'
      });
    }
    
    // Einfache Share-URL generieren
    const shareUrl = `http://192.168.8.204:3001/photos/${photo.folder}/${photo.filename}`;
    
    // QR-Code f├╝r das Foto generieren
    const qrCode = await QRCode.toDataURL(shareUrl);
    
    res.json({
      success: true,
      photoId: filename,
      shareUrl: shareUrl,
      qrCode: qrCode,
      instructions: 'Scannen Sie den QR-Code um das Foto zu ├Âffnen'
    });
  } catch (error) {
    console.error('ÔØî Error in smart-share:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Share-Links: ' + error.message
    });
  }
});

// Smart Share V2 (Erweitert)
app.get('/api/smart-share-v2', async (req, res) => {
  try {
    // Get filename from query parameter and decode it
    const encodedFilename = req.query.photo;
    if (!encodedFilename) {
      return res.status(400).json({
        success: false,
        message: 'Photo parameter is required'
      });
    }
    
    const filename = decodeURIComponent(encodedFilename);
    const mode = req.query.mode || 'auto';
    console.log('­ƒöù Smart Share V2 request for:', filename, 'mode:', mode);
    
    // Pr├╝fe ob das Foto existiert
    const allPhotos = getAllPhotosFromFolders();
    const photo = allPhotos.find(p => 
      p.filename === path.basename(filename) || 
      `${p.folder}/${p.filename}` === filename
    );
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht gefunden'
      });
    }
    
    // Foto-URL
    const shareUrl = `http://192.168.8.204:3001/photos/${photo.folder}/${photo.filename}`;
    
    // Raspberry Pi WLAN-Konfiguration
    const wifiConfig = {
      enabled: true,
      ssid: 'Photobooth 5',
      ssid24: 'Photobooth 2.4',
      hasPassword: true,
      password: 'Photobooth'
    };
    
    let result = {
      success: true,
      photoId: filename,
      shareUrl: shareUrl,
      instructions: 'Foto erfolgreich geteilt',
      wifiConfig: wifiConfig
    };
    
    // QR-Codes je nach Modus generieren
    if (mode === 'wifi' || mode === 'auto') {
      const wifiQrData = `WIFI:T:WPA;S:${wifiConfig.ssid};P:${wifiConfig.password || 'Photobooth'};H:false;;`;
      result.wifiQrCode = await QRCode.toDataURL(wifiQrData);
    }
    
    if (mode === 'photo' || mode === 'auto') {
      result.photoQrCode = await QRCode.toDataURL(shareUrl);
    }
    
    res.json(result);
  } catch (error) {
    console.error('ÔØî Error in smart-share-v2:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Share-Links: ' + error.message
    });
  }
});

// Bulk Smart Share V2 - Mehrere Fotos gleichzeitig teilen
app.get('/api/bulk-smart-share', async (req, res) => {
  try {
    console.log('­ƒô▒ Bulk Smart Share V2 request');
    
    // Get photo IDs from query parameter
    const photosParam = req.query.photos;
    const mode = req.query.mode || 'auto'; // 'wifi', 'gallery', 'auto'
    
    if (!photosParam) {
      return res.status(400).json({
        success: false,
        message: 'Parameter "photos" ist erforderlich (comma-separated photo IDs)'
      });
    }
    
    // Parse photo IDs
    const photoIds = photosParam.split(',').map(id => decodeURIComponent(id.trim()));
    console.log(`­ƒô© Bulk share request for ${photoIds.length} photos:`, photoIds);
    
    // Validate and find all photos
    const allPhotos = getAllPhotosFromFolders();
    const foundPhotos = [];
    const notFoundPhotos = [];
    
    for (const photoId of photoIds) {
      const photo = allPhotos.find(p => 
        p.filename === path.basename(photoId) || 
        `${p.folder}/${p.filename}` === photoId ||
        photoId.includes('/') && photoId.endsWith(`/${p.filename}`)
      );
      
      if (photo) {
        foundPhotos.push(photo);
      } else {
        notFoundPhotos.push(photoId);
      }
    }
    
    if (foundPhotos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Keine der angegebenen Fotos gefunden',
        notFound: notFoundPhotos
      });
    }
    
    if (notFoundPhotos.length > 0) {
      console.warn(`ÔÜá´©Å Some photos not found:`, notFoundPhotos);
    }
    
    // WLAN-Konfiguration laden
    let wifiConfig;
    try {
      if (fs.existsSync(BRANDING_FILE)) {
        const brandingData = fs.readFileSync(BRANDING_FILE, 'utf8');
        const branding = JSON.parse(brandingData);
        wifiConfig = branding.wifiConfig || {
          enabled: true,
          ssid: 'Photobooth 5',
          ssid24: 'Photobooth 2.4',
          hasPassword: true,
          password: 'Photobooth'
        };
      } else {
        console.warn('ÔÜá´©Å Branding file does not exist, using defaults');
        wifiConfig = {
          enabled: true,
          ssid: 'Photobooth 5',
          ssid24: 'Photobooth 2.4',
          hasPassword: true,
          password: 'Photobooth'
        };
      }
    } catch (error) {
      console.warn('ÔÜá´©Å Could not load WLAN config, using defaults');
      wifiConfig = {
        enabled: true,
        ssid: 'Photobooth 5',
        ssid24: 'Photobooth 2.4',
        hasPassword: true,
        password: 'Photobooth'
      };
    }
    
    // Generiere Bulk-Galerie-URL mit allen Foto-IDs
    const photoParams = foundPhotos.map(p => encodeURIComponent(`${p.folder}/${p.filename}`)).join(',');
    const shareUrl = `http://192.168.8.204:3001/bulk-gallery?photos=${photoParams}`;
    
    // Erstelle Thumbnail URLs f├╝r die Fotos
    const photosWithThumbnails = foundPhotos.map(photo => ({
      id: `${photo.folder}/${photo.filename}`,
      filename: photo.filename,
      thumbnailUrl: `http://192.168.8.204:3001/api/photos/${encodeURIComponent(photo.folder)}/${encodeURIComponent(photo.filename)}/thumbnail?size=100`
    }));
    
    console.log(`­ƒô▒ Generated bulk share URL: ${shareUrl}`);
    
    const result = {
      success: true,
      totalPhotos: foundPhotos.length,
      shareUrl: shareUrl,
      instructions: `${foundPhotos.length} Fotos erfolgreich geteilt`,
      wifiConfig: wifiConfig,
      photos: photosWithThumbnails
    };
    
    // F├╝ge Warnungen hinzu falls einige Fotos nicht gefunden wurden
    if (notFoundPhotos.length > 0) {
      result.warnings = `${notFoundPhotos.length} Fotos nicht gefunden: ${notFoundPhotos.join(', ')}`;
    }
    
    // QR-Codes je nach Modus generieren
    if (mode === 'wifi' || mode === 'auto') {
      const wifiQrData = `WIFI:T:WPA;S:${wifiConfig.ssid};P:${wifiConfig.password || 'Photobooth'};H:false;;${shareUrl}`;
      result.wifiQrCode = await QRCode.toDataURL(wifiQrData);
    }
    
    if (mode === 'gallery' || mode === 'auto') {
      result.galleryQrCode = await QRCode.toDataURL(shareUrl);
    }
    
    console.log(`Ô£à Bulk Smart Share generated for ${foundPhotos.length} photos`);
    res.json(result);
  } catch (error) {
    console.error('ÔØî Error in bulk-smart-share:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Bulk-Share-Links: ' + error.message
    });
  }
});

// QR-Code f├╝r einzelnes Foto (verwendet von PhotoViewPage)
app.get('/api/photos/:filename/qr', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    console.log('­ƒô▒ QR request for photo:', filename);
    
    // Pr├╝fe ob das Foto existiert
    const allPhotos = getAllPhotosFromFolders();
    const photo = allPhotos.find(p => 
      p.filename === path.basename(filename) || 
      `${p.folder}/${p.filename}` === filename
    );
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht gefunden'
      });
    }
    
    // QR-Code f├╝r das Foto generieren
    const shareUrl = `http://192.168.8.204:3001/photos/${photo.folder}/${photo.filename}`;
    const qrCode = await QRCode.toDataURL(shareUrl);
    
    res.json({
      success: true,
      qr_code: qrCode,
      qr: qrCode,
      url: shareUrl
    });
  } catch (error) {
    console.error('ÔØî Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des QR-Codes: ' + error.message
    });
  }
});

// === BRANDING API ===

// Branding-Text setzen
app.post('/api/branding/text', express.json(), (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text fehlt oder ung├╝ltig' });
    }
    // Branding-Text in branding.json speichern
    const brandingPath = path.join(BRANDING_DIR, 'branding.json');
    fs.writeFileSync(brandingPath, JSON.stringify({ type: 'text', text: text.trim() }, null, 2), 'utf-8');
    res.json({ success: true, message: 'Branding-Text gespeichert', text: text.trim() });
  } catch (error) {
    console.error('ÔØî Error saving branding text:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Speichern des Branding-Texts: ' + error.message });
  }
});

// Branding laden
app.get('/api/branding', (req, res) => {
  try {
    console.log('­ƒÄ¿ GET /api/branding called');
    // 1. Pr├╝fe auf branding.json (Text-Branding)
    const brandingPath = path.join(BRANDING_DIR, 'branding.json');
    if (fs.existsSync(brandingPath)) {
      const brandingData = JSON.parse(fs.readFileSync(brandingPath, 'utf-8'));
      if (brandingData && brandingData.type === 'text' && brandingData.text) {
        return res.json({ success: true, type: 'text', text: brandingData.text });
      }
    }
    // 2. Pr├╝fe auf Logo-Dateien
    if (fs.existsSync(BRANDING_DIR)) {
      const files = fs.readdirSync(BRANDING_DIR);
      const logoFiles = files.filter(file => /\.(png|jpg|jpeg|svg)$/i.test(file));
      if (logoFiles.length > 0) {
        const logoFile = logoFiles[0];
        const logoUrl = `/api/branding/logo/${logoFile}`;
        return res.json({ success: true, type: 'logo', logo: logoUrl, logoFile });
      }
    }
    // 3. Fallback: Standard-Text
    res.json({ success: true, type: 'text', text: 'Photobooth' });
  } catch (error) {
    console.error('ÔØî Error loading branding:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Brandings: ' + error.message,
      fallback: { type: 'text', text: 'Photobooth' }
    });
  }
});

// Logo-Datei servieren
app.get('/api/branding/logo/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(BRANDING_DIR, filename);
    
    console.log(`­ƒÄ¿ Serving logo: ${filename}`);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Logo nicht gefunden'
      });
    }
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('ÔØî Error serving logo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Logos: ' + error.message
    });
  }
});

// Branding uploaden
app.post('/api/branding/upload', upload.single('logo'), (req, res) => {
  try {
    console.log('­ƒÄ¿ POST /api/branding/upload called');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Keine Datei hochgeladen'
      });
    }
    
    // SCHRITT 1: Alle bestehenden Logo-Dateien l├Âschen
    console.log('­ƒùæ´©Å L├Âsche bestehende Logo-Dateien...');
    try {
      const files = fs.readdirSync(BRANDING_DIR);
      const logoFiles = files.filter(file => /\.(png|jpg|jpeg|svg)$/i.test(file));
      logoFiles.forEach(file => {
        const filepath = path.join(BRANDING_DIR, file);
        fs.unlinkSync(filepath);
        console.log(`Ô£à Alte Logo-Datei gel├Âscht: ${file}`);
      });
    } catch (cleanupError) {
      console.warn('ÔÜá´©Å Fehler beim L├Âschen alter Logo-Dateien:', cleanupError);
    }
    
    // SCHRITT 2: Neues Logo mit festem Namen speichern
    const fileExtension = path.extname(req.file.originalname);
    const filename = `logo${fileExtension}`; // Fester Name ohne Timestamp
    const targetPath = path.join(BRANDING_DIR, filename);
    
    fs.renameSync(req.file.path, targetPath);
    
    // SCHRITT 3: Text-Branding deaktivieren (Logo hat Vorrang)
    const brandingPath = path.join(BRANDING_DIR, 'branding.json');
    if (fs.existsSync(brandingPath)) {
      const currentBranding = JSON.parse(fs.readFileSync(brandingPath, 'utf-8'));
      if (currentBranding && currentBranding.type === 'text') {
        // Speichere Text als Backup f├╝r sp├ñteren Restore
        const backupPath = path.join(BRANDING_DIR, 'branding-text-backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(currentBranding, null, 2), 'utf-8');
        console.log('­ƒÆ¥ Text-Branding als Backup gespeichert');
      }
      // Entferne aktives Text-Branding damit Logo Vorrang hat
      fs.unlinkSync(brandingPath);
      console.log('­ƒöä Text-Branding deaktiviert, Logo hat jetzt Vorrang');
    }
    
    console.log(`Ô£à Logo erfolgreich ersetzt: ${filename}`);
    
    res.json({
      success: true,
      message: 'Logo erfolgreich hochgeladen',
      filename: filename,
      url: `/api/branding/logo/${filename}`
    });
  } catch (error) {
    console.error('ÔØî Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Hochladen des Logos: ' + error.message
    });
  }
});

// Logo l├Âschen
app.delete('/api/branding/logo', (req, res) => {
  try {
    console.log('­ƒùæ´©Å DELETE /api/branding/logo called');
    
    if (!fs.existsSync(BRANDING_DIR)) {
      return res.json({
        success: true,
        message: 'Kein Logo vorhanden'
      });
    }
    
    const files = fs.readdirSync(BRANDING_DIR);
    const logoFiles = files.filter(file => 
      /\.(png|jpg|jpeg|svg)$/i.test(file)
    );
    
    let deletedCount = 0;
    logoFiles.forEach(file => {
      try {
        const filepath = path.join(BRANDING_DIR, file);
        fs.unlinkSync(filepath);
        deletedCount++;
        console.log(`Ô£à Logo gel├Âscht: ${file}`);
      } catch (err) {
        console.error(`ÔØî Fehler beim L├Âschen von ${file}:`, err);
      }
    });
    
    // INTUITIV: Logo-L├Âschung reaktiviert automatisch Text-Branding
    // Stelle Text-Branding aus Backup wieder her
    const backupPath = path.join(BRANDING_DIR, 'branding-text-backup.json');
    if (fs.existsSync(backupPath)) {
      try {
        const backupBranding = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        const brandingPath = path.join(BRANDING_DIR, 'branding.json');
        fs.writeFileSync(brandingPath, JSON.stringify(backupBranding, null, 2), 'utf-8');
        fs.unlinkSync(backupPath); // Backup l├Âschen nach Wiederherstellung
        console.log('­ƒöä Text-Branding aus Backup wiederhergestellt');
      } catch (backupError) {
        console.error('ÔØî Fehler beim Wiederherstellen des Text-Branding-Backups:', backupError);
      }
    }
    
    res.json({
      success: true,
      message: deletedCount > 0 ? `${deletedCount} Logo(s) gel├Âscht` : 'Kein Logo gefunden',
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('ÔØî Error deleting logo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim L├Âschen des Logos: ' + error.message
    });
  }
});

// Branding-Timestamp f├╝r Live-Updates
app.get('/api/branding/timestamp', (req, res) => {
  try {
    console.log('­ƒòÉ GET /api/branding/timestamp called');
    
    let latestTimestamp = 0;
    
    // Pr├╝fe branding.json
    const brandingPath = path.join(BRANDING_DIR, 'branding.json');
    if (fs.existsSync(brandingPath)) {
      const stats = fs.statSync(brandingPath);
      latestTimestamp = Math.max(latestTimestamp, stats.mtime.getTime());
    }
    
    // Pr├╝fe auf Logo-Dateien
    if (fs.existsSync(BRANDING_DIR)) {
      const files = fs.readdirSync(BRANDING_DIR);
      const logoFiles = files.filter(file => /\.(png|jpg|jpeg|svg)$/i.test(file));
      logoFiles.forEach(file => {
        const filepath = path.join(BRANDING_DIR, file);
        const stats = fs.statSync(filepath);
        latestTimestamp = Math.max(latestTimestamp, stats.mtime.getTime());
      });
    }
    
    res.json({
      success: true,
      timestamp: latestTimestamp,
      iso: new Date(latestTimestamp).toISOString()
    });
  } catch (error) {
    console.error('ÔØî Error getting branding timestamp:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des Branding-Timestamps: ' + error.message
    });
  }
});

// ├ûffentliche QR-Code-Route f├╝r Logo-Upload (ohne Authentifizierung f├╝r img-Elemente)
app.get('/api/logo-upload-qr', async (req, res) => {
  try {
    console.log('­ƒô▒ GET /api/logo-upload-qr called');
    const url = 'http://192.168.8.204:3001/mobile-logo-upload';
    const qr = await QRCode.toDataURL(url);
    const img = Buffer.from(qr.split(',')[1], 'base64');
    res.set('Content-Type', 'image/png').send(img);
  } catch (error) {
    console.error('ÔØî Error generating logo upload QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des QR-Codes: ' + error.message
    });
  }
});
