// GPIO Pi5 Fixed Implementation
// This file is a copy of gpio-pi5-fixed.js for backend usage

import lgpio from 'lgpio';

class SimpleGPIO {
  constructor() {
    this.buttonPin = 17;
    this.isInitialized = false;
    this.photoCallback = null;
    this.handle = null;
    this.polling = false;
  }

  async reserveGpioForPhotobooth() {
    // No-op for Pi5, just for compatibility
    return true;
  }

  async setupGpio() {
    try {
      console.log('🔧 GPIO Test für Pi 5 - verschiedene Modi testen...');
      console.log('🔧 Button Pin: GPIO', this.buttonPin, '(Hardware: Pin 1=3.3V zu Pin 11=GPIO17)');
      
      // Korrekte lgpio API verwenden
      this.handle = lgpio.gpiochipOpen(0); // Chip 0 für GPIO
      console.log('🔧 GPIO Chip Handle:', this.handle);
      
      // TESTE VERSCHIEDENE MODI:
      
      // 1. Test: Ohne Pull-Up/Pull-Down (floating)
      console.log('🔧 Test 1: GPIO ohne Pull-Resistor...');
      let claimResult = lgpio.gpioClaimInput(this.handle, this.buttonPin, 0);
      console.log('🔧 Claim Result (floating):', claimResult);
      let state1 = lgpio.gpioRead(this.handle, this.buttonPin);
      console.log('🔧 State (floating):', state1);
      
      // Pin wieder freigeben für nächsten Test
      lgpio.gpioFree(this.handle, this.buttonPin);
      
      // 2. Test: Mit Pull-Up (sollte HIGH=1 sein)
      console.log('🔧 Test 2: GPIO mit Pull-Up...');
      claimResult = lgpio.gpioClaimInput(this.handle, this.buttonPin, lgpio.SET_PULL_UP || 1);
      console.log('🔧 Claim Result (pull-up):', claimResult);
      let state2 = lgpio.gpioRead(this.handle, this.buttonPin);
      console.log('🔧 State (pull-up):', state2);
      
      // Pin wieder freigeben für nächsten Test
      lgpio.gpioFree(this.handle, this.buttonPin);
      
      // 3. Test: Mit Pull-Down (sollte LOW=0 sein)
      console.log('🔧 Test 3: GPIO mit Pull-Down...');
      claimResult = lgpio.gpioClaimInput(this.handle, this.buttonPin, lgpio.SET_PULL_DOWN || 2);
      console.log('🔧 Claim Result (pull-down):', claimResult);
      let state3 = lgpio.gpioRead(this.handle, this.buttonPin);
      console.log('🔧 State (pull-down):', state3);
      
      // Endgültige Konfiguration: Pull-Up für externen Button
      console.log('🔧 Final: GPIO mit Pull-Up für Button-Polling...');
      const finalResult = lgpio.gpioClaimInput(this.handle, this.buttonPin, lgpio.SET_PULL_UP || 1);
      console.log('🔧 Final Claim Result:', finalResult);
      
      // Test den aktuellen Zustand mehrmals
      for (let i = 0; i < 5; i++) {
        const currentState = lgpio.gpioRead(this.handle, this.buttonPin);
        console.log(`🔧 Test Read ${i+1}:`, currentState, currentState === 1 ? '(HIGH - not pressed)' : '(LOW - pressed or error)');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.isInitialized = true;
      this.startButtonPolling();
      console.log('✅ GPIO Test abgeschlossen - Button-Polling gestartet');
    } catch (error) {
      console.error('❌ GPIO Initialisierung fehlgeschlagen:', error);
      throw error;
    }
  }

  setPhotoCallback(cb) {
    this.photoCallback = cb;
  }

  startButtonPolling() {
    if (this.polling || !this.isInitialized) return;
    this.polling = true;
    
    let lastButtonState = 1; // Pull-up default: HIGH (nicht gedrückt)
    let debounceCounter = 0;
    const DEBOUNCE_COUNT = 3; // 3 aufeinanderfolgende Readings für Entprellung
    
    console.log('🔘 Button Polling gestartet - kontinuierliches Monitoring...');
    
    setInterval(() => {
      try {
        const buttonState = lgpio.gpioRead(this.handle, this.buttonPin);
        
        // Zeige alle State-Änderungen sofort
        if (buttonState !== lastButtonState) {
          console.log(`🔘 BUTTON STATE CHANGE: ${lastButtonState} -> ${buttonState} (${buttonState === 1 ? 'RELEASED' : 'PRESSED'})`);
        }
        
        // Button gedrückt: Übergang von HIGH (1) zu LOW (0) mit Entprellung
        if (buttonState === 0 && lastButtonState === 1) {
          debounceCounter++;
          console.log(`🔘 Button press detected - debounce ${debounceCounter}/${DEBOUNCE_COUNT}`);
          if (debounceCounter >= DEBOUNCE_COUNT) {
            console.log('🔘 *** GPIO BUTTON PRESSED! *** (Pull-Up: 1->0)');
            if (this.photoCallback) {
              this.photoCallback();
            }
            debounceCounter = 0;
          }
        } else if (buttonState === 1) {
          if (debounceCounter > 0) {
            console.log('🔘 Button press cancelled - state returned to HIGH');
          }
          debounceCounter = 0; // Reset counter wenn Button losgelassen
        }
        
        lastButtonState = buttonState;
      } catch (error) {
        console.error('❌ GPIO Read Error:', error);
      }
    }, 50); // 50ms Polling-Intervall
  }

  async onButtonPress(cb) {
    this.setPhotoCallback(cb);
  }

  getGpioStatus() {
    return {
      buttonPin: this.buttonPin,
      isInitialized: this.isInitialized,
      polling: this.polling
    };
  }
}

export default new SimpleGPIO();
