@echo off
chcp 65001 >nul
setlocal

title Saphire AI - Development Servers

:: Colors
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

:: Get script directory
cd /d "%~dp0"

echo %BLUE%========================================%RESET%
echo %BLUE%   Starting Development Servers        %RESET%
echo %BLUE%========================================%RESET%
echo.

:: Check backend
cd backend 2>nul
if errorlevel 1 (
    echo %RED%[ERROR] backend folder not found!%RESET%
    pause
    exit /b 1
)

if not exist "venv\Scripts\activate.bat" (
    echo %RED%[ERROR] Backend not set up!%RESET%
    echo %YELLOW%Please run setup.bat first.%RESET%
    pause
    exit /b 1
)

cd ..

:: Check frontend
cd frontend 2>nul
if errorlevel 1 (
    echo %RED%[ERROR] frontend folder not found!%RESET%
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo %YELLOW%[WARNING] Frontend dependencies not installed!%RESET%
    echo %YELLOW%Please run setup.bat first.%RESET%
    pause
    exit /b 1
)

:: Check for ElevenLabs API key
if "%ELEVENLABS_API_KEY%"=="" (
    echo %YELLOW%[WARNING] ELEVENLABS_API_KEY not set in environment%RESET%
    echo %YELLOW%Voice features will be disabled.%RESET%
    echo.
)

cd ..

echo %GREEN%[OK] Prerequisites verified%RESET%
echo.

:: Start Backend
echo %BLUE%[1/2] Starting Backend Server...%RESET%
start "Saphire AI - Backend" cmd /k "cd /d %~dp0backend && start.bat --no-reload"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend
echo %BLUE%[2/2] Starting Frontend Server...%RESET%
start "Saphire AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo %GREEN%========================================%RESET%
echo %GREEN%   Development servers starting...     %RESET%
echo %GREEN%========================================%RESET%
echo.
echo %YELLOW%Access your application:%RESET%
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Test Page: http://localhost:3000/dashboard/test
echo.
echo %BLUE%Press any key to stop all servers...%RESET%
pause >nul

echo.
echo %YELLOW%[INFO] Stopping servers...%RESET%

:: Kill Node.js processes (Next.js)
taskkill /F /IM node.exe >nul 2>&1

:: Kill Python processes (Uvicorn)
taskkill /F /IM python.exe >nul 2>&1

timeout /t 1 /nobreak >nul

echo %GREEN%[OK] All servers stopped%RESET%
echo.

endlocal
