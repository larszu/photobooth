  async initialize() {
    try {
      // Stoppe blockierende Services automatisch
      console.log('🔧 Freigabe der Kamera von blockierenden Services...');
      
      try {
        // Stoppe gvfs-gphoto2-volume-monitor (läuft oft automatisch)
        await execAsync('sudo pkill -f gvfs-gphoto2-volume-monitor || true');
        await execAsync('sudo systemctl stop gvfs-daemon 2>/dev/null || true');
        console.log('✅ Blockierende Services gestoppt');
      } catch (serviceError) {
        console.log('ℹ️ Service-Stop nicht nötig oder fehlgeschlagen (normal bei ersten Start)');
      }
      
      // Kurz warten damit Services vollständig stoppen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prüfe ob gphoto2 verfügbar ist
      await execAsync('which gphoto2');
      
      // Prüfe ob Kamera erkannt wird
      const { stdout } = await execAsync('gphoto2 --auto-detect');
      console.log('📷 Camera detection:', stdout);
      
      // Teste Kamera-Zugriff
      try {
        await execAsync('gphoto2 --get-config /main/status', { timeout: 5000 });
        console.log('✅ Camera access test successful');
        this.isInitialized = true;
      } catch (accessError) {
        console.warn('⚠️ Camera access test failed, aber trotzdem fortfahren:', accessError.message);
        this.isInitialized = false;
        return;
      }
      
      console.log('✅ Camera initialized successfully');
    } catch (error) {
      console.warn('⚠️ Camera initialization failed, using fallback mode:', error.message);
      this.isInitialized = false;
      return;
    }
  }
