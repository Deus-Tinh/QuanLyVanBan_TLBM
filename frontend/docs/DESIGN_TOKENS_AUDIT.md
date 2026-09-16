# TLBM - Báo Cáo Kỹ Thuật: Rà Soát Mã Màu & Design Tokens (DevOps Audit Report)

**Dự án:** Quản Lý Văn Bản & Tài Liệu Mật (TLBM)  
**Nhánh:** `1_layout_home`  
**Nhóm phụ trách:** Nhóm 1 - Kiến Trúc Layout & Trang Chủ (PM: Châu Tuấn Kiệt)  
**Tình trạng:** Hoàn tất chuyển đổi Tailwind CSS & Zero-Hardcode Compliance.

---

## 1. Kết Quả Rà Soát Hệ Thống Mã Nguồn Nhóm 1

Toàn bộ các khối giao diện thuộc phạm vi Nhóm 1 đã được chuẩn hóa 100% sang **Tailwind CSS v3** kết hợp hệ thống **Design Tokens**:

| Khối Giao Diện | Tệp Mã Nguồn | Tình Trạng | Chuẩn Tuân Thủ |
| :--- | :--- | :---: | :--- |
| **App Shell** | `MainLayout.tsx` | ✅ Đạt | 100% Tailwind utility classes |
| **Thanh Header** | `AppHeader.tsx`, `LanguageSwitcher.tsx`, `ThemeSelector.tsx`, `UserDropdown.tsx` | ✅ Đạt | 0 inline styles, 0 hex colors |
| **Thanh Điều Hướng** | `AppSidebar.tsx` (Facebook Accordion & Dock), `TopSubNav.tsx`, `MobileAssistiveTouch.tsx` | ✅ Đạt | Sử dụng semantic tokens `bg-fb-*`, `bg-shortcut-*` |
| **Thông Báo 3 Luồng** | `NotificationStreams.tsx` | ✅ Đạt | 100% Tailwind classes |
| **Trợ Lý AI Nổi** | `FloatingAIBox.tsx` | ✅ Đạt | Giao diện thẻ kính mờ `backdrop-blur-xl`, không bị mất nền |
| **7 Sub-widgets Dashboard** | `DashboardStats`, `QuickSearch`, `IncomingDocuments`, `RecentOutgoing`, `RecentTasks`, `Birthdays`, `RecentResources` | ✅ Đạt | 100% dùng thư viện UI dùng chung (`Card`, `Badge`, `Button`, `Table`) |
| **Các Trang Phân Hệ** | `DashboardPage.tsx`, `ProfilePage.tsx`, `PasswordChangePage.tsx`, `SyllabusPreview.tsx` | ✅ Đạt | 0 hardcode hex colors |

---

## 2. Các Điểm Ngoại Lệ Kỹ Thuật (Exceptions & Notes)

Trong toàn bộ dự án, các điểm sau đây vẫn duy trì mã hex hoặc rgba thô với lý do kỹ thuật bắt buộc:

### 2.1. Tệp Khai Báo Gốc: `src/shared/styles/global.css` (Dòng 29 – 120)
* **Mục đích:** Khởi tạo bảng biến CSS `:root`, `[data-theme='dark']`, và `[data-theme='light']`.
* **Ghi chú kỹ thuật:** Đây là **Single Source of Truth (Nguồn gốc duy nhất)** của Design Tokens. Toàn bộ `tailwind.config.js` ánh xạ màu sắc từ các biến `var(--...)` này. Bắt buộc phải có giá trị gốc tại đây.

### 2.2. Ô Màu Xem Trước (Swatches): `src/shared/utils/constants.ts` (Dòng 26, 37)
* **Mục đích:** Cung cấp màu gradient xem trước (`previewGradient`) cho bộ chọn theme `ThemeSelector`.
* **Ghi chú kỹ thuật:** Dùng để người dùng khi đang ở Theme Sáng vẫn nhìn thấy ô demo của Theme Tối (và ngược lại) trước khi quyết định chuyển đổi theme.

### 2.3. Hiệu Ứng Pháo Hoa: `src/modules/auth/pages/LoginPage.tsx` (Dòng 119)
* **Mục đích:** Truyền mảng màu vào hàm `confetti()` khi đăng nhập thành công.
* **Ghi chú kỹ thuật:** Thư viện bên thứ ba `canvas-confetti` vẽ trực tiếp lên thẻ HTML5 `<canvas>`, do đó bắt buộc phải nhận chuỗi mã màu hex thuần (`['#ff6b35', '#6d28d9', ...]`), không thể dùng class CSS.

---

## 3. Xác Thực Kiểm Thử (Automated Verification)

* **Vitest Suite (`pnpm test`):** 6 test files, 15 tests, **100% PASS**.
* **Production Build (`pnpm build`):** Biên dịch hoàn tất trong **1.17s**, CSS bundle tinh gọn còn **45.38 kB** (9.16 kB gzip).
* **Đơn khối `layout.css`:** Đã xóa bỏ hoàn toàn (3.423 dòng).
