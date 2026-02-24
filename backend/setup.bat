@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Saphire AI - Backend Setup

:: Colors
set "GREEN=[92m"
set "BLUE=[94m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

echo %BLUE%========================================%RESET%
echo %BLUE%   Saphire AI - Backend Setup Script   %RESET%
echo %BLUE%========================================%RESET%
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Python is not installed or not in PATH%RESET%
    echo %YELLOW%Please install Python 3.11 or higher from https://python.org%RESET%
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('python --version 2^>^&1') do set PYTHON_VERSION=%%a
echo %GREEN%[OK] Found: %PYTHON_VERSION%%RESET%

:: Check Python version (minimum 3.9)
python -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)" >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Python 3.9 or higher is required%RESET%
    pause
    exit /b 1
)

:: Get script directory
cd /d "%~dp0"
echo %GREEN%[OK] Working directory: %CD%%RESET%

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo.
    echo %YELLOW%[INFO] Creating virtual environment...%RESET%
    python -m venv venv
    if errorlevel 1 (
        echo %RED%[ERROR] Failed to create virtual environment%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%[OK] Virtual environment created%RESET%
) else (
    echo %GREEN%[OK] Virtual environment already exists%RESET%
)

:: Activate virtual environment
echo.
echo %YELLOW%[INFO] Activating virtual environment...%RESET%
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo %RED%[ERROR] Failed to activate virtual environment%RESET%
    pause
    exit /b 1
)
echo %GREEN%[OK] Virtual environment activated%RESET%

:: Upgrade pip
echo.
echo %YELLOW%[INFO] Upgrading pip...%RESET%
python -m pip install --upgrade pip
if errorlevel 1 (
    echo %RED%[WARNING] Failed to upgrade pip, continuing...%RESET%
)

:: Install dependencies
echo.
echo %YELLOW%[INFO] Installing dependencies...%RESET%
echo This may take a few minutes...
echo.

pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo %RED%[ERROR] Failed to install dependencies%RESET%
    pause
    exit /b 1
)
echo.
echo %GREEN%[OK] Dependencies installed successfully%RESET%

:: Create .env file if it doesn't exist
echo.
if not exist ".env" (
    echo %YELLOW%[INFO] Creating .env file from template...%RESET%
    copy .env.example .env >nul
    echo %GREEN%[OK] .env file created%RESET%
    echo %YELLOW%[WARNING] Please edit .env file with your actual API keys!%RESET%
) else (
    echo %GREEN%[OK] .env file already exists%RESET%
)

:: Create __init__.py files if missing (ensures packages are recognized)
echo.
echo %YELLOW%[INFO] Checking package structure...%RESET%

if not exist "app\ai\__init__.py" (
    type nul > "app\ai\__init__.py"
    echo %GREEN%  [OK] Created app\ai\__init__.py%RESET%
)

if not exist "app\voice_engine\__init__.py" (
    type nul > "app\voice_engine\__init__.py"
    echo %GREEN%  [OK] Created app\voice_engine\__init__.py%RESET%
)

if not exist "app\payment\__init__.py" (
    type nul > "app\payment\__init__.py"
    echo %GREEN%  [OK] Created app\payment\__init__.py%RESET%
)

if not exist "app\persona_engine\__init__.py" (
    type nul > "app\persona_engine\__init__.py"
    echo %GREEN%  [OK] Created app\persona_engine\__init__.py%RESET%
)

if not exist "app\persona_engine\personas\__init__.py" (
    type nul > "app\persona_engine\personas\__init__.py"
    echo %GREEN%  [OK] Created app\persona_engine\personas\__init__.py%RESET%
)

if not exist "app\persona_engine\prompts\__init__.py" (
    type nul > "app\persona_engine\prompts\__init__.py"
    echo %GREEN%  [OK] Created app\persona_engine\prompts\__init__.py%RESET%
)

if not exist "app\persona_engine\evaluators\__init__.py" (
    type nul > "app\persona_engine\evaluators\__init__.py"
    echo %GREEN%  [OK] Created app\persona_engine\evaluators\__init__.py%RESET%
)

if not exist "scripts\__init__.py" (
    type nul > "scripts\__init__.py"
    echo %GREEN%  [OK] Created scripts\__init__.py%RESET%
)

if not exist "tests\__init__.py" (
    type nul > "tests\__init__.py"
    echo %GREEN%  [OK] Created tests\__init__.py%RESET%
)

:: Success message
echo.
echo %GREEN%========================================%RESET%
echo %GREEN%   Setup completed successfully!       %RESET%
echo %GREEN%========================================%RESET%
echo.

:: Show next steps
echo %BLUE%Next steps:%RESET%
echo.
echo 1. %YELLOW%Configure your .env file with actual API keys:%RESET%
echo    - OPENAI_API_KEY
echo    - PAYSTACK_SECRET_KEY
echo    - PAYSTACK_PUBLIC_KEY
echo    - ELEVENLABS_API_KEY
echo    - SECRET_KEY (generate with: openssl rand -hex 32)
echo    - DATABASE_URL
echo.
echo 2. %YELLOW%Run database migrations (optional):%RESET%
echo    alembic upgrade head
echo.
echo 3. %YELLOW%Start the development server:%RESET%
echo    uvicorn app.main:app --reload
echo.
echo 4. %YELLOW%Or use the start.bat script:%RESET%
echo    .\start.bat

:: Ask if user wants to start server now
echo.
set /p START_SERVER="Start the server now? (y/n): "
if /i "%START_SERVER%"=="y" (
    echo.
    echo %YELLOW%[INFO] Starting development server...%RESET%
    echo %BLUE%Press Ctrl+C to stop%RESET%
    echo.
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) else (
    echo.
    echo %BLUE%Setup complete. Virtual environment is still activated.%RESET%
    echo %BLUE%Type 'deactivate' to exit the virtual environment.%RESET%
    cmd /k
)

endlocal
