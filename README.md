# HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (QLVB&TL)
> **Đồ Án Cuối Kỳ Môn Học Django — Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC)**  
> **Tên thương hiệu hệ thống**: TLBM SYSTEM  
> **Kho lưu trữ chính**: [QuanLyVanBan_TLBM](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM)

---

## 📖 1. Giới thiệu tổng quan

Hệ thống **Quản Lý Văn Bản và Tài Liệu (QLVB&TL)** là giải pháp phần mềm nội bộ số hóa toàn bộ quy trình hành chính, xử lý công văn, tờ trình, biểu mẫu và luồng văn bản (đến, đi, mật) trong tổ chức/doanh nghiệp.

Hệ thống được phát triển theo mô hình **Full-Stack tách biệt**:
- **Backend**: Django 6.1 (Python 3.12+) cung cấp RESTful APIs, CORS Middleware và xác thực người dùng.
- **Frontend**: React 19 + TypeScript 6 + Vite 8, định tuyến URL bằng `react-router-dom` qua thẻ `<Outlet />`, quản lý gói thống nhất bằng **`pnpm`**, với 2 giao diện chuẩn mực (**Sleek Dark** & **Clean Light**) chuyển đổi tức thì 1-click.

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
- `docs/modules/`: Phân chia thư mục đặc tả chi tiết cho 8 nhóm chuyên trách độc lập (ví dụ `docs/modules/01_layout_dashboard/` của Nhóm 1).

```text
DoAnCuoiKy/
├── backend/                  # Mã nguồn Backend Django (Python)
│   ├── config/               # Thiết lập hệ thống (settings.py với CORS, urls, wsgi)
│   ├── apps/                 # Các module nghiệp vụ Django (birthdays, documents, accounts...)
│   ├── requirements.txt      # Thư viện phụ thuộc Backend (Django, django-cors-headers, DRF, SimpleJWT)
│   ├── db.sqlite3            # Cơ sở dữ liệu nội bộ SQLite
│   └── manage.py             # Script quản trị Django
├── frontend/                 # Mã nguồn Frontend React 19 + TypeScript 6 + Vite 8
│   ├── src/
│   │   ├── pages/            # Toàn bộ trang hoàn chỉnh chia theo luồng (auth, dashboard, profile, settings, ai...)
│   │   ├── components/       # Toàn bộ component chia theo luồng (auth, dashboard, layout, common, ai...)
│   │   ├── layouts/          # Base Layout tổng thể (MainLayout.tsx)
│   │   ├── lib/              # Hằng số (constants.ts), API Client (apiClient.ts), authService.ts, routes.ts
│   │   ├── hooks/            # Custom hooks tự động hóa
│   │   ├── styles/           # CSS tokens & giao diện chuẩn (global.css, animations.css...)
│   │   ├── i18n/             # Đa ngôn ngữ (translate.ts, vi.json, en.json)
│   │   ├── types/            # Định nghĩa kiểu dữ liệu TypeScript (auth, navigation, theme...)
│   │   └── app/              # Cấu hình gốc Router (router.tsx, App.tsx, main.tsx)
│   ├── package.json
│   ├── pnpm-lock.yaml        # Khóa gói pnpm duy nhất của dự án
│   ├── tsconfig.app.json     # Cấu hình Path Aliases (@pages, @components, @layouts...)
│   └── vite.config.ts
├── docs/                     # Hệ thống tài liệu dự án
│   ├── common/               # Tài liệu dùng chung 8 nhóm
│   └── modules/              # 8 thư mục đặc tả của 8 nhóm (01_layout_dashboard,...)
├── CHAY_FULL_STACK.bat       # Script khởi chạy 1-click cho Windows
└── README.md
```

---

## 🚀 4. Hướng dẫn cài đặt & Khởi chạy Local

### Yêu cầu môi trường tiên quyết
- **Node.js**: Phiên bản 22.22.2 trở lên (hoặc 24.15.0 trở lên). Node 18/20 không chạy được `pnpm test` (`vitest 5`, `jsdom 30`)
- **pnpm**: Trình quản lý gói chuẩn (`npm install -g pnpm`), dùng bản 10.x
- **Python**: Phiên bản 3.12 trở lên (Django 6.1 không hỗ trợ Python thấp hơn)

---

### Cách 1: Khởi chạy 1-Click (Tự động hóa trên Windows)
Dự án đã tích hợp sẵn script tự động kiểm tra virtualenv, bật song song 2 server và tự mở trình duyệt:
```cmd
CHAY_FULL_STACK.bat
```
Script sẽ tự động:
1. Mở cửa sổ Django Backend tại `http://127.0.0.1:8000/`
2. Mở cửa sổ React Frontend Vite tại `http://localhost:5173/`
3. Tự động điều hướng trình duyệt vào Bàn làm việc: `http://localhost:5173/dashboard`

