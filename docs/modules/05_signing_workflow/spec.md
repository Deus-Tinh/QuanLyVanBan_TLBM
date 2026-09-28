# ĐẶC TẢ PHÂN HỆ: NHÓM 5 — TRÌNH KÝ SỐ (SIGNING WORKFLOW)

> **Tài liệu căn cứ:** 
> - File đặc tả đề án: `docs/common/ITC - Django - QLVB&TL.md` & `docs/common/ITC - Django - QLVB&TL.xlsx`.
> - Cấu trúc chuẩn hệ thống: `docs/common/architecture/structure.md`.
> - Phân công: **Nhóm 5** (Trưởng nhóm: Lê Thanh Hậu, Thành viên: Lê Thành Tài).
> - Nhánh phát triển: `5_signing_workflow`.
> - Tài liệu kỹ thuật chi tiết backend: [`signing-backend-plan.md`](signing-backend-plan.md).

---

## 1. MỤC TIÊU & PHẠM VI NGHIỆP VỤ

### 1.1. Mục tiêu
Xây dựng phân hệ **Trình ký** gồm: tạo hồ sơ trình ký; luân chuyển theo quy trình nhiều cấp (tuần tự hoặc song song); hiển thị tiến trình trực quan (stepper/timeline); ký duyệt bằng chữ ký điện tử nội bộ Ed25519 kèm kiểm tra toàn vẹn (SHA-256 raw digest); xử lý phản hồi hai nhánh; xử lý quá hạn không chặn luồng; ủy quyền ký khẩn cấp; và sẵn sàng khâu phát hành pháp lý ở bước cuối.

### 1.2. Phạm vi chức năng
1. **Ảnh chữ ký cá nhân (phụ thuộc Nhóm 7):**
   - Người dùng tải lên ảnh chữ ký PNG nền trong suốt, tối đa 2MB, trong hồ sơ cá nhân (field `anh_chu_ky`, sheet CBNV).
   - Phân hệ Trình ký chỉ đọc ảnh qua contract do Nhóm 7 cung cấp.
   - *Kích thước pixel chuẩn:* chưa chốt, xác định khi làm stamping.
2. **Mẫu quy trình trình ký:**
   - Quy trình nhiều cấp, trạng thái `NHAP -> HOAT_DONG -> NGUNG`, phạm vi `PHONG_BAN` hoặc `CONG_TY`.
   - Cách thức ký `TUAN_TU` hoặc `SONG_SONG`, áp dụng cho toàn yêu cầu.
   - Vai trò trong cấp (`vai_tro_ky`): **Ký nháy (`KY_NHAY`)** và **Ký chính (`KY_CHINH`)**. Nếu có ký nháy chặn (`chan_ky_chinh`), ký chính chỉ mở khi mọi ký nháy trong cấp đã ký.
   - Quy trình đã kích hoạt không sửa trực tiếp; thay đổi bằng nhân bản phiên bản mới.
3. **Tạo trình ký, định vị nơi ký và Lazy Stamping:**
   - Khi gửi, khóa snapshot quy trình, người ký (tài khoản, tên, chức vụ) và mã băm SHA-256 của tài liệu vào lượt trình (`signing_attempt`).
   - **Định vị nơi ký:** người tạo kéo-thả khung ký cho từng người ký trên bản xem trước: `trang_ky`, `toa_do_x`, `toa_do_y`, `chieu_rong_khung`, `chieu_cao_khung`.
   - **Lazy Stamping và lớp phủ giao diện:**
     - Trong suốt luồng duyệt nội bộ, **tệp PDF gốc không bị sửa raw bytes**; mọi người ký ký trên cùng một mã băm.
     - Giao diện React hiển thị ảnh chữ ký như lớp phủ CSS/Canvas trên bản xem trước theo tọa độ.
     - Khi ký, backend chỉ lưu snapshot ảnh chữ ký vào bản ghi chữ ký, không sửa tệp.
     - Chỉ khi lượt trình `HOAN_THANH`, `PdfStampingService` dán toàn bộ ảnh chữ ký một lần và sinh tệp hoàn tất (`vi_tri_tep_hoan_tat`), làm đầu vào cho khâu phát hành pháp lý.
   - Thiết lập hạn chót (`han_chot`) và số giờ xử lý từng cấp (`so_gio_xu_ly`).
4. **Danh sách hồ sơ trình ký:**
   - Tabs: *Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Toàn bộ hồ sơ*.
   - Bộ lọc: phòng ban, trạng thái, mức độ, khoảng thời gian.
