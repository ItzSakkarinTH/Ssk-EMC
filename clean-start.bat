@echo off
echo ========================================
echo COMPLETE CLEAN RESTART (WEBPACK MODE)
echo ========================================

echo 1. Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Removing .next folder (Cache)...
rmdir /s /q .next
echo    Cache cleared.

echo 3. Starting Server (Webpack Mode)...
echo    PLEASE WAIT... Initial compilation may take time.
echo    Go to http://localhost:3000 when ready.
echo ========================================

npm run dev
