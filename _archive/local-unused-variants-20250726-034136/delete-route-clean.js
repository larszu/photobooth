// === CLEAN DELETE ALL PHOTOS ROUTE ===

// Alle Fotos in den Papierkorb verschieben
app.delete('/api/photos', (req, res) => {
  try {
    console.log('🗑️ === DELETE /api/photos called - Moving all photos to trash ===');
    console.log('📁 PHOTOS_DIR:', PHOTOS_DIR);
    console.log('📁 TRASH_DIR:', TRASH_DIR);
    
    // Stelle sicher, dass der Papierkorb-Ordner existiert
    if (!fs.existsSync(TRASH_DIR)) {
      console.log('📁 Creating trash directory...');
      fs.mkdirSync(TRASH_DIR, { recursive: true });
      console.log('📁 Trash directory created:', TRASH_DIR);
    } else {
      console.log('📁 Trash directory already exists');
    }
    
    let movedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Hole alle Fotos aus allen Tagesordnern
    const allPhotos = getAllPhotosFromFolders();
    console.log(`📁 Found ${allPhotos.length} photos in date folders`);
    
    // Zusätzlich: Prüfe auch auf direkte Fotos im Hauptverzeichnis (Legacy)
    if (fs.existsSync(PHOTOS_DIR)) {
      const directFiles = fs.readdirSync(PHOTOS_DIR);
      const directPhotos = directFiles.filter(file => {
        const filepath = path.join(PHOTOS_DIR, file);
        const stats = fs.statSync(filepath);
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file);
        return stats.isFile() && isImage && file !== 'papierkorb';
      });
      
      console.log(`📁 Found ${directPhotos.length} direct photos in main directory`);
      
      // Füge direkte Fotos zur Liste hinzu
      directPhotos.forEach(file => {
        const filepath = path.join(PHOTOS_DIR, file);
        const stats = fs.statSync(filepath);
        allPhotos.push({
          filename: file,
          fullPath: filepath,
          folder: null, // Kein Ordner = direktes Foto
          size: stats.size,
          created: stats.ctime.toISOString()
        });
      });
    }
    
    console.log(`📁 Total photos to move: ${allPhotos.length}`);
    
    allPhotos.forEach((photo, index) => {
      console.log(`📁 [${index + 1}/${allPhotos.length}] Processing photo: ${photo.filename}`);
      console.log(`📁 Full path: ${photo.fullPath}`);
      console.log(`📁 From folder: ${photo.folder || 'main directory'}`);
      
      if (!fs.existsSync(photo.fullPath)) {
        console.log(`❌ Photo does not exist: ${photo.fullPath}`);
        skippedCount++;
        return;
      }
      
      try {
        // Datei in den Papierkorb verschieben
        const trashPath = path.join(TRASH_DIR, photo.filename);
        console.log(`📁 Target trash path: ${trashPath}`);
        
        // Falls eine Datei mit dem gleichen Namen bereits im Papierkorb existiert,
        // füge Timestamp hinzu
        let finalTrashPath = trashPath;
        if (fs.existsSync(trashPath)) {
          const ext = path.extname(photo.filename);
          const basename = path.basename(photo.filename, ext);
          const timestamp = Date.now();
          finalTrashPath = path.join(TRASH_DIR, `${basename}_${timestamp}${ext}`);
          console.log(`📁 File exists in trash, using new name: ${path.basename(finalTrashPath)}`);
        }
        
        console.log(`📁 Moving file:`);
        console.log(`📁   FROM: ${photo.fullPath}`);
        console.log(`📁   TO:   ${finalTrashPath}`);
        
        fs.renameSync(photo.fullPath, finalTrashPath);
        movedCount++;
        
        console.log(`✅ Successfully moved: ${photo.filename} -> ${path.basename(finalTrashPath)}`);
        
      } catch (moveError) {
        console.error(`❌ Error moving photo ${photo.filename} to trash:`, moveError);
        errorCount++;
      }
    });
    
    console.log('🗑️ === OPERATION COMPLETE ===');
    console.log(`📊 Total processed: ${movedCount + errorCount + skippedCount}`);
    console.log(`✅ Successfully moved: ${movedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️ Skipped: ${skippedCount}`);
    
    // Prüfe finalen Status
    if (fs.existsSync(TRASH_DIR)) {
      const trashFiles = fs.readdirSync(TRASH_DIR);
      console.log(`📁 Files now in trash: ${trashFiles.length}`);
    }
    
    // Prüfe verbleibende Fotos in allen Ordnern
    const remainingPhotos = getAllPhotosFromFolders();
    console.log(`📁 Photos remaining in date folders: ${remainingPhotos.length}`);
    
    res.json({
      success: true,
      message: `${movedCount} Fotos in den Papierkorb verschoben`,
      details: {
        moved: movedCount,
        errors: errorCount,
        skipped: skippedCount
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
