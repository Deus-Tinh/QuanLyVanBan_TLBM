# 📋 CHANGELOG — Xóa Toàn Bộ Dữ Liệu Giả Lập Frontend

> **Nhánh:** `1_layout_home`  
> **Commit:** `b95e00a`  
> **Ngày:** 16/09/2026  
> **Người thực hiện:** Nhóm 1 (PM: Châu Tuấn Kiệt)

---

## Mục đích

Loại bỏ **100% dữ liệu mẫu / giả lập (mock data)** trên toàn bộ giao diện Frontend React, chuyển sang trạng thái **Empty State** sạch sẽ — sẵn sàng kết nối API Backend Django thực tế.

Sau thay đổi này, giao diện **không còn hiển thị bất kỳ số liệu, danh sách hay thông tin cán bộ giả lập nào**. Tất cả widget và component đều hỗ trợ nhận dữ liệu qua `props` từ API.

---

## Danh sách file thay đổi (12 file)

| # | File | Mô tả thay đổi |
|---|---|---|
| 1 | `src/modules/dashboard/components/DashboardStats.tsx` | 4 thẻ KPI mặc định về `0`, subtext hiển thị động theo giá trị |
| 2 | `src/modules/dashboard/components/IncomingDocumentsWidget.tsx` | Xóa 5 công văn SCB mẫu → Empty State |
| 3 | `src/modules/dashboard/components/RecentOutgoingWidget.tsx` | Xóa 5 quyết định mẫu → Empty State |
| 4 | `src/modules/dashboard/components/RecentTasksWidget.tsx` | Xóa 4 nhiệm vụ mẫu → Empty State |
| 5 | `src/modules/dashboard/components/MeetingsWidget.tsx` | Xóa 3 lịch họp mẫu → Empty State |
| 6 | `src/modules/dashboard/components/BirthdaysWidget.tsx` | Xóa 3 cán bộ sinh nhật mẫu → Empty State |
| 7 | `src/modules/dashboard/components/RecentResourcesWidget.tsx` | Xóa 5 biểu mẫu mẫu → Empty State |
| 8 | `src/shared/utils/constants.ts` | Xóa badge số giả trên Sidebar + xóa nội dung thông báo giả |
| 9 | `src/shared/components/Header/NotificationStreams.tsx` | Thêm Empty State khi danh sách thông báo trống |
| 10 | `src/modules/ai/pages/AiAssistantPage.tsx` | Xóa 4 phiên chat mẫu + xóa citation giả trong lời chào |
| 11 | `src/modules/profile/pages/ProfilePage.tsx` | Đọc thông tin từ session đăng nhập thay vì chuỗi cố định |
| 12 | `src/modules/dashboard/components/DashboardStats.test.tsx` | Cập nhật unit test cho giá trị mặc định mới |

---

## Kiểm tra chất lượng

| Hạng mục | Kết quả |
|---|---|
| TypeScript (`pnpm tsc --noEmit`) | ✅ 0 lỗi |
| Unit Tests (`pnpm test -- --run`) | ✅ 15/15 pass |
| Production Build (`pnpm build`) | ✅ Thành công |
| Bundle size JS | 413 KB (gzip 122 KB) |
| Bundle size CSS | 57 KB (gzip 11 KB) |

---

## Lưu ý cho DevOps / Deploy

1. **Không có breaking change về cấu trúc API** — các component vẫn nhận dữ liệu qua `props` với interface không đổi.
2. **Thư mục `dist/`** đã được build lại. Nếu deploy thủ công lên Netlify, kéo thả thư mục `frontend/dist` mới nhất.
3. **Đăng nhập** vẫn hoạt động bình thường qua form cục bộ (chưa kết nối API Auth Django).
4. Giao diện sẽ hiển thị trạng thái trống có icon + thông điệp hướng dẫn thay vì dữ liệu giả — đây là hành vi đúng cho đến khi Backend cung cấp API.

---

## Bước tiếp theo (Nhóm 1 & các nhóm khác)

- [ ] Xây dựng API endpoint Django REST Framework cho từng phân hệ
- [ ] Kết nối Frontend gọi API thực tế (`fetch` / `axios`) thay thế mảng rỗng hiện tại
- [ ] Tích hợp xác thực JWT/Session từ Django Auth vào luồng đăng nhập
