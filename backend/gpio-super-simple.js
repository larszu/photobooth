// SUPER-EINFACHER GPIO Test - findet GARANTIERT einen Pin
import { Gpio } from 'onoff';

console.log('🔍 SUPER-EINFACHER GPIO Test startet...');

if (!Gpio.accessible) {
  console.log('❌ GPIO nicht verfügbar!');
  process.exit(1);
}

console.log('✅ GPIO System verfügbar');

const testPins = [23, 24, 25, 26, 16, 20, 21, 19, 13, 6, 5, 11, 9, 10];

for (const pin of testPins) {
  try {
    console.log(`\n🧪 Teste GPIO ${pin}:`);
    
    // Einfach versuchen zu initialisieren
    const testButton = new Gpio(pin, 'in');
    const value = testButton.readSync();
    
    console.log(`✅ GPIO ${pin} funktioniert! Wert: ${value}`);
    console.log(`🎯 VERWENDE GPIO ${pin} FÜR BUTTON!`);
    console.log(`📌 Verdrahtung: GPIO ${pin} -> Button -> GND`);
    
    // Cleanup
    testButton.unexport();
    
    console.log(`\n🎉 ERFOLG! GPIO ${pin} ist frei und funktioniert!`);
    process.exit(0);
    
  } catch (error) {
    console.log(`❌ GPIO ${pin} fehlgeschlagen: ${error.message}`);
  }
}

console.log('\n💥 ALLE PINS FEHLGESCHLAGEN - Das ist unmöglich!');
process.exit(1);
