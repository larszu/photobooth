// GPIO Modul für Raspberry Pi - LIBGPIOD VERSION
// Verwendet node-libgpiod für Raspberry Pi 5 Kompatibilität

import gpiod from 'node-libgpiod';

// GPIO Pin-Konfiguration - FEST auf Pin 17
const BUTTON_PIN = 17;  // Button für Foto-Trigger an GPIO 17 mit GND (Pin 11)
const CHIP_NAME = 'gpiochip4'; // Pi 5 verwendet gpiochip4

let chip = null;
let buttonLine = null;
let isGpioInitialized = false;
let isRaspberryPi5 = false;
let buttonCallback = null;
let watchFd = null;

// Raspberry Pi Model erkennen
async function detectRaspberryPiModel() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync('cat /proc/device-tree/model');
    console.log(`🔍 Hardware Model: ${stdout.trim()}`);
    return stdout.includes('Raspberry Pi 5');
  } catch (error) {
    console.log('ℹ️ Hardware Model nicht erkennbar, versuche Standard GPIO');
    return false;
  }
}

// GPIO-Chip erkennen
async function detectGpioChip() {
  try {
    // Pi 5 verwendet normalerweise gpiochip4
    const availableChips = gpiod.getChipNames();
    console.log(`🔍 Verfügbare GPIO-Chips: ${availableChips.join(', ')}`);
    
    // Priorisiere gpiochip4 für Pi 5
    const preferredChips = ['gpiochip4', 'gpiochip0', 'gpiochip1'];
    
    for (const chipName of preferredChips) {
      if (availableChips.includes(chipName)) {
        console.log(`✅ GPIO-Chip ausgewählt: ${chipName}`);
        return chipName;
      }
    }
    
    // Fallback auf ersten verfügbaren Chip
    if (availableChips.length > 0) {
      console.log(`✅ GPIO-Chip (Fallback): ${availableChips[0]}`);
      return availableChips[0];
    }
    
    console.warn('⚠️ Kein GPIO-Chip gefunden, verwende Standard');
    return CHIP_NAME;
  } catch (error) {
    console.warn('⚠️ Fehler beim Chip-Detection:', error.message);
    return CHIP_NAME;
  }
}

// GPIO initialisieren
export async function setupGpio() {
  try {
    console.log('🔌 GPIO Setup mit libgpiod...');
    console.log(`🎯 GPIO ${BUTTON_PIN} (Pin 11)`);
    
    // Erkenne Hardware Model
    isRaspberryPi5 = await detectRaspberryPiModel();
    
    if (isRaspberryPi5) {
      console.log('🍓 Raspberry Pi 5 erkannt - verwende libgpiod (nativ)');
    } else {
      console.log('🥧 Älteres Pi Model - verwende libgpiod (kompatibel)');
    }
    
    // Erkenne und öffne GPIO-Chip
    const chipName = await detectGpioChip();
    chip = new gpiod.Chip(chipName);
    
    if (!chip) {
      throw new Error(`GPIO-Chip ${chipName} konnte nicht geöffnet werden`);
    }
    
    console.log(`✅ GPIO-Chip geöffnet: ${chipName}`);
    
    // GPIO-Line für Button konfigurieren
    buttonLine = chip.getLine(BUTTON_PIN);
    
    if (!buttonLine) {
      throw new Error(`GPIO Line ${BUTTON_PIN} konnte nicht geöffnet werden`);
    }
    
    // Button als Input mit Pull-up konfigurieren (für Polling)
    buttonLine.requestInputMode({
      consumer: 'photobooth-button'
    });
    
    // Test Button Status
    const initialState = buttonLine.getValue();
    console.log(`🔍 Button Initial State: ${initialState} (0=gedrückt, 1=nicht gedrückt)`);
    
    isGpioInitialized = true;
    console.log('✅ GPIO erfolgreich initialisiert (libgpiod)');
    console.log(`   📌 Pin: GPIO ${BUTTON_PIN} (Pin 11, Pull-up)`);
    console.log(`   🔧 Verdrahtung: GPIO ${BUTTON_PIN} -> Button -> GND`);
    console.log(`   🔌 Chip: ${chipName}`);
    
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
  if (!isGpioInitialized || !buttonLine) {
    return false;
  }
  
  try {
    const state = buttonLine.getValue();
    return state === 0; // Button gedrückt bei Pull-up
  } catch (error) {
    console.error('❌ Fehler beim Button lesen:', error);
    return false;
  }
}

// Button-Event-Listener
export async function onButtonPress(callback) {
  console.log(`🔘 Button Event Listener setup (libgpiod) - initialized: ${isGpioInitialized}, Pi5: ${isRaspberryPi5}`);
  
  if (!isGpioInitialized || !buttonLine) {
    console.log('🔘 Mock: Button Event Listener (GPIO nicht verfügbar)');
    return;
  }
  
  buttonCallback = callback;
  
  try {
    // Einfacher Polling-Ansatz statt komplexer Events
    let lastButtonState = 1; // Initial state (nicht gedrückt)
    
    // Polling-Loop für Button-Status
    const pollLoop = async () => {
      try {
        while (isGpioInitialized && buttonLine) {
          const currentState = buttonLine.getValue();
          
          // Erkennung einer fallenden Flanke (Button gedrückt)
          if (lastButtonState === 1 && currentState === 0) {
            console.log('🔘 Button gedrückt! Löse Foto aus...');
            
            // Callback ausführen
            callback();
            
            // Entprellung - warte bis Button losgelassen wird
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          lastButtonState = currentState;
          
          // Kurze Pause zwischen Abfragen (20ms = 50Hz)
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      } catch (error) {
        if (isGpioInitialized) {
          console.error('❌ Button Polling Fehler:', error);
        }
      }
    };
    
    // Starte Polling-Loop im Hintergrund
    pollLoop();
    
    console.log('✅ Button Event Listener aktiviert (libgpiod polling)');
  } catch (error) {
    console.error('❌ Fehler beim Button-Event-Listener:', error);
  }
}

// GPIO cleanup
export async function cleanup() {
  if (isGpioInitialized) {
    try {
      console.log('🔌 GPIO Cleanup...');
      
      if (buttonLine) {
        buttonLine.release();
        buttonLine = null;
      }
      
      // chip.close() existiert nicht in dieser API
      chip = null;
      
      console.log('✅ GPIO Cleanup abgeschlossen');
    } catch (error) {
      console.error('❌ Fehler beim GPIO Cleanup:', error);
    }
  }
  
  isGpioInitialized = false;
  buttonCallback = null;
  watchFd = null;
}

// GPIO Status
export function getGpioStatus() {
  return {
    initialized: isGpioInitialized,
    buttonPin: BUTTON_PIN,
    chipName: chip ? chip.name || CHIP_NAME : CHIP_NAME,
    raspberryPi5: isRaspberryPi5,
    method: 'libgpiod',
    version: '1.6.3' // libgpiod Version
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
  console.log('🎯 GPIO für Fotobox reserviert (libgpiod Pi 5 nativ)');
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
