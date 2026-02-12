@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   Launching Retail Inventory Agent
echo ==========================================
echo.

:: Check for backend venv
if not exist "backend\venv" goto ERROR_SETUP

:: Check for frontend node_modules
if not exist "frontend\node_modules" goto ERROR_SETUP

:: Start Backend in a new window
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && call venv\Scripts\activate && python main.py"

:: Wait for backend to warm up
timeout /t 3 /nobreak >nul

:: Start Frontend in a new window
echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd frontend && npm run dev"

echo.
echo App is launching!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Close the command windows to stop the application.
timeout /t 5 /nobreak >nul
start http://localhost:3000
exit /b 0

:ERROR_SETUP
echo [WARNING] Environment not fully set up.
echo Launching setup_native.bat first...
echo.
pause
call setup_native.bat
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Setup failed. Cannot start application.
    pause
    exit /b 1
)
goto :EOF
