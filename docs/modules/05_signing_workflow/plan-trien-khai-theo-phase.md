# Kế hoạch triển khai phân hệ Trình ký theo phase (Nhóm 5)

Tài liệu này là lộ trình triển khai backend, sắp xếp từ phần ít phụ thuộc nhất đi lên. Nội dung nghiệp vụ và mô hình dữ liệu tham chiếu `signing-backend-plan.md` và `spec.md` cùng thư mục.

## 1. Quy ước chung

- FK người dùng dùng `settings.AUTH_USER_MODEL`, không cố định `auth.User`.
- Tên field và enum tiếng Việt theo `signing-backend-plan.md` mục 5.2; enum khai báo bằng `models.TextChoices`.
- FK trỏ tới bảng lịch sử/bằng chứng dùng `on_delete=PROTECT`.
- `document_type` của yêu cầu trình ký bắt buộc truyền tường minh, không đặt giá trị mặc định ở model.
- Mỗi phase một commit. Điều kiện qua phase: `manage.py check`, `makemigrations --check`, toàn bộ test pass. Trước khi push: bổ sung `pnpm --dir frontend run build`.
- Không xử lý trong phase nào: giá trị mặc định thay cho dữ liệu nghiệp vụ, ghi đè bằng chứng đã chốt.

## 2. Lộ trình

