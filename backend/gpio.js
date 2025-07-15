// GPIO Modul für Raspberry Pi
// Verwendet onoff für GPIO-Steuerung

import { Gpio } from 'onoff';

// GPIO Pin-Konfiguration - Angepasst für deine Hardware
const BUTTON_PIN = 17;  // Button für Foto-Trigger an GPIO 17 mit GND

let button = null;
let isGpioInitialized = false;

// GPIO initialisieren
export async function setupGpio() {
  try {
    console.log('🔌 GPIO Setup wird gestartet...');
    
    // Prüfe ob GPIO verfügbar ist (nur auf Pi)
    if (!Gpio.accessible) {
      throw new Error('GPIO nicht verfügbar (nicht auf Raspberry Pi?)');
    }
    
    // Button Pin als Input mit Pull-up konfigurieren
    button = new Gpio(BUTTON_PIN, 'in', 'falling', { debounceTimeout: 50 });
    
    isGpioInitialized = true;
    console.log('✅ GPIO erfolgreich initialisiert');
    console.log(`   📌 Button Pin: ${BUTTON_PIN} (mit internem Pull-up)`);
    console.log('   💡 Keine LED konfiguriert');
    
    return true;
  } catch (error) {
    console.error('❌ GPIO Initialisierung fehlgeschlagen:', error.message);
    console.warn('⚠️ GPIO-Funktionen werden deaktiviert (Mock-Modus)');
    isGpioInitialized = false;
    return false;
  }
}

// LED Funktionen (Mock - keine Hardware vorhanden)
export async function blinkLed(duration = 200, blinks = 3) {
  console.log(`💡 Mock: LED würde ${blinks}x für ${duration}ms blinken (keine LED-Hardware)`);
}

export async function turnOnLed() {
  console.log('🟢 Mock: LED würde eingeschaltet (keine LED-Hardware)');
}

export async function turnOffLed() {
  console.log('🔴 Mock: LED würde ausgeschaltet (keine LED-Hardware)');
}

// Button-Status lesen
export async function readButton() {
  if (!isGpioInitialized || !button) {
    return false;
  }
  
  try {
    const state = button.readSync();
    return state === 0; // Button gedrückt bei Pull-up
  } catch (error) {
    console.error('❌ Fehler beim Button lesen:', error);
    return false;
  }
}

// Button-Event-Listener
export function onButtonPress(callback) {
  if (!isGpioInitialized || !button) {
    console.log('🔘 Mock: Button Event Listener (GPIO nicht verfügbar)');
    return;
  }
  
  try {
    // Watch für falling edge (Button gedrückt bei Pull-up)
    button.watch((err, value) => {
      if (err) {
        console.error('❌ Button watch error:', err);
        return;
      }
      
      if (value === 0) { // Button gedrückt
        console.log('🔘 Button gedrückt!');
        callback();
      }
    });
    
    console.log('✅ Button Event Listener aktiviert');
  } catch (error) {
    console.error('❌ Fehler beim Button-Event-Listener:', error);
  }
}

// GPIO cleanup
export async function cleanup() {
  if (isGpioInitialized && button) {
    try {
      console.log('🔌 GPIO Cleanup...');
      
      // Button cleanup
      button.unexport();
      
      console.log('✅ GPIO Cleanup abgeschlossen');
    } catch (error) {
      console.error('❌ Fehler beim GPIO Cleanup:', error);
    }
  }
  
  isGpioInitialized = false;
  button = null;
}

// GPIO Status
export function getGpioStatus() {
  return {
    initialized: isGpioInitialized,
    buttonPin: BUTTON_PIN,
    ledPin: 'nicht vorhanden',
    accessible: Gpio.accessible
  };
}

// LED-Klasse mit PWM-Unterstützung
export class LED {
  constructor(pin) {
    // Im Browser-Modus: Mock erstellen
    if (process.env.NODE_ENV === 'development') {
      this.mock = true;
      return;
    }

    this.pin = new Gpio(pin, 'out');
    this.blinkInterval = null;
  }

  on() {
    if (this.mock) return;
    this.pin.writeSync(1);
  }

  off() {
    if (this.mock) return;
    this.pin.writeSync(0);
  }

  // Blinken mit einstellbarer Frequenz
  async blink(times = 3, interval = 500) {
    if (this.mock) return;
    
    // Altes Blinken stoppen
    this.stopBlink();

    for (let i = 0; i < times; i++) {
      this.on();
      await new Promise(resolve => setTimeout(resolve, interval));
      this.off();
      if (i < times - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  // Kontinuierliches Blinken starten
  startBlink(interval = 500) {
    if (this.mock) return;
    
    this.stopBlink();
    this.blinkInterval = setInterval(() => {
      this.pin.writeSync(this.pin.readSync() ^ 1);
    }, interval);
  }

  // Blinken stoppen
  stopBlink() {
    if (this.mock) return;
    
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
      this.off();
    }
  }

  // Cleanup
  cleanup() {
    if (!this.mock) {
      this.stopBlink();
      this.pin.unexport();
    }
  }
}
