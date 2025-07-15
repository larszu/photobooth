# PowerShell-Script zum Testen der Gallery Delete API
Write-Host "🔍 Testing Gallery Delete API..." -ForegroundColor Cyan

$apiBase = "http://localhost:3001"

try {
    # 1. Alle Fotos abrufen
    Write-Host "`n1. 📷 Fetching all photos..." -ForegroundColor Yellow
    $photosResponse = Invoke-RestMethod -Uri "$apiBase/api/photos" -Method GET
    
    Write-Host "✅ Photos response received" -ForegroundColor Green
    Write-Host "Response: $($photosResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    
    # Foto-Array extrahieren
    $photoArray = @()
    if ($photosResponse.photos -and $photosResponse.photos.Count -gt 0) {
        $photoArray = $photosResponse.photos | ForEach-Object {
            if ($_ -is [string]) { $_ } else { $_.filename }
        }
    }
    
    Write-Host "📋 Found $($photoArray.Count) photos" -ForegroundColor Green
    
    if ($photoArray.Count -eq 0) {
        Write-Host "⚠️ No photos found to test with" -ForegroundColor Yellow
        exit
    }
    
    # Erste 3 Fotos anzeigen
    Write-Host "First 3 photos:" -ForegroundColor Gray
    $photoArray[0..2] | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    
    # 2. Erstes Foto zum Test auswählen
    $testPhoto = $photoArray[0]
    Write-Host "`n2. 🎯 Selected test photo: $testPhoto" -ForegroundColor Yellow
    
    # 3. Foto in Papierkorb verschieben
    Write-Host "`n3. 🗑️ Moving photo to trash..." -ForegroundColor Yellow
    $encodedPhoto = [System.Web.HttpUtility]::UrlEncode($testPhoto)
    $deleteUri = "$apiBase/api/photos/$encodedPhoto/trash"
    
    Write-Host "Request URL: $deleteUri" -ForegroundColor Gray
    
    $deleteResponse = Invoke-RestMethod -Uri $deleteUri -Method POST
    
    Write-Host "✅ Photo moved to trash successfully!" -ForegroundColor Green
    Write-Host "Response: $($deleteResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    
    # 4. Fotos nach Löschung neu abrufen
    Write-Host "`n4. 🔄 Refreshing photos after delete..." -ForegroundColor Yellow
    $refreshResponse = Invoke-RestMethod -Uri "$apiBase/api/photos" -Method GET
    
    $newPhotoArray = @()
    if ($refreshResponse.photos -and $refreshResponse.photos.Count -gt 0) {
        $newPhotoArray = $refreshResponse.photos | ForEach-Object {
            if ($_ -is [string]) { $_ } else { $_.filename }
        }
    }
    
    Write-Host "📋 Photos after delete: $($newPhotoArray.Count)" -ForegroundColor Green
    $stillInList = $newPhotoArray -contains $testPhoto
    Write-Host "Test photo still in list: $stillInList" -ForegroundColor $(if ($stillInList) { "Red" } else { "Green" })
    
    # 5. Papierkorb prüfen
    Write-Host "`n5. 🗑️ Checking trash..." -ForegroundColor Yellow
    $trashResponse = Invoke-RestMethod -Uri "$apiBase/api/trash" -Method GET
    
    Write-Host "✅ Trash response received" -ForegroundColor Green
    Write-Host "Photos in trash: $($trashResponse.photos.Count)" -ForegroundColor Green
    
    if ($trashResponse.photos.Count -gt 0) {
        Write-Host "First 3 photos in trash:" -ForegroundColor Gray
        $trashResponse.photos[0..2] | ForEach-Object { 
            Write-Host "  - $($_.filename) ($($_.size) bytes)" -ForegroundColor Gray 
        }
        
        $foundInTrash = $trashResponse.photos | Where-Object { $_.filename -like "*$($testPhoto.Split('.')[0])*" }
        if ($foundInTrash) {
            Write-Host "✅ Test photo found in trash: $($foundInTrash.filename)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Test photo not found in trash" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n✅ Test completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error: $($_ | Out-String)" -ForegroundColor Red
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
