# Đánh giá luồng nghiệp vụ Trình ký và đề xuất điều chỉnh (Nhóm 5)

Người lập: Lê Thanh Hậu (trưởng nhóm 5) · Ngày: 06/10/2026 · Nhánh căn cứ: `5_signing_workflow` (`f3b4831`)

Tài liệu này rà soát **luồng nghiệp vụ** của phân hệ Trình ký (không bàn lỗi kỹ thuật/CSDL), đối chiếu với cách các hệ thống văn phòng điện tử và ký điện tử đang vận hành ngoài thực tế, rồi chốt hướng sửa cho `spec.md`, `signing-backend-plan.md` và `plan-trien-khai-theo-phase.md`.

Ký hiệu trạng thái quyết định:

- `[CHỐT]`: đã áp dụng vào spec/plan trong cùng thay đổi này.
- `[CẦN XÁC NHẬN]`: đã ghi vào spec/plan theo đề xuất, cần pháp chế/Ban chuyên môn hoặc nhóm liên quan xác nhận trước phase ghi bên cạnh.

Nguồn đối chiếu thực tế: Nghị định 30/2020/NĐ-CP về công tác văn thư (thể thức, ký thay/thừa lệnh/thừa ủy quyền, quy trình ban hành văn bản điện tử); cách vận hành phổ biến của các hệ thống quản lý văn bản điện tử trong nước (luồng trình duyệt, trả lại, ủy quyền theo thời gian, ký số từ xa); mô hình định tuyến của DocuSign/Adobe Sign (routing order, decline, correct). Các trích dẫn điều khoản cần đối chiếu nguyên văn trước khi đưa vào tài liệu nghiệm thu.

---

## 0. Hiện trạng

| Phần | Trạng thái trên nhánh |
|---|---|
| Quy trình mẫu (tạo, kích hoạt, ngừng, nhân bản phiên bản) | Đã chạy (Phase 2–5, 6b) |
| Khóa ký Ed25519, PIN (Phase 6a), kiểm quyền (Phase 6b) | Đã chạy |
| Hồ sơ trình ký, gửi, ký, từ chối, yêu cầu sửa, ủy quyền, hạn xử lý, phẳng hóa, phát hành | Mới có model (Phase 3), chưa có service/API (Phase 7–10) |

Vì phần lõi chưa có service, đây là thời điểm rẻ nhất để sửa quy tắc nghiệp vụ: phần lớn đề xuất dưới đây chỉ đổi tài liệu và một số cột model chưa có dữ liệu thật.

## 1. Tổng hợp

