// GPIO Modul für Raspberry Pi 5 - FALLBACK VERSION
// Kombiniert onoff Library mit Python-Fallback für Pi 5

import { Gpio } from 'onoff';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// GPIO Pin-Konfiguration - FEST auf Pin 17
const BUTTON_PIN = 17;  // Button für Foto-Trigger an GPIO 17 mit GND (Pin 11)

let button = null;
let isGpioInitialized = false;
let isRaspberryPi5 = false;
let buttonCallback = null;
let pollingInterval = null;

// Raspberry Pi Model erkennen
async function detectRaspberryPiModel() {
  try {
    const { stdout } = await execAsync('cat /proc/device-tree/model');
    console.log(`🔍 Hardware Model: ${stdout.trim()}`);
    return stdout.includes('Raspberry Pi 5');
  } catch (error) {
    console.log('ℹ️ Hardware Model nicht erkennbar, versuche Standard GPIO');
    return false;
  }
}

// GPIO mit Python für Pi 5
async function setupGpioPython() {
  try {
    console.log('🔌 GPIO Setup (Python für Pi 5)...');
    
    // Test Python GPIO Script erstellen
    const pythonScript = `
import lgpio
import time

# GPIO 17 als Input mit Pull-up
chip = lgpio.gpiochip_open(0)
lgpio.gpio_claim_input(chip, 17, lgpio.SET_PULL_UP)

# Status lesen  
state = lgpio.gpio_read(chip, 17)
print(f"GPIO17_STATE:{state}")

lgpio.gpiochip_close(chip)
`;
    
    // Python Script testen
    const { stdout } = await execAsync(`echo '${pythonScript}' | python3`);
    console.log(`🔍 Python GPIO Test: ${stdout.trim()}`);
    
    if (stdout.includes('GPIO17_STATE:')) {
      const state = stdout.includes('GPIO17_STATE:0') ? 0 : 1;
      console.log(`🔍 Button Initial State: ${state} (0=gedrückt, 1=nicht gedrückt)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Python GPIO Test fehlgeschlagen:', error.message);
    return false;
  }
}

// GPIO initialisieren
export async function setupGpio() {
  try {
    console.log('🔌 GPIO Setup...');
    console.log(`🎯 GPIO ${BUTTON_PIN} (Pin 11)`);
    
    // Erkenne Hardware Model
    isRaspberryPi5 = await detectRaspberryPiModel();
    
    if (isRaspberryPi5) {
      console.log('🍓 Raspberry Pi 5 erkannt - verwende Python GPIO');
      const pythonSuccess = await setupGpioPython();
      
      if (pythonSuccess) {
        isGpioInitialized = true;
        console.log('✅ GPIO erfolgreich initialisiert (Python)');
        console.log(`   📌 Pin: GPIO ${BUTTON_PIN} (Pin 11, Pull-up)`);
        console.log(`   🔧 Verdrahtung: GPIO ${BUTTON_PIN} -> Button -> GND`);
        return true;
      }
    }
    
    // Fallback auf onoff für ältere Pi-Modelle
    console.log('🔌 Versuche onoff Library...');
    
    // Prüfe ob GPIO verfügbar ist
    if (!Gpio.accessible) {
      console.log('❌ GPIO nicht verfügbar (nicht auf Raspberry Pi?)');
      return false;
    }
    
    console.log('✅ GPIO System verfügbar');
    
    // DIREKTE GPIO-Initialisierung
    button = new Gpio(BUTTON_PIN, 'in', 'falling', { 
      debounceTimeout: 100  // 100ms Entprellung
    });
    
    // Test Button Status
    const initialState = button.readSync();
    console.log(`🔍 Button Initial State: ${initialState} (0=gedrückt, 1=nicht gedrückt)`);
    
    isGpioInitialized = true;
    console.log('✅ GPIO erfolgreich initialisiert (onoff)');
    console.log(`   📌 Pin: GPIO ${BUTTON_PIN} (Pin 11, Pull-up, falling edge)`);
    console.log(`   🔧 Verdrahtung: GPIO ${BUTTON_PIN} -> Button -> GND`);
    
    return true;
  } catch (error) {
    console.error('❌ GPIO Initialisierung fehlgeschlagen:', error.message);
    console.error('📋 Fehler-Details:', error);
    isGpioInitialized = false;
    return false;
  }
}

// Button-Status lesen
export async function readButton() {
  if (!isGpioInitialized) {
    return false;
  }
  
  try {
    if (isRaspberryPi5) {
      // Python GPIO für Pi 5
      const pythonScript = `
import lgpio
chip = lgpio.gpiochip_open(0)
lgpio.gpio_claim_input(chip, 17, lgpio.SET_PULL_UP)
state = lgpio.gpio_read(chip, 17)
print(state)
lgpio.gpiochip_close(chip)
`;
      const { stdout } = await execAsync(`echo '${pythonScript}' | python3`);
      const state = parseInt(stdout.trim());
      return state === 0; // Button gedrückt bei Pull-up
    } else {
      // onoff für ältere Pi-Modelle
      const state = button.readSync();
      return state === 0; // Button gedrückt bei Pull-up
    }
  } catch (error) {
    console.error('❌ Fehler beim Button lesen:', error);
    return false;
  }
}

// Button-Event-Listener
export async function onButtonPress(callback) {
  console.log(`🔘 Button Event Listener setup - initialized: ${isGpioInitialized}, Pi5: ${isRaspberryPi5}`);
  
  if (!isGpioInitialized) {
    console.log('🔘 Mock: Button Event Listener (GPIO nicht verfügbar)');
    return;
  }
  
  buttonCallback = callback;
  
  try {
    if (isRaspberryPi5) {
      // Polling für Pi 5 (Python GPIO)
      console.log('✅ Button Event Listener aktiviert (Python Polling)');
      
      // Aktuellen Zustand lesen um korrekt zu starten
      let lastState = await readButton(); // true = gedrückt, false = nicht gedrückt
      console.log(`🔘 Button Polling gestartet mit Initial State: ${lastState}`);
      
      pollingInterval = setInterval(async () => {
        try {
          const currentState = await readButton();
          console.log(`🔘 Button Poll: last=${lastState}, current=${currentState}`);
          
          // Button-Event erkennen: Wenn Button verbunden wird (von nicht-gedrückt zu gedrückt)
          if (lastState === false && currentState === true) {
            // Button gedrückt/verbunden (falling edge)
            console.log('🔘 Button gedrückt! Löse Foto aus...');
            callback();
          }
          lastState = currentState;
        } catch (error) {
          console.error('❌ Button polling error:', error);
        }
      }, 100); // 100ms Polling für bessere Erkennung
      
    } else {
      // onoff watch für ältere Pi-Modelle
      button.watch((err, value) => {
        if (err) {
          console.error('❌ Button watch error:', err);
          return;
        }
        
        if (value === 0) { // Button gedrückt
          console.log('🔘 Button gedrückt! Löse Foto aus...');
          callback();
        }
      });
      
      console.log('✅ Button Event Listener aktiviert (onoff watch)');
    }
  } catch (error) {
    console.error('❌ Fehler beim Button-Event-Listener:', error);
  }
}

// GPIO cleanup
export async function cleanup() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('🔌 Button Polling gestoppt');
  }
  
  if (isGpioInitialized && button) {
    try {
      console.log('🔌 GPIO Cleanup...');
      button.unexport();
      console.log('✅ GPIO Cleanup abgeschlossen');
    } catch (error) {
      console.error('❌ Fehler beim GPIO Cleanup:', error);
    }
  }
  
  isGpioInitialized = false;
  button = null;
  buttonCallback = null;
}

// GPIO Status
export function getGpioStatus() {
  return {
    initialized: isGpioInitialized,
    buttonPin: BUTTON_PIN,
    accessible: Gpio.accessible,
    raspberryPi5: isRaspberryPi5,
    method: isRaspberryPi5 ? 'python-lgpio' : 'onoff'
  };
}

// Mock LED-Funktionen (keine Hardware vorhanden)
export async function blinkLed(duration = 200, blinks = 3) {
  console.log(`💡 Mock: LED würde ${blinks}x für ${duration}ms blinken`);
}

export async function turnOnLed() {
  console.log('🟢 Mock: LED würde eingeschaltet');
}

export async function turnOffLed() {
  console.log('🔴 Mock: LED würde ausgeschaltet');
}

// GPIO für Fotobox reservieren
export async function reserveGpioForPhotobooth() {
  console.log('🎯 GPIO für Fotobox reserviert (Pi 5 kompatibel)');
  return true;
}

// Export des gpio-Objekts
export const gpio = {
  setupGpio,
  onButtonPress,
  blinkLed,
  turnOnLed,
  turnOffLed,
  readButton,
  cleanup,
  getGpioStatus,
  reserveGpioForPhotobooth
};

export default gpio;
