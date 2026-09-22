# Plan backend Trình ký — Nhóm 5

## 1. Mục tiêu và ranh giới

### Mục tiêu

Xây dựng backend Django REST Framework cho nghiệp vụ trình ký văn bản, trong đó người tạo chọn một quy trình đã được kích hoạt; quy trình có thể chạy theo cấp tuần tự hoặc song song; mỗi người ký được chọn rõ ràng và mọi người ký được chỉ định đều phải hoàn tất chữ ký.

### Phạm vi MVP

- Quản lý quy trình trình ký và phiên bản quy trình.
- Chọn quy trình khi tạo yêu cầu trình ký.
- Chạy hai chế độ `TUAN_TU` và `SONG_SONG`.
- Chọn người ký theo tài khoản và/hoặc chức vụ; lưu snapshot tại thời điểm gửi.
- Chữ ký số bằng Ed25519, không nhận hoặc lưu private key trên backend.
- Khóa nội dung văn bản bằng `version` và SHA-256 tại thời điểm gửi.
- Từ chối, yêu cầu chỉnh sửa, gửi lại toàn bộ bằng attempt mới, hủy, hết hạn, nhắc hạn.
- Audit log, thông báo in-app/email qua transactional outbox và Celery.
- Tích hợp lưu trữ qua adapter, ưu tiên filesystem được mount và cấu hình bằng biến môi trường.

### Không thuộc MVP

- Triển khai production, Docker/Compose và cấu hình hạ tầng cụ thể.
- Ký quorum hoặc quy tắc “một trong nhiều người ký”.
- Tự động thay người ký, tự động từ chối khi quá hạn.
- PDF hiển thị nhiều chữ ký hoặc tạo một file mới cho từng người ký.
- Rollback runtime về cấp trước trong cùng một attempt.

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
- Chế độ ký `TUAN_TU` hoặc `SONG_SONG` được chọn ở cấp yêu cầu theo cấu hình quy trình; không cho người tạo ghi đè danh sách người ký đã cấu hình.

### 3.2. Người ký và cấp ký

- Một cấp có thể có nhiều người ký; mặc định tất cả người ký được chọn đều bắt buộc ký.
- `TUAN_TU`: chỉ cấp hiện tại được mở; cấp kế tiếp chỉ mở sau khi tất cả người ký ở cấp hiện tại đã ký.
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
- Yêu cầu chỉnh sửa làm tạm dừng toàn bộ attempt, kể cả sau khi một số người đã ký.
- Mỗi yêu cầu chỉnh sửa có một thread riêng. Người tạo sửa bản nháp, giải quyết từng thread; sau khi hoàn tất chỉ còn thao tác `Gửi lại toàn bộ` để tạo attempt mới.
- Bản nháp thread chỉ hiển thị cho người tạo và người yêu cầu chỉnh sửa; sau khi release, giữ audit tối thiểu và không xóa cứng.
- Từ chối bắt buộc có lý do, ghi chú là tùy chọn. Xem xét lại tạo attempt mới.
- Người tạo được hủy trước khi hoàn tất; quản trị viên có thể hủy override nhưng bắt buộc lý do và audit.

### 3.4. Chữ ký và khóa

- Backend không nhận, không lưu và không log private key.
- Người dùng đăng ký public key Ed25519 qua challenge proof-of-possession trước khi key được active.
- Mỗi người dùng chỉ có một key active; rotate key phải có audit. Key cũ giữ lại để xác thực lịch sử.
- Ký trên `SHA-256 digest bytes` dạng raw bytes, không ký chuỗi hex.
- Backend xác thực chữ ký đồng bộ trước khi chuyển signer slot sang `SIGNED`.
- Chữ ký song song có thể bị chính người ký thu hồi trước khi attempt hoàn tất; chỉ signer slot đó quay về `PENDING`, có audit và có thể ký lại cùng hash.
- Với tuần tự, không cho thu hồi sau khi chuỗi đã chuyển sang cấp sau; correction đi qua yêu cầu chỉnh sửa và attempt mới.

### 3.5. Hạn xử lý

- Người tạo nhập hạn cuối chung cho toàn bộ yêu cầu (`final_due_at`).
- Có thể cấu hình SLA theo cấp trong quy trình.
- Nếu không có SLA cấp:
  - `TUAN_TU`: chia thời gian theo các cấp bằng giờ lịch.
  - `SONG_SONG`: tất cả cấp dùng cùng `final_due_at`.
