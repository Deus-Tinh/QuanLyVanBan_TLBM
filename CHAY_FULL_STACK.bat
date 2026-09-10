@echo off
chcp 65001 > nul
title TOÀN BỘ HỆ THỐNG TLBM (DJANGO BACKEND + REACT FRONTEND)
cls

echo =====================================================================
echo       KHỞI CHẠY TOÀN DIỆN HỆ THỐNG TLBM (BACKEND + FRONTEND)
echo   Môn học: Lập trình Django (MĐ501911) - Giảng viên: Trần Phương Duy
echo   Trưởng nhóm & Project Manager: Châu Tuấn Kiệt (Nhóm 1)
echo =====================================================================
echo.

:: 1. Khởi động Django Backend
echo [1/4] Đang khởi động Django Backend (Port 8000)...
cd /d "%~dp0backend"
start "Django Backend (Port 8000)" cmd /k "python manage.py runserver"

:: 2. Khởi động React Frontend
echo [2/4] Đang khởi động React Frontend (Port 5173)...
cd /d "%~dp0frontend"
start "React Frontend (Port 5173)" cmd /k "npx -y pnpm run dev"

:: 3. Đợi server sẵn sàng
echo [3/4] Chờ máy chủ khởi động trong 4 giây...
timeout /t 4 /nobreak > nul

:: 4. Mở trình duyệt
echo [4/4] Đang tự động mở Website trên trình duyệt...
start http://127.0.0.1:8000/
start http://localhost:5173/

echo.
echo =====================================================================
echo   CẢ 2 SERVER ĐÃ HOẠT ĐỘNG!
echo   - Backend Django:  http://127.0.0.1:8000/
echo   - Frontend React:   http://localhost:5173/
echo.
echo   [Lưu ý] Để tắt hệ thống, đóng các cửa sổ cmd đang chạy server.
echo =====================================================================
echo.
pause
