$password = ConvertTo-SecureString "photobooth2025" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ("zumpe", $password)

# Backend starten
Write-Host "🚀 Starte Backend auf Raspberry Pi..."

$session = New-PSSession -HostName 192.168.8.204 -UserName zumpe -KeyFilePath $null -Credential $credential

Invoke-Command -Session $session -ScriptBlock {
    Set-Location /home/zumpe/photobooth/backend
    
    # Alte Prozesse stoppen
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Backend starten
    Start-Process -FilePath "node" -ArgumentList "server.js" -RedirectStandardOutput "photobooth.log" -RedirectStandardError "photobooth.log" -NoNewWindow
    
    Start-Sleep -Seconds 2
    
    Write-Host "✅ Backend gestartet!"
}

Remove-PSSession $session
Write-Host "🌐 Frontend läuft auf: http://192.168.8.204:5173"
Write-Host "🔧 Backend läuft auf: http://192.168.8.204:3001"