- Lưu thời gian ở UTC; hiển thị theo `Asia/Ho_Chi_Minh`.
- Sau submit không cho đổi deadline; override của admin phải có audit.
- Quá hạn vẫn giữ yêu cầu ở trạng thái pending/expired theo policy; hệ thống nhắc/escalate, không tự động từ chối và không tự thay người ký.
- Lịch nhắc mặc định: trước hạn 24 giờ và tại thời điểm đến hạn; quy trình có thể override.

## 4. Kiến trúc backend đề xuất

### 4.1. Thành phần

- `signing` app: model, domain service, state transition, permission, API.
- `documents` contract: chỉ tham chiếu `document_id`, `document_version`, `storage_key`, `content_hash`; không phụ thuộc đường dẫn tuyệt đối.
- `DocumentStorageAdapter`: interface đọc metadata/bytes theo storage key; MVP có adapter filesystem mount, cấu hình bằng biến môi trường. API/SFTP có thể thêm sau mà không đổi nghiệp vụ ký.
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
- `required`: MVP luôn true nhưng giữ field để biểu đạt contract.
- `sort_order`, `create_by`, `created_at`, `update_by`, `update_at`.
- Không lưu `so_nguoi_ky` ở process step.

#### `signing_request`

- `id`, `document_id`, `document_version`, `document_storage_key`, `document_hash`.
- `signing_process_id`, `process_version`.
- `muc_do` theo nghiệp vụ hiện có nếu cần; không dùng để suy ra state machine.
- `kieu_ky`: `TUAN_TU | SONG_SONG`.
- `trang_thai`: `DRAFT | IN_PROGRESS | COMPLETED | REJECTED | CANCELLED | EXPIRED`.
- `final_due_at`, `ngay_gui`, `ngay_hoan_thanh`, `ngay_tu_choi`, `ngay_huy`.
- `ly_do_tu_choi`, `ly_do_huy`, `ghi_chu`.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Không sửa document hash/process snapshot sau submit.

#### `signing_attempt`

- `id`, `signing_request_id`, `attempt_no`, `parent_attempt_id` nullable.
- `document_version`, `document_storage_key`, `document_hash`.
- `trang_thai`: `DRAFT | WAITING_SIGN | CHANGE_REQUESTED | COMPLETED | REJECTED | CANCELLED | EXPIRED`.
- `submitted_at`, `completed_at`, `rejected_at`, `cancelled_at`, `expired_at`.
- `idempotency_key` unique theo request.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(signing_request_id, attempt_no)`.

#### `signing_request_step`

- Snapshot từ process step: `signing_attempt_id`, `process_step_id`, `cap_so`, `ten_cap`.
- `trang_thai`: `LOCKED | PENDING | COMPLETED | BLOCKED`.
- `due_at`, `opened_at`, `completed_at`.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(signing_attempt_id, cap_so)`.

#### `signing_request_step_signer`

- `signing_request_step_id`, `user_id`, `position_id` nullable.
- Snapshot tên hiển thị/chức vụ cần thiết cho lịch sử.
- `trang_thai`: `PENDING | SIGNED | REJECTED | CHANGE_REQUESTED | REVOKED`.
- `opened_at`, `signed_at`, `rejected_at`, `revoked_at`.
- `last_action_idempotency_key`.
- `create_by`, `created_at`, `update_by`, `update_at`.
- Unique: `(signing_request_step_id, user_id)`.

#### `signing_key`

- `id`, `user_id`, `key_id`, `algorithm` (`Ed25519`), `public_key`.
- `fingerprint`, `status`: `PENDING | ACTIVE | ROTATED | REVOKED`.
- `challenge_verified_at`, `activated_at`, `revoked_at`, `replaced_by_id` nullable.
- Không có field private key.
- Unique một key `ACTIVE` cho mỗi user; fingerprint unique.
- `create_by`, `created_at`, `update_by`, `update_at`.

#### `signing_signature`

