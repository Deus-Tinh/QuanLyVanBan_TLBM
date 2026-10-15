@echo off
setlocal
chcp 65001 >nul
title KHOI DONG DU AN QUAN LY VAN BAN VA TAI LIEU MAT - NHOM 2

echo ===============================================================================
echo        HE THONG QUAN LY VAN BAN VA TAI LIEU MAT - NHOM 2
echo ===============================================================================
echo.

:: 1. Kiem tra Python
echo [1/3] Kiem tra Python...
python --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python trong bien moi truong PATH!
    pause
    exit /b 1
)

:: 2. Kiem tra Node.js
echo [2/3] Kiem tra Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js trong bien moi truong PATH!
    pause
    exit /b 1
)

:: 3. Khoi dong Backend va Frontend
echo [3/3] Dang khoi dong Backend va Frontend...
echo.

echo   * Dang bat Backend Django tai http://127.0.0.1:8000 ...
pushd "%~dp0backend"
start "QLVB - Backend [Django :8000]" cmd /k "chcp 65001 >nul & title QLVB - Backend [Django :8000] & python manage.py runserver 127.0.0.1:8000"
popd

echo   * Dang bat Frontend React tai http://localhost:5173 ...
pushd "%~dp0frontend"
start "QLVB - Frontend [React :5173]" cmd /k "chcp 65001 >nul & title QLVB - Frontend [React :5173] & call npm run dev"
popd

echo.
echo Dang cho cac dich vu khoi dong [khoang 3 giay]...
ping -n 4 127.0.0.1 >nul

echo Dang mo giao dien he thong tren trinh duyet...
start http://localhost:5173

cls
echo ===============================================================================
echo        HE THONG QUAN LY VAN BAN VA TAI LIEU MAT - NHOM 2
echo ===============================================================================
echo.
echo   [TRANG THAI] Backend va Frontend dang chay trong 2 cua so CMD rieng biet:
echo.
echo   + Frontend [Giao dien React]:     http://localhost:5173
echo   + Backend API [Django REST]:      http://127.0.0.1:8000/
echo   + Trang quan tri Django Admin:    http://127.0.0.1:8000/admin/
echo.
echo   -----------------------------------------------------------------------------
echo   [TAI KHOAN DANG NHAP THU NGHIEM]:
echo   + Quan tri vien [Admin]:    admin    /  Admin@123   - Toan quyen quan tri
echo   + Can bo xu ly [Staff]:     canbo    /  Canbo@123   - Quan ly van ban
echo   -----------------------------------------------------------------------------
echo.
echo   [HUONG DAN]:
echo   - Giu 2 cua so CMD Backend va Frontend mo trong suot qua trinh test.
echo   - De dung he thong, chay file DUNG_DU_AN.bat hoac dong 2 cua so CMD do.
echo ===============================================================================
echo.
pause
