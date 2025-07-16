#!/usr/bin/env python3
# GPIO Button Script für Photobooth
# Einfacher und direkter als Node.js

import RPi.GPIO as GPIO
import time
import subprocess
import os
import sys

# GPIO Pin für Button
BUTTON_PIN = 17  # GPIO 17 (Pin 11)

def kill_other_gpio_processes():
    """Andere GPIO-Prozesse beenden (OHNE uns selbst zu killen)"""
    print("🔄 Beende andere GPIO-Prozesse...")
    
    # Unsere eigene PID merken
    our_pid = os.getpid()
    print(f"🔒 Unsere PID: {our_pid} - wird NICHT beendet")
    
    # Liste aller möglichen GPIO-Programme (spezifisch, OHNE 'gpio' allgemein)
    programs = ['pigpiod', 'gpiod', 'wiringpi']
    
    for program in programs:
        try:
            subprocess.run(['sudo', 'pkill', '-9', '-f', program], 
                         capture_output=True, check=False)
            print(f"✅ {program} Prozesse beendet")
        except:
            pass
    
    # Services stoppen
    services = ['pigpiod', 'gpiod']
    for service in services:
        try:
            subprocess.run(['sudo', 'systemctl', 'stop', service], 
                         capture_output=True, check=False)
            print(f"✅ {service} Service gestoppt")
        except:
            pass

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
        subprocess.run(['curl', '-X', 'POST', 'http://localhost:3001/api/camera/capture'], 
                      capture_output=True, timeout=5)
        print("📸 Foto-Request gesendet")
    except Exception as e:
        print(f"❌ Fehler beim Foto-Request: {e}")

def main():
    """Hauptfunktion"""
    print("🚀 Python GPIO Button Daemon startet...")
    
    try:
        # 1. Andere Prozesse beenden
        kill_other_gpio_processes()
        
        # 2. Warten
        time.sleep(2)
        
        # 3. GPIO konfigurieren
        setup_gpio()
        
        # 4. Button Event Handler
        GPIO.add_event_detect(BUTTON_PIN, GPIO.FALLING, 
                            callback=button_callback, bouncetime=200)
        
        print("✅ GPIO Button Daemon läuft")
        print("💡 Drücke den Button zum Testen...")
        print("⚠️ Strg+C zum Beenden")
        
        # Endlos-Schleife
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 GPIO Button Daemon beendet")
    except Exception as e:
        print(f"❌ Fehler: {e}")
    finally:
        GPIO.cleanup()
        print("🔌 GPIO Cleanup abgeschlossen")

if __name__ == "__main__":
    main()