| # | Điểm yếu | Mức | Hướng sửa | Ảnh hưởng schema | Trạng thái |
|---|---|---|---|---|---|
| 1 | `TUAN_TU`/`SONG_SONG` đặt ở mức toàn yêu cầu, chồng nghĩa với cấp ký | Cao | Cấp luôn tuần tự; song song là nhiều người trong một cấp | Bỏ `kieu_ky`, `kieu_ky_mac_dinh` | `[CHỐT]` |
| 2 | `TU_CHOI` vừa là kết thúc vừa mở lại được bằng `xem_xet_lai` | Cao | `TU_CHOI` là kết thúc; trình lại bằng hồ sơ mới trỏ về hồ sơ gốc | Thêm `ho_so_goc`; bỏ `TU_CHOI -> CHO_KY` | `[CHỐT]` |
| 3 | Chỉ ADMIN quản lý quy trình nhưng quy trình có phạm vi `PHONG_BAN` | Trung bình | Quyền quản lý quy trình theo phạm vi đơn vị | Thêm `don_vi_ap_dung` cho quy trình `PHONG_BAN` | `[CHỐT]` |
| 4 | Người ký theo chức vụ: chưa có quy tắc khi nhiều người cùng chức vụ | Cao | Chức vụ tương đối theo đơn vị; nhiều người thì người tạo chọn | Thêm `pham_vi_chuc_vu` | `[CHỐT]` |
| 5 | Ủy quyền khẩn cấp không có quy tắc "thẩm quyền tương đương", không có thể thức KT./TL./TUQ. | Cao | Ủy quyền đặt trước theo thời gian + danh sách người nhận hợp lệ + hình thức ký | Thêm bảng `signing_delegation`; thêm `hinh_thuc_ky` | `[CẦN XÁC NHẬN]` pháp chế, trước Phase 9 |
| 6 | Hạn chót chỉ để hiển thị, leo thang chưa định nghĩa người nhận | Trung bình | Quy tắc nhắc + leo thang theo cấp trên trực tiếp + báo cáo trễ hạn | Mở rộng `cau_hinh_nhac_han` | `[CHỐT]` |
| 7 | Ký nội bộ bằng PKI riêng + PIN nhưng không có giá trị pháp lý; người ký cuối phải ký hai lần | Trung bình | Ký chính cuối cùng gộp vào bước ký số CA | Không | `[CHỐT]` hướng; adapter Phase 10 |
| 8 | Phạm vi gồm cả văn bản đến; văn bản mật chưa rõ | Trung bình | Bỏ `vanbanden`; `vanbanmat` ngoài phạm vi cho tới khi pháp chế xác nhận | Đổi `LoaiVanBan` | `[CẦN XÁC NHẬN]` trước Phase 7 |
| 9 | Chưa ráp khâu văn thư: cấp số, ngày, ký số cơ quan | Cao | Tách 3 bước: phẳng hóa → ký số người có thẩm quyền → văn thư cấp số và ký số cơ quan | Contract với Nhóm 2 | `[CẦN XÁC NHẬN]` Nhóm 2, trước Phase 10 |

Ngoài nghiệp vụ, có một điểm thiết kế bảo mật ảnh hưởng quy tắc nghiệp vụ "đổi PIN": xem mục 11.

---

## 2. Cách thức ký tuần tự/song song

**Hiện trạng.** `signing_request.kieu_ky` chốt `TUAN_TU` hoặc `SONG_SONG` cho toàn yêu cầu; `SONG_SONG` mở mọi cấp cùng lúc (plan mục 3.2). Quy trình có `kieu_ky_mac_dinh`, người tạo được chọn lại khi tạo hồ sơ.

**Vấn đề.**

- `SONG_SONG` toàn yêu cầu tương đương một quy trình chỉ có một cấp. Khi đó việc chia cấp (Phòng → Pháp chế → Ban giám đốc) mất nghĩa: giám đốc có thể ký trước khi phòng kiểm tra xong.
- Người tạo hồ sơ được đổi cách thức ký, tức là người trình tự quyết định lãnh đạo có phải chờ cấp dưới không. Đây là quyền của người thiết kế quy trình, không phải của người trình.
- Quy tắc thu hồi chữ ký phải rẽ nhánh theo `kieu_ky` (chỉ cho `SONG_SONG`), làm máy trạng thái phức tạp mà không thêm giá trị.

**Thực tế làm thế nào.** Các hệ thống ký điện tử định tuyến theo *thứ tự*: người cùng thứ tự nhận song song, thứ tự sau chờ thứ tự trước. Hệ thống quản lý văn bản trong nước cũng đi theo cấp: chuyên viên → trưởng phòng → lãnh đạo; trong một cấp có thể gửi đồng thời cho nhiều người (ví dụ xin ý kiến nhiều phòng).

**Đề xuất `[CHỐT]`.**

- Cấp ký **luôn tuần tự** theo `thu_tu`. Song song = nhiều người ký trong **cùng một cấp**. Mọi người trong cấp vẫn bắt buộc ký (giữ phạm vi MVP, chưa làm quorum).
- Bỏ `signing_process.kieu_ky_mac_dinh` và `signing_request.kieu_ky`. Quy trình chỉ có một chế độ cần cài.
- Giữ quy tắc chặn trong cấp: `KY_NHAY` có `chan_ky_chinh` xong mới mở `KY_CHINH`.
- Thu hồi chữ ký: cho phép khi **cấp của người ký chưa đóng** (cấp `DANG_KY`) và lượt trình chưa hoàn thành, không phụ thuộc cách thức ký. Giữ quy tắc ký nháy chặn không được thu hồi sau khi ký chính cùng cấp đã ký.
- Muốn "mọi người ký cùng lúc" thì cấu hình một quy trình một cấp.

