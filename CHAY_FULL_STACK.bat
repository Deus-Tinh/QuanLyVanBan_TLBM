@echo off
title KHOI CHAY FULL STACK TLBM (DJANGO + REACT)

echo ================================================================
echo   KHOI CHAY TOAN BO HE THONG TLBM (BACKEND + FRONTEND)
echo   GVHD: NCS.ThS. Tran Phuong Duy
echo   PM / Truong Nhom: Chau Tuan Kiet (Nhom 1)
echo ================================================================
echo.

:: 1. Khoi dong Django Backend
echo [1/3] Dang khoi dong Django Backend (Port 8000)...
cd /d "%~dp0backend"
start "Django Backend (Port 8000)" cmd /k "python manage.py runserver"

:: 2. Khoi dong React Frontend
echo [2/3] Dang khoi dong React Frontend (Port 5173)...
cd /d "%~dp0frontend"
start "React Frontend (Port 5173)" cmd /k "npx -y pnpm run dev"

:: 3. Cho 3 giay de server san sang va mo trinh duyet
echo [3/3] Dang mo trinh duyet web...
ping 127.0.0.1 -n 4 >nul

start http://127.0.0.1:8000/
start http://localhost:5173/

echo.
echo ================================================================
echo   CA 2 SERVER DA HOAT DONG!
echo   * Backend Django: http://127.0.0.1:8000/
echo   * Frontend React:  http://localhost:5173/
echo.
echo   Cua so nay se tu dong dong sau vai giay.
echo ================================================================

ping 127.0.0.1 -n 3 >nul
exit
