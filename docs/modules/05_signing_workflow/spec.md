# ĐẶC TẢ PHÂN HỆ: NHÓM 5 — TRÌNH KÝ SỐ (SIGNING WORKFLOW)

> **Tài liệu căn cứ:** 
> - File đặc tả đề án: `docs/common/ITC - Django - QLVB&TL.md` & `docs/common/ITC - Django - QLVB&TL.xlsx`.
> - Cấu trúc chuẩn hệ thống: `docs/common/architecture/structure.md`.
> - Phân công: **Nhóm 5** (Trưởng nhóm: Lê Thanh Hậu, Thành viên: Lê Thành Tài).
> - Nhánh phát triển: `5_signing_workflow`.
> - Tài liệu kỹ thuật chi tiết backend: [`signing-backend-plan.md`](signing-backend-plan.md).
> - Đánh giá nghiệp vụ và quyết định điều chỉnh (06/10/2026): [`danh-gia-nghiep-vu-va-de-xuat.md`](danh-gia-nghiep-vu-va-de-xuat.md).

---

## 1. MỤC TIÊU & PHẠM VI NGHIỆP VỤ

### 1.1. Mục tiêu
Xây dựng phân hệ **Trình ký** gồm: tạo hồ sơ trình ký; luân chuyển theo quy trình nhiều cấp (các cấp tuần tự, người trong cùng cấp ký song song); hiển thị tiến trình trực quan (stepper/timeline); ký duyệt bằng chữ ký điện tử nội bộ Ed25519 kèm kiểm tra toàn vẹn (SHA-256 raw digest); xử lý phản hồi hai nhánh; xử lý quá hạn không chặn luồng; ủy quyền ký khẩn cấp; và sẵn sàng khâu phát hành pháp lý ở bước cuối.

### 1.2. Phạm vi chức năng
1. **Ảnh chữ ký cá nhân (phụ thuộc Nhóm 7):**
   - Người dùng tải lên ảnh chữ ký PNG nền trong suốt, tối đa 2MB, trong hồ sơ cá nhân (field `anh_chu_ky`, sheet CBNV).
   - Phân hệ Trình ký chỉ đọc ảnh qua contract do Nhóm 7 cung cấp.
   - *Kích thước pixel chuẩn:* chưa chốt, xác định khi làm stamping.
2. **Mẫu quy trình trình ký:**
   - Quy trình nhiều cấp, trạng thái `NHAP -> HOAT_DONG -> NGUNG`, phạm vi `PHONG_BAN` (gắn đơn vị áp dụng) hoặc `CONG_TY`.
   - Quy trình `CONG_TY` do quản trị cấu hình; quy trình `PHONG_BAN` do lãnh đạo đơn vị đó hoặc quản trị cấu hình.
   - Các cấp mở tuần tự; trong một cấp, mọi người ký nhận cùng lúc và đều phải ký. Muốn mọi người ký cùng lúc thì cấu hình quy trình một cấp.
   - Người ký cấu hình theo tài khoản hoặc theo chức vụ. Chức vụ hiểu tương đối: trong đơn vị người tạo, trong một đơn vị cố định, hoặc cấp cơ quan. Khi gửi, chức vụ có nhiều người thì người tạo phải chọn; không có ai thì không cho gửi.
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
   - Phạm vi văn bản: chỉ trình ký **văn bản đi** (`vanbandi`). Văn bản đến không trình ký (bút phê/chỉ đạo thuộc Nhóm 2). Văn bản mật đã bỏ (GVHD chốt); văn bản hạn chế (`pham_vi = 'HAN_CHE'`) là văn bản gửi đi chọn người xem và lưu log xem, không ký và không đi qua trình ký; API tạo hồ sơ từ chối loại này (`signing-backend-plan.md` mục 3.3).
4. **Danh sách hồ sơ trình ký:**
   - Tabs: *Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Toàn bộ hồ sơ*.
   - Bộ lọc: phòng ban, trạng thái, mức độ, khoảng thời gian.
5. **Chi tiết hồ sơ và sơ đồ luồng ký:**
   - Split view: cột trái là stepper tiến độ ký; cột phải là PDF viewer có lớp phủ khung ký.
