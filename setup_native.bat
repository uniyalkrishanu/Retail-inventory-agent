@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   Retail Inventory Agent - Native Setup
echo ==========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Python not found. Attempting auto-install via winget...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if !errorlevel! neq 0 (
        echo [ERROR] Python auto-install failed. Please install Python 3.9+ manually from python.org
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Python has been installed.
    echo IMPORTANT: You MUST close this window and run 'setup_native.bat' again to continue.
    echo This is required for Windows to recognize the new Python commands.
    pause
    exit /b 0
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js not found. Attempting auto-install via winget...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if !errorlevel! neq 0 (
        echo [ERROR] Node.js auto-install failed. Please install Node.js manually from nodejs.org
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Node.js has been installed.
    echo IMPORTANT: You MUST close this window and run 'setup_native.bat' again to continue.
    echo This is required for Windows to recognize the new Node commands.
    pause
    exit /b 0
)

echo [1/4] Setting up Python Virtual Environment...
if not exist "backend\venv" (
    python -m venv backend\venv
    echo [SUCCESS] Virtual environment created.
) else (
    echo [INFO] Virtual environment already exists.
)

echo.
echo [2/4] Installing/Updating Backend Dependencies...
echo This may take a few minutes depending on your internet speed...
call backend\venv\Scripts\activate
echo Virtual environment activated.
echo Using Python:
python --version
echo Upgrading pip...
python -m pip install --upgrade pip
echo Installing requirements...
call pip install -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install Python packages. 
    echo Please see the error messages above for details.
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed.
pause

echo.
echo [3/4] Initializing/Verifying Database...
echo Ensuring database is seeded with default users...
echo Running: python backend\init_db.py
python backend\init_db.py
if %errorlevel% neq 0 (
    echo [ERROR] Database initialization failed.
    pause
    exit /b 1
)
echo [SUCCESS] Database ready.
pause
pause
call deactivate
echo Virtual environment deactivated.

echo.
echo [4/4] Installing Frontend Dependencies...
echo This will download several Node.js packages...
cd frontend
if not exist "package.json" (
    echo [ERROR] package.json not found in frontend folder!
    cd ..
    pause
    exit /b 1
)
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install frontend dependencies.
    echo Please ensure Node.js is installed correctly.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Frontend dependencies installed.

echo.
echo ==========================================
echo   Setup Complete!
echo   Run 'start_native.bat' to launch the app.
echo ==========================================
pause
