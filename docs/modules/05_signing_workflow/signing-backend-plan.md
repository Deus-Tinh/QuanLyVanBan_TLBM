# Plan backend Trình ký — Nhóm 5

## 1. Mục tiêu và ranh giới

### Mục tiêu

Xây dựng backend Django REST Framework cho nghiệp vụ trình ký văn bản, trong đó người tạo chọn một quy trình đã được kích hoạt; quy trình có thể chạy theo cấp tuần tự hoặc song song; mỗi người ký được chọn rõ ràng và mọi người ký được chỉ định đều phải hoàn tất chữ ký.

### Phạm vi MVP

- Quản lý quy trình trình ký và phiên bản quy trình.
- Chọn quy trình khi tạo yêu cầu trình ký.
- Chạy hai chế độ `TUAN_TU` và `SONG_SONG`.
- Chọn người ký theo tài khoản và/hoặc chức vụ; lưu snapshot tại thời điểm gửi.
- Hỗ trợ phân định vai trò trong cấp ký: ký nháy/rà soát (`INITIAL`) và ký chính/phê duyệt (`PRIMARY`) kèm gating tuần tự nội bộ cấp.
- Chữ ký số nội bộ bằng Ed25519, không nhận hoặc lưu private key trên backend.
- Khóa nội dung văn bản bằng `version` và SHA-256 tại thời điểm gửi.
- Xử lý phản hồi đa nhánh: duyệt kèm ghi chú bảo lưu không chặn luồng (`sign_note`) cho lỗi nhỏ; yêu cầu chỉnh sửa (`request_changes`) có thread giao tiếp hai chiều cho lỗi lớn, hủy/đóng attempt cũ và gửi lại toàn bộ bằng attempt mới sau khi chốt thay đổi.
- Xử lý quá hạn linh hoạt: deadline không đóng attempt, quá hạn vẫn được phép ký và ghi nhận metadata trễ hạn.
- Cơ chế chuyển quyền ký khẩn cấp (emergency transfer / delegation) khi có sự cố hoặc quá hạn nghiêm trọng.
- Audit log, thông báo in-app/email qua transactional outbox và Celery.
- Tích hợp lưu trữ qua adapter, ưu tiên filesystem được mount và cấu hình bằng biến môi trường.

### Không thuộc MVP

- Triển khai production, Docker/Compose và cấu hình hạ tầng cụ thể.
- Ký quorum hoặc quy tắc “một trong nhiều người ký”.
- Tự động từ chối hoặc tự động hủy khi quá hạn.
- Chế độ hybrid chọn TUAN_TU/SONG_SONG riêng cho từng cấp; MVP chọn một chế độ cho toàn bộ request.
- Lưu bản private key đã mã hóa trên backend để đồng bộ đa thiết bị; cần một thiết kế custody/recovery riêng được duyệt.
- Rollback runtime về cấp trước trong cùng một attempt.

### Bổ sung cuối: Khâu phát hành pháp lý (Final Legal Issuance Phase)

> **Lưu ý chi tiết:** Đây là bước bổ sung cuối cùng (Final Issuance Step) sau khi toàn bộ quy trình phê duyệt nội bộ hoàn tất.

Hệ thống phân tách rạch ròi 2 giai đoạn:
1. **Giai đoạn 1 (Duyệt nội bộ - Internal Workflow):** Sử dụng toàn bộ quy trình tuần tự/song song, Ed25519, snapshot và transactional audit log của hệ thống hiện tại. Mục tiêu: kiểm soát quy trình, chống tráo văn bản, chống chối bỏ nội bộ và tối ưu chi phí vận hành.
2. **Giai đoạn 2 (Phát hành pháp lý - Legal Issuance):** Sau khi attempt đạt `COMPLETED` ở khâu duyệt nội bộ, hệ thống mở bước phát hành (Dispatch):
   - **Ký số cá nhân lãnh đạo:** Tích hợp `LegalSignerAdapter` kết nối với dịch vụ Ký số từ xa (Cloud CA / HSM / VNeID Remote Signing) hoặc đọc thẻ CCCD gắn chip (qua NFC/đầu đọc) để nhúng Chứng thư số X.509 của Người đại diện pháp luật / Lãnh đạo có thẩm quyền.
   - **Đóng dấu số pháp nhân:** Bộ phận Văn thư (hoặc hệ thống tự động) cấp số công văn, đóng Con dấu số Doanh nghiệp (Corporate Digital Seal) kèm Dấu thời gian (Timestamp TSA) từ cơ quan có thẩm quyền trực tiếp lên file PDF theo chuẩn PAdES. Văn bản đầu ra đạt đầy đủ giá trị pháp lý tương đương văn bản giấy đóng dấu mộc đỏ.

## 2. Bằng chứng và giả định

- `[FACT]` Nhánh triển khai của Nhóm 5 là `5_signing_workflow`.
- `[FACT]` Workbook hiện có mô tả mức nghiệp vụ cao cho các bảng `signing_request`, `signing_process` và các bảng cấp ký; chưa có backend Django hoàn chỉnh để làm nguồn sự thật triển khai.
- `[ĐỀ XUẤT]` Backend dùng Django REST Framework, PostgreSQL, Celery và Redis.
- `[ĐỀ XUẤT]` Dùng Django `AUTH_USER_MODEL`; các khóa ngoại người dùng không tự tạo bảng người dùng mới.
- `[CHƯA XÁC MINH]` Tên/model của bảng văn bản hiện có và API lưu trữ tài liệu cần được chốt khi backend tài liệu được cung cấp.