| Phase | Nội dung | Điều kiện phụ thuộc | Trạng thái |
|---|---|---|---|
| 1 | Enums, crypto (SHA-256, Ed25519), storage adapter, định dạng lỗi | Không | Hoàn thành (`bfcb562`) |
| 2 | Model `SigningKey`, `SigningProcess`, `SigningProcessStep` + migration | `AUTH_USER_MODEL` | Hoàn thành (`469d499`) |
| 3 | 11 model còn lại + bất biến ở tầng model | Phase 2 | Hoàn thành (`e51cfda`) |
| 4 | Service quy trình và khóa ký, ghi nhật ký | Phase 3 | Hoàn thành (`97e5950`) |
| 5 | API quy trình và khóa ký, giới hạn theo quyền sở hữu | Phase 4 | Hoàn thành (`64ea1cd`) |
| 6a | Bảo vệ khóa ký bằng PIN (Argon2id + `k_srv`): model, service, API, nhật ký | Phase 5 | Hoàn thành (`f866df7`) |
| 6b | Kiểm quyền API quy trình và khóa ký theo codename DDL (issue #64); quản trị mở lại PIN bị khóa cứng | RBAC Nhóm 7 (`require_permission`) | Hoàn thành phần kiểm quyền API (`4690de7`); mở lại PIN khóa cứng chưa làm |
| 6c | Điều chỉnh theo đánh giá nghiệp vụ: bỏ `kieu_ky*`, xoay vòng `k_srv` khi đổi PIN, đồng bộ DDL | Duyệt `danh-gia-nghiep-vu-va-de-xuat.md`; PR DDL #91 merge trước | Đang review (#79): PR DDL #91, sau đó PR backend |
| 7 | Yêu cầu trình ký, lượt trình, snapshot người ký; chức vụ tương đối và chọn người ký; quyền quy trình theo đơn vị; `trinh-lai` | Văn bản đi (Nhóm 2), `Chức vụ`, `Đơn vị` (Nhóm 7) qua lớp tích hợp `signing/tich_hop/` | Lõi API xong trên máy (#80); quyền quy trình theo đơn vị chờ Nhóm 7 |
| 8 | Hành động ký, từ chối (kết thúc), thu hồi khi cấp còn mở; manifest; khóa dòng và chống trùng | Phase 7; PostgreSQL cho test đồng thời | Ký/từ chối/thu hồi xong trên máy (#80); manifest ở Phase 10 |
| 9 | Yêu cầu chỉnh sửa; ủy quyền theo thời gian và khẩn cấp, `hinh_thuc_ky`; nhắc, leo thang, báo cáo trễ hạn; thông báo | Phase 8; danh sách người nhận ủy quyền hợp lệ, cấp trên trực tiếp (Nhóm 7) | Chờ Phase 8 |
| 10 | Phẳng hóa PDF theo thể thức; ký số từ xa (adapter); cấp số qua hệ thống Nhóm 2 và ký số cơ quan; frontend | Phase 8; chốt hệ tọa độ vị trí ký; contract cấp số với Nhóm 2 | Chờ |

## 3. Chi tiết các phase

### Phase 1 — Nền tảng không phụ thuộc (hoàn thành)
- `enums.py`, `crypto.py`, `storage.py`, `errors.py`, cấu hình `SIGNING_DOCUMENT_ROOT`, dependency `cryptography`.
- Định dạng lỗi chỉ áp dụng cho view kế thừa `SigningAPIView`, không thay handler toàn cục của module khác.

### Phase 2 — Model phụ thuộc người dùng
- `SigningKey`: partial unique một khóa `HOAT_DONG` mỗi người; CHECK `HOAT_DONG` phải có `thoi_diem_xac_minh_so_huu`; không có trường khóa bí mật.
- `SigningProcess`: unique `(ma_quy_trinh, phien_ban)`.
- `SigningProcessStep`: unique `(quy_trinh, thu_tu)`; `don_vi` tạm là số nguyên cho phép rỗng, đổi sang FK khi Nhóm 7 hoàn tất.
- Test: từng ràng buộc bằng `IntegrityError`.

### Phase 3 — Các model còn lại
- `SigningProcessStepSigner`, `SigningRequest`, `SigningAttempt`, `SigningRequestStep`, `SigningRequestStepSigner`, `SigningSignature`, `SigningManifest`, `SigningChangeThread`, `SigningChangeMessage`, `SigningAuditLog`, `SigningNotification`.
- Văn bản: `document_type` (đến/đi/mật) + `van_ban_id`, không FK.
- Chức vụ: `chuc_vu_id` số nguyên cho phép rỗng tạm thời; CHECK "người ký hoặc chức vụ" khai báo ngay.
- Ràng buộc unique, CHECK SHA-256, CHECK nhật ký luồng ký, CHECK lý do ủy quyền theo `signing-backend-plan.md` mục 5.2, 5.3.
- Bất biến ở tầng model (môi trường SQLite chưa có trigger): chặn sửa chữ ký (trừ trường xác minh), chặn sửa/xóa manifest `DA_CHOT`, nhật ký chỉ ghi thêm.
- Trigger PostgreSQL tương ứng đã có trong CSDL chung; áp dụng khi chuyển sang PostgreSQL.

### Phase 4 — Service
- `process.py`: tạo, kích hoạt, ngừng, nhân bản (tăng `phien_ban`), chặn sửa quy trình đã kích hoạt, kiểm tra mỗi quy trình có cấp và mỗi cấp có người ký.
- `keys.py`: đăng ký khóa công khai, xác minh sở hữu (proof-of-possession), kích hoạt, xoay vòng, thu hồi.
- `audit.py`: ghi nhật ký dùng chung cho mọi hành động.

### Phase 5 — API
- `/api/v1/signing/quy-trinh/` (danh sách, tạo, kích hoạt, ngừng, nhân bản) và `/api/v1/signing/khoa/` (đăng ký, thách thức, xác minh, kích hoạt, xoay vòng, thu hồi).
- Challenge chứng minh sở hữu khóa là chuỗi cố định gắn dấu vân tay khóa, chưa có TTL/dùng một lần (xem `signing-backend-plan.md` mục 3.4).
- Xác thực bắt buộc; giới hạn theo người sở hữu/người tạo ở server. Phân quyền chi tiết để Phase 6.

### Phase 6a — Bảo vệ khóa ký bằng PIN (hoàn thành)
- Model `SigningKeyUnlock` (bảng `signing_key_unlock`, migration `0003_mo_khoa_ky_bang_pin`).
- `services/pin.py`: `dat_pin`, `mo_khoa_ky`, `doi_pin`. Server nhận `xac_minh_pin` = Base64 của verifier 32 byte, không nhận PIN.
- Lưu HMAC-SHA256(verifier) và `k_srv` mã hóa AES-256-GCM (gắn với id + dấu vân tay khóa); khóa dẫn xuất HKDF từ `SIGNING_PIN_SECRET` (dev: `SECRET_KEY`).
- Sai 5 lần khóa 15 phút; sai 10 lần khóa cứng (HTTP 423). Bộ đếm cập nhật dưới `select_for_update` và commit trước khi trả lỗi.
- Tham số Argon2id kiểm tra mức sàn `m >= 65536 KiB, t >= 3, p >= 1`; từ Phase 6c bắt buộc `salt` 16 byte riêng cho từng khóa. Chính sách PIN 8 chữ số kiểm tra ở frontend (server không thấy PIN).
- Test: `tests/test_pin_phase6.py` (khóa theo ngưỡng, đếm đồng thời trên PostgreSQL, `k_srv` chỉ trả sau xác minh, không trả PIN/hash/bản bọc).

### Phase 6b — Phân quyền (kiểm quyền API hoàn thành, issue #64)
- Mô hình người dùng đã chốt ở #53: `accounts.Employee` qua `settings.AUTH_USER_MODEL`; kiểm quyền bằng codename trần theo DDL (RBAC Nhóm 7).
- `signing/permissions.py`: `co_quyen(user, codename)` và `yeu_cau_quyen(...)` (403 `khong_co_quyen`, `fields.quyen` là codename thiếu). Có `authorization.backends.RbacBackend` thì dùng `user.has_perm(codename)`; chưa có thì tra quyền riêng và quyền theo nhóm. Superuser luôn được phép; tài khoản `is_active = False` không có quyền.
- Ánh xạ quyền cho API đã có:

| API | Quyền |
|---|---|
| `GET /quy-trinh/`, `GET /quy-trinh/{id}/` | `view_trinhky` (chỉ thấy `HOAT_DONG`) hoặc `manage_signing_process` (thấy mọi trạng thái) |
| `POST /quy-trinh/`, `kich-hoat`, `ngung`, `nhan-ban` | `manage_signing_process`; người có quyền thao tác được trên mọi quy trình (cấu hình chung của cơ quan, không giới hạn người tạo) |
| `POST /khoa/`, `xac-minh`, `kich-hoat`, `xoay-vong`, `dat-pin`, `mo-khoa-ky`, `doi-pin` | `sign_trinhky` |
| `GET /khoa/`, `GET thach-thuc`, `POST thu-hoi` | Chỉ cần đăng nhập, giới hạn khóa của chính mình (người bị gỡ quyền ký vẫn thu hồi được khóa) |

- Kích hoạt phiên bản mới tự ngừng phiên bản đang hoạt động cùng mã (`signing-backend-plan.md` mục 3.1); khóa mọi phiên bản cùng mã theo thứ tự `pk`.
- Chưa làm: quản trị mở lại PIN bị khóa cứng (người dùng vẫn tự thu hồi khóa và đăng ký khóa mới được); `add_trinhky`, `send_trinhky`, `delegate_trinhky`, `cancel_trinhky`, `view_signing_audit` áp dụng khi có API ở Phase 7–9.
- Test: `PermissionApiTests` trong `tests/test_api_phase5.py`, `test_pin_endpoints_require_sign_permission` trong `tests/test_pin_phase6.py`. Test tạo người dùng qua `get_user_model()`, không import `auth.User` (#68 mục C3).

### Phase 6c — Điều chỉnh theo đánh giá nghiệp vụ (đang review, #79)
Căn cứ: `danh-gia-nghiep-vu-va-de-xuat.md`. Làm trước Phase 7 vì đụng model đã có.
- Bỏ `signing_process.kieu_ky_mac_dinh`, `signing_request.kieu_ky` và enum `KieuKy` (migration `0005_bo_kieu_ky_chi_nhan_van_ban_di`, nối sau `0004_bo_vanbanmat`); sửa `services/process.py`, serializer, test Phase 2–5. Cấp luôn tuần tự, song song là nhiều người trong một cấp. API tạo quy trình không còn nhận/trả `kieu_ky_mac_dinh`.
- `LoaiVanBan` chỉ còn `vanbandi` (giữ cột `document_type`; `0004_bo_vanbanmat` đã bỏ `vanbanmat`, `0005` bỏ tiếp `vanbanden`); `full_clean` từ chối `vanbanden`, `vanbanmat`. DDL giữ ENUM `document_kind` chung vì `documents_view_log`, `task_congviec` còn dùng `vanbanden`.
- `doi-pin` xoay vòng `k_srv`: sinh mảnh mới trong cùng transaction với đổi verifier, trả `manh_bi_mat_cu` và `manh_bi_mat`; nhật ký `DOI_PIN` ghi `xoay_vong_manh_bi_mat`. Đổi PIN thất bại (sai PIN cũ, PIN mới trùng) không đổi `k_srv`. Test mô phỏng khóa bọc `HKDF(master_pin, k_srv, "wrap")`: `k_srv` cũ không mở được bản bọc mới.
- `tham_so_kdf` bắt buộc `salt` 16 byte riêng cho từng khóa, client sinh mới mỗi lần đặt/đổi PIN; `doi-pin` từ chối salt trùng salt hiện tại (`salt_trung_salt_cu`). Trả lời câu hỏi ở #79; contract đầy đủ ở `signing-backend-plan.md` mục 3.4.
- `SIGNING_PIN_SECRET` bắt buộc khi `DEBUG = False`: `checks.py` đăng ký check `--deploy` (`signing.E001` thiếu, `signing.E002` trùng `SECRET_KEY`); `services/pin.py` từ chối thao tác PIN lúc chạy (503 `chua_cau_hinh_bi_mat_pin`, ghi log lỗi). Không dùng check thường vì `manage.py test` luôn đặt `DEBUG = False` (sẽ chặn CI của mọi nhóm).
- Giới hạn: client mất response `doi-pin` thì bản bọc cũ không mở được nữa (verifier đã đổi từ Phase 6a); xử lý như mất PIN (thu hồi khóa, đăng ký khóa mới).
- DDL base: PR vào `ddl_base_v0` bỏ `kieu_ky_mac_dinh`, `kieu_ky` và ENUM thừa `signing_kieuky` (nạp sạch; sau khi ghép #92: 55 bảng, 20 ENUM, 77 quyền, 196 lượt phân quyền). Thứ tự theo quy ước dự án mục 1.2: PR DDL #91 merge trước, PR backend chứa migration `0005` sau; hai cột là `NOT NULL` nên code mới chạy trên DB dựng từ DDL cũ sẽ lỗi khi ghi quy trình mới. Default `vanbanden` của `document_type` đã bỏ từ v0.
- Cột/bảng mới của Phase 7–9 (`don_vi_ap_dung`, `pham_vi_chuc_vu`, `ho_so_goc`, `hinh_thuc_ky`, `signing_delegation`) đưa vào DDL cùng lúc với model của phase đó, để DDL luôn khớp model và `migrate --fake` đúng.

### Phase 7 — Hồ sơ trình ký (lõi API xong trên máy, #80)
- Model: `signing_request.ho_so_goc` (FK tự tham chiếu, `PROTECT`), `signing_process_step_signer.pham_vi_chuc_vu`, `muc_do` theo `MucDoTrinhKy` (`THUONG`, `KHAN`, `HOA_TOC`; tạm đến khi có danh mục mức độ chung). Migration `0006`; DDL `[P7]` trên nhánh DDL riêng (PR vào `ddl_base_v0` trước migration).
- `services/trinh_ky.py`: tạo/sửa nháp, gửi (snapshot người ký, mở cấp đầu, tính `han_xu_ly`), hủy, trình lại; phạm vi xem và hộp "cần tôi ký". API ở `signing-backend-plan.md` mục 7.2.
- Tệp: hồ sơ trình ký tự giữ PDF dự thảo (upload, server tự băm, lưu qua `storage.py`; dev mặc định `backend/media/signing`, production bắt buộc `SIGNING_DOCUMENT_ROOT`, check `signing.E003`).
- Lớp tích hợp (quyết định 07/10/2026: làm trước, khớp lại khi nhóm khác xong):
  - `tich_hop/van_ban.py` (Nhóm 2): chỉ `vanbandi`, văn bản tồn tại, từ chối `pham_vi = 'HAN_CHE'`, người trình xem được. Cài đặt tạm đọc bảng DDL `documents_vanbandi` (`id`, `pham_vi`, `nguoi_tao`, `so_hieu`, `trich_yeu`), quyền xem = người tạo văn bản hoặc `view_vanbandi`. Thay bằng hàm "văn bản xem được" của Nhóm 2 (#68 C5).
  - `tich_hop/to_chuc.py` (Nhóm 7): tên hiển thị, chức vụ cho snapshot; ứng viên theo chức vụ trong phạm vi `pham_vi_chuc_vu`. Chưa có `Employee` thì không có ứng viên (chặn gửi, lỗi rõ). Đổi `chuc_vu_id`, `don_vi_id` sang FK khi Nhóm 7 lên staging.
- Chưa làm (chờ Nhóm 7): `signing_process.don_vi_ap_dung` và quyền quản lý/xem quy trình `PHONG_BAN` theo đơn vị.
- Test: `tests/test_trinh_ky_phase7.py` (văn bản giả lập qua `_doc_van_ban_di`); kiểm thử tích hợp trên PostgreSQL dựng từ DDL với bảng `documents_vanbandi` thật.

### Phase 8 — Hành động người ký (xong trên máy, #80)
- `services/hanh_dong_ky.py`: `ky`, `tu_choi`, `thu_hoi`; API ở `signing-backend-plan.md` mục 7.3.
- Quy tắc: cấp mở tuần tự, người trong cấp ký song song, cấp đóng khi mọi người ký (ký nháy và ký chính) đã ký; ký chính chờ ký nháy chặn; từ chối là kết thúc; thu hồi chỉ khi cấp còn mở.
- Đồng thời: khóa dòng lượt trình; chống lặp bằng `khoa_chong_trung_thao_tac` của dòng người ký. Test PostgreSQL: ký trùng hai khóa chỉ tạo một chữ ký; ký cạnh tranh với hủy cho một kết quả nhất quán.
- Test: `tests/test_hanh_dong_ky_phase8.py`.

### Phase 7 đến 10 — Phần phụ thuộc bên ngoài
- Văn bản mật đã bỏ (GVHD chốt, DDL #81); trình ký chỉ nhận `vanbandi` thường. Văn bản hạn chế (`pham_vi = 'HAN_CHE'`) là văn bản gửi đi chọn người xem và lưu log xem (Nhóm 2), không ký, không đi qua trình ký: Phase 7 từ chối ở API tạo hồ sơ khi #82 có `pham_vi`. Hình thức ký KT./TL./TUQ. và ủy quyền có thời hạn, phạm vi theo NĐ 30/2020 Điều 13.
- Phase 7:
  - Cần bảng văn bản, `Chức vụ`, `Đơn vị`; thay các trường số nguyên tạm bằng FK.
  - Thêm `signing_process.don_vi_ap_dung`; kiểm quyền quy trình `PHONG_BAN` theo lãnh đạo đơn vị.
  - Thêm `signing_process_step_signer.pham_vi_chuc_vu`; `gui` resolve chức vụ tương đối, nhận `chon_nguoi_ky` khi nhiều ứng viên.
  - Thêm `signing_request.ho_so_goc`; API `trinh-lai` thay `xem-xet-lai`; `TU_CHOI` là trạng thái kết thúc.
- Phase 8: test đồng thời (hai người ký cùng lúc, gửi lặp, ký lặp) cần PostgreSQL. Thu hồi chữ ký theo điều kiện "cấp còn mở".
- Phase 9:
  - Bảng `signing_delegation`, cột `hinh_thuc_ky`, `uy_quyen_theo`; áp ủy quyền khi mở cấp; ủy quyền khẩn cấp chỉ cấp trên trực tiếp/quản trị, người nhận thuộc danh sách hợp lệ.
  - Nhắc hạn, nhắc lặp, leo thang 48 giờ cho cấp trên trực tiếp; báo cáo trễ hạn. Cần cấu hình tác vụ định kỳ và dữ liệu cấp trên trực tiếp (Nhóm 7).
- Phase 10:
  - Phẳng hóa in khối chữ ký theo `hinh_thuc_ky`, chừa ô số/ngày.
  - `LegalSignerAdapter` theo mô hình ký số từ xa; khi có CA, ký chính cấp cuối dùng adapter thay Ed25519.
  - Hệ thống sổ văn bản đi của Nhóm 2 cấp số, thời gian ban hành (NĐ 30/2020 Điều 15); văn thư ký số cơ quan, chuyển trạng thái phát hành.
  - Cần chốt hệ tọa độ vị trí ký (tỷ lệ % hoặc điểm PDF); dòng nhận diện "bản duyệt nội bộ, chưa phát hành" trên tệp hoàn tất; màn hình ký hiển thị tên tệp và mã băm cùng ô nhập PIN; module Argon2id WASM.

## 4. Đối chiếu CSDL chung sau issue #47

Bản `csdl_qlvbtl_schema_final.sql` đính kèm phản hồi issue #47 đã đối chiếu mục 9. Các điểm đã cập nhật đúng đề xuất: `document_type` và index, trigger manifest `DA_CHOT`, trigger bất biến chữ ký và nhật ký, `ON DELETE RESTRICT` cho nhật ký/thread/message/người ký cấu hình, cột cho phép rỗng ở bản nháp, index `han_chot` và `han_xu_ly`, 5 quyền mới.

Các điểm lệch còn lại cần xác nhận:

1. `signing_request.document_type` có `DEFAULT 'vanbanden'`. Khi dữ liệu thiếu, văn bản đi hoặc mật bị ghi nhầm thành văn bản đến. Đề xuất bỏ giá trị mặc định.
2. Kiểu enum `signing_key_status` (`PENDING`, `ROTATED`...) không khớp trạng thái khóa dùng ở phân hệ (`CHO_KICH_HOAT`, `DA_XOAY_VONG`...), và cột `signing_key.trang_thai` không dùng kiểu này. Đề xuất bỏ kiểu enum thừa hoặc đồng bộ giá trị.
3. Tổng số lượt phân quyền: tiêu đề file ghi 178, phản hồi issue ghi 198. Header file ghi 73 quyền nhưng tiêu đề mục seed ghi 66. Danh sách quyền `send_trinhky`, `delegate_trinhky`, `cancel_trinhky`, `view_signing_audit` xuất hiện lặp hai lần trong danh sách quyền của nhóm `BGD` ở phần seed (không gây lỗi do `ON CONFLICT DO NOTHING`, nhưng làm sai lệch cách đếm).
4. Trigger `prevent_delete_or_tamper_signing_signature` chỉ so 9 cột; `ghi_chu_ky`, `ky_tre_han`, `so_giay_tre`, `created_at` vẫn sửa được ở DB, trong khi model chỉ cho đổi `trang_thai_xac_minh` và `thoi_diem_xac_minh`. Đề xuất chặn mọi cột trừ hai cột xác minh.
5. `ON DELETE` của DDL lệch model (PROTECT) ở `signing_attempt.trinh_ky_id` (CASCADE), `signing_attempt.luot_truoc_id` (SET NULL), `signing_request_step.luot_trinh_id` (CASCADE), `signing_request_step_signer.buoc_ky_id` (CASCADE), `signing_request_step_signer.uy_quyen_tu_id` (SET NULL), `signing_key.khoa_thay_the_id` (SET NULL). Đề xuất đổi sang `RESTRICT`.
6. DDL trỏ FK người dùng tới `accounts_employee`, còn migration nhánh 5 trỏ `auth_user`; DDL thêm FK cho `don_vi_id`, `chuc_vu_id` trong khi model là số nguyên. Chốt cùng Phase 6–7.

## 5. Đối chiếu DDL base v1 (`ddl_base_v0`, commit `407b134`)

Đối chiếu tự động trên PostgreSQL 18: một DB nạp `docs/common/database/release_DDL.sql`, một DB chạy migration của nhánh; so cột, kiểu, null, khóa ngoại, CHECK/UNIQUE theo tên của 15 bảng `signing_*`.

- Đủ 15 bảng; CHECK/UNIQUE trùng tên và định nghĩa.
- `signing_key_unlock`: DDL dùng `updated_at` (trigger `set_updated_at`); model đã đổi theo (#67 mục 6).
- Cột người dùng là `integer` khi chạy trên `auth.User`, `bigint` trong DDL: hết lệch khi `AUTH_USER_MODEL = "accounts.Employee"` (#68 C1).
- `signing_request.document_type` là ENUM `document_kind` trong DDL, `varchar(20)` trong model: ORM ghi và lọc chuỗi được trên cột ENUM; không chặn `--fake`.
- `chuc_vu_id`, `don_vi_id` là FK trong DDL, số nguyên trong model: đổi sang FK ở Phase 7.
- `ON DELETE`: Django luôn tạo FK `NO ACTION` và xử lý xóa ở ứng dụng; DDL dùng `RESTRICT`/`CASCADE`/`SET NULL`. Riêng `signing_key_unlock.khoa_id` là `CASCADE` trong DDL, `PROTECT` trong model: khóa ký không bị xóa (chỉ thu hồi) nên không ảnh hưởng nghiệp vụ.
- Quy trình migrate trên DB dựng từ DDL (#68 mục 2): `migrate signing --fake`.
- Phase 6c: đối chiếu lại với DDL đã bỏ `kieu_ky*`: không còn cột lệch; chỉ còn `integer`/`bigint` ở cột người dùng như trên.