5. **Chi tiết hồ sơ và sơ đồ luồng ký:**
   - Split view: cột trái là stepper tiến độ ký; cột phải là PDF viewer có lớp phủ khung ký.
6. **Ký duyệt và xử lý phản hồi hai nhánh:**
   - **Nhánh 1 — Lỗi nhỏ, không chặn luồng:** ký duyệt kèm `ghi_chu_ky`; luồng tiếp tục; ghi chú hiển thị cho người tạo và các cấp sau.
   - **Nhánh 2 — Lỗi lớn, chặn luồng:** `yeu_cau_sua` kèm lý do; lượt trình chuyển `YEU_CAU_SUA`, các cấp đang mở `TAM_DUNG`; mở thread trao đổi hai chiều (`signing_change_thread`). Khi thống nhất, người tạo tải bản mới, thread `DA_GIAI_QUYET`, hệ thống tạo lượt trình mới để ký lại toàn bộ. Lượt cũ giữ nguyên `YEU_CAU_SUA` làm lịch sử.
   - Từ chối (`tu_choi`) bắt buộc lý do; xem xét lại (`xem_xet_lai`) tạo lượt trình mới.
   - Thu hồi chữ ký (`thu_hoi`) chỉ trong `SONG_SONG` và trước khi lượt trình hoàn thành; chữ ký cũ giữ nguyên làm bằng chứng.
7. **Quá hạn và ủy quyền khẩn cấp:**
   - Quá hạn không tự hủy, không tự từ chối; người ký vẫn ký muộn được và hệ thống ghi `ky_tre_han = true`, `so_giay_tre`.
   - Ủy quyền khẩn cấp (`uy_quyen`): chuyển người ký đang `CHO_KY` sang nhân sự có thẩm quyền tương đương, lý do bắt buộc (`ly_do_uy_quyen`), có nhật ký; không ủy quyền cho người đã có trong cùng cấp.
8. **Khâu phát hành pháp lý (bước bổ sung cuối):**
   - Sau khi lượt trình `HOAN_THANH` và đã có tệp hoàn tất, `LegalSignerAdapter` thực hiện ký số cá nhân lãnh đạo (Cloud CA / HSM / VNeID CCCD qua NFC/đầu đọc) và đóng con dấu số doanh nghiệp kèm dấu thời gian TSA theo chuẩn PAdES.
   - **LƯU Ý PHÁP LÝ (BẮT BUỘC):** Người chịu trách nhiệm pháp lý cao nhất (người đại diện theo pháp luật / lãnh đạo có thẩm quyền ban hành) bắt buộc phải có Chứng thư số X.509 do tổ chức cung cấp dịch vụ chứng thực chữ ký số (CA) được cấp phép.

---

## 2. MÔ HÌNH DỮ LIỆU

