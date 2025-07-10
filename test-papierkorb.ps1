# PowerShell-Script zum Testen der Papierkorb-Funktionalität

Write-Host "🔍 Testing Photobooth Papierkorb System..." -ForegroundColor Green
Write-Host ""

# Test 1: Server Status
Write-Host "1. Testing server status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/status" -Method Get
    Write-Host "✅ Server is running" -ForegroundColor Green
    Write-Host "📁 Photos Directory: $($response.directories.photosDir)" -ForegroundColor Cyan
    Write-Host "📁 Trash Directory: $($response.directories.trashDir)" -ForegroundColor Cyan
    Write-Host "📁 Photos Directory Exists: $($response.directories.photosDirExists)" -ForegroundColor Cyan
    Write-Host "📁 Trash Directory Exists: $($response.directories.trashDirExists)" -ForegroundColor Cyan
    Write-Host "📊 Photos Count: $($response.files.photosCount)" -ForegroundColor Cyan
    Write-Host "📊 Trash Count: $($response.files.trashCount)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Server not reachable: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check current photos
Write-Host "2. Testing current photos..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/photos" -Method Get
    Write-Host "✅ Photos API working" -ForegroundColor Green
    Write-Host "📊 Current photos: $($response.photos.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Photos API error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check trash (should be empty initially)
Write-Host "3. Testing trash API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/trash" -Method Get
    Write-Host "✅ Trash API working" -ForegroundColor Green
    Write-Host "📊 Current trash photos: $($response.photos.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Trash API error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Manual directory check
Write-Host "4. Manual directory check..." -ForegroundColor Yellow
$photosPath = ".\photos"
$trashPath = ".\photos\papierkorb"

if (Test-Path $photosPath) {
    Write-Host "✅ Photos directory exists" -ForegroundColor Green
    $photoFiles = Get-ChildItem $photosPath -File | Measure-Object
    Write-Host "📊 Files in photos directory: $($photoFiles.Count)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Photos directory does not exist" -ForegroundColor Red
}

if (Test-Path $trashPath) {
    Write-Host "✅ Trash directory exists" -ForegroundColor Green
    $trashFiles = Get-ChildItem $trashPath -File | Measure-Object
    Write-Host "📊 Files in trash directory: $($trashFiles.Count)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Trash directory does not exist" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Ready to test!" -ForegroundColor Green
Write-Host "Now go to Admin Panel and click 'Alle Fotos löschen'" -ForegroundColor Yellow
Write-Host "Then check 'Papierkorb anzeigen'" -ForegroundColor Yellow

Read-Host "Press Enter to continue"
