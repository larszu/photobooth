import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import express from 'express';

const router = express.Router();
const BRANDING_DIR = path.join(process.cwd(), 'branding');
const LOGO_PATH = path.join(BRANDING_DIR, 'logo.png');
const TEXT_PATH = path.join(BRANDING_DIR, 'branding.txt');
const CONFIG_PATH = path.join(BRANDING_DIR, 'branding.json');

if (!fs.existsSync(BRANDING_DIR)) fs.mkdirSync(BRANDING_DIR);

// POST /api/admin/branding/logo
router.post('/logo', (req, res) => {
  try {
    if (!req.files || !req.files.logo) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const logo = req.files.logo;
    
    // Validiere Dateityp
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(logo.mimetype)) {
      return res.status(400).json({ success: false, error: 'Nur Bilddateien erlaubt (JPEG, PNG, GIF, WebP)' });
    }
    
    // Validiere Dateigröße (5MB max)
    if (logo.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Datei zu groß (max. 5MB)' });
    }
    
    logo.mv(LOGO_PATH, err => {
      if (err) {
        console.error('Logo upload error:', err);
        return res.status(500).json({ success: false, error: 'Upload failed' });
      }
      
      saveBrandingConfig({ type: 'logo' });
      res.json({ success: true, message: 'Logo erfolgreich gespeichert' });
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/admin/branding/text
router.post('/text', express.json(), (req, res) => {
  const { text } = req.body;
  fs.writeFileSync(TEXT_PATH, text || '');
  saveBrandingConfig({ type: 'text', text });
  res.json({ success: true });
});

// GET /api/admin/branding/logo-qr
router.get('/logo-qr', async (req, res) => {
  const url = 'http://localhost:3001/mobile-logo-upload';
  const qr = await QRCode.toDataURL(url);
  const img = Buffer.from(qr.split(',')[1], 'base64');
  res.set('Content-Type', 'image/png').send(img);
});

// GET /api/branding
router.get('/branding', (req, res) => {
  try {
    const config = loadBrandingConfig();
    let logo = null, text = '';
    
    if (fs.existsSync(LOGO_PATH)) {
      logo = '/branding/logo.png';
    }
    
    if (fs.existsSync(TEXT_PATH)) {
      text = fs.readFileSync(TEXT_PATH, 'utf8');
    }
    
    res.json({ 
      success: true,
      type: config.type || 'text',
      logo, 
      text: config.text || text
    });
  } catch (error) {
    console.error('Branding config error:', error);
    res.status(500).json({ success: false, error: 'Failed to load branding config' });
  }
});

// Serve logo file
router.get('/logo.png', (req, res) => {
  if (!fs.existsSync(LOGO_PATH)) return res.status(404).end();
  res.sendFile(LOGO_PATH);
});

function saveBrandingConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg));
}
function loadBrandingConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return { type: 'logo' };
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

export default router;