- `id`, `signing_attempt_id`, `signing_request_step_signer_id`.
- `document_hash`, `key_id`, `key_fingerprint`, `signature_bytes`.
- `algorithm`, `signed_at`, `verified_at`.
- `status`: `VALID | REVOKED | INVALID`.
- Lưu metadata cần cho verify lịch sử; không tạo file riêng cho từng signer.
- Unique chữ ký active theo `(attempt, signer_slot, document_hash)` phù hợp policy revoke.

#### `signing_manifest`

- `id`, `signing_attempt_id`, `manifest_version`.
- `canonical_json`, `manifest_hash`, `storage_key`.
- `status`: `DRAFT | FINAL`.
- `finalized_at`, `create_by`, `created_at`, `update_by`, `update_at`.
- Manifest chứa document hash, signer, key fingerprint, chữ ký, thời điểm, cấp và trạng thái.

#### `signing_change_thread` và `signing_change_message`

- Thread: `signing_attempt_id`, `requested_by`, `status` (`OPEN | RELEASED | RESOLVED`), `released_at`, `resolved_at`.
- Message: `thread_id`, `author_id`, `message`, `created_at`.
- Mỗi thread có audit; không hard-delete.

#### `signing_audit_log`

- `actor_id`, `action`, `entity_type`, `entity_id`, `attempt_id` nullable.
- `from_status`, `to_status`, `reason`, `metadata_json`, `occurred_at`, `request_id`.
- Append-only ở tầng service; không cho API nghiệp vụ update/delete.

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
- Không complete `TUAN_TU` khi còn signer slot/cấp chưa hoàn tất.
- Không complete `SONG_SONG` khi còn bất kỳ signer slot nào chưa `SIGNED`.
- Chỉ một action hợp lệ được xử lý khi có concurrent request nhờ row lock và idempotency.

## 6. State machine

### 6.1. Request/attempt

```text
DRAFT
  -> WAITING_SIGN       (submit)
  -> CANCELLED          (creator/admin cancel trước hoàn tất)

WAITING_SIGN
  -> CHANGE_REQUESTED   (signer request_changes)
  -> REJECTED           (signer reject)
  -> COMPLETED          (tất cả signer slot đã ký)
  -> CANCELLED          (creator/admin cancel)
  -> EXPIRED            (deadline job đánh dấu theo policy)

CHANGE_REQUESTED
  -> WAITING_SIGN       (resolve toàn bộ thread + gửi lại toàn bộ, tạo attempt mới)
  -> CANCELLED

REJECTED
  -> WAITING_SIGN       (xem xét lại, tạo attempt mới)
```

Attempt cũ không quay ngược trạng thái và không bị ghi đè. Request giữ liên kết attempt hiện tại và toàn bộ lịch sử.

### 6.2. Signer action

- `sign`: `PENDING -> SIGNED` sau khi verify Ed25519.
- `reject`: signer slot và attempt chuyển rejected; lý do bắt buộc.
- `request_changes`: signer slot và attempt chuyển change requested; lý do bắt buộc.
- `revoke`: chỉ signer đã ký trong `SONG_SONG` và attempt chưa hoàn tất; `SIGNED -> REVOKED -> PENDING`.

## 7. API contract dự kiến

API dùng version prefix `/api/v1/`, serializer validation và permission riêng. Tên endpoint là contract dự kiến, cần đối chiếu với convention backend trước khi code.

### 7.1. Quy trình

- `GET /signing/processes`: danh sách theo scope/quyền.
- `POST /signing/processes`: tạo draft.
- `GET /signing/processes/{id}`: chi tiết cùng steps/signers.
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

### 7.3. Hành động người ký

- `POST /signing/attempts/{id}/sign`: nhận `key_id`, digest/hash và signature; verify server-side.
- `POST /signing/attempts/{id}/reject`: reason bắt buộc, note tùy chọn.
- `POST /signing/attempts/{id}/request-changes`: reason bắt buộc, note tùy chọn.
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
  - `cancel_signing_request`
  - `view_signing_audit`
- Quyền phải kiểm tra ở API/service; frontend chỉ là lớp hỗ trợ UX.

## 9. Deadline, notification và Celery

### 9.1. Job định kỳ

- Job quét deadline theo batch, chọn request/attempt có `final_due_at` gần đến hạn.
- Tạo notification bằng `dedupe_key`, không gửi trùng khi worker retry.
- Mốc mặc định: `due_at - 24h` và `due_at`; process policy được ưu tiên nếu có.
- Job escalation chỉ tạo event/audit; không tự đổi signer và không tự reject.

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

