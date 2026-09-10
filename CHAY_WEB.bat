@echo off
title KHOI DONG HE THONG QUAN LY VAN BAN VA TAI LIEU (TLBM)

echo ================================================================
echo   HE THONG QUAN LY VAN BAN VA TAI LIEU (TLBM) - ITC DJANGO
echo   GVHD: NCS.ThS. Tran Phuong Duy
echo   PM / Truong Nhom: Chau Tuan Kiet (Nhom 1)
echo ================================================================
echo.

:: Di chuyen den thu muc backend
cd /d "%~dp0backend"

:: Kiem tra Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Khong tim thay Python! Vui long kiem tra lai Python trong PATH.
    pause
    exit /b 1
)

echo [1/2] Dang khoi dong Django Web Server (Port 8000)...
start "Django Server - QuanLyVanBan_TLBM" cmd /k "python manage.py runserver"

echo [2/2] Dang mo trinh duyet web...
:: Cho 2 giay de Django server san sang
ping 127.0.0.1 -n 3 >nul

:: Tu dong mo trinh duyet web
start http://127.0.0.1:8000/

echo.
echo ================================================================
echo   DA KHOI DONG THANH CONG!
echo   * Trang chu:      http://127.0.0.1:8000/
echo   * Sinh nhat (7.2): http://127.0.0.1:8000/birthdays/
echo   * Admin:          http://127.0.0.1:8000/admin/
echo.
echo   Cua so nay se tu dong dong sau vai giay.
echo   Server Django van tiep tuc chay o cua so rieng.
echo ================================================================

ping 127.0.0.1 -n 3 >nul
exit
