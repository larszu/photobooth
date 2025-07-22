// gpio.js (Mock für Entwicklung, auf Pi durch echtes gpizero ersetzen)
export class Button {
  constructor(pin) {
    this.pin = pin;
  }
  whenPressed(callback) {
    // Hier GPIO-Logik einbauen (auf Pi)
    // z.B. mit python-shell oder direkter gpizero-Anbindung
  }
}

export class LED {
  constructor(pin) {
    this.pin = pin;
  }
  on() {}
  off() {}
}
