@echo off
echo.
echo ===== PHOTOBOOTH PAPIERKORB TEST =====
echo.

echo 1. Testing server connection...
curl -s http://localhost:3001/api/status > nul
if %errorlevel% equ 0 (
    echo ✅ Server is running
) else (
    echo ❌ Server not reachable - start backend first!
    echo Run: cd backend && node server-windows.js
    pause
    exit /b 1
)

echo.
echo 2. Getting current photos...
curl -s http://localhost:3001/api/photos

echo.
echo.
echo 3. Getting current trash...
curl -s http://localhost:3001/api/trash

echo.
echo.
echo 4. Moving all photos to trash...
echo Press any key to move all photos to trash...
pause > nul
curl -X DELETE http://localhost:3001/api/photos

echo.
echo.
echo 5. Checking trash after move...
curl -s http://localhost:3001/api/trash

echo.
echo.
echo ===== TEST COMPLETE =====
echo.
echo Now check:
echo - Admin Panel: http://localhost:5173/admin
echo - Papierkorb: http://localhost:5173/trash
echo.
pause
