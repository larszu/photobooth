// Einfache WLAN QR-Code Route
const QRCode = require('qrcode');

// WLAN QR-Code Route
app.get('/api/wifi-qr', async (req, res) => {
  try {
    console.log('GET /api/wifi-qr called');
    // WLAN-Konfiguration für "Photobooth 5" Netzwerk
    const wifiQrData = `WIFI:T:WPA;S:Photobooth 5;P:Photobooth;H:false;;`;
    const qr = await QRCode.toDataURL(wifiQrData);
    const img = Buffer.from(qr.split(',')[1], 'base64');
    res.set('Content-Type', 'image/png').send(img);
  } catch (error) {
    console.error('Error generating WiFi QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Generieren des WLAN QR-Codes: ' + error.message
    });
  }
});
