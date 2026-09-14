# Hướng dẫn xử lý theo cấu trúc dự án

Tài liệu tham chiếu chính là [`docs/architecture/structure.md`](../docs/architecture/structure.md).

Khi tạo hoặc di chuyển mã nguồn:

- Đọc tài liệu cấu trúc dự án trước khi bắt đầu.
- Đặt mã nguồn Backend trong `backend/`, mã nguồn Frontend trong `frontend/`.
- Đặt module nghiệp vụ theo domain tương ứng; không đặt module mới ở thư mục gốc nếu tài liệu đã có vị trí tương ứng.
- Đặt thành phần dùng chung của Frontend trong `frontend/src/shared/`.
- Nếu thay đổi cách tổ chức thư mục, cập nhật `docs/architecture/structure.md` trong cùng phạm vi thay đổi.
- Không dùng thư mục rỗng để đánh dấu module chưa triển khai; tạo thư mục khi bắt đầu triển khai module đó.

Tài liệu này chỉ mô tả cách làm việc với cấu trúc dự án. Kiểm tra mã nguồn, test, review và quy trình Git vẫn được thực hiện theo các tài liệu liên quan.