**Ảnh hưởng.** Migration bỏ 2 cột (model Phase 2–3, chưa có dữ liệu thật); sửa `services/process.py`, serializer, test Phase 5; DDL base cần đồng bộ (báo nhóm CSDL). Enum `KieuKy` bỏ.

## 3. Từ chối và trình lại

**Hiện trạng.** `tu_choi` đưa lượt trình và yêu cầu về `TU_CHOI`; `xem_xet_lai` tạo lượt mới và đưa yêu cầu `TU_CHOI -> CHO_KY` (plan mục 6.1).

**Vấn đề.** "Từ chối rồi xem xét lại trên cùng hồ sơ" và "yêu cầu sửa rồi tạo lượt mới" cho ra cùng một kết quả. Người dùng không phân biệt được hai nút; báo cáo không đếm được số hồ sơ bị từ chối thật sự vì trạng thái `TU_CHOI` có thể biến mất.

**Thực tế làm thế nào.** Văn phòng điện tử tách hai thao tác: **trả lại** (về người soạn để sửa, hồ sơ vẫn sống) và **không đồng ý ban hành** (đóng hồ sơ). Ở DocuSign, người ký decline thì envelope kết thúc; muốn gửi lại phải tạo envelope mới (có thể sao chép từ envelope cũ).

**Đề xuất `[CHỐT]`.**

- `tu_choi` = **không đồng ý ban hành**: lượt trình và yêu cầu `TU_CHOI`, đây là trạng thái kết thúc của yêu cầu.
- `yeu_cau_sua` = **trả lại để sửa**: giữ nguyên luồng thread và lượt trình mới như hiện tại. Đây là con đường duy nhất để quay vòng trên cùng hồ sơ.
- Bỏ `xem_xet_lai` khỏi yêu cầu đã `TU_CHOI`. Muốn trình lại thì **tạo hồ sơ mới** bằng thao tác `trinh-lai`, sao chép văn bản, quy trình, vị trí ký; hồ sơ mới có `ho_so_goc` trỏ về hồ sơ bị từ chối để tra lịch sử.
- Giao diện ghi rõ: "Trả lại để sửa" và "Không đồng ý ban hành".

**Ảnh hưởng.** Thêm `signing_request.ho_so_goc` (FK tự tham chiếu, `PROTECT`). Bỏ chuyển trạng thái `TU_CHOI -> CHO_KY`. Endpoint `xem-xet-lai` đổi thành `trinh-lai` (tạo hồ sơ mới).

## 4. Quyền quản lý quy trình theo phạm vi

**Hiện trạng.** Quyền `manage_signing_process` chỉ nhóm ADMIN có; người có quyền thao tác trên mọi quy trình (plan mục 3.1, Phase 6b). Quy trình lại có `pham_vi = PHONG_BAN | CONG_TY`.

**Vấn đề.** Quy trình `PHONG_BAN` không biết thuộc phòng nào. Trưởng phòng không tự cấu hình được luồng ký nội bộ của phòng mình, mọi thay đổi phải qua quản trị hệ thống, trong khi quản trị hệ thống không nắm nghiệp vụ từng phòng.

**Thực tế làm thế nào.** Hai tầng cấu hình: quản trị cấu hình quy trình dùng chung toàn cơ quan; lãnh đạo đơn vị cấu hình quy trình riêng cho đơn vị. Nhiều hệ thống còn hỗ trợ **luồng tự do** (người xử lý chọn người kế tiếp ở mỗi bước) cho văn bản không có mẫu.

**Đề xuất `[CHỐT]`.**

- Thêm `signing_process.don_vi_ap_dung` (bắt buộc khi `pham_vi = PHONG_BAN`, rỗng khi `CONG_TY`).
- Kiểm quyền theo phạm vi:
  - Quy trình `CONG_TY`: cần `manage_signing_process` ở phạm vi toàn cơ quan (ADMIN).
  - Quy trình `PHONG_BAN`: cần `manage_signing_process` và là lãnh đạo của `don_vi_ap_dung` (hoặc ADMIN).