Chi tiết field, kiểu dữ liệu và ràng buộc tại [`signing-backend-plan.md` mục 5](signing-backend-plan.md#5-thiết-kế-dữ-liệu). Tên field dùng tiếng Việt, trừ `id`, `create_by`, `created_at`, `update_by`, `update_at`.

| Bảng | Vai trò | Trạng thái |
| :--- | :--- | :--- |
| `signing_process` | Quy trình mẫu có phiên bản | `NHAP`, `HOAT_DONG`, `NGUNG` |
| `signing_process_step` | Cấp ký trong quy trình, số giờ xử lý | — |
| `signing_process_step_signer` | Người ký cấu hình sẵn (người ký hoặc chức vụ), `vai_tro_ky`, `chan_ky_chinh` | — |
| `signing_request` | Hồ sơ trình ký, vòng đời tổng | `NHAP`, `CHO_KY`, `HOAN_THANH`, `TU_CHOI`, `HUY` |
| `signing_attempt` | Lượt trình bất biến, nguồn sự thật của mã băm, tệp hoàn tất | `NHAP`, `CHO_KY`, `YEU_CAU_SUA`, `HOAN_THANH`, `TU_CHOI`, `HUY` |
| `signing_request_step` | Snapshot cấp ký của lượt trình | `CHUA_MO`, `DANG_KY`, `HOAN_THANH`, `TAM_DUNG` |
| `signing_request_step_signer` | Snapshot người ký, tọa độ ký, ủy quyền, `chu_ky_hien_hanh` | `CHO_KY`, `DA_KY`, `TU_CHOI`, `YEU_CAU_SUA` |
| `signing_key` | Khóa công khai Ed25519 (không lưu private key) | `CHO_KICH_HOAT`, `HOAT_DONG`, `DA_XOAY_VONG`, `THU_HOI`, `HET_HAN` |
| `signing_signature` | Chữ ký bất biến: `chu_ky_so`, `ghi_chu_ky`, `ky_tre_han`, snapshot ảnh chữ ký | `CHUA_XAC_MINH`, `HOP_LE`, `KHONG_HOP_LE` |
| `signing_manifest` | Bằng chứng tổng hợp chuẩn hóa, `ma_bam_bang_chung` | `NHAP`, `DA_CHOT` |
| `signing_change_thread` / `signing_change_message` | Trao đổi hai chiều khi yêu cầu sửa | `DANG_MO`, `DA_GIAI_QUYET` |
| `signing_audit_log` | Nhật ký chỉ ghi thêm, gồm cả sự kiện quy trình và khóa ký | — |
| `signing_notification` | Thông báo in-app/email, kiêm outbox | `CHO_GUI`, `DA_GUI`, `THAT_BAI` |

---

## 3. RESTFUL API

Prefix `/api/v1/`. Payload dùng đúng tên field CSDL. Hành động chuyển trạng thái bắt buộc header `Idempotency-Key`.

| Phương thức | Endpoint | Chức năng | Phân quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/signing/processes/` | Danh sách quy trình theo phạm vi/quyền | `xem_trinh_ky` |
| `POST` | `/signing/processes/` | Tạo quy trình `NHAP` | `quan_ly_quy_trinh_ky` |
| `GET` | `/signing/processes/{id}/` | Chi tiết quy trình, cấp, người ký | `xem_trinh_ky` |
| `PATCH` | `/signing/processes/{id}/` | Sửa quy trình (chỉ khi `NHAP`) | `quan_ly_quy_trinh_ky` |
| `POST` | `/signing/processes/{id}/kich-hoat/` | Kích hoạt quy trình | `quan_ly_quy_trinh_ky` |
| `POST` | `/signing/processes/{id}/ngung/` | Ngừng quy trình | `quan_ly_quy_trinh_ky` |
| `POST` | `/signing/processes/{id}/nhan-ban/` | Nhân bản thành phiên bản mới | `quan_ly_quy_trinh_ky` |
| `GET` | `/signing/requests/` | Danh sách hồ sơ (phân trang, lọc tab) | `xem_trinh_ky` |
| `POST` | `/signing/requests/` | Tạo hồ sơ `NHAP` kèm vị trí ký | `tao_trinh_ky` |
| `GET` | `/signing/requests/{id}/` | Chi tiết hồ sơ, tiến trình, quyền xử lý | Người liên quan / Quản trị |
| `POST` | `/signing/requests/{id}/gui/` | Khóa snapshot, tạo lượt trình | `gui_trinh_ky` (người tạo) |
| `POST` | `/signing/requests/{id}/huy/` | Hủy hồ sơ | `huy_trinh_ky` (người tạo / quản trị) |
| `POST` | `/signing/requests/{id}/xem-xet-lai/` | Tạo lượt trình mới sau từ chối | `gui_trinh_ky` |
| `POST` | `/signing/requests/{id}/phat-hanh/` | Phát hành pháp lý: ký số CA/CCCD, đóng dấu PAdES | Lãnh đạo / Văn thư |
| `POST` | `/signing/attempts/{id}/ky/` | Ký duyệt: verify Ed25519, snapshot ảnh chữ ký, không sửa tệp | `ky_trinh_ky` (người được chỉ định) |
| `POST` | `/signing/attempts/{id}/tu-choi/` | Từ chối (lý do bắt buộc) | `ky_trinh_ky` |
| `POST` | `/signing/attempts/{id}/yeu-cau-sua/` | Yêu cầu sửa, mở thread | `ky_trinh_ky` |
| `POST` | `/signing/attempts/{id}/uy-quyen/` | Ủy quyền ký khẩn cấp (lý do bắt buộc) | `uy_quyen_trinh_ky` (người ký / quản trị) |
| `POST` | `/signing/attempts/{id}/thu-hoi/` | Thu hồi chữ ký (chỉ `SONG_SONG`) | Chính người đã ký |
| `GET/POST` | `/signing/change-threads/{id}/messages/` | Trao đổi trong thread | Người tạo / người yêu cầu sửa |
| `POST` | `/signing/change-threads/{id}/giai-quyet/` | Tải bản mới, đóng thread, tạo lượt trình mới | Người tạo hồ sơ |
| `POST` | `/signing/keys/challenge/` | Sinh challenge đăng ký khóa | Authenticated |
| `POST` | `/signing/keys/verify/` | Verify proof-of-possession, kích hoạt khóa | Authenticated |
| `POST` | `/signing/keys/{id}/xoay-vong/` | Xoay vòng khóa | Chủ khóa |
| `POST` | `/signing/keys/{id}/thu-hoi/` | Thu hồi khóa | Chủ khóa / Quản trị |
| `GET` | `/signing/requests/{id}/audit/` | Nhật ký hồ sơ | `xem_nhat_ky_trinh_ky` |
| `GET` | `/signing/attempts/{id}/manifest/` | Bằng chứng tổng hợp và trạng thái xác minh | `xem_trinh_ky` |

API ảnh chữ ký cá nhân thuộc Nhóm 7, không nằm trong phân hệ này.

---

## 4. QUY CHUẨN GIAO DIỆN (UI/UX)

1. **Khu vực ảnh chữ ký trong hồ sơ cá nhân:** thuộc Nhóm 7. Phân hệ Trình ký chỉ hiển thị cảnh báo và liên kết tới hồ sơ khi người ký chưa có ảnh chữ ký.
2. **Trang danh sách (`SigningListPage`):**
   - 3 thẻ đếm: *Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Đã hoàn tất*.
   - Bộ lọc: phòng ban, mức độ, trạng thái; ô tìm kiếm trích yếu / mã hồ sơ.
   - Bảng dữ liệu: mã, trích yếu, người gửi, ngày gửi, cấp hiện tại, trạng thái (badge dùng token CSS), cảnh báo quá hạn.
3. **Trang tạo mới (`SigningCreatePage`):**
   - Chọn quy trình, chọn cách thức ký (`TUAN_TU` / `SONG_SONG`), nhập hạn chót.
   - Đính kèm tài liệu, kiểm tra phía client và tính trước mã băm SHA-256.
   - **Công cụ định vị chữ ký:** kéo-thả khung ký của từng người ký (ký nháy / ký chính) vào đúng trang và vị trí trên PDF.
4. **Trang chi tiết (`SigningDetailPage`):**
   - **Split view:** cột trái là stepper (xanh lá = đã ký, vàng = đang chờ, đỏ = trả về, cam = quá hạn); cột phải là PDF viewer hiển thị lớp phủ khung ký và ảnh chữ ký của người đã ký.
   - **Khung hành động:** *Ký duyệt* (kèm ô ghi chú tùy chọn), *Yêu cầu chỉnh sửa*, *Ủy quyền khẩn cấp*, *Từ chối*; *Thu hồi chữ ký* khi `SONG_SONG`.
   - **Phát hành pháp lý:** nút *Phát hành văn bản* chỉ hiển thị cho lãnh đạo/văn thư khi lượt trình `HOAN_THANH` và đã có tệp hoàn tất.

---

## 5. TIÊU CHUẨN KỸ THUẬT & INVARIANTS

- **i18n:** 100% text UI dùng `t('signing.xxx')`, khai báo đủ hai nhánh `vi` và `en` trong `frontend/src/i18n/translations.js`.
- **Design Tokens:** chỉ dùng biến từ `src/styles/global.css` (`var(--color-...)`, `var(--font-...)`); không hardcode mã hex/px.
- **Toàn vẹn dữ liệu:** không lưu private key trên backend; verify chữ ký đồng bộ trước khi đổi trạng thái người ký; mã băm của lượt trình, chữ ký và bằng chứng `DA_CHOT` là bất biến; không cascade xóa lịch sử.
- **Tọa độ chữ ký:** lưu dạng chuẩn hóa (tỷ lệ % hoặc điểm PDF), độc lập độ phân giải màn hình.
- **Lazy Stamping:** không sửa raw bytes tệp PDF trong luồng nội bộ; chỉ dán ảnh chữ ký một lần khi lượt trình `HOAN_THANH`, dùng snapshot ảnh tại thời điểm ký.
- **Ranh giới pháp lý:** người ký phát hành pháp lý bắt buộc có Chứng thư số CA hợp pháp.
- **Technical Gates:**
  - `python backend/manage.py check` (Pass)
  - `pytest` hoặc unit test phân hệ signing (Pass 100%)
  - `pnpm --dir frontend run build` (Pass 0 warning/error)
