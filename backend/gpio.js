// GPIO Modul für Raspberry Pi - JAVASCRIPT/ONOFF VERSION
// Direkte GPIO-Steuerung mit onoff Library

import { Gpio } from 'onoff';

// GPIO Pin-Konfiguration - FEST auf Pin 17
const BUTTON_PIN = 17;  // Button für Foto-Trigger an GPIO 17 mit GND (Pin 11)

let button = null;
let isGpioInitialized = false;

// GPIO initialisieren - EINFACH ohne Prozess-Beendigung
export async function setupGpio() {
  try {
    console.log('🔌 GPIO Setup (onoff)...');
    console.log(`🎯 GPIO ${BUTTON_PIN} (Pin 11)`);
    
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
    console.log('✅ GPIO erfolgreich initialisiert');
    console.log(`   📌 Pin: GPIO ${BUTTON_PIN} (Pin 11, Pull-up, falling edge)`);
    console.log(`   🔧 Verdrahtung: GPIO ${BUTTON_PIN} -> Button -> GND`);
    
    return true;
  } catch (error) {
    console.error('❌ GPIO Initialisierung fehlgeschlagen:', error.message);
    isGpioInitialized = false;
    return false;
  }
}

// Python GPIO Service Status prüfen
async function checkGpioService() {
  try {
    const { stdout } = await execAsync('systemctl is-active photobooth-gpio.service');
    return stdout.trim() === 'active';
  } catch (error) {
    return false;
  }
}

// Python GPIO Service starten
export async function startGpioService() {
  try {
    console.log('🚀 Starte Python GPIO Service...');
    await execAsync('sudo systemctl start photobooth-gpio.service');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Warten
    
    const isRunning = await checkGpioService();
    if (isRunning) {
      gpioServiceStatus = 'running';
      isGpioInitialized = true;
      console.log('✅ Python GPIO Service gestartet');
    } else {
      console.log('❌ Python GPIO Service Start fehlgeschlagen');
    }
    
    return isRunning;
  } catch (error) {
    console.error('❌ Fehler beim Starten des GPIO Service:', error.message);
    return false;
  }
}

// Python GPIO Service stoppen
export async function stopGpioService() {
  try {
    console.log('🛑 Stoppe Python GPIO Service...');
    await execAsync('sudo systemctl stop photobooth-gpio.service');
    gpioServiceStatus = 'stopped';
    isGpioInitialized = false;
    console.log('✅ Python GPIO Service gestoppt');
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Stoppen des GPIO Service:', error.message);
    return false;
  }
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
        console.log('� Button gedrückt!');
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
    accessible: Gpio.accessible
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

// GPIO für Fotobox reservieren (vereinfacht)
export async function reserveGpioForPhotobooth() {
  console.log('🎯 GPIO für Fotobox reserviert');
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
