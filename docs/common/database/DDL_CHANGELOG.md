# Nhật ký thay đổi `release_DDL.sql`

Mỗi PR sửa `release_DDL.sql` thêm một mục ở đầu danh sách (mới nhất trên cùng). Quy trình đổi schema: `AGENTS.md`, mục 5.

| Ngày | PR | Đối tượng thay đổi | Lý do |
|---|---|---|---|
| 2026-10-21 | #219 | Seed `accounts_position`: 25 chức vụ chuẩn (22 chức vụ của đặc tả; giữ "Quản trị viên" STT 1, "Lãnh đạo cơ quan" sau Tổng Giám đốc, "Văn thư" sau Chuyên viên) thay cho 1 dòng "Quản trị viên" | Danh mục chức vụ theo đặc tả; giữ 3 chức vụ cũ vì dữ liệu và tài khoản mẫu của các phân hệ khác đang dùng. DB có sẵn dữ liệu được migration `accounts/0009_standard_positions` sắp lại STT, không xóa chức vụ |
| 2026-10-18 | #181 | Seed `accounts_employee` (tài khoản hệ thống `admin`): dùng mật khẩu unusable theo định dạng Django; migration `accounts.0007` sửa placeholder cũ đã áp dụng | Placeholder cũ không phải hash hợp lệ, khiến đăng nhập ném `ValueError`; mật khẩu unusable bị từ chối và migration chỉ sửa đúng giá trị placeholder cũ của tài khoản hệ thống |
| 2026-10-18 | #156 | Thêm bảng `documents_folder` (thư mục tài liệu phân cấp, cột `parent_id`, `path`, `depth`) và `documents_folder_file` (tệp trong thư mục) cùng chỉ mục `idx_folder_*`, khóa ngoại tới `accounts_employee` | Lưu cây thư mục tài liệu cho trợ lý AI và giao diện thư mục nhiều cấp; khớp migration `documents` 0006 và 0007 |
| 2026-10-17 | #173 | Seed `organizations_khoi.thu_tu_hien_thi`, `organizations_donvi.stt_uu_tien`: lấy theo vị trí liệt kê (`WITH ORDINALITY`) thay cho `ROW_NUMBER() OVER (ORDER BY tên)` | Thứ tự hiển thị không phụ thuộc collation của DB và khớp thứ tự cơ cấu tổ chức liệt kê trong tài liệu đặc tả |
