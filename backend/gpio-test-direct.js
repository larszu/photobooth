// Direkter GPIO 27 Hardware-Test
import { Gpio } from 'onoff';

console.log('🔍 Direkter GPIO 27 Test...');

try {
  // GPIO 27 freigeben falls belegt
  try {
    const fs = await import('fs');
    await new Promise((resolve) => {
      fs.writeFile('/sys/class/gpio/unexport', '27', () => resolve());
    });
    console.log('GPIO 27 unexported');
  } catch (e) {
    // Ignoriere
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  // GPIO 27 als Input konfigurieren
  const button = new Gpio(27, 'in', 'both');
  
  console.log('✅ GPIO 27 erfolgreich initialisiert');
  console.log('📌 Hardware: GPIO 27 (Pin 13) mit GND verbinden');
  console.log('🔍 Aktueller Status:', button.readSync());
  
  // Event Listener für alle Änderungen
  button.watch((err, value) => {
    if (err) {
      console.error('❌ GPIO Error:', err);
      return;
    }
    
    console.log(`🔘 GPIO 27 Changed: ${value} (${value === 0 ? 'GEDRÜCKT' : 'LOSGELASSEN'})`);
  });
  
  console.log('👂 Listening für GPIO 27 Änderungen...');
  console.log('💡 Drücke Button (GPIO 27 zu GND) zum Testen');
  
  // Kontinuierlicher Status-Check
  setInterval(() => {
    const state = button.readSync();
    process.stdout.write(`\r📊 GPIO 27 Status: ${state} (${state === 0 ? 'KONTAKT' : 'KEIN KONTAKT'})    `);
  }, 1000);
  
} catch (error) {
  console.error('❌ GPIO Test fehlgeschlagen:', error.message);
}