## 3. Quyết định nghiệp vụ và bất biến

### 3.1. Quy trình

- Quy trình có trạng thái `DRAFT -> ACTIVE -> INACTIVE`.
- Chỉ quy trình `ACTIVE` mới được chọn khi tạo yêu cầu.
- Người tạo quy trình hoặc tài khoản quản trị/ban/phòng ký có thể kích hoạt quy trình theo quyền được cấp.
- Quy trình đang có yêu cầu active không được sửa trực tiếp.
- Khi cần thay đổi quy trình đã có lịch sử, clone thành phiên bản mới; phiên bản cũ giữ nguyên để tra cứu.
- Phạm vi hiển thị quy trình là `DEPARTMENT` hoặc `COMPANY`.
- Quy trình có `kieu_ky_mac_dinh`; khi tạo request, người tạo chọn `TUAN_TU` hoặc `SONG_SONG` theo lựa chọn được hệ thống cung cấp. Lựa chọn cuối được snapshot vào request và áp dụng cho toàn bộ request, không chọn chế độ riêng cho từng cấp trong MVP.
- Người tạo không được thay đổi danh sách người ký đã cấu hình trong quy trình.

### 3.2. Người ký và cấp ký

- Một cấp có thể có nhiều người ký; mọi người ký được chọn đều bắt buộc ký trong MVP. Không hỗ trợ optional signer hoặc quorum.
- **Phân loại vai trò trong cấp (Cấp lớn - Cấp nhỏ):** Trong cùng một cấp ký (đại diện cho một phòng ban/bộ phận), hỗ trợ 2 vai trò:
  - `INITIAL` (Ký nháy / Ký thứ cấp): Dành cho chuyên viên rà soát thể thức, số liệu, tính pháp lý.
  - `PRIMARY` (Ký chính / Quyết định): Dành cho Trưởng bộ phận hoặc người giữ thẩm quyền cao nhất của cấp đó.
- **Quy tắc Gating tuần tự nội bộ cấp:** Nếu cấp có cả người ký nháy và người ký chính, người ký chính chỉ được mở khóa ký sau khi **100% người ký nháy trong cấp đã ký xong**.
- `TUAN_TU`: chỉ cấp hiện tại được mở; cấp kế tiếp chỉ mở sau khi tất cả người ký (cả ký nháy và ký chính) ở cấp hiện tại đã ký.
- `SONG_SONG`: tất cả cấp và người ký được mở cùng lúc; yêu cầu chỉ hoàn tất sau khi tất cả người ký đã ký.
- Người tạo không tự động trở thành người ký; chỉ là người ký nếu được cấu hình trong quy trình.
- Nếu vị trí được cấu hình đang trống tại thời điểm gửi, không cho submit.
- Quy trình lưu rule; yêu cầu lưu snapshot tài khoản/chức vụ để lịch sử không đổi khi cơ cấu tổ chức thay đổi.
- Không dùng `so_nguoi_ky` làm nguồn sự thật; số người ký được tính từ các dòng signer snapshot.

### 3.3. Yêu cầu, attempt và nội dung văn bản

- Một `signing_request` ổn định có thể có nhiều `signing_attempt` bất biến.
- Lần gửi hoặc gửi lại tạo attempt mới; không ghi đè attempt cũ.
- Hash, version và storage key của văn bản được khóa tại thời điểm submit.
- Tất cả cấp ký trên cùng một attempt ký chung một bản nội dung/hash.
- Nếu nội dung thay đổi, toàn bộ chữ ký cũ chỉ còn là bằng chứng của attempt cũ; attempt mới phải ký lại từ đầu.
- **Xử lý phản hồi và lỗi trong luồng ký (2 nhánh rõ rệt):**
  - **Nhánh 1 — Lỗi nhỏ / Góp ý (Non-blocking / Approve with notes):**
    - Người ký vẫn đồng ý thông qua văn bản nhưng đính kèm `sign_note` (ghi chú bảo lưu / lưu ý cho các cấp sau).
    - Thao tác: Ký duyệt bình thường, signer slot chuyển sang `SIGNED`, **luồng ký không bị chặn** và tiếp tục chuyển tiếp.
    - Ghi chú được lưu vào bản ghi chữ ký và hiển thị cảnh báo cho Người tạo và các cấp ký kế tiếp.
  - **Nhánh 2 — Lỗi lớn / Chỉnh sửa nội dung (Blocking / Request Changes):**
    - Người ký bấm `request_changes` kèm lý do bắt buộc để chặn luồng.
    - Signer slot và attempt chuyển trạng thái tạm dừng `CHANGE_REQUESTED`.
    - **Giao tiếp hai chiều:** Hệ thống mở một `signing_change_thread` riêng. Người tạo và Người yêu cầu chỉnh sửa trao đổi, giải trình qua các tin nhắn `signing_change_message`.
    - **Chốt thay đổi và ký lại:** Sau khi thống nhất phương án sửa, Người tạo cập nhật bản nháp văn bản mới (version mới, hash mới), thread chuyển sang `RESOLVED`. Attempt cũ được đóng/hủy và hệ thống tạo một `signing_attempt` mới từ đầu để toàn bộ các cấp ký lại trên bản nội dung mới.
- Từ chối (`reject`) bắt buộc có lý do, ghi chú là tùy chọn. Xem xét lại tạo attempt mới.
- Người tạo được hủy trước khi hoàn tất; quản trị viên có thể hủy override nhưng bắt buộc lý do và audit.

