#!/usr/bin/env python3
# Einfacher GPIO Button Test OHNE Prozess-Beendigung

import RPi.GPIO as GPIO
import time
import requests

# GPIO Pin
BUTTON_PIN = 17

def setup_gpio():
    """GPIO konfigurieren"""
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    print(f"✅ GPIO {BUTTON_PIN} konfiguriert")

def button_pressed():
    """Button wurde gedrückt - löse Foto aus"""
    print("🔘 Button gedrückt! Löse Foto aus...")
    
    try:
        # HTTP Request an Backend
        response = requests.post('http://localhost:3001/api/camera/capture', timeout=5)
        if response.status_code == 200:
            print("📸 Foto erfolgreich ausgelöst!")
        else:
            print(f"❌ Foto-Request fehlgeschlagen: {response.status_code}")
    except Exception as e:
        print(f"❌ Fehler beim Foto-Request: {e}")

def main():
    """Hauptfunktion"""
    print("🚀 Einfacher GPIO Button Test startet...")
    
    try:
        setup_gpio()
        
        print(f"💡 GPIO {BUTTON_PIN} überwacht...")
        print("🔧 Verbinde Button zwischen GPIO 17 (Pin 11) und GND (Pin 14)")
        print("⚠️ Strg+C zum Beenden")
        
        last_state = GPIO.input(BUTTON_PIN)
        
        while True:
            current_state = GPIO.input(BUTTON_PIN)
            
            # Button gedrückt (von 1 auf 0)
            if last_state == 1 and current_state == 0:
                button_pressed()
                time.sleep(0.5)  # Entprellung
            
            last_state = current_state
            time.sleep(0.1)  # Kurze Pause
            
    except KeyboardInterrupt:
        print("\n🛑 GPIO Button Test beendet")
    except Exception as e:
        print(f"❌ Fehler: {e}")
    finally:
        GPIO.cleanup()
        print("🔌 GPIO Cleanup abgeschlossen")

if __name__ == "__main__":
    main()
