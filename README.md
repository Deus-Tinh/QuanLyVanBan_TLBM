# HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (QLVB&TL)
> **Đồ Án Cuối Kỳ Môn Học Django — Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)**  
> **Tên thương hiệu hệ thống**: TLBM SYSTEM  
> **Kho lưu trữ chính**: [QuanLyVanBan_TLBM](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM)

---

## 📖 1. Giới thiệu tổng quan

Hệ thống **Quản Lý Văn Bản và Tài Liệu (QLVB&TL)** là giải pháp phần mềm nội bộ số hóa toàn bộ quy trình hành chính, xử lý công văn, tờ trình, biểu mẫu và luồng văn bản (đến, đi, mật) trong tổ chức/doanh nghiệp.

Hệ thống được phát triển theo mô hình **Full-Stack tách biệt**:
- **Backend**: Django 5.x (Python) cung cấp RESTful APIs và xác thực người dùng.
- **Frontend**: React 18 + TypeScript + Vite, giao diện Vanilla CSS chuẩn Design System hiện đại với 2 giao diện chuẩn mực (**Sleek Dark** & **Clean Light**) chuyển đổi tức thì 1-click.

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
| **Nhóm 1** | **Châu Tuấn Kiệt (TN)**<br>Nguyễn Văn Hiếu<br>Nguyễn Duy Quân | **Layout & Dashboard** | - Kiến trúc App Shell (Header tinh gọn, Sidebar truyền thống đa cấp, Footer)<br>- Đăng nhập nhân vật hoạt họa tương tác, Trang cá nhân, Đổi MK<br>- Trang chủ Dashboard (8 khối thống kê, sinh nhật, lịch họp, thông báo stream)<br>- Hệ thống 2 theme chuẩn mực (Sleek Dark & Clean Light) và phím Assistive Touch di động |
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
│   ├── apps/                 # Các module nghiệp vụ Django (birthdays, documents,...)
│   ├── db.sqlite3            # Cơ sở dữ liệu nội bộ SQLite
│   └── manage.py             # Script quản trị Django
├── frontend/                 # Mã nguồn Frontend React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── app/              # Router, App root, Main layout
│   │   ├── modules/          # Phân hệ nghiệp vụ theo 8 nhóm (dashboard, documents,...)
│   │   └── shared/           # Components dùng chung (Header, Sidebar, Modals), CSS design system, utils
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Tài liệu kiến trúc và tham chiếu
│   ├── architecture/         # structure.md (Quy chuẩn cấu trúc chi tiết)
│   └── references/           # Đề cương chi tiết môn học ITC
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
- **Frontend React Web**: `http://localhost:5173/`

---

### Cách 2: Khởi chạy thủ công từng phần

#### 1. Khởi chạy Backend (Django)
Yêu cầu đã cài đặt **Python 3.10+**:
```bash
# Di chuyển vào thư mục backend
cd backend

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

# Cài đặt dependencies (khuyến nghị pnpm hoặc npm)
pnpm install
# hoặc: npm install

# Khởi chạy máy chủ phát triển
pnpm dev
# hoặc: npm run dev
```
Truy cập giao diện tại: `http://localhost:5173/`

---

## 🎨 5. Điểm nhấn giao diện (Module 1 — Nhóm 1)

1. **Thanh điều hướng phong cách truyền thống hiện đại (Traditional Navigation)**:
   - **App Icon Tiles**: Từng module sở hữu biểu tượng tile gradient rực rỡ, bo góc chuẩn mực, trực quan.
   - **Accordion Menu thông minh**: Nhấp vào module sẽ mở/đóng danh sách trang con mà không bị giật trang hay chuyển trang ngoài ý muốn. Khi hover chuột sẽ tự động xem trước flyout các trang con.
   - **Khu vực Lối tắt (Shortcuts)**: Truy cập tức thì vào Văn bản khẩn, Hồ sơ mật, Báo cáo nhanh,...
   - **Tùy biến linh hoạt**: Người dùng có thể chuyển đổi giữa kiểu dáng truyền thống và Dock cổ điển trong mục Cài đặt.

2. **Hệ thống 2 Giao diện chuẩn mực (Clean Light & Sleek Dark)**:
   - Tinh gọn từ 10 phong cách xuống **2 giao diện hiện đại nhất**, loại bỏ hoàn toàn mã CSS dư thừa giúp giao diện nhẹ và mượt mà:
     - **Sleek Dark** (Mặc định): Nền slate tối công nghệ, tương phản cao, bảo vệ mắt, phong cách công nghệ cao cấp.
     - **Clean Light**: Tươi sáng, thanh lịch, chuẩn mực môi trường văn phòng tác nghiệp ban ngày.
   - Chuyển đổi 1-click tức thì qua nút biểu tượng Mặt trời / Mặt trăng trên Header.

3. **Tiện ích di động Phím điều hướng ảo (Assistive Touch)**:
   - Nút nổi di chuyển tự do (Draggable Floating Action Button) trên màn hình cảm ứng điện thoại.
   - Mở modal thao tác nhanh các phân hệ, có thể kích hoạt/tắt theo ý thích trong trang Cài đặt.

4. **Header tinh gọn & Luồng thông báo Stream**:
   - Loại bỏ thanh tìm kiếm toàn cục rườm rà, nhường không gian hiển thị thông thoáng cho Header.
   - **Notification Streams**: Phân luồng thông báo thời gian thực (Văn bản đến, Yêu cầu duyệt, Văn bản khẩn, Tuyệt mật).
   - **Đa ngôn ngữ**: Chuyển đổi mượt mà giữa Tiếng Việt (VN) và Tiếng Anh (EN).

5. **Trợ lý AI Orb tương tác nổi**:
   - Trợ lý AI hình cầu nổi thông minh góc dưới màn hình, hiển thị trạng thái tác nghiệp và hỗ trợ tra cứu văn bản nhanh chóng.

---

## 📝 6. Quy chuẩn đóng góp mã nguồn (Git Workflow)

1. Mỗi nhóm làm việc trên branch riêng theo cú pháp:
   - `1_layout_home` (Nhóm 1 - Layout & Dashboard)
   - `feature/nhom-2-van-ban`
   - `feature/nhom-3-ho-so`
   - ...
2. Không commit trực tiếp vào `main` mà phải tạo Pull Request (PR) để PM/DevOps kiểm duyệt.
3. Tham chiếu chi tiết quy định cấu trúc code tại: [`docs/architecture/structure.md`](docs/architecture/structure.md).

---
*Bản quyền © 2026 Nhóm 1 — Dự án QLVB&TL — Khoa CNTT Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC).*

