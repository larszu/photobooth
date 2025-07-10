// Windows-kompatible Version des Servers (ohne GPIO/gphoto2)
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Performance-Optimierung
app.set('x-powered-by', false);
app.use(express.json({ limit: '10mb' }));

// Konfiguration
const PHOTOS_DIR = path.join(__dirname, '../photos');
const BRANDING_DIR = path.join(__dirname, '../branding');
const TRASH_DIR = path.join(PHOTOS_DIR, 'papierkorb');

// Middleware
app.use(cors());
app.use(express.json());

// Multer für Datei-Uploads
const upload = multer({ dest: 'uploads/' });

// Stelle sicher, dass die Verzeichnisse existieren
console.log('📁 Checking and creating directories...');
[PHOTOS_DIR, BRANDING_DIR, TRASH_DIR].forEach(dir => {
  console.log(`📁 Checking directory: ${dir}`);
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Directory created: ${fs.existsSync(dir) ? 'SUCCESS' : 'FAILED'}`);
  } else {
    console.log(`📁 Directory exists: ${dir}`);
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
    console.log(`📁 Creating today's folder: ${folderName}`);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📁 Folder created successfully: ${folderPath}`);
  }
  
  return {
    folderName,
    folderPath
  };
}

// Hole alle Tagesordner (für Galerie)
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
    return isDirectory && isDateFolder && isNotTrash;
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
      console.error(`❌ Error reading folder ${folderName}:`, error);
    }
  });
  
  // Nach Erstellungsdatum sortieren (neueste zuerst)
  return allPhotos.sort((a, b) => new Date(b.created) - new Date(a.created));
}

// === STATIC FILE SERVING ===

// Fotos statisch bereitstellen
app.use('/photos', express.static(PHOTOS_DIR));

// Branding-Dateien statisch bereitstellen
app.use('/branding', express.static(BRANDING_DIR));

// Mock GPIO (für Windows-Tests)
const mockGpio = {
  setupLed: () => console.log('🔆 Mock: LED Setup'),
  blinkLed: () => console.log('💡 Mock: LED Blink'),
  turnOnLed: () => console.log('🟢 Mock: LED On'),
  turnOffLed: () => console.log('🔴 Mock: LED Off')
};

