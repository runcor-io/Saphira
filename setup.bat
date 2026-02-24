@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Saphire AI - Project Setup

:: Colors
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

:: Get script directory
cd /d "%~dp0"

echo %BLUE%========================================%RESET%
echo %BLUE%   Saphire AI - Full Project Setup     %RESET%
echo %BLUE%========================================%RESET%
echo.
echo This script will set up both backend and frontend.
echo.

:: Check prerequisites
echo %YELLOW%[INFO] Checking prerequisites...%RESET%

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Python is not installed%RESET%
    echo Please install Python 3.11+ from https://python.org
    pause
    exit /b 1
)
echo %GREEN%  [OK] Python found%RESET%

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%  [WARNING] Node.js not found - frontend setup will be skipped%RESET%
    set "SKIP_FRONTEND=1"
) else (
    for /f "tokens=*" %%a in ('node --version 2^>^&1') do echo %GREEN%  [OK] Node.js %%a found%RESET%
)

echo.

:: ==========================================
:: BACKEND SETUP
:: ==========================================
echo %BLUE%========================================%RESET%
echo %BLUE%   Setting up Backend                  %RESET%
echo %BLUE%========================================%RESET%
echo.

if not exist "backend" (
    echo %RED%[ERROR] Backend folder not found!%RESET%
    pause
    exit /b 1
)

cd backend
call setup.bat
if errorlevel 1 (
    echo %RED%[ERROR] Backend setup failed%RESET%
    pause
    exit /b 1
)
cd ..

echo.
echo %GREEN%[OK] Backend setup complete!%RESET%
echo.

:: ==========================================
:: FRONTEND SETUP
:: ==========================================
if defined SKIP_FRONTEND goto :frontend_skipped

echo %BLUE%========================================%RESET%
echo %BLUE%   Setting up Frontend                 %RESET%
echo %BLUE%========================================%RESET%
echo.

if not exist "frontend" (
    echo %YELLOW%[WARNING] Frontend folder not found - skipping%RESET%
    goto :frontend_skipped
)

cd frontend

:: Check for package.json
if not exist "package.json" (
    echo %YELLOW%[WARNING] package.json not found in frontend - skipping%RESET%
    cd ..
    goto :frontend_skipped
)

echo %YELLOW%[INFO] Installing frontend dependencies...%RESET%
call npm install
if errorlevel 1 (
    echo %RED%[ERROR] Frontend dependency installation failed%RESET%
    cd ..
    pause
    exit /b 1
)

echo %GREEN%[OK] Frontend dependencies installed%RESET%
echo.

:: Create .env.local if it doesn't exist
if not exist ".env.local" (
    if exist ".env.example" (
        echo %YELLOW%[INFO] Creating .env.local from template...%RESET%
        copy .env.example .env.local >nul
        echo %GREEN%[OK] .env.local created%RESET%
        echo %YELLOW%[WARNING] Please edit .env.local with your configuration!%RESET%
    )
)

cd ..

echo %GREEN%[OK] Frontend setup complete!%RESET%
echo.

:frontend_skipped
if defined SKIP_FRONTEND (
    echo %YELLOW%[SKIPPED] Frontend setup (Node.js not found)%RESET%
    echo.
)

:: ==========================================
:: COMPLETION
:: ==========================================
echo %GREEN%========================================%RESET%
echo %GREEN%   Project Setup Complete!             %RESET%
echo %GREEN%========================================%RESET%
echo.

echo %BLUE%Next steps:%RESET%
echo.
echo %YELLOW%1. Configure environment variables:%RESET%
echo    - Edit backend\.env with your API keys
echo    - Edit frontend\.env.local with your settings
echo.
echo %YELLOW%2. Run database migrations:%RESET%
echo    cd backend
echo    migrate.bat upgrade
echo.
echo %YELLOW%3. Start the development servers:%RESET%
echo.
echo    Option A - Start both (requires Node.js):
echo    start-dev.bat
echo.
echo    Option B - Start backend only:
echo    cd backend
echo    start.bat
echo.

:: Ask to start development servers
set /p START_DEV="Start development servers now? (y/n): "
if /i "%START_DEV%"=="y" (
    call start-dev.bat
) else (
    echo.
    echo %BLUE%Setup complete!%RESET%
    echo.
    pause
)

endlocal
