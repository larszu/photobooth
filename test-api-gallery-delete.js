// Test-Script für Gallery Delete Funktionalität
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001';

async function testGalleryDelete() {
    console.log('🧪 Testing Gallery Delete Functionality...\n');
    
    try {
        // 1. Alle Fotos abrufen
        console.log('1. 📷 Fetching all photos...');
        const photosResponse = await fetch(`${API_BASE}/api/photos`);
        
        if (!photosResponse.ok) {
            throw new Error(`HTTP ${photosResponse.status}: ${photosResponse.statusText}`);
        }
        
        const photosData = await photosResponse.json();
        console.log('✅ Photos response:', photosData);
        
        // Extrahiere Foto-Namen
        const photoArray = Array.isArray(photosData.photos) 
            ? photosData.photos.map(photo => typeof photo === 'string' ? photo : photo.filename)
            : [];
            
        console.log(`📋 Found ${photoArray.length} photos:`, photoArray.slice(0, 3));
        
        if (photoArray.length === 0) {
            console.log('⚠️ No photos found to test with');
            return;
        }
        
        // 2. Erstes Foto in Papierkorb verschieben
        const testPhoto = photoArray[0];
        console.log(`\n2. 🗑️ Moving photo to trash: ${testPhoto}`);
        
        const deleteResponse = await fetch(`${API_BASE}/api/photos/${encodeURIComponent(testPhoto)}/trash`, {
            method: 'POST'
        });
        
        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            throw new Error(`HTTP ${deleteResponse.status}: ${errorText}`);
        }
        
        const deleteResult = await deleteResponse.json();
        console.log('✅ Delete response:', deleteResult);
        
        // 3. Papierkorb prüfen
        console.log('\n3. 🗑️ Checking trash...');
        const trashResponse = await fetch(`${API_BASE}/api/trash`);
        
        if (!trashResponse.ok) {
            throw new Error(`HTTP ${trashResponse.status}: ${trashResponse.statusText}`);
        }
        
        const trashData = await trashResponse.json();
        console.log('✅ Trash response:', trashData);
        
        // 4. Metadaten prüfen (lokal)
        console.log('\n4. 📋 Checking metadata...');
        const metadataPath = path.join(__dirname, 'photos', 'papierkorb', '.metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            console.log('✅ Metadata found:', metadata);
        } else {
            console.log('⚠️ No metadata file found');
        }
        
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // Zusätzliche Debug-Informationen
        console.log('\n🔍 Debug Information:');
        console.log('- API Base:', API_BASE);
        console.log('- Current working directory:', process.cwd());
        console.log('- Photos directory exists:', fs.existsSync(path.join(__dirname, 'photos')));
        console.log('- Papierkorb directory exists:', fs.existsSync(path.join(__dirname, 'photos', 'papierkorb')));
    }
}

// Test ausführen
testGalleryDelete();
