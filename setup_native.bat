@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo   Retail Inventory Agent - Native Setup
echo ==========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 goto INSTALL_PYTHON
goto CHECK_NODE

:INSTALL_PYTHON
echo [INFO] Python not found. Attempting auto-install via winget...
winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
if !errorlevel! equ 0 goto PYTHON_INSTALLED

echo [WARNING] winget install failed (likely certificate issues).
echo [INFO] Attempting direct download fallback via PowerShell...
powershell -Command "& { $url = 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe'; $out = 'python_installer.exe'; echo 'Downloading Python 3.11...'; Invoke-WebRequest -Uri $url -OutFile $out; echo 'Launching installer...'; Start-Process $out -ArgumentList '/quiet', 'InstallAllUsers=1', 'PrependPath=1' -Wait; Remove-Item $out; }"

python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Python auto-install failed.
    echo Please install Python 3.9+ manually from: https://www.python.org/
    pause
    exit /b 1
)

:PYTHON_INSTALLED
echo.
echo [SUCCESS] Python has been installed.
echo IMPORTANT: You MUST close this window and run 'setup_native.bat' again to continue.
echo This is required for Windows to recognize the new Python commands.
pause
exit /b 0

:CHECK_NODE
:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 goto INSTALL_NODE
goto START_SETUP

:INSTALL_NODE
echo [INFO] Node.js not found. Attempting auto-install via winget...
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
if !errorlevel! equ 0 goto NODE_INSTALLED

echo [WARNING] winget install failed (likely certificate issues).
echo [INFO] Attempting direct download fallback via PowerShell...
powershell -Command "& { $url = 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi'; $out = 'node_installer.msi'; echo 'Downloading Node.js LTS...'; Invoke-WebRequest -Uri $url -OutFile $out; echo 'Launching installer...'; Start-Process msiexec.exe -ArgumentList '/i', $out, '/passive' -Wait; Remove-Item $out; }"

node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Node.js auto-install failed.
    echo Please install Node.js manually from: https://nodejs.org/
    echo Select the 'LTS' version.
    pause
    exit /b 1
)

:NODE_INSTALLED
echo.
echo [SUCCESS] Node.js has been installed.
echo IMPORTANT: You MUST close this window and run 'setup_native.bat' again to continue.
echo This is required for Windows to recognize the new Node commands.
pause
exit /b 0

:START_SETUP
echo [1/4] Setting up Python Virtual Environment...
if not exist "backend\venv" (
    python -m venv backend\venv
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created.
) else (
    echo [INFO] Virtual environment already exists.
)

echo.
echo [2/4] Installing/Updating Backend Dependencies...
echo This may take a few minutes depending on your internet speed...
call backend\venv\Scripts\activate
if !errorlevel! neq 0 (
    echo [ERROR] Failed to activate virtual environment.
    pause
    exit /b 1
)

echo Upgrading pip...
python -m pip install --upgrade pip
echo Installing requirements...
call pip install -r backend\requirements.txt
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Failed to install Python packages. 
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies installed.

echo.
echo [3/4] Initializing/Verifying Database...
echo Running: python backend\init_db.py
python backend\init_db.py
if !errorlevel! neq 0 (
    echo [ERROR] Database initialization failed.
    pause
    exit /b 1
)
echo [SUCCESS] Database ready.
call deactivate

echo.
echo [4/4] Installing Frontend Dependencies...
echo This will download several Node.js packages...
if not exist "frontend\package.json" (
    echo [ERROR] frontend\package.json not found!
    pause
    exit /b 1
)

cd frontend
call npm install
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Failed to install frontend dependencies.
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
exit /b 0
