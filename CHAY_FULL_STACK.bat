@echo off
chcp 65001 > nul
title KHOI CHAY HE THONG QLVB & TLBM (FULL STACK)

echo ======================================================================
echo    HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (DJANGO + REACT TYPESCRIPT)
echo             BẢN KHỞI CHẠY TỰ ĐỘNG CHO MÁY MỚI (AUTO-SETUP)
echo ======================================================================
echo.

:: ----------------------------------------------------------------------
:: BƯỚC 1: KIỂM TRA MÔI TRƯỜNG NODE.JS & NPM
:: ----------------------------------------------------------------------
echo [1/4] Đang kiểm tra môi trường Node.js & npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ======================================================================
    echo [LỖI]: MÁY CỦA BẠN CHƯA CÀI ĐẶT NODE.JS HOẶC CHƯA CẤU HÌNH PATH!
    echo ======================================================================
    echo - Dự án React TypeScript bắt buộc cần có môi trường Node.js để chạy.
    echo - Cách khắc phục:
    echo   1. Tải và cài đặt Node.js LTS tại: https://nodejs.org/
    echo   2. Trong lúc cài đặt, đảm bảo đã chọn tick "Add to PATH".
    echo   3. Cài đặt xong hãy khởi động lại Command Prompt/VS Code rồi chạy lại file này.
    echo ======================================================================
    echo.
    pause
    exit /b 1
)
echo  -> Node.js và npm: ĐÃ SẴN SÀNG!
echo.

:: ----------------------------------------------------------------------
:: BƯỚC 2: KIỂM TRA MÔI TRƯỜNG PYTHON
:: ----------------------------------------------------------------------
echo [2/4] Đang kiểm tra môi trường Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ======================================================================
    echo [LỖI]: MÁY CỦA BẠN CHƯA CÀI ĐẶT PYTHON HOẶC CHƯA CẤU HÌNH PATH!
    echo ======================================================================
    echo - Backend Django bắt buộc cần có Python 3.10+ để hoạt động.
    echo - Cách khắc phục:
    echo   1. Tải Python tại: https://www.python.org/downloads/
    echo   2. RẤT QUAN TRỌNG: Nhớ tích chọn ô [X] "Add python.exe to PATH" khi cài!
    echo   3. Sau đó mở lại file này để tiếp tục.
    echo ======================================================================
    echo.
    pause
    exit /b 1
)
echo  -> Python: ĐÃ SẴN SÀNG!
echo.

:: ----------------------------------------------------------------------
:: BƯỚC 3: TỰ ĐỘNG CÀI ĐẶT THƯ VIỆN FRONTEND (NẾU MÁY MỚI CHƯA CÓ NODE_MODULES)
:: ----------------------------------------------------------------------
echo [3/4] Kiểm tra thư mục thư viện Frontend (node_modules)...
if not exist "%~dp0frontend\node_modules" (
    echo.
    echo ======================================================================
    echo [PHÁT HIỆN]: Máy mới vừa kéo mã nguồn từ Git về, chưa có 'node_modules'.
    echo Đang tự động tiến hành cài đặt toàn bộ thư viện cần thiết (npm install)...
    echo Quá trình này chỉ diễn ra 1 lần duy nhất, vui lòng chờ trong giây lát!
    echo ======================================================================
    echo.
    cd /d "%~dp0frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [LỖI]: Cài đặt thư viện npm thất bại! Vui lòng kiểm tra kết nối mạng Internet.
        pause
        exit /b 1
    )
    echo.
    echo [THÀNH CÔNG]: Đã cài đặt xong toàn bộ thư viện Frontend!
    echo.
) else (
    echo  -> Thư mục node_modules: ĐÃ TỒN TẠI!
)
echo.

:: ----------------------------------------------------------------------
:: BƯỚC 4: ĐỒNG BỘ CƠ SỞ DỮ LIỆU BACKEND (MIGRATE)
:: ----------------------------------------------------------------------
echo [4/4] Kiểm tra và đồng bộ cơ sở dữ liệu Django Backend...
cd /d "%~dp0backend"
python manage.py migrate --noinput >nul 2>nul
echo  -> Cơ sở dữ liệu: ĐÃ ĐỒNG BỘ!
echo.

:: ----------------------------------------------------------------------
:: BƯỚC 5: KHỞI ĐỘNG CẢ 2 MÁY CHỦ (BACKEND + FRONTEND)
:: ----------------------------------------------------------------------
echo ======================================================================
echo    ĐANG KHỞI CHẠY HỆ THỐNG FULL-STACK TRÊN 2 TIẾN TRÌNH ĐỘC LẬP...
echo ======================================================================
echo  - Backend Django : http://127.0.0.1:8000/
echo  - Frontend React : http://localhost:5173/
echo ======================================================================
echo.

:: Khởi động Django Backend
cd /d "%~dp0backend"
start "TLBM - Backend Django (Port 8000)" cmd /k "chcp 65001 >nul && title Backend Django [8000] && python manage.py runserver"

:: Khởi động Frontend React
cd /d "%~dp0frontend"
start "TLBM - Frontend React Vite (Port 5173)" cmd /k "chcp 65001 >nul && title Frontend React Vite [5173] && npm run dev"

:: Đợi 3 giây để máy chủ khởi động rồi tự động bật trình duyệt
timeout /t 3 >nul
start http://localhost:5173/

echo [HOÀN TẤT] Hệ thống đã được khởi chạy thành công!
echo Bạn có thể đóng cửa sổ này, 2 tiến trình máy chủ đang chạy nền.
timeout /t 2 >nul
exit
