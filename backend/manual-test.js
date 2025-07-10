import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test script für Papierkorb-Funktionalität
console.log('🔍 PAPIERKORB MANUAL TEST');
console.log('========================');

const PHOTOS_DIR = path.join(__dirname, '../photos');
const TRASH_DIR = path.join(PHOTOS_DIR, 'papierkorb');

console.log('\n📁 DIRECTORY STRUCTURE:');
console.log('PHOTOS_DIR:', PHOTOS_DIR);
console.log('TRASH_DIR:', TRASH_DIR);
console.log('PHOTOS_DIR exists:', fs.existsSync(PHOTOS_DIR));
console.log('TRASH_DIR exists:', fs.existsSync(TRASH_DIR));

if (fs.existsSync(PHOTOS_DIR)) {
  const photoFiles = fs.readdirSync(PHOTOS_DIR);
  console.log('\n📁 FILES IN PHOTOS DIR:');
  photoFiles.forEach(file => {
    const fullPath = path.join(PHOTOS_DIR, file);
    const stats = fs.statSync(fullPath);
    console.log(`  ${file} (${stats.isFile() ? 'FILE' : 'DIR'}, ${stats.size} bytes)`);
  });
}

if (fs.existsSync(TRASH_DIR)) {
  const trashFiles = fs.readdirSync(TRASH_DIR);
  console.log('\n🗑️ FILES IN TRASH DIR:');
  trashFiles.forEach(file => {
    const fullPath = path.join(TRASH_DIR, file);
    const stats = fs.statSync(fullPath);
    const ext = path.extname(file).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    console.log(`  ${file} (${stats.isFile() ? 'FILE' : 'DIR'}, ${stats.size} bytes, ext: ${ext}, isImage: ${isImage})`);
  });
} else {
  console.log('\n🗑️ TRASH DIR DOES NOT EXIST');
}

console.log('\n🌐 TESTING API CALLS:');
console.log('Run these commands to test:');
console.log('curl http://localhost:3001/api/status');
console.log('curl http://localhost:3001/api/trash');
console.log('curl -X DELETE http://localhost:3001/api/photos');

console.log('\n✅ Manual test complete');
