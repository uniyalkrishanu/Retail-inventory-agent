@echo off
echo ==========================================
echo   Stopping Retail Inventory Agent
echo ==========================================
echo.

echo Closing Backend Server...
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1

echo Closing Frontend Client...
taskkill /FI "WINDOWTITLE eq Frontend Client*" /T /F >nul 2>&1

:: Also kill orphaned processes just in case
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM python.exe /FI "MODULES eq python311.dll" /F >nul 2>&1

echo.
echo All services stopped.
timeout /t 2 /nobreak >nul
exit
