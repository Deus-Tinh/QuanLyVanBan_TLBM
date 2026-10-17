# API nhóm 3 — cập nhật review PR #123, 09/10/2026

Base kiểm chứng: PR #123 ở `362a367`; DDL `46463ba`, SHA256 `0308b8dcd23e20b57994894653df1f49cf7fe212ef94c2f4a3de33ec74ed0b5f`. User dùng chung `accounts.Employee`, backend `authorization.backends.RbacBackend`.

| API | Thao tác | Quyền DDL |
|---|---|---|
| `/api/records/dossiers/` | GET / POST | view_hoso / add_hoso |
| `/api/records/dossiers/{id}/` | GET / PATCH / DELETE | view_hoso / change_hoso / delete_hoso |
| `/api/records/document-types/` | GET — danh mục cấp 2 độc lập | view_hoso |
| `/api/records/dossiers/{id}/document-types/` | GET / POST | view_hoso / add_hoso |
| `/api/records/document-types/{id}/` | GET / PATCH / DELETE | view_hoso / change_hoso / delete_hoso |
| `/api/records/dossiers/{id}/documents/` | Đã gỡ; 404 | Không còn API metadata riêng |

DDL không có `*_loaivanban`; danh mục con dùng quyền hồ sơ. Danh sách trả `{count,next,previous,results}`. Danh mục loại trả thêm `ten_ho_so` chỉ đọc; `id` là PK của loại văn bản, `ho_so` là PK hồ sơ cha. Bộ lọc danh mục: `search`, `year`, `page`, `page_size`; danh mục độc lập thêm `ho_so` là số nguyên dương. API độc lập chỉ đọc, thao tác tạo loại vẫn thuộc hồ sơ cụ thể. Chưa đăng nhập 401, thiếu quyền 403, validation 400, xóa hồ sơ hệ thống hoặc đối tượng còn tham chiếu 409.

## Giao diện theo yêu cầu mới của thầy

- `/records`: trang Hồ sơ cấp 1.
- `/records/document-types`: trang Loại văn bản cấp 2 độc lập, có hồ sơ cha.
- `/records/{id}/document-types`: cùng trang cấp 2, giới hạn hồ sơ đang chọn.
- Click tên loại hoặc nút xem văn bản mở popup chọn **đến / đi**, thêm tùy chọn **mật (hạn chế)**.
- Popup chuyển đến trang nhóm 2, truyền `loai_van_ban=<PK loại>`; khi chọn mật, thêm `pham_vi=HAN_CHE`.
- URL trang riêng cũ `/records/{id}/documents` chuyển về danh mục loại; không còn trang hoặc truy vấn văn bản riêng.

“Mật” là phạm vi của văn bản đến/đi theo release. Không khôi phục bảng `vanbanmat`, kind `MAT` hoặc quyền cũ. Popup chỉ chọn danh sách, không tự tạo văn bản. Việc thêm văn bản nằm ở module nhóm 2 và phải kiểm tra quyền ở API nhóm 2.

## Hợp đồng nhóm 2 và phần chưa hoàn thành liên nhóm

| Lựa chọn | Trang nhóm 2 | Query |
|---|---|---|
| Đến | `/documents/incoming` | `loai_van_ban=23` |
| Đi | `/documents/outgoing` | `loai_van_ban=23` |
| Đến mật | `/documents/incoming` | `loai_van_ban=23&pham_vi=HAN_CHE` |
| Đi mật | `/documents/outgoing` | `loai_van_ban=23&pham_vi=HAN_CHE` |

ID 23 chỉ là ví dụ. Trong snapshot review, incoming chưa chuyển `loai_van_ban` vào API; filter backend chưa khai báo `pham_vi`; outgoing là placeholder. Nhóm 2 cần tiếp nhận hợp đồng này, gửi bộ lọc xuống API, hiển thị loại đã chọn, giữ hoặc xóa bộ lọc đúng khi đổi URL và kiểm tra ACL trước đếm/phân trang. Không đánh dấu toàn luồng hoàn thành chỉ dựa trên việc URL đã đúng.

Xóa API G3 giải quyết đường bypass metadata nêu trong review; không khẳng định ACL của module nhóm 2 đã được kiểm chứng hoặc đã sửa tất cả lỗi của nhóm 2.

## Chỉ mục và database hiện hữu

Model khai báo hai index `idx_hoso_nguoi_lap`, `idx_loaivanban_hoso`; hai ForeignKey dùng `db_index=False`. Migration `records` (`0001_initial`, `0002_hoso_guards`) tạo bảng, index, constraint và trigger khớp `release_DDL.sql`; hàm và trigger chép nguyên văn từ DDL, chỉ chạy trên PostgreSQL.

Database dựng bằng `scripts/build_db.py` đã có sẵn bảng `records_*` từ DDL nên migration `records` được ghi nhận là đã áp dụng (fake). Quy trình dựng và đồng bộ xem `docs/common/database/build_db_runbook.md`. Lệch còn lại giữa migration và DDL nằm trong `docs/common/database/schema_drift_baseline.txt`.

Profile `config.records_release` phục vụ kiểm chứng nhóm 3, không thay cho toàn bộ cấu hình deploy. Quy trình Git: nhánh cá nhân → `3_dossiers_documents` → `staging`; người phụ trách tích hợp quyết định merge staging/deploy.