### 3.4. Chữ ký và khóa

- Backend không nhận, không lưu và không log private key.
- Người dùng đăng ký public key Ed25519 qua challenge proof-of-possession; chỉ key đã verify challenge mới được chuyển sang `ACTIVE`.
- Mỗi người dùng chỉ có một key `ACTIVE` tại một thời điểm, không phụ thuộc thuật toán; rotate key phải có audit. Key cũ giữ lại để xác thực lịch sử.
- Không lưu `private_key` hoặc ciphertext chứa private key trong backend ở MVP. Đồng bộ/khôi phục khóa đa thiết bị chưa thuộc contract hiện tại.
- Ký trên `SHA-256 digest bytes` dạng raw bytes, không ký chuỗi hex.
- Backend xác thực chữ ký đồng bộ trước khi chuyển signer slot sang `SIGNED`. Khi ký có thể đính kèm `sign_note` tùy chọn.
- Bản ghi chữ ký đã tạo là bằng chứng bất biến. Thu hồi được ghi thành audit event tham chiếu chữ ký; trạng thái signer slot/current-signature pointer được cập nhật trong transaction để cho phép ký lại cùng hash mà không sửa/xóa chữ ký cũ.
- Chữ ký song song có thể bị chính người ký thu hồi trước khi attempt hoàn tất; chỉ signer slot đó quay về `PENDING` và được ký lại. Mỗi signer slot chỉ có tối đa một chữ ký hiện hành.
- Với tuần tự, không cho thu hồi sau khi chuỗi đã chuyển sang cấp sau; correction đi qua yêu cầu chỉnh sửa và attempt mới.

### 3.5. Hạn xử lý và chuyển quyền khẩn cấp

- Người tạo nhập hạn cuối chung cho toàn bộ yêu cầu (`final_due_at`).
- Có thể cấu hình SLA theo cấp trong quy trình.
- Nếu không có SLA cấp:
  - `TUAN_TU`: chia thời gian theo các cấp bằng giờ lịch.
  - `SONG_SONG`: tất cả cấp dùng cùng `final_due_at`.
- Lưu thời gian ở UTC; hiển thị theo `Asia/Ho_Chi_Minh`.
- Sau submit không cho đổi deadline; override của admin phải có audit.
- **Xử lý quá hạn (Overdue Policy):**
  - Chạm deadline không tự đổi trạng thái request/attempt sang `EXPIRED`/`QUA_HAN`, không tự hủy và không tự từ chối.
  - Người ký **vẫn được phép ký muộn** nếu các điều kiện khác còn hợp lệ. Chữ ký ký muộn được hệ thống tự động gắn cờ `is_late: true` và ghi nhận `late_duration_seconds` để phục vụ kiểm toán SLA và đánh giá KPI.
- **Chuyển quyền ký khẩn cấp (Emergency Transfer / Delegation):**
  - Khi một cấp bị tắc do người ký vắng mặt, ốm đau hoặc quá hạn nghiêm trọng, cho phép Người ký hiện tại (hoặc Quản trị viên/Lãnh đạo phụ trách) thực hiện chuyển quyền ký khẩn cấp sang một nhân sự khác có thẩm quyền tương đương.
  - Thao tác chuyển quyền yêu cầu nhập lý do bắt buộc (`delegation_reason`), ghi audit log chi tiết.
  - Signer slot được cập nhật sang user mới, lưu vết `delegated_from_user_id` và `delegated_at` mà không làm thay đổi tính toàn vẹn của attempt hay hash văn bản.
- Lịch nhắc mặc định: trước hạn 24 giờ và tại thời điểm đến hạn; quy trình có thể override.

## 4. Kiến trúc backend đề xuất

### 4.1. Thành phần

- `signing` app: model, domain service, state transition, permission, API.
- `documents` contract: chỉ tham chiếu `document_id`, `document_version`, `storage_key`, `content_hash`; không phụ thuộc đường dẫn tuyệt đối.
- `DocumentStorageAdapter`: interface đọc metadata/bytes theo storage key; MVP có adapter filesystem mount, cấu hình bằng biến môi trường. API/SFTP có thể thêm sau mà không đổi nghiệp vụ ký.
- `LegalSignerAdapter` (Khâu phát hành cuối): interface chuẩn bị hash/digest và kết nối với dịch vụ Ký số từ xa (Cloud CA/HSM) hoặc dịch vụ cấp dấu doanh nghiệp và Timestamp TSA theo chuẩn PAdES.
- PostgreSQL: dữ liệu nghiệp vụ, unique/check constraint, transaction và row lock.
- Redis: broker/result backend cho Celery và lock ngắn hạn nếu cần.
- Celery worker: thông báo, nhắc hạn, escalation và tác vụ xác nhận manifest; task chỉ truyền ID, có retry backoff/jitter và idempotency.
- Transactional outbox: ghi event và dữ liệu nghiệp vụ trong cùng transaction, worker xử lý outbox sau commit.

### 4.2. Nguyên tắc transaction và cạnh tranh

- Các action `submit`, `sign`, `reject`, `request_changes`, `revoke`, `cancel` chạy trong `transaction.atomic()`.
- Khóa attempt/request bằng `select_for_update()` trước khi kiểm tra trạng thái và cập nhật signer slot.
- Mỗi action có idempotency key; request lặp lại không tạo thêm chữ ký, attempt hoặc notification.
- Không phát thông báo trực tiếp trong transaction nghiệp vụ; chỉ tạo outbox event.
- Không để client quyết định trạng thái kế tiếp; server xác định transition từ state hiện tại, mode và các signer slot.

