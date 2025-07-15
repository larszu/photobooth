// Test-Script für Papierkorb Wiederherstellung
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001';

async function testTrashRestore() {
    console.log('🔄 Testing Trash Restore Functionality...\n');
    
    try {
        // 1. Papierkorb-Fotos abrufen
        console.log('1. 🗑️ Fetching trash photos...');
        const trashResponse = await fetch(`${API_BASE}/api/trash`);
        
        if (!trashResponse.ok) {
            throw new Error(`HTTP ${trashResponse.status}: ${trashResponse.statusText}`);
        }
        
        const trashData = await trashResponse.json();
        console.log('✅ Trash response received');
        console.log('Photos in trash:', trashData.photos?.length || 0);
        
        if (!trashData.photos || trashData.photos.length === 0) {
            console.log('⚠️ No photos in trash to test with');
            return;
        }
        
        // Erstes Foto für Test auswählen
        const testPhoto = trashData.photos[0];
        console.log(`\n2. 🎯 Selected test photo: ${testPhoto.filename}`);
        console.log('Photo details:', {
            filename: testPhoto.filename,
            size: testPhoto.size,
            created: testPhoto.created
        });
        
        // 2. Metadaten lokal prüfen
        console.log('\n3. 📋 Checking local metadata...');
        const metadataPath = path.join(__dirname, 'photos', 'papierkorb', '.metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            const photoMetadata = metadata[testPhoto.filename];
            
            if (photoMetadata) {
                console.log('✅ Metadata found for test photo:', {
                    originalName: photoMetadata.originalName,
                    originalFolder: photoMetadata.originalFolder,
                    deletedAt: photoMetadata.deletedAt
                });
            } else {
                console.log('❌ No metadata found for test photo!');
                console.log('Available metadata keys:', Object.keys(metadata));
            }
        } else {
            console.log('❌ No metadata file found!');
        }
        
        // 3. Foto wiederherstellen
        console.log(`\n4. 🔄 Restoring photo: ${testPhoto.filename}`);
        const restoreResponse = await fetch(`${API_BASE}/api/trash/${encodeURIComponent(testPhoto.filename)}/restore`, {
            method: 'POST'
        });
        
        console.log('Restore response status:', restoreResponse.status);
        
        if (!restoreResponse.ok) {
            const errorText = await restoreResponse.text();
            throw new Error(`HTTP ${restoreResponse.status}: ${errorText}`);
        }
        
        const restoreResult = await restoreResponse.json();
        console.log('✅ Restore successful:', restoreResult);
        
        // 4. Prüfen wo das Foto gelandet ist
        console.log('\n5. 📁 Checking where photo was restored...');
        if (restoreResult.restoredTo) {
            console.log('Restored to:', restoreResult.restoredTo);
            
            // Prüfe ob die Datei wirklich dort ist
            const restoredPath = path.join(__dirname, 'photos', restoreResult.restoredTo);
            if (fs.existsSync(restoredPath)) {
                console.log('✅ File exists at restored location');
            } else {
                console.log('❌ File NOT found at restored location!');
            }
        }
        
        // 5. Alle Ordner nach dem Foto durchsuchen
        console.log('\n6. 🔍 Searching all folders for restored photo...');
        const photosDir = path.join(__dirname, 'photos');
        const folders = fs.readdirSync(photosDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name !== 'papierkorb')
            .map(dirent => dirent.name);
        
        let foundIn = [];
        folders.forEach(folder => {
            const folderPath = path.join(photosDir, folder);
            const files = fs.readdirSync(folderPath);
            
            // Suche nach dem ursprünglichen Namen oder ähnlichen Namen
            const originalName = testPhoto.filename;
            const baseName = path.basename(originalName, path.extname(originalName));
            
            const matches = files.filter(file => 
                file === originalName || 
                file.includes(baseName) ||
                file.includes('restored')
            );
            
            if (matches.length > 0) {
                foundIn.push({ folder, files: matches });
            }
        });
        
        if (foundIn.length > 0) {
            console.log('✅ Photo found in:');
            foundIn.forEach(location => {
                console.log(`  - ${location.folder}: ${location.files.join(', ')}`);
            });
        } else {
            console.log('❌ Photo not found in any folder!');
        }
        
        console.log('\n✅ Test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Test ausführen
testTrashRestore();
