# HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (QLVB&TL)
> **Đồ Án Cuối Kỳ Môn Học Django — Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)**  
> **Tên thương hiệu hệ thống**: TLBM SYSTEM  
> **Kho lưu trữ chính**: [QuanLyVanBan_TLBM](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM)

---

## 📖 1. Giới thiệu tổng quan

Hệ thống **Quản Lý Văn Bản và Tài Liệu (QLVB&TL)** là giải pháp phần mềm nội bộ số hóa toàn bộ quy trình hành chính, xử lý công văn, tờ trình, biểu mẫu và luồng văn bản (đến, đi, mật) trong tổ chức/doanh nghiệp.

Hệ thống được phát triển theo mô hình **Full-Stack tách biệt**:
- **Backend**: Django 5.x (Python) cung cấp RESTful APIs và xác thực người dùng.
- **Frontend**: React 18 + TypeScript + Vite, giao diện Vanilla CSS chuẩn Design System hiện đại với 10 phong cách chuyển đổi tức thì.

---

## 👥 2. Cơ cấu tổ chức & Phân công nhiệm vụ

### Ban quản trị dự án (Core Team)
- **Project Manager (PM)**: Châu Tuấn Kiệt *(Trưởng Nhóm 1)*
- **Business Analyst (BA)**: Giảng viên phụ trách môn học
- **Data Architect (DA)**: Tô Thanh Tân *(Trưởng Nhóm 7)*
- **DevOps Lead**: Lê Thanh Hậu *(Trưởng Nhóm 5)*

### Chi tiết phân công 8 Nhóm nghiệp vụ

| Nhóm | Trưởng nhóm & Thành viên | Module phụ trách | Phạm vi nghiệp vụ |
| :---: | :--- | :--- | :--- |
| **Nhóm 1** | **Châu Tuấn Kiệt (TN)**<br>Nguyễn Văn Hiếu<br>Nguyễn Duy Quân | **Layout & Dashboard** | - Kiến trúc App Shell (Header, Sidebar cố định, Footer)<br>- Đăng nhập (CBNV & Admin), Trang cá nhân, Đổi MK<br>- Trang chủ Dashboard (8 khối thống kê, sinh nhật, lịch họp, tìm kiếm)<br>- Hệ thống 10 chủ đề giao diện đa phong cách |
| **Nhóm 2** | **Lê Trí Kiệt (TN)**<br>Nguyễn Anh Đô<br>Nguyễn Tấn Lộc Khiêm<br>Trần Nhật Tân | **Văn Bản** | - Quản lý Văn bản Đến, Văn bản Đi, Văn bản Mật<br>- Bộ lọc, tìm kiếm, Import/Export Excel, phân quyền người xem |
| **Nhóm 3** | **Đặng Trường Thịnh (TN)**<br>Phan Thị Ánh Tuyền<br>Nguyễn Thị Yến Nhi | **Hồ Sơ** | - Danh mục hồ sơ cấp 1, cấp 2 (loại văn bản)<br>- Liên kết văn bản theo hồ sơ lưu trữ |
| **Nhóm 4** | **Thượng Mạnh Quỳnh (TN)**<br>Huỳnh Thị Kim Trang<br>Nguyễn Chí Tín<br>Đỗ Trung Phong | **Tài Liệu & Biểu Mẫu** | - Danh mục tài liệu, biểu mẫu chung và nội bộ phòng ban<br>- Quản lý file đính kèm, hiệu lực văn bản |
| **Nhóm 5** | **Lê Thanh Hậu (TN)**<br>Lê Thành Tài | **Trình Ký & DevOps** | - Quy trình trình ký văn bản nội bộ, sơ đồ ký điện tử<br>- Quản trị CI/CD, GitLab Staging & Production |
| **Nhóm 6** | **Phan Tạ Hữu Đức (TN)**<br>Nguyễn Duy Bảo<br>Đỗ Ngọc Phát<br>Lâm Chí Vĩ | **Công Việc** | - Giao việc, theo dõi tiến độ, phân công CBNV<br>- Trạng thái xử lý công việc và báo cáo hoàn thành |
| **Nhóm 7** | **Tô Thanh Tân (TN)**<br>Lê Duy Khánh<br>Đỗ Mạnh Quang<br>Nguyễn Phan Minh Hiếu<br>Trần Đình Tình | **Hệ Thống & Tiện Ích** | - Quản lý đơn vị, phòng ban, chức vụ, danh bạ CBNV<br>- Đặt phòng họp nội bộ và thông báo sinh nhật tự động |
| **Nhóm 8** | **Trần Vũ Giang Anh (TN)**<br>Huỳnh Vương Thanh Nhã | **Trợ Lý AI (Chatbox)** | - Box chat tra cứu nhanh quy trình, hỏi đáp văn bản đến/đi |

---

## 📁 3. Cấu trúc thư mục chuẩn (`structure.md`)

