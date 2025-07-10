// Test-Script für Papierkorb-Funktionalität
const fs = require('fs');
const path = require('path');

const PHOTOS_DIR = path.join(__dirname, '../photos');
const TRASH_DIR = path.join(PHOTOS_DIR, 'papierkorb');

console.log('🔍 Testing Papierkorb functionality...');
console.log('📁 PHOTOS_DIR:', PHOTOS_DIR);
console.log('📁 TRASH_DIR:', TRASH_DIR);
console.log('📁 PHOTOS_DIR exists:', fs.existsSync(PHOTOS_DIR));
console.log('📁 TRASH_DIR exists:', fs.existsSync(TRASH_DIR));

console.log('\n📁 Files in PHOTOS_DIR:');
if (fs.existsSync(PHOTOS_DIR)) {
  const files = fs.readdirSync(PHOTOS_DIR);
  files.forEach(file => {
    const filepath = path.join(PHOTOS_DIR, file);
    const isFile = fs.statSync(filepath).isFile();
    console.log(`  ${file} (${isFile ? 'file' : 'directory'})`);
  });
} else {
  console.log('  PHOTOS_DIR does not exist');
}

console.log('\n📁 Creating TRASH_DIR if not exists...');
if (!fs.existsSync(TRASH_DIR)) {
  try {
    fs.mkdirSync(TRASH_DIR, { recursive: true });
    console.log('✅ TRASH_DIR created successfully');
  } catch (error) {
    console.error('❌ Error creating TRASH_DIR:', error);
  }
} else {
  console.log('✅ TRASH_DIR already exists');
}

console.log('\n📁 Final state:');
console.log('📁 PHOTOS_DIR exists:', fs.existsSync(PHOTOS_DIR));
console.log('📁 TRASH_DIR exists:', fs.existsSync(TRASH_DIR));

if (fs.existsSync(TRASH_DIR)) {
  console.log('\n📁 Files in TRASH_DIR:');
  const trashFiles = fs.readdirSync(TRASH_DIR);
  if (trashFiles.length === 0) {
    console.log('  (empty)');
  } else {
    trashFiles.forEach(file => {
      console.log(`  ${file}`);
    });
  }
}
