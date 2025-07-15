// Debug-Script für Gallery Delete Problem
console.log('🔍 Starting Gallery Delete Debug...\n');

// Browser Console Test
const testGalleryDeleteInBrowser = async () => {
    console.log('Testing Gallery Delete in Browser...');
    
    try {
        // 1. Alle Fotos abrufen (wie in GalleryPage)
        console.log('1. Fetching all photos...');
        const response = await fetch('http://localhost:3001/api/photos');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Photos data:', data);
        
        const photoArray = Array.isArray(data.photos) 
            ? data.photos.map((photo) => typeof photo === 'string' ? photo : photo.filename)
            : [];
            
        console.log('Photo array:', photoArray);
        
        if (photoArray.length === 0) {
            console.log('❌ No photos found!');
            return;
        }
        
        // 2. Erstes Foto zum Test auswählen
        const testPhoto = photoArray[0];
        console.log(`2. Testing with photo: ${testPhoto}`);
        
        // 3. Move to trash (wie in handleMoveToTrash)
        console.log(`3. Moving to trash: POST /api/photos/${encodeURIComponent(testPhoto)}/trash`);
        
        const deleteResponse = await fetch(`http://localhost:3001/api/photos/${encodeURIComponent(testPhoto)}/trash`, {
            method: 'POST'
        });
        
        console.log('Delete response status:', deleteResponse.status);
        console.log('Delete response ok:', deleteResponse.ok);
        
        if (!deleteResponse.ok) {
            const errorText = await deleteResponse.text();
            console.error('Delete error:', errorText);
            throw new Error(`Failed to move photo ${testPhoto}: ${errorText}`);
        }
        
        const deleteResult = await deleteResponse.json();
        console.log('✅ Delete successful:', deleteResult);
        
        // 4. Fotos nach Löschung neu laden
        console.log('4. Refreshing photos after delete...');
        const refreshResponse = await fetch('http://localhost:3001/api/photos');
        
        if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newPhotoArray = Array.isArray(refreshData.photos) 
                ? refreshData.photos.map((photo) => typeof photo === 'string' ? photo : photo.filename)
                : [];
            
            console.log('Photos after delete:', newPhotoArray.length, 'photos');
            console.log('Test photo still in list:', newPhotoArray.includes(testPhoto));
        }
        
        // 5. Papierkorb prüfen
        console.log('5. Checking trash...');
        const trashResponse = await fetch('http://localhost:3001/api/trash');
        
        if (trashResponse.ok) {
            const trashData = await trashResponse.json();
            console.log('Trash photos:', trashData.photos?.length || 0);
            
            const foundInTrash = trashData.photos?.some(p => 
                p.filename.includes(testPhoto.split('.')[0])
            );
            console.log('Test photo found in trash:', foundInTrash);
        }
        
        console.log('\n✅ Test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
};

// Führe Test aus
testGalleryDeleteInBrowser();

// Zusätzliche Browser-spezifische Debug-Funktionen
window.debugGalleryDelete = testGalleryDeleteInBrowser;

console.log('\n📋 Debug functions available:');
console.log('- window.debugGalleryDelete() - Run the delete test');
console.log('- Open Network tab to see API calls');
console.log('- Check Console for errors');
