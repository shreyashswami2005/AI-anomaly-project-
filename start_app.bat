@echo off
title AeroSemi AI Burn-In Screener Launcher
echo ========================================================
echo  Launching AI-Driven Component Burn-In Screening Suite
echo ========================================================

start "Backend Server (FastAPI :8000)" cmd /k "cd /d %~dp0 && powershell -ExecutionPolicy Bypass -File .\run_backend.ps1"
timeout /t 3 /nobreak >nul
start "Frontend Dashboard (Vite React :5173)" cmd /k "cd /d %~dp0 && powershell -ExecutionPolicy Bypass -File .\run_frontend.ps1"

echo.
echo Both servers are launching!
echo Backend API Docs: http://localhost:8000/docs
echo Web Dashboard:    http://localhost:5173
echo.
pause
