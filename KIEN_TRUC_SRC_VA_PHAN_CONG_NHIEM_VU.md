# TLBM — KIẾN TRÚC THƯ MỤC CHUẨN & BẢNG PHÂN CHIA NHIỆM VỤ NHÓM
> **Hệ thống Quản lý Văn bản và Tài liệu (TLBM) — Môn học ITC Django (MĐ501911)**  
> **Giảng viên hướng dẫn & BA:** NCS.ThS. Trần Phương Duy  
> **Trưởng nhóm & Project Manager (PM):** Châu Tuấn Kiệt (Nhóm 1 - Phụ trách Layout & Foundation)  
> **Ngày cập nhật:** Tháng 09/2026  

---

## 1. Mục Đích & Định Hướng Cốt Lõi
Theo chỉ đạo định hướng kiến trúc từ Thầy Duy và người hướng dẫn:
1. **Loại bỏ hoàn toàn tư duy code cứng (Hardcode):** Không gộp chuỗi văn bản hay mã màu, cỡ chữ pixel tùy tiện vào từng component.
2. **Nguyên lý Single Source of Truth (Một nguồn chân lý duy nhất):**
   - Muốn chỉnh màu sắc thương hiệu, cỡ chữ -> Sửa tại `src/styles/global.css`. Toàn app tự động đồng bộ.
   - Muốn chỉnh câu từ, bổ sung tiếng Anh/tiếng Việt -> Sửa tại `src/i18n/translations.js`. Không phải đi sửa từng file.
3. **Đa ngôn ngữ toàn diện (i18n):** Hỗ trợ chuyển đổi tức thì giữa Tiếng Việt (🇻🇳) và Tiếng Anh (🇬🇧), ghi nhớ trạng thái người dùng qua `localStorage`.

---

## 2. Sơ Đồ Cấu Trúc Thư Mục Chuẩn (`frontend/src/`)

```text
frontend/src/
├── assets/                    # Hình ảnh, font chữ tĩnh, file media
│   └── styles/                # CSS chuyên sâu theo phân hệ (base_layout, birthday_system)
├── components/                # Các UI component có khả năng tái sử dụng cao
│   ├── AI/                    # Widget Trợ lý ảo TLBM AI
│   ├── Birthday/              # Components phân hệ Sinh nhật 7.2
│   ├── Common/                # Nút bấm, Modal, Badge, Loading spinner
│   ├── Header/                # ThemeSelector, LanguageSwitcher, NotificationStreams, UserDropdown
│   └── Layout/                # AppSidebar, AppHeader, AppFooter, MobileOverlay
├── hooks/                     # Custom React Hooks
│   ├── useTheme.js            # Quản lý 4 giao diện (Glass, Cyberpunk, Skeuo, Flat)
│   ├── useTranslation.js      # Hook đa ngôn ngữ t('namespace.key')
│   ├── useDropdown.js         # Xử lý đóng mở dropdown & click outside
│   └── useCalendar.js         # Tiện ích tính toán lịch sinh nhật
├── i18n/                      # [TRỤ CỘT 1] Hệ thống Đa ngôn ngữ chuẩn công nghiệp
│   ├── LanguageContext.jsx    # React Context & Provider lưu trữ localStorage
│   ├── translations.js        # Từ điển song ngữ Anh - Việt dạng cây phân cấp
│   └── utils.js               # Hàm nội suy translate(lang, path, params)
├── layouts/                   # [TRỤ CỘT 2] Bộ khung Layout dùng chung
│   └── MainLayout.jsx         # Khung bao chuẩn tích hợp Sidebar + Header + Content + Footer
├── pages/                     # Màn hình trang nghiệp vụ chính
│   ├── BirthdayPage.jsx       # Giao diện Phân hệ 7.2 Sinh nhật CBNV
│   └── DashboardPage.jsx      # Giao diện Bàn làm việc Nhóm 1
├── services/                  # Gọi API Backend Django qua Axios / Fetch
│   ├── api.js                 # Base Axios instance
│   ├── birthdayService.js     # API dữ liệu nhân sự & sinh nhật
│   └── notificationService.js # API thông báo hệ thống
├── styles/                    # [TRỤ CỘT 3] Hệ thống Design Tokens toàn cục
│   └── global.css             # Khai báo biến Màu chủ đạo, Font-size scale, Spacing, Radius
├── utils/                     # Thư viện tiện ích dùng chung
│   ├── constants.js           # Hằng số hệ thống, danh mục menu điều hướng
│   └── dateFormatter.js       # Định dạng ngày giờ chuẩn hành chính
├── App.jsx                    # Root App bọc bởi LanguageProvider & MainLayout
└── main.js                    # Entry point React 18
```

---

## 3. Bảng Quy Chuẩn Design Tokens (`src/styles/global.css`)

Tất cả thành viên khi code CSS hoặc style cho component **bắt buộc dùng biến Token**, không viết mã màu hay số pixel tùy tiện:

