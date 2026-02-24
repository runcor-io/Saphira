@echo off
chcp 65001 >nul
setlocal

title Saphire AI - Run Tests

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

:: Check for pytest
python -c "import pytest" 2>nul
if errorlevel 1 (
    echo %YELLOW%[INFO] Installing pytest...%RESET%
    pip install pytest pytest-asyncio pytest-cov
)

:: Default arguments
set "TEST_ARGS=-v"
set "COVERAGE="

:: Parse arguments
:parse_args
if "%~1"=="" goto :run_tests
if "%~1"=="--coverage" (
    set "COVERAGE=--cov=app --cov-report=term-missing --cov-report=html"
    shift
    goto :parse_args
)
if "%~1"=="--cov" (
    set "COVERAGE=--cov=app --cov-report=term-missing --cov-report=html"
    shift
    goto :parse_args
)
set "TEST_ARGS=%TEST_ARGS% %~1"
shift
goto :parse_args

:run_tests
echo %GREEN%========================================%RESET%
echo %GREEN%   Running Tests                       %RESET%
echo %GREEN%========================================%RESET%
echo.
echo %YELLOW%Test arguments: %TEST_ARGS%%RESET%
if defined COVERAGE echo %YELLOW%Coverage: enabled%RESET%
echo.

pytest tests\ %TEST_ARGS% %COVERAGE%

set "TEST_RESULT=%ERRORLEVEL%"

echo.
if %TEST_RESULT%==0 (
    echo %GREEN%[OK] All tests passed!%RESET%
) else (
    echo %RED%[FAILED] Some tests failed%RESET%
)

if defined COVERAGE (
    echo.
    echo %BLUE%Coverage report generated in htmlcov\index.html%RESET%
)

pause
endlocal
