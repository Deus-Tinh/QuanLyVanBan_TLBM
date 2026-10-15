@echo off
chcp 65001 >nul
title TLBM - Dev Launcher
cd /d "%~dp0"

if not "%~1"=="" (
    set "choice=%~1"
    goto PROCESS_CHOICE
)

:MENU
cls
echo ======================================================================
echo          TLBM - HE THONG QUAN LY VAN BAN VA TAI LIEU - NHOM 3
echo ======================================================================
echo.
echo  [1] Khoi chay toan bo: Backend Django + Frontend Vite
echo  [2] Chi chay Backend: Django API (127.0.0.1:8000)
echo  [3] Chi chay Frontend: Vite React (http://localhost:5173)
echo  [4] Kiem tra Technical Gates: Build, i18n, Tokens, Tests
echo  [5] Dat lai mat khau admin thanh Admin@123
echo  [0] Thoat
echo.
echo ======================================================================
set "choice="
set /p choice="Nhap lua chon [0-5]: "

:PROCESS_CHOICE
if "%choice%"=="1" goto START_ALL
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_FRONTEND
if "%choice%"=="4" goto RUN_QUALITY_GATES
if "%choice%"=="5" goto RESET_ADMIN_PASSWORD
if "%choice%"=="0" goto EXIT_SCRIPT

echo.
echo [!] Lua chon khong hop le.
if "%~1"=="" pause
goto MENU

:START_ALL
echo.
echo [1/2] Dang mo Backend Django trong cua so rieng...
start "TLBM Backend - Django" cmd /k "chcp 65001 >nul & cd /d %~dp0 & set PYTHONPATH=. & backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000"
echo.
echo [2/2] Dang mo Frontend Vite trong cua so rieng...
start "TLBM Frontend - Vite" cmd /k "chcp 65001 >nul & cd /d %~dp0 & pnpm dev"
echo.
echo [OK] Da mo Backend va Frontend trong 2 terminal rieng!
echo      - Backend:  http://127.0.0.1:8000
echo      - Frontend: http://localhost:5173
echo.
if "%~1"=="" pause
goto MENU

:START_BACKEND
echo.
echo Dang mo Backend Django...
start "TLBM Backend - Django" cmd /k "chcp 65001 >nul & cd /d %~dp0 & set PYTHONPATH=. & backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000"
if not "%~1"=="" goto EXIT_SCRIPT
goto MENU

:START_FRONTEND
echo.
echo Dang mo Frontend Vite...
start "TLBM Frontend - Vite" cmd /k "chcp 65001 >nul & cd /d %~dp0 & pnpm dev"
if not "%~1"=="" goto EXIT_SCRIPT
goto MENU

:RUN_QUALITY_GATES
echo.
echo ======================================================================
echo                 KIEM TRA CONG CHAT LUONG KY THUAT
echo ======================================================================
echo.
echo [1/4] Kiem tra i18n (vi/en) phan he Records...
call pnpm --dir frontend run check:records:i18n
if errorlevel 1 (
    echo [ERROR] Loi kiem tra i18n!
    if "%~1"=="" pause
    goto MENU
)

echo.
echo [2/4] Kiem tra CSS Design Tokens phan he Records...
call pnpm --dir frontend run check:records:tokens
if errorlevel 1 (
    echo [ERROR] Loi CSS Design Tokens!
    if "%~1"=="" pause
    goto MENU
)

echo.
echo [3/4] Kiem tra TypeScript build...
call pnpm --dir frontend run build
if errorlevel 1 (
    echo [ERROR] Loi build Frontend!
    if "%~1"=="" pause
    goto MENU
)

echo.
echo [4/4] Chay Unit Tests Backend phan he Records...
set PYTHONPATH=.
backend\.venv\Scripts\python.exe backend\manage.py test apps.records.tests apps.records.test_review_contract apps.records.test_index_adoption
if errorlevel 1 (
    echo [ERROR] Loi Backend Tests!
    if "%~1"=="" pause
    goto MENU
)

echo.
echo ======================================================================
echo [THANH CONG] Toan bo 4 cong kiem dinh ky thuat deu DAT (PASS)!
echo ======================================================================
echo.
if "%~1"=="" pause
goto MENU

:RESET_ADMIN_PASSWORD
echo.
echo Dang cap nhat mat khau cho tai khoan admin...
backend\.venv\Scripts\python.exe -c "import sys, os; sys.path.insert(0, 'backend'); sys.path.insert(0, 'backend/apps'); import django; os.environ['DJANGO_SETTINGS_MODULE']='config.settings'; django.setup(); from accounts.models import Employee; u = Employee.objects.get(username='admin'); u.set_password('Admin@123'); u.save(); print('[OK] Mat khau admin da duoc dat thanh: Admin@123')"
echo.
pause
goto MENU

:EXIT_SCRIPT
exit /b 0