- Người tạo hồ sơ chỉ thấy quy trình `CONG_TY` và quy trình `PHONG_BAN` của đơn vị mình.
- Luồng tự do: ngoài phạm vi MVP, ghi vào mục điểm còn mở.

**Ảnh hưởng.** Một cột mới; `permissions.py` thêm kiểm tra phạm vi (phụ thuộc model `Đơn vị` của Nhóm 7, làm ở Phase 7). Seed quyền: cấp `manage_signing_process` cho nhóm TP (cần nhóm CSDL đồng ý).

## 5. Người ký theo chức vụ

**Hiện trạng.** Người ký cấu hình theo tài khoản hoặc chức vụ; không resolve được tài khoản thì chặn gửi (plan mục 3.2, 5.3). Chưa có quy tắc khi nhiều người cùng chức vụ, và chưa nói chức vụ được hiểu trong phạm vi nào.

**Vấn đề.** Quy trình công ty ghi "Trưởng phòng" nhưng công ty có nhiều trưởng phòng. Nếu resolve toàn công ty thì gửi cho tất cả hoặc chọn ngẫu nhiên, đều sai.

**Thực tế làm thế nào.** Chức vụ trong quy trình được hiểu **tương đối** với người trình hoặc với đơn vị cố định: "Trưởng phòng *của người trình*", "Phó giám đốc *phụ trách khối*". Khi gửi, hệ thống gợi ý danh sách và người trình chọn; không ai giữ chức vụ thì không cho gửi.

**Đề xuất `[CHỐT]`.**

- Thêm `signing_process_step_signer.pham_vi_chuc_vu`:
  - `DON_VI_NGUOI_TAO`: chức vụ trong đơn vị của người tạo hồ sơ.
  - `DON_VI_CO_DINH`: chức vụ trong đơn vị ghi ở `don_vi_id` của cấp.
  - `TOAN_CO_QUAN`: chức vụ duy nhất cấp cơ quan (Giám đốc, Chánh văn phòng).
- Khi gửi:
  - Đúng 1 người phù hợp: tự gán.
  - Nhiều người: **bắt buộc người tạo chọn** trong payload `gui` (`chon_nguoi_ky`); thiếu thì trả lỗi kèm danh sách ứng viên.
  - Không có ai: chặn gửi (giữ nguyên).
- Kết quả chốt vào snapshot người ký; đổi cơ cấu sau khi gửi không ảnh hưởng hồ sơ đang chạy (giữ nguyên).

**Ảnh hưởng.** Một cột mới trên người ký cấu hình; API `gui` nhận thêm `chon_nguoi_ky`. Phụ thuộc model `Chức vụ`, `Đơn vị` (Nhóm 7, Phase 7).

## 6. Ủy quyền ký

**Hiện trạng.** Ủy quyền khẩn cấp: người ký hiện tại hoặc quản trị/lãnh đạo chuyển người ký `CHO_KY` sang người có "thẩm quyền tương đương", lý do bắt buộc. Thể thức KT./TL./TUQ. chưa có field (plan mục 3.5).

**Vấn đề.**

- "Thẩm quyền tương đương" không kiểm tra được bằng máy: hiện tại ai có quyền `delegate_trinhky` cũng chuyển được cho bất kỳ ai.
- Người ký tự ủy quyền cho người khác trên từng hồ sơ dễ bị lạm dụng (đẩy việc, né trách nhiệm).
- Văn bản ký thay **phải đổi thể thức khối chữ ký**. Theo Nghị định 30/2020, cấp phó ký thay cấp trưởng ghi "KT." trước chức vụ người đứng đầu, ký thừa lệnh ghi "TL.", ký thừa ủy quyền ghi "TUQ.". Nếu bước phẳng hóa chỉ dán ảnh chữ ký, văn bản ra **sai thể thức**.

**Thực tế làm thế nào.**