## 5. Thiết kế dữ liệu

### 5.1. Quy ước trường dùng chung

Các bảng nghiệp vụ mới dùng thống nhất:

| Ý nghĩa | Field | Kiểu/ghi chú |
|---|---|---|
| Người tạo | `create_by` | FK tới `AUTH_USER_MODEL` |
| Thời điểm tạo | `created_at` | DateTime UTC, tự động |
| Người cập nhật cuối | `update_by` | FK tới `AUTH_USER_MODEL`, nullable |
| Thời điểm cập nhật | `update_at` | DateTime UTC, tự động |

Không dùng lẫn `created_by`, `updated_by` trong nhóm bảng Trình ký nếu không có lý do tương thích được chốt riêng.

### 5.2. Các bảng chính

#### `signing_process`

- `id`, `ma_quy_trinh`, `ten_quy_trinh`, `mo_ta`.
- `phien_ban`, `trang_thai`: `DRAFT | ACTIVE | INACTIVE`.
- `pham_vi`: `DEPARTMENT | COMPANY`.
- `kieu_ky_mac_dinh`: `TUAN_TU | SONG_SONG`.
- `reminder_policy` hoặc JSON cấu hình nhắc hạn.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(ma_quy_trinh, phien_ban)`.

#### `signing_process_step`

- `id`, `signing_process_id`, `cap_so`, `ten_cap`, `mo_ta`.
- `sla_hours` nullable; `is_active`.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(signing_process_id, cap_so)`.

#### `signing_process_step_signer`

- `id`, `signing_process_step_id`.
- `user_id` nullable, `position_id` nullable; bắt buộc có đúng một loại target.
- `signer_role`: `INITIAL` (Ký nháy / Rà soát) | `PRIMARY` (Ký chính / Quyết định); default `PRIMARY`.
- `is_blocking`: boolean; default `true` (nếu là `INITIAL`, bắt buộc ký xong mới mở khóa cho `PRIMARY`).
- Không cần field `required`/`bat_buoc` trong MVP vì mọi signer target đều bắt buộc; nếu phải giữ để tương thích schema thì DB phải cưỡng chế giá trị luôn là true.
- `sort_order`, `create_by`, `created_at`, `update_by`, `update_at`.
- Không lưu `so_nguoi_ky` ở process step.

#### `signing_request`

- `id`, `document_id`, `document_version`, `document_storage_key`, `document_hash`.
- `signing_process_id`, `process_version`.
- `muc_do` theo nghiệp vụ hiện có nếu cần; không dùng để suy ra state machine.
- `kieu_ky`: `TUAN_TU | SONG_SONG`.
- `trang_thai`: `DRAFT | IN_PROGRESS | COMPLETED | REJECTED | CANCELLED`; quá hạn không phải trạng thái request.
- `final_due_at`, `ngay_gui`, `ngay_hoan_thanh`, `ngay_tu_choi`, `ngay_huy`.
- `ly_do_tu_choi`, `ly_do_huy`, `ghi_chu`.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Không sửa document hash/process/mode/signer snapshot sau submit.
- Request giữ lifecycle tổng thể; attempt hiện hành giữ tiến độ ký chi tiết.

#### `signing_attempt`

- `id`, `signing_request_id`, `attempt_no`, `parent_attempt_id` nullable; attempt cha nếu có phải thuộc cùng request.
- Attempt hiện hành là attempt có `attempt_no` lớn nhất của request; không cần thêm current-attempt pointer nếu không có yêu cầu truy vấn chứng minh cần thiết.
- `document_version`, `document_storage_key`, `document_hash`.
- `trang_thai`: `DRAFT | WAITING_SIGN | CHANGE_REQUESTED | COMPLETED | REJECTED | CANCELLED`.
- `submitted_at`, `completed_at`, `rejected_at`, `cancelled_at`; không có `expired_at` vì deadline không đóng attempt.
- `idempotency_key` unique theo request.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(signing_request_id, attempt_no)`.
- Attempt đã submit là lịch sử bất biến; không xóa cứng và không ghi đè khi resend/reconsider.

#### `signing_request_step`

- Snapshot từ process step: `signing_attempt_id`, `process_step_id`, `cap_so`, `ten_cap`.
- `trang_thai`: `LOCKED | PENDING | COMPLETED | BLOCKED`.
- Dùng state set riêng cho cấp ký; không dùng chung enum với signer slot.
- `due_at`, `opened_at`, `completed_at`.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(signing_attempt_id, cap_so)`.

#### `signing_request_step_signer`

