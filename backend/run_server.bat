@echo off
chcp 65001 > nul
echo ===================================================
echo   HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (TLBM)
echo   Môn học: ITC - Lập trình Django (MĐ501911)
echo   Giảng viên hướng dẫn: NCS.ThS. Trần Phương Duy
echo   Trưởng nhóm & Project Manager: Châu Tuấn Kiệt
echo ===================================================
echo.
echo Đang khởi động Django Development Server...
echo Truy cập Website: http://127.0.0.1:8000/
echo Truy cập Phân hệ 7.2: http://127.0.0.1:8000/birthdays/
echo Truy cập Admin:   http://127.0.0.1:8000/admin/
echo.
echo Nhấn Ctrl + C để dừng server.
echo.

python manage.py runserver
pause
