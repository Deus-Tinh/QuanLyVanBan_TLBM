# Tài Liệu Dùng Chung Toàn Dự Án (Common Docs)

Thư mục này lưu trữ các quy chuẩn kiến trúc, tài liệu tích hợp và hướng dẫn chung áp dụng cho toàn bộ 8 nhóm thuộc đồ án Quản Lý Văn Bản & Tài Liệu Mật (TLBM).

## Cấu Trúc Tài Liệu
- `docs/common/`: Quy chuẩn chung (Git workflow, quy ước API REST, chuẩn CORS, theme, token).
- `docs/modules/01_layout_dashboard/`: Bàn giao App Shell, Header, Sidebar, Footer, Router URL, Theme Nhóm 1.
- `docs/modules/02_documents/`: Tài liệu Phân hệ Văn bản đến / đi / mật.
- `docs/modules/03_dossiers_records/`: Tài liệu Phân hệ Hồ sơ tài liệu.
- `docs/modules/04_document_templates/`: Tài liệu Phân hệ Tài nguyên biểu mẫu.
- `docs/modules/05_signing_workflow/`: Tài liệu Phân hệ Trình ký & Phê duyệt.
- `docs/modules/06_tasks_management/`: Tài liệu Phân hệ Công việc & Họp.
- `docs/modules/07_system_admin_meetings/`: Tài liệu Phân hệ Quản trị tổ chức & Nhân sự.
- `docs/modules/08_ai_assistant/`: Tài liệu Phân hệ Trợ lý AI.

## Quy Định Tích Hợp Frontend
- Quản lý gói: **Sử dụng duy nhất `pnpm`** (Nghiêm cấm dùng npm/yarn để tránh xung đột lockfile).
- Định tuyến: **Sử dụng `react-router-dom` qua `<Outlet />`**.
- Khung giao diện: Toàn bộ module cắm vào `<Outlet />` bên trong `MainLayout`, kế thừa tự động Header, Sidebar, Footer.