```text
DoAnCuoiKy/
├── backend/                  # Mã nguồn Backend Django 5.x
│   ├── config/               # Thiết lập hệ thống (settings, urls, wsgi, asgi)
│   ├── apps/                 # Các module nghiệp vụ Django
│   │   ├── documents/        # Quản lý văn bản (Nhóm 2)
│   │   ├── birthdays/        # Quản lý sinh nhật (Nhóm 7 / Dashboard)
│   │   └── dashboard/        # Dữ liệu bảng điều khiển (Nhóm 1)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                 # Mã nguồn Frontend React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── app/              # Router, App root, Main layout
│   │   ├── modules/          # Module theo từng nhóm (dashboard, documents,...)
│   │   └── shared/           # Components dùng chung, CSS design system, utils
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Tài liệu kiến trúc và tham chiếu
│   ├── architecture/         # structure.md (Quy chuẩn cấu trúc)
│   └── references/           # Đề cương chi tiết môn học
├── .env.example              # File cấu hình môi trường mẫu
├── .gitignore
├── CHAY_FULL_STACK.bat       # Script khởi chạy 1-click cho Windows
└── README.md
```

---

## 🚀 4. Hướng dẫn cài đặt & Khởi chạy

### Cách 1: Khởi chạy 1-Click (Dành cho Windows)
Chỉ cần nhấp đúp vào file:
```cmd
CHAY_FULL_STACK.bat
```
Script sẽ tự động khởi động song song:
- **Backend Django API**: `http://127.0.0.1:8000/`
- **Frontend React Web**: `http://localhost:5173/` (hoặc `5174/`)

---

### Cách 2: Khởi chạy thủ công từng phần

#### 1. Khởi chạy Backend (Django)
Yêu cầu đã cài đặt **Python 3.10+**:
```bash
# Di chuyển vào thư mục backend
cd backend

# Kích hoạt môi trường ảo (nếu có) hoặc cài thư viện
pip install -r requirements.txt

# Khởi tạo cơ sở dữ liệu
python manage.py migrate

# Chạy máy chủ Django
python manage.py runserver 127.0.0.1:8000
```

#### 2. Khởi chạy Frontend (React + Vite)
Yêu cầu đã cài đặt **Node.js 18+**:
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
Truy cập giao diện tại: `http://localhost:5173/`

---

## 🎨 5. Điểm nhấn giao diện (Module 1 — Nhóm 1)

1. **Khung giao diện cố định (Fixed Shell)**:
   - Header và Sidebar luôn cố định khi cuộn trang; thanh cuộn chỉ hoạt động trong khung nội dung chính (`.page-viewport`).
   - Sidebar thông minh hiển thị liên tục đúng **6 icon dàn đều**, cuộn mượt tự nhiên bằng GPU và tự động căn chỉnh vị trí mục đang kích hoạt.
2. **Hệ thống 10 Chủ đề giao diện (Multi-Style Themes)**:
   - Tích hợp đầy đủ các phong cách thiết kế hiện đại chuyển đổi tức thì trên Header:
     - **Kinh điển**: *Sleek Dark*, *Clean Light*, *Minimalism (Thụy Sĩ phẳng)*.
     - **Kính mờ**: *Glassmorphism*, *Liquid Glass (Huyền ảo phản xạ lỏng)*.
     - **3D & Xúc giác**: *Neomorphism (Dập nổi)*, *Claymorphism (Đất sét 3D)*, *Skeuomorphism (Gờ kim loại cơ học)*.
     - **Nghệ thuật & Đột phá**: *Neo-Brutalism (Viền đen 2px pop-art)*, *Maximalism (Neon xếp lớp)*.
   - Nền menu Dropdown đặc 100% chống xuyên thấu và bố cục lưới 2 cột cân đối.
3. **Trang chủ Dashboard chuyên nghiệp**:
   - Đáp ứng đầy đủ 8 yêu cầu trong đề cương môn học của Nhóm 1.
   - Thể hiện rõ các thông báo gắn nhãn tiến độ: *"Nhóm X đang trong quá trình phát triển"* cho từng phân hệ phụ trách.

---

## 📝 6. Quy chuẩn đóng góp mã nguồn (Git Workflow)

1. Mỗi nhóm làm việc trên branch riêng theo cú pháp:
   - `feature/nhom-1-layout-dashboard`
   - `feature/nhom-2-van-ban`
   - `feature/nhom-3-ho-so`
   - ...
2. Không commit trực tiếp vào `main` hoặc `staging` mà phải tạo Merge Request (MR/PR) để PM/DevOps kiểm duyệt.
3. Tham chiếu chi tiết quy định cấu trúc code tại: [`docs/architecture/structure.md`](docs/architecture/structure.md).

---
*Bản quyền © 2026 Nhóm 1 — Dự án QLVB&TL — Khoa CNTT Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC).*

