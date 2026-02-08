@echo off
title Retail Inventory Agent - Stop
color 0E

echo.
echo ============================================
echo    STOPPING RETAIL INVENTORY AGENT
echo ============================================
echo.

docker-compose down
if %errorlevel% neq 0 (
    echo.
    echo  WARNING: There was an issue stopping the containers.
    echo  They may not have been running.
    echo.
) else (
    echo.
    echo  Application stopped successfully.
    echo.
)

pause
