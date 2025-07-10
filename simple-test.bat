@echo off
echo.
echo ===== SIMPLE PAPIERKORB TEST =====
echo.

echo 1. Checking if backend is running...
curl -s http://localhost:3001/api/status > temp_status.json
if %errorlevel% equ 0 (
    echo ✅ Backend is running
    type temp_status.json
    del temp_status.json
) else (
    echo ❌ Backend not running on port 3001
    echo Please start backend first!
    pause
    exit /b 1
)

echo.
echo.
echo 2. Testing trash API...
curl -s http://localhost:3001/api/trash

echo.
echo.
echo 3. Manual directory check...
if exist "..\photos\papierkorb" (
    echo ✅ Trash directory exists
    dir "..\photos\papierkorb" /b
) else (
    echo ❌ Trash directory does not exist
)

echo.
echo.
echo 4. Photos directory check...
if exist "..\photos" (
    echo ✅ Photos directory exists  
    dir "..\photos" /b
) else (
    echo ❌ Photos directory does not exist
)

echo.
echo.
echo ===== TEST COMPLETE =====
pause
