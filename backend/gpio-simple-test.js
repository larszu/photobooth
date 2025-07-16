// Einfacher GPIO Test für Pin 22
import { Gpio } from 'onoff';

console.log('🔍 Teste GPIO 22 direkt...');

// Prüfe GPIO Verfügbarkeit
if (!Gpio.accessible) {
  console.log('❌ GPIO nicht verfügbar');
  process.exit(1);
}

try {
  // GPIO 22 als Input mit Pull-up
  const button = new Gpio(22, 'in', 'both');
  
  console.log('✅ GPIO 22 erfolgreich initialisiert');
  console.log('📌 Pin 22 konfiguriert als: Input mit beiden Flanken');
  
  // Sofortiger Status
  const initialState = button.readSync();
  console.log(`🔍 Aktueller Status: ${initialState} (0=LOW/gedrückt, 1=HIGH/nicht gedrückt)`);
  
  console.log('🎯 Drücke jetzt den Button...');
  console.log('📍 Hardware-Check: GPIO 22 (Pin 15) mit GND (Pin 14) verbinden');
  
  // Event Listener
  button.watch((err, value) => {
    if (err) {
      console.error('❌ GPIO Error:', err);
      return;
    }
    
    const timestamp = new Date().toISOString();
    console.log(`🔘 [${timestamp}] GPIO 22 geändert zu: ${value} ${value === 0 ? '(Button gedrückt!)' : '(Button losgelassen)'}`);
  });
  
  // Status-Monitor alle 2 Sekunden
  let counter = 0;
  const statusInterval = setInterval(() => {
    const currentState = button.readSync();
    counter++;
    console.log(`📊 Status-Check ${counter}: GPIO 22 = ${currentState}`);
    
    if (counter >= 30) { // 60 Sekunden
      console.log('⏰ Test beendet nach 60 Sekunden');
      button.unexport();
      process.exit(0);
    }
  }, 2000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Test abgebrochen');
    clearInterval(statusInterval);
    button.unexport();
    process.exit(0);
  });
  
} catch (error) {
  console.error('❌ GPIO Test fehlgeschlagen:', error.message);
  console.error('🔧 Mögliche Ursachen:');
  console.error('   1. Pin 22 bereits von anderem Prozess verwendet');
  console.error('   2. Unzureichende Berechtigung (sudo verwenden)');
  console.error('   3. Hardware-Problem');
  process.exit(1);
}
