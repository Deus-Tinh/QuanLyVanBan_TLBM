# API Nhóm 3 trên release DDL — 08/10/2026

Nguồn: Group 3 `5c3ba6b`, staging `cb77f07`, DDL `46463ba`. DDL SHA256 `0308b8dcd23e20b57994894653df1f49cf7fe212ef94c2f4a3de33ec74ed0b5f`.

User dùng chung: `accounts.Employee`; backend quyền: `authorization.backends.RbacBackend`.

| API | Thao tác | Quyền chuẩn DDL |
|---|---|---|
| `/api/records/dossiers/` | GET / POST | view_hoso / add_hoso |
| `/api/records/dossiers/{id}/` | GET / PATCH / DELETE | view_hoso / change_hoso / delete_hoso |
| `/api/records/dossiers/{id}/document-types/` | GET / POST | view_hoso / add_hoso |
| `/api/records/document-types/{id}/` | GET / PATCH / DELETE | view_hoso / change_hoso / delete_hoso |
| `/api/records/dossiers/{id}/documents/` | GET | view_hoso và ACL văn bản |

DDL không có các quyền riêng `*_loaivanban`; danh mục con dùng nhóm quyền hồ sơ, không thêm quyền vào seed chung. Danh sách trả `{count,next,previous,results}`. Chưa đăng nhập 401; thiếu quyền 403; validation 400; hồ sơ/loại đang bị tham chiếu hoặc hồ sơ hệ thống bị xóa 409. API danh sách văn bản không hỗ trợ thêm/sửa/xóa.

## Bộ lọc văn bản

`search`, `year` (1–9999), `type` (`vanbanden`, `vanbandi`, hoặc để trống), `scope` (`NOI_BO`, `HAN_CHE`, hoặc để trống), `page` (>=1), `page_size` (1–100).

Mỗi kết quả: `key` (`type:id`), `id`, `document_type`, `so_hieu`, `trich_yeu`, `ngay_van_ban`, `nam`, `pham_vi`. Không gọi bảng văn bản mật, không truy vấn `do_khan`. Cột người tạo là `nguoi_tao_id` theo DDL chuẩn hóa.

Bộ lọc quyền chạy trước COUNT/search/phân trang. Tài khoản bị khóa không xem được. NOI_BO theo quyền xem/staff/admin hoặc cờ hien_thi giống selector nhóm 2. HAN_CHE chỉ người tạo hoặc Employee nhận đích danh; admin/staff không có ngoại lệ. Metadata thực sự trả về được ghi XEM vào `documents_access_log` trong cùng transaction; không UPDATE/DELETE log.

## Điểm cần chốt liên nhóm

Trong snapshot này, `documents/selectors.py` của nhóm 2 cho phép đơn vị nhận xem HAN_CHE, khác ghi chú cụ thể ở đầu DDL về chỉ người tạo/người nhận cá nhân. Nhóm 3 áp dụng giới hạn cá nhân cho đến khi có quyết định thống nhất; không xác nhận rằng ACL toàn dự án đã đồng nhất 100%.

## Chạy cục bộ nhóm 3

`config.records_release` sử dụng các model thực trong repo staging và chỉ cài auth/contenttypes/sessions/JWT/accounts/organizations/authorization/records. Profile này phục vụ kiểm chứng và demo nhóm 3, không thay cho cấu hình toàn sản phẩm. Route `/records` trên frontend staging được thay bằng màn hình hoàn chỉnh nhóm 3, thêm hai route con. Settings/URLs mặc định staging cũng đã đăng ký records để người tích hợp tiếp nhận.

DDL được nạp vào database mới `quanlyvanban_release_20261008_g3`; bootstrap kiểm chứng schema trước khi ghi nhận 22 migration lõi hiện hữu và thực thi 15 migration hệ thống còn thiếu. Không thực thi lại seed RBAC cũ; không nhập DDL đè hai database trước đó. `--action status` dùng sau bootstrap; `--action smoke` rollback dữ liệu kiểm thử và mật khẩu.

Không chạy `migrate --fake` toàn dự án: profile đầy đủ vẫn có module và bảng dashboard tạm ngoài DDL được nhóm 1 xử lý riêng. Việc deploy/staging do người phụ trách tích hợp quyết định sau kiểm thử và review.
