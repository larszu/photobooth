#!/usr/bin/env python3
# Einfacher GPIO Button Test - OHNE sudo

import RPi.GPIO as GPIO
import time
import subprocess

# GPIO Pin für Button
BUTTON_PIN = 17  # GPIO 17 (Pin 11)

def setup_gpio():
    """GPIO für Button konfigurieren"""
    print("🔌 Konfiguriere GPIO...")
    
    # GPIO cleanup und setup
    GPIO.cleanup()
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    # Button Pin mit Pull-up
    GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
    
    print(f"✅ GPIO {BUTTON_PIN} (Pin 11) als Button konfiguriert")
    print(f"🔧 Verdrahtung: GPIO {BUTTON_PIN} -> Button -> GND")
    
    # Test Button Status
    initial_state = GPIO.input(BUTTON_PIN)
    print(f"🔍 Button Initial State: {initial_state} (0=gedrückt, 1=nicht gedrückt)")

def button_callback(channel):
    """Button wurde gedrückt"""
    print("🔘 Button gedrückt! Löse Foto aus...")
    
    # HTTP Request an Backend senden
    try:
        result = subprocess.run(['curl', '-X', 'POST', 'http://localhost:3001/api/camera/capture'], 
                      capture_output=True, timeout=5, text=True)
        print("📸 Foto-Request gesendet")
        if result.stdout:
            print(f"Response: {result.stdout[:100]}")
    except Exception as e:
        print(f"❌ Fehler beim Foto-Request: {e}")

def main():
    """Hauptfunktion"""
    print("🚀 Einfacher Python GPIO Button Test startet...")
    
    try:
        # GPIO konfigurieren (OHNE sudo cleanup)
        setup_gpio()
        
        # Button Event Handler
        GPIO.add_event_detect(BUTTON_PIN, GPIO.FALLING, 
                            callback=button_callback, bouncetime=200)
        
        print("✅ GPIO Button Test läuft")
        print("💡 Drücke den Button zum Testen...")
        print("⚠️ Strg+C zum Beenden")
        
        # Endlos-Schleife
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 GPIO Button Test beendet")
    except Exception as e:
        print(f"❌ Fehler: {e}")
    finally:
        GPIO.cleanup()
        print("🔌 GPIO Cleanup abgeschlossen")

if __name__ == "__main__":
    main()
