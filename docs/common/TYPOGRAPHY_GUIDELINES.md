# 🖋️ QUY CHUẨN TYPOGRAPHY & PHÔNG CHỮ HỆ THỐNG (TYPOGRAPHY GUIDELINES)

> **Dự án:** Quản lý Văn bản và Tài liệu Bảo Long (QLVB & TLBM)  
> **Nhóm phụ trách Baseline:** Nhóm 1 - Kiến Trúc App Shell & Layout (PM: Châu Tuấn Kiệt)  
> **Áp dụng cho:** Toàn bộ 8 nhóm phát triển (Nhóm 1 đến Nhóm 8)  
> **Nguồn gốc tập trung (Single Source of Truth):**  
> - File cấu hình Tailwind: [`frontend/tailwind.config.js`](file:///d:/MonHocITC/Django/DoAnCuoiKy/frontend/tailwind.config.js)  
> - File biến toàn cục: [`frontend/src/styles/global.css`](file:///d:/MonHocITC/Django/DoAnCuoiKy/frontend/src/styles/global.css)  
> - Cam kết quy chuẩn: Commit `d90a274` (`feat(ui): loai bo phong chu sieu nho va quy chuan hoa typography`)

---

## 🎯 1. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Chuẩn công vụ & Dễ đọc (WCAG 2.1 AA Compliance):**  
   Giao diện phần mềm hành chính công vụ đòi hỏi độ rõ ràng, sắc nét cao trên mọi kích thước màn hình để cán bộ, nhân viên xử lý văn bản trong thời gian dài không bị mỏi mắt.
2. **Nghiêm cấm phông chữ siêu nhỏ (< 11px):**  
   Tuyệt đối loại bỏ toàn bộ cỡ chữ `8px`, `9px`, `10px`. Kích thước nhỏ nhất cho phép hiển thị nhãn phụ, thẻ trạng thái là **`13px - 14px` (`0.875rem`)**.
3. **Kế thừa Semantic Tokens (Zero Hardcode):**  
   Không viết inline style `style={{ fontSize: '...', color: '...' }}` hay dùng arbitrary class `text-[#...]`. Toàn bộ màu chữ và cỡ chữ phải gọi qua class Tailwind chuẩn (`text-main`, `text-secondary`, `text-muted`, `text-xs`, `text-sm`...).

---

## 🔤 2. Quy Chuẩn Phông Chữ (Font Family)

| Phân Loại | Định Nghĩa Kỹ Thuật | Phạm Vi Sử Dụng |
| :--- | :--- | :--- |
| **Font Chính (Primary Sans-Serif)** | **`Inter`** *(Nạp từ Google Fonts tại [`index.html`](file:///d:/MonHocITC/Django/DoAnCuoiKy/frontend/index.html#L12))*<br>`font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Áp dụng cho **100% giao diện**: Tiêu đề trang, thanh điều hướng, bảng biểu, danh mục hồ sơ, nút bấm, form nhập liệu. |
| **Font Ký Hiệu / Biểu Tượng** | **`FontAwesome 6 Pro/Free`** (`fa-solid`, `fa-regular`) | Toàn bộ icon hành động, icon trạng thái, biểu tượng danh mục. |
| **Font Đơn Cách (Monospace)** | `font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas` | Mã số ký hiệu văn bản đặc biệt, mã hash bảo mật, UUID, số token xác thực, log hệ thống. |

> [!WARNING]
> Nghiêm cấm dùng phông chữ có chân (Serif như *Times New Roman*) hoặc các phông viết tay, uốn lượn mang tính trang trí trong giao diện phần mềm công vụ.

---

## 📏 3. Thang Đo Kích Thước Chữ (Type Scale & Line-Height)

Cấu hình chi tiết được ánh xạ trong [`frontend/tailwind.config.js`](file:///d:/MonHocITC/Django/DoAnCuoiKy/frontend/tailwind.config.js#L136-L142):

```javascript
fontSize: {
  // Loại bỏ hoàn toàn cỡ chữ siêu nhỏ (0.75rem ~ 10.5px); nâng 'xs' lên ngang tầm chữ đọc rõ (0.875rem ~ 13-14px)
  xs: ['0.875rem', { lineHeight: '1.25rem' }],
}
```

### Bảng tra cứu kích thước chi tiết:

| Class Tailwind | Kích Thước (rem / px) | Dòng Cao (Line-Height) | Vị Trí Áp Dụng Cụ Thể |
| :--- | :---: | :---: | :--- |
| **`text-xs`** | `0.875rem` (13 - 14px) | `1.25rem` (20px) | • Nhãn định danh phân hệ (Category tag, e.g. `HỒ SƠ LƯU TRỮ`)<br>• Tiêu đề các cột bảng (`TableHead` uppercase)<br>• Huy hiệu trạng thái (`Badge`), tag từ khóa<br>• Ngày giờ lập, breadcrumb, tooltip, ghi chú phụ |
| **`text-sm`** *(Chuẩn)* | `0.875rem` (14px) | `1.25rem` (20px) | • **Nội dung dữ liệu bảng** (`TableCell`)<br>• Ô nhập liệu (`input`, `select`, `textarea`)<br>• Nút bấm kích cỡ tiêu chuẩn (`Button size="md"`)<br>• Dòng mô tả trang dưới tiêu đề chính (`description`) |
| **`text-base`** | `1.000rem` (16px) | `1.50rem` (24px) | • Tiêu đề thẻ (`CardTitle`)<br>• Tiêu đề hộp thoại xác nhận (Confirm Dialog)<br>• Nút bấm lớn (`Button size="lg"`) |
| **`text-lg`** | `1.125rem` (18px) | `1.75rem` (28px) | • Tiêu đề phân đoạn lớn (Section Header)<br>• Nhóm phân loại chính trong drawer cài đặt |
| **`text-xl`** | `1.250rem` (20px) | `1.75rem` (28px) | • Tiêu đề cửa sổ Modal tạo mới / chỉnh sửa hồ sơ<br>• Tiêu đề khay thông báo 3 luồng |
| **`text-2xl`** | `1.500rem` (24px) | `2.00rem` (32px) | • **Tiêu đề trang chính (`<h1>`)** của từng phân hệ<br>• Số liệu chỉ số tổng hợp (KPI Card Value) |
| **`text-3xl` - `text-4xl`** | `1.875rem - 2.25rem` | `2.25rem - 2.50rem` | • Tiêu đề trang Đăng nhập / Chào mừng hệ thống |

---

## ⚖️ 4. Quy Chuẩn Trọng Số Chữ (Font Weight)

* **`font-normal` (400 - Regular):** Văn bản mô tả phụ (`CardDescription`), nội dung chi tiết trích yếu văn bản, văn bản trợ giúp, placeholder.
* **`font-medium` (500 - Medium):** Nhãn trường nhập liệu (`<label>`), họ tên người lập, phân khoa phòng ban trong danh sách.
* **`font-semibold` (600 - Semibold):** **Tên hồ sơ** trong bảng, tên văn bản hiển thị nổi bật, tên tài nguyên biểu mẫu, tên tài khoản người dùng.
* **`font-bold` (700 - Bold):**
  * Tiêu đề trang chính (`<h1>`)
  * Tiêu đề card (`<h3>` / `CardTitle`)
  * Header tiêu đề cột bảng (`TableHead` kết hợp `uppercase tracking-wider`)
  * Chữ trên nút bấm CTA hành động (`Button`) và nhãn phân loại (`Badge`).

---

## 🎨 5. Quy Chuẩn Màu Sắc Chữ Theo Theme (Semantic Tokens)

Tất cả màu chữ phải tuân thủ bảng biến CSS trong [`frontend/src/styles/global.css`](file:///d:/MonHocITC/Django/DoAnCuoiKy/frontend/src/styles/global.css), hỗ trợ tự động cả 3 chế độ (Light, Dark, Modern Claymorphism 3D):

| Token Class | Biến CSS | Ý Nghĩa Ngữ Nghĩa | Light Theme | Dark Theme |
| :--- | :--- | :--- | :---: | :---: |
| **`text-main`** | `var(--text-main)` | Tiêu đề chính, tên hồ sơ, số hiệu, nội dung trọng tâm | `#0f172a` (Slate-900) | `#f8fafc` (Trắng tinh) |
| **`text-secondary`** | `var(--text-secondary)` | Dòng mô tả trang, tên người lập, phòng ban ban hành | `#475569` (Slate-600) | `#cbd5e1` (Xám bạc) |
| **`text-muted`** | `var(--text-muted)` | Header bảng, icon tìm kiếm, ngày tháng, placeholder | `#64748b` (Slate-500) | `#94a3b8` (Xám trung tính) |
| **`text-primary`** | `var(--color-primary)` | Tên phân hệ trên cùng, liên kết điều hướng, trạng thái chọn | `#3b82f6` (Blue-500) | `#3b82f6` (Blue-500) |
| **`text-success`** | `var(--color-success)` | Thông báo thành công, trạng thái hồ sơ *"Đã đóng / Hoàn tất"* | `#10b981` (Green-500) | `#10b981` (Green-500) |
| **`text-warning-text`** | `var(--color-warning-text)` | Cảnh báo, trạng thái *"Chờ duyệt / Đang lưu trữ"* | `#d97706` (Amber-600) | `#f59e0b` (Amber-500) |
| **`text-danger`** | `var(--color-danger)` | Báo lỗi API, cảnh báo xóa, trạng thái *"Hết hạn / Mật"* | `#ef4444` (Red-500) | `#ef4444` (Red-500) |

---

## 🧩 6. Mẫu Cấu Trúc Typography Chuẩn Trên Giao Diện

Trích đoạn triển khai chuẩn mực từ phân hệ **Nhóm 3 (Quản lý Hồ sơ lưu trữ - [`DossiersPage.tsx`](file:///d:/MonHocITC/Django/DoAnCuoiKy/frontend/src/pages/records/DossiersPage.tsx))**:

```tsx
{/* 1. Nhãn phân hệ (Module Category): text-xs, font-bold, uppercase, tracking-wider, text-primary */}
<div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
  <i className="fa-solid fa-folder-tree" />
  HỒ SƠ LƯU TRỮ
</div>

{/* 2. Tiêu đề trang chính: text-2xl, font-bold, text-main */}
<h1 id="dossiers-title" className="m-0 text-2xl font-bold text-main">
  Quản lý Hồ sơ Lưu trữ
</h1>

{/* 3. Dòng mô tả phụ: text-sm, text-secondary */}
<p className="m-0 mt-1 text-sm text-secondary">
  Quản lý, phân loại danh mục hồ sơ và phân loại tài liệu lưu trữ
</p>

{/* 4. Tiêu đề cột bảng: text-xs, font-bold, text-muted, uppercase, tracking-wider */}
<TableHead className="text-xs font-bold text-muted uppercase tracking-wider">
  SỐ / KÝ HIỆU
</TableHead>

{/* 5. Dòng dữ liệu hồ sơ trong bảng: */}
<TableCell>
  {/* Số hiệu hồ sơ: Badge text-xs font-bold */}
  <Badge variant="secondary">HS-2026-001</Badge>
</TableCell>
<TableCell>
  {/* Tên hồ sơ: text-sm, font-semibold, text-main */}
  <div className="font-semibold text-main">Hồ sơ thẩm định dự án</div>
  {/* Ghi chú phụ: text-xs, text-muted */}
  <div className="mt-1 truncate text-xs text-muted">Tài liệu phục vụ nghiệm thu Q3</div>
</TableCell>
```

---

## 📋 7. Bảng Kiểm Tra Kiểm Duyệt (Quality Gate Typography Checklist)

| STT | Tiêu Chí Kiểm Tra | Quy Định | Đánh Giá |
| :---: | :--- | :--- | :---: |
| 1 | **Không có font chữ siêu nhỏ** | Tuyệt đối không dùng `text-[8px]`, `text-[9px]`, `text-[10px]` hay `style={{ fontSize: '10px' }}` | ❌ Cấm |
| 2 | **Không hardcode mã màu chữ** | Tuyệt đối không viết `style={{ color: '#333' }}` hay arbitrary class `text-[#1e293b]` | ❌ Cấm |
| 3 | **Sử dụng Semantic Token** | Luôn dùng `text-main`, `text-secondary`, `text-muted` cho văn bản | ✅ Đạt |
| 4 | **Tiêu đề trang chuẩn H1** | Luôn dùng `text-2xl font-bold text-main` cho `<h1>` đầu trang | ✅ Đạt |
| 5 | **Bảng dữ liệu chuẩn mực** | Header bảng dùng `text-xs font-bold text-muted uppercase tracking-wider`, body dùng `text-sm` | ✅ Đạt |
| 6 | **Tương thích Theme Sáng / Tối** | Chữ hiển thị rõ nét, đạt độ tương phản tối thiểu 4.5:1 trên cả nền Light và Dark | ✅ Đạt |