// Mock Camera Funktionen
const mockCamera = {
  takePhoto: async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `photo-${timestamp}.jpg`;
    
    // Erstelle Tagesordner falls nötig
    const { folderName, folderPath } = createTodayFolder();
    
    // Erstelle ein Demo-Foto mit aktuellem Timestamp im Tagesordner
    const filepath = path.join(folderPath, filename);
    const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#333">
        Demo Photo: ${filename}
      </text>
      <text x="400" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">
        Generated: ${new Date().toLocaleString()}
      </text>
    </svg>`;
    fs.writeFileSync(filepath, svg);
    
    console.log('📸 Mock: Photo taken -', filename, 'in folder:', folderName);
    return {
      success: true,
      filename: filename,
      filepath: filepath,
      folder: folderName,
      relativePath: `${folderName}/${filename}`
    };
  },
  
  getPreview: async () => {
    console.log('👀 Mock: Camera preview');
    return { success: true, preview: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA...' };
  }
};

// === PHOTO API ROUTES ===

// Foto aufnehmen
app.post('/api/photo/take', async (req, res) => {
  console.log('📸 Photo take request received');
  
  try {
    mockGpio.blinkLed();
    const result = await mockCamera.takePhoto();
    
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
    console.error('❌ Error taking photo:', error);
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
    
    // Für Kompatibilität mit der Frontend-Galerie: erstelle Pfade für die Anzeige
    const photoFilenames = allPhotos.map(photo => `${photo.folder}/${photo.filename}`);

    console.log(`📊 Found ${allPhotos.length} photos in ${getAllPhotoFolders().length} folders`);
    
    res.json({
      success: true,
      photos: photoFilenames, // Für die Galerie (mit Ordnerpfad)
      photosDetailed: allPhotos, // Für andere Zwecke
      folders: getAllPhotoFolders(), // Liste der verfügbaren Ordner
      count: allPhotos.length
    });
  } catch (error) {
    console.error('❌ Error listing photos:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Auflisten der Fotos: ' + error.message
    });
  }
});

// Server Status
app.get('/api/status', (req, res) => {
  console.log('📊 Status request received');
  
  // Sammle Verzeichnisinformationen
  let photosExist = fs.existsSync(PHOTOS_DIR);
  let trashExist = fs.existsSync(TRASH_DIR);
  
  let photosFiles = [];
  let trashFiles = [];
  
  if (photosExist) {
    try {
      // Zähle alle Fotos in allen Ordnern
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
    message: 'Server läuft',
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

// Thumbnail für einzelnes Foto generieren
app.get('/api/photos/:filename/thumbnail', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const size = parseInt(req.query.size) || 300; // Standard 300px Breite
    
    console.log(`📷 Thumbnail request: ${filename} (${size}px)`);
    
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
    console.error('❌ Error generating thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des Thumbnails: ' + error.message
    });
  }
});

// Trash Thumbnail für einzelnes Foto generieren
app.get('/api/trash/:filename/thumbnail', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const size = parseInt(req.query.size) || 300;
    const filepath = path.join(TRASH_DIR, filename);
    
    console.log(`🗑️📷 Trash thumbnail request: ${filename} (${size}px)`);
    
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
    console.error('❌ Error generating trash thumbnail:', error);
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
    console.log('🗑️ GET /api/trash called');
    
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
    console.error('❌ Error reading trash:', error);
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
    console.error('❌ Error serving trash image:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Bildes: ' + error.message
    });
  }
});

// Alle Fotos in den Papierkorb verschieben
app.delete('/api/photos', (req, res) => {
  try {
    console.log('🗑️ === DELETE /api/photos called - Moving all photos to trash ===');
    
    // Stelle sicher, dass der Papierkorb-Ordner existiert
    if (!fs.existsSync(TRASH_DIR)) {
      fs.mkdirSync(TRASH_DIR, { recursive: true });
    }
    
    let movedCount = 0;
    let errorCount = 0;
    
    // Hole alle Fotos aus allen Tagesordnern
    const allPhotos = getAllPhotosFromFolders();
    console.log(`📁 Found ${allPhotos.length} photos to move to trash`);
    
    allPhotos.forEach((photo) => {
      try {
        // Datei in den Papierkorb verschieben
        const trashPath = path.join(TRASH_DIR, photo.filename);
        
        // Falls eine Datei mit dem gleichen Namen bereits im Papierkorb existiert,
        // füge Timestamp hinzu
        let finalTrashPath = trashPath;
        if (fs.existsSync(trashPath)) {
          const ext = path.extname(photo.filename);
          const basename = path.basename(photo.filename, ext);
          const timestamp = Date.now();
          finalTrashPath = path.join(TRASH_DIR, `${basename}_${timestamp}${ext}`);
        }
        
        fs.renameSync(photo.fullPath, finalTrashPath);
        movedCount++;
        console.log(`✅ Moved: ${photo.filename} -> trash`);
        
      } catch (moveError) {
        console.error(`❌ Error moving photo ${photo.filename}:`, moveError);
        errorCount++;
      }
    });
    
    console.log(`🗑️ Operation complete: ${movedCount} moved, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: `${movedCount} Fotos in den Papierkorb verschoben`,
      details: {
        moved: movedCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('❌ Error moving photos to trash:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Verschieben der Fotos in den Papierkorb: ' + error.message
    });
  }
});

// Einzelnes Foto aus dem Papierkorb endgültig löschen
app.delete('/api/trash/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(TRASH_DIR, filename);
    
    console.log(`🗑️ DELETE /api/trash/${filename} called`);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht im Papierkorb gefunden'
      });
    }
    
    // Datei endgültig löschen
    fs.unlinkSync(filepath);
    console.log(`✅ Permanently deleted: ${filename}`);
    
    res.json({
      success: true,
      message: `Foto "${filename}" wurde endgültig gelöscht`
    });
  } catch (error) {
    console.error('❌ Error permanently deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim endgültigen Löschen: ' + error.message
    });
  }
});

