#!/usr/bin/env pwsh

# Test-Script für Auto-Logout Funktionalität
Write-Host "🔒 Auto-Logout Test für Photobooth Admin" -ForegroundColor Green
Write-Host "=" * 50

# 1. Login testen
Write-Host "`n1. 🔐 Login als Admin..." -ForegroundColor Cyan
$loginData = @{ username = "admin"; password = "photobooth2025" } | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "   ✅ Login erfolgreich!" -ForegroundColor Green
    Write-Host "   📋 Benutzer: $($loginResponse.user.username)" -ForegroundColor Yellow
    Write-Host "   🎫 Token erhalten: $($token.Substring(0, 20))..." -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Login fehlgeschlagen: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Auth Status prüfen
Write-Host "`n2. 🔍 Auth-Status prüfen..." -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $token" }
try {
    $authStatus = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/status" -Headers $headers
    Write-Host "   ✅ Auth-Status: $($authStatus.authenticated)" -ForegroundColor Green
    Write-Host "   👤 Angemeldet als: $($authStatus.user.username)" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Auth-Status Fehler: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 AUTO-LOGOUT FUNKTIONALITÄT:" -ForegroundColor Magenta
Write-Host "   1. Öffnen Sie: http://localhost:5173" -ForegroundColor White
Write-Host "   2. Klicken Sie auf 'Admin Panel'" -ForegroundColor White
Write-Host "   3. Loggen Sie sich ein (admin/photobooth2025)" -ForegroundColor White
Write-Host "   4. Gehen Sie zurück zur Galerie (Zurück-Button)" -ForegroundColor White
Write-Host "   5. ➡️  Sie sollten automatisch ausgeloggt werden!" -ForegroundColor Yellow

Write-Host "`n🔧 ERWARTETES VERHALTEN:" -ForegroundColor Magenta
Write-Host "   ✅ Login-Seite: Kein Auto-Logout" -ForegroundColor Green
Write-Host "   ✅ Galerie-Seite: Kein Auto-Logout" -ForegroundColor Green
Write-Host "   🔒 Admin-Seite: Auto-Logout beim Verlassen" -ForegroundColor Red

Write-Host "`n📊 Backend-Logs überwachen:" -ForegroundColor Cyan
Write-Host "   Schauen Sie ins Terminal für folgende Meldungen:" -ForegroundColor White
Write-Host "   🔒 'Auto-Logout aktiviert - wird beim Verlassen der Admin-Seite ausgeloggt'" -ForegroundColor Yellow
Write-Host "   🔒 'Auto-Logout ausgefuehrt - Admin-Seite verlassen'" -ForegroundColor Yellow

Write-Host "`n✨ Test abgeschlossen! Testen Sie jetzt manuell im Browser." -ForegroundColor Green
