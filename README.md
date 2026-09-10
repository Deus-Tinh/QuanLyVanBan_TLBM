# QuanLyVanBan_TLBM — HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (TLBM)

- **Môn học:** ITC - Lập trình Django (MĐ501911)
- **Giảng viên hướng dẫn & BA:** NCS.ThS. Trần Phương Duy
- **Trưởng nhóm & Project Manager (PM):** Châu Tuấn Kiệt (Nhóm 1 - Phụ trách Layout & Dashboard)
- **Kho mã nguồn:** [https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git)

---

## 📂 Cấu Trúc Dự Án (3 Thư Mục & 1 File README)

```text
DoAnCuoiKy/
│
├── backend/                         # [Thư mục 1] Mã nguồn Django Backend chuẩn Thầy Duy (MVT)
│   ├── manage.py                    # CLI thực thi của Django
│   ├── run_server.bat               # File 1-click khởi động Django Server
│   ├── requirements.txt             # Khai báo gói phụ thuộc Django
│   ├── db.sqlite3                   # Cơ sở dữ liệu SQLite đã nạp 8 nhân sự mẫu
│   ├── QuanLyVanBan_TLBM/           # Package cấu hình chính (settings.py, urls.py, wsgi.py)
│   ├── dashboard/                   # App Nhóm 1: Layout hệ thống & Dashboard Trang chủ
│   ├── birthdays/                   # App Nhóm 7: Phân hệ 7.2 Quản lý Sinh nhật CBNV
│   ├── documents/                   # App Nhóm 2: Quản lý Văn bản (Đến, Đi, Mật)
│   ├── templates/                   # Giao diện Django Templates (base.html, dashboard, birthdays...)
│   └── static/                      # CSS (base_layout.css, birthday_system.css), JS, Images
│
├── frontend/                        # [Thư mục 2] Ứng dụng Client SPA (React 18 + Vite 6)
│   ├── src/
│   │   ├── components/              # Layout, Header, Birthday, AI, Common
│   │   ├── pages/                   # BirthdayPage.jsx, DashboardPage.jsx
│   │   ├── services/                # api.js, birthdayService.js, notificationService.js
│   │   ├── hooks/                   # useTheme.js, useCalendar.js, useDropdown.js
│   │   ├── utils/                   # dateFormatter.js (HH:mm:ss DD/MM/YYYY), constants.js
│   │   ├── assets/                  # Styles và hình ảnh nền lưới nen_XamDen.png
│   │   └── main.js                  # Entry point React
│   ├── public/                      # Tài nguyên tĩnh
│   ├── package.json                 # Khai báo React, Vite, canvas-confetti
│   └── pnpm-lock.yaml               # File khóa gói package pnpm
│
├── tai lieu tham khao/              # [Thư mục 3] Toàn bộ đề cương, tài liệu yêu cầu & bản vẽ mẫu
│   ├── ITC - Django - QLVB&TL.md    # Bản đặc tả chi tiết phân công 8 nhóm của Thầy Duy
│   ├── ITC - Django - QLVB&TL.xlsx  # Bảng tính phân bổ khối lượng đồ án
│   ├── chi tiết công việc.txt       # Ghi chú phân công chi tiết
│   └── mockups/                     # Bản vẽ giao diện HTML mẫu ban đầu
│
└── README.md                        # [File duy nhất ở root] Tài liệu hướng dẫn hệ thống
```

---

## 🚀 Hướng Dẫn Vận Hành

### 1. Chạy Backend Django (Thư mục `backend/`)
- **Cách 1 (Tiện lợi nhất):** Mở thư mục `backend/` và bấm đúp chuột vào file `run_server.bat`.
- **Cách 2 (Dòng lệnh):**
  ```bash
  cd backend
  python manage.py runserver
  ```
  - **Trang chủ Dashboard (Nhóm 1):** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
  - **Phân hệ 7.2 Sinh nhật CBNV:** [http://127.0.0.1:8000/birthdays/](http://127.0.0.1:8000/birthdays/)
  - **Trang Quản trị Admin:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

### 2. Chạy Frontend React (Thư mục `frontend/`)
```bash
cd frontend
pnpm run dev
# Hoặc: npx pnpm run dev
```
Truy cập giao diện React: [http://localhost:5173/](http://localhost:5173/)

---

## 👥 Phân Công Nhóm & Mapping Branch

| Nhóm | Branch tích hợp | Module phụ trách | Trưởng nhóm |
| :---: | :--- | :--- | :--- |
| **1** | `1_layout_home` | Layout hệ thống, Dashboard Trang chủ | **Châu Tuấn Kiệt (PM)** |
| **2** | `2_documents` | Quản lý Văn bản (Đến, Đi, Mật) | Lê Trí Kiệt |
| **3** | `3_dossiers_documents` | Quản lý Hồ sơ, Loại văn bản | Phan Thị Ánh Tuyền |
| **4** | `4_documents_templates` | Quản lý Tài liệu, Biểu mẫu | Thượng Mạnh Quỳnh |
| **5** | `5_signing_workflow` | Quản lý Trình ký số | Lê Thanh Hậu (DevOps) |
| **6** | `6_tasks` | Quản lý Giao việc & Xử lý công việc | Phan Tạ Hữu Đức |
| **7** | `7_meeting_rooms_birthdays_system` | Phòng họp, Sinh nhật CBNV (Mục 7.2), Quản trị | Tô Thanh Tân (DA) |
| **8** | `8_ai_chatbox` | Chatbot AI hỗ trợ tra cứu tài liệu | Trần Vũ Giang Anh |

---

## 📖 Hướng Dẫn Git Workflow

> Xem chi tiết đầy đủ tại file [`README_CachDuaLenGit.md`](./README_CachDuaLenGit.md)
