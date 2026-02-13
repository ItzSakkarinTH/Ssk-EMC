@echo off
setlocal enabledelayedexpansion

REM ===========================================
REM Complete Docker Deployment Script for Windows
REM Backup → Build → Push → Deploy
REM ===========================================

REM Configuration
set "DOCKER_USERNAME=itzharukixyz"
set "IMAGE_NAME=sisaket-ems"
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set DATESTAMP=%%d%%b%%c
for /f "tokens=1-2 delims=:. " %%a in ('echo %time%') do set TIMESTAMP=%%a%%b
set "VERSION=v%DATESTAMP%-%TIMESTAMP%"

echo ==========================================
echo Docker Deployment Script
echo ==========================================
echo Time: %date% %time%
echo ==========================================

REM Step 1: Backup Database
echo.
echo ===== Step 1: Backup Database =====
if exist "backup.bat" (
    call backup.bat
) else (
    echo Warning: backup.bat not found, skipping backup...
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Error: Docker is not running!
    echo Please start Docker Desktop and try again.
    exit /b 1
)

REM Step 2: Build Docker Image
echo.
echo ===== Step 2: Build Docker Image =====
docker build -t %IMAGE_NAME%:latest .
if %errorlevel% neq 0 (
    echo [FAILED] Build failed!
    exit /b 1
)
echo [SUCCESS] Build completed

REM Step 3: Tag Images
echo.
echo ===== Step 3: Tag Images =====
docker tag %IMAGE_NAME%:latest %DOCKER_USERNAME%/%IMAGE_NAME%:latest
docker tag %IMAGE_NAME%:latest %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%
echo [SUCCESS] Tagged as:
echo   - %DOCKER_USERNAME%/%IMAGE_NAME%:latest
echo   - %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%

REM Step 4: Push to Docker Hub
echo.
echo ===== Step 4: Push to Docker Hub =====
set /p PUSH_CONFIRM="Do you want to push to Docker Hub? (y/n): "
if /i "%PUSH_CONFIRM%"=="y" (
    echo Pushing images to Docker Hub...
    docker push %DOCKER_USERNAME%/%IMAGE_NAME%:latest
    docker push %DOCKER_USERNAME%/%IMAGE_NAME%:%VERSION%
    if %errorlevel% equ 0 (
        echo [SUCCESS] Push completed
    ) else (
        echo [WARNING] Push failed - you may need to run: docker login
    )
) else (
    echo Skipping push to Docker Hub
)

REM Step 5: Deploy with Docker Compose
echo.
echo ===== Step 5: Deploy with Docker Compose =====
set /p DEPLOY_CONFIRM="Do you want to deploy now? (y/n): "
if /i "%DEPLOY_CONFIRM%"=="y" (
    echo Stopping existing containers...
    docker-compose down
    
    echo Starting new containers...
    docker-compose up -d
    
    echo.
    echo [SUCCESS] Deployment completed
    echo.
    echo ===== Container Status =====
    docker-compose ps
    
    echo.
    echo ===== Viewing Logs =====
    echo Press Ctrl+C to exit log view
    timeout /t 2 >nul
    docker-compose logs -f app
) else (
    echo Skipping deployment
)

echo.
echo ==========================================
echo Deployment script finished!
echo ==========================================

endlocal
