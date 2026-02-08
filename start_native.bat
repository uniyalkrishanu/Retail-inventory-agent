@echo off
echo ==========================================
echo   Launching Retail Inventory Agent
echo ==========================================
echo.

:: Check if environment is set up
if not exist "backend\venv" set NEEDS_SETUP=1
if not exist "frontend\node_modules" set NEEDS_SETUP=1

if defined NEEDS_SETUP (
    echo [WARNING] Environment not fully set up. Running setup first...
    call setup_native.bat
)

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