// Einzelnes Foto aus dem Papierkorb wiederherstellen
app.post('/api/trash/:filename/restore', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const trashPath = path.join(TRASH_DIR, filename);
    
    console.log(`🔄 POST /api/trash/${filename}/restore called`);
    
    if (!fs.existsSync(trashPath)) {
      return res.status(404).json({
        success: false,
        message: 'Foto nicht im Papierkorb gefunden'
      });
    }
    
    // Bestimme den ursprünglichen Speicherort
    // Falls das Foto einen Datum-Ordner hatte, stelle es in den heutigen Ordner wieder her
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const todayFolderName = `${today.slice(0, 4)}${today.slice(4, 6)}${today.slice(6)}_Photobooth`;
    const todayFolder = path.join(PHOTOS_DIR, todayFolderName);
    
    // Erstelle den heutigen Ordner falls er nicht existiert
    if (!fs.existsSync(todayFolder)) {
      fs.mkdirSync(todayFolder, { recursive: true });
    }
    
    const restorePath = path.join(todayFolder, filename);
    
    // Falls eine Datei mit dem gleichen Namen bereits existiert, füge Timestamp hinzu
    let finalRestorePath = restorePath;
    if (fs.existsSync(restorePath)) {
      const ext = path.extname(filename);
      const basename = path.basename(filename, ext);
      const timestamp = Date.now();
      finalRestorePath = path.join(todayFolder, `${basename}_restored_${timestamp}${ext}`);
    }
    
    // Datei aus dem Papierkorb zurück verschieben
    fs.renameSync(trashPath, finalRestorePath);
    console.log(`✅ Restored: ${filename} -> ${path.relative(PHOTOS_DIR, finalRestorePath)}`);
    
    res.json({
      success: true,
      message: `Foto "${filename}" wurde wiederhergestellt`,
      restoredTo: path.relative(PHOTOS_DIR, finalRestorePath)
    });
  } catch (error) {
    console.error('❌ Error restoring photo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Wiederherstellen: ' + error.message
    });
  }
});

// Kompletten Papierkorb leeren (alle Fotos endgültig löschen)
app.delete('/api/trash', (req, res) => {
  try {
    console.log('🗑️ DELETE /api/trash called - Emptying entire trash');
    
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
        console.log(`✅ Permanently deleted: ${file}`);
      } catch (deleteError) {
        console.error(`❌ Error deleting ${file}:`, deleteError);
        errorCount++;
      }
    });
    
    console.log(`🗑️ Trash emptied: ${deletedCount} deleted, ${errorCount} errors`);
    
    res.json({
      success: true,
      message: `Papierkorb geleert: ${deletedCount} Fotos endgültig gelöscht`,
      deletedCount: deletedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('❌ Error emptying trash:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Leeren des Papierkorbs: ' + error.message
    });
  }
});

// === WIFI STATUS API (für Smart Share V2) ===