- `signing_request_step_id`, `user_id`, `position_id` nullable.
- `signer_role`: `INITIAL | PRIMARY`.
- `is_blocking`: boolean.
- `delegated_from_user_id`: FK tới `AUTH_USER_MODEL`, nullable (ghi nhận người ủy quyền khi chuyển quyền khẩn cấp).
- `delegation_reason`: text, nullable.
- `delegated_at`: DateTime UTC, nullable.
- Snapshot tên hiển thị/chức vụ cần thiết cho lịch sử.
- `trang_thai`: `PENDING | SIGNED | REJECTED | CHANGE_REQUESTED`.
- `opened_at`, `signed_at`, `rejected_at`.
- Revoke là audit event; sau revoke, projection của slot về `PENDING`, không giữ `REVOKED` như trạng thái hiện tại.
- `current_signature_id` nullable hoặc quan hệ tương đương trỏ tới chữ ký hiện hành; chỉ signer slot là projection trạng thái có thể cập nhật.
- `last_action_idempotency_key`.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(signing_request_step_id, user_id)`.

#### `signing_key`

- `id`, `user_id`, `key_id`, `algorithm` (`Ed25519`), `public_key`.
- `fingerprint`, `status`: `PENDING | ACTIVE | ROTATED | REVOKED`; default `PENDING`.
- `challenge_verified_at`, `activated_at`, `revoked_at`, `replaced_by_id` nullable.
- Không có field private key.
- DB chỉ cho chuyển sang `ACTIVE` khi challenge proof đã verify; unique tối đa một key `ACTIVE` cho mỗi user, không phân biệt algorithm; fingerprint unique.
- `create_by`, `created_at`, `update_by`, `update_at`.

#### `signing_signature`

- `id`, `signing_attempt_id`, `signing_request_step_signer_id`.
- `document_hash`, `key_id`, `key_fingerprint`, `signature_bytes`.
- `algorithm`, `signed_at`, `verified_at`.
- `sign_note`: text nullable (ghi chú bảo lưu / lưu ý khi duyệt cho phép qua).
- `is_late`: boolean default `false` (đánh dấu ký sau deadline).
- `late_duration_seconds`: integer nullable (số giây trễ so với deadline cấp/yêu cầu).
- `verification_status`: `VALID | INVALID`; revocation là audit event riêng, không cập nhật trạng thái/bằng chứng của dòng chữ ký.
- Lưu metadata cần cho verify lịch sử; không tạo file riêng cho từng signer.
- Cho phép nhiều dòng lịch sử cho cùng signer slot/hash khi ký lại sau thu hồi; không đặt `UNIQUE` trên slot.
- Đảm bảo tối đa một chữ ký hiện hành cho mỗi slot qua `current_signature_id`/quan hệ hiện hành được cập nhật nguyên tử cùng signer slot; ràng buộc phải bảo đảm chữ ký được trỏ tới thuộc đúng slot và attempt. Chữ ký cũ vẫn còn nguyên để kiểm toán.

#### `signing_manifest`

- `id`, `signing_attempt_id`, `manifest_version`.
- `canonical_json`, `manifest_hash`, `storage_key`.
- `status`: `DRAFT | FINAL`.
- `finalized_at`, `create_by`, `created_at`, `update_by`, `update_at`.
- Manifest chứa document hash, signer, key fingerprint, chữ ký, thời điểm, cấp và trạng thái.
- `manifest_hash` được tính từ bytes của quy tắc canonical serialization có phiên bản; không giả định JSONB tự nó là byte representation canonical.
- Khi `FINAL`, manifest không được `UPDATE`/`DELETE`; xóa attempt không được cascade xóa manifest đã chốt.

#### `signing_change_thread` và `signing_change_message`

- Thread: `signing_attempt_id`, `requested_by`, `status` (`OPEN | RELEASED | RESOLVED`), `released_at`, `resolved_at`.
- Message: `thread_id`, `author_id`, `message`, `created_at`.
- Mỗi thread có audit; không hard-delete.
- Xóa request/attempt không được cascade xóa thread/message đã phát sinh; áp dụng cùng chính sách retention/soft-delete với attempt history.

#### `signing_audit_log`

- `actor_id`, `action`, `entity_type`, `entity_id`, `attempt_id` nullable.
- `from_status`, `to_status`, `reason`, `metadata_json`, `occurred_at`, `request_id`.
- Append-only ở tầng service và DB: role ứng dụng không có quyền `UPDATE`/`DELETE`; sự kiện thu hồi tham chiếu chữ ký bị thu hồi.
- Không cascade xóa attempt, audit, signature evidence, thread/message hoặc finalized manifest khi xóa request/attempt; dùng `RESTRICT` hoặc retention/soft-delete được chốt rõ.

#### `signing_notification`

- `recipient_id`, `event_type`, `entity_type`, `entity_id`.
- `channel`: `IN_APP | EMAIL`.
- `dedupe_key` unique, `status`: `PENDING | SENT | FAILED`.
- `scheduled_at`, `sent_at`, `attempt_count`, `last_error`.
- Có thể triển khai cùng transactional outbox hoặc tách `outbox_event` riêng nếu hạ tầng hiện có yêu cầu.

### 5.3. Constraint quan trọng

- Không submit process không có step hoặc step không có signer.
- Không submit nếu signer target là position nhưng không resolve được user active.
- Không sign nếu request/attempt không ở trạng thái cho phép, hash request không khớp hash client ký, key không active hoặc chữ ký không verify.
- Request mode là một giá trị snapshot áp dụng toàn request; không có mode override theo từng cấp trong MVP.
- Không complete `TUAN_TU` khi còn signer slot/cấp chưa hoàn tất.
- Không complete `SONG_SONG` khi còn bất kỳ signer slot nào chưa `SIGNED`.
- Re-sign sau revoke tạo thêm signature evidence; không cập nhật/xóa chữ ký lịch sử và không để hai chữ ký hiện hành trên cùng slot.
- Không đổi request/attempt sang trạng thái `EXPIRED`/`QUA_HAN`; trạng thái quá hạn được xác định riêng khỏi state machine ký.
- Không xóa attempt đã submit hoặc cascade xóa chữ ký/manifest/audit evidence.
- Không xóa request có attempt/audit history theo cách cascade làm mất attempt, signature, thread/message, manifest hoặc audit.
- `parent_attempt_id` chỉ được tham chiếu attempt cùng request.
- Chỉ kích hoạt key sau proof-of-possession; một user tối đa một key `ACTIVE`, không phân biệt thuật toán.
- Chỉ một action hợp lệ được xử lý khi có concurrent request nhờ row lock và idempotency.

## 6. State machine

### 6.1. Request và attempt

Request giữ lifecycle tổng thể; mỗi lần trình ký/gửi lại là một attempt riêng:

```text
Request:
DRAFT -> IN_PROGRESS   (submit attempt đầu tiên)
DRAFT -> CANCELLED     (creator/admin cancel trước submit)
IN_PROGRESS -> COMPLETED | REJECTED | CANCELLED
REJECTED -> IN_PROGRESS (reconsider có quyền; tạo attempt mới)