- **Ủy quyền đặt trước theo thời gian**: người ủy quyền (hoặc cấp trên) khai báo "từ ngày – đến ngày, ủy cho B, phạm vi văn bản". Hồ sơ đến tay người vắng mặt trong khoảng thời gian đó tự chuyển sang người được ủy quyền và ghi nhận hình thức ký.
- **Chuyển xử lý khẩn cấp** từng hồ sơ chỉ dành cho cấp trên hoặc văn thư/quản trị, có lý do.
- Danh sách người được nhận ủy quyền của một chức danh được cấu hình sẵn (cấp phó được phân công), không tự do.

**Đề xuất `[CẦN XÁC NHẬN]` pháp chế trước Phase 9.**

- Bảng mới `signing_delegation`: `nguoi_uy_quyen`, `nguoi_nhan`, `tu_ngay`, `den_ngay`, `hinh_thuc_ky` (`KT`, `TL`, `TUQ`), `pham_vi` (loại văn bản/quy trình, rỗng = tất cả), `ly_do`, `trang_thai` (`HIEU_LUC`, `DA_HUY`), người tạo, thời điểm. Người tạo là chính người ủy quyền hoặc cấp trên trực tiếp/quản trị.
- Khi mở cấp ký, nếu người ký có ủy quyền đang hiệu lực khớp phạm vi thì chuyển sang người nhận, ghi `uy_quyen_tu`, `hinh_thuc_ky`, nhật ký.
- Ủy quyền khẩn cấp từng hồ sơ: chỉ cấp trên trực tiếp của người ký hoặc quản trị (`delegate_trinhky`); người nhận phải thuộc **danh sách người nhận hợp lệ** của chức danh (cấu hình ở Nhóm 7 hoặc bảng cấu hình của Nhóm 5) — đây là định nghĩa máy kiểm tra được của "thẩm quyền tương đương".
- Thêm `signing_request_step_signer.hinh_thuc_ky` (`KY_TRUC_TIEP`, `KT`, `TL`, `TUQ`), mặc định `KY_TRUC_TIEP`. Bước phẳng hóa và bước ký số pháp lý dùng giá trị này để in khối chữ ký đúng thể thức.
- Người ký không tự ủy quyền từng hồ sơ cho người khác.

## 7. Hạn xử lý, nhắc và leo thang

**Hiện trạng.** Quá hạn không tự hủy, không tự từ chối; nhắc trước hạn 24 giờ và tại hạn; "escalation chỉ tạo thông báo và nhật ký" nhưng không nói gửi cho ai, khi nào (plan mục 3.5, 9.1).

**Vấn đề.** Không chặn luồng là đúng, nhưng thiếu leo thang thì hồ sơ treo ở một người không ai biết ngoài người tạo. Hạn chót khi đó chỉ để hiển thị.

**Thực tế làm thế nào.** Hạn xử lý đi kèm nhắc nhiều mốc, leo thang lên cấp trên trực tiếp khi quá hạn một khoảng, và **báo cáo trễ hạn** theo người/đơn vị cho lãnh đạo. Ủy quyền theo thời gian (mục 6) giải quyết phần lớn trường hợp vắng mặt trước khi thành quá hạn.

**Đề xuất `[CHỐT]`.**

- `cau_hinh_nhac_han` mặc định:
  - Trước `han_xu_ly` 24 giờ: nhắc người ký.
  - Tại `han_xu_ly`: nhắc người ký và người tạo.
  - Quá hạn mỗi 24 giờ: nhắc lặp người ký.
  - Quá hạn 48 giờ: leo thang cho **cấp trên trực tiếp của người ký** (theo cơ cấu Nhóm 7) và người tạo; gợi ý ủy quyền khẩn cấp.
- Vẫn không đổi trạng thái, không tự đổi người ký (giữ nguyên).
- Thêm báo cáo trễ hạn (số hồ sơ đang quá hạn, thời gian xử lý trung bình theo người/đơn vị) vào phạm vi Phase 9, đọc từ `ky_tre_han`, `so_giay_tre`.

## 8. Ký nội bộ và ký pháp lý

