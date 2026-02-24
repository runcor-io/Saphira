@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Saphire AI - Backend Server

:: Colors
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

:: Get script directory
cd /d "%~dp0"

:: Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo %RED%[ERROR] Virtual environment not found!%RESET%
    echo %YELLOW%Please run setup.bat first to set up the environment.%RESET%
    pause
    exit /b 1
)

:: Check if .env exists
if not exist ".env" (
    echo %RED%[WARNING] .env file not found!%RESET%
    echo %YELLOW%Please copy .env.example to .env and configure it.%RESET%
    echo.
    set /p CREATE_ENV="Create .env from template now? (y/n): "
    if /i "!CREATE_ENV!"=="y" (
        copy .env.example .env >nul
        echo %GREEN%[OK] .env file created. Please edit it before continuing.%RESET%
        pause
        exit /b 0
    )
)

echo %BLUE%========================================%RESET%
echo %BLUE%   Saphire AI - Starting Server        %RESET%
echo %BLUE%========================================%RESET%
echo.

:: Activate virtual environment
echo %YELLOW%[INFO] Activating virtual environment...%RESET%
call venv\Scripts\activate.bat

:: Check if activation succeeded
python -c "import sys; print('VENV:', 'venv' in sys.executable)" | findstr "True" >nul
if errorlevel 1 (
    echo %RED%[WARNING] Virtual environment may not be properly activated%RESET%
    echo %YELLOW%[INFO] Continuing anyway...%RESET%
)

echo %GREEN%[OK] Environment ready%RESET%
echo.

:: Show configuration
echo %BLUE%Configuration:%RESET%
for /f "tokens=*" %%a in ('python --version 2^>^&1') do echo   Python: %%a

:: Check if main.py exists
if not exist "app\main.py" (
    echo %RED%[ERROR] app\main.py not found!%RESET%
    echo %YELLOW%Make sure you're in the correct directory.%RESET%
    pause
    exit /b 1
)

:: Parse command line arguments
set "HOST=0.0.0.0"
set "PORT=8000"
set "RELOAD=--reload"
set "LOG_LEVEL=info"

:parse_args
if "%~1"=="" goto :done_parse
if "%~1"=="--host" (
    set "HOST=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="--port" (
    set "PORT=%~2"
    shift
    shift
    goto :parse_args
)
if "%~1"=="--no-reload" (
    set "RELOAD="
    shift
    goto :parse_args
)
if "%~1"=="--log-level" (
    set "LOG_LEVEL=%~2"
    shift
    shift
    goto :parse_args
)
shift
goto :parse_args
:done_parse

echo   Host: %HOST%
echo   Port: %PORT%
echo   Reload: %RELOAD%enabled
if not defined RELOAD echo   Reload: disabled
echo   Log Level: %LOG_LEVEL%
echo.

:: Start server
echo %GREEN%[OK] Starting Uvicorn server...%RESET%
echo %YELLOW%Press Ctrl+C to stop the server%RESET%
echo.
echo %BLUE%----------------------------------------%RESET%
echo API Documentation will be available at:
echo   - Swagger UI: http://localhost:%PORT%/docs
echo   - ReDoc:      http://localhost:%PORT%/redoc
echo %BLUE%----------------------------------------%RESET%
echo.

:: Run uvicorn
uvicorn app.main:app --host %HOST% --port %PORT% %RELOAD% --log-level %LOG_LEVEL%

:: Handle exit
if errorlevel 1 (
    echo.
    echo %RED%[ERROR] Server exited with an error%RESET%
    echo.
    echo %YELLOW%Common issues:%RESET%
    echo   - Port %PORT% is already in use
    echo   - Database is not accessible
    echo   - Missing environment variables
    echo.
    pause
)

echo.
echo %BLUE%Server stopped%RESET%
echo.
set /p RESTART="Restart server? (y/n): "
if /i "%RESTART%"=="y" (
    call %0 %*
)

endlocal
