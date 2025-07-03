// admin.js
// Beispielmodul für Admin-Funktionen (WLAN-Settings, Fotoverwaltung)

// WLAN-Zugangsdaten ändern (Demo, auf Pi anpassen)
export async function setWifiCredentials(ssid, password) {
  // Hier HTTP-Request an Router oder Shell-Befehl einbauen
  // z.B. mit fetch oder child_process.exec
  return { success: true, message: 'WLAN-Daten gesetzt (Demo)' };
}

// Fotos löschen (einzeln oder alle)
import fs from 'fs';
import path from 'path';
const PHOTOS_DIR = path.join(process.cwd(), '../photos');

export function deletePhoto(filename) {
  const file = path.join(PHOTOS_DIR, filename);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return { success: true };
  }
  return { success: false, error: 'Nicht gefunden' };
}

export function deleteAllPhotos() {
  const files = fs.readdirSync(PHOTOS_DIR).filter(f => f.endsWith('.jpg'));
  files.forEach(f => fs.unlinkSync(path.join(PHOTOS_DIR, f)));
  return { success: true };
}
