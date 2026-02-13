@echo off
setlocal enabledelayedexpansion

REM ===========================================
REM MongoDB Restore Script for Windows
REM ===========================================

echo ==========================================
echo Starting MongoDB Restore
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
    pause
    exit /b 1
)

REM Configuration
set "BACKUP_DIR=backups"

REM Check if backups directory exists
if not exist "%BACKUP_DIR%" (
    echo Error: No backups directory found!
    pause
    exit /b 1
)

echo Available backups:
echo ------------------------------------------
dir /ad /b "%BACKUP_DIR%"
echo ------------------------------------------
echo.

set /p BACKUP_NAME="Enter the backup folder name to restore: "

if "%BACKUP_NAME%"=="" (
    echo Error: Backup name cannot be empty.
    pause
    exit /b 1
)

if not exist "%BACKUP_DIR%\%BACKUP_NAME%" (
    echo Error: Backup folder '%BACKUP_NAME%' not found in %BACKUP_DIR%
    pause
    exit /b 1
)

set "RESTORE_PATH=%BACKUP_DIR%\%BACKUP_NAME%"

REM Check if mongorestore exists
where mongorestore >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Error: mongorestore not found!
    echo.
    echo Please install MongoDB Database Tools:
    echo https://www.mongodb.com/try/download/database-tools
    echo.
    echo After installing, add the bin folder to your PATH.
    echo ==========================================
    pause
    exit /b 1
)

echo.
echo [WARNING] This will overwrite existing data in the database!
set /p CONFIRM="Are you sure you want to restore from %BACKUP_NAME%? (y/n): "

if /i "%CONFIRM%" neq "y" (
    echo Restore cancelled.
    pause
    exit /b 1
)

REM Perform restore
echo.
echo Running mongorestore...
REM --drop ensures the existing collections are dropped before restoring
mongorestore --uri="%MONGODB_URI%" --drop "%RESTORE_PATH%"

if %errorlevel% equ 0 (
    echo ==========================================
    echo [SUCCESS] Restore completed successfully!
    echo Restored from: %RESTORE_PATH%
    echo ==========================================
) else (
    echo ==========================================
    echo [FAILED] Restore failed!
    echo Please check your connection and backup files.
    echo ==========================================
)

pause
endlocal
