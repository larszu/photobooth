# Direct API Test für Papierkorb-Funktionalität

Write-Host "🔍 DIRECT API TEST FOR PAPIERKORB" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Test 1: Server Status
Write-Host "1. Testing Server Status..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "http://localhost:3001/api/status" -Method Get
    Write-Host "✅ Server Status OK" -ForegroundColor Green
    Write-Host "📊 Photos Count: $($status.files.photosCount)" -ForegroundColor Cyan
    Write-Host "🗑️ Trash Count: $($status.files.trashCount)" -ForegroundColor Cyan
    Write-Host "📁 Photos Files: $($status.files.photosFiles -join ', ')" -ForegroundColor Gray
    Write-Host "🗑️ Trash Files: $($status.files.trashFiles -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server Status Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Trash API direkt
Write-Host "2. Testing Trash API directly..." -ForegroundColor Yellow
try {
    $trash = Invoke-RestMethod -Uri "http://localhost:3001/api/trash" -Method Get -Verbose
    Write-Host "✅ Trash API OK" -ForegroundColor Green
    Write-Host "📊 Trash Photos Count: $($trash.photos.Count)" -ForegroundColor Cyan
    
    if ($trash.photos.Count -gt 0) {
        Write-Host "🗑️ Trash Photos:" -ForegroundColor Cyan
        foreach ($photo in $trash.photos) {
            Write-Host "  - $($photo.filename) (Size: $($photo.size) bytes)" -ForegroundColor Gray
            Write-Host "    URL: $($photo.url)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "📭 Trash is empty" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Trash API Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error Details: $($_)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Manual file check
Write-Host "3. Manual file system check..." -ForegroundColor Yellow
$photosPath = "..\photos"
$trashPath = "..\photos\papierkorb"

if (Test-Path $photosPath) {
    $photoFiles = Get-ChildItem $photosPath -File
    Write-Host "✅ Photos directory exists" -ForegroundColor Green
    Write-Host "📊 Photo files: $($photoFiles.Count)" -ForegroundColor Cyan
    foreach ($file in $photoFiles) {
        Write-Host "  - $($file.Name) (Size: $($file.Length) bytes)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Photos directory missing" -ForegroundColor Red
}

Write-Host ""

if (Test-Path $trashPath) {
    $trashFiles = Get-ChildItem $trashPath -File
    Write-Host "✅ Trash directory exists" -ForegroundColor Green
    Write-Host "🗑️ Trash files: $($trashFiles.Count)" -ForegroundColor Cyan
    foreach ($file in $trashFiles) {
        Write-Host "  - $($file.Name) (Size: $($file.Length) bytes)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Trash directory missing" -ForegroundColor Red
}

Write-Host ""

# Test 4: Test Image serving
Write-Host "4. Testing image serving from trash..." -ForegroundColor Yellow
if (Test-Path $trashPath) {
    $imageFiles = Get-ChildItem $trashPath -File | Where-Object { $_.Extension -match '\.(jpg|jpeg|png|gif|svg)$' }
    if ($imageFiles.Count -gt 0) {
        $testFile = $imageFiles[0]
        $imageUrl = "http://localhost:3001/api/trash/image/$($testFile.Name)"
        Write-Host "Testing URL: $imageUrl" -ForegroundColor Cyan
        
        try {
            $response = Invoke-WebRequest -Uri $imageUrl -Method Get
            Write-Host "✅ Image serving OK (Status: $($response.StatusCode))" -ForegroundColor Green
            Write-Host "📊 Content-Length: $($response.Headers.'Content-Length')" -ForegroundColor Cyan
        } catch {
            Write-Host "❌ Image serving failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "📭 No image files in trash to test" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🏁 Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "- Check backend console for detailed logs" -ForegroundColor White
Write-Host "- Try Frontend: http://localhost:5173/trash" -ForegroundColor White
Write-Host "- Try Admin Panel: http://localhost:5173/admin" -ForegroundColor White

Read-Host "Press Enter to continue"
