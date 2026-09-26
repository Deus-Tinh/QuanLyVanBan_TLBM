@echo off
chcp 65001 > nul
title KHỞI CHẠY HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ BIỂU MẪU (QLVB)

echo =====================================================================
echo    🚀 HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU BIỂU MẪU (QLVB-TLBM)
echo =====================================================================
echo.

:: 1. Kiểm tra môi trường ảo Backend
if not exist "%~dp0backend\.venv\Scripts\activate.bat" (
    echo [!] CẢNH BÁO: Chưa tìm thấy môi trường ảo backend\.venv!
    echo Đang tự động khởi tạo môi trường ảo...
    python -m venv "%~dp0backend\.venv"
    call "%~dp0backend\.venv\Scripts\activate.bat"
    echo Đang cài đặt thư viện cho Backend...
    pip install -r "%~dp0backend\requirements.txt"
)

:: 2. Khởi chạy Backend Django
echo [*] Đang khởi chạy Django Backend (Port 8000)...
start "[QLVB] 1. Backend API (Django :8000)" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && python manage.py runserver 127.0.0.1:8000"

:: 3. Khởi chạy Frontend React Vite
echo [*] Đang khởi chạy React Frontend (Port 5173)...
start "[QLVB] 2. Frontend Web (React Vite :5173)" cmd /k "cd /d "%~dp0frontend" && pnpm dev"

:: 4. Chờ 3 giây để các tiến trình khởi động
echo [*] Đang chuẩn bị mở trình duyệt...
timeout /t 3 /nobreak > nul

:: 5. Mở trình duyệt vào trang ứng dụng
start http://localhost:5173/

echo.
echo =====================================================================
echo  ✅ HỆ THỐNG ĐÃ ĐƯỢC KHỞI CHẠY THÀNH CÔNG!
echo =====================================================================
echo  - Frontend React Vite:   http://localhost:5173/
echo  - Backend Django API:    http://127.0.0.1:8000/
echo  - Django Admin:          http://127.0.0.1:8000/admin/
echo  - Trang Demo Nhanh:      http://localhost:5173/resources-demo
echo.
echo  🔐 THÔNG TIN TÀI KHOẢN MẪU:
echo  1. Quản trị viên:    admin  / Admin@123
echo  2. Cán bộ văn thư:   canbo  / Canbo@123
echo =====================================================================
echo  (Hai cửa sổ Backend và Frontend đang chạy độc lập. Để dừng hệ thống,
echo   hãy đóng trực tiếp 2 cửa sổ cmd đó hoặc nhấn Ctrl + C bên trong)
echo.
pause
