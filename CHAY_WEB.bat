@echo off
chcp 65001 > nul
title HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (TLBM) - ITC DJANGO
cls

echo =====================================================================
echo       HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (TLBM) - ITC
echo   Môn học: Lập trình Django (MĐ501911) - Giảng viên: Trần Phương Duy
echo   Trưởng nhóm & Project Manager: Châu Tuấn Kiệt (Nhóm 1)
echo =====================================================================
echo.
echo [*] Đang chuẩn bị môi trường...

:: Di chuyển đến thư mục backend
cd /d "%~dp0backend"

:: Kiểm tra python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Không tìm thấy Python trên máy tính! Vui lòng cài đặt Python và tick chọn 'Add Python to PATH'.
    pause
    exit /b 1
)

echo [1/3] Đang khởi động Django Development Server tại cổng 8000...
start "Django Server - QuanLyVanBan_TLBM" cmd /k "python manage.py runserver"

echo [2/3] Đang chờ máy chủ sẵn sàng trong 3 giây...
timeout /t 3 /nobreak > nul

echo [3/3] Đang tự động mở Website trên trình duyệt mặc định...
start http://127.0.0.1:8000/

echo.
echo =====================================================================
echo   ĐÃ KHỞI ĐỘNG THÀNH CÔNG VÀ MỞ WEBSITE TRÊN TRÌNH DUYỆT!
echo.
echo   * Trang chủ hệ thống:      http://127.0.0.1:8000/
echo   * Phân hệ 7.2 (Sinh nhật): http://127.0.0.1:8000/birthdays/
echo   * Quản trị Admin:          http://127.0.0.1:8000/admin/
echo.
echo   [Lưu ý] Để tắt Server, bạn chỉ cần đóng cửa sổ 'Django Server'
echo =====================================================================
echo.
pause