Attempt:
DRAFT -> WAITING_SIGN  (submit)
WAITING_SIGN -> CHANGE_REQUESTED | REJECTED | COMPLETED | CANCELLED
CHANGE_REQUESTED -> (giữ nguyên lịch sử; resolve thread + resend tạo attempt mới)
REJECTED -> (giữ nguyên lịch sử; reconsider tạo attempt mới)
```

Khi attempt nhận `request_changes`, parent request vẫn `IN_PROGRESS` nhưng không cho ký tiếp trên attempt đang tạm dừng. Attempt cũ không quay về `WAITING_SIGN` và không bị ghi đè; khi người tạo giải quyết thread, request trỏ tới attempt mới. Không có transition `EXPIRED`/`QUA_HAN`: deadline chỉ kích hoạt nhắc/escalation, không ngăn ký muộn.

### 6.2. Signer action

- `sign`: `PENDING -> SIGNED` sau khi verify Ed25519; nhận thêm `sign_note` tùy chọn (ghi chú bảo lưu / không chặn luồng). Nếu ký sau hạn, gắn `is_late: true` và tính `late_duration_seconds`.
- `reject`: signer slot và attempt chuyển rejected; lý do bắt buộc.
- `request_changes`: signer slot và attempt chuyển change requested; lý do bắt buộc. Kích hoạt thread giao tiếp hai chiều; chốt giải pháp thì đóng attempt cũ và tạo attempt mới để ký lại toàn bộ.
- `delegate`: chuyển quyền ký khẩn cấp; yêu cầu lý do bắt buộc, ghi audit log chi tiết, cập nhật signer slot sang user mới và lưu vết `delegated_from_user_id`.
- `revoke`: chỉ signer đã ký trong `SONG_SONG` và attempt chưa hoàn tất; ghi audit event, bỏ current-signature pointer và đưa signer slot về `PENDING`. Dòng chữ ký cũ không bị sửa/xóa; ký lại tạo dòng chữ ký mới cho cùng slot/hash.

## 7. API contract dự kiến

API dùng version prefix `/api/v1/`, serializer validation và permission riêng. Tên endpoint là contract dự kiến, cần đối chiếu với convention backend trước khi code.

### 7.1. Quy trình

- `GET /signing/processes`: danh sách theo scope/quyền.
- `POST /signing/processes`: tạo draft.
- `GET /signing/processes/{id}`: chi tiết cùng steps/signers (kèm `signer_role` và `is_blocking`).
- `PATCH /signing/processes/{id}`: chỉ draft.
- `POST /signing/processes/{id}/activate`: kích hoạt.
- `POST /signing/processes/{id}/deactivate`: ngừng dùng.
- `POST /signing/processes/{id}/clone`: tạo phiên bản mới từ quy trình cũ.

### 7.2. Yêu cầu trình ký

- `GET /signing/requests`: lọc theo creator/assignee/admin/auditor và department mặc định.
- `POST /signing/requests`: tạo draft từ document contract và process.
- `GET /signing/requests/{id}`: tổng quan, cấp, signer slot, deadline, lịch sử.
- `POST /signing/requests/{id}/submit`: khóa document/process snapshot, tạo attempt.
- `POST /signing/requests/{id}/cancel`: hủy theo quyền.
- `POST /signing/requests/{id}/reconsider`: tạo attempt mới sau reject.
- `POST /signing/requests/{id}/dispatch-legal`: khâu bổ sung cuối — phát hành pháp lý sau khi attempt hoàn tất (kết nối CA/HSM/CCCD ký số PAdES và đóng dấu số doanh nghiệp).

### 7.3. Hành động người ký

- `POST /signing/attempts/{id}/sign`: nhận `key_id`, digest/hash, signature và `sign_note` tùy chọn; verify server-side.
- `POST /signing/attempts/{id}/reject`: reason bắt buộc, note tùy chọn.
- `POST /signing/attempts/{id}/request-changes`: reason bắt buộc, mở thread giao tiếp.
- `POST /signing/attempts/{id}/delegate`: chuyển quyền ký khẩn cấp (payload: `new_user_id`, `reason` bắt buộc).
- `POST /signing/attempts/{id}/revoke`: chỉ cho parallel trước completion.

### 7.4. Khóa và audit

- `POST /signing/keys/challenge`: tạo challenge.
- `POST /signing/keys/verify`: verify proof-of-possession và activate key.
- `POST /signing/keys/{id}/rotate`: rotate có audit.
- `GET /signing/requests/{id}/audit`: xem audit theo quyền.
- `GET /signing/attempts/{id}/manifest`: lấy manifest canonical và trạng thái verify.

### 7.5. Quy tắc API chung

- Trả lỗi validation theo field và mã lỗi nghiệp vụ ổn định.
- Hành động chuyển trạng thái yêu cầu `Idempotency-Key`.
- Không trả public key/private dữ liệu nhạy cảm ngoài contract cần thiết; không log signature/private material dưới dạng không kiểm soát.
- Pagination và filter phải giới hạn theo ownership/assignment/scope, không chỉ ẩn ở UI.

## 8. Quyền và phạm vi nhìn thấy

- Nhân viên đã xác thực được tạo yêu cầu nếu có quyền truy cập văn bản và nhìn thấy process active.
- Request list mặc định gồm creator, assigned signer, admin và auditor; filter mặc định theo phòng ban người tạo.
- Permission tách riêng tối thiểu:
  - `view_signing`
  - `create_signing_request`
  - `manage_signing_process`
  - `submit_signing_request`
  - `sign_signing_request`
  - `delegate_signing_request`
  - `cancel_signing_request`
  - `view_signing_audit`
- Quyền phải kiểm tra ở API/service; frontend chỉ là lớp hỗ trợ UX.

## 9. Deadline, notification và Celery

### 9.1. Job định kỳ

- Job quét deadline theo batch, chọn request có `final_due_at` hoặc cấp ký có `due_at` gần đến hạn.
- Tạo notification bằng `dedupe_key`, không gửi trùng khi worker retry.
- Mốc mặc định: `due_at - 24h` và `due_at`; process policy được ưu tiên nếu có.
- Job escalation chỉ tạo event/audit; không đổi request/attempt sang `EXPIRED`, không chặn ký muộn, không tự đổi signer và không tự reject.

### 9.2. Celery rules

- Task nhận ID và đọc dữ liệu mới nhất trong transaction/service.
- Retry có exponential backoff, jitter và giới hạn số lần.
- Task idempotent; lỗi cuối cùng lưu vào notification/outbox để quan sát và retry thủ công.
- Không đặt logic state transition quan trọng chỉ trong task nền; action đồng bộ phải bảo toàn invariant trước.

## 10. Kế hoạch triển khai theo pha

### Pha 0 — Chốt contract và khung app

- Kiểm tra cấu trúc Django thực tế trên branch nhóm 5.
- Chốt tên model/field tích hợp document, user, department, position.
- Tạo app/config, URL versioning, base permission, timezone và error format.
- Chốt migration convention và test database.

### Pha 1 — Schema và process management

- Tạo migration cho process, step, process signer (kèm role `INITIAL`/`PRIMARY` và `is_blocking`) và audit dùng chung.
- Implement draft/activate/deactivate/clone, scope department/company.
- Thêm constraint không sửa active process có request đang chạy.
- Test uniqueness, empty step, empty signer, position trống và quyền.

### Pha 2 — Request/attempt và signer snapshot

- Implement create draft, submit, snapshot process/document/signer.
- Implement sequential/parallel opening và completion; gating tuần tự nội bộ cấp giữa ký nháy và ký chính.
- Thêm transaction lock/idempotency.
- Test race condition: hai signer ký đồng thời, submit lặp, sign lặp.

### Pha 3 — Crypto và manifest

- Implement challenge/proof-of-possession, key rotation và revoke.
- Verify Ed25519 trên digest raw bytes.
- Lưu signature evidence bất biến (hỗ trợ `sign_note` và metadata `is_late`) và canonical manifest; thu hồi ghi thành event riêng, re-sign giữ lại bằng chứng cũ.
- Test hash mismatch, key inactive, signature invalid, key cũ verify lịch sử, parallel revoke/re-sign và không mất signature/manifest khi xóa attempt bị chặn.

### Pha 4 — Correction, delegation, reject, cancel và deadline

- Implement change thread/message, giao tiếp hai chiều giữa creator và reviewer, pause toàn bộ attempt, resolve và resend toàn bộ bằng attempt mới.
- Implement chuyển quyền ký khẩn cấp (`delegate`) có audit log và lưu vết người ủy quyền.
- Implement reject/reconsider/cancel/admin override.
- Implement UTC deadline, reminder schedule và escalation; không tự chuyển state sang expired hoặc tự đóng attempt; cho phép ký muộn kèm gắn cờ trễ hạn.
- Test nhiều signer cùng request changes và không còn thao tác resend một phần.
- Test request/attempt quá hạn vẫn ở trạng thái chờ ký và ký muộn được nếu các điều kiện ký còn hợp lệ.

### Pha 5 — Outbox, notification và tích hợp storage / legal adapter

- Implement outbox/notification và Celery task có dedupe/retry.
- Implement filesystem adapter qua env-configured mount.
- Bổ sung interface `LegalSignerAdapter` cho khâu bổ sung cuối: ký số CA/CCCD và đóng dấu pháp nhân PAdES.
- Bổ sung contract test để thay adapter bằng API/SFTP sau này không đổi domain service.

### Pha 6 — API hardening và bàn giao

- Hoàn thiện OpenAPI/schema lỗi/idempotency documentation.
- Chạy migration, check, test, lint/type check phù hợp repo.
- Review quyền, audit, log và dữ liệu nhạy cảm.
- Chỉ sau khi kiểm tra branch/status mới stage đúng các file thuộc task.

## 11. Acceptance criteria

### Workflow

- Có thể tạo process nhiều cấp, mỗi cấp nhiều signer target; phân định rõ vai trò `INITIAL` (ký nháy) và `PRIMARY` (ký chính).
- Người ký chính chỉ mở khóa ký khi toàn bộ người ký nháy trong cấp đã ký xong (`is_blocking: true`).
- Người tạo chọn `TUAN_TU` hoặc `SONG_SONG` khi tạo request; lựa chọn áp dụng toàn request, không cấu hình riêng từng cấp.
- Parallel yêu cầu toàn bộ signer đã chọn đều ký.
- Sequential không mở cấp sau trước khi cấp hiện tại hoàn tất.
- Cho phép chuyển quyền ký khẩn cấp (`delegate`) khi có lý do chính đáng mà không hủy attempt.
- Process active immutable; thay đổi lịch sử thực hiện bằng clone version.
- Position trống chặn submit.

### Data integrity & Correction

- Request giữ snapshot process/version/signer/document hash.
- Duyệt kèm `sign_note` lưu vào chữ ký mà không chặn luồng ký.
- Lỗi lớn chặn luồng bằng `request_changes`, mở thread giao tiếp hai chiều; sau khi chốt sửa thì attempt cũ đóng lại và tạo attempt mới ký lại từ đầu trên bản hash mới.
- Attempt đã submit, chữ ký và manifest `FINAL` không bị cascade-delete; database/app role chặn xóa cứng hoặc dùng retention/soft-delete được định nghĩa.
- Attempt cha chỉ thuộc cùng request; re-sign không ghi đè signature evidence cũ và mỗi signer slot có tối đa một chữ ký hiện hành.
- Không có chữ ký được tính là hợp lệ nếu hash hoặc public key không khớp.
- Các action concurrent và retry không tạo bản ghi/trạng thái trùng.

### Crypto/audit & Legal Adapter

- Private key không xuất hiện trong request, database, log hoặc manifest.
- Signature verify được từ public key và raw SHA-256 digest.
- Key rotation, revoke parallel, reject, request changes, delegation, cancel và admin override đều có audit.
- Revoke không sửa/xóa chữ ký lịch sử; event audit tham chiếu chữ ký bị thu hồi.
- Manifest canonical có thể kiểm tra độc lập theo attempt.
- Manifest `FINAL` bất biến; hash được tính từ canonical serialization có phiên bản.
- Khâu bổ sung cuối: Cung cấp adapter interface sẵn sàng cắm dịch vụ ký số CA/CCCD và đóng dấu PAdES khi văn bản đạt trạng thái hoàn tất phê duyệt nội bộ.

### Deadline/notification

- Deadline lưu UTC, hiển thị đúng giờ Việt Nam.
- Nhắc 24 giờ trước và tại hạn, không gửi trùng khi worker retry.
- Quá hạn không tự reject/đổi người ký/hủy luồng.
- Request/attempt quá hạn vẫn ở trạng thái đang xử lý/chờ ký; người ký ký muộn được ghi nhận `is_late: true` và `late_duration_seconds`.

### Verification commands dự kiến

Các lệnh dưới đây chỉ chạy sau khi xác nhận cấu trúc backend thực tế:

```powershell
python backend/manage.py check
python backend/manage.py makemigrations --check --dry-run
pytest
```

Nếu repo đã có chuẩn lint/type check, bổ sung đúng command của repo trước khi báo hoàn tất.

## 12. Rủi ro và điểm cần chốt khi bắt đầu code

- `[CHƯA XÁC MINH]` Tên bảng/model document, department, position và storage API hiện có.
- `[CHƯA XÁC MINH]` Permission backend hiện tại có thể map trực tiếp với các permission đề xuất hay cần adapter.
- `[ĐỀ XUẤT]` Giữ `create_by`, `created_at`, `update_by`, `update_at` đồng nhất với sheet Trình ký và các sheet liên quan.
- `[ĐÃ CHỐT]` Xử lý phản hồi đa nhánh: Ghi chú không chặn (`sign_note`) cho phép qua và lưu audit; Yêu cầu chỉnh sửa (`request_changes`) tạm dừng attempt, mở thread trao đổi và resend toàn bộ bằng attempt mới.
- `[ĐÃ CHỐT]` Quá hạn không đóng attempt; cho phép ký muộn kèm metadata trễ hạn; hỗ trợ chuyển quyền ký khẩn cấp.
- `[ĐÃ CHỐT]` Khâu ký số pháp lý (CA/CCCD/dấu doanh nghiệp) là bước bổ sung cuối cùng (Final Issuance Phase) sau khi attempt duyệt nội bộ hoàn tất.
- `[CHƯA CHỐT]` Khôi phục khóa đa thiết bị. MVP không lưu private key hoặc encrypted private key ở backend; thay đổi ranh giới custody cần quyết định security riêng.
- `[BỊ CHẶN nếu thiếu]` Không thể chạy migration/test tích hợp đầy đủ nếu branch chưa có Django project và cấu hình PostgreSQL/test database.

## 13. Definition of Done

- Migration áp dụng được trên database test sạch.
- Ràng buộc FK/retention ngăn xóa request/attempt đã có lịch sử và cascade xóa signature evidence, thread/message, audit hoặc manifest `FINAL`.
- API/service đã kiểm tra state transition, permission, ownership, delegation và idempotency.
- Unit/integration tests bao phủ tuần tự, song song, ký nháy - ký chính gating, reject, request changes, resend toàn bộ, delegate khẩn cấp, revoke/re-sign giữ lịch sử, late sign sau deadline và concurrent sign.
- Crypto test xác nhận hash mismatch/private key boundary/key rotation.
- Outbox/Celery test xác nhận retry không gửi trùng.
- Không sửa hoặc stage các file ngoài phạm vi backend Trình ký.
- Branch/status/diff được review trước khi commit và push.