// WiFi-Status abfragen (Mock für Windows-Entwicklung)
app.get('/api/wifi-status', (req, res) => {
  try {
    console.log('📶 GET /api/wifi-status called');
    
    // Mock WiFi-Status für Windows-Entwicklung
    // In der Raspberry Pi Version würde hier echte WLAN-Daten abgefragt
    const wifiStatus = {
      success: true,
      connected: true, // Simuliere dass WLAN verbunden ist
      clientIP: '192.168.1.100', // Mock IP
      wifiConfig: {
        enabled: true,
        ssid: 'Photobooth-Hotspot',
        hasPassword: false
      }
    };
    
    res.json(wifiStatus);
  } catch (error) {
    console.error('❌ Error getting wifi status:', error);
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
    console.log('🔗 Smart Share request for:', filename);
    
    // Prüfe ob das Foto existiert
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
    const shareUrl = `http://localhost:3001/photos/${photo.folder}/${photo.filename}`;
    
    // QR-Code für das Foto generieren
    const qrCode = await QRCode.toDataURL(shareUrl);
    
    res.json({
      success: true,
      photoId: filename,
      shareUrl: shareUrl,
      qrCode: qrCode,
      instructions: 'Scannen Sie den QR-Code um das Foto zu öffnen'
    });
  } catch (error) {
    console.error('❌ Error in smart-share:', error);
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
    console.log('🔗 Smart Share V2 request for:', filename, 'mode:', mode);
    
    // Prüfe ob das Foto existiert
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
    const shareUrl = `http://localhost:3001/photos/${photo.folder}/${photo.filename}`;
    
    // Mock WLAN-Konfiguration
    const wifiConfig = {
      enabled: true,
      ssid: 'Photobooth-WLAN',
      hasPassword: false
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
      const wifiQrData = `WIFI:T:WPA;S:${wifiConfig.ssid};P:${wifiConfig.hasPassword ? 'password123' : ''};H:false;;`;
      result.wifiQrCode = await QRCode.toDataURL(wifiQrData);
    }
    
    if (mode === 'photo' || mode === 'auto') {
      result.photoQrCode = await QRCode.toDataURL(shareUrl);
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error in smart-share-v2:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Share-Links: ' + error.message
    });
  }
});

// QR-Code für einzelnes Foto (verwendet von PhotoViewPage)
app.get('/api/photos/:filename/qr', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    console.log('📱 QR request for photo:', filename);
    
    // Prüfe ob das Foto existiert
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
    
    // QR-Code für das Foto generieren
    const shareUrl = `http://localhost:3001/photos/${photo.folder}/${photo.filename}`;
    const qrCode = await QRCode.toDataURL(shareUrl);
    
    res.json({
      success: true,
      qr_code: qrCode,
      qr: qrCode,
      url: shareUrl
    });
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
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
      return res.status(400).json({ success: false, message: 'Text fehlt oder ungültig' });
    }
    // Branding-Text in branding.json speichern
    const brandingPath = path.join(BRANDING_DIR, 'branding.json');
    fs.writeFileSync(brandingPath, JSON.stringify({ type: 'text', text: text.trim() }, null, 2), 'utf-8');
    res.json({ success: true, message: 'Branding-Text gespeichert', text: text.trim() });
  } catch (error) {
    console.error('❌ Error saving branding text:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Speichern des Branding-Texts: ' + error.message });
  }
});

// Branding laden
app.get('/api/branding', (req, res) => {
  try {
    console.log('🎨 GET /api/branding called');
    // 1. Prüfe auf branding.json (Text-Branding)
    const brandingPath = path.join(BRANDING_DIR, 'branding.json');
    if (fs.existsSync(brandingPath)) {
      const brandingData = JSON.parse(fs.readFileSync(brandingPath, 'utf-8'));
      if (brandingData && brandingData.type === 'text' && brandingData.text) {
        return res.json({ success: true, type: 'text', text: brandingData.text });
      }
    }
    // 2. Prüfe auf Logo-Dateien
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
    console.error('❌ Error loading branding:', error);
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
    
    console.log(`🎨 Serving logo: ${filename}`);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Logo nicht gefunden'
      });
    }
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('❌ Error serving logo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Logos: ' + error.message
    });
  }
});