6. **Ký duyệt và xử lý phản hồi hai nhánh:**
   - **Nhánh 1 — Lỗi nhỏ, không chặn luồng:** ký duyệt kèm `ghi_chu_ky`; luồng tiếp tục; ghi chú hiển thị cho người tạo và các cấp sau.
   - **Nhánh 2 — Lỗi lớn, chặn luồng:** `yeu_cau_sua` kèm lý do; lượt trình chuyển `YEU_CAU_SUA`, các cấp đang mở `TAM_DUNG`; mở thread trao đổi hai chiều (`signing_change_thread`). Khi thống nhất, người tạo tải bản mới, thread `DA_GIAI_QUYET`, hệ thống tạo lượt trình mới để ký lại toàn bộ. Lượt cũ giữ nguyên `YEU_CAU_SUA` làm lịch sử.
   - **Từ chối = không đồng ý ban hành** (`tu_choi`), bắt buộc lý do; hồ sơ kết thúc ở `TU_CHOI`. Muốn trình lại thì tạo hồ sơ mới (`trinh_lai`) trỏ về hồ sơ gốc (`ho_so_goc`). Giao diện phân biệt rõ "Trả lại để sửa" (nhánh 2) và "Không đồng ý ban hành".
   - Thu hồi chữ ký (`thu_hoi`) chỉ khi cấp của người ký còn mở và trước khi lượt trình hoàn thành; chữ ký cũ giữ nguyên làm bằng chứng.
7. **Quá hạn và ủy quyền khẩn cấp:**
   - Quá hạn không tự hủy, không tự từ chối; người ký vẫn ký muộn được và hệ thống ghi `ky_tre_han = true`, `so_giay_tre`.
   - Nhắc và leo thang: nhắc trước hạn 24 giờ, tại hạn, nhắc lặp mỗi 24 giờ khi quá hạn; quá hạn 48 giờ báo cấp trên trực tiếp của người ký và người tạo. Có báo cáo trễ hạn theo người/đơn vị.
   - **Ủy quyền theo thời gian** (căn cứ NĐ 30/2020 Điều 13: ủy quyền có thời hạn và phạm vi): người ủy quyền hoặc cấp trên khai báo trước người nhận, khoảng thời gian, phạm vi và hình thức ký (KT., TL., TUQ.); hồ sơ đến trong khoảng đó tự chuyển người nhận.
   - **Ủy quyền khẩn cấp** (`uy_quyen`): chỉ cấp trên trực tiếp của người ký hoặc quản trị thực hiện; người nhận phải thuộc danh sách người nhận hợp lệ của chức danh (định nghĩa của "thẩm quyền tương đương"); lý do bắt buộc (`ly_do_uy_quyen`), có nhật ký; không ủy quyền cho người đã có trong cùng cấp.
   - Hình thức ký (`hinh_thuc_ky`: ký trực tiếp, KT., TL., TUQ.) được ghi trên người ký và dùng để in đúng thể thức khối chữ ký.
8. **Khâu phát hành pháp lý (bước bổ sung cuối):**
   - Chữ ký Ed25519 của luồng duyệt là **chữ ký điện tử nội bộ**, không gọi là chữ ký số và không có giá trị pháp lý với bên ngoài.
   - Ba bước tuần tự sau khi lượt trình `HOAN_THANH`:
     1. Phẳng hóa: dán ảnh chữ ký và khối chữ ký đúng hình thức ký, chừa ô số/ngày.
     2. Ký số người có thẩm quyền qua `LegalSignerAdapter` theo mô hình ký số từ xa (Cloud CA / HSM / VNeID). Khi đã tích hợp CA, người ký chính cấp cuối ký bằng adapter thay cho Ed25519 để không phải ký hai lần.
     3. Hệ thống sổ văn bản đi của Nhóm 2 cấp số, ký hiệu, thời gian ban hành bằng chức năng của hệ thống (NĐ 30/2020 Điều 15); văn thư ký số của cơ quan kèm dấu thời gian TSA theo chuẩn PAdES.
   - **LƯU Ý PHÁP LÝ (BẮT BUỘC):** Người chịu trách nhiệm pháp lý cao nhất (người đại diện theo pháp luật / lãnh đạo có thẩm quyền ban hành) bắt buộc phải có Chứng thư số X.509 do tổ chức cung cấp dịch vụ chứng thực chữ ký số (CA) được cấp phép.

---

## 2. MÔ HÌNH DỮ LIỆU

