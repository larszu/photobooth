// GPIO Modul für Raspberry Pi - ONOFF VERSION
// Verwendet onoff Library für alle Pi-Modelle einschließlich Pi 5

import { Gpio } from 'onoff';

// GPIO Pin-Konfiguration - FEST auf Pin 17
const BUTTON_PIN = 17;  // Button für Foto-Trigger an GPIO 17 mit GND (Pin 11)

let button = null;
let isGpioInitialized = false;
let isRaspberryPi5 = false;
let buttonCallback = null;

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

// GPIO initialisieren
export async function setupGpio() {
  try {
    console.log('🔌 GPIO Setup...');
    console.log(`🎯 GPIO ${BUTTON_PIN} (Pin 11)`);
    
    // Erkenne Hardware Model (nur für Logging)
    isRaspberryPi5 = await detectRaspberryPiModel();
    
    if (isRaspberryPi5) {
      console.log('🍓 Raspberry Pi 5 erkannt - verwende onoff Library (sollte mit Pi 5 funktionieren)');
    } else {
      console.log('� Älteres Pi Model - verwende onoff Library');
    }
    
    // Prüfe ob GPIO verfügbar ist
    if (!Gpio.accessible) {
      console.log('❌ GPIO nicht verfügbar (nicht auf Raspberry Pi?)');
      return false;
    }
    
    console.log('✅ GPIO System verfügbar');
    
    // DIREKTE GPIO-Initialisierung mit onoff
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
  if (!isGpioInitialized || !button) {
    return false;
  }
  
  try {
    // onoff für alle Pi-Modelle
    const state = button.readSync();
    return state === 0; // Button gedrückt bei Pull-up
  } catch (error) {
    console.error('❌ Fehler beim Button lesen:', error);
    return false;
  }
}

// Button-Event-Listener
export async function onButtonPress(callback) {
  console.log(`🔘 Button Event Listener setup - initialized: ${isGpioInitialized}, Pi5: ${isRaspberryPi5}`);
  
  if (!isGpioInitialized || !button) {
    console.log('🔘 Mock: Button Event Listener (GPIO nicht verfügbar)');
    return;
  }
  
  buttonCallback = callback;
  
  try {
    // onoff watch für alle Pi-Modelle (auch Pi 5)
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
  } catch (error) {
    console.error('❌ Fehler beim Button-Event-Listener:', error);
  }
}

// GPIO cleanup
export async function cleanup() {
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
    method: 'onoff'
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