**Hiện trạng.** Mọi người ký dùng khóa Ed25519 sinh ở trình duyệt, bảo vệ bằng PIN và `k_srv` (Phase 6a). Chữ ký nội bộ không có giá trị pháp lý với bên ngoài; sau khi hoàn thành, lãnh đạo ký thêm một lần bằng chứng thư số CA (plan mục 1.4).

**Vấn đề.**

- Người ký chính cuối cùng (người có thẩm quyền ban hành) ký **hai lần** cho cùng một quyết định.
- Khóa nằm ở một trình duyệt: đổi máy, xóa dữ liệu trình duyệt là phải đăng ký khóa mới. Với lãnh đạo dùng nhiều thiết bị, đây là rào cản sử dụng lớn.

**Thực tế làm thế nào.** Hệ thống văn phòng điện tử chia hai tầng:

- **Duyệt nội bộ** (ký nháy, ý kiến các cấp): thao tác phê duyệt của người đã đăng nhập, gắn mã băm tài liệu, ghi nhật ký không sửa được; hồ sơ quan trọng thêm xác thực bước hai (OTP). Không cần hạ tầng khóa riêng.
- **Ký ban hành**: chữ ký số của người có thẩm quyền bằng chứng thư số do CA được cấp phép (ký số từ xa qua ứng dụng di động hoặc USB token), sau đó văn thư ký số của cơ quan.

**Đề xuất `[CHỐT]` hướng.**

- Giữ Ed25519 + PIN cho các cấp duyệt nội bộ (đã làm, có giá trị chống tráo văn bản và chống chối bỏ nội bộ). Tài liệu và giao diện gọi đúng tên: **chữ ký điện tử nội bộ**, không gọi là "chữ ký số".
- Người ký `KY_CHINH` của **cấp cuối** ký bằng `LegalSignerAdapter` thay cho Ed25519 khi hệ thống đã tích hợp CA: một lần ký vừa hoàn thành lượt trình vừa là chữ ký ban hành. Khi chưa có CA (MVP), giữ ký Ed25519 như hiện tại và phát hành ở bước sau.
- `LegalSignerAdapter` thiết kế theo mô hình **ký số từ xa** (gửi mã băm, người ký xác nhận trên thiết bị của mình, nhận lại chữ ký/chứng thư), không giả định USB token cắm vào máy chủ.

## 9. Phạm vi loại văn bản

**Hiện trạng.** `LoaiVanBan` gồm `vanbanden`, `vanbandi`, `vanbanmat`.

**Vấn đề.**

- Văn bản đến là văn bản của cơ quan khác; cơ quan nhận không ký lên đó. Nghiệp vụ với văn bản đến là trình lãnh đạo **cho ý kiến chỉ đạo** rồi giao xử lý — thuộc luồng xử lý văn bản đến (Nhóm 2), không phải trình ký.
- Văn bản chứa bí mật nhà nước chịu quy định riêng về hệ thống xử lý (không xử lý trên hệ thống kết nối Internet khi chưa đáp ứng yêu cầu bảo vệ). Đưa vào phạm vi khi chưa có xác nhận là rủi ro pháp lý.

**Đề xuất `[CẦN XÁC NHẬN]` trước Phase 7.**

- Bỏ `vanbanden` khỏi phạm vi Trình ký; bút phê/chỉ đạo văn bản đến chuyển cho Nhóm 2.
- `vanbanmat`: ngoài phạm vi MVP cho tới khi pháp chế xác nhận; nếu đồ án cần thể hiện thì chỉ mô phỏng, ghi rõ trong tài liệu.
- Trình ký MVP chỉ nhận `vanbandi` (dự thảo văn bản đi). Giữ cột `document_type` để mở rộng sau.

**Ảnh hưởng.** Đổi enum `LoaiVanBan`; DDL base có `DEFAULT 'vanbanden'` ở `signing_request.document_type` (đã nêu trong plan phase mục 4) — bỏ luôn giá trị mặc định này.

## 10. Khâu văn thư và phát hành

