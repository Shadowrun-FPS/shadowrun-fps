@echo off
REM Batch script to kill process on port 3000
REM Usage: scripts\kill-port.bat [port]

set PORT=%1
if "%PORT%"=="" set PORT=3000

echo Finding process on port %PORT%...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%.*LISTENING"') do (
    echo Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Failed to kill process %%a
    ) else (
        echo Successfully killed process %%a
    )
    goto :done
)

echo Port %PORT% is free
:done

timeout /t 1 /nobreak >nul
echo.
echo Port %PORT% status:
netstat -ano | findstr ":%PORT%.*LISTENING"

