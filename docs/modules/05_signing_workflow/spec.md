# ĐẶC TẢ PHÂN HỆ: NHÓM 5 — TRÌNH KÝ SỐ (SIGNING WORKFLOW)

> **Tài liệu căn cứ:** 
> - File đặc tả đề án: `docs/common/ITC - Django - QLVB&TL.md` & `docs/common/ITC - Django - QLVB&TL.xlsx`.
> - Cấu trúc chuẩn hệ thống: `docs/common/architecture/structure.md`.
> - Phân công: **Nhóm 5** (Trưởng nhóm: Lê Thanh Hậu, Thành viên: Lê Thành Tài).
> - Nhánh phát triển: `5_signing_workflow`.
> - Tài liệu kỹ thuật chi tiết backend: [`signing-backend-plan.md`](signing-backend-plan.md).

---

## 1. MỤC TIÊU & PHẠM VI NGHIỆP VỤ (OBJECTIVE & SCOPE)

### 1.1. Mục tiêu
Xây dựng phân hệ **Trình ký (Signing Workflow)** hoàn chỉnh hỗ trợ tạo văn bản trình ký, luân chuyển hồ sơ theo quy trình phê duyệt nhiều cấp (tuần tự hoặc song song), trực quan hóa tiến trình (Visual Stepper/Timeline), thực hiện ký duyệt bằng chữ ký điện tử nội bộ kèm kiểm tra tính toàn vẹn (SHA-256 raw digest), xử lý phản hồi đa nhánh, xử lý quá hạn linh hoạt, hỗ trợ chuyển quyền khẩn cấp, và sẵn sàng khâu phát hành pháp lý ở bước cuối.

### 1.2. Phạm vi chức năng (In-Scope)
1. **Quản lý Mẫu quy trình trình ký (Workflow Templates):**
   - Định nghĩa quy trình nhiều cấp, phạm vi `DEPARTMENT` hoặc `COMPANY`.
   - Hỗ trợ chế độ chạy `TUAN_TU` (tuần tự) và `SONG_SONG` (song song).
   - Hỗ trợ phân định vai trò trong cấp ký: **Ký nháy / Rà soát (`INITIAL`)** và **Ký chính / Quyết định (`PRIMARY`)** kèm cơ chế gating tuần tự nội bộ cấp (ký nháy xong mới mở ký chính).
2. **Tạo và gửi yêu cầu trình ký (Create & Submit Request):**
   - Khóa snapshot quy trình, chức vụ/người ký và mã hash SHA-256 của tài liệu tại thời điểm gửi.
   - Thiết lập hạn xử lý (`final_due_at`) và SLA từng cấp.
3. **Danh sách văn bản trình ký (List & Filter):**
   - Tabs lọc: *Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Toàn bộ hồ sơ*.
   - Bộ lọc chi tiết: Theo phòng ban, trạng thái xử lý, độ khẩn, khoảng thời gian.
4. **Chi tiết văn bản & Sơ đồ luồng ký (Detail & Visual Flow Graph):**
   - Split view: Cột trái hiển thị Stepper trực quan tiến độ ký; cột phải hiển thị PDF viewer.
5. **Thao tác ký duyệt & Xử lý phản hồi đa nhánh:**
   - **Nhánh 1 (Lỗi nhỏ / Góp ý - Non-blocking):** Duyệt kèm ghi chú bảo lưu (`sign_note`). Ký duyệt bình thường, không chặn luồng, lưu vết audit log cho người tạo và cấp sau.
   - **Nhánh 2 (Lỗi lớn / Chỉnh sửa - Blocking):** Kích hoạt `request_changes` tạm dừng luồng, mở thread trao đổi 2 chiều (`signing_change_thread`). Sau khi chốt phương án, hủy/đóng attempt cũ và gửi lại toàn bộ bằng attempt mới trên bản hash mới.
