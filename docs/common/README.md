# Tài Liệu Dùng Chung Toàn Dự Án (Common Docs)

Thư mục này lưu trữ các quy chuẩn kiến trúc, tài liệu tích hợp và hướng dẫn chung áp dụng cho toàn bộ 8 nhóm thuộc đồ án Quản Lý Văn Bản & Tài Liệu Mật (TLBM).

## Cấu Trúc Tài Liệu
- `docs/common/`: Quy chuẩn chung (Git workflow, quy ước API REST, chuẩn CORS, theme, token).
- `docs/module/team_1/`: Bàn giao App Shell, Header, Sidebar, Footer, Router URL, Theme Nhóm 1.
- `docs/module/team_2/`: Tài liệu Phân hệ Văn bản đến / đi / mật.
- `docs/module/team_3/`: Tài liệu Phân hệ Hồ sơ tài liệu.
- `docs/module/team_4/`: Tài liệu Phân hệ Tài nguyên biểu mẫu.
- `docs/module/team_5/`: Tài liệu Phân hệ Trình ký & Phê duyệt.
- `docs/module/team_6/`: Tài liệu Phân hệ Công việc & Họp.
- `docs/module/team_7/`: Tài liệu Phân hệ Quản trị tổ chức & Nhân sự.
- `docs/module/team_8/`: Tài liệu Phân hệ Báo cáo thống kê & Audit.

## Quy Định Tích Hợp Frontend
- Quản lý gói: **Sử dụng duy nhất `pnpm`** (Nghiêm cấm dùng npm/yarn để tránh xung đột lockfile).
- Định tuyến: **Sử dụng `react-router-dom` qua `<Outlet />`**.
- Khung giao diện: Toàn bộ module cắm vào `<Outlet />` bên trong `MainLayout`, kế thừa tự động Header, Sidebar, Footer.
