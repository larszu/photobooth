// Debug-Script für Papierkorb-Metadaten
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Papierkorb Metadata...\n');

const PHOTOS_DIR = path.join(__dirname, 'photos');
const TRASH_DIR = path.join(PHOTOS_DIR, 'papierkorb');
const METADATA_PATH = path.join(TRASH_DIR, '.metadata.json');

// 1. Prüfe ob Papierkorb existiert
console.log('1. 📁 Checking papierkorb directory...');
console.log('TRASH_DIR:', TRASH_DIR);
console.log('Exists:', fs.existsSync(TRASH_DIR));

if (fs.existsSync(TRASH_DIR)) {
    // 2. Liste Dateien im Papierkorb
    console.log('\n2. 🗑️ Files in papierkorb:');
    const trashFiles = fs.readdirSync(TRASH_DIR);
    trashFiles.forEach(file => {
        const filePath = path.join(TRASH_DIR, file);
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${stats.isFile() ? 'file' : 'directory'}, ${stats.size} bytes)`);
    });
    
    // 3. Prüfe Metadaten-Datei
    console.log('\n3. 📋 Checking metadata file...');
    console.log('METADATA_PATH:', METADATA_PATH);
    console.log('Exists:', fs.existsSync(METADATA_PATH));
    
    if (fs.existsSync(METADATA_PATH)) {
        try {
            const metadataContent = fs.readFileSync(METADATA_PATH, 'utf8');
            console.log('Raw content length:', metadataContent.length);
            console.log('Raw content preview:', metadataContent.substring(0, 200));
            
            const metadata = JSON.parse(metadataContent);
            console.log('Parsed metadata entries:', Object.keys(metadata).length);
            
            console.log('\n4. 📋 Metadata entries:');
            Object.entries(metadata).forEach(([filename, data], index) => {
                console.log(`  ${index + 1}. "${filename}":`, {
                    originalName: data.originalName,
                    originalFolder: data.originalFolder,
                    deletedAt: data.deletedAt
                });
            });
            
            // 5. Prüfe Konsistenz
            console.log('\n5. 🔍 Consistency check:');
            const trashPhotoFiles = trashFiles.filter(f => f !== '.metadata.json' && /\.(jpg|jpeg|png|svg)$/i.test(f));
            console.log(`Photos in trash: ${trashPhotoFiles.length}`);
            console.log(`Metadata entries: ${Object.keys(metadata).length}`);
            
            // Finde Fotos ohne Metadaten
            const photosWithoutMetadata = trashPhotoFiles.filter(photo => !metadata[photo]);
            if (photosWithoutMetadata.length > 0) {
                console.log('⚠️ Photos without metadata:');
                photosWithoutMetadata.forEach(photo => console.log(`  - ${photo}`));
            }
            
            // Finde Metadaten ohne Fotos
            const metadataWithoutPhotos = Object.keys(metadata).filter(filename => !trashPhotoFiles.includes(filename));
            if (metadataWithoutPhotos.length > 0) {
                console.log('⚠️ Metadata without photos:');
                metadataWithoutPhotos.forEach(filename => console.log(`  - ${filename}`));
            }
            
        } catch (error) {
            console.error('❌ Error reading/parsing metadata:', error.message);
        }
    } else {
        console.log('⚠️ No metadata file found');
    }
} else {
    console.log('⚠️ Papierkorb directory does not exist');
}

// 6. Prüfe ursprüngliche Ordner
console.log('\n6. 📁 Checking original photo folders...');
if (fs.existsSync(PHOTOS_DIR)) {
    const folders = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'papierkorb')
        .map(dirent => dirent.name);
    
    console.log('Available photo folders:');
    folders.forEach(folder => {
        const folderPath = path.join(PHOTOS_DIR, folder);
        const files = fs.readdirSync(folderPath);
        const photos = files.filter(file => /\.(jpg|jpeg|png|svg)$/i.test(file));
        console.log(`  - ${folder} (${photos.length} photos)`);
    });
}

console.log('\n✅ Debug completed!');