**Hiện trạng.** Hoàn thành lượt trình thì phẳng hóa ảnh chữ ký thành tệp hoàn tất; `LegalSignerAdapter` ký số và "văn thư (hoặc hệ thống) cấp số văn bản" (plan mục 1.4). Chưa nói số văn bản do ai cấp, cấp trước hay sau ký số, và tệp quay về Nhóm 2 thế nào.

**Thực tế làm thế nào.** Với văn bản điện tử theo Nghị định 30/2020: người có thẩm quyền ký số → văn thư **cấp số, ghi ngày tháng năm** vào văn bản → văn thư **ký số của cơ quan** → phát hành và lưu. Về kỹ thuật PDF, chữ ký số của người có thẩm quyền được đặt mức cho phép bổ sung trường/ghi chú sau khi ký, nhờ đó văn thư điền số, ngày mà không làm mất hiệu lực chữ ký trước.

**Đề xuất `[CẦN XÁC NHẬN]` Nhóm 2 trước Phase 10.**

- Số và ký hiệu văn bản đi do **sổ văn bản đi của Nhóm 2** cấp; Nhóm 5 không tự sinh số.
- Phase 10 tách thành ba bước tuần tự, mỗi bước có trạng thái và nhật ký:
  1. Phẳng hóa: dán ảnh chữ ký và khối chữ ký đúng `hinh_thuc_ky`, để trống ô số/ngày.
  2. Ký số người có thẩm quyền qua `LegalSignerAdapter` (hoặc đã ký ở cấp cuối theo mục 8).
  3. Văn thư cấp số, ngày (gọi API Nhóm 2), ký số cơ quan, chuyển văn bản sang trạng thái phát hành của Nhóm 2.
- Contract với Nhóm 2: Nhóm 5 trả `vi_tri_tep_hoan_tat`, `ma_bam_tep_hoan_tat`, danh sách người ký; Nhóm 2 trả số, ký hiệu, ngày ban hành.

## 11. Ghi chú bảo mật liên quan quy tắc nghiệp vụ "đổi PIN"

Quy tắc hiện tại: đổi PIN giữ nguyên `k_srv` để client bọc lại private key (plan mục 3.4, `services/pin.py`). `k_srv` được trả ở mọi lần mở khóa ký và không bao giờ đổi. Hệ quả: nếu `k_srv` lộ một lần (XSS, extension, log trung gian) cùng bản bọc trong IndexedDB thì PIN bị đoán offline không giới hạn, và việc người dùng chủ động đổi PIN khi nghi lộ **không** khôi phục được an toàn.

Đề xuất `[CHỐT]`: `doi-pin` sinh `k_srv` mới, trả `k_srv` cũ (để mở bản bọc cũ) và `k_srv` mới (để bọc lại) trong cùng response; ghi nhật ký `DOI_PIN` kèm cờ đã xoay vòng mảnh bí mật. Làm ở Phase 6c.

## 12. Việc cần làm tiếp

| Việc | Người/nhóm | Hạn |
|---|---|---|
| Duyệt các mục `[CHỐT]` trong tài liệu này | Nhóm 5 | Trước Phase 7 |
| Xác nhận KT./TL./TUQ., ủy quyền theo thời gian, văn bản mật | Pháp chế/Ban chuyên môn | Trước Phase 7 (văn bản mật), Phase 9 (ủy quyền) |
| Đồng bộ DDL base: bỏ `kieu_ky*`, thêm `ho_so_goc`, `don_vi_ap_dung`, `pham_vi_chuc_vu`, `hinh_thuc_ky`, bảng `signing_delegation`; bỏ default `vanbanden` | Nhóm CSDL + Nhóm 5 | Trước Phase 7 |
| Contract cấp số văn bản đi, chuyển trạng thái phát hành | Nhóm 2 + Nhóm 5 | Trước Phase 10 |
| Danh sách cấp trên trực tiếp, người nhận ủy quyền hợp lệ theo chức danh | Nhóm 7 + Nhóm 5 | Trước Phase 9 |
| Phase 6c: migration bỏ `kieu_ky*`, xoay vòng `k_srv` khi đổi PIN | Nhóm 5 | Trước Phase 7 |
