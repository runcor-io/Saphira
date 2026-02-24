@echo off
chcp 65001 >nul
setlocal

title Saphire AI - Database Migrations

:: Colors
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

:: Get script directory
cd /d "%~dp0"

:: Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo %RED%[ERROR] Virtual environment not found!%RESET%
    echo %YELLOW%Please run setup.bat first.%RESET%
    pause
    exit /b 1
)

:: Activate virtual environment
call venv\Scripts\activate.bat
echo %GREEN%[OK] Virtual environment activated%RESET%
echo.

:: Check if .env exists
if not exist ".env" (
    echo %RED%[ERROR] .env file not found!%RESET%
    echo %YELLOW%Please create .env file from .env.example%RESET%
    pause
    exit /b 1
)

:: Parse arguments
if "%~1"=="" goto :menu
if "%~1"=="upgrade" goto :upgrade
if "%~1"=="downgrade" goto :downgrade
if "%~1"=="revision" goto :revision
if "%~1"=="history" goto :history
if "%~1"=="current" goto :current
if "%~1"=="stamp" goto :stamp

goto :help

:menu
echo %GREEN%========================================%RESET%
echo %GREEN%   Database Migration Manager          %RESET%
echo %GREEN%========================================%RESET%
echo.
echo Usage: migrate.bat [command]
echo.
echo Available commands:
echo   upgrade     - Run all pending migrations
echo   downgrade - Revert last migration
echo   revision  - Create new migration
echo   history   - Show migration history
echo   current   - Show current revision
echo   stamp     - Stamp database with specific revision
.
echo.
set /p CMD="Enter command: "
if "%CMD%"=="" goto :end
if "%CMD%"=="upgrade" goto :upgrade
if "%CMD%"=="downgrade" goto :downgrade
if "%CMD%"=="revision" goto :revision
if "%CMD%"=="history" goto :history
if "%CMD%"=="current" goto :current
if "%CMD%"=="stamp" goto :stamp
echo %RED%Unknown command%RESET%
pause
goto :end

:upgrade
echo.
echo %YELLOW%[INFO] Running migrations (upgrade head)...%RESET%
alembic upgrade head
if errorlevel 1 (
    echo %RED%[ERROR] Migration failed%RESET%
    pause
    exit /b 1
)
echo %GREEN%[OK] Migrations completed successfully%RESET%
pause
goto :end

:downgrade
echo.
echo %YELLOW%[WARNING] This will revert the last migration%RESET%
set /p CONFIRM="Are you sure? (y/n): "
if /i not "%CONFIRM%"=="y" goto :end

echo %YELLOW%[INFO] Reverting last migration...%RESET%
alembic downgrade -1
if errorlevel 1 (
    echo %RED%[ERROR] Downgrade failed%RESET%
    pause
    exit /b 1
)
echo %GREEN%[OK] Downgrade completed%RESET%
pause
goto :end

:revision
echo.
set /p MSG="Enter migration message: "
if "%MSG%"=="" (
    echo %RED%[ERROR] Migration message is required%RESET%
    pause
    exit /b 1
)
echo %YELLOW%[INFO] Creating new migration...%RESET%
alembic revision --autogenerate -m "%MSG%"
if errorlevel 1 (
    echo %RED%[ERROR] Failed to create migration%RESET%
    pause
    exit /b 1
)
echo %GREEN%[OK] Migration created%RESET%
pause
goto :end

:history
echo.
echo %YELLOW%[INFO] Migration history:%RESET%
alembic history --verbose
goto :end

:current
echo.
echo %YELLOW%[INFO] Current revision:%RESET%
alembic current
goto :end

:stamp
echo.
set /p REV="Enter revision to stamp: "
if "%REV%"=="" (
    echo %RED%[ERROR] Revision is required%RESET%
    pause
    exit /b 1
)
echo %YELLOW%[INFO] Stamping database with revision %REV%...%RESET%
alembic stamp %REV%
if errorlevel 1 (
    echo %RED%[ERROR] Stamp failed%RESET%
    pause
    exit /b 1
)
echo %GREEN%[OK] Database stamped%RESET%
pause
goto :end

:help
echo Usage: migrate.bat [upgrade^|downgrade^|revision^|history^|current^|stamp]

:end
endlocal
