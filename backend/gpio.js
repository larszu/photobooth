import { Gpio } from 'onoff';

// Button-Klasse mit Debouncing und Event-Handling
export class Button {
  constructor(pin, pullUp = true) {
    // Im Browser-Modus: Mock erstellen
    if (process.env.NODE_ENV === 'development') {
      this.mock = true;
      return;
    }

    this.pin = new Gpio(pin, 'in', 'both', { debounceTimeout: 10 });
    this.pressTime = 0;
    this.callbacks = {
      press: () => {},
      longPress: () => {},
      release: () => {}
    };

    // Event-Handler
    this.pin.watch((err, value) => {
      if (err) return console.error('GPIO Error:', err);

      if (value === 0) { // Button gedrückt
        this.pressTime = Date.now();
        this.callbacks.press();
      } else { // Button losgelassen
        const pressDuration = Date.now() - this.pressTime;
        if (pressDuration > 1000) {
          this.callbacks.longPress();
        }
        this.callbacks.release();
      }
    });
  }

  // Event-Handler registrieren
  whenPressed(callback) {
    if (this.mock) return;
    this.callbacks.press = callback;
  }

  whenLongPressed(callback) {
    if (this.mock) return;
    this.callbacks.longPress = callback;
  }

  whenReleased(callback) {
    if (this.mock) return;
    this.callbacks.release = callback;
  }

  // Cleanup
  cleanup() {
    if (!this.mock) {
      this.pin.unexport();
    }
  }
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
