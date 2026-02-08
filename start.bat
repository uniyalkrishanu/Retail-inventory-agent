@echo off
title Retail Inventory Agent - Launcher
color 0A

echo.
echo ============================================
echo    RETAIL INVENTORY AGENT - LAUNCHER
echo ============================================
echo.

:: Check if Docker is installed
echo [1/4] Checking if Docker is installed...
docker --version > nul 2> nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ERROR: Docker is not installed!
    echo.
    echo  Please install Docker Desktop from:
    echo  https://www.docker.com/products/docker-desktop
    echo.
    echo  After installation, restart your computer and run this again.
    echo.
    pause
    exit /b 1
)
echo    [OK] Docker is installed.

:: Check if Docker is running
echo [2/4] Checking if Docker is running...
docker info > nul 2> nul
if %errorlevel% neq 0 (
    color 0E
    echo.
    echo  WARNING: Docker is not running!
    echo.
    echo  Please start Docker Desktop manually.
    echo  Look for the Docker whale icon in your system tray.
    echo.
    echo  Waiting for Docker to start...
    
:WAIT_DOCKER
    timeout /t 5 /nobreak > nul
    docker info > nul 2> nul
    if %errorlevel% neq 0 (
        echo    Still waiting for Docker...
        goto WAIT_DOCKER
    )
)
echo    [OK] Docker is running.

:: Build and start containers
echo [3/4] Building and starting the application...
echo    (This may take a few minutes on first run)
echo.

docker-compose up -d --build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  ERROR: Failed to start the application!
    echo.
    echo  Possible reasons:
    echo  - Port 3000 or 8000 may be in use
    echo  - Docker may not have enough memory
    echo  - Network issues
    echo.
    echo  Try running: stop.bat
    echo  Then run this script again.
    echo.
    pause
    exit /b 1
)

:: Success!
echo.
echo [4/4] Application is starting...
timeout /t 3 /nobreak > nul

echo.
echo ============================================
echo    SUCCESS! Application is running.
echo ============================================
echo.
echo  Open your web browser and go to:
echo.
echo     http://localhost:3000
echo.
echo  (Or press any key to open automatically)
echo ============================================
echo.
echo  To stop the application later, run: stop.bat
echo.

pause
start http://localhost:3000
