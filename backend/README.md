# TLBM SYSTEM — BACKEND API SERVICE
> **Phân hệ Máy chủ & API Dữ liệu (Django 5.x + Python)**  
> **Dự án**: Quản Lý Văn Bản và Tài Liệu (QLVB&TL) — Trường CĐ CNTT TP.HCM (ITC)

---

## 🛠️ 1. Công nghệ & Yêu cầu môi trường

- **Framework**: Django 5.x (Python Web Framework)
- **Python**: Khuyến nghị Python 3.10 trở lên
- **Database**: SQLite (môi trường phát triển nội bộ), có thể chuyển đổi PostgreSQL cho Production
- **API Architecture**: RESTful API, JSON responses

---

## 📂 2. Cấu trúc thư mục Backend

```text
backend/
├── config/                     # Cấu hình dự án Django chính
│   ├── settings.py             # Cấu hình Database, Installed Apps, Middleware, CORS
│   ├── urls.py                 # Định tuyến API cấp cao nhất
│   ├── wsgi.py                 # Cổng WSGI chạy Production
│   └── asgi.py                 # Cổng ASGI hỗ trợ Async / WebSocket
│
├── apps/                       # Các ứng dụng nghiệp vụ Django
│   ├── birthdays/              # Module dữ liệu sinh nhật CBNV (Nhóm 7 / Dashboard Nhóm 1)
│   └── ...                     # Các module khác đang tích hợp (documents, records,...)
│
├── db.sqlite3                  # Cơ sở dữ liệu SQLite cục bộ
└── manage.py                   # Script quản trị lệnh Django CLI
```

---

## 🚀 3. Hướng dẫn cài đặt & Khởi chạy

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Khởi tạo môi trường ảo (tùy chọn nhưng khuyến nghị)
python -m venv venv

# Kích hoạt môi trường ảo:
# Trên Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Trên Windows Command Prompt:
.\venv\Scripts\activate.bat

# 3. Cập nhật các bảng cơ sở dữ liệu
python manage.py migrate

# 4. (Tùy chọn) Tạo tài khoản quản trị tối cao Django Admin
python manage.py createsuperuser

# 5. Khởi chạy máy chủ Backend (Port 8000)
python manage.py runserver 127.0.0.1:8000
```

Truy cập:
- **Trang chủ Backend**: `http://127.0.0.1:8000/`
- **Django Admin Portal**: `http://127.0.0.1:8000/admin/`

---

## 🔗 4. Kết nối với Frontend React

- Frontend gọi đến Backend qua base URL: `http://127.0.0.1:8000/`
- Cấu hình CORS đã được thiết lập sẵn trong `config/settings.py` cho phép nguồn `http://localhost:5173` và `http://localhost:5174`.