// Branding uploaden
app.post('/api/branding/upload', upload.single('logo'), (req, res) => {
  try {
    console.log('🎨 POST /api/branding/upload called');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Keine Datei hochgeladen'
      });
    }
    
    // Datei ins Branding-Verzeichnis verschieben
    const filename = `logo-${Date.now()}${path.extname(req.file.originalname)}`;
    const targetPath = path.join(BRANDING_DIR, filename);
    
    fs.renameSync(req.file.path, targetPath);
    
    // INTUITIV: Logo-Upload deaktiviert automatisch Text-Branding
    // Speichere aktuellen Text-Branding als Backup und deaktiviere es
    const brandingPath = path.join(BRANDING_DIR, 'branding.json');
    if (fs.existsSync(brandingPath)) {
      const currentBranding = JSON.parse(fs.readFileSync(brandingPath, 'utf-8'));
      if (currentBranding && currentBranding.type === 'text') {
        // Speichere Text als Backup für späteren Restore
        const backupPath = path.join(BRANDING_DIR, 'branding-text-backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(currentBranding, null, 2), 'utf-8');
        console.log('💾 Text-Branding als Backup gespeichert');
      }
      // Entferne aktives Text-Branding damit Logo Vorrang hat
      fs.unlinkSync(brandingPath);
      console.log('🔄 Text-Branding deaktiviert, Logo hat jetzt Vorrang');
    }
    
    console.log(`✅ Logo hochgeladen: ${filename}`);
    
    res.json({
      success: true,
      message: 'Logo erfolgreich hochgeladen',
      filename: filename,
      url: `/api/branding/logo/${filename}`
    });
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Hochladen des Logos: ' + error.message
    });
  }
});

// Logo löschen
app.delete('/api/branding/logo', (req, res) => {
  try {
    console.log('🗑️ DELETE /api/branding/logo called');
    
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
        console.log(`✅ Logo gelöscht: ${file}`);
      } catch (err) {
        console.error(`❌ Fehler beim Löschen von ${file}:`, err);
      }
    });
    
    // INTUITIV: Logo-Löschung reaktiviert automatisch Text-Branding
    // Stelle Text-Branding aus Backup wieder her
    const backupPath = path.join(BRANDING_DIR, 'branding-text-backup.json');
    if (fs.existsSync(backupPath)) {
      try {
        const backupBranding = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        const brandingPath = path.join(BRANDING_DIR, 'branding.json');
        fs.writeFileSync(brandingPath, JSON.stringify(backupBranding, null, 2), 'utf-8');
        fs.unlinkSync(backupPath); // Backup löschen nach Wiederherstellung
        console.log('🔄 Text-Branding aus Backup wiederhergestellt');
      } catch (backupError) {
        console.error('❌ Fehler beim Wiederherstellen des Text-Branding-Backups:', backupError);
      }
    }
    
    res.json({
      success: true,
      message: deletedCount > 0 ? `${deletedCount} Logo(s) gelöscht` : 'Kein Logo gefunden',
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting logo:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Logos: ' + error.message
    });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log();
  console.log('🚀 Photobooth Backend (Windows Demo) gestartet!');
  console.log(`📡 Server läuft auf: http://localhost:${PORT}`);
  console.log(`📁 Fotos-Verzeichnis: ${PHOTOS_DIR}`);
  console.log(`🗑️ Papierkorb-Verzeichnis: ${TRASH_DIR}`);
  console.log(`🎨 Branding-Verzeichnis: ${BRANDING_DIR}`);
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
  
  console.log('📊 Verzeichnis-Status:');
  console.log(`   📁 PHOTOS_DIR exists: ${photosExist}`);
  console.log(`   🗑️ TRASH_DIR exists: ${trashExist}`);
  console.log(`   🎨 BRANDING_DIR exists: ${brandingExist}`);
  console.log(`   📊 Fotos im Verzeichnis: ${photosCount}`);
  console.log(`   🗑️ Fotos im Papierkorb: ${trashCount}`);
  console.log();
  console.log('🔧 Demo-Modus aktiv:');
  console.log('   📸 Kamera: Mock (simuliert)');
  console.log('   💡 GPIO: Mock (simuliert)');
  console.log('   🖼️ Fotos: Funktional');
  console.log('   🗑️ Papierkorb: Funktional');
  console.log();
  console.log('🌐 Test die API:');
  console.log(`   curl http://localhost:${PORT}/api/status`);
  console.log(`   curl http://localhost:${PORT}/api/photos`);
  console.log(`   curl http://localhost:${PORT}/api/trash`);
  console.log(`   curl -X DELETE http://localhost:${PORT}/api/photos`);
  console.log();
  console.log('✨ Frontend startet auf: http://localhost:5173');
  console.log('✨ Admin Panel: http://localhost:5173/admin');
  console.log('✨ Papierkorb: http://localhost:5173/trash');
  console.log();
});
