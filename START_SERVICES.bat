@echo off
title AEC Smart Attendance - Launcher
color 0A

echo =====================================================================
echo    AEC SMART ATTENDANCE MANAGEMENT SYSTEM - ALL-IN-ONE LAUNCHER
echo =====================================================================
echo.
echo [*] Testing Coordinates : 26.140537, 91.656738 (Radius: 500m)
echo [*] ESP32 Connected Port: COM3
echo.
echo [1/3] Starting NestJS Backend API (Port 3001)...
start "NestJS Backend API [Port 3001]" cmd /k "cd /d e:\attendence system && npm run dev:backend"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Python Biometric AI Service (Port 8000)...
start "Python AI Biometrics [Port 8000]" cmd /k "cd /d e:\attendence system\backend\ai && venv\Scripts\python.exe main.py"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Next.js Frontend Dashboard (Port 3000)...
start "Next.js Frontend [Port 3000]" cmd /k "cd /d e:\attendence system && npm run dev:frontend"

echo.
echo =====================================================================
echo  ALL SERVICES LAUNCHED SUCCESSFULLY!
echo =====================================================================
echo.
echo  Access Points:
echo   - Web Application   : http://localhost:3000
echo   - Backend Swagger   : http://localhost:3001/api/docs
echo   - AI Service Health : http://localhost:8000/health
echo.
echo  Press any key to exit this launcher window (services keep running).
pause >nul
