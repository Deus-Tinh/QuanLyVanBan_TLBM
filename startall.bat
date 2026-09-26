@echo off
chcp 65001 >nul
title KHOI CHAY FULL STACK - TLBM SYSTEM

echo ============================================================
echo    HE THONG QUAN LY VAN BAN VA TAI LIEU (QLVB^&TL)
echo           KHOI CHAY FULL STACK LOCALHOST
echo ============================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 1. Kiem tra file .env
if not exist ".env" (
    if exist ".env.example" (
        echo [THIET LAP] Tao file .env tu .env.example...
        copy ".env.example" ".env" >nul
        echo [OK] Da tao .env
    )
) else (
    echo [OK] File .env da ton tai.
)

:: 2. Kiem tra virtual environment
echo.
echo [1/3] Kiem tra Backend Django...
if not exist "backend\.venv\Scripts\python.exe" (
    echo [+] Dang tao moi truong ao Python ^(.venv^)...
    python -m venv "backend\.venv"
    if errorlevel 1 (
        echo [LOI] Khong the tao .venv. Vui long kiem tra Python da cai chua.
        pause
        exit /b 1
    )
    echo [+] Dang cai dat thu vien Python...
    call "backend\.venv\Scripts\pip.exe" install -r "backend\requirements.txt"
) else (
    echo [OK] .venv va thu vien backend da co san.
)

:: Chay migrations
echo [+] Chay migrate co so du lieu...
call "backend\.venv\Scripts\python.exe" "backend\manage.py" migrate --no-input
echo [OK] Migration hoan tat.

:: 3. Kiem tra Frontend
echo.
echo [2/3] Kiem tra Frontend React Vite...
if not exist "frontend\node_modules" (
    echo [+] Chua co node_modules, dang chay pnpm install...
    cd /d "%ROOT_DIR%frontend"
    call pnpm install
    cd /d "%ROOT_DIR%"
) else (
    echo [OK] node_modules da co san.
)

:: 4. Khoi dong 2 server song song
echo.
echo [3/3] Dang khoi dong cac may chu phat trien...

echo [+] Khoi chay Backend Django tai http://127.0.0.1:8000/
start "TLBM - Backend Django" cmd /k "title TLBM Backend Django && cd /d %ROOT_DIR%backend && .venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

echo [+] Khoi chay Frontend Vite tai http://localhost:5173/
start "TLBM - Frontend Vite" cmd /k "title TLBM Frontend Vite && cd /d %ROOT_DIR%frontend && pnpm dev"

:: 5. Cho server san sang roi mo trinh duyet
echo.
echo Dang cho cac server khoi dong (5 giay)...
timeout /t 5 /nobreak >nul

echo Mo trinh duyet...
start http://localhost:5173/dashboard

echo.
echo ============================================================
echo   [THANH CONG] HE THONG DANG CHAY!
echo.
echo   Frontend : http://localhost:5173/dashboard
echo   Backend  : http://127.0.0.1:8000/api/
echo   Admin    : http://127.0.0.1:8000/admin/
echo.
echo   Tai khoan test:
echo     admin / Admin@123
echo     canbo / Canbo@123
echo ============================================================
echo.
echo (Ban co the dong cua so nay. Hai server van chay o cua so rieng.)
pause
