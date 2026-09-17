# TLBM SYSTEM — FRONTEND ARCHITECTURE
> **Phân hệ Giao diện Người dùng (React 18 + TypeScript + Vite)**  
> **Nhóm phụ trách kiến trúc**: Nhóm 1 (Kiến trúc App Shell, Xác thực & Dashboard)  
> **Dự án**: Quản Lý Văn Bản và Tài Liệu (QLVB&TL) — Trường CĐ CNTT TP.HCM (ITC)

---

## 🛠️ 1. Công nghệ sử dụng

- **Core**: React 18 (Hooks, Context API, Suspense)
- **Language**: TypeScript 5.x (Strict Typing, Interface Definitions)
- **Build Tool**: Vite 8.x (Siêu nhanh, tối ưu HMR, Hot Reload)
- **Styling**: Vanilla CSS Design Tokens (Không dùng thư viện cồng kềnh, chuẩn CSS Variables)
- **Icons**: FontAwesome 6 Free Pro CDN + Custom SVGs
- **i18n**: Hệ thống đa ngôn ngữ nội bộ hỗ trợ Song ngữ Tiếng Việt (VN) / Tiếng Anh (EN)

---

## 📂 2. Cấu trúc thư mục mã nguồn (`src/`)

```text
src/
├── app/                        # Tầng khởi chạy ứng dụng
│   ├── App.tsx                 # Root Component điều phối Layout & State toàn cục
│   ├── main.tsx                # Entry point gắn vào DOM HTML
│   └── router.tsx              # Bộ điều hướng View giữa các phân hệ của 8 nhóm
│
├── modules/                    # Phân chia mã nguồn theo 8 nhóm nghiệp vụ
│   ├── ai/                     # Nhóm 8: Trợ lý AI Assistant (Chatbox)
│   ├── auth/                   # Nhóm 1: Xác thực, Đăng nhập tương tác hoạt họa
│   ├── dashboard/              # Nhóm 1: Bảng điều khiển tác nghiệp tổng hợp
│   ├── documents/              # Nhóm 2: Văn bản đến, Văn bản đi, Văn bản mật
│   ├── profile/                # Nhóm 1: Thông tin cá nhân, Đổi mật khẩu
│   ├── settings/               # Nhóm 1: Cài đặt hệ thống, Phong cách Sidebar, AssistiveTouch
│   └── ...                     # Các module khác của Nhóm 3, 4, 5, 6, 7
│
├── shared/                     # Tài nguyên & Thành phần dùng chung toàn dự án
│   ├── components/
│   │   ├── Header/             # AppHeader, ThemeSelector, NotificationStreams, ProfileMenu
│   │   ├── Layout/             # AppSidebar (Phong cách truyền thống), AppFooter, AssistiveTouch
│   │   ├── FloatingAiOrb/      # Quả cầu trợ lý AI nổi
│   │   └── Syllabus/           # Component hiển thị tiến độ phân hệ đang phát triển
│   ├── locales/
│   │   └── i18n.tsx            # Quản lý từ điển Tiếng Việt & Tiếng Anh
│   ├── styles/
│   │   ├── global.css          # Design Tokens, bảng màu CSS Variables chuẩn mực
│   │   └── layout.css          # Định dạng App Shell, Sidebar truyền thống, Assistive Touch
│   ├── types/                  # Khai báo TypeScript Interfaces (Navigation, Theme, User)
│   └── utils/
│       └── constants.ts        # Hằng số hệ thống, danh mục Navigation, danh mục Theme
```

---

## 🎨 3. Quy chuẩn Hệ thống Giao diện & Design Tokens

Hệ thống sử dụng thuần **CSS Variables** được định nghĩa tại `src/shared/styles/global.css`:

### 2 Giao diện chuẩn mực
1. **Sleek Dark** (`[data-theme='dark']`): Tông nền đen slate công nghệ (`#0b0f17`), chống mỏi mắt ban đêm, độ sâu thị giác tinh tế.
2. **Clean Light** (`[data-theme='light']`): Tông nền trắng sáng văn phòng (`#f1f5f9`), tương phản cao, tối ưu tác nghiệp ban ngày.

### Cách sử dụng CSS Tokens khi phát triển UI
Các nhóm khi viết CSS cho module của mình **KHÔNG hardcode mã màu hex tĩnh**, hãy sử dụng các biến có sẵn:
```css
.my-card {
  background: var(--bg-surface);         /* Màu nền thẻ */
  color: var(--text-main);              /* Màu chữ chính */
  border: 1px solid var(--border-subtle);/* Đường viền */
  border-radius: var(--radius-lg);      /* Bo góc chuẩn */
  box-shadow: var(--shadow-md);          /* Đổ bóng */
}

.my-button {
  background: var(--color-primary);      /* Xanh chủ đạo */
  color: #ffffff;
  transition: all var(--transition-fast);
}
.my-button:hover {
  background: var(--color-primary-hover);
}
```

---

## 🚀 4. Lệnh chạy & Kiểm thử

```bash
# Cài đặt thư viện phụ thuộc (khuyến nghị pnpm)
pnpm install
# hoặc:
npm install

# Khởi chạy máy chủ phát triển (mặc định Port 5173)
pnpm dev
# hoặc:
npm run dev

# Kiểm tra lỗi TypeScript và đóng gói Production
pnpm build
# hoặc:
npm run build
```

---

## 📌 5. Quy tắc dành cho các nhóm khác khi tích hợp Module

1. Đặt toàn bộ view/component của nhóm mình vào thư mục con tương ứng trong `src/modules/<ten_module>/`.
2. Đăng ký màn hình hoặc sub-pages trong `src/shared/utils/constants.ts` (`NAVIGATION_MODULES`).
3. Khai báo ánh xạ render tương ứng trong `src/app/router.tsx`.
4. Đảm bảo component thích ứng tốt với cả 2 chế độ Sáng và Tối thông qua CSS Tokens.
