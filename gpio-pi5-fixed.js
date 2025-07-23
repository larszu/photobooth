/**
 * Einfaches GPIO für Raspberry Pi 5
 * Verwendet lgpio Library für Hardware-Button auf Pin 17
 */

import lgpio from 'lgpio';

class SimpleGPIO {
    constructor() {
        this.buttonPin = 17; // GPIO 17 für Button
        this.isInitialized = false;
        this.photoCallback = null;
        this.handle = null;
    }

    /**
     * Initialisiert GPIO für Pi 5 - mit korrekter lgpio API
     */
    async initialize() {
        try {
            console.log('🔧 GPIO Initialisierung für Pi 5 mit korrekter API...');
            console.log('🔧 Button Pin: GPIO', this.buttonPin);
            
            // Korrekte lgpio API verwenden
            this.handle = lgpio.gpiochipOpen(0); // Chip 0 für GPIO
            console.log('🔧 GPIO Chip Handle:', this.handle);
            
            // Button Pin als Input mit Pull-Up konfigurieren
            const claimResult = lgpio.gpioClaimInput(this.handle, this.buttonPin, lgpio.SET_PULL_UP || 0);
            console.log('🔧 GPIO Claim Input Result:', claimResult);
            
            this.isInitialized = true;
            console.log('✅ GPIO erfolgreich initialisiert mit korrekter API');
            
            // Starte Button-Polling
            this.startButtonPolling();
            
            return true;
            
        } catch (error) {
            console.error('❌ GPIO Initialisierung fehlgeschlagen:', error);
            console.error('❌ Error stack:', error.stack);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Button Polling als Fallback
     */
    startButtonPolling() {
        console.log('🔄 Starte Button Polling...');
        
        // Initialer State Reading
        let initialState;
        try {
            initialState = lgpio.gpioRead(this.handle, this.buttonPin);
            if (typeof initialState === 'boolean') {
                initialState = initialState ? 1 : 0;
            }
            console.log(`🔍 Initial Button State: ${initialState} (${typeof initialState})`);
        } catch (error) {
            console.error('❌ Initial Button State Reading Error:', error);
            initialState = 1; // Fallback
        }
        
        let lastState = initialState;
        let pollCount = 0;
        
        const pollInterval = setInterval(() => {
            if (!this.isInitialized) {
                clearInterval(pollInterval);
                return;
            }
            
            try {
                let currentState;
                
                // Korrekte lgpio API für Reading
                currentState = lgpio.gpioRead(this.handle, this.buttonPin);
                
                // Konvertiere boolean zu number falls nötig
                if (typeof currentState === 'boolean') {
                    currentState = currentState ? 1 : 0;
                }
                
                pollCount++;
                
                // Debug: Alle 50 Polls (5 Sekunden) den aktuellen Status ausgeben
                if (pollCount % 50 === 0) {
                    console.log(`🔍 Button Polling Debug - Count: ${pollCount}, Current State: ${currentState} (${typeof currentState}), Last State: ${lastState} (${typeof lastState})`);  
                }
                
                // Button gedrückt erkennen - Für Ihr Setup: LOW→HIGH ist Button gedrückt
                // Ruhezustand: LOW (false) - Pin 17 zu GND
                // Button gedrückt: HIGH (true) - Pin 17 zu +3.3V
                
                let buttonPressed = false;
                let transitionDescription = '';
                
                if (lastState === 0 && currentState === 1) {
                    buttonPressed = true;
                    transitionDescription = 'LOW→HIGH (Button zu +3.3V gedrückt)';
                }
                
                if (buttonPressed) {
                    console.log(`📸 Button gedrückt erkannt: ${transitionDescription}!`);
                    this.handleButtonPress();
                }
                
                // Debug: Jede Zustandsänderung loggen
                if (lastState !== currentState) {
                    console.log(`🔄 Button State Change: ${lastState} (${typeof lastState}) -> ${currentState} (${typeof currentState})`);
                }
                
                lastState = currentState;
                
            } catch (error) {
                console.error('❌ Button Polling Fehler:', error);
            }
        }, 100); // Alle 100ms prüfen
        
        console.log('✅ Button Polling gestartet (mit Debug)');
    }

    /**
     * Button Press Handler
     */
    handleButtonPress() {
        console.log('📸 GPIO Button gedrückt - löse Foto aus!');
        
        if (this.photoCallback && typeof this.photoCallback === 'function') {
            try {
                this.photoCallback();
            } catch (error) {
                console.error('❌ Fehler beim Foto-Callback:', error);
            }
        } else {
            console.warn('⚠️ Kein Foto-Callback gesetzt');
        }
    }

    /**
     * Setzt Callback-Funktion für Foto-Auslösung
     */
    setPhotoCallback(callback) {
        this.photoCallback = callback;
        console.log('📋 Foto-Callback gesetzt');
    }

    /**
     * GPIO Status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            buttonPin: this.buttonPin,
            handle: this.handle
        };
    }

    /**
     * GPIO Status für API
     */
    getGpioStatus() {
        return {
            initialized: this.isInitialized,
            buttonPin: this.buttonPin,
            handle: this.handle ? 'active' : 'inactive'
        };
    }

    /**
     * Cleanup
     */
    cleanup() {
        try {
            if (this.isInitialized && this.handle !== null) {
                lgpio.gpioFree(this.handle, this.buttonPin);
                lgpio.gpiochipClose(this.handle);
            }
        } catch (error) {
            console.error('❌ GPIO Cleanup Error:', error);
        }
        
        this.isInitialized = false;
        console.log('🧹 GPIO Cleanup abgeschlossen');
    }
}

// Singleton Instance
let gpioInstance = null;

function getGPIOInstance() {
    if (!gpioInstance) {
        gpioInstance = new SimpleGPIO();
    }
    return gpioInstance;
}

export {
    SimpleGPIO,
    getGPIOInstance
};

export default getGPIOInstance;