- Tạo migration cho process, step, process signer và audit dùng chung.
- Implement draft/activate/deactivate/clone, scope department/company.
- Thêm constraint không sửa active process có request đang chạy.
- Test uniqueness, empty step, empty signer, position trống và quyền.

### Pha 2 — Request/attempt và signer snapshot

- Implement create draft, submit, snapshot process/document/signer.
- Implement sequential/parallel opening và completion.
- Thêm transaction lock/idempotency.
- Test race condition: hai signer ký đồng thời, submit lặp, sign lặp.

### Pha 3 — Crypto và manifest

- Implement challenge/proof-of-possession, key rotation và revoke.
- Verify Ed25519 trên digest raw bytes.
- Lưu signature record và canonical manifest bất biến.
- Test hash mismatch, key inactive, signature invalid, key cũ verify lịch sử và revoke parallel.

### Pha 4 — Correction, reject, cancel và deadline

- Implement change thread/message, pause toàn bộ attempt, resolve và resend toàn bộ.
- Implement reject/reconsider/cancel/admin override.
- Implement UTC deadline, reminder schedule, expiry/escalation.
- Test nhiều signer cùng request changes và không còn thao tác resend một phần.

### Pha 5 — Outbox, notification và tích hợp storage

- Implement outbox/notification và Celery task có dedupe/retry.
- Implement filesystem adapter qua env-configured mount.
- Bổ sung contract test để thay adapter bằng API/SFTP sau này không đổi domain service.

### Pha 6 — API hardening và bàn giao

- Hoàn thiện OpenAPI/schema lỗi/idempotency documentation.
- Chạy migration, check, test, lint/type check phù hợp repo.
- Review quyền, audit, log và dữ liệu nhạy cảm.
- Chỉ sau khi kiểm tra branch/status mới stage đúng các file thuộc task.

## 11. Acceptance criteria

### Workflow

- Có thể tạo process nhiều cấp, mỗi cấp nhiều signer target.
- Có thể chọn `TUAN_TU` hoặc `SONG_SONG`; parallel yêu cầu toàn bộ signer đã chọn đều ký.
- Sequential không mở cấp sau trước khi cấp hiện tại hoàn tất.
- Process active immutable; thay đổi lịch sử thực hiện bằng clone version.
- Position trống chặn submit.

### Data integrity

- Request giữ snapshot process/version/signer/document hash.
- Attempt cũ bất biến; resend/reconsider tạo attempt mới.
- Không có chữ ký được tính là hợp lệ nếu hash hoặc public key không khớp.
- Các action concurrent và retry không tạo bản ghi/trạng thái trùng.

### Crypto/audit

- Private key không xuất hiện trong request, database, log hoặc manifest.
- Signature verify được từ public key và raw SHA-256 digest.
- Key rotation, revoke parallel, reject, request changes, cancel và admin override đều có audit.
- Manifest canonical có thể kiểm tra độc lập theo attempt.

### Deadline/notification

- Deadline lưu UTC, hiển thị đúng giờ Việt Nam.
- Nhắc 24 giờ trước và tại hạn, không gửi trùng khi worker retry.
- Quá hạn không tự reject/đổi người ký.

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
- `[ĐỀ XUẤT]` Không mở rộng sang ký PDF/provider trong MVP; chỉ giữ adapter/manifest contract để tránh khóa kiến trúc.
- `[BỊ CHẶN nếu thiếu]` Không thể chạy migration/test tích hợp đầy đủ nếu branch chưa có Django project và cấu hình PostgreSQL/test database.

## 13. Definition of Done

- Migration áp dụng được trên database test sạch.
- API/service đã kiểm tra state transition, permission, ownership và idempotency.
- Unit/integration tests bao phủ tuần tự, song song, reject, request changes, resend toàn bộ, revoke, deadline và concurrent sign.
- Crypto test xác nhận hash mismatch/private key boundary/key rotation.
- Outbox/Celery test xác nhận retry không gửi trùng.
- Không sửa hoặc stage các file ngoài phạm vi backend Trình ký.
- Branch/status/diff được review trước khi commit và push.
