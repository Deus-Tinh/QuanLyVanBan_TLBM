# Nhật ký thay đổi `release_DDL.sql`

Mỗi PR sửa `release_DDL.sql` thêm một mục ở đầu danh sách (mới nhất trên cùng). Quy trình đổi schema: `AGENTS.md`, mục 5.

| Ngày | PR | Đối tượng thay đổi | Lý do |
|---|---|---|---|
| 2026-10-17 | #173 | Seed `organizations_khoi.thu_tu_hien_thi`, `organizations_donvi.stt_uu_tien`: lấy theo vị trí liệt kê (`WITH ORDINALITY`) thay cho `ROW_NUMBER() OVER (ORDER BY tên)` | Thứ tự hiển thị không phụ thuộc collation của DB và khớp thứ tự cơ cấu tổ chức liệt kê trong tài liệu đặc tả |