### 3.1. Hệ thống Màu sắc (Color Tokens)
| Tên Biến CSS | Giá trị mẫu | Mục đích sử dụng |
| :--- | :--- | :--- |
| `--color-primary` | `#2563eb` (Blue 600) | Màu chủ đạo, nút bấm chính, link kích hoạt |
| `--color-primary-hover` | `#1d4ed8` (Blue 700) | Trạng thái hover của nút bấm chính |
| `--color-secondary` | `#0ea5e9` (Sky 500) | Màu phụ, điểm nhấn |
| `--color-success` | `#10b981` (Emerald 500)| Trạng thái thành công, đã hoàn thành |
| `--color-warning` | `#f59e0b` (Amber 500) | Trạng thái cảnh báo, sắp đến hạn |
| `--color-danger` | `#ef4444` (Red 500) | Trạng thái lỗi, văn bản hỏa tốc, xóa |
| `--color-info` | `#06b6d4` (Cyan 500) | Thông tin chỉ dẫn, tooltip |

### 3.2. Bảng Cỡ Chữ Chuẩn (Typography Scale)
| Tên Biến CSS | Kích thước | Tương đương pixel | Vị trí áp dụng |
| :--- | :---: | :---: | :--- |
| `--font-2xs` | `0.625rem` | 10px | Badge siêu nhỏ, metadata phụ |
| `--font-xs` | `0.75rem` | 12px | Caption, thời gian timestamp |
| `--font-sm` | `0.875rem` | 14px | Menu phụ, chữ trong bảng dữ liệu |
| `--font-base` | `1.000rem` | 16px | Chữ nội dung chuẩn, input form |
| `--font-md` | `1.125rem` | 18px | Tiêu đề card, mục nổi bật |
| `--font-lg` | `1.250rem` | 20px | Tiêu đề nhóm nội dung |
| `--font-xl` | `1.500rem` | 24px | Tiêu đề phân hệ, modal title |
| `--font-2xl` | `1.875rem` | 30px | Tiêu đề trang chính (Page Title) |
| `--font-3xl` | `2.250rem` | 36px | Số liệu thống kê lớn, Hero Banner |

### 3.3. Khoảng cách (Spacing) & Bo góc (Radius)
- **Spacing:** `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-6` (24px), `--space-8` (32px).
- **Radius:** `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-full` (9999px tròn).

---

## 4. Hướng Dẫn Sử Dụng Đa Ngôn Ngữ (`i18n`) Trong Code

### 4.1. Cách gọi trong Component React
```jsx
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function MyComponent() {
  const { t, language, changeLanguage } = useTranslation();

  return (
    <div>
      {/* 1. Gọi text đơn giản */}
      <h2>{t('birthday.todayTitle')}</h2>
      <button>{t('common.save')}</button>

      {/* 2. Gọi text có truyền tham số nội suy {age}, {name} */}
      <p>{t('birthday.turningAge', { age: 28 })}</p>
    </div>
  );
}
```

### 4.2. Quy tắc bổ sung từ khóa mới vào `src/i18n/translations.js`
Khi nhóm của bạn thêm tính năng mới, hãy mở `translations.js` và thêm từ khóa vào **cả 2 mục `vi` và `en`** theo đúng cụm chức năng (namespace).

---

## 5. Bảng Phân Chia Công Việc Cho Thành Viên Nhóm (Task Breakdown)

| Mã Task | Tên Nhiệm Vụ | Nội Dung Cụ Thể | Người Phụ Trách | Trạng Thái / Hạn Chót |
| :---: | :--- | :--- | :---: | :---: |
| **TASK-01** | **Core Architecture & Setup** | Dựng bộ khung `i18n/`, `styles/global.css`, `layouts/MainLayout.jsx`, nút cờ `LanguageSwitcher` trên Top Header | **Châu Tuấn Kiệt (PM)** |  **HOÀN THÀNH** |
| **TASK-02** | **Rà Soát & Bổ Sung Từ Điển Song Ngữ** | Rà soát toàn bộ các text còn sót trên Dashboard, Modal gửi lời chúc, danh sách bảng biểu để dịch đầy đủ sang `vi` & `en` trong `translations.js` | **Thành viên 2** | Hạn: 2 ngày |
| **TASK-03** | **Áp Dụng Token CSS Toàn Hệ Thống** | Rà soát các file `.css`, thay thế các mã màu cố định (`#1e293b`, `#2563eb`) và `font-size` pixel thành `var(--font-...)` và `var(--color-...)` | **Thành viên 3** | Hạn: 2 ngày |
| **TASK-04** | **Tích Hợp `t(...)` Vào Phân Hệ Sinh Nhật** | Thay thế các text hiển thị tĩnh trong `BirthdayPage.jsx` và các components con bằng hàm `t('birthday....')` | **Thành viên 4** | Hạn: 3 ngày |
| **TASK-05** | **Tích Hợp `t(...)` Vào Dashboard & Menu** | Kiểm tra hiển thị đa ngôn ngữ trên Dashboard, Sidebar khi người dùng bấm chuyển đổi giữa 🇻🇳 VI và 🇬🇧 EN | **Thành viên 5** | Hạn: 3 ngày |

---

## 6. Tiêu Chí Nghiệm Thu Đồ Án (Definition of Done - DoD)
1. Chạy lệnh `npm run build` không xuất hiện bất kỳ lỗi cú pháp hoặc cảnh báo nào.
2. Bấm vào nút chuyển đổi ngôn ngữ (🇻🇳 / 🇬🇧) trên Header: giao diện tự động đổi ngôn ngữ ngay lập tức mà không cần reload trang.
3. Reload trang (F5) hoặc mở lại trình duyệt: hệ thống vẫn ghi nhớ đúng ngôn ngữ đã chọn trước đó.
4. Chuyển đổi giữa 4 Theme: kích thước chữ, layout và khoảng cách căn lề giữ nguyên độ sắc nét và ổn định.