---

### Cách 2: Khởi chạy thủ công từng phần (Dành cho Developer / Mac / Linux)

#### 1. Khởi chạy Backend (Django)
Mở một cửa sổ Terminal tại thư mục gốc của dự án:
```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Tạo và kích hoạt môi trường ảo Python (Virtual Environment)
# Trên Windows:
python -m venv .venv
.venv\Scripts\activate

# Trên macOS / Linux:
python3 -m venv .venv
source .venv/bin/activate

# 3. Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# 4. Áp dụng cơ sở dữ liệu (Migrations)
python manage.py migrate

# 5. Khởi động máy chủ phát triển Django
python manage.py runserver 127.0.0.1:8000
```
- **Backend API URL**: `http://127.0.0.1:8000/api/`
- **Django Admin URL**: `http://127.0.0.1:8000/admin/`

#### 2. Khởi chạy Frontend (React + TypeScript + Vite)
Mở một cửa sổ Terminal **mới** song song:
```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt toàn bộ dependencies (bắt buộc dùng pnpm)
pnpm install

# 3. Khởi chạy máy chủ phát triển Vite
pnpm dev
```
- **Frontend App URL**: `http://localhost:5173/`
- **Tài khoản đăng nhập kiểm thử (Chỉ dùng cho môi trường Localhost để dev/test, tuyệt đối không dùng trên Staging/Production)**:
  + **Quản trị viên**: `admin` / `Admin@123`
  + **Cán bộ chuyên viên**: `canbo` / `Canbo@123`
  *(Lưu ý quan trọng: Thông tin tài khoản mẫu này được sinh tự động bởi script seed data của Backend phục vụ kiểm thử nội bộ trên Localhost; tài liệu tiêu chuẩn Staging không lưu trữ mật khẩu kiểm thử).*

#### 3. Các lệnh kiểm tra chất lượng mã nguồn (Quality Assurance)
Tại thư mục `frontend/`:
```bash
# Chạy toàn bộ Unit Tests (Yêu cầu toàn bộ test suite phải pass 100%)
pnpm test

# Kiểm tra cú pháp và quy chuẩn mã nguồn (ESLint)
pnpm lint

# Kiểm tra biên dịch TypeScript & đóng gói production
pnpm build
```

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
   - Nền tảng CSS Variables chuẩn design system tại `frontend/src/styles/global.css`.

4. **Hệ thống xác thực thực tế (Django Authentication + SimpleJWT)**:
   - Đăng nhập bảo mật qua REST API (`/api/auth/login/`), cấp phát cặp token Access Token & Refresh Token.
   - Cơ chế `apiClient` tự động gắn Bearer Token và tự động refresh token khi gặp HTTP 401; quản lý phiên đăng nhập an toàn và hỗ trợ phân quyền vai trò (Admin / Cán bộ chuyên viên).

---

## 📝 6. Quy chuẩn đóng góp mã nguồn (Git Flow & Baseline Staging)

> [!IMPORTANT]
> **Trạng thái nhánh `1_layout_home`:** Hiện tại là **Baseline Candidate (Bản chuẩn tạm thời / ứng viên)**. Chỉ sau khi được Reviewer / DevOps kiểm duyệt và hợp nhất chính thức vào `staging`, commit trên `staging` mới trở thành **Baseline chính thức** cho toàn bộ 8 nhóm.  
> Việc đồng bộ tài liệu là điều kiện tiên quyết nhưng chưa đồng nghĩa Staging đã sẵn sàng; CI, cấu hình môi trường và smoke test là các bước kiểm thử độc lập tiếp theo.

1. **Quy trình tạo branch từ staging**:
   - Các nhóm 2, 3, 4, 5, 6, 7, 8 khi bắt đầu phát triển tính năng không dùng quy trình Fork, mà **tạo branch trực tiếp từ `staging`** mới nhất:
     ```bash
     git checkout staging
     git pull origin staging
     git checkout -b feat/<ten-tinh-nang>
     ```
2. **Không commit trực tiếp vào `staging` hay `main`**:
   - Mọi thay đổi đều phải thông qua Pull Request (PR) trỏ vào `staging`.
   - PR phải vượt qua 100% Tiêu chuẩn Quality Gate (5 bài test Backend & Frontend) và được Reviewer phê duyệt.
3. **Quản lý gói đồng nhất**:
   - Sử dụng duy nhất **`pnpm`** cho frontend để bảo đảm tính toàn vẹn của `pnpm-lock.yaml` (nghiêm cấm dùng npm/yarn).

---
*Bản quyền © 2026 Nhóm 1 — Dự án QLVB&TL — Khoa CNTT Trường Cao Đẳng Công Nghệ Thông Tin TP.HCM (ITC).*

