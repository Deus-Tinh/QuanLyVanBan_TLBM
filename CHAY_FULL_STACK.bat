@echo off
title KHOI CHAY FULL STACK TLBM (DJANGO + REACT TS)

echo ================================================================
echo   KHOI CHAY HE THONG QLVB & TLBM (DJANGO + REACT TYPESCRIPT)
echo ================================================================
echo.

:: 1. Khoi dong Backend Django (Kiem tra va kich hoat venv neu co)
echo [1/2] Khoi dong Django Backend (Port 8000)...
cd /d "%~dp0backend"
if exist ".venv\Scripts\activate.bat" (
    start "Django Backend (Port 8000)" cmd /k "call .venv\Scripts\activate.bat && python manage.py runserver"
) else if exist "venv\Scripts\activate.bat" (
    start "Django Backend (Port 8000)" cmd /k "call venv\Scripts\activate.bat && python manage.py runserver"
) else (
    start "Django Backend (Port 8000)" cmd /k "python manage.py runserver"
)

:: 2. Khoi dong Frontend React Vite bang pnpm
echo [2/2] Khoi dong React Frontend Vite (Port 5173)...
cd /d "%~dp0frontend"
start "React Frontend (Port 5173)" cmd /k "pnpm dev"

:: 3. Doi 3 giay va tu dong mo trinh duyet vao Dashboard
timeout /t 3 >nul
start http://localhost:5173/dashboard

exit