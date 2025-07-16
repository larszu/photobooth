// GPIO-Initialisierung als async-Funktion
async function initializeGpio() {
  try {
    console.log('🔧 Initializing GPIO...');
    // Erstmal GPIO exklusiv für Fotobox reservieren
    await gpio.reserveGpioForPhotobooth();
    // Dann GPIO initialisieren
    await gpio.setupGpio();
    // GPIO Button Event Handler - funktioniert immer und navigiert zur Photo-Seite
    await gpio.onButtonPress(async () => {
      console.log('🔘 GPIO Button pressed - navigating to photo page and taking photo...');
      // 1. Navigation zur Photo-Seite über WebSocket
      broadcastToClients({
        type: 'navigate',
        path: '/photo/new'
      });
      // 2. Kurz warten damit Navigation stattfindet
      await new Promise(resolve => setTimeout(resolve, 500));
      // 3. Foto machen
      try {
        const result = await camera.takePhoto();
        if (result.success) {
          console.log(`✅ GPIO Photo taken: ${result.filename}`);
          gpio.blinkLed(); // Feedback
          // 4. Frontend über neues Foto informieren
          broadcastToClients({
            type: 'photo-taken',
            filename: result.filename,
            success: true
          });
          // 5. Navigation zur Foto-Ansicht
          broadcastToClients({
            type: 'navigate',
            path: `/photo/${result.filename}`
          });
        } else {
          console.error('❌ GPIO Photo failed');
          broadcastToClients({
            type: 'photo-taken',
            success: false,
            error: 'Photo capture failed'
          });
        }
      } catch (error) {
        console.error('❌ GPIO Photo error:', error);
        broadcastToClients({
          type: 'photo-taken',
          success: false,
          error: error.message
        });
      }
    });
    console.log('✅ GPIO successfully initialized');
  } catch (error) {
    console.error('❌ GPIO initialization failed:', error.message);
    console.error('   Will continue without GPIO...');
  }
}

// GPIO initialisieren
initializeGpio();
