# HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (QLVB&TL)
> **Đồ Án Cuối Kỳ Môn Học Django — Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)**  
> **Tên thương hiệu hệ thống**: TLBM SYSTEM  
> **Kho lưu trữ chính**: [QuanLyVanBan_TLBM](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM)

---

## 📖 1. Giới thiệu tổng quan

Hệ thống **Quản Lý Văn Bản và Tài Liệu (QLVB&TL)** là giải pháp phần mềm nội bộ số hóa toàn bộ quy trình hành chính, xử lý công văn, tờ trình, biểu mẫu và luồng văn bản (đến, đi, mật) trong tổ chức/doanh nghiệp.

Hệ thống được phát triển theo mô hình **Full-Stack tách biệt**:
- **Backend**: Django 5.x / 6.x (Python) cung cấp RESTful APIs, CORS Middleware và xác thực người dùng.
- **Frontend**: React 19 + TypeScript + Vite, định tuyến URL bằng `react-router-dom` qua thẻ `<Outlet />`, quản lý gói thống nhất bằng **`pnpm`**, với 2 giao diện chuẩn mực (**Sleek Dark** & **Clean Light**) chuyển đổi tức thì 1-click.

---

## 👥 2. Cơ cấu tổ chức & Phân công nhiệm vụ

### Ban quản trị dự án (Core Team)
- **Project Manager (PM)**: Châu Tuấn Kiệt *(Trưởng Nhóm 1)*
- **Business Analyst (BA)**: Giảng viên phụ trách môn học (NCS.ThS. Trần Phương Duy)
- **Data Architect (DA)**: Tô Thanh Tân *(Trưởng Nhóm 7)*
- **DevOps Lead**: Lê Thanh Hậu *(Trưởng Nhóm 5)*

### Chi tiết phân công 8 Nhóm nghiệp vụ

| Nhóm | Trưởng nhóm & Thành viên | Module phụ trách | Phạm vi nghiệp vụ |
| :---: | :--- | :--- | :--- |
| **Nhóm 1** | **Châu Tuấn Kiệt (TN)**<br>Nguyễn Văn Hiếu<br>Nguyễn Duy Quân | **Layout, Dashboard & App Shell** | - Kiến trúc App Shell dùng chung cho 8 nhóm qua `<Outlet />`<br>- Header tinh gọn, Sidebar đa cấp (Facebook Accordion & Mini Dock), Footer hành chính<br>- Trang chủ Dashboard (KPI stats, sinh nhật, phòng họp, tìm kiếm tương tác)<br>- 2 Theme chuẩn mực (Clean Light & Sleek Dark), Auth UI & Trợ lý AI |
| **Nhóm 2** | **Lê Trí Kiệt (TN)**<br>Nguyễn Anh Đô<br>Nguyễn Tấn Lộc Khiêm<br>Trần Nhật Tân | **Văn Bản** | - Quản lý Văn bản Đến, Văn bản Đi, Văn bản Mật<br>- Bộ lọc, tìm kiếm, Import/Export Excel, phân quyền người xem |
| **Nhóm 3** | **Đặng Trường Thịnh (TN)**<br>Phan Thị Ánh Tuyền<br>Nguyễn Thị Yến Nhi | **Hồ Sơ** | - Danh mục hồ sơ cấp 1, cấp 2 (loại văn bản)<br>- Liên kết văn bản theo hồ sơ lưu trữ |
| **Nhóm 4** | **Thượng Mạnh Quỳnh (TN)**<br>Huỳnh Thị Kim Trang<br>Nguyễn Chí Tín<br>Đỗ Trung Phong | **Tài Liệu & Biểu Mẫu** | - Danh mục tài liệu, biểu mẫu chung và nội bộ phòng ban<br>- Quản lý file đính kèm, hiệu lực văn bản |
| **Nhóm 5** | **Lê Thanh Hậu (TN)**<br>Lê Thành Tài | **Trình Ký & DevOps** | - Quy trình trình ký văn bản nội bộ, sơ đồ ký điện tử<br>- Quản trị CI/CD, GitLab Staging & Production |
| **Nhóm 6** | **Phan Tạ Hữu Đức (TN)**<br>Nguyễn Duy Bảo<br>Đỗ Ngọc Phát<br>Lâm Chí Vĩ | **Công Việc** | - Giao việc, theo dõi tiến độ, phân công CBNV<br>- Trạng thái xử lý công việc và báo cáo hoàn thành |
| **Nhóm 7** | **Tô Thanh Tân (TN)**<br>Lê Duy Khánh<br>Đỗ Mạnh Quang<br>Nguyễn Phan Minh Hiếu<br>Trần Đình Tình | **Hệ Thống & Tiện Ích** | - Quản lý đơn vị, phòng ban, chức vụ, danh bạ CBNV<br>- Đặt phòng họp nội bộ và thông báo sinh nhật tự động |
| **Nhóm 8** | **Trần Vũ Giang Anh (TN)**<br>Huỳnh Vương Thanh Nhã | **Trợ Lý AI (Chatbox)** | - Box chat tra cứu nhanh quy trình, hỏi đáp văn bản đến/đi |