Chi tiết field, kiểu dữ liệu và ràng buộc tại [`signing-backend-plan.md` mục 5](signing-backend-plan.md#5-thiết-kế-dữ-liệu). Tên field dùng tiếng Việt, trừ `id`, `create_by`, `created_at`, `update_by`, `update_at`.

| Bảng | Vai trò | Trạng thái |
| :--- | :--- | :--- |
| `signing_process` | Quy trình mẫu có phiên bản, phạm vi và đơn vị áp dụng | `NHAP`, `HOAT_DONG`, `NGUNG` |
| `signing_process_step` | Cấp ký trong quy trình, số giờ xử lý | — |
| `signing_process_step_signer` | Người ký cấu hình sẵn (người ký hoặc chức vụ + phạm vi chức vụ), `vai_tro_ky`, `chan_ky_chinh` | — |
| `signing_request` | Hồ sơ trình ký, vòng đời tổng; `ho_so_goc` khi trình lại | `NHAP`, `CHO_KY`, `HOAN_THANH`, `TU_CHOI`, `HUY` (3 trạng thái cuối là kết thúc) |
| `signing_attempt` | Lượt trình bất biến, nguồn sự thật của mã băm, tệp hoàn tất | `NHAP`, `CHO_KY`, `YEU_CAU_SUA`, `HOAN_THANH`, `TU_CHOI`, `HUY` |
| `signing_request_step` | Snapshot cấp ký của lượt trình | `CHUA_MO`, `DANG_KY`, `HOAN_THANH`, `TAM_DUNG` |
| `signing_request_step_signer` | Snapshot người ký, tọa độ ký, ủy quyền, `hinh_thuc_ky`, `chu_ky_hien_hanh` | `CHO_KY`, `DA_KY`, `TU_CHOI`, `YEU_CAU_SUA` |
| `signing_delegation` | Ủy quyền ký theo thời gian | `HIEU_LUC`, `DA_HUY` |
| `signing_key` | Khóa công khai Ed25519 (không lưu private key) | `CHO_KICH_HOAT`, `HOAT_DONG`, `DA_XOAY_VONG`, `THU_HOI`, `HET_HAN` |
| `signing_signature` | Chữ ký bất biến: `chu_ky_so`, `ghi_chu_ky`, `ky_tre_han`, snapshot ảnh chữ ký | `CHUA_XAC_MINH`, `HOP_LE`, `KHONG_HOP_LE` |
| `signing_manifest` | Bằng chứng tổng hợp chuẩn hóa, `ma_bam_bang_chung` | `NHAP`, `DA_CHOT` |
| `signing_change_thread` / `signing_change_message` | Trao đổi hai chiều khi yêu cầu sửa | `DANG_MO`, `DA_GIAI_QUYET` |
| `signing_audit_log` | Nhật ký chỉ ghi thêm, gồm cả sự kiện quy trình và khóa ký | — |
| `signing_notification` | Thông báo in-app/email, kiêm outbox | `CHO_GUI`, `DA_GUI`, `THAT_BAI` |

---

## 3. RESTFUL API

Prefix `/api/v1/`. Payload dùng đúng tên field CSDL. Tên đoạn đường dẫn theo convention tiếng Việt của code: endpoint quy trình và khóa đã triển khai (Phase 5); endpoint hồ sơ/lượt trình là dự kiến (Phase 7–9). Hành động chuyển trạng thái của hồ sơ/lượt trình bắt buộc header `Idempotency-Key` (áp dụng từ Phase 8).

| Phương thức | Endpoint | Chức năng | Phân quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/signing/quy-trinh/` | Danh sách quy trình theo phạm vi/quyền | `view_trinhky` |
| `POST` | `/signing/quy-trinh/` | Tạo quy trình `NHAP` | `manage_signing_process` |
| `GET` | `/signing/quy-trinh/{id}/` | Chi tiết quy trình, cấp, người ký | `view_trinhky` |
| `PATCH` | `/signing/quy-trinh/{id}/` | Sửa quy trình (chỉ khi `NHAP`) | `manage_signing_process` |
| `POST` | `/signing/quy-trinh/{id}/kich-hoat/` | Kích hoạt quy trình | `manage_signing_process` |
| `POST` | `/signing/quy-trinh/{id}/ngung/` | Ngừng quy trình | `manage_signing_process` |
| `POST` | `/signing/quy-trinh/{id}/nhan-ban/` | Nhân bản thành phiên bản mới | `manage_signing_process` |
| `GET` | `/signing/requests/` | Danh sách hồ sơ (phân trang, lọc tab) | `view_trinhky` |
| `POST` | `/signing/requests/` | Tạo hồ sơ `NHAP` kèm vị trí ký | `add_trinhky` |
| `GET` | `/signing/requests/{id}/` | Chi tiết hồ sơ, tiến trình, quyền xử lý | Người liên quan / Quản trị |
| `POST` | `/signing/requests/{id}/gui/` | Khóa snapshot, tạo lượt trình; chọn người ký khi chức vụ có nhiều người | `send_trinhky` (người tạo) |
| `POST` | `/signing/requests/{id}/huy/` | Hủy hồ sơ | `cancel_trinhky` (người tạo / quản trị) |
| `POST` | `/signing/requests/{id}/trinh-lai/` | Tạo hồ sơ mới từ hồ sơ bị từ chối (`ho_so_goc`) | `send_trinhky` (người tạo) |
| `POST` | `/signing/requests/{id}/phat-hanh/` | Phát hành pháp lý: ký số CA/CCCD, đóng dấu PAdES | Lãnh đạo / Văn thư |
| `POST` | `/signing/attempts/{id}/ky/` | Ký duyệt: verify Ed25519, snapshot ảnh chữ ký, không sửa tệp | `sign_trinhky` (người được chỉ định) |
| `POST` | `/signing/attempts/{id}/tu-choi/` | Từ chối (lý do bắt buộc) | `sign_trinhky` |
| `POST` | `/signing/attempts/{id}/yeu-cau-sua/` | Yêu cầu sửa, mở thread | `sign_trinhky` |
| `POST` | `/signing/attempts/{id}/uy-quyen/` | Ủy quyền ký khẩn cấp (lý do, hình thức ký bắt buộc) | `delegate_trinhky` (cấp trên trực tiếp / quản trị) |
| `POST` | `/signing/attempts/{id}/thu-hoi/` | Thu hồi chữ ký (khi cấp còn mở) | Chính người đã ký |
| `GET/POST` | `/signing/uy-quyen/` | Danh sách, khai báo ủy quyền theo thời gian | Người ủy quyền / cấp trên / quản trị |
| `POST` | `/signing/uy-quyen/{id}/huy/` | Hủy ủy quyền theo thời gian | Người tạo ủy quyền / quản trị |
| `GET/POST` | `/signing/change-threads/{id}/messages/` | Trao đổi trong thread | Người tạo / người yêu cầu sửa |
| `POST` | `/signing/change-threads/{id}/giai-quyet/` | Tải bản mới, đóng thread, tạo lượt trình mới | Người tạo hồ sơ |
| `GET/POST` | `/signing/khoa/` | Danh sách khóa của người dùng hiện tại; đăng ký khóa công khai | Authenticated |
| `GET` | `/signing/khoa/{id}/thach-thuc/` | Challenge chứng minh sở hữu khóa | Chủ khóa |
| `POST` | `/signing/khoa/{id}/xac-minh/` | Verify proof-of-possession | Chủ khóa |
| `POST` | `/signing/khoa/{id}/kich-hoat/` | Kích hoạt khóa đã xác minh | Chủ khóa |
| `POST` | `/signing/khoa/{id}/xoay-vong/` | Xoay vòng khóa | Chủ khóa |
| `POST` | `/signing/khoa/{id}/thu-hoi/` | Thu hồi khóa | Chủ khóa / Quản trị |
| `POST` | `/signing/khoa/{id}/dat-pin/` | Đặt PIN bảo vệ khóa ký (đã triển khai, Phase 6a) | Chủ khóa (`sign_trinhky`) |
| `POST` | `/signing/khoa/{id}/mo-khoa-ky/` | Xác minh PIN, trả mảnh bí mật máy chủ (đã triển khai, Phase 6a) | Chủ khóa (`sign_trinhky`) |
| `POST` | `/signing/khoa/{id}/doi-pin/` | Đổi PIN; Phase 6c xoay vòng mảnh bí mật máy chủ | Chủ khóa (`sign_trinhky`) |
| `GET` | `/signing/requests/{id}/audit/` | Nhật ký hồ sơ | `view_signing_audit` |
| `GET` | `/signing/attempts/{id}/manifest/` | Bằng chứng tổng hợp và trạng thái xác minh | `view_trinhky` |

API ảnh chữ ký cá nhân thuộc Nhóm 7, không nằm trong phân hệ này.

---

## 4. QUY CHUẨN GIAO DIỆN (UI/UX)

1. **Khu vực ảnh chữ ký trong hồ sơ cá nhân:** thuộc Nhóm 7. Phân hệ Trình ký chỉ hiển thị cảnh báo và liên kết tới hồ sơ khi người ký chưa có ảnh chữ ký.
2. **Trang danh sách (`SigningListPage`):**
   - 3 thẻ đếm: *Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Đã hoàn tất*.
   - Bộ lọc: phòng ban, mức độ, trạng thái; ô tìm kiếm trích yếu / mã hồ sơ.
   - Bảng dữ liệu: mã, trích yếu, người gửi, ngày gửi, cấp hiện tại, trạng thái (badge dùng token CSS), cảnh báo quá hạn.
3. **Trang tạo mới (`SigningCreatePage`):**
   - Chọn quy trình (chỉ quy trình `CONG_TY` và quy trình `PHONG_BAN` của đơn vị mình), nhập hạn chót; chọn người ký khi chức vụ có nhiều người.
   - Đính kèm tài liệu, kiểm tra phía client và tính trước mã băm SHA-256.
   - **Công cụ định vị chữ ký:** kéo-thả khung ký của từng người ký (ký nháy / ký chính) vào đúng trang và vị trí trên PDF.
4. **Trang chi tiết (`SigningDetailPage`):**
   - **Split view:** cột trái là stepper (xanh lá = đã ký, vàng = đang chờ, đỏ = trả về, cam = quá hạn); cột phải là PDF viewer hiển thị lớp phủ khung ký và ảnh chữ ký của người đã ký.
   - **Khung hành động:** *Ký duyệt* (kèm ô ghi chú tùy chọn), *Trả lại để sửa*, *Không đồng ý ban hành*; *Thu hồi chữ ký* khi cấp còn mở; *Ủy quyền khẩn cấp* chỉ hiện với cấp trên trực tiếp/quản trị.
   - Hồ sơ bị từ chối có nút *Trình lại* (tạo hồ sơ mới) và liên kết tới hồ sơ gốc.
   - **Phát hành pháp lý:** nút *Phát hành văn bản* chỉ hiển thị cho lãnh đạo/văn thư khi lượt trình `HOAN_THANH` và đã có tệp hoàn tất.

---

## 5. TIÊU CHUẨN KỸ THUẬT & INVARIANTS

- **i18n:** 100% text UI dùng `t('signing.xxx')`, khai báo đủ hai nhánh `vi` và `en` trong `frontend/src/i18n/translations.js`.
- **Design Tokens:** chỉ dùng biến từ `src/styles/global.css` (`var(--color-...)`, `var(--font-...)`); không hardcode mã hex/px.
- **Toàn vẹn dữ liệu:** không lưu private key trên backend; verify chữ ký đồng bộ trước khi đổi trạng thái người ký; mã băm của lượt trình, chữ ký và bằng chứng `DA_CHOT` là bất biến; không cascade xóa lịch sử.
- **Tọa độ chữ ký:** lưu dạng chuẩn hóa (tỷ lệ % hoặc điểm PDF), độc lập độ phân giải màn hình.
- **Lazy Stamping:** không sửa raw bytes tệp PDF trong luồng nội bộ; chỉ dán ảnh chữ ký một lần khi lượt trình `HOAN_THANH`, dùng snapshot ảnh tại thời điểm ký.
- **Bảo vệ khóa ký bằng PIN (Phase 6):** PIN 8 chữ số, Argon2id ở client; bản bọc private key chỉ ở thiết bị, server giữ mảnh bí mật `k_srv` và hash verifier, khóa theo số lần sai, có nhật ký; đổi PIN xoay vòng `k_srv` (Phase 6c). Chi tiết tại `signing-backend-plan.md` mục 3.4.
- **Thể thức:** khối chữ ký in theo `hinh_thuc_ky` (ký trực tiếp, KT., TL., TUQ.).
- **Văn bản hạn chế (`pham_vi = 'HAN_CHE'`):** là văn bản gửi đi chọn người xem và lưu log xem (Nhóm 2), không ký và không đi qua trình ký; API tạo hồ sơ từ chối. Bảo mật trình ký (khóa ký, PIN, mã băm, nhật ký, bằng chứng) giữ nguyên.
- **Ranh giới pháp lý:** người ký phát hành pháp lý bắt buộc có Chứng thư số CA hợp pháp.
- **Technical Gates:**
  - `python backend/manage.py check` (Pass)
  - `pytest` hoặc unit test phân hệ signing (Pass 100%)
  - `pnpm --dir frontend run build` (Pass 0 warning/error)
