@echo off
title KHOI CHAY FULL STACK TLBM (DJANGO + REACT TS)

echo ================================================================
echo   KHOI CHAY HE THONG QLVB & TLBM (DJANGO + REACT TYPESCRIPT)
echo ================================================================
echo.

:: 1. Khoi dong Backend Django
echo [1/2] Khoi dong Django Backend (Port 8000)...
cd /d "%~dp0backend"
start "Django Backend" cmd /k "python manage.py runserver"

:: 2. Khoi dong Frontend React Vite
echo [2/2] Khoi dong React TypeScript (Port 5173)...
cd /d "%~dp0frontend"
start "React Frontend" cmd /k "npm run dev"

timeout /t 3 >nul
start http://127.0.0.1:8000/
start http://localhost:5173/

exit