---

## 📁 3. Cấu trúc thư mục chuẩn & Quy chuẩn tài liệu

Thư mục tài liệu `docs/` được tổ chức thành các phân vùng chuẩn mực:
- `docs/common/`: Tài liệu kiến trúc tổng thể, quy trình Git và quy chuẩn lập trình dùng chung cho toàn bộ dự án.
- `docs/module/team_X/`: Phân chia thư mục đặc tả chi tiết cho 8 nhóm chuyên trách độc lập (ví dụ `docs/module/team_1/` của Nhóm 1).

```text
DoAnCuoiKy/
├── backend/                  # Mã nguồn Backend Django (Python)
│   ├── config/               # Thiết lập hệ thống (settings.py với CORS, urls, wsgi)
│   ├── apps/                 # Các module nghiệp vụ Django (birthdays, documents,...)
│   ├── requirements.txt      # Thư viện phụ thuộc Backend (Django, django-cors-headers, DRF)
│   ├── db.sqlite3            # Cơ sở dữ liệu nội bộ SQLite
│   └── manage.py             # Script quản trị Django
├── frontend/                 # Mã nguồn Frontend React + TypeScript + Vite
│   ├── src/
│   │   ├── app/              # Router (URL-based), App root, MainLayout (<Outlet />)
│   │   ├── modules/          # Phân hệ nghiệp vụ theo 8 nhóm (dashboard, documents,...)
│   │   └── shared/           # Components dùng chung (Header, Sidebar, Footer), Token CSS
│   ├── package.json
│   ├── pnpm-lock.yaml        # Khóa gói pnpm duy nhất của dự án
│   └── vite.config.ts
├── docs/                     # Hệ thống tài liệu dự án
│   ├── common/               # Tài liệu dùng chung 8 nhóm
│   └── module/               # Tài liệu bàn giao chuyên biệt từng nhóm
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
- **Frontend React Web**: `http://localhost:5173/`

---

### Cách 2: Khởi chạy thủ công từng phần

#### 1. Khởi chạy Backend (Django)
Yêu cầu đã cài đặt **Python 3.10+**:
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các gói phụ thuộc (Django, django-cors-headers, DRF)
pip install -r requirements.txt

# Khởi tạo cơ sở dữ liệu
python manage.py migrate

# Chạy máy chủ Django
python manage.py runserver 127.0.0.1:8000
```

#### 2. Khởi chạy Frontend (React + Vite)
Yêu cầu đã cài đặt **Node.js 18+** và **pnpm**:
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies bằng pnpm (thống nhất toàn dự án)
pnpm install

# Khởi chạy máy chủ phát triển
pnpm dev
```
Truy cập giao diện tại: `http://localhost:5173/`

---

## 🎨 5. Điểm nhấn kiến trúc nền tảng (Nhóm 1 — App Shell)

1. **Khung Layout dùng chung qua `<Outlet />`**:
   - Toàn bộ các trang (`/dashboard`, `/ai-assistant`, `/documents/incoming`, `/settings`...) đều thừa hưởng cố định **Header, Sidebar và Footer**.
   - Điều hướng chuẩn URL qua `react-router-dom`: Tải lại F5 giữ nguyên trang, hỗ trợ Back/Forward và chia sẻ Deep Link.

2. **Thanh điều hướng truyền thống đa cấp**:
   - Giao diện Facebook Accordion và Mini Dock linh hoạt, tự động mở rộng theo URL đang hiển thị.
   - Nhãn trạng thái rõ ràng cho từng phân hệ đang được phát triển bởi các nhóm 2 – 8.

3. **Hệ thống 2 Giao diện chuẩn mực (Clean Light & Sleek Dark)**:
   - Chuyển đổi nhanh 1-chạm qua biểu tượng Mặt trời / Mặt trăng trên Header.
   - Nền tảng CSS Variables chuẩn design system tại `frontend/src/shared/styles/variables.css`.

4. **Đăng nhập Mock Authentication minh bạch**:
   - Banner cảnh báo chế độ Prototype trong thời gian chờ API xác thực JWT Backend.
   - Nút đăng nhập nhanh 1-chạm theo quyền Quản trị viên (Admin) và Cán bộ chuyên viên.

---

## 📝 6. Quy chuẩn đóng góp mã nguồn (Git Workflow)

1. Mỗi nhóm làm việc trên branch riêng:
   - `1_layout_home` (Nhóm 1 - Layout & Dashboard)
   - `feature/nhom-2-van-ban`
   - `feature/nhom-3-ho-so`
   - ...
2. Không commit trực tiếp vào `staging` hay `main`, mọi thay đổi phải thông qua Pull Request (PR).
3. Sử dụng duy nhất **`pnpm`** cho frontend để bảo đảm tính toàn vẹn của `pnpm-lock.yaml`.

---
*Bản quyền © 2026 Nhóm 1 — Dự án QLVB&TL — Khoa CNTT Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC).*
