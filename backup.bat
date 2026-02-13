@echo off
setlocal enabledelayedexpansion

REM ===========================================
REM MongoDB Backup Script for Windows
REM ===========================================

echo ==========================================
echo Starting MongoDB Backup
echo ==========================================

REM Load MONGODB_URI from .env file
set "MONGODB_URI="
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if "%%a"=="MONGODB_URI" set "MONGODB_URI=%%b"
)

REM Check if MONGODB_URI is set
if "%MONGODB_URI%"=="" (
    echo Error: MONGODB_URI is not set in .env file
    echo Please add MONGODB_URI=your_connection_string to .env
    exit /b 1
)

REM Configuration
set "BACKUP_DIR=backups"
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set DATESTAMP=%%d%%b%%c
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIMESTAMP=%%a%%b
set "BACKUP_NAME=backup-%DATESTAMP%-%TIMESTAMP%"
set "BACKUP_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Time: %date% %time%
echo Backup Path: %BACKUP_PATH%
echo ==========================================

REM Check if mongodump exists
where mongodump >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Error: mongodump not found!
    echo.
    echo Please install MongoDB Database Tools:
    echo https://www.mongodb.com/try/download/database-tools
    echo.
    echo After installing, add the bin folder to your PATH
    echo or run mongodump directly from its install location.
    echo ==========================================
    exit /b 1
)

REM Perform backup
echo Running mongodump...
mongodump --uri="%MONGODB_URI%" --out="%BACKUP_PATH%"

if %errorlevel% equ 0 (
    echo ==========================================
    echo [SUCCESS] Backup completed successfully!
    echo Location: %BACKUP_PATH%
    echo ==========================================
    echo.
    echo Available backups:
    dir /ad /b "%BACKUP_DIR%"
    echo ==========================================
) else (
    echo ==========================================
    echo [FAILED] Backup failed!
    echo Please check your MONGODB_URI and try again
    echo ==========================================
    exit /b 1
)

endlocal
