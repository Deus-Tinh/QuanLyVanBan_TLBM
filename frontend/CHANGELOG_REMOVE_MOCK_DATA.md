# 📋 CHANGELOG — Hoàn Thiện Loại Bỏ Mock Data & Tối Ưu Production

> **Nhánh:** `1_layout_home`  
> **PR Liên kết:** #3 (1_layout_home ➔ staging)  
> **Nhóm thực hiện:** Nhóm 1 - Kiến Trúc Layout & Trang Chủ  
> **Phiên bản:** Hoàn tất phúc đáp Báo cáo Kiểm thử DevOps  

---

## 1. Mục Đích & Phạm Vi Giải Quyết

Bản cập nhật này giải quyết triệt để 100% các điểm "Chưa đạt" trong Báo cáo DevOps Audit (PR #3) từ DevOps Lead:
1. **Xóa hoàn toàn dữ liệu cá nhân & mock runtime khỏi production bundle:**
   - Xóa bỏ toàn bộ hardcoded personal identities ("Châu Tuấn Kiệt", "Nguyễn Văn Hiếu", "Nguyễn Duy Quân") trong `constants.ts`, `FloatingAIBox.tsx`, `SyllabusPreview.tsx`, `AiAssistantPage.tsx`, và các tệp locale (`vi.json`, `en.json`, `common.json`).
   - Xóa bỏ 100% hai mảng dữ liệu mẫu `ALL_INCOMING` và `ALL_OUTGOING` trong `DashboardPage.tsx`. Toàn bộ widget Dashboard chuyển về trạng thái Empty State sạch sẽ khi chưa có dữ liệu từ Backend.
2. **Loại bỏ static inline CSS:**
   - Chuyển đổi toàn bộ các thuộc tính `style=` tĩnh trong `SettingsPage.tsx` sang Tailwind utility classes (giảm từ 36 inline styles tĩnh về đúng **0 inline style**).
   - Thay thế các inline style tĩnh trong `AiAssistantPage.tsx` (`style={{ height: '8px' }}` ➔ `className="h-2"`, `style={{ display: 'none' }}` ➔ `className="hidden"`).
   - Chỉ giữ lại inline styles động thực tế (tọa độ mắt chuột tương tác trong `LoginPage.tsx` và kéo thả phím Home ảo trong `MobileAssistiveTouch.tsx`).
3. **Loại bỏ toàn bộ arbitrary raw hex:**
   - Thay thế 100% các class `bg-[#...]` và `accent-[#...]` trên các widget Dashboard (`DashboardStats`, `BirthdaysWidget`, `IncomingDocumentsWidget`, `MeetingsWidget`, `NewTasksWidget`, `RecentOutgoingWidget`, `RecentResourcesWidget`, `RecentTasksWidget`) bằng semantic tokens chuẩn (`bg-primary`, `bg-warning`, `bg-success`, `bg-slate-800`, `accent-primary`).
4. **Vượt qua toàn bộ Verification Gates:**
   - Sửa toàn bộ 16 lỗi ESLint (`pnpm lint` ➔ **0 errors, 0 warnings**).
   - Sửa lỗi runtime `python backend/manage.py check` (Django System Check ➔ **0 issues**).
   - `pnpm tsc --noEmit` ➔ **0 errors**.
   - `pnpm test -- --run` ➔ **15/15 tests PASS**.
   - `pnpm build` ➔ **Biên dịch thành công, bundle sạch 100%**.

---

## 2. Chi Tiết Các Tệp Mã Nguồn Đã Chỉnh Sửa

| STT | Tệp Mã Nguồn | Chi Tiết Thay Đổi |
|:---:|:---|:---|
| 1 | `src/modules/dashboard/pages/DashboardPage.tsx` | Xóa bỏ hoàn toàn 2 dataset `ALL_INCOMING` và `ALL_OUTGOING` (hơn 100 dòng mock văn bản mẫu); khởi tạo state `[]` để kích hoạt Empty State tự nhiên của widget. |
| 2 | `src/shared/utils/constants.ts` | Thay đổi fallback `CURRENT_USER` từ thông tin cá nhân sang `"Cán bộ nhân viên"` (`canbo@tlbm.gov.vn`). |
| 3 | `src/shared/components/AI/FloatingAIBox.tsx` | Xóa tên cá nhân trong lời chào khởi tạo; chuyển hàm tạo ID sang module scope tránh vi phạm `react-hooks/purity`. |
| 4 | `src/shared/components/Syllabus/SyllabusPreview.tsx` | Xóa tên cá nhân trong `assignedTeam`, thay bằng `"Nhóm 1 (Phân hệ Trang chủ & Quản lý Văn bản)"`; loại bỏ import/biến `t` không sử dụng. |
| 5 | `src/modules/profile/pages/ProfilePage.tsx` | Đọc thông tin người dùng từ `localStorage` session thực tế; loại bỏ import `Badge` không sử dụng. |
| 6 | `src/shared/locales/{vi,en,common}.json` | Chuẩn hóa `completedGroup1` thành `"✓ Hoàn thành (Phân hệ Trang chủ)"`; loại bỏ các tên cá nhân trong chuỗi i18n. |
| 7 | `src/modules/settings/pages/SettingsPage.tsx` | Chuyển đổi 100% các inline style sang Tailwind classes (0 `style=` trong file); loại bỏ interface props không sử dụng. |
| 8 | `src/modules/ai/pages/AiAssistantPage.tsx` | Chuyển hàm tạo ID và đọc session ra module scope; thay thế avatar hardcode bằng ký tự đầu họ tên phiên đăng nhập; loại bỏ static inline styles. |
| 9 | `src/modules/dashboard/components/DashboardStats.tsx` | Thay `bg-[#003865] hover:bg-[#002f55] border-[#002a4d]` bằng `bg-primary hover:bg-primary-hover border-primary-border`; loại bỏ biến `t` không sử dụng. |
| 10 | `src/modules/dashboard/components/BirthdaysWidget.tsx` | Thay `bg-[#168b3e]` bằng `bg-success`. |
| 11 | `src/modules/dashboard/components/IncomingDocumentsWidget.tsx` | Thay `bg-[#0a3871]` bằng `bg-primary`. |
| 12 | `src/modules/dashboard/components/MeetingsWidget.tsx` | Thay `bg-[#d9822b]` bằng `bg-warning`. |
| 13 | `src/modules/dashboard/components/NewTasksWidget.tsx` | Thay `bg-[#df9b2d]` bằng `bg-warning`. |
| 14 | `src/modules/dashboard/components/RecentOutgoingWidget.tsx` | Thay `bg-[#0a3871]` bằng `bg-primary`. |
| 15 | `src/modules/dashboard/components/RecentResourcesWidget.tsx` | Thay `bg-[#1e4d7b]` bằng `bg-slate-800`. |
| 16 | `src/modules/dashboard/components/RecentTasksWidget.tsx` | Thay `bg-[#0a3871]` bằng `bg-primary`; thay 4 thuộc tính `accent-[#0a3871]` bằng `accent-primary`. |
| 17 | `src/shared/components/Layout/AppSidebar.tsx` | Loại bỏ tham số destructured không sử dụng `isMobileOpen` để vượt qua lint gate. |
| 18 | `src/shared/components/Navigation/MobileAssistiveTouch.tsx` | Xử lý triệt để cascading render bằng cách bỏ `setIsDimmed(false)` đồng bộ trong `useEffect`. |
| 19 | `src/modules/auth/pages/LoginPage.tsx` | Thay thế các kiểu `any` bằng `ActivePageId` và `ReturnType<typeof setTimeout> | null`. |
| 20 | `src/shared/locales/i18n.ts` | Thay thế `obj: any` bằng `Record<string, unknown>` trong hàm tra cứu chuỗi ngôn ngữ. |
| 21 | `docs/DESIGN_TOKENS_AUDIT.md` | Cập nhật bảng kiểm kê Design Tokens và giải trình chi tiết các trường hợp ngoại lệ được allowlist. |

---

## 3. Kết Quả Kiểm Tra Chất Lượng Thực Tế (Verification Evidence)

| Tiêu chí | Lệnh thực hiện | Kết quả thực tế |
|---|---|:---:|
| **TypeScript Typecheck** | `pnpm tsc --noEmit` | **PASS** (0 errors) |
| **ESLint Gate** | `pnpm lint` | **PASS** (0 errors, 0 warnings) |
| **Unit Test Suite** | `pnpm test -- --run` | **PASS** (6 files, 15 tests) |
| **Production Build** | `pnpm build` | **PASS** (Biên dịch thành công) |
| **Backend System Check** | `python backend/manage.py check` | **PASS** (0 issues) |
| **Static Inline CSS** | Kiểm tra regex `style=` tĩnh | **PASS** (0 static styles trong Settings/Widgets) |
| **Arbitrary Hex** | Kiểm tra regex `(bg|text|border|accent)-[#...]` | **PASS** (0 raw hex trong TSX) |
| **Production Bundle Check** | Grep tên cá nhân trong `dist/` | **PASS** (0 personal identities) |

---

## 4. Bổ Sung Phúc Đáp Review Final (P1 & P2 Bundle Check)

Nhóm 1 đã xử lý dứt điểm 2 tồn đọng cuối cùng do DevOps Reviewer phát hiện trong production bundle:

1. **P1 — Loại bỏ triệt để email cá nhân & dữ liệu mẫu khỏi locale (`vi.json`, `en.json`, `common.json`) và `ProfilePage.tsx`:**
   - Xóa bỏ hoàn toàn key `sampleEmail: "kiet.ct@itc.edu.vn"`, `sampleName`, `sampleRole` khỏi toàn bộ các tệp locale (`common.json`, `vi.json`, `en.json`).
   - Xóa bỏ toàn bộ danh sách họ tên sinh viên các nhóm 2–8 trong mục `pages.*.assignedTeam`, quy chuẩn hóa thành tên phân hệ trung tính (`Nhóm 2 (Phân hệ Quản lý Văn bản)`, `Group 2 (Document Management Subsystem)`).
   - Trong `ProfilePage.tsx`: đổi email hiển thị sang format trung tính dựa trên session `session?.email || (session?.username ? `${session.username}@donvi.gov.vn` : '—')`, tuyệt đối không còn đuôi `@itc.edu.vn`. Khi `session === null`, hiển thị `—` (Empty State).

2. **P2 — Loại bỏ Fallback Mock User Object (`CURRENT_USER` / `Hn`) khi chưa có session:**
   - Xóa bỏ hoàn toàn export `CURRENT_USER` (`canbo`, `canbo@tlbm.gov.vn`) khỏi `frontend/src/shared/utils/constants.ts`.
   - Cập nhật `UserDropdown.tsx`: Khi `session === null`, render trạng thái Khách / Empty State chuẩn mực (icon `fa-regular fa-user`, text "Chưa đăng nhập", tiêu đề dropdown hiển thị "Chưa đăng nhập / Vui lòng đăng nhập để tiếp tục", ẩn hoàn toàn email mock, cung cấp nút Đăng nhập trực tiếp).

3. **Kết quả kiểm định Production Bundle mới (`dist/assets/index-ClxUyO8V.js`):**
   - Tìm kiếm chuỗi `kiet.ct@itc.edu.vn`, `itc.edu.vn`, `canbo@tlbm.gov.vn`, `canbo@`, `sampleemail`, tên cá nhân: **0 kết quả (MATCH: 0)**.
   - Bundle sạch 100%, không còn bất kỳ dữ liệu cá nhân hay mock user object nào được bake cứng vào runtime.

---

## 5. Cam Kết & Trạng Thái Sẵn Sàng Cho Staging

Mọi thay đổi đã được kiểm chứng trực tiếp trên môi trường máy chủ và tệp bundle thực tế. Mã nguồn nhánh `1_layout_home` đã đạt 100% tiêu chuẩn DevOps và sẵn sàng Merge vào `staging`.