6. **Xử lý quá hạn & Chuyển quyền khẩn cấp:**
   - Quá hạn không tự hủy/tự reject; người ký vẫn được phép ký muộn và ghi nhận metadata `is_late: true`, `late_duration_seconds`.
   - Chuyển quyền ký khẩn cấp (`delegate`): Cho phép chuyển slot ký sang nhân sự có thẩm quyền tương đương khi có sự cố/vắng mặt kèm lý do bắt buộc và audit log.
7. **Bổ sung cuối — Khâu phát hành pháp lý (Final Legal Issuance Phase):**
   - Sau khi hoàn tất phê duyệt nội bộ (`COMPLETED`), kích hoạt `LegalSignerAdapter` để ký số cá nhân lãnh đạo (Cloud CA / VNeID CCCD qua Smart Card/NFC) + Đóng con dấu số pháp nhân Doanh nghiệp và Timestamp TSA theo chuẩn PAdES lên file PDF.

---

## 2. KIẾN TRÚC MÔ HÌNH DỮ LIỆU (DATABASE SCHEMA)

Chi tiết trường và constraint chuẩn hóa được định nghĩa tại [`signing-backend-plan.md`](signing-backend-plan.md#5-thiết-kế-dữ-liệu):

- `signing_process`: Định nghĩa quy trình mẫu và phiên bản (`DRAFT | ACTIVE | INACTIVE`).
- `signing_process_step`: Cấp ký trong quy trình, SLA giờ.
- `signing_process_step_signer`: Người ký mẫu, `signer_role` (`INITIAL | PRIMARY`), `is_blocking`.
- `signing_request`: Hồ sơ trình ký, lifecycle tổng thể, liên kết văn bản, hash snapshot.
- `signing_attempt`: Lần trình ký bất biến (`WAITING_SIGN | CHANGE_REQUESTED | COMPLETED | REJECTED | CANCELLED`).
- `signing_request_step`: Snapshot cấp ký của attempt (`LOCKED | PENDING | COMPLETED | BLOCKED`).
- `signing_request_step_signer`: Snapshot người ký, trạng thái slot, hỗ trợ ủy quyền khẩn cấp (`delegated_from_user_id`, `delegation_reason`, `delegated_at`).
- `signing_key`: Khóa công khai Ed25519 nội bộ của người dùng (không lưu private key ở backend).
- `signing_signature`: Bản ghi chữ ký bất biến, chứa `signature_bytes`, `sign_note`, `is_late`, `late_duration_seconds`.
- `signing_manifest`: Bản kê pháp lý canonical JSON và `manifest_hash` khóa trạng thái `FINAL`.
- `signing_change_thread` & `signing_change_message`: Thread thảo luận hai chiều giải quyết yêu cầu sửa đổi.
- `signing_audit_log`: Nhật ký kiểm toán append-only ghi nhận mọi hành vi ký, từ chối, ủy quyền, hủy.

---

## 3. THIẾT KẾ RESTFUL API

| Phương thức | Endpoint | Chức năng | Phân quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/signing/processes/` | Danh sách quy trình khả dụng | Authenticated |
| `POST` | `/api/v1/signing/processes/` | Tạo quy trình mới (Draft) | Quản trị / Lãnh đạo |
| `POST` | `/api/v1/signing/processes/{id}/activate/` | Kích hoạt quy trình | Quản trị / Lãnh đạo |
| `GET` | `/api/v1/signing/requests/` | Danh sách hồ sơ trình ký (phân trang, lọc tab) | Authenticated |
| `POST` | `/api/v1/signing/requests/` | Tạo hồ sơ trình ký mới (Draft) | Authenticated |
| `GET` | `/api/v1/signing/requests/{id}/` | Chi tiết hồ sơ, tiến trình và quyền xử lý | Người liên quan / Admin |
| `POST` | `/api/v1/signing/requests/{id}/submit/` | Khóa snapshot và gửi trình ký (tạo attempt 1) | Người tạo hồ sơ |
| `POST` | `/api/v1/signing/requests/{id}/cancel/` | Hủy hồ sơ trình ký | Người tạo / Admin |
| `POST` | `/api/v1/signing/attempts/{id}/sign/` | Ký duyệt (verify Ed25519, nhận `sign_note`) | Người được chỉ định tại bước |
| `POST` | `/api/v1/signing/attempts/{id}/reject/` | Từ chối hồ sơ (lý do bắt buộc) | Người được chỉ định tại bước |
| `POST` | `/api/v1/signing/attempts/{id}/request-changes/` | Yêu cầu sửa đổi, mở thread thảo luận | Người được chỉ định tại bước |
| `POST` | `/api/v1/signing/attempts/{id}/delegate/` | Chuyển quyền ký khẩn cấp (lý do bắt buộc) | Signer hiện tại / Admin |
| `POST` | `/api/v1/signing/requests/{id}/dispatch-legal/` | Bổ sung cuối: Ký số CA/CCCD và đóng dấu PAdES | Lãnh đạo / Văn thư |
| `GET` | `/api/v1/signing/attempts/{id}/manifest/` | Lấy manifest canonical và kiểm tra tính toàn vẹn | Authenticated |

---

## 4. QUY CHUẨN GIAO DIỆN (UI/UX SPECIFICATION)

1. **Trang Danh sách (`SigningListPage`):**
   - KPI Summary Cards: 3 thẻ đếm (*Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Đã hoàn tất*).
   - Bộ lọc: Phòng ban, độ khẩn, trạng thái; ô tìm kiếm trích yếu / mã hồ sơ.
   - Bảng dữ liệu: Mã, trích yếu, người gửi, ngày gửi, bước hiện tại, trạng thái (badge token CSS), cảnh báo quá hạn.
2. **Trang Tạo mới (`SigningCreatePage`):**
   - Chọn mẫu quy trình, chọn chế độ ký (`TUAN_TU` / `SONG_SONG`).
   - Đính kèm tệp tài liệu, kiểm tra client-side và tính trước hash SHA-256.
   - Xem trước danh sách người ký theo từng cấp, phân định rõ ký nháy và ký chính.
3. **Trang Chi tiết & Sơ đồ Ký (`SigningDetailPage`):**
   - **Split View:** Cột trái hiển thị Visual Stepper (Xanh lá = Đã ký, Vàng = Đang chờ, Đỏ = Trả về, Cam = Quá hạn). Cột phải hiển thị inline PDF viewer.
   - **Khung hành động:** Nút *Ký duyệt* (cho phép nhập ghi chú bảo lưu), nút *Yêu cầu chỉnh sửa* (mở thread chat), nút *Ủy quyền khẩn cấp*, nút *Từ chối*.
   - Khung phát hành pháp lý: Nút *Phát hành văn bản* hiển thị cho Lãnh đạo/Văn thư khi hồ sơ đạt trạng thái đã duyệt nội bộ hoàn tất.

---

## 5. TIÊU CHUẨN KỸ THUẬT & INVARIANTS

- **i18n:** 100% text UI sử dụng `t('signing.xxx')`, khai báo đầy đủ cả 2 nhánh `vi` và `en` trong `frontend/src/i18n/translations.js`.
- **Design Tokens:** Dùng 100% biến từ `src/styles/global.css` (`var(--color-...)`, `var(--font-...)`). Tuyệt đối không hardcode mã hex/px.
- **Tính toàn vẹn dữ liệu:** Không lưu private key trên backend. Verify chữ ký đồng bộ trước khi đổi trạng thái slot. Hash tài liệu và manifest là bất biến.
- **Technical Gates:**
  - `python backend/manage.py check` (Pass)
  - `pytest` hoặc unit test phân hệ signing (Pass 100%)
  - `pnpm --dir frontend run build` (Pass 0 warning/error)
