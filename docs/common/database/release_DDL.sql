-- =====================================================================
-- THAY ĐỔI VĂN BẢN TRÌNH KÝ KHÔNG BẮT BUỘC GẮN VĂN BẢN ĐI (Nhóm 5; issue #274; đánh dấu [VBTK] tại vị trí)
-- Căn cứ: yêu cầu nghiệp vụ trình ký (issue #275 mục 3); migration signing 0015_van_ban_trinh_ky_khac.
--   signing_request.document_type, document_id bỏ NOT NULL; thêm so_hieu_van_ban, trich_yeu_van_ban (nhập tay).
--   CHECK chk_signing_request_van_ban: hồ sơ gắn văn bản đi (hai cột cùng có giá trị) hoặc không gắn (hai cột
--   cùng NULL) và có trích yếu. Tệp PDF trình ký vẫn tải lên riêng như trước.
-- =====================================================================
-- THAY ĐỔI NHÓM QUYỀN BỔ SUNG (Nhóm 7; issue #228; đánh dấu [NQBS] tại vị trí)
-- Căn cứ: bảng nhóm quyền mặc định theo 25 chức vụ (nhóm trưởng chốt 21/10/2026, PR #211).
--   Thêm 2 nhóm chuẩn chỉ chứa quyền cộng thêm, gán cùng nhóm CV:
--   1) TLBGD (Trợ lý Ban Giám đốc): view_all_congviec, view_read_log_vanbanden, view_read_log_vanbandi, send_trinhky.
--   2) KT (Kiểm toán): view_signing_audit, view_read_log_vanbanden, view_read_log_vanbandi.
--   Migration authorization 0008_supplementary_groups_tlbgd_kt bổ sung cho DB dựng bằng migration.
-- Quy mô sau [NQBS] (cộng sau [CVTK]): 7 nhóm quyền chuẩn; thêm 7 lượt phân quyền (198 -> 205).
-- =====================================================================
-- THAY ĐỔI QUYỀN GỬI TRÌNH KÝ CỦA CHUYÊN VIÊN (Nhóm 5; issue #226; đánh dấu [CVTK] tại vị trí)
-- Căn cứ: signing-backend-plan.md mục 8 (nhân viên đã xác thực được tạo yêu cầu; gửi cần send_trinhky + người tạo).
--   Nhóm CV có add_trinhky nhưng thiếu send_trinhky nên hồ sơ do Chuyên viên tạo dừng ở NHAP: người tạo
--   không gửi được, người có send_trinhky cũng không gửi thay vì không phải người tạo. Cấp send_trinhky cho CV;
--   migration authorization 0007_grant_cv_send_trinhky bổ sung cho DB đã seed từ trước.
-- Quy mô sau [CVTK] (nạp sạch): nhóm CV 22 quyền; 198 lượt phân quyền (thêm 1 lượt).
-- =====================================================================
-- THAY ĐỔI BỎ MỨC ĐỘ KHẨN CỦA TRÌNH KÝ (Nhóm 5; issue #238)
-- Căn cứ: spec Nhóm 5 bỏ mức độ khẩn/ưu tiên; migration signing 0014_bo_muc_do.
--   signing_request bỏ cột muc_do (VARCHAR(20) NOT NULL; THUONG | KHAN | HOA_TOC kiểm ở tầng ứng dụng).
--   Bằng chứng đã chốt (signing_manifest.noi_dung_chuan_hoa) xác minh bằng nội dung đã lưu nên manifest
--   phiên bản 1 (có ho_so.muc_do) giữ nguyên; manifest phiên bản 2 trở đi không còn trường này.
-- =====================================================================
-- THAY ĐỔI PHASE 10 LÕI TRÌNH KÝ (Nhóm 5; issue #80; đánh dấu [P10] tại vị trí)
-- Căn cứ: issue #80 mục D; signing-backend-plan.md mục 3.2 "Phẳng hóa"; migration signing 0007_tep_hoan_tat.
--   signing_attempt thêm trang_thai_tep_hoan_tat (NULL khi lượt chưa hoàn thành; DANG_XU_LY | LOI | THANH_CONG)
--   và loi_tep_hoan_tat (mã lỗi lần tạo gần nhất): tệp PDF hoàn tất sinh sau khi lượt hoàn thành, lỗi thì
--   thử lại được, không yêu cầu ký lại. Giá trị trạng thái kiểm ở tầng ứng dụng như các cột trạng thái khác.
-- =====================================================================
-- THAY ĐỔI PHASE 7 TRÌNH KÝ (Nhóm 5; issue #80; đánh dấu [P7] tại vị trí)
-- Căn cứ: signing-backend-plan.md mục 3.2, 3.3; migration signing 0006_ho_so_goc_pham_vi_chuc_vu_muc_do.
--   1) signing_request thêm ho_so_goc_id (FK tự tham chiếu, RESTRICT) và index: trình lại sau từ chối
--      tạo hồ sơ mới trỏ về hồ sơ bị từ chối; hồ sơ TU_CHOI là trạng thái kết thúc.
--   2) signing_process_step_signer thêm pham_vi_chuc_vu (NULL khi cấu hình theo tài khoản): chức vụ
--      hiểu tương đối trong đơn vị người tạo, đơn vị cố định của cấp hoặc toàn cơ quan.
--   3) signing_process thêm don_vi_ap_dung_id (FK organizations_donvi, RESTRICT) và index; CHECK phạm vi
--      PHONG_BAN bắt buộc có đơn vị, CONG_TY không gắn đơn vị (migration signing 0008_don_vi_ap_dung; dữ liệu
--      cũ PHONG_BAN chưa có đơn vị được chuyển CONG_TY, đúng hành vi trước đó). Người tạo hồ sơ chỉ chọn
--      quy trình CONG_TY hoặc PHONG_BAN của đơn vị mình.
--   4) Cấp manage_signing_process cho nhóm TP (plan mục 8): lãnh đạo đơn vị quản lý quy trình PHONG_BAN
--      của đơn vị mình; quy trình CONG_TY vẫn chỉ quản trị quản lý (kiểm ở tầng ứng dụng).
--   5) Cột của các bảng signing_* theo tên chuẩn hóa ở #96 (nguoi_tao_id, nguoi_cap_nhat_id, updated_at,
--      document_id); migration signing 0009_doi_ten_cot_theo_ddl_chuan_hoa đổi tên cột cho DB dựng bằng migration.
-- Quy mô sau [P7] và [P10] (nạp sạch): 55 bảng vật lý | 20 kiểu ENUM | 77 quyền thao tác | 5 nhóm quyền chuẩn | 197 lượt phân quyền.
-- =====================================================================
-- THAY ĐỔI PHASE 6c TRÌNH KÝ (Nhóm 5; issue #79; đánh dấu [6c] tại vị trí)
-- Căn cứ: docs/modules/05_signing_workflow/danh-gia-nghiep-vu-va-de-xuat.md mục 2 (đã chốt ở PR #78),
--   plan-trien-khai-theo-phase.md Phase 6c; migration signing 0005_bo_kieu_ky_chi_nhan_van_ban_di.
--   1) signing_process bỏ cột kieu_ky_mac_dinh; signing_request bỏ cột kieu_ky.
--      Cấp ký luôn tuần tự theo thu_tu, người trong cùng cấp ký song song.
--      Lý do bỏ cách thức TUAN_TU/SONG_SONG cho toàn hồ sơ:
--      - SONG_SONG mở mọi cấp cùng lúc, tương đương quy trình một cấp: người ký cuối có thể ký trước
--        khi cấp kiểm tra (nội dung, pháp chế) xem xong, việc chia cấp mất nghĩa.
--      - Người trình được chọn cách thức, tức tự quyết lãnh đạo có phải chờ cấp dưới; thứ tự kiểm duyệt
--        thuộc người thiết kế quy trình.
--      - Mọi quy tắc (mở cấp, hạn xử lý, thu hồi chữ ký) phải rẽ nhánh theo cách thức mà không thêm giá trị.
--      Căn cứ thực tiễn: ký điện tử định tuyến theo thứ tự (cùng thứ tự ký song song, thứ tự sau chờ
--      thứ tự trước); văn phòng điện tử đi theo cấp. Tham khảo NĐ 30/2020 Điều 12: kiểm tra nội dung,
--      thể thức trước khi trình người có thẩm quyền ký.
--   2) Bỏ ENUM signing_kieuky: không cột, hàm hay đối tượng nào dùng. Bằng chứng trên bản trước thay đổi:
--      tên chỉ xuất hiện ở dòng CREATE TYPE; information_schema.columns không có cột udt_name =
--      'signing_kieuky' (kieu_ky, kieu_ky_mac_dinh là VARCHAR); pg_depend không có đối tượng phụ thuộc.
--   3) Không đổi document_kind: trình ký chỉ nhận 'vanbandi', kiểm ở tầng ứng dụng; giữ ENUM chung
--      vì documents_view_log và task_congviec vẫn dùng 'vanbanden'.
-- Quy mô sau thay đổi (đã ghép PR #92): 55 bảng vật lý | 20 kiểu ENUM | 77 quyền thao tác | 5 nhóm quyền chuẩn | 196 lượt phân quyền.
-- =====================================================================
-- THAY ĐỔI BỎ VĂN BẢN MẬT (GVHD đã chốt bỏ văn bản mật; đánh dấu [BỎ MẬT] tại vị trí; giữ nhãn phiên bản)
-- Bối cảnh: khách hàng là doanh nghiệp bảo hiểm; "văn bản mật" được hiểu là tài liệu nội bộ
--   hạn chế (không phải bí mật nhà nước) và xử lý bằng quyền xem + nhật ký xem trên văn bản đến/đi.
--   1) Bỏ phân hệ văn bản mật: xóa 7 bảng documents_vanbanmat*, 2 hàm và 4 trigger đi kèm.
--   2) ENUM document_kind còn 'vanbanden', 'vanbandi'.
--   3) documents_vanbanden, documents_vanbandi thêm cột pham_vi ('NOI_BO' | 'HAN_CHE'), mặc định 'NOI_BO';
--      CHECK văn bản HAN_CHE không gửi mail toàn hệ thống (chuyển từ CHECK B2 của bảng mật).
--   4) Bỏ 4 quyền view/add/change/delete_vanbanmat và các lượt phân quyền tương ứng.
--   5) Trợ lý AI (role qlvb_readonly) chỉ đọc metadata qua view ai_*; view văn bản loại HAN_CHE,
--      bỏ cột/bảng đính kèm, và role không có SELECT trên bảng nghiệp vụ gốc.
-- Quy tắc xem văn bản HAN_CHE (tầng ứng dụng, queryset dùng chung của Nhóm 2):
--   chỉ người tạo, người nhận, thành viên đơn vị nhận; không ngoại lệ cho superuser hay quyền view_*;
--   mọi lượt mở ghi documents_view_log.
-- Trợ lý AI không dùng văn bản HAN_CHE trong mọi trường hợp, kể cả khi người hỏi là người nhận.
-- Quy tắc văn bản HAN_CHE (văn bản mật nội bộ công ty; không phải mật hành chính do cơ quan nhà nước ban hành):
--   người xem = người tạo + người nhận do người tạo chọn theo ID nhân viên (documents_*_nguoinhan);
--   không ngoại lệ cho superuser hay quyền view_*; tài khoản bị khóa (is_active = FALSE) mất quyền xem;
--   người không có quyền nhận 404 (như văn bản không tồn tại); mọi lượt xem/tải/bị chặn/đổi danh sách ghi documents_access_log.
--   pham_vi không đổi sau khi tạo; văn bản HAN_CHE không được xóa (MVP). Văn bản NOI_BO chỉ ghi documents_view_log.
--   Mã hóa nội dung: sau MVP.
-- Quy mô sau thay đổi: 55 bảng vật lý | 21 kiểu ENUM | 77 quyền thao tác | 5 nhóm quyền chuẩn | 196 lượt phân quyền.
-- =====================================================================
-- =====================================================================
-- CHUẨN HÓA TÊN CỘT (quy ước ở #68; các nhóm cập nhật model và migration theo tên mới)
--   1) update_at -> updated_at: signing_process, signing_request, signing_attempt, signing_change_thread.
--   2) create_by_id -> nguoi_tao_id: signing_process, signing_request, signing_attempt, signing_manifest;
--      update_by_id -> nguoi_cap_nhat_id: signing_process, signing_request, signing_attempt;
--      chỉ mục idx_signing_*_create_by -> idx_signing_*_nguoi_tao, idx_signing_*_update_by -> idx_signing_*_nguoi_cap_nhat.
--   3) created_time -> created_at, created_user_id -> nguoi_tao_id: records_chitiettailieu_attachment,
--      documents_vanbanden_attachment, documents_vanbandi_attachment, task_attachment.
--   4) nguoi_tao -> nguoi_tao_id: records_chitiettailieu, documents_vanbanden, documents_vanbandi, task_congviec.
--   5) status -> trang_thai: meetings_meetingroom, meetings_meetingbooking, birthdays_birthdaywish,
--      birthdays_birthdayemaillog (giá trị ENUM giữ nguyên).
--   6) signing_request.van_ban_id -> document_id (cùng tên với document_id ở các bảng dùng quan hệ đa hình khác).
-- Giữ nguyên: nguoi_lap_id (records_hoso, records_tailieu), các cột tiếng Anh/viết tắt của task_*,
--   meetings_meetingbooking.organizer_id (tên theo nghiệp vụ, không phải xung đột giữa các nhóm).
-- =====================================================================
-- =====================================================================
-- RELEASE_DDL_v1 — trạng thái đích của Issue #53, sinh từ RELEASE_DDL_v0
-- Thay đổi so với v0 (mọi thay đổi đều đánh dấu [v1] tại vị trí):
--   1) ENUM hieu_luc_status thêm 'CON_HIEU_LUC_1_PHAN' (Nhóm 2; dùng chung 3 bảng văn bản và records_chitiettailieu).
--   2) records_chitiettailieu thêm don_vi_id (FK organizations_donvi, NULL) và chỉ mục (Nhóm 4).
--   3) records_chitiettailieu_attachment thêm file_size, mime_type (NULL) (Nhóm 4).
--   4) documents_vanbanmat: CHECK gui_mail_toan_he_thong = FALSE (mục B2).
--   5) auth_permission thêm 8 quyền: view/add/change/delete_nhomquyen, import_chucvu,
--      add/change/delete_phonghop (Nhóm 7); nhóm ADMIN nhận qua phép CROSS JOIN sẵn có.
--   6) Thêm bảng signing_key_unlock (Nhóm 5, Phase 6a; mục B7).
--   7) Cấp quyền chỉ đọc theo bảng/cột cho role qlvb_readonly nếu role tồn tại (Nhóm 8).
-- Không đưa vào DDL: mục B3 (độ khẩn/độ mật/số đăng ký; Nhóm 2 xác nhận bỏ), B1 (quy ước tài liệu),
--   B4/B5 (queryset dùng chung ở tầng ứng dụng), B6 (chưa chốt), bảng dashboard_* và bảng Django hệ thống.
-- Quy tắc cho nhóm: không tạo lại các thay đổi 2, 3, 5 bằng migration riêng (trùng cột/quyền khi áp dụng).
-- =====================================================================
-- =====================================================================
-- RELEASE_DDL_v0 — sinh từ SQL_Fix4 (csdl_qlvbtl_schema_final.sql)
-- Thay đổi so với SQL_Fix4 (chỉ phần Trình ký đã chốt, giữ model, sửa DDL):
--   1) signing_request.document_type: bỏ DEFAULT 'vanbanden'.
--   2) Trigger prevent_delete_or_tamper_signing_signature: chặn mọi cột trừ
--      trang_thai_xac_minh và thoi_diem_xac_minh.
--   3) ON DELETE RESTRICT cho: signing_attempt.trinh_ky_id, signing_attempt.luot_truoc_id,
--      signing_request_step.luot_trinh_id, signing_request_step_signer.buoc_ky_id,
--      signing_request_step_signer.uy_quyen_tu_id, signing_key.khoa_thay_the_id.
--   4) Bỏ kiểu ENUM thừa signing_key_status (21 kiểu ENUM).
--   5) Số liệu thống nhất theo kết quả chạy thực: 73 quyền, 198 lượt phân quyền; bỏ phần lặp trong danh sách quyền các nhóm.
-- Chưa đưa vào v0 (chờ chốt): ENUM hieu_luc_status thêm giá trị mới, bảng Django
-- hệ thống, signing_key_unlock, và các cột bổ sung của từng nhóm (làm bằng migration sau base).
-- =====================================================================
-- =====================================================================
-- HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ TÀI LIỆU (QLVB&TL) — PostgreSQL DDL
-- Sinh tự động & đồng bộ từ đặc tả: CSDL QLVB&TL.md
-- Quy mô: 61 bảng vật lý | 21 kiểu ENUM | 81 quyền thao tác | 5 nhóm quyền chuẩn | 206 lượt phân quyền
-- =====================================================================
-- GHI CHÚ VỀ CÁC QUYẾT ĐỊNH THIẾT KẾ & ĐỒNG BỘ KIẾN TRÚC:
--
-- 1) [CẬP NHẬT] Cơ cấu tổ chức dùng 2 BẢNG RIÊNG theo đặc tả mới nhất
-- (tab "Đvị, phòngban"): organizations*khoi (Khối/Khu vực - cấp 1) và
-- organizations_donvi (Đơn vị/phòng ban - cấp 2, FK khoi_id -> Khối).
-- Không dùng self-reference — mọi FK nghiệp vụ (don_vi_nhan,
-- accounts_employee.don_vi_id...) chỉ trỏ tới organizations_donvi,
-- tránh trường hợp trỏ nhầm vào một hàng Khối như thiết kế tự tham
-- chiếu cũ có thể gặp phải.
-- 2) Mục 14 "accounts_employee" là bản đặc tả cuối cùng, dùng làm bảng
-- người dùng chính (thay auth_user mặc định của Django, vì có sẵn
-- username/password) — mọi FK "ForeignKey (auth_user)" trong tài
-- liệu được trỏ về accounts_employee(id).
-- 3) "Văn bản liên quan" ở signing_request và task (Công việc) tham
-- chiếu đa hình tới 1-trong-3 bảng văn bản -> dùng cặp cột
-- (document_type, document_id) thay vì FK cứng (generic relation
-- kiểu Django ContentType), có CHECK ràng buộc giá trị hợp lệ.
-- 4) Cột "kyhieu" trùng lặp với "so_hieu" ở documents_vanbandi /
-- documents_vanbanmat (tài liệu gốc tự ghi chú "trùng với 7") ->
-- bỏ, chỉ giữ so_hieu.
-- 5) Thống nhất ENUM: Đúng 21 kiểu ENUM chuẩn. Hợp nhất hieu_luc_status
-- ('CON_HIEU_LUC', 'HET_HIEU_LUC', 'HET_VA_THAY_THE') dùng chung cho
-- cả 4 bảng văn bản và chi tiết tài liệu; xóa bỏ hieu_luc_status_v2.
-- 6) [Tô Thanh Tân] Hệ thống phân quyền RBAC độc lập, kế thừa quy ước và tên bảng
-- chuẩn của Django Auth (auth_group, auth_permission, auth_group_permissions),
-- mở rộng cột module_ten phục vụ trực tiếp giao diện phân nhóm quyền, không phụ
-- thuộc cứng vào bảng nội bộ django_content_type để đảm bảo tính độc lập DDL.
-- Cột content_type_id để NULL để chạy DDL trực tiếp trên PostgreSQL;
-- Seed 81 quyền chi tiết, 5 nhóm quyền chuẩn và 206 lượt mapping idempotent.
-- 7) [Tô Thanh Tân] accounts_employee bổ sung is_active (khóa tài khoản nhân viên nghỉ
-- việc theo chuẩn Django User), is_staff, is_superuser; thống nhất mô hình
-- Custom User Model hoặc Profile 1-1 không bị dư thừa dữ liệu.
-- 8) [Lê Thanh Hậu — Issue #25] Bảo toàn bằng chứng ký số điện tử:
-- - FK signing_attempt -> request, signing_signature, signing_manifest đổi sang
-- ON DELETE RESTRICT.
-- - Trigger chặn xóa cứng attempt đã kích hoạt, chữ ký số và manifest đã chốt.
-- - Kiến trúc Zero-Knowledge: Backend TUYỆT ĐỐI KHÔNG lưu encrypted_private_key.
-- 9) [Phan Tạ Hữu Đức & Chỉ đạo GVHD 25/09/2026] Chuẩn hóa phân hệ Công việc:
-- - Phân quyền duyệt/hủy duyệt theo Object-level trong task_participant (Người tạo,
-- Chủ trì CHU_TRI, Chỉ đạo CHI_DAO); bỏ kiểm tra 3 lớp cứng và không chặn duyệt bằng approve_congviec.
-- - Bổ sung bảng liên kết Many-to-Many task_congviec_donvi (gắn công việc với phòng ban).
-- - Bổ sung 2 quyền xem: view_all_congviec và view_dept_congviec.
-- 10) [Trần Vũ Giang Anh] Quyền use_aiassistant có ranh giới an ninh chặt chẽ:
-- chỉ cấp quyền UI, tầng ứng dụng / RAG bắt buộc kiểm tra quyền xem (view*\*)
-- và ACL trước khi cung cấp ngữ cảnh cho mô hình ngôn ngữ lớn (LLM).
-- 11) [Chỉ đạo GVHD Thầy Trần Phương Duy & Phan Tạ Hữu Đức Nhóm 6 29/09/2026] Chuẩn hóa Tệp đính kèm Hướng A:
-- Xóa cột đơn file_dinh_kem trong 4 bảng chính (documents_vanbanden, documents_vanbandi,
-- documents_vanbanmat, records_chitiettailieu) chuyển sang 4 bảng con 1-N chuẩn 7 trường.
-- Đồng thời bảng task_attachment của Nhóm 6 được nâng cấp lên 9 trường chuẩn (thêm name, path,
-- is_deleted, created_at, nguoi_tao_id nhưng bảo toàn nguyên vẹn 2 cột nghiệp vụ loai và y_kien_id).
-- 12) [Lê Thành Tài & Lê Thanh Hậu — Nhóm 5 29/09/2026] Đồng bộ 100% 14 bảng signing_* theo Django model:
-- Chuẩn hóa tên cột thuần Việt (so_luot, phien_ban_van_ban, vi_tri_luu_tep, ma_bam_tai_lieu...),
-- bổ sung đầy đủ trường tọa độ box ký trên PDF (trang_ky, toa_do_x, toa_do_y, chieu_rong_khung, chieu_cao_khung),
-- ảnh chữ ký, ủy quyền ký (uy_quyen_tu_id, ly_do_uy_quyen); chuẩn hóa toàn bộ khóa ngoại người dùng
-- sang accounts_employee(id) và đơn vị, chức vụ; duy trì bất biến chứng thực bằng trigger.
-- 13) [Lê Trí Kiệt — Nhóm 2 29/09/2026] Chuẩn hóa nghiệp vụ Phân hệ Văn bản (Nghị định 30/2020/NĐ-CP):
-- - Khóa chống trùng STT theo năm: CONSTRAINT uq_vanbanden_nam_stt UNIQUE (nam, so_thu_tu) và
-- uq_vanbandi_nam_stt UNIQUE (nam, so_thu_tu) chống xung đột lưu đồng thời (Race Condition).
-- - Ràng buộc toàn vẹn link_thay_the: Bắt buộc không rỗng khi hieu_luc = 'HET_VA_THAY_THE' trên cả 3 bảng văn bản.
-- - Trigger tự động dọn dẹp documents_view_log khi xóa cứng văn bản: trg_cleanup_viewlog_on_doc_delete
-- loại bỏ triệt để bản ghi mồ côi sinh ra do quan hệ đa hình Generic Relation.
-- 14) [Lê Thanh Hậu — Nhóm 5 Issue #47 30/09/2026] Chuẩn hóa chuyên sâu Phân hệ Trình ký (signing_*):
-- - [P0] Bổ sung document_type document_kind NOT NULL cho signing_request và index (document_type, document_id).
-- - [P0] Trigger bảo toàn bằng chứng số: chặn UPDATE trên signing_signature (chỉ cho phép cập nhật thẩm định),
-- chặn UPDATE/DELETE trên signing_manifest khi DA_CHOT, biến signing_audit_log thành chuẩn WORM (chặn cả UPDATE và DELETE).
-- - [P0] Chuyển 3 FK của signing_audit_log sang ON DELETE RESTRICT (tránh UPDATE ngầm làm mất dấu vết).
-- - [P1] Bổ sung 5 quyền phân hệ Trình ký: manage_signing_process, send_trinhky, delegate_trinhky, cancel_trinhky, view_signing_audit (nâng tổng lên 73 quyền).
-- - [P1] Chuyển FK luot_trinh_id ở signing_change_thread và yeu_cau_sua_id ở signing_change_message sang ON DELETE RESTRICT (bảo toàn lịch sử thảo luận).
-- - [P1] Chuyển FK nguoi_ky_id, chuc_vu_id ở signing_process_step_signer sang ON DELETE RESTRICT (tránh vi phạm CHECK một trong hai khi xóa user/chức vụ).
-- - [P1] Cho phép NULL ở các cột chưa có giá trị lúc tạo bản nháp (phien_ban_van_ban, vi_tri_luu_tep, ma_bam_tai_lieu ở request; ten_chuc_vu, khoa_chong_trung_thao_tac ở signer; vi_tri_luu ở manifest).
-- - [P1] signing_audit_log.dia_chi_ip cho phép NULL, bỏ mặc định 127.0.0.1.
-- - [P2] Bổ sung 2 index nhắc hạn: signing_request(han_chot) và signing_request_step(han_xu_ly).
-- =====================================================================
CREATE SCHEMA IF NOT EXISTS public;

SET search_path TO public;

BEGIN;

---

-- 0. HÀM DÙNG CHUNG: tự cập nhật updated_at (tương đương auto_now=True)

---

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 0.1 ENUM TYPES
-- ---------------------------------------------------------------------
-- Hiệu lực văn bản / tài liệu: thống nhất 1 ENUM duy nhất dùng chung cho cả Văn bản và Tài liệu lưu trữ
CREATE TYPE hieu_luc_status       AS ENUM ('CON_HIEU_LUC', 'CON_HIEU_LUC_1_PHAN', 'HET_HIEU_LUC', 'HET_VA_THAY_THE');
-- [REMOVED] hoso_status ENUM — đã xóa theo yêu cầu Nhóm 3 (Thịnh Trương): cột trang_thai chưa được duyệt.
CREATE TYPE chitiettailieu_hienthi AS ENUM ('TAT_CA','NOI_BO_PHONG_BAN');

CREATE TYPE signing_process_status AS ENUM ('DRAFT','HOAT_DONG','NGUNG');

CREATE TYPE signing_scope          AS ENUM ('DEPARTMENT','COMPANY');

-- [6c] Bỏ ENUM signing_kieuky: không cột nào dùng; cách thức ký toàn yêu cầu đã bỏ (cấp luôn tuần tự).

CREATE TYPE signing_request_status AS ENUM ('NHAP','CHO_KY','HOAN_THANH','TU_CHOI','HUY','QUA_HAN');

CREATE TYPE signing_attempt_status AS ENUM ('DRAFT','CHO_KY','YEU_CAU_SUA','HOAN_THANH','TU_CHOI','HUY','QUA_HAN');

CREATE TYPE signing_step_status    AS ENUM ('CHO_KY','DA_KY','TU_CHOI','BO_QUA','YEU_CAU_SUA','THU_HOI');


CREATE TYPE signing_verify_status  AS ENUM ('CHUA_XAC_MINH','HOP_LE','KHONG_HOP_LE');

CREATE TYPE signing_manifest_status AS ENUM ('DRAFT','FINAL');

CREATE TYPE signing_thread_status  AS ENUM ('OPEN','RELEASED','RESOLVED');

CREATE TYPE signing_notify_channel AS ENUM ('IN_APP','EMAIL');

CREATE TYPE signing_notify_status  AS ENUM ('CHO_GUI','DA_GUI','THAT_BAI');

CREATE TYPE task_vaitro            AS ENUM ('CHU_TRI','CHI_DAO','THAM_GIA');

CREATE TYPE task_attachment_loai   AS ENUM ('GIAO_VIEC','BANG_CHUNG');

CREATE TYPE meetingroom_status     AS ENUM ('AVAILABLE','MAINTENANCE','UNAVAILABLE');

CREATE TYPE meetingbooking_status  AS ENUM ('CONFIRMED','CANCELLED','COMPLETED');

CREATE TYPE birthdaywish_status    AS ENUM ('PENDING','APPROVED','REJECTED');

CREATE TYPE emaillog_status        AS ENUM ('PENDING','SENDING','SUCCESS','FAILED','RETRY');

CREATE TYPE employee_work_status   AS ENUM ('LAM_VIEC','NGHI_VIEC');
-- dùng chung cho generic relation "văn bản liên quan"
CREATE TYPE document_kind          AS ENUM ('vanbanden','vanbandi'); -- [BỎ MẬT] bỏ 'vanbanmat'

-- =====================================================================
-- 12. DANH MỤC CHỨC VỤ (accounts_position)
-- =====================================================================
CREATE TABLE accounts_position (
    id BIGSERIAL PRIMARY KEY,
    display_order INTEGER NOT NULL UNIQUE, -- STT ưu tiên hiển thị, tự động = MAX+1
    name VARCHAR(255) NOT NULL, -- Tên chức vụ
    is_public BOOLEAN NOT NULL DEFAULT TRUE, -- Hiển thị (isPublic)
    note TEXT
);

-- =====================================================================
-- 11. CƠ CẤU TỔ CHỨC: KHỐI/KHU VỰC (Cấp 1) + ĐƠN VỊ, PHÒNG BAN (Cấp 2)
-- =====================================================================
CREATE TABLE organizations_khoi (
    id BIGSERIAL PRIMARY KEY,
    ten VARCHAR(255) NOT NULL, -- Tên khối/khu vực
    thu_tu_hien_thi INTEGER NOT NULL DEFAULT 0 -- Thứ tự hiển thị
);

CREATE TABLE organizations_donvi (
    id BIGSERIAL PRIMARY KEY,
    khoi_id BIGINT NOT NULL REFERENCES organizations_khoi (id) ON DELETE RESTRICT,
    stt_uu_tien INTEGER NOT NULL UNIQUE, -- tự động = MAX + 1
    ten VARCHAR(255) NOT NULL, -- Tên đơn vị/phòng ban
    dia_chi VARCHAR(255),
    dien_thoai VARCHAR(20),
    email VARCHAR(254),
    is_public BOOLEAN NOT NULL DEFAULT TRUE, -- isPublic
    ghi_chu TEXT
);

CREATE INDEX idx_donvi_khoi ON organizations_donvi (khoi_id);

-- =====================================================================
-- 15. NHÓM QUYỀN & QUYỀN THAO TÁC (auth_group / auth_permission)
-- RBAC độc lập, kế thừa quy ước Django Auth và mở rộng module_ten phục vụ quản trị/phân nhóm quyền
-- =====================================================================
CREATE TABLE auth_group (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    ma_nhom_quyen VARCHAR(50) UNIQUE -- vd: TP -> Trưởng phòng (mã nhóm mở rộng)
);

CREATE TABLE auth_permission (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- vd: Xem chi tiết văn bản đến
    content_type_id BIGINT, -- Tương thích quy ước Django Auth; để NULL trong DDL vì hệ thống dùng RBAC độc lập, không phụ thuộc django_content_type
    codename VARCHAR(100) NOT NULL UNIQUE, -- vd: view_vanbanden
    module_ten VARCHAR(150) NOT NULL -- Module áp dụng phục vụ gom nhóm trực tiếp trên UI
);

CREATE TABLE auth_group_permissions (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES auth_group (id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES auth_permission (id) ON DELETE CASCADE,
    CONSTRAINT uq_auth_group_permission UNIQUE (group_id, permission_id)
);

-- =====================================================================
-- 14. CÁN BỘ NHÂN VIÊN (accounts_employee) — kiêm Custom User Model Django
-- Đã bổ sung is_active, is_staff, is_superuser theo góp ý của Tô Thanh Tân
-- =====================================================================
CREATE TABLE accounts_employee (
    id BIGSERIAL PRIMARY KEY,
    ho_ten VARCHAR(150) NOT NULL, -- Họ và tên
    ngay_sinh DATE NOT NULL, -- UI ẩn năm sinh trừ Admin
    chuc_vu_id BIGINT NOT NULL REFERENCES accounts_position (id) ON DELETE RESTRICT,
    chuc_danh VARCHAR(150), -- Chức danh (tự do, khác Chức vụ)
    email VARCHAR(254) UNIQUE,
    sdt VARCHAR(20), -- SĐT cá nhân / SĐT bàn
    don_vi_id BIGINT NOT NULL REFERENCES organizations_donvi (id) ON DELETE RESTRICT,
    username VARCHAR(150) NOT NULL UNIQUE, -- auto = local-part email
    password VARCHAR(255) NOT NULL, -- lưu hash (vd pbkdf2/argon2), KHÔNG lưu plaintext
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- Cờ khóa tài khoản nhân viên nghỉ việc (chuẩn Django)
    is_staff BOOLEAN NOT NULL DEFAULT FALSE, -- Quyền đăng nhập trang quản trị
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE, -- Quyền quản trị tối cao
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    trang_thai employee_work_status NOT NULL DEFAULT 'LAM_VIEC',
    ghi_chu TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_employee_updated_at BEFORE UPDATE ON accounts_employee
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_employee_donvi ON accounts_employee (don_vi_id);

CREATE INDEX idx_employee_chucvu ON accounts_employee (chuc_vu_id);

CREATE INDEX idx_employee_is_active ON accounts_employee (is_active);

-- Nhóm quyền của CBNV (FK/M2M -> auth_group, tương đương auth_user_groups trong Django)
CREATE TABLE accounts_employee_groups (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL REFERENCES auth_group (id) ON DELETE CASCADE,
    CONSTRAINT uq_employee_group UNIQUE (employee_id, group_id)
);

-- Quyền cá nhân trực tiếp của CBNV (FK/M2M -> auth_permission, tương đương auth_user_user_permissions trong Django)
CREATE TABLE accounts_employee_user_permissions (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES auth_permission (id) ON DELETE CASCADE,
    CONSTRAINT uq_employee_permission UNIQUE (employee_id, permission_id)
);

-- Ghi chú: spec mới (tab "Đvị, phòngban") không có trường "Trưởng đơn vị"
-- trên organizations_donvi -> không tạo cột manager_id.

-- =====================================================================
-- 4. DANH MỤC HỒ SƠ (records_hoso)
-- Đã tinh gọn & nâng cấp theo review của Nhóm 3 (Thịnh Trương):
--   - Xóa 6 trường chưa duyệt: don_vi, trang_thai, thoi_han_bao_quan,
--     ngay_dong, ngay_nop_luu, is_default.
--   - FK nguoi_lap_id → settings.AUTH_USER_MODEL (ON DELETE RESTRICT
--     tương đương on_delete=PROTECT trong Django).
--   - stt_uu_tien: số nguyên dương, UNIQUE, tự động MAX+1 qua trigger,
--     có xử lý chống trùng đồng thời (advisory lock).
--   - is_he_thong: cờ nhận diện Hồ sơ chung / bản ghi hệ thống, có trigger
--     BEFORE DELETE chống xóa.
--   - Partial unique index: đảm bảo duy nhất 1 Hồ sơ hệ thống (Hồ sơ chung).
--   - Bổ sung chỉ mục tìm kiếm: so_ky_hieu, ten_ho_so, ngay_lap, nguoi_lap_id.
-- =====================================================================
CREATE TABLE records_hoso (
    id BIGSERIAL PRIMARY KEY,
    stt_uu_tien INTEGER NOT NULL UNIQUE CHECK (stt_uu_tien > 0),
    so_ky_hieu VARCHAR(255) NOT NULL UNIQUE CHECK (BTRIM (so_ky_hieu) <> ''),
    ten_ho_so VARCHAR(255) NOT NULL CHECK (BTRIM (ten_ho_so) <> ''),
    nguoi_lap_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    ngay_lap TIMESTAMPTZ,
    ghi_chu TEXT,
    is_he_thong BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial index: đảm bảo duy nhất 1 bản ghi Hồ sơ hệ thống (Hồ sơ chung)
CREATE UNIQUE INDEX uq_records_hoso_he_thong ON records_hoso (is_he_thong)
WHERE
    is_he_thong = TRUE;

-- Chỉ mục tìm kiếm cho records_hoso (Đã loại bỏ idx_hoso_so_ky_hieu thừa do trùng với UNIQUE constraint)
CREATE INDEX idx_hoso_ten ON records_hoso (ten_ho_so);

CREATE INDEX idx_hoso_ngay_lap ON records_hoso (ngay_lap);

CREATE INDEX idx_hoso_nguoi_lap ON records_hoso (nguoi_lap_id);

CREATE TRIGGER trg_hoso_updated_at BEFORE UPDATE ON records_hoso
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger tự động gán stt_uu_tien = MAX + 1 khi INSERT (nếu chưa cung cấp hoặc = 0)
-- Sử dụng advisory lock để chống race condition khi nhiều request đồng thời.
CREATE OR REPLACE FUNCTION auto_stt_uu_tien_hoso()
RETURNS TRIGGER AS
$$

BEGIN
IF NEW.stt_uu_tien IS NULL OR NEW.stt_uu_tien = 0 THEN
-- Advisory lock trên OID của bảng để serialize việc tính MAX
PERFORM pg_advisory_xact_lock('records_hoso'::regclass::oid::bigint);
NEW.stt_uu_tien := COALESCE(
(SELECT MAX(stt_uu_tien) FROM records_hoso), 0
) + 1;
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_hoso_auto_stt BEFORE INSERT ON records_hoso
  FOR EACH ROW EXECUTE FUNCTION auto_stt_uu_tien_hoso();

-- Trigger chống xóa Hồ sơ chung / bản ghi hệ thống
CREATE OR REPLACE FUNCTION prevent_delete_he_thong_hoso()
RETURNS TRIGGER AS
$$

BEGIN
IF OLD.is_he_thong = TRUE THEN
RAISE EXCEPTION 'Không thể xóa Hồ sơ chung / bản ghi hệ thống (records_hoso id=%).', OLD.id;
END IF;
RETURN OLD;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_hoso_prevent_delete BEFORE DELETE ON records_hoso
  FOR EACH ROW EXECUTE FUNCTION prevent_delete_he_thong_hoso();

-- Trigger bảo vệ tuyệt đối Hồ sơ chung: Chặn lách luật tắt cờ is_he_thong từ TRUE sang FALSE
CREATE OR REPLACE FUNCTION prevent_update_he_thong_hoso()
RETURNS TRIGGER AS
$$

BEGIN
IF OLD.is_he_thong = TRUE AND NEW.is_he_thong = FALSE THEN
RAISE EXCEPTION 'Bảo toàn Hồ sơ hệ thống: Không thể gỡ bỏ cờ is_he_thong từ TRUE sang FALSE (records_hoso id=%).', OLD.id;
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_hoso_prevent_update_he_thong BEFORE UPDATE ON records_hoso
  FOR EACH ROW EXECUTE FUNCTION prevent_update_he_thong_hoso();

-- =====================================================================
-- 5. LOẠI VĂN BẢN (records_loaivanban)
-- Giữ đúng 7 trường đã duyệt bởi Nhóm 3 (Thịnh Trương).
-- Không thêm stt_uu_tien — STT hiển thị trên UI là forloop.counter.
-- FK ho_so_id theo chuẩn Django _id convention.
-- Ràng buộc chống trùng tên Loại văn bản trong cùng một Hồ sơ (không phân biệt hoa/thường, khoảng trắng thừa).
-- Bổ sung CHECK (BTRIM(ten_loai) <> '') chống chuỗi rỗng và khoảng trắng thừa.
-- =====================================================================
CREATE TABLE records_loaivanban (
    id BIGSERIAL PRIMARY KEY,
    ho_so_id BIGINT NOT NULL REFERENCES records_hoso (id) ON DELETE RESTRICT,
    ten_loai VARCHAR(255) NOT NULL CHECK (BTRIM (ten_loai) <> ''),
    ngay_lap TIMESTAMPTZ,
    ghi_chu TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_loaivanban_updated_at BEFORE UPDATE ON records_loaivanban
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Ràng buộc không cho trùng tên Loại văn bản trong cùng một Hồ sơ (xử lý chữ hoa/thường và khoảng trắng thừa)
CREATE UNIQUE INDEX uq_records_loaivanban_hoso_ten ON records_loaivanban (
    ho_so_id,
    LOWER(TRIM(ten_loai))
);

-- Chỉ mục tìm kiếm cho records_loaivanban
CREATE INDEX idx_loaivanban_hoso ON records_loaivanban (ho_so_id);

CREATE INDEX idx_loaivanban_ten ON records_loaivanban (ten_loai);

CREATE INDEX idx_loaivanban_ngay_lap ON records_loaivanban (ngay_lap);

-- =====================================================================
-- 6. DANH MỤC TÀI LIỆU CẤP 1 (records_tailieu)
-- =====================================================================
CREATE TABLE records_tailieu (
    id BIGSERIAL PRIMARY KEY,
    stt_uu_tien SMALLINT NOT NULL UNIQUE,
    ky_hieu VARCHAR(255),
    ten_tai_lieu VARCHAR(255) NOT NULL,
    nguoi_lap_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    ngay_lap DATE,
    ghi_chu TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tailieu_updated_at BEFORE UPDATE ON records_tailieu
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- 7. LOẠI TÀI LIỆU CẤP 2 (records_loaitailieu)
-- =====================================================================
CREATE TABLE records_loaitailieu (
    id BIGSERIAL PRIMARY KEY,
    dm_tai_lieu BIGINT NOT NULL REFERENCES records_tailieu (id) ON DELETE RESTRICT,
    ten_loai VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    ngay_lap TIMESTAMPTZ,
    ghi_chu TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_loaitailieu_updated_at BEFORE UPDATE ON records_loaitailieu
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- 8. CHI TIẾT TÀI LIỆU (records_chitiettailieu)
-- =====================================================================
CREATE TABLE records_chitiettailieu (
    id BIGSERIAL PRIMARY KEY,
    dm_tai_lieu BIGINT NOT NULL REFERENCES records_tailieu (id) ON DELETE RESTRICT,
    ky_hieu VARCHAR(255),
    tieu_de VARCHAR(255) NOT NULL,
    ngay_dang DATE NOT NULL,
    noi_ban_hanh VARCHAR(255),
    hieu_luc hieu_luc_status NOT NULL,
    ngay_het_hieu_luc DATE,
    link_thay_the VARCHAR(500),
    ghi_chu TEXT,
    hien_thi chitiettailieu_hienthi NOT NULL,
    don_vi_id BIGINT REFERENCES organizations_donvi (id) ON DELETE RESTRICT, -- [v1] Đơn vị sở hữu; phục vụ lọc NOI_BO_PHONG_BAN (Nhóm 4, Nhóm 8)
    nguoi_tao_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_chitiettailieu_updated_at BEFORE UPDATE ON records_chitiettailieu
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_chitiettailieu_don_vi ON records_chitiettailieu (don_vi_id);

-- Loại tài liệu cấp 2 áp dụng cho chi tiết tài liệu (M2M, lọc theo dm_tai_lieu đã chọn)
CREATE TABLE records_chitiettailieu_loaitailieu (
    chitiettailieu_id BIGINT NOT NULL REFERENCES records_chitiettailieu (id) ON DELETE CASCADE,
    loaitailieu_id BIGINT NOT NULL REFERENCES records_loaitailieu (id) ON DELETE RESTRICT,
    PRIMARY KEY (
        chitiettailieu_id,
        loaitailieu_id
    )
);

-- Tệp đính kèm Chi tiết tài liệu (1-N, Hướng A theo Thầy Duy chốt)
CREATE TABLE records_chitiettailieu_attachment (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES records_chitiettailieu (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Tên gốc file khi upload
    path VARCHAR(500) NOT NULL, -- Đường dẫn lưu file trên server/storage
    file_size BIGINT CHECK (file_size >= 0), -- [v1] Dung lượng (byte); NULL với bản ghi cũ (Nhóm 4)
    mime_type VARCHAR(255), -- [v1] Kiểu MIME; NULL với bản ghi cũ (Nhóm 4)
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Cờ xóa mềm
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL
);

CREATE INDEX idx_chitiettailieu_attachment_doc ON records_chitiettailieu_attachment (document_id);

CREATE INDEX idx_chitiettailieu_attachment_deleted ON records_chitiettailieu_attachment (is_deleted);

-- =====================================================================
-- 1. VĂN BẢN ĐẾN (documents_vanbanden)
-- =====================================================================
CREATE TABLE documents_vanbanden (
    id BIGSERIAL PRIMARY KEY,
    nam SMALLINT NOT NULL,
    so_hieu VARCHAR(255) NOT NULL,
    so_thu_tu INTEGER NOT NULL, -- Số đến (auto increment theo nghiệp vụ, xử lý ở tầng app)
    ngay_den TIMESTAMPTZ NOT NULL,
    trich_yeu TEXT NOT NULL,
    noi_ban_hanh VARCHAR(500),
    ngay_van_ban TIMESTAMPTZ,
    nguoi_ky VARCHAR(255),
    chuc_vu VARCHAR(255),
    hieu_luc hieu_luc_status NOT NULL,
    ngay_het_hieu_luc TIMESTAMPTZ,
    link_thay_the VARCHAR(500),
    ghi_chu TEXT,
    hien_thi BOOLEAN NOT NULL DEFAULT TRUE,
    gui_mail_toan_he_thong BOOLEAN NOT NULL DEFAULT FALSE,
    pham_vi VARCHAR(20) NOT NULL DEFAULT 'NOI_BO', -- [BỎ MẬT] NOI_BO | HAN_CHE
    nguoi_tao_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_vanbanden_nam_stt UNIQUE (nam, so_thu_tu), -- Nghị định 30/2020/NĐ-CP: chống trùng số đến trong năm
    CONSTRAINT chk_vanbanden_link_thay_the CHECK (
        hieu_luc <> 'HET_VA_THAY_THE' OR (link_thay_the IS NOT NULL AND BTRIM(link_thay_the) <> '')
    ),
    -- [BỎ MẬT] Phạm vi xem: HAN_CHE chỉ người tạo, người nhận, đơn vị nhận được xem (tầng ứng dụng)
    CONSTRAINT chk_vanbanden_pham_vi CHECK (pham_vi IN ('NOI_BO', 'HAN_CHE')),
    -- [BỎ MẬT] Văn bản hạn chế không được gửi mail toàn hệ thống (thay CHECK B2 của bảng mật cũ)
    CONSTRAINT chk_vanbanden_han_che_khong_mail_toan_he_thong CHECK (pham_vi <> 'HAN_CHE' OR gui_mail_toan_he_thong = FALSE)
);

CREATE TRIGGER trg_vanbanden_updated_at BEFORE UPDATE ON documents_vanbanden
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_vanbanden_sohieu ON documents_vanbanden (so_hieu);

CREATE INDEX idx_vanbanden_nam ON documents_vanbanden (nam);

CREATE TABLE documents_vanbanden_hoso (
    vanbanden_id BIGINT NOT NULL REFERENCES documents_vanbanden (id) ON DELETE CASCADE,
    hoso_id BIGINT NOT NULL REFERENCES records_hoso (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbanden_id, hoso_id)
);

CREATE INDEX idx_vanbanden_hoso_hoso ON documents_vanbanden_hoso (hoso_id);

CREATE TABLE documents_vanbanden_danhmuc (
    vanbanden_id BIGINT NOT NULL REFERENCES documents_vanbanden (id) ON DELETE CASCADE,
    loaivanban_id BIGINT NOT NULL REFERENCES records_loaivanban (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbanden_id, loaivanban_id)
);

CREATE INDEX idx_vanbanden_danhmuc_loai ON documents_vanbanden_danhmuc (loaivanban_id);

-- Toàn vẹn tham chiếu chéo giữa Hồ sơ và Loại văn bản cho Văn bản đến:
-- 1) Khi thêm Loại văn bản, nếu văn bản đã liên kết hồ sơ thì Loại văn bản phải thuộc đúng Hồ sơ đó
CREATE OR REPLACE FUNCTION check_vanbanden_cross_reference()
RETURNS TRIGGER AS
$$

DECLARE
v_hoso_id BIGINT;
BEGIN
SELECT ho_so_id INTO v_hoso_id FROM records_loaivanban WHERE id = NEW.loaivanban_id;
IF EXISTS (SELECT 1 FROM documents_vanbanden_hoso WHERE vanbanden_id = NEW.vanbanden_id) THEN
IF NOT EXISTS (
SELECT 1 FROM documents_vanbanden_hoso
WHERE vanbanden_id = NEW.vanbanden_id AND hoso_id = v_hoso_id
) THEN
RAISE EXCEPTION 'Vi phạm toàn vẹn tham chiếu chéo: Loại văn bản (id=%) thuộc Hồ sơ (id=%), nhưng Văn bản đến (id=%) không liên kết với Hồ sơ này.',
NEW.loaivanban_id, v_hoso_id, NEW.vanbanden_id;
END IF;
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_vanbanden_danhmuc_cross_ref
  BEFORE INSERT OR UPDATE ON documents_vanbanden_danhmuc
  FOR EACH ROW EXECUTE FUNCTION check_vanbanden_cross_reference();

-- 2) Khi xóa liên kết hồ sơ, không cho xóa nếu văn bản vẫn còn chứa loại văn bản thuộc hồ sơ đó
-- An toàn khi xóa văn bản cha (ON DELETE CASCADE): bỏ qua kiểm tra nếu văn bản cha không còn tồn tại
CREATE OR REPLACE FUNCTION check_vanbanden_hoso_delete_cross_ref()
RETURNS TRIGGER AS
$$

BEGIN
-- Nếu văn bản cha không còn tồn tại (đang trong luồng ON DELETE CASCADE của documents_vanbanden), bỏ qua không chặn
IF NOT EXISTS (SELECT 1 FROM documents_vanbanden WHERE id = OLD.vanbanden_id) THEN
RETURN OLD;
END IF;

IF EXISTS (
SELECT 1 FROM documents_vanbanden_danhmuc dm
JOIN records_loaivanban lvb ON dm.loaivanban_id = lvb.id
WHERE dm.vanbanden_id = OLD.vanbanden_id AND lvb.ho_so_id = OLD.hoso_id
) THEN
RAISE EXCEPTION 'Không thể gỡ Hồ sơ (id=%) khỏi Văn bản đến (id=%): văn bản vẫn còn chứa Loại văn bản thuộc Hồ sơ này.',
OLD.hoso_id, OLD.vanbanden_id;
END IF;
RETURN OLD;
END;

$$
LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_vanbanden_hoso_del_cross_ref
  AFTER DELETE ON documents_vanbanden_hoso
  DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW EXECUTE FUNCTION check_vanbanden_hoso_delete_cross_ref();

CREATE TABLE documents_vanbanden_donvinhan (
    vanbanden_id BIGINT NOT NULL REFERENCES documents_vanbanden (id) ON DELETE CASCADE,
    donvi_id BIGINT NOT NULL REFERENCES organizations_donvi (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbanden_id, donvi_id)
);

CREATE TABLE documents_vanbanden_nguoinhan (
    vanbanden_id BIGINT NOT NULL REFERENCES documents_vanbanden (id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbanden_id, employee_id)
);

-- Tệp đính kèm Văn bản Đến (1-N, Hướng A theo Thầy Duy chốt)
CREATE TABLE documents_vanbanden_attachment (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents_vanbanden (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Tên gốc file (vd: To_trinh_01.pdf)
    path VARCHAR(500) NOT NULL, -- Đường dẫn lưu file trên server/storage
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Cờ xóa mềm
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL
);

CREATE INDEX idx_vanbanden_attachment_doc ON documents_vanbanden_attachment (document_id);

CREATE INDEX idx_vanbanden_attachment_deleted ON documents_vanbanden_attachment (is_deleted);

-- =====================================================================
-- 2. VĂN BẢN ĐI (documents_vanbandi)
-- Đã đổi tên cột 'so' thành 'so_thu_tu' theo góp ý của Lê Trí Kiệt (Nhóm 2)
-- Đã bỏ cột 'noi_ban_hanh' và chuyển sang bảng M2M documents_vanbandi_noibanhanh
-- =====================================================================
CREATE TABLE documents_vanbandi (
    id BIGSERIAL PRIMARY KEY,
    nam SMALLINT NOT NULL,
    so_hieu VARCHAR(255) NOT NULL, -- (bỏ cột 'kyhieu' trùng lặp — xem ghi chú đầu file)
    so_thu_tu INTEGER NOT NULL, -- Số thứ tự văn bản đi trong năm
    ngay_ban_hanh TIMESTAMPTZ NOT NULL,
    trich_yeu TEXT NOT NULL,
    ngay_van_ban TIMESTAMPTZ NOT NULL,
    nguoi_ky VARCHAR(255),
    chuc_vu VARCHAR(255),
    hieu_luc hieu_luc_status NOT NULL,
    ngay_het_hieu_luc TIMESTAMPTZ,
    link_thay_the VARCHAR(500),
    ghi_chu TEXT,
    hien_thi BOOLEAN NOT NULL DEFAULT TRUE,
    gui_mail_toan_he_thong BOOLEAN NOT NULL DEFAULT FALSE,
    pham_vi VARCHAR(20) NOT NULL DEFAULT 'NOI_BO', -- [BỎ MẬT] NOI_BO | HAN_CHE
    nguoi_tao_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_vanbandi_nam_stt UNIQUE (nam, so_thu_tu), -- Nghị định 30/2020/NĐ-CP: chống trùng số đi trong năm
    CONSTRAINT chk_vanbandi_link_thay_the CHECK (
        hieu_luc <> 'HET_VA_THAY_THE' OR (link_thay_the IS NOT NULL AND BTRIM(link_thay_the) <> '')
    ),
    -- [BỎ MẬT] Phạm vi xem: HAN_CHE chỉ người tạo, người nhận, đơn vị nhận được xem (tầng ứng dụng)
    CONSTRAINT chk_vanbandi_pham_vi CHECK (pham_vi IN ('NOI_BO', 'HAN_CHE')),
    -- [BỎ MẬT] Văn bản hạn chế không được gửi mail toàn hệ thống (thay CHECK B2 của bảng mật cũ)
    CONSTRAINT chk_vanbandi_han_che_khong_mail_toan_he_thong CHECK (pham_vi <> 'HAN_CHE' OR gui_mail_toan_he_thong = FALSE)
);

CREATE TRIGGER trg_vanbandi_updated_at BEFORE UPDATE ON documents_vanbandi
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_vanbandi_sohieu ON documents_vanbandi (so_hieu);

CREATE INDEX idx_vanbandi_nam ON documents_vanbandi (nam);

CREATE TABLE documents_vanbandi_hoso (
    vanbandi_id BIGINT NOT NULL REFERENCES documents_vanbandi (id) ON DELETE CASCADE,
    hoso_id BIGINT NOT NULL REFERENCES records_hoso (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbandi_id, hoso_id)
);

CREATE INDEX idx_vanbandi_hoso_hoso ON documents_vanbandi_hoso (hoso_id);

CREATE TABLE documents_vanbandi_danhmuc (
    vanbandi_id BIGINT NOT NULL REFERENCES documents_vanbandi (id) ON DELETE CASCADE,
    loaivanban_id BIGINT NOT NULL REFERENCES records_loaivanban (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbandi_id, loaivanban_id)
);

CREATE INDEX idx_vanbandi_danhmuc_loai ON documents_vanbandi_danhmuc (loaivanban_id);

-- Toàn vẹn tham chiếu chéo giữa Hồ sơ và Loại văn bản cho Văn bản đi:
-- 1) Khi thêm Loại văn bản, nếu văn bản đã liên kết hồ sơ thì Loại văn bản phải thuộc đúng Hồ sơ đó
CREATE OR REPLACE FUNCTION check_vanbandi_cross_reference()
RETURNS TRIGGER AS
$$

DECLARE
v_hoso_id BIGINT;
BEGIN
SELECT ho_so_id INTO v_hoso_id FROM records_loaivanban WHERE id = NEW.loaivanban_id;
IF EXISTS (SELECT 1 FROM documents_vanbandi_hoso WHERE vanbandi_id = NEW.vanbandi_id) THEN
IF NOT EXISTS (
SELECT 1 FROM documents_vanbandi_hoso
WHERE vanbandi_id = NEW.vanbandi_id AND hoso_id = v_hoso_id
) THEN
RAISE EXCEPTION 'Vi phạm toàn vẹn tham chiếu chéo: Loại văn bản (id=%) thuộc Hồ sơ (id=%), nhưng Văn bản đi (id=%) không liên kết với Hồ sơ này.',
NEW.loaivanban_id, v_hoso_id, NEW.vanbandi_id;
END IF;
END IF;
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_vanbandi_danhmuc_cross_ref
  BEFORE INSERT OR UPDATE ON documents_vanbandi_danhmuc
  FOR EACH ROW EXECUTE FUNCTION check_vanbandi_cross_reference();

-- 2) Khi xóa liên kết hồ sơ, không cho xóa nếu văn bản vẫn còn chứa loại văn bản thuộc hồ sơ đó
-- An toàn khi xóa văn bản cha (ON DELETE CASCADE): bỏ qua kiểm tra nếu văn bản cha không còn tồn tại
CREATE OR REPLACE FUNCTION check_vanbandi_hoso_delete_cross_ref()
RETURNS TRIGGER AS
$$

BEGIN
-- Nếu văn bản cha không còn tồn tại (đang trong luồng ON DELETE CASCADE của documents_vanbandi), bỏ qua không chặn
IF NOT EXISTS (SELECT 1 FROM documents_vanbandi WHERE id = OLD.vanbandi_id) THEN
RETURN OLD;
END IF;

IF EXISTS (
SELECT 1 FROM documents_vanbandi_danhmuc dm
JOIN records_loaivanban lvb ON dm.loaivanban_id = lvb.id
WHERE dm.vanbandi_id = OLD.vanbandi_id AND lvb.ho_so_id = OLD.hoso_id
) THEN
RAISE EXCEPTION 'Không thể gỡ Hồ sơ (id=%) khỏi Văn bản đi (id=%): văn bản vẫn còn chứa Loại văn bản thuộc Hồ sơ này.',
OLD.hoso_id, OLD.vanbandi_id;
END IF;
RETURN OLD;
END;

$$
LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_vanbandi_hoso_del_cross_ref
  AFTER DELETE ON documents_vanbandi_hoso
  DEFERRABLE INITIALLY IMMEDIATE
  FOR EACH ROW EXECUTE FUNCTION check_vanbandi_hoso_delete_cross_ref();

-- Bảng trung gian M2M Nơi ban hành cho Văn bản đi
CREATE TABLE documents_vanbandi_noibanhanh (
    vanbandi_id BIGINT NOT NULL REFERENCES documents_vanbandi (id) ON DELETE CASCADE,
    donvi_id BIGINT NOT NULL REFERENCES organizations_donvi (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbandi_id, donvi_id)
);

CREATE INDEX idx_vanbandi_noibanhanh_donvi ON documents_vanbandi_noibanhanh (donvi_id);

CREATE TABLE documents_vanbandi_donvinhan (
    vanbandi_id BIGINT NOT NULL REFERENCES documents_vanbandi (id) ON DELETE CASCADE,
    donvi_id BIGINT NOT NULL REFERENCES organizations_donvi (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbandi_id, donvi_id)
);

CREATE TABLE documents_vanbandi_nguoinhan (
    vanbandi_id BIGINT NOT NULL REFERENCES documents_vanbandi (id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    PRIMARY KEY (vanbandi_id, employee_id)
);

-- Tệp đính kèm Văn bản Đi (1-N, Hướng A theo Thầy Duy chốt)
CREATE TABLE documents_vanbandi_attachment (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents_vanbandi (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL
);

CREATE INDEX idx_vanbandi_attachment_doc ON documents_vanbandi_attachment (document_id);

CREATE INDEX idx_vanbandi_attachment_deleted ON documents_vanbandi_attachment (is_deleted);

-- =====================================================================
-- 3. [BỎ MẬT] VĂN BẢN MẬT: đã bỏ. Tài liệu nội bộ hạn chế dùng cột pham_vi = 'HAN_CHE'
-- trên documents_vanbanden / documents_vanbandi.
-- =====================================================================

-- =====================================================================
-- BẢNG PHỤ: LỊCH SỬ NGƯỜI XEM (documents_view_log)
-- Dùng chung cho 2 bảng văn bản (Đến/Đi) qua cặp document_type +
-- document_id (generic relation, cùng cơ chế với signing_request/task_congviec).
-- unique_together(document_type, document_id, user_id) -> mỗi user chỉ giữ
-- 1 bản ghi mới nhất trên 1 văn bản (upsert ở tầng app bằng
-- INSERT ... ON CONFLICT (document_type, document_id, user_id)
-- DO UPDATE SET viewed_at = EXCLUDED.viewed_at).
-- =====================================================================
-- Hierarchical document folders (Django documents migrations 0006 and 0007).
CREATE TABLE documents_folder (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT,
    path VARCHAR(1000) NOT NULL,
    depth INTEGER NOT NULL CONSTRAINT documents_folder_depth_check CHECK (depth >= 0),
    "order" INTEGER NOT NULL CONSTRAINT documents_folder_order_check CHECK ("order" >= 0),
    description TEXT NOT NULL,
    is_local BOOLEAN NOT NULL,
    local_path VARCHAR(1000) NOT NULL,
    created_by_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_folder_parent_name UNIQUE (parent_id, name),
    CONSTRAINT fk_documents_folder_parent FOREIGN KEY (parent_id)
        REFERENCES documents_folder (id),
    CONSTRAINT fk_documents_folder_created_by FOREIGN KEY (created_by_id)
        REFERENCES accounts_employee (id)
);

CREATE INDEX idx_folder_parent ON documents_folder (parent_id);
CREATE INDEX idx_folder_path ON documents_folder (path);
CREATE INDEX idx_folder_depth ON documents_folder (depth);

CREATE TABLE documents_folder_file (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL CONSTRAINT documents_folder_file_file_size_check CHECK (file_size >= 0),
    file_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    is_local BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    folder_id BIGINT NOT NULL,
    uploaded_by_id BIGINT,
    CONSTRAINT fk_documents_folder_file_folder FOREIGN KEY (folder_id)
        REFERENCES documents_folder (id),
    CONSTRAINT fk_documents_folder_file_uploaded_by FOREIGN KEY (uploaded_by_id)
        REFERENCES accounts_employee (id)
);

CREATE INDEX idx_folder_file_folder ON documents_folder_file (folder_id);

CREATE TABLE documents_view_log (
    id BIGSERIAL PRIMARY KEY,
    document_type document_kind NOT NULL,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_viewlog_doc_user UNIQUE (
        document_type,
        document_id,
        user_id
    )
);

CREATE INDEX idx_viewlog_document ON documents_view_log (document_type, document_id);

-- Trigger dọn dẹp Log người xem khi xóa văn bản (Tránh bản ghi mồ côi do Generic Relation):
CREATE OR REPLACE FUNCTION trg_cleanup_viewlog_on_doc_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM documents_view_log
    WHERE document_id = OLD.id AND document_type = TG_ARGV[0]::document_kind;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_del_viewlog_vanbanden AFTER DELETE ON documents_vanbanden
    FOR EACH ROW EXECUTE FUNCTION trg_cleanup_viewlog_on_doc_delete('vanbanden');

CREATE TRIGGER trg_del_viewlog_vanbandi AFTER DELETE ON documents_vanbandi
    FOR EACH ROW EXECUTE FUNCTION trg_cleanup_viewlog_on_doc_delete('vanbandi');

-- =====================================================================
-- BẢNG PHỤ: NHẬT KÝ TRUY CẬP VĂN BẢN HẠN CHẾ (documents_access_log)
-- Chỉ ghi cho văn bản pham_vi = 'HAN_CHE'. Chỉ thêm dòng, không ghi đè (WORM), khác documents_view_log
-- (mỗi người một dòng, dùng cho văn bản nội bộ). Không có FK tới văn bản (generic relation, cùng cơ chế
-- documents_view_log); văn bản HAN_CHE không xóa được nên không phát sinh bản ghi mồ côi.
-- hanh_dong: XEM | TAI_FILE | BI_TU_CHOI (bị chặn quyền, API trả 404) | THEM_NGUOI_XEM | BOT_NGUOI_XEM.
-- user_id: tài khoản thực hiện, lấy từ phiên đăng nhập phía máy chủ. doi_tuong_user_id: người bị thêm/bớt.
-- =====================================================================
CREATE TABLE documents_access_log (
    id BIGSERIAL PRIMARY KEY,
    document_type document_kind NOT NULL,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    hanh_dong VARCHAR(20) NOT NULL,
    doi_tuong_user_id BIGINT REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    tep_id BIGINT,
    dia_chi_ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_access_log_hanh_dong CHECK (
        hanh_dong IN ('XEM', 'TAI_FILE', 'BI_TU_CHOI', 'THEM_NGUOI_XEM', 'BOT_NGUOI_XEM')
    ),
    CONSTRAINT chk_access_log_doi_tuong CHECK (
        hanh_dong NOT IN ('THEM_NGUOI_XEM', 'BOT_NGUOI_XEM') OR doi_tuong_user_id IS NOT NULL
    )
);

CREATE INDEX idx_access_log_document ON documents_access_log (document_type, document_id, created_at);
CREATE INDEX idx_access_log_user ON documents_access_log (user_id, created_at);

CREATE OR REPLACE FUNCTION prevent_modify_documents_access_log()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Nhật ký truy cập văn bản hạn chế (documents_access_log id=%) chỉ được thêm, nghiêm cấm sửa hoặc xóa.', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_access_log_immutable
    BEFORE UPDATE OR DELETE ON documents_access_log
    FOR EACH ROW EXECUTE FUNCTION prevent_modify_documents_access_log();

-- MVP: văn bản HAN_CHE không được xóa (chưa có cơ chế xóa mềm); chặn xóa để không mất dấu vết truy cập.
CREATE OR REPLACE FUNCTION prevent_delete_van_ban_han_che()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.pham_vi = 'HAN_CHE' THEN
        RAISE EXCEPTION 'Văn bản hạn chế (id=%) không được xóa.', OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vanbanden_no_hard_delete_han_che BEFORE DELETE ON documents_vanbanden
    FOR EACH ROW EXECUTE FUNCTION prevent_delete_van_ban_han_che();

CREATE TRIGGER trg_vanbandi_no_hard_delete_han_che BEFORE DELETE ON documents_vanbandi
    FOR EACH ROW EXECUTE FUNCTION prevent_delete_van_ban_han_che();

-- pham_vi bất biến sau khi tạo: không cho hạ HAN_CHE xuống NOI_BO (sẽ lộ văn bản cho quyền view_* và trợ lý AI)
-- và không cho nâng NOI_BO lên HAN_CHE (log xem cũ không đủ chi tiết).
CREATE OR REPLACE FUNCTION prevent_change_pham_vi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.pham_vi IS DISTINCT FROM OLD.pham_vi THEN
        RAISE EXCEPTION 'Phạm vi văn bản (id=%) không được đổi sau khi tạo.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vanbanden_pham_vi_bat_bien BEFORE UPDATE OF pham_vi ON documents_vanbanden
    FOR EACH ROW EXECUTE FUNCTION prevent_change_pham_vi();

CREATE TRIGGER trg_vanbandi_pham_vi_bat_bien BEFORE UPDATE OF pham_vi ON documents_vanbandi
    FOR EACH ROW EXECUTE FUNCTION prevent_change_pham_vi();


-- =====================================================================
-- =====================================================================
-- 9. PHÂN HỆ TRÌNH KÝ (signing_*) — ĐỒNG BỘ 100% DJANGO MODEL & CHUẨN HÓA THEO ISSUE #47 (LÊ THANH HẬU & LÊ THÀNH TÀI)
-- Quy mô: 14 bảng vật lý | Khóa ngoại accounts_employee(id), organizations_donvi(id), accounts_position(id)
-- Hỗ trợ đầy đủ: Generic Relation (document_type, document_id), box ký PDF, ủy quyền, outbox nhắc hạn, WORM audit log
-- =====================================================================

-- 9.1. Quy trình trình ký chuẩn mẫu
CREATE TABLE signing_process (
    id BIGSERIAL PRIMARY KEY,
    ma_quy_trinh VARCHAR(50) NOT NULL,
    ten_quy_trinh VARCHAR(255) NOT NULL,
    mo_ta TEXT NOT NULL DEFAULT '',
    phien_ban SMALLINT NOT NULL DEFAULT 1 CHECK (phien_ban >= 0),
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'NHAP',
    pham_vi VARCHAR(20) NOT NULL,
    don_vi_ap_dung_id BIGINT REFERENCES organizations_donvi (id) ON DELETE RESTRICT, -- [P7] bắt buộc khi PHONG_BAN
    -- [6c] Bỏ kieu_ky_mac_dinh: cấp ký luôn tuần tự, song song là nhiều người trong một cấp.
    cau_hinh_nhac_han JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    nguoi_cap_nhat_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    CONSTRAINT uq_signing_process_ma_phien_ban UNIQUE (ma_quy_trinh, phien_ban),
    CONSTRAINT chk_signing_process_don_vi_ap_dung CHECK ( -- [P7]
        (pham_vi = 'PHONG_BAN' AND don_vi_ap_dung_id IS NOT NULL)
        OR (pham_vi = 'CONG_TY' AND don_vi_ap_dung_id IS NULL)
    )
);

CREATE INDEX idx_signing_process_nguoi_tao ON signing_process (nguoi_tao_id);
CREATE INDEX idx_signing_process_don_vi_ap_dung ON signing_process (don_vi_ap_dung_id); -- [P7]
CREATE INDEX idx_signing_process_nguoi_cap_nhat ON signing_process (nguoi_cap_nhat_id);

-- 9.2. Cấp ký trong quy trình mẫu
CREATE TABLE signing_process_step (
    id BIGSERIAL PRIMARY KEY,
    quy_trinh_id BIGINT NOT NULL REFERENCES signing_process (id) ON DELETE CASCADE,
    cap_ky SMALLINT NOT NULL CHECK (cap_ky >= 0),
    ten_cap_ky VARCHAR(255) NOT NULL,
    thu_tu SMALLINT NOT NULL CHECK (thu_tu >= 0),
    don_vi_id BIGINT REFERENCES organizations_donvi (id) ON DELETE SET NULL,
    so_gio_xu_ly INTEGER CHECK (so_gio_xu_ly >= 0),
    dang_ap_dung BOOLEAN NOT NULL DEFAULT true,
    ghi_chu TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_signing_process_step_thu_tu UNIQUE (quy_trinh_id, thu_tu)
);

CREATE INDEX idx_signing_process_step_quytrinh ON signing_process_step (quy_trinh_id);

-- 9.3. Danh sách người ký cấu hình sẵn cho cấp ký
-- Issue #47 P1.7: đổi nguoi_ky_id và chuc_vu_id từ SET NULL sang RESTRICT để tránh vi phạm CHECK một-trong-hai khi xóa
CREATE TABLE signing_process_step_signer (
    id BIGSERIAL PRIMARY KEY,
    buoc_quy_trinh_id BIGINT NOT NULL REFERENCES signing_process_step (id) ON DELETE CASCADE,
    nguoi_ky_id BIGINT REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    chuc_vu_id BIGINT REFERENCES accounts_position (id) ON DELETE RESTRICT,
    pham_vi_chuc_vu VARCHAR(20), -- [P7] DON_VI_NGUOI_TAO | DON_VI_CO_DINH | TOAN_CO_QUAN; chỉ dùng khi cấu hình theo chức vụ
    vai_tro_ky VARCHAR(20) NOT NULL DEFAULT 'KY_CHINH',
    chan_ky_chinh BOOLEAN NOT NULL DEFAULT true,
    thu_tu SMALLINT NOT NULL CHECK (thu_tu >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_signing_process_step_signer_mot_doi_tuong CHECK (
        (chuc_vu_id IS NULL AND nguoi_ky_id IS NOT NULL) OR
        (chuc_vu_id IS NOT NULL AND nguoi_ky_id IS NULL)
    )
);

CREATE INDEX idx_signing_process_step_signer_buoc ON signing_process_step_signer (buoc_quy_trinh_id);
CREATE INDEX idx_signing_process_step_signer_nguoi ON signing_process_step_signer (nguoi_ky_id);

-- 9.4. Phiếu yêu cầu trình ký
-- Issue #47 P0.1: Bổ sung document_type document_kind NOT NULL và index (document_type, document_id)
-- Issue #47 P1.9: Cho phép NULL ở phien_ban_van_ban, vi_tri_luu_tep, ma_bam_tai_lieu khi tạo bản nháp
-- Issue #47 P2.12: Bổ sung index signing_request (han_chot)
CREATE TABLE signing_request (
    id BIGSERIAL PRIMARY KEY,
    document_type document_kind, -- [VBTK] Văn bản đi gắn với hồ sơ (Generic Relation); NULL khi văn bản trình ký nhập tay
    document_id BIGINT, -- [VBTK] NULL cùng document_type
    phien_ban_van_ban VARCHAR(50), -- Cho phép NULL ở bản nháp ban đầu
    vi_tri_luu_tep VARCHAR(500), -- Cho phép NULL ở bản nháp ban đầu
    ma_bam_tai_lieu VARCHAR(64), -- Cho phép NULL ở bản nháp ban đầu
    quy_trinh_id BIGINT NOT NULL REFERENCES signing_process (id) ON DELETE RESTRICT,
    phien_ban_quy_trinh SMALLINT NOT NULL CHECK (phien_ban_quy_trinh >= 0),
    -- [6c] Bỏ kieu_ky: cấp ký luôn tuần tự (không còn cách thức ký áp dụng cho toàn yêu cầu).
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'NHAP',
    han_chot TIMESTAMPTZ,
    ngay_gui TIMESTAMPTZ,
    ngay_hoan_thanh TIMESTAMPTZ,
    ngay_tu_choi TIMESTAMPTZ,
    ly_do_tu_choi TEXT NOT NULL DEFAULT '',
    ngay_huy TIMESTAMPTZ,
    ly_do_huy TEXT NOT NULL DEFAULT '',
    ghi_chu TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    nguoi_cap_nhat_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    ho_so_goc_id BIGINT REFERENCES signing_request (id) ON DELETE RESTRICT, -- [P7] trình lại sau từ chối trỏ về hồ sơ gốc
    so_hieu_van_ban VARCHAR(100) NOT NULL DEFAULT '', -- [VBTK] số hiệu văn bản trình ký nhập tay (tùy chọn)
    trich_yeu_van_ban TEXT NOT NULL DEFAULT '', -- [VBTK] trích yếu văn bản trình ký nhập tay
    CONSTRAINT chk_signing_request_ma_bam_sha256 CHECK (ma_bam_tai_lieu IS NULL OR ma_bam_tai_lieu ~ '^[0-9a-f]{64}$'),
    CONSTRAINT chk_signing_request_van_ban CHECK ((document_type IS NOT NULL AND document_id IS NOT NULL) OR (document_type IS NULL AND document_id IS NULL AND trich_yeu_van_ban <> ''))
);

CREATE INDEX idx_signing_request_document ON signing_request (document_type, document_id);
CREATE INDEX idx_signing_request_trang_thai ON signing_request (trang_thai);
CREATE INDEX idx_signing_request_nguoi_tao ON signing_request (nguoi_tao_id);
CREATE INDEX idx_signing_request_quy_trinh ON signing_request (quy_trinh_id);
CREATE INDEX idx_signing_request_nguoi_cap_nhat ON signing_request (nguoi_cap_nhat_id);
CREATE INDEX idx_signing_request_hanchot ON signing_request (han_chot); -- Issue #47 P2.12
CREATE INDEX idx_signing_request_ho_so_goc ON signing_request (ho_so_goc_id); -- [P7]

-- 9.5. Lượt trình ký (mỗi lần nộp lại tài liệu sinh 1 lượt mới)
-- Issue #47 P1.9: Cho phép NULL ở phien_ban_van_ban; GIỮ NOT NULL cho vi_tri_luu_tep và ma_bam_tai_lieu
CREATE TABLE signing_attempt (
    id BIGSERIAL PRIMARY KEY,
    trinh_ky_id BIGINT NOT NULL REFERENCES signing_request (id) ON DELETE RESTRICT,
    so_luot SMALLINT NOT NULL CHECK (so_luot >= 0),
    phien_ban_van_ban VARCHAR(50), -- Cho phép NULL ở bản nháp ban đầu
    vi_tri_luu_tep VARCHAR(500) NOT NULL, -- Bắt buộc có tệp tài liệu cho lượt trình
    ma_bam_tai_lieu VARCHAR(64) NOT NULL, -- Bắt buộc có mã băm SHA-256
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'NHAP',
    ly_do TEXT NOT NULL DEFAULT '',
    khoa_chong_trung VARCHAR(255) UNIQUE,
    thoi_diem_gui TIMESTAMPTZ,
    thoi_diem_hoan_thanh TIMESTAMPTZ,
    thoi_diem_tu_choi TIMESTAMPTZ,
    thoi_diem_huy TIMESTAMPTZ,
    vi_tri_tep_hoan_tat VARCHAR(500) NOT NULL DEFAULT '',
    ma_bam_tep_hoan_tat VARCHAR(64) NOT NULL DEFAULT '',
    trang_thai_tep_hoan_tat VARCHAR(20), -- [P10] DANG_XU_LY | LOI | THANH_CONG; NULL khi lượt chưa hoàn thành
    loi_tep_hoan_tat VARCHAR(100) NOT NULL DEFAULT '', -- [P10] mã lỗi lần tạo tệp hoàn tất gần nhất
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    luot_truoc_id BIGINT REFERENCES signing_attempt (id) ON DELETE RESTRICT,
    nguoi_cap_nhat_id BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    CONSTRAINT uq_signing_attempt_so_luot UNIQUE (trinh_ky_id, so_luot),
    CONSTRAINT chk_signing_attempt_ma_bam_sha256 CHECK (ma_bam_tai_lieu ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_signing_attempt_trinh_ky ON signing_attempt (trinh_ky_id);
CREATE INDEX idx_signing_attempt_nguoi_tao ON signing_attempt (nguoi_tao_id);
CREATE INDEX idx_signing_attempt_luot_truoc ON signing_attempt (luot_truoc_id);
CREATE INDEX idx_signing_attempt_nguoi_cap_nhat ON signing_attempt (nguoi_cap_nhat_id);

-- 9.6. Cấp ký thực tế trong một lượt trình
-- Issue #47 P2.12: Bổ sung index signing_request_step (han_xu_ly)
CREATE TABLE signing_request_step (
    id BIGSERIAL PRIMARY KEY,
    luot_trinh_id BIGINT NOT NULL REFERENCES signing_attempt (id) ON DELETE RESTRICT,
    buoc_quy_trinh_id BIGINT NOT NULL REFERENCES signing_process_step (id) ON DELETE RESTRICT,
    cap_ky SMALLINT NOT NULL CHECK (cap_ky >= 0),
    ten_cap_ky VARCHAR(255) NOT NULL,
    thu_tu SMALLINT NOT NULL CHECK (thu_tu >= 0),
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHUA_MO',
    han_xu_ly TIMESTAMPTZ,
    thoi_diem_mo TIMESTAMPTZ,
    thoi_diem_hoan_thanh TIMESTAMPTZ,
    ghi_chu TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_signing_request_step_thu_tu UNIQUE (luot_trinh_id, thu_tu)
);

CREATE INDEX idx_signing_request_step_buoc_quy_trinh ON signing_request_step (buoc_quy_trinh_id);
CREATE INDEX idx_signing_request_step_luot_trinh ON signing_request_step (luot_trinh_id);
CREATE INDEX idx_signing_request_step_hanxuly ON signing_request_step (han_xu_ly); -- Issue #47 P2.12

-- 9.7. Người ký thực tế trong cấp ký (Tọa độ box ký, ảnh chữ ký, ủy quyền)
-- Issue #47 P1.9: Cho phép NULL ở ten_chuc_vu và khoa_chong_trung_thao_tac khi tạo nháp
CREATE TABLE signing_request_step_signer (
    id BIGSERIAL PRIMARY KEY,
    buoc_ky_id BIGINT NOT NULL REFERENCES signing_request_step (id) ON DELETE RESTRICT,
    nguoi_ky_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    chuc_vu_id BIGINT REFERENCES accounts_position (id) ON DELETE SET NULL,
    ten_nguoi_ky VARCHAR(255) NOT NULL,
    ten_chuc_vu VARCHAR(255), -- Cho phép NULL ở bản nháp ban đầu
    vai_tro_ky VARCHAR(20) NOT NULL,
    chan_ky_chinh BOOLEAN NOT NULL DEFAULT true,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_KY',
    thoi_diem_mo TIMESTAMPTZ,
    ngay_ky TIMESTAMPTZ,
    ngay_tu_choi TIMESTAMPTZ,
    ly_do_tu_choi TEXT NOT NULL DEFAULT '',
    chu_ky_hien_hanh_id BIGINT, -- Khóa ngoại trỏ sang signing_signature thêm sau
    uy_quyen_tu_id BIGINT REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    ly_do_uy_quyen TEXT NOT NULL DEFAULT '',
    ngay_uy_quyen TIMESTAMPTZ,
    trang_ky INTEGER CHECK (trang_ky >= 0),
    toa_do_x NUMERIC(10, 4),
    toa_do_y NUMERIC(10, 4),
    chieu_rong_khung NUMERIC(10, 4),
    chieu_cao_khung NUMERIC(10, 4),
    khoa_chong_trung_thao_tac VARCHAR(255), -- Cho phép NULL ở bản nháp ban đầu
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_signing_request_step_signer_nguoi_ky UNIQUE (buoc_ky_id, nguoi_ky_id),
    CONSTRAINT chk_signing_signer_ly_do_uy_quyen CHECK (uy_quyen_tu_id IS NULL OR NOT (ly_do_uy_quyen = ''))
);

CREATE INDEX idx_signing_request_step_signer_buoc ON signing_request_step_signer (buoc_ky_id);
CREATE INDEX idx_signing_request_step_signer_nguoi ON signing_request_step_signer (nguoi_ky_id);
CREATE INDEX idx_signing_request_step_signer_uy_quyen ON signing_request_step_signer (uy_quyen_tu_id);

-- 9.8. Quản lý Khóa ký số (Zero-Knowledge: Backend tuyệt đối không lưu private key)
CREATE TABLE signing_key (
    id BIGSERIAL PRIMARY KEY,
    nguoi_so_huu_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    ma_khoa VARCHAR(100) NOT NULL UNIQUE,
    dau_van_tay VARCHAR(64) NOT NULL UNIQUE,
    thuat_toan VARCHAR(50) NOT NULL DEFAULT 'Ed25519',
    khoa_cong_khai TEXT NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_KICH_HOAT',
    thoi_diem_xac_minh_so_huu TIMESTAMPTZ,
    thoi_diem_kich_hoat TIMESTAMPTZ,
    ngay_hieu_luc TIMESTAMPTZ NOT NULL,
    ngay_het_han TIMESTAMPTZ,
    ngay_thu_hoi TIMESTAMPTZ,
    ghi_chu TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    khoa_thay_the_id BIGINT REFERENCES signing_key (id) ON DELETE RESTRICT,
    CONSTRAINT chk_signing_key_hoat_dong_da_xac_minh CHECK (
        NOT (trang_thai = 'HOAT_DONG') OR thoi_diem_xac_minh_so_huu IS NOT NULL
    )
);

CREATE UNIQUE INDEX uq_signing_key_mot_khoa_hoat_dong ON signing_key (nguoi_so_huu_id) WHERE (trang_thai = 'HOAT_DONG');
CREATE INDEX idx_signing_key_khoa_thay_the ON signing_key (khoa_thay_the_id);
CREATE INDEX idx_signing_key_nguoi_so_huu ON signing_key (nguoi_so_huu_id);

-- 9.8b. [v1] Mở khóa ký bằng PIN (Nhóm 5, Phase 6a) — bảng trạng thái, được phép UPDATE.
-- Không lưu PIN; chỉ lưu hash verifier và mảnh bí mật máy chủ đã mã hóa. Sự kiện PIN ghi vào signing_audit_log.
CREATE TABLE signing_key_unlock (
    id BIGSERIAL PRIMARY KEY,
    khoa_id BIGINT NOT NULL UNIQUE REFERENCES signing_key (id) ON DELETE CASCADE,
    ma_bam_xac_minh_pin TEXT NOT NULL,
    manh_bi_mat_ma_hoa TEXT NOT NULL,
    tham_so_kdf JSONB NOT NULL,
    so_lan_sai INTEGER NOT NULL DEFAULT 0 CHECK (so_lan_sai >= 0),
    khoa_den TIMESTAMPTZ, -- NULL: không bị khóa
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_signing_key_unlock_updated_at BEFORE UPDATE ON signing_key_unlock
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9.9. Chữ ký số điện tử (Bảo toàn bằng chứng pháp lý — Bất biến không thể sửa/xóa)
-- Issue #47 P0.3: Chặn DELETE và chặn UPDATE mọi cột, CHỈ CHO PHÉP cập nhật trang_thai_xac_minh và thoi_diem_xac_minh
CREATE TABLE signing_signature (
    id BIGSERIAL PRIMARY KEY,
    luot_trinh_id BIGINT NOT NULL REFERENCES signing_attempt (id) ON DELETE RESTRICT,
    buoc_ky_id BIGINT NOT NULL REFERENCES signing_request_step_signer (id) ON DELETE RESTRICT,
    khoa_ky_id BIGINT NOT NULL REFERENCES signing_key (id) ON DELETE RESTRICT,
    hash_tai_lieu VARCHAR(64) NOT NULL,
    thuat_toan VARCHAR(50) NOT NULL,
    chu_ky_so TEXT NOT NULL,
    ghi_chu_ky TEXT NOT NULL DEFAULT '',
    ky_tre_han BOOLEAN NOT NULL DEFAULT false,
    so_giay_tre INTEGER CHECK (so_giay_tre >= 0),
    ngay_ky TIMESTAMPTZ NOT NULL DEFAULT now(),
    trang_thai_xac_minh VARCHAR(20) NOT NULL DEFAULT 'HOP_LE',
    thoi_diem_xac_minh TIMESTAMPTZ,
    vi_tri_anh_chu_ky VARCHAR(500) NOT NULL DEFAULT '',
    ma_bam_anh_chu_ky VARCHAR(64) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_signing_signature_hash_sha256 CHECK (hash_tai_lieu ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_signing_signature_buoc_ky ON signing_signature (buoc_ky_id);
CREATE INDEX idx_signing_signature_khoa_ky ON signing_signature (khoa_ky_id);
CREATE INDEX idx_signing_signature_luot_trinh ON signing_signature (luot_trinh_id);

-- Gắn FK chu_ky_hien_hanh_id trên signing_request_step_signer trỏ tới signing_signature
ALTER TABLE signing_request_step_signer
    ADD CONSTRAINT fk_signer_chu_ky_hien_hanh
    FOREIGN KEY (chu_ky_hien_hanh_id) REFERENCES signing_signature (id) ON DELETE SET NULL;

CREATE INDEX idx_signing_request_step_signer_chuky ON signing_request_step_signer (chu_ky_hien_hanh_id);

-- Trigger bảo vệ chữ ký số: Chặn tuyệt đối xóa chữ ký và chặn sửa đổi (trừ kết quả xác minh)
CREATE OR REPLACE FUNCTION prevent_delete_or_tamper_signing_signature()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Chữ ký số điện tử (signing_signature id=%) là bất biến và không thể xóa khỏi CSDL.', OLD.id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (to_jsonb(OLD) - 'trang_thai_xac_minh' - 'thoi_diem_xac_minh')
           IS DISTINCT FROM
           (to_jsonb(NEW) - 'trang_thai_xac_minh' - 'thoi_diem_xac_minh') THEN
            RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không được phép sửa đổi thông tin cốt lõi của chữ ký số (signing_signature id=%). Chỉ cho phép cập nhật kết quả xác minh.', OLD.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signing_signature_immutable
    BEFORE UPDATE OR DELETE ON signing_signature
    FOR EACH ROW EXECUTE FUNCTION prevent_delete_or_tamper_signing_signature();

-- 9.10. Bằng chứng tổng hợp (Manifest Canonical) của attempt sau khi hoàn tất ký
-- Issue #47 P0.2: Kiểm tra trang_thai = 'DA_CHOT' (hoặc CHOT/FINAL)
-- Issue #47 P0.3: Chặn UPDATE khi DA_CHOT
-- Issue #47 P1.9: Cho phép NULL ở vi_tri_luu khi tạo nháp
CREATE TABLE signing_manifest (
    id BIGSERIAL PRIMARY KEY,
    luot_trinh_id BIGINT NOT NULL REFERENCES signing_attempt (id) ON DELETE RESTRICT,
    phien_ban_bang_chung SMALLINT NOT NULL DEFAULT 1 CHECK (phien_ban_bang_chung >= 0),
    noi_dung_chuan_hoa JSONB NOT NULL,
    ma_bam_bang_chung VARCHAR(64) NOT NULL,
    vi_tri_luu VARCHAR(500), -- Cho phép NULL ở bản nháp ban đầu
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'NHAP',
    thoi_diem_chot TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoi_tao_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    CONSTRAINT chk_signing_manifest_ma_bam_sha256 CHECK (ma_bam_bang_chung ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_signing_manifest_nguoi_tao ON signing_manifest (nguoi_tao_id);
CREATE INDEX idx_signing_manifest_luot_trinh ON signing_manifest (luot_trinh_id);

-- Trigger bảo vệ bằng chứng: Chặn xóa và chặn sửa manifest đã chốt (DA_CHOT / CHOT / FINAL)
CREATE OR REPLACE FUNCTION protect_final_manifest()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.trang_thai IN ('DA_CHOT', 'CHOT', 'FINAL') THEN
            RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không thể xóa manifest số đã chốt (signing_manifest id=%, phien_ban=%).', OLD.id, OLD.phien_ban_bang_chung;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.trang_thai IN ('DA_CHOT', 'CHOT', 'FINAL') THEN
            RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Manifest số đã chốt (DA_CHOT) là bất biến và không thể sửa đổi (signing_manifest id=%).', OLD.id;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signing_manifest_protect
    BEFORE UPDATE OR DELETE ON signing_manifest
    FOR EACH ROW EXECUTE FUNCTION protect_final_manifest();

-- Trigger bảo vệ signing_attempt: Chặn xóa cứng attempt đã kích hoạt hoặc đã có chữ ký/manifest
CREATE OR REPLACE FUNCTION prevent_delete_signing_attempt()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.trang_thai <> 'NHAP' THEN
        RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Không thể xóa lượt trình ký (signing_attempt id=%) đã kích hoạt (trạng thái: %).', OLD.id, OLD.trang_thai;
    END IF;
    IF EXISTS (SELECT 1 FROM signing_manifest WHERE luot_trinh_id = OLD.id) THEN
        RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Lượt trình ký (id=%) đã có manifest số, không thể xóa.', OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signing_attempt_prevent_delete
    BEFORE DELETE ON signing_attempt
    FOR EACH ROW EXECUTE FUNCTION prevent_delete_signing_attempt();

-- 9.11. Luồng yêu cầu chỉnh sửa trong quá trình trình ký
-- Issue #47 P1.6: Đổi ON DELETE CASCADE sang RESTRICT để bảo toàn lịch sử yêu cầu chỉnh sửa
CREATE TABLE signing_change_thread (
    id BIGSERIAL PRIMARY KEY,
    luot_trinh_id BIGINT NOT NULL REFERENCES signing_attempt (id) ON DELETE RESTRICT,
    nguoi_yeu_cau_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    tieu_de VARCHAR(255) NOT NULL,
    ly_do TEXT NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'DANG_MO',
    thoi_diem_giai_quyet TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signing_change_thread_luot_trinh ON signing_change_thread (luot_trinh_id);
CREATE INDEX idx_signing_change_thread_nguoi_yeu_cau ON signing_change_thread (nguoi_yeu_cau_id);

-- 9.12. Tin nhắn trao đổi chỉnh sửa
-- Issue #47 P1.6: Đổi ON DELETE CASCADE sang RESTRICT để bảo toàn lịch sử trao đổi
CREATE TABLE signing_change_message (
    id BIGSERIAL PRIMARY KEY,
    yeu_cau_sua_id BIGINT NOT NULL REFERENCES signing_change_thread (id) ON DELETE RESTRICT,
    nguoi_viet_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    noi_dung TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signing_change_message_nguoi_viet ON signing_change_message (nguoi_viet_id);
CREATE INDEX idx_signing_change_message_yeu_cau_sua ON signing_change_message (yeu_cau_sua_id);

-- 9.13. Nhật ký kiểm toán trình ký (Audit Trail)
-- Issue #47 P0.3: Chặn cả UPDATE và DELETE (chuẩn WORM - Write Once, Read Many)
-- Issue #47 P0.4: Đổi 3 FK sang ON DELETE RESTRICT (tránh UPDATE ngầm sang NULL làm mất dấu vết)
-- Issue #47 P1.8: dia_chi_ip cho phép NULL, bỏ giá trị mặc định '127.0.0.1'
CREATE TABLE signing_audit_log (
    id BIGSERIAL PRIMARY KEY,
    trinh_ky_id BIGINT REFERENCES signing_request (id) ON DELETE RESTRICT,
    luot_trinh_id BIGINT REFERENCES signing_attempt (id) ON DELETE RESTRICT,
    buoc_ky_id BIGINT REFERENCES signing_request_step_signer (id) ON DELETE RESTRICT,
    loai_doi_tuong VARCHAR(50) NOT NULL,
    ma_doi_tuong BIGINT NOT NULL,
    nguoi_thuc_hien_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    hanh_dong VARCHAR(50) NOT NULL,
    trang_thai_truoc VARCHAR(20) NOT NULL DEFAULT '',
    trang_thai_sau VARCHAR(20) NOT NULL DEFAULT '',
    chi_tiet TEXT NOT NULL DEFAULT '',
    du_lieu_kem_theo JSONB,
    dia_chi_ip VARCHAR(45), -- Cho phép NULL, bỏ mặc định 127.0.0.1
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_signing_audit_log_luong_ky_co_trinh_ky CHECK (
        NOT (loai_doi_tuong IN ('signing_request', 'signing_attempt', 'signing_request_step_signer', 'signing_signature')) OR trinh_ky_id IS NOT NULL
    )
);

CREATE INDEX idx_signing_audit_log_luot_trinh ON signing_audit_log (luot_trinh_id);
CREATE INDEX idx_signing_audit_log_nguoi_thuc_hien ON signing_audit_log (nguoi_thuc_hien_id);
CREATE INDEX idx_signing_audit_log_trinh_ky ON signing_audit_log (trinh_ky_id);
CREATE INDEX idx_signing_audit_log_buoc_ky ON signing_audit_log (buoc_ky_id);

-- Trigger bảo vệ nhật ký kiểm toán: WORM (Write Once, Read Many) - Chặn cả UPDATE và DELETE
CREATE OR REPLACE FUNCTION prevent_modify_signing_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Bảo toàn bằng chứng pháp lý: Nhật ký kiểm toán (signing_audit_log id=%) tuân thủ chuẩn WORM, nghiêm cấm mọi hành vi sửa đổi hoặc xóa.', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signing_audit_log_immutable
    BEFORE UPDATE OR DELETE ON signing_audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_modify_signing_audit_log();

-- 9.14. Thông báo trình ký (Outbox nhắc việc & gửi lại)
CREATE TABLE signing_notification (
    id BIGSERIAL PRIMARY KEY,
    trinh_ky_id BIGINT NOT NULL REFERENCES signing_request (id) ON DELETE CASCADE,
    buoc_ky_id BIGINT REFERENCES signing_request_step_signer (id) ON DELETE CASCADE,
    nguoi_nhan_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    kenh VARCHAR(20) NOT NULL,
    loai_thong_bao VARCHAR(50) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_GUI',
    hen_gio_gui TIMESTAMPTZ,
    khoa_chong_gui_trung VARCHAR(255) NOT NULL UNIQUE,
    so_lan_gui_lai INTEGER NOT NULL DEFAULT 0 CHECK (so_lan_gui_lai >= 0),
    thoi_diem_gui TIMESTAMPTZ,
    loi_gui TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signing_notif_outbox ON signing_notification (trang_thai, hen_gio_gui);
CREATE INDEX idx_signing_notification_nguoi_nhan ON signing_notification (nguoi_nhan_id);
CREATE INDEX idx_signing_notification_trinh_ky ON signing_notification (trinh_ky_id);
CREATE INDEX idx_signing_notification_buoc_ky ON signing_notification (buoc_ky_id);

-- =====================================================================
-- 10. QUẢN LÝ CÔNG VIỆC (task_*)
-- =====================================================================
CREATE TABLE task_congviec (
    id BIGSERIAL PRIMARY KEY,
    noi_dung TEXT NOT NULL,
    ngay_tao_cv DATE NOT NULL,
    ngay_xu_ly DATE NOT NULL, -- hạn xử lý
    yeu_cau_xu_ly TEXT NOT NULL,
    nguoi_tao_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    document_type document_kind, -- văn bản liên quan (có thể trống)
    document_id BIGINT,
    hien_thi BOOLEAN NOT NULL DEFAULT TRUE,
    opened_at TIMESTAMPTZ,
    opened_by BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    approved_by BIGINT REFERENCES accounts_employee (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_task_document CHECK (
        (
            document_type IS NULL
            AND document_id IS NULL
        )
        OR (
            document_type IS NOT NULL
            AND document_id IS NOT NULL
        )
    ),
    -- [Nhóm 6] Hạn xử lý không trước ngày tạo (trước đó chỉ kiểm ở tầng ứng dụng)
    CONSTRAINT chk_task_due_after_created CHECK (ngay_xu_ly >= ngay_tao_cv)
);

CREATE TRIGGER trg_congviec_updated_at BEFORE UPDATE ON task_congviec
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Chỉ mục phức hợp hỗ trợ tra cứu công việc theo quan hệ đa hình với văn bản liên quan
CREATE INDEX IF NOT EXISTS idx_task_congviec_document ON task_congviec (document_type, document_id);
-- Trạng thái (Chờ xử lý/Đang xử lý/Chờ duyệt/Hoàn thành/Chưa hoàn thành/Quá hạn)
-- là giá trị TÍNH TOÁN ở tầng ứng dụng dựa trên ngay_xu_ly/opened_at/approved_at,
-- KHÔNG lưu cột riêng — đúng theo ghi chú gốc trong tài liệu.

CREATE TABLE task_participant (
    id BIGSERIAL PRIMARY KEY,
    cong_viec BIGINT NOT NULL REFERENCES task_congviec (id) ON DELETE CASCADE,
    can_bo BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    vai_tro task_vaitro NOT NULL,
    CONSTRAINT uq_task_participant UNIQUE (cong_viec, can_bo),
    CONSTRAINT chk_task_participant_role CHECK (
        vai_tro IN (
            'CHU_TRI',
            'CHI_DAO',
            'THAM_GIA'
        )
    )
);

CREATE INDEX idx_participant_congviec ON task_participant (cong_viec);
-- [Nhóm 6] Mỗi công việc có tối đa một chủ trì (đủ một chủ trì kiểm ở tầng ứng dụng)
CREATE UNIQUE INDEX uq_task_participant_one_host ON task_participant (cong_viec) WHERE vai_tro = 'CHU_TRI';

-- Bảng liên kết Many-to-Many giữa Công việc và Đơn vị/Phòng ban (theo chỉ đạo của GVHD ngày 25/09/2026)
CREATE TABLE task_congviec_donvi (
    id BIGSERIAL PRIMARY KEY,
    cong_viec BIGINT NOT NULL REFERENCES task_congviec (id) ON DELETE CASCADE,
    don_vi BIGINT NOT NULL REFERENCES organizations_donvi (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_task_congviec_donvi UNIQUE (cong_viec, don_vi)
);

CREATE INDEX idx_task_donvi_congviec ON task_congviec_donvi (cong_viec);

CREATE INDEX idx_task_donvi_donvi ON task_congviec_donvi (don_vi);

CREATE TABLE task_comment (
    id BIGSERIAL PRIMARY KEY,
    cong_viec BIGINT NOT NULL REFERENCES task_congviec (id) ON DELETE CASCADE,
    nguoi_ghi BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    noi_dung TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comment_congviec ON task_comment (cong_viec);

-- File bằng chứng hoàn thành và file trong ý kiến (chuẩn hóa 9 cột theo chỉ đạo GVHD & Phan Tạ Hữu Đức Nhóm 6)
CREATE TABLE task_attachment (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                                     -- Tên file gốc người dùng tải lên
    path VARCHAR(500) NOT NULL,                                     -- Đường dẫn lưu file trên máy chủ
    cong_viec_id BIGINT NOT NULL REFERENCES task_congviec (id) ON DELETE CASCADE,
    y_kien_id BIGINT REFERENCES task_comment (id) ON DELETE CASCADE, -- Trống nếu là file giao việc ban đầu
    loai task_attachment_loai NOT NULL,                             -- GIAO_VIEC hoặc BANG_CHUNG hoàn thành
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,                      -- Xóa mềm (soft-delete) theo chuẩn GVHD
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),                -- Thời điểm tải lên
    nguoi_tao_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT, -- Người tải file
    -- [Nhóm 6] File bằng chứng phải gắn một ý kiến; file giao việc ban đầu thì không
    CONSTRAINT chk_task_attachment_evidence CHECK (
        (loai = 'GIAO_VIEC' AND y_kien_id IS NULL)
        OR (loai = 'BANG_CHUNG' AND y_kien_id IS NOT NULL)
    )
);

CREATE INDEX idx_task_attachment_congviec ON task_attachment (cong_viec_id);
CREATE INDEX idx_task_attachment_deleted ON task_attachment (is_deleted);

-- =====================================================================
-- 13. PHÒNG HỌP, SINH NHẬT & NHẬT KÝ EMAIL (meetings_*, birthdays_*)
-- =====================================================================
CREATE TABLE meetings_meetingroom (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    amenities TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE, -- Hiển thị công khai cho CBNV đặt (nếu False chỉ Admin/Lễ tân thấy)
    trang_thai meetingroom_status NOT NULL DEFAULT 'AVAILABLE',
    ghi_chu TEXT, -- Ghi chú thiết bị, hướng dẫn sử dụng
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_meetingroom_updated_at BEFORE UPDATE ON meetings_meetingroom
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE meetings_meetingbooking (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES meetings_meetingroom (id) ON DELETE RESTRICT,
    organizer_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE RESTRICT,
    department_id BIGINT REFERENCES organizations_donvi (id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    attendees_count INTEGER NOT NULL DEFAULT 1 CHECK (attendees_count > 0),
    purpose TEXT,
    trang_thai meetingbooking_status NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_booking_time CHECK (end_time > start_time)
);

CREATE INDEX idx_booking_room_date ON meetings_meetingbooking (room_id, date);
-- Chống trùng lịch cùng phòng cùng khung giờ ở tầng DB (yêu cầu extension btree_gist,
-- có sẵn trong contrib của PostgreSQL — hầu hết managed DB đều cho phép CREATE EXTENSION này).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE meetings_meetingbooking
ADD CONSTRAINT excl_room_time EXCLUDE USING gist (
    room_id
    WITH
        =,
        tsrange (
            date + start_time,
            date + end_time
        )
    WITH
        &&
)
WHERE (trang_thai <> 'CANCELLED');

CREATE TABLE birthdays_birthdaywish (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE CASCADE,
    sender_name VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    card_template VARCHAR(50) NOT NULL DEFAULT 'GOLDEN',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    trang_thai birthdaywish_status NOT NULL DEFAULT 'APPROVED',
    sticker_url VARCHAR(500),
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_birthdaywish_updated_at BEFORE UPDATE ON birthdays_birthdaywish
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_birthdaywish_employee ON birthdays_birthdaywish (employee_id);

CREATE TABLE birthdays_birthdayemaillog (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES accounts_employee (id) ON DELETE CASCADE,
    sent_date DATE NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL,
    recipient_email VARCHAR(254) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    card_template VARCHAR(50) NOT NULL DEFAULT 'GOLDEN',
    trang_thai emaillog_status NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ, -- Hẹn thời điểm thử lại tiếp theo cho Celery worker
    smtp_response_code VARCHAR(50),
    opened_at TIMESTAMPTZ,
    clicked_count INTEGER NOT NULL DEFAULT 0,
    email_provider VARCHAR(50),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_emaillog_employee_date UNIQUE (employee_id, sent_date)
);

CREATE TRIGGER trg_emaillog_updated_at BEFORE UPDATE ON birthdays_birthdayemaillog
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

-- =====================================================================
-- SEED DATA: Cơ cấu tổ chức thực tế (Khối/Khu vực cấp 1 + Đơn vị cấp 2)
-- Nguồn: Mục 11 tài liệu đặc tả — đây là dữ liệu danh mục tổ chức thật
-- của doanh nghiệp, không phải dữ liệu cá nhân/mock, phù hợp để seed.
-- =====================================================================
BEGIN;

-- 1) Chèn các Khối/Khu vực (Cấp 1) — không trùng lặp (Idempotent)
-- thu_tu_hien_thi = vị trí của khối trong danh sách liệt kê (WITH ORDINALITY), không phụ thuộc collation.
INSERT INTO
    organizations_khoi (ten, thu_tu_hien_thi)
SELECT t.khoi, t.vi_tri::INTEGER
FROM unnest(
    ARRAY[
        'HỘI ĐỒNG QUẢN TRỊ',
        'VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ',
        'BAN TỔNG GIÁM ĐỐC',
        'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI',
        'KHỐI KINH DOANH',
        'KHỐI NGHIỆP VỤ',
        'KHỐI HỖ TRỢ',
        'KHỐI QUẢN LÝ RỦI RO',
        'KHỐI TÀI CHÍNH',
        'KHỐI KẾ TOÁN',
        'VĂN PHÒNG 2',
        'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH',
        'KHU VỰC MIỀN BẮC',
        'KHU VỰC MIỀN TRUNG TÂY NGUYÊN',
        'KHU VỰC ĐÔNG NAM BỘ',
        'GIÁM ĐỊNH VÙNG'
    ]
) WITH ORDINALITY AS t (khoi, vi_tri)
WHERE
    NOT EXISTS (
        SELECT 1
        FROM organizations_khoi
    )
ORDER BY t.vi_tri;

-- 2) Chèn Đơn vị/phòng ban (Cấp 2), gán khoi_id theo tên Khối tương ứng
INSERT INTO
    organizations_donvi (khoi_id, ten, stt_uu_tien)
-- stt_uu_tien = vị trí của đơn vị trong danh sách liệt kê (cột vi_tri), không phụ thuộc collation.
SELECT k.id, x.don_vi, x.vi_tri
FROM (
        VALUES (
                'HỘI ĐỒNG QUẢN TRỊ', 'Hội đồng quản trị', 1), (
                'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 2), (
                'VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ', 'Văn phòng hội đồng quản trị', 3), (
                'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 4), (
                'BAN TỔNG GIÁM ĐỐC', 'Giám đốc vùng', 5), (
                'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 6), (
                'KHỐI KINH DOANH', 'Ban khách hàng doanh nghiệp', 7), (
                'KHỐI KINH DOANH', 'Ban khách hàng qua môi giới', 8), (
                'KHỐI KINH DOANH', 'Ban Bancassurance', 9), (
                'KHỐI KINH DOANH', 'Ban khách hàng cá nhân', 10), (
                'KHỐI KINH DOANH', 'Ban chăm sóc khách hàng ĐT', 11), (
                'KHỐI KINH DOANH', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 12), (
                'KHỐI KINH DOANH', 'Ban dự án lớn', 13), (
                'KHỐI KINH DOANH', 'Ban dự án khách hàng qua đại lý', 14), (
                'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm con người', 15), (
                'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm tài sản kỹ thuật', 16), (
                'KHỐI NGHIỆP VỤ', 'Ban tái bảo hiểm', 17), (
                'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm xe cơ giới', 18), (
                'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng', 19), (
                'KHỐI HỖ TRỢ', 'Lãnh đạo khối', 20), (
                'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 21), ('KHỐI HỖ TRỢ', 'Ban nhân sự', 22), ('KHỐI HỖ TRỢ', 'Ban pháp chế', 23), (
                'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 24), (
                'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 25), (
                'KHỐI QUẢN LÝ RỦI RO', 'Ban quản lý rủi ro và tuân thủ', 26), (
                'KHỐI TÀI CHÍNH', 'Ban đầu tư', 27), (
                'KHỐI TÀI CHÍNH', 'Ban tài chính kế hoạch', 28), (
                'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 29), (
                'KHỐI KẾ TOÁN', 'Lãnh đạo khối', 30), ('KHỐI KẾ TOÁN', 'Ban kế toán', 31), ('VĂN PHÒNG 2', 'Văn phòng 2', 32), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Sở giao dịch Bảo Long', 33), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long TP.HCM', 34), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Sài Gòn', 35), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Gia Định', 36), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Bến Thành', 37), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Nam Sài Gòn', 38), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Tân Sơn Nhất', 39), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Sài Gòn', 40), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Phương', 41), (
                'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Trung tâm kinh doanh Thủ Thiêm', 42), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Hà Nội', 43), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Thủ Đô', 44), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Thăng Long', 45), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Nguyên', 46), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Quảng Ninh', 47), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Phòng', 48), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Phú Thọ', 49), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Bắc Ninh', 50), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Dương', 51), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Nam Định', 52), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Vĩnh Phúc', 53), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Hải', 54), (
                'KHU VỰC MIỀN BẮC', 'Sở giao dịch miền Bắc', 55), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Ninh Bình', 56), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Bình', 57), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Đô', 58), (
                'KHU VỰC MIỀN BẮC', 'Bảo Long Thanh Hóa', 59), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long KV Tây Nguyên (Daklak)', 60), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Phú Yên', 61), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Đà Nẵng', 62), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Trung Bộ (Huế)', 63), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bắc Trung Bộ (Nghệ An)', 64), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Khánh Hòa', 65), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Định', 66), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Thuận', 67), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Ngãi', 68), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Gia Lai', 69), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Lâm Đồng', 70), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Bình', 71), (
                'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Trung tâm kinh doanh Sông Hàn', 72), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Bình Dương', 73), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Vũng Tàu', 74), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Nai', 75), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Tây Ninh', 76), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Long An', 77), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cần Thơ', 78), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cà Mau', 79), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Kiên Giang', 80), (
                'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Tháp', 81), (
                'GIÁM ĐỊNH VÙNG', 'Giám định vùng', 82)
    ) AS x (khoi, don_vi, vi_tri)
    JOIN organizations_khoi k ON k.ten = x.khoi
WHERE
    NOT EXISTS (
        SELECT 1
        FROM organizations_donvi
    )
ORDER BY x.vi_tri;

-- 3) Seed 25 Chức vụ chuẩn (STT 1 = cao nhất: 22 chức vụ của đặc tả, giữ "Quản trị viên",
--    "Lãnh đạo cơ quan", "Văn thư" chèn theo cấp bậc) và Tài khoản quản trị hệ thống mẫu
--    (Idempotent, không hard-code ID)
INSERT INTO
    accounts_position (
        display_order,
        name,
        is_public
    )
SELECT x.stt, x.ten, TRUE
FROM (
        VALUES
        (1, 'Quản trị viên'),
        (2, 'Chủ tịch HĐQT'),
        (3, 'Phó Chủ tịch HĐQT'),
        (4, 'Thành viên HĐQT'),
        (5, 'Tổng Giám đốc'),
        (6, 'Lãnh đạo cơ quan'),
        (7, 'Phó Tổng Giám đốc điều hành'),
        (8, 'Phó Tổng Giám đốc kinh doanh'),
        (9, 'Giám đốc Khối'),
        (10, 'Phó Giám đốc Khối'),
        (11, 'Giám đốc Vùng'),
        (12, 'Trợ lý TGĐ'),
        (13, 'Giám đốc'),
        (14, 'Phó Giám đốc'),
        (15, 'Trưởng Ban'),
        (16, 'Phó Ban'),
        (17, 'Trưởng Bộ phận'),
        (18, 'Trưởng nhóm'),
        (19, 'Trưởng phòng'),
        (20, 'Phó phòng'),
        (21, 'Chuyên viên'),
        (22, 'Văn thư'),
        (23, 'Kiểm toán viên'),
        (24, 'Nhân viên'),
        (25, 'Thành viên')
    ) AS x (stt, ten)
WHERE
    NOT EXISTS (
        SELECT 1
        FROM accounts_position p
        WHERE
            p.name = x.ten
    )
ORDER BY x.stt;

-- Đảm bảo có tài khoản quản trị hệ thống mẫu làm nguoi_lap_id nếu chưa có (truy vấn động ID)
INSERT INTO
    accounts_employee (
        username,
        email,
        password,
        ho_ten,
        ngay_sinh,
        chuc_vu_id,
        don_vi_id,
        is_staff,
        is_superuser,
        is_active
    )
SELECT 'admin', 'admin@baolong.vn', '!system_seed_placeholder', 'Quản trị hệ thống', '1990-01-01', (
        SELECT id
        FROM accounts_position
        WHERE
            name = 'Quản trị viên'
        LIMIT 1
    ), COALESCE(
        (
            SELECT id
            FROM organizations_donvi
            WHERE
                ten = 'Ban công nghệ thông tin'
            LIMIT 1
        ), (
            SELECT id
            FROM organizations_donvi
            ORDER BY id
            LIMIT 1
        )
    ), TRUE, TRUE, TRUE
WHERE
    NOT EXISTS (
        SELECT 1
        FROM accounts_employee
        WHERE
            username = 'admin'
    ) ON CONFLICT (username) DO NOTHING;

-- Chèn hoặc cập nhật Hồ sơ chung an toàn, idempotent 100% (không cố định stt_uu_tien = 1 nếu đã bị chiếm)
UPDATE records_hoso
SET
    is_he_thong = TRUE
WHERE
    so_ky_hieu = 'HSC'
    AND is_he_thong = FALSE
    AND NOT EXISTS (
        SELECT 1
        FROM records_hoso
        WHERE
            is_he_thong = TRUE
    );

INSERT INTO
    records_hoso (
        stt_uu_tien,
        so_ky_hieu,
        ten_ho_so,
        nguoi_lap_id,
        is_he_thong,
        ghi_chu
    )
SELECT
    CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM records_hoso
            WHERE
                stt_uu_tien = 1
        ) THEN 1
        ELSE (
            SELECT COALESCE(MAX(stt_uu_tien), 0) + 1
            FROM records_hoso
        )
    END,
    'HSC',
    'Hồ sơ chung',
    (
        SELECT id
        FROM accounts_employee
        WHERE
            username = 'admin'
        LIMIT 1
    ),
    TRUE,
    'Hồ sơ chung mặc định của hệ thống - không được xóa'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM records_hoso
        WHERE
            is_he_thong = TRUE
            OR so_ky_hieu = 'HSC'
    ) ON CONFLICT (so_ky_hieu) DO
UPDATE
SET
    is_he_thong = TRUE;

-- ---------------------------------------------------------------------
-- 4) Seed 7 Nhóm quyền chuẩn (auth_group): 5 nhóm chính và 2 nhóm bổ sung [NQBS]
-- ---------------------------------------------------------------------
INSERT INTO
    auth_group (name, ma_nhom_quyen)
VALUES ('Văn thư', 'VT'),
    ('Chuyên viên', 'CV'),
    ('Trưởng phòng', 'TP'),
    ('Ban Giám đốc', 'BGD'),
    ('Quản trị hệ thống', 'ADMIN'),
    -- [NQBS] Nhóm bổ sung, gán cùng nhóm CV
    ('Trợ lý Ban Giám đốc', 'TLBGD'),
    ('Kiểm toán', 'KT') ON CONFLICT (name) DO
UPDATE
SET
    ma_nhom_quyen = EXCLUDED.ma_nhom_quyen;

-- ---------------------------------------------------------------------
-- 5) Seed 81 Quyền thao tác chi tiết (auth_permission)
-- ---------------------------------------------------------------------
INSERT INTO
    auth_permission (name, codename, module_ten)
VALUES
    -- Đơn vị, phòng ban (Nhóm 7)
    (
        'Xem danh sách đơn vị/phòng ban',
        'view_donvi',
        'Đơn vị, phòng ban'
    ),
    (
        'Thêm đơn vị/phòng ban',
        'add_donvi',
        'Đơn vị, phòng ban'
    ),
    (
        'Sửa đơn vị/phòng ban',
        'change_donvi',
        'Đơn vị, phòng ban'
    ),
    (
        'Xóa đơn vị/phòng ban',
        'delete_donvi',
        'Đơn vị, phòng ban'
    ),
    (
        'Xuất Excel đơn vị/phòng ban',
        'export_donvi',
        'Đơn vị, phòng ban'
    ),
    -- Chức vụ (Nhóm 7)
    (
        'Xem danh sách chức vụ',
        'view_chucvu',
        'Chức vụ'
    ),
    (
        'Thêm chức vụ',
        'add_chucvu',
        'Chức vụ'
    ),
    (
        'Sửa chức vụ',
        'change_chucvu',
        'Chức vụ'
    ),
    (
        'Xóa chức vụ',
        'delete_chucvu',
        'Chức vụ'
    ),
    -- Loại tài liệu biểu mẫu (Nhóm 7)
    (
        'Xem danh sách loại tài liệu',
        'view_loaitailieubieumau',
        'Loại tài liệu biểu mẫu'
    ),
    (
        'Thêm loại tài liệu',
        'add_loaitailieubieumau',
        'Loại tài liệu biểu mẫu'
    ),
    (
        'Sửa loại tài liệu',
        'change_loaitailieubieumau',
        'Loại tài liệu biểu mẫu'
    ),
    (
        'Xóa loại tài liệu',
        'delete_loaitailieubieumau',
        'Loại tài liệu biểu mẫu'
    ),
    -- Cán bộ nhân viên (Nhóm 7)
    (
        'Xem toàn bộ thông tin CBNV (kể cả năm sinh, Nhóm quyền, mật khẩu)',
        'view_full_cbnv',
        'CBNV'
    ),
    (
        'Xem danh sách CBNV (ẩn field nhạy cảm)',
        'view_list_cbnv',
        'CBNV'
    ),
    (
        'Thêm CBNV',
        'add_cbnv',
        'CBNV'
    ),
    (
        'Sửa CBNV (đầy đủ field)',
        'change_full_cbnv',
        'CBNV'
    ),
    (
        'Sửa thông tin cá nhân của chính mình',
        'change_self_cbnv',
        'CBNV'
    ),
    (
        'Xóa CBNV',
        'delete_cbnv',
        'CBNV'
    ),
    (
        'Duyệt yêu cầu đổi mật khẩu',
        'approve_password_reset_cbnv',
        'CBNV'
    ),
    (
        'Import file CBNV',
        'import_cbnv',
        'CBNV'
    ),
    -- Văn bản đến (Nhóm 2)
    (
        'Xem danh sách/chi tiết văn bản đến',
        'view_vanbanden',
        'Văn bản đến'
    ),
    (
        'Thêm văn bản đến',
        'add_vanbanden',
        'Văn bản đến'
    ),
    (
        'Sửa văn bản đến',
        'change_vanbanden',
        'Văn bản đến'
    ),
    (
        'Xóa văn bản đến',
        'delete_vanbanden',
        'Văn bản đến'
    ),
    (
        'Import file văn bản đến',
        'import_vanbanden',
        'Văn bản đến'
    ),
    (
        'Xuất Excel văn bản đến',
        'export_vanbanden',
        'Văn bản đến'
    ),
    (
        'Xem log user đã xem văn bản đến',
        'view_read_log_vanbanden',
        'Văn bản đến'
    ),
    (
        'Gửi mail toàn hệ thống (văn bản đến)',
        'send_mail_all_vanbanden',
        'Văn bản đến'
    ),
    -- Văn bản đi (Nhóm 2)
    (
        'Xem danh sách/chi tiết văn bản đi',
        'view_vanbandi',
        'Văn bản đi'
    ),
    (
        'Thêm văn bản đi',
        'add_vanbandi',
        'Văn bản đi'
    ),
    (
        'Sửa văn bản đi',
        'change_vanbandi',
        'Văn bản đi'
    ),
    (
        'Xóa văn bản đi',
        'delete_vanbandi',
        'Văn bản đi'
    ),
    (
        'Import file văn bản đi',
        'import_vanbandi',
        'Văn bản đi'
    ),
    (
        'Xuất Excel văn bản đi',
        'export_vanbandi',
        'Văn bản đi'
    ),
    (
        'Xem log user đã xem văn bản đi',
        'view_read_log_vanbandi',
        'Văn bản đi'
    ),
    (
        'Gửi mail toàn hệ thống (văn bản đi)',
        'send_mail_all_vanbandi',
        'Văn bản đi'
    ),
    -- Hồ sơ lưu trữ (Nhóm 3)
    (
        'Xem danh mục hồ sơ',
        'view_hoso',
        'Hồ sơ'
    ),
    (
        'Lập/Thêm hồ sơ',
        'add_hoso',
        'Hồ sơ'
    ),
    (
        'Sửa hồ sơ',
        'change_hoso',
        'Hồ sơ'
    ),
    (
        'Xóa hồ sơ',
        'delete_hoso',
        'Hồ sơ'
    ),
    (
        'Mở/Đóng danh mục hồ sơ',
        'toggle_status_hoso',
        'Hồ sơ'
    ),
    (
        'Đưa văn bản vào / loại ra khỏi hồ sơ điện tử',
        'manage_documents_hoso',
        'Hồ sơ'
    ),
    -- Tài liệu, biểu mẫu (Nhóm 4)
    (
        'Xem tài liệu, biểu mẫu',
        'view_tailieu',
        'Tài liệu, biểu mẫu'
    ),
    (
        'Thêm tài liệu, biểu mẫu',
        'add_tailieu',
        'Tài liệu, biểu mẫu'
    ),
    (
        'Sửa tài liệu, biểu mẫu',
        'change_tailieu',
        'Tài liệu, biểu mẫu'
    ),
    (
        'Xóa tài liệu, biểu mẫu',
        'delete_tailieu',
        'Tài liệu, biểu mẫu'
    ),
    -- Trình ký (Nhóm 5 — Cập nhật đầy đủ 8 quyền theo Issue #47)
    (
        'Xem văn bản trình ký',
        'view_trinhky',
        'Trình ký'
    ),
    (
        'Tạo trình ký',
        'add_trinhky',
        'Trình ký'
    ),
    (
        'Ký (đúng lượt trong sơ đồ)',
        'sign_trinhky',
        'Trình ký'
    ),
    (
        'Quản lý quy trình trình ký',
        'manage_signing_process',
        'Trình ký'
    ),
    (
        'Gửi trình ký / Nộp lại lượt trình',
        'send_trinhky',
        'Trình ký'
    ),
    (
        'Ủy quyền ký số',
        'delegate_trinhky',
        'Trình ký'
    ),
    (
        'Hủy yêu cầu trình ký',
        'cancel_trinhky',
        'Trình ký'
    ),
    (
        'Xem nhật ký kiểm toán trình ký',
        'view_signing_audit',
        'Trình ký'
    ),
    -- Quản lý Công việc (Nhóm 6)
    (
        'Xem công việc (chung)',
        'view_congviec',
        'Công việc'
    ),
    (
        'Xem tất cả công việc (toàn hệ thống)',
        'view_all_congviec',
        'Công việc'
    ),
    (
        'Xem công việc theo phòng ban',
        'view_dept_congviec',
        'Công việc'
    ),
    (
        'Thêm/Giao việc',
        'add_congviec',
        'Công việc'
    ),
    (
        'Sửa công việc',
        'change_congviec',
        'Công việc'
    ),
    (
        'Xóa công việc',
        'delete_congviec',
        'Công việc'
    ),
    (
        'Duyệt / Hủy duyệt công việc',
        'approve_congviec',
        'Công việc'
    ),
    -- Phòng họp (Nhóm 7)
    (
        'Xem lịch phòng họp',
        'view_schedule_phonghop',
        'Phòng họp (danh mục)'
    ),
    (
        'Đặt phòng họp',
        'add_datphonghop',
        'Đặt phòng họp'
    ),
    (
        'Sửa/Hủy lịch do chính mình đặt',
        'change_own_datphonghop',
        'Đặt phòng họp'
    ),
    (
        'Sửa/Hủy mọi lịch đặt phòng (QT)',
        'change_any_datphonghop',
        'Đặt phòng họp'
    ),
    -- Sinh nhật (Nhóm 7)
    (
        'Xem danh sách sinh nhật',
        'view_sinhnhat',
        'Sinh nhật'
    ),
    (
        'Gửi lời chúc (thủ công)',
        'send_wish_sinhnhat',
        'Sinh nhật'
    ),
    -- [v1] Quyền bổ sung của Nhóm 7 (Issue #53): trang Phân quyền, import Chức vụ, quản lý danh mục phòng họp
    (
        'Xem danh sách nhóm quyền',
        'view_nhomquyen',
        'Phân quyền'
    ),
    (
        'Thêm nhóm quyền',
        'add_nhomquyen',
        'Phân quyền'
    ),
    (
        'Sửa nhóm quyền',
        'change_nhomquyen',
        'Phân quyền'
    ),
    (
        'Xóa nhóm quyền',
        'delete_nhomquyen',
        'Phân quyền'
    ),
    (
        'Import chức vụ từ Excel',
        'import_chucvu',
        'Chức vụ'
    ),
    (
        'Thêm phòng họp (danh mục)',
        'add_phonghop',
        'Phòng họp (danh mục)'
    ),
    (
        'Sửa phòng họp (danh mục)',
        'change_phonghop',
        'Phòng họp (danh mục)'
    ),
    (
        'Xóa phòng họp (danh mục)',
        'delete_phonghop',
        'Phòng họp (danh mục)'
    ),
    -- Chatbox AI (Nhóm 8)
    (
        'Sử dụng chatbot (chỉ trả lời nội dung người hỏi có quyền Xem)',
        'use_aiassistant',
        'Chatbox AI'
    ) ON CONFLICT (codename) DO
UPDATE
SET
    name = EXCLUDED.name,
    module_ten = EXCLUDED.module_ten;

-- ---------------------------------------------------------------------
-- 6) Seed Mapping Quyền vào Nhóm (auth_group_permissions)
-- Truy vấn động theo codename và ma_nhom_quyen (không hard-code ID)
-- ---------------------------------------------------------------------

-- Nhóm ADMIN: Toàn bộ quyền trong hệ thống
INSERT INTO
    auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM auth_group g
    CROSS JOIN auth_permission p
WHERE
    g.ma_nhom_quyen = 'ADMIN' ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Nhóm BGD (Ban Giám đốc): Toàn quyền xem, ký số, duyệt việc, quản lý lịch họp, sinh nhật, AI
INSERT INTO
    auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM auth_group g, auth_permission p
WHERE
    g.ma_nhom_quyen = 'BGD'
    AND p.codename IN (
        'view_donvi',
        'view_chucvu',
        'view_loaitailieubieumau',
        'view_list_cbnv',
        'change_self_cbnv',
        'view_vanbanden',
        'view_vanbandi',
        'view_read_log_vanbanden',
        'view_read_log_vanbandi',
        'view_hoso',
        'view_tailieu',
        'view_trinhky',
        'add_trinhky',
        'sign_trinhky',
        'send_trinhky',
        'delegate_trinhky',
        'cancel_trinhky',
        'view_signing_audit',
        'view_congviec',
        'view_all_congviec',
        'view_dept_congviec',
        'add_congviec',
        'approve_congviec',
        'view_schedule_phonghop',
        'add_datphonghop',
        'change_own_datphonghop',
        'view_sinhnhat',
        'send_wish_sinhnhat',
        'use_aiassistant'
    ) ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Nhóm TP (Trưởng phòng): Quyền xem, ký duyệt phòng ban, giao việc, xem việc phòng ban, đặt phòng họp, AI
INSERT INTO
    auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM auth_group g, auth_permission p
WHERE
    g.ma_nhom_quyen = 'TP'
    AND p.codename IN (
        'view_donvi',
        'view_chucvu',
        'view_loaitailieubieumau',
        'view_list_cbnv',
        'change_self_cbnv',
        'view_vanbanden',
        'view_vanbandi',
        'view_read_log_vanbanden',
        'view_hoso',
        'view_tailieu',
        'view_trinhky',
        'add_trinhky',
        'sign_trinhky',
        'send_trinhky',
        'delegate_trinhky',
        'cancel_trinhky',
        'manage_signing_process', -- [P7] lãnh đạo đơn vị quản lý quy trình PHONG_BAN
        'view_congviec',
        'view_dept_congviec',
        'add_congviec',
        'change_congviec',
        'approve_congviec',
        'view_schedule_phonghop',
        'add_datphonghop',
        'change_own_datphonghop',
        'view_sinhnhat',
        'send_wish_sinhnhat',
        'use_aiassistant'
    ) ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Nhóm CV (Chuyên viên): Xử lý nghiệp vụ chuyên môn, xem việc phòng ban (view_dept_congviec). Quyền duyệt công việc phân quyền theo ngữ cảnh task_participant (Người tạo, Chủ trì, Chỉ đạo)
INSERT INTO
    auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM auth_group g, auth_permission p
WHERE
    g.ma_nhom_quyen = 'CV'
    AND p.codename IN (
        'view_donvi',
        'view_chucvu',
        'view_loaitailieubieumau',
        'view_list_cbnv',
        'change_self_cbnv',
        'view_vanbanden',
        'view_vanbandi',
        'view_hoso',
        'view_tailieu',
        'view_trinhky',
        'add_trinhky',
        'send_trinhky', -- [CVTK] người tạo hồ sơ tự gửi trình ký
        'view_congviec',
        'view_dept_congviec',
        'add_congviec',
        'change_congviec',
        'view_schedule_phonghop',
        'add_datphonghop',
        'change_own_datphonghop',
        'view_sinhnhat',
        'send_wish_sinhnhat',
        'use_aiassistant'
    ) ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Nhóm VT (Văn thư): Nghiệp vụ văn thư lưu trữ, văn bản đến/đi, quản lý hồ sơ, tài liệu biểu mẫu
INSERT INTO
    auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM auth_group g, auth_permission p
WHERE
    g.ma_nhom_quyen = 'VT'
    AND p.codename IN (
        'view_donvi',
        'view_chucvu',
        'view_loaitailieubieumau',
        'view_list_cbnv',
        'change_self_cbnv',
        'view_vanbanden',
        'add_vanbanden',
        'change_vanbanden',
        'delete_vanbanden',
        'import_vanbanden',
        'export_vanbanden',
        'view_read_log_vanbanden',
        'send_mail_all_vanbanden',
        'view_vanbandi',
        'add_vanbandi',
        'change_vanbandi',
        'delete_vanbandi',
        'import_vanbandi',
        'export_vanbandi',
        'view_read_log_vanbandi',
        'send_mail_all_vanbandi',
        'view_hoso',
        'add_hoso',
        'change_hoso',
        'manage_documents_hoso',
        'toggle_status_hoso',
        'view_tailieu',
        'add_tailieu',
        'change_tailieu',
        'view_trinhky',
        'send_trinhky',
        'add_trinhky',
        'view_congviec',
        'view_dept_congviec',
        'add_congviec',
        'change_congviec',
        'view_schedule_phonghop',
        'add_datphonghop',
        'change_own_datphonghop',
        'view_sinhnhat',
        'send_wish_sinhnhat',
        'use_aiassistant'
    ) ON CONFLICT (group_id, permission_id) DO NOTHING;
-- [NQBS] Nhóm TLBGD (Trợ lý Ban Giám đốc): chỉ chứa quyền cộng thêm, người dùng giữ nhóm CV
INSERT INTO
    auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM auth_group g, auth_permission p
WHERE
    g.ma_nhom_quyen = 'TLBGD'
    AND p.codename IN (
        'view_all_congviec',
        'view_read_log_vanbanden',
        'view_read_log_vanbandi',
        'send_trinhky'
    ) ON CONFLICT (group_id, permission_id) DO NOTHING;
-- [NQBS] Nhóm KT (Kiểm toán): chỉ chứa quyền cộng thêm, người dùng giữ nhóm CV
INSERT INTO
    auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM auth_group g, auth_permission p
WHERE
    g.ma_nhom_quyen = 'KT'
    AND p.codename IN (
        'view_signing_audit',
        'view_read_log_vanbanden',
        'view_read_log_vanbandi'
    ) ON CONFLICT (group_id, permission_id) DO NOTHING;
COMMIT;

-- =====================================================================
-- [v1][BỎ MẬT] TÀI KHOẢN CSDL CHỈ ĐỌC CHO TRỢ LÝ AI (Nhóm 8)
-- - Role được tạo ngoài DDL (kèm mật khẩu từ biến môi trường); khối dưới chỉ cấp quyền khi role đã tồn tại.
-- - Cấp theo bảng/cột cần dùng; KHÔNG cấp bảng khóa ký/PIN/nhật ký, cột password;
--   KHÔNG dùng ALTER DEFAULT PRIVILEGES.
-- - AI chỉ được cấp SELECT trên ai_vanbanden, ai_vanbandi, ai_tailieu.
--   Các view văn bản chỉ trả về NOI_BO đang hiển thị; cột/bảng đính kèm không nằm trong view.
-- - Quyền dùng AI và quyền xem từng loại được kiểm tra ở ứng dụng theo codename.
--   View ai_tailieu tự giới hạn TAT_CA / NOI_BO_PHONG_BAN theo employee_id của phiên DB.
-- =====================================================================
CREATE VIEW ai_vanbanden WITH (security_barrier) AS
    SELECT id, so_hieu, so_thu_tu, nam, ngay_den, trich_yeu, noi_ban_hanh,
           ngay_van_ban, nguoi_ky, chuc_vu, hieu_luc, ngay_het_hieu_luc,
           ghi_chu, updated_at
    FROM documents_vanbanden
    WHERE pham_vi = 'NOI_BO' AND hien_thi IS TRUE;

CREATE VIEW ai_vanbanden_nguoinhan WITH (security_barrier) AS
    SELECT nn.* FROM documents_vanbanden_nguoinhan nn
    JOIN documents_vanbanden vb ON vb.id = nn.vanbanden_id
    WHERE vb.pham_vi = 'NOI_BO' AND vb.hien_thi IS TRUE;

CREATE VIEW ai_vanbanden_donvinhan WITH (security_barrier) AS
    SELECT dv.* FROM documents_vanbanden_donvinhan dv
    JOIN documents_vanbanden vb ON vb.id = dv.vanbanden_id
    WHERE vb.pham_vi = 'NOI_BO' AND vb.hien_thi IS TRUE;

CREATE VIEW ai_vanbandi WITH (security_barrier) AS
    SELECT vb.id, vb.so_hieu, vb.so_thu_tu, vb.nam, vb.ngay_ban_hanh,
           vb.trich_yeu,
           (
               SELECT string_agg(dv.ten, ', ' ORDER BY dv.ten)
               FROM documents_vanbandi_noibanhanh nb
               JOIN organizations_donvi dv ON dv.id = nb.donvi_id
               WHERE nb.vanbandi_id = vb.id
           ) AS noi_ban_hanh,
           vb.ngay_van_ban, vb.nguoi_ky, vb.chuc_vu, vb.hieu_luc,
           vb.ngay_het_hieu_luc, vb.ghi_chu, vb.updated_at
    FROM documents_vanbandi vb
    WHERE vb.pham_vi = 'NOI_BO' AND vb.hien_thi IS TRUE;

CREATE VIEW ai_vanbandi_noibanhanh WITH (security_barrier) AS
    SELECT nb.* FROM documents_vanbandi_noibanhanh nb
    JOIN documents_vanbandi vb ON vb.id = nb.vanbandi_id
    WHERE vb.pham_vi = 'NOI_BO' AND vb.hien_thi IS TRUE;

CREATE VIEW ai_vanbandi_nguoinhan WITH (security_barrier) AS
    SELECT nn.* FROM documents_vanbandi_nguoinhan nn
    JOIN documents_vanbandi vb ON vb.id = nn.vanbandi_id
    WHERE vb.pham_vi = 'NOI_BO' AND vb.hien_thi IS TRUE;

CREATE VIEW ai_vanbandi_donvinhan WITH (security_barrier) AS
    SELECT dv.* FROM documents_vanbandi_donvinhan dv
    JOIN documents_vanbandi vb ON vb.id = dv.vanbandi_id
    WHERE vb.pham_vi = 'NOI_BO' AND vb.hien_thi IS TRUE;

CREATE VIEW ai_tailieu WITH (security_barrier) AS
    SELECT t.id, t.ky_hieu, t.tieu_de, t.ngay_dang, t.noi_ban_hanh,
           t.hieu_luc, t.ngay_het_hieu_luc, t.ghi_chu, t.updated_at
    FROM records_chitiettailieu t
    WHERE t.hien_thi::text = 'TAT_CA'
       OR (
           t.hien_thi::text = 'NOI_BO_PHONG_BAN'
           AND t.don_vi_id = (
               SELECT e.don_vi_id
               FROM accounts_employee e
               WHERE e.id = NULLIF(current_setting('qlvb.employee_id', true), '')::bigint
                 AND e.is_active IS TRUE
                 AND e.trang_thai::text = 'LAM_VIEC'
           )
       );

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qlvb_readonly') THEN
        -- Remove grants from the previous raw-table implementation before
        -- granting the view-only contract.
        REVOKE SELECT (id, don_vi_id, is_active, trang_thai, is_superuser) ON accounts_employee FROM qlvb_readonly;
        REVOKE SELECT (id, ten) ON organizations_donvi FROM qlvb_readonly;
        REVOKE SELECT ON accounts_employee, organizations_donvi, records_chitiettailieu FROM qlvb_readonly;
        REVOKE SELECT ON
            ai_vanbanden_nguoinhan,
            ai_vanbanden_donvinhan,
            ai_vanbandi_noibanhanh,
            ai_vanbandi_nguoinhan,
            ai_vanbandi_donvinhan
        FROM qlvb_readonly;
        GRANT SELECT ON
            ai_vanbanden,
            ai_vanbandi,
            ai_tailieu
        TO qlvb_readonly;
    ELSE
        RAISE NOTICE 'Role qlvb_readonly chưa tồn tại: bỏ qua cấp quyền chỉ đọc cho trợ lý AI';
    END IF;
END
$$;


-- =====================================================================
-- 16. DỮ LIỆU MẪU DÙNG CHUNG NHÓM 7
-- Mật khẩu nhân viên không dùng để đăng nhập; tài khoản demo có mật khẩu plaintext không được nạp.
-- Kiêm nhiệm chưa có quan hệ tương ứng trong schema nên không được nạp.
-- =====================================================================

-- Nạp 491 nhân viên mẫu; mật khẩu được đặt ở trạng thái không thể đăng nhập.
INSERT INTO accounts_employee (
    ho_ten, ngay_sinh, chuc_vu_id, chuc_danh, email, sdt, don_vi_id,
    username, password, is_active, is_staff, is_superuser, is_public,
    trang_thai, ghi_chu
)
SELECT
    source.ho_ten,
    source.ngay_sinh::date,
    position_ref.id,
    source.chuc_danh,
    source.email,
    source.sdt,
    unit.id,
    source.username,
    '!',
    source.trang_thai = 'LAM_VIEC',
    FALSE,
    FALSE,
    source.is_public,
    source.trang_thai::employee_work_status,
    source.ghi_chu
FROM (
    VALUES
    ('binhdd', 'Đặng Đức Bình', '1974-11-23', 'binhdd@example.com', '0533082033', 'HỘI ĐỒNG QUẢN TRỊ', 'Hội đồng quản trị', 'Chủ tịch HĐQT', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('thaopt', 'Phan Thu Thảo', '1980-08-02', 'thaopt@example.com', '0339709152', 'HỘI ĐỒNG QUẢN TRỊ', 'Hội đồng quản trị', 'Phó Chủ tịch HĐQT', NULL, 'LAM_VIEC', TRUE, NULL),
    ('cuonghh', 'Hoàng Hoàng Cường', '1976-02-14', 'cuonghh@example.com', '0393885126', 'HỘI ĐỒNG QUẢN TRỊ', 'Hội đồng quản trị', 'Thành viên HĐQT', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sontd', 'Trần Đức Sơn', '2002-02-03', 'sontd@example.com', '0930151483', 'HỘI ĐỒNG QUẢN TRỊ', 'Hội đồng quản trị', 'Thành viên HĐQT', NULL, 'LAM_VIEC', TRUE, NULL),
    ('cuonglh', 'Lý Hoàng Cường', '1987-01-25', 'cuonglh@example.com', '0905096070', 'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 'Trưởng Ban', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('namdv', 'Đỗ Văn Nam', '1970-01-13', 'namdv@example.com', '0801049900', 'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 'Kiểm toán viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('huongdk', 'Dương Kim Hương', '1970-07-27', 'huongdk@example.com', '0798887445', 'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 'Kiểm toán viên', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('hadt', 'Đỗ Thu Hà', '1973-12-19', 'hadt@example.com', '0927847200', 'VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ', 'Văn phòng hội đồng quản trị', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trungvh', 'Vũ Hữu Trung', '1975-09-19', 'trungvh@example.com', '0882273909', 'VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ', 'Văn phòng hội đồng quản trị', 'Phó phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mybt', 'Bùi Thị My', '1973-02-20', 'mybt@example.com', '0393045698', 'VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ', 'Văn phòng hội đồng quản trị', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('nhunglt', 'Lý Thanh Nhung', '1991-12-13', 'nhunglt@example.com', '0313732665', 'VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ', 'Văn phòng hội đồng quản trị', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungtv', 'Trần Văn Dũng', '1971-07-12', 'dungtv@example.com', '0883720427', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Tổng Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('havd', 'Vũ Diệu Hà', '1969-02-06', 'havd@example.com', '0936887168', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Phó Tổng Giám đốc điều hành', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('khoadv', 'Dương Văn Khoa', '1985-11-19', 'khoadv@example.com', '0984295428', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Phó Tổng Giám đốc kinh doanh', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('maivt', 'Võ Thanh Mai', '1991-05-15', 'maivt@example.com', '0545512926', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Trợ lý TGĐ', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('huongpd', 'Phan Diệu Hương', '1994-06-20', 'huongpd@example.com', '0331956575', 'BAN TỔNG GIÁM ĐỐC', 'Giám đốc vùng', 'Giám đốc Vùng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vydn', 'Đỗ Ngọc Vy', '2002-07-22', 'vydn@example.com', '0870441584', 'BAN TỔNG GIÁM ĐỐC', 'Giám đốc vùng', 'Giám đốc Vùng', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('thaopt2', 'Phạm Thu Thảo', '1986-05-24', 'thaopt2@example.com', '0992210541', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Lãnh đạo cơ quan', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('anpg', 'Phan Gia An', '1980-06-18', 'anpg@example.com', '0715087425', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dunglv', 'Lý Văn Dũng', '1988-10-26', 'dunglv@example.com', '0724553510', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('chaudd', 'Đặng Diệu Châu', '1973-07-24', 'chaudd@example.com', '0561052103', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('phuctt', 'Trần Thành Phúc', '1970-11-14', 'phuctt@example.com', '0852493479', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dunglv2', 'Lý Văn Dũng', '2001-05-24', 'dunglv2@example.com', '0321531007', 'KHỐI KINH DOANH', 'Ban khách hàng doanh nghiệp', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('longpt', 'Phan Thành Long', '1994-02-06', 'longpt@example.com', '0329727265', 'KHỐI KINH DOANH', 'Ban khách hàng doanh nghiệp', 'Phó Ban', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('nhungpt', 'Phan Thị Nhung', '1972-02-02', 'nhungpt@example.com', '0342220135', 'KHỐI KINH DOANH', 'Ban khách hàng doanh nghiệp', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('lanht', 'Hồ Thanh Lan', '1975-12-25', 'lanht@example.com', '0939822400', 'KHỐI KINH DOANH', 'Ban khách hàng doanh nghiệp', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maipk', 'Phan Kim Mai', '1990-09-19', 'maipk@example.com', '0728081864', 'KHỐI KINH DOANH', 'Ban khách hàng doanh nghiệp', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hahb', 'Hoàng Bảo Hà', '1980-11-21', 'hahb@example.com', '0727157565', 'KHỐI KINH DOANH', 'Ban khách hàng doanh nghiệp', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('huongvk', 'Vũ Khánh Hương', '1969-04-09', 'huongvk@example.com', '0860011658', 'KHỐI KINH DOANH', 'Ban khách hàng qua môi giới', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('haivh', 'Vũ Hữu Hải', '1977-05-13', 'haivh@example.com', '0790994423', 'KHỐI KINH DOANH', 'Ban khách hàng qua môi giới', 'Phó Ban', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('hanhnk', 'Nguyễn Khánh Hạnh', '1999-04-25', 'hanhnk@example.com', '0548349563', 'KHỐI KINH DOANH', 'Ban khách hàng qua môi giới', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thaont', 'Nguyễn Thu Thảo', '1970-07-13', 'thaont@example.com', '0994669163', 'KHỐI KINH DOANH', 'Ban khách hàng qua môi giới', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phuongvn', 'Vũ Ngọc Phương', '1974-01-25', 'phuongvn@example.com', '0331517384', 'KHỐI KINH DOANH', 'Ban khách hàng qua môi giới', 'Nhân viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('thaodd', 'Đỗ Diệu Thảo', '1984-11-07', 'thaodd@example.com', '0547972262', 'KHỐI KINH DOANH', 'Ban khách hàng qua môi giới', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('giangdt', 'Đặng Thu Giang', '1978-02-04', 'giangdt@example.com', '0797511932', 'KHỐI KINH DOANH', 'Ban Bancassurance', 'Trưởng Ban', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('dungdd', 'Đặng Diệu Dung', '1999-04-06', 'dungdd@example.com', '0391539433', 'KHỐI KINH DOANH', 'Ban Bancassurance', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maipn', 'Phạm Ngọc Mai', '1986-02-10', 'maipn@example.com', '0719319161', 'KHỐI KINH DOANH', 'Ban Bancassurance', 'Chuyên viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('thangtq', 'Trần Quốc Thắng', '1988-12-01', 'thangtq@example.com', '0307244971', 'KHỐI KINH DOANH', 'Ban Bancassurance', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('longhh', 'Hồ Hữu Long', '1988-04-12', 'longhh@example.com', '0760234741', 'KHỐI KINH DOANH', 'Ban Bancassurance', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('namtt', 'Trần Thành Nam', '1987-04-27', 'namtt@example.com', '0863380077', 'KHỐI KINH DOANH', 'Ban khách hàng cá nhân', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hieuvm', 'Vũ Minh Hiếu', '2000-10-14', 'hieuvm@example.com', '0539222772', 'KHỐI KINH DOANH', 'Ban khách hàng cá nhân', 'Phó Ban', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('myht', 'Hồ Thị My', '1997-09-16', 'myht@example.com', '0537408720', 'KHỐI KINH DOANH', 'Ban khách hàng cá nhân', 'Chuyên viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('huongtn', 'Trần Ngọc Hương', '1997-02-25', 'huongtn@example.com', '0394269099', 'KHỐI KINH DOANH', 'Ban khách hàng cá nhân', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anhht', 'Huỳnh Thị Anh', '1982-03-05', 'anhht@example.com', '0817627406', 'KHỐI KINH DOANH', 'Ban khách hàng cá nhân', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhvb', 'Vũ Bảo Linh', '1989-01-28', 'linhvb@example.com', '0534729025', 'KHỐI KINH DOANH', 'Ban khách hàng cá nhân', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('halt', 'Lê Thị Hà', '1980-08-27', 'halt@example.com', '0562370099', 'KHỐI KINH DOANH', 'Ban chăm sóc khách hàng ĐT', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhlt', 'Lê Thanh Linh', '1995-03-20', 'linhlt@example.com', '0529977402', 'KHỐI KINH DOANH', 'Ban chăm sóc khách hàng ĐT', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hanhnt', 'Nguyễn Thu Hạnh', '1989-10-05', 'hanhnt@example.com', '0347163096', 'KHỐI KINH DOANH', 'Ban chăm sóc khách hàng ĐT', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonld', 'Lý Đức Sơn', '1969-12-14', 'sonld@example.com', '0522607610', 'KHỐI KINH DOANH', 'Ban chăm sóc khách hàng ĐT', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anhht2', 'Hoàng Thu Anh', '1981-02-13', 'anhht2@example.com', '0306867158', 'KHỐI KINH DOANH', 'Ban chăm sóc khách hàng ĐT', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vypk', 'Phạm Khánh Vy', '1978-05-19', 'vypk@example.com', '0800389049', 'KHỐI KINH DOANH', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Trưởng Ban', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('taint', 'Ngô Thành Tài', '1998-04-13', 'taint@example.com', '0319259977', 'KHỐI KINH DOANH', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tainm', 'Ngô Minh Tài', '1998-10-24', 'tainm@example.com', '0927193977', 'KHỐI KINH DOANH', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vynb', 'Ngô Bảo Vy', '1995-01-16', 'vynb@example.com', '0986735028', 'KHỐI KINH DOANH', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonvh', 'Vũ Hoàng Sơn', '1969-09-21', 'sonvh@example.com', '0549682408', 'KHỐI KINH DOANH', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungdv', 'Đặng Văn Dũng', '1989-07-08', 'dungdv@example.com', '0985559966', 'KHỐI KINH DOANH', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('hieunh', 'Ngô Hữu Hiếu', '1986-05-07', 'hieunh@example.com', '0312628731', 'KHỐI KINH DOANH', 'Ban dự án lớn', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phucnt', 'Nguyễn Tuấn Phúc', '1994-08-08', 'phucnt@example.com', '0536275363', 'KHỐI KINH DOANH', 'Ban dự án lớn', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trunglt', 'Lê Tuấn Trung', '1986-11-14', 'trunglt@example.com', '0558780821', 'KHỐI KINH DOANH', 'Ban dự án lớn', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungth', 'Trần Hữu Dũng', '1971-01-11', 'dungth@example.com', '0502902679', 'KHỐI KINH DOANH', 'Ban dự án lớn', 'Nhân viên', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('thangpd', 'Phạm Đức Thắng', '1993-04-25', 'thangpd@example.com', '0518900820', 'KHỐI KINH DOANH', 'Ban dự án lớn', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('oanhlt', 'Lý Thị Oanh', '1985-05-07', 'oanhlt@example.com', '0832207289', 'KHỐI KINH DOANH', 'Ban dự án khách hàng qua đại lý', 'Trưởng Ban', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('myld', 'Lý Diệu My', '1998-06-08', 'myld@example.com', '0820804350', 'KHỐI KINH DOANH', 'Ban dự án khách hàng qua đại lý', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mynt', 'Nguyễn Thanh My', '1994-05-15', 'mynt@example.com', '0521729553', 'KHỐI KINH DOANH', 'Ban dự án khách hàng qua đại lý', 'Chuyên viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('hungnv', 'Ngô Văn Hùng', '1988-01-11', 'hungnv@example.com', '0792553949', 'KHỐI KINH DOANH', 'Ban dự án khách hàng qua đại lý', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhld', 'Lý Diệu Oanh', '1989-12-06', 'oanhld@example.com', '0585679477', 'KHỐI KINH DOANH', 'Ban dự án khách hàng qua đại lý', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thangtt', 'Trần Thành Thắng', '1972-07-07', 'thangtt@example.com', '0751751716', 'KHỐI KINH DOANH', 'Ban dự án khách hàng qua đại lý', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('myvk', 'Võ Kim My', '1983-03-28', 'myvk@example.com', '0856255243', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm con người', 'Trưởng Ban', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('hungdc', 'Đặng Công Hùng', '1975-08-11', 'hungdc@example.com', '0870387763', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm con người', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonth', 'Trần Hữu Sơn', '1989-03-02', 'sonth@example.com', '0303659794', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm con người', 'Chuyên viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('mynt2', 'Ngô Thị My', '1994-03-05', 'mynt2@example.com', '0532002368', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm con người', 'Chuyên viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('vietlv', 'Lý Văn Việt', '1977-06-27', 'vietlv@example.com', '0596231173', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm con người', 'Nhân viên', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('thaott', 'Trần Thanh Thảo', '1978-04-28', 'thaott@example.com', '0970146891', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm con người', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('cuongpg', 'Phan Gia Cường', '1980-02-28', 'cuongpg@example.com', '0751378848', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm tài sản kỹ thuật', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thanglm', 'Lê Minh Thắng', '1983-09-04', 'thanglm@example.com', '0566583076', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm tài sản kỹ thuật', 'Phó Ban', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('binhlh', 'Lý Hữu Bình', '1980-07-27', 'binhlh@example.com', '0981794809', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm tài sản kỹ thuật', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hanhlb', 'Lê Bảo Hạnh', '1994-11-08', 'hanhlb@example.com', '0823918554', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm tài sản kỹ thuật', 'Chuyên viên', NULL, 'NGHI_VIEC', TRUE, 'Nghỉ việc (mẫu)'),
    ('longdv', 'Đặng Văn Long', '1997-01-06', 'longdv@example.com', '0987398196', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm tài sản kỹ thuật', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hungdq', 'Đỗ Quốc Hùng', '1972-12-23', 'hungdq@example.com', '0723449229', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm tài sản kỹ thuật', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('anpv', 'Phan Văn An', '1993-03-12', 'anpv@example.com', '0792783954', 'KHỐI NGHIỆP VỤ', 'Ban tái bảo hiểm', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thangbm', 'Bùi Minh Thắng', '1986-10-15', 'thangbm@example.com', '0545518103', 'KHỐI NGHIỆP VỤ', 'Ban tái bảo hiểm', 'Phó Ban', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('thaobt', 'Bùi Thị Thảo', '1998-11-02', 'thaobt@example.com', '0986586481', 'KHỐI NGHIỆP VỤ', 'Ban tái bảo hiểm', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mydk', 'Đặng Kim My', '1992-05-03', 'mydk@example.com', '0852937572', 'KHỐI NGHIỆP VỤ', 'Ban tái bảo hiểm', 'Chuyên viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('chauvt', 'Võ Thị Châu', '2002-11-14', 'chauvt@example.com', '0784621846', 'KHỐI NGHIỆP VỤ', 'Ban tái bảo hiểm', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anvc', 'Võ Công An', '1986-09-20', 'anvc@example.com', '0313503982', 'KHỐI NGHIỆP VỤ', 'Ban tái bảo hiểm', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('hanhnd', 'Ngô Diệu Hạnh', '1973-08-22', 'hanhnd@example.com', '0883654299', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm xe cơ giới', 'Trưởng Ban', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('phuclm', 'Lê Minh Phúc', '1975-05-07', 'phuclm@example.com', '0713373861', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm xe cơ giới', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhht', 'Huỳnh Thanh Linh', '1976-06-05', 'linhht@example.com', '0850640650', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm xe cơ giới', 'Chuyên viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('longvg', 'Vũ Gia Long', '1990-07-22', 'longvg@example.com', '0919428867', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm xe cơ giới', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('cuonghc', 'Hồ Công Cường', '2002-08-14', 'cuonghc@example.com', '0348625669', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm xe cơ giới', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('binhhd', 'Hoàng Đức Bình', '1975-01-23', 'binhhd@example.com', '0802269663', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm xe cơ giới', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('huongvt', 'Võ Thu Hương', '1971-03-11', 'huongvt@example.com', '0884868858', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonhg', 'Huỳnh Gia Sơn', '1993-10-12', 'sonhg@example.com', '0555818353', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hungpd', 'Phạm Đức Hùng', '1984-08-12', 'hungpd@example.com', '0361656258', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vietlt', 'Lê Thành Việt', '1993-07-11', 'vietlt@example.com', '0971228578', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thaovt', 'Võ Thị Thảo', '1997-10-08', 'thaovt@example.com', '0929320852', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhbd', 'Bùi Diệu Oanh', '1997-08-09', 'oanhbd@example.com', '0946724208', 'KHỐI NGHIỆP VỤ', 'Ban bảo hiểm hàng hải, hàng không, dầu khí, năng lượng', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('hanhlb2', 'Lê Bảo Hạnh', '1977-09-14', 'hanhlb2@example.com', '0311194198', 'KHỐI HỖ TRỢ', 'Lãnh đạo khối', 'Giám đốc Khối', 'Giám đốc khối hỗ trợ', 'LAM_VIEC', TRUE, 'SN_HOM_NAY'),
    ('sonpc', 'Phan Công Sơn', '1992-02-02', 'sonpc@example.com', '0957934538', 'KHỐI HỖ TRỢ', 'Lãnh đạo khối', 'Phó Giám đốc Khối', 'Phó Giám đốc khối hỗ trợ', 'LAM_VIEC', TRUE, NULL),
    ('myvk2', 'Vũ Kim My', '1987-11-04', 'myvk2@example.com', '0977806619', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thaonk', 'Nguyễn Kim Thảo', '1974-12-21', 'thaonk@example.com', '0987673425', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Trưởng Bộ phận', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('myln', 'Lý Ngọc My', '1970-02-07', 'myln@example.com', '0340002538', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('nhungdn', 'Đặng Ngọc Nhung', '1991-01-20', 'nhungdn@example.com', '0714473841', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('anbh', 'Bùi Hữu An', '1972-04-03', 'anbh@example.com', '0539078585', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhhk', 'Hoàng Kim Oanh', '1982-06-09', 'oanhhk@example.com', '0746155023', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhvt', 'Võ Thị Linh', '1986-10-04', 'linhvt@example.com', '0748116935', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trungdv', 'Dương Văn Trung', '1976-02-20', 'trungdv@example.com', '0586668146', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Chuyên viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('linhvd', 'Vũ Diệu Linh', '1996-12-09', 'linhvd@example.com', '0883565418', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('khoapv', 'Phạm Văn Khoa', '1976-01-14', 'khoapv@example.com', '0567555158', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Nhân viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('anhvt', 'Võ Thu Anh', '1973-12-14', 'anhvt@example.com', '0962323125', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vydn2', 'Đặng Ngọc Vy', '1987-09-16', 'vydn2@example.com', '0944217479', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Trưởng Ban', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('longlt', 'Lý Tuấn Long', '1990-12-26', 'longlt@example.com', '0316008576', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Phó Ban', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('cuongpg2', 'Phạm Gia Cường', '1994-11-02', 'cuongpg2@example.com', '0304465753', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Chuyên viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('taidq', 'Dương Quốc Tài', '1981-12-09', 'taidq@example.com', '0575614734', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('ngabt', 'Bùi Thu Nga', '1998-08-14', 'ngabt@example.com', '0947823474', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhnt', 'Nguyễn Thanh Linh', '1982-03-01', 'linhnt@example.com', '0791977049', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('ngaht', 'Huỳnh Thị Nga', '2000-04-26', 'ngaht@example.com', '0399477807', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vietpq', 'Phạm Quốc Việt', '1970-01-02', 'vietpq@example.com', '0525402485', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Phó Ban', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('demo_admin', 'Hồ Thu Giang', '1994-04-17', 'demo_admin@example.com', '0731323462', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Quản trị viên', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('haipd', 'Phan Đức Hải', '1970-09-11', 'haipd@example.com', '0832511038', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Trưởng nhóm', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hanp', 'Nguyễn Phương Hà', '1991-07-17', 'hanp@example.com', '0359626455', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('lanhp', 'Hoàng Phương Lan', '1970-06-15', 'lanhp@example.com', '0577999476', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thanghd', 'Hoàng Đức Thắng', '2000-06-20', 'thanghd@example.com', '0931473705', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('cuongpc', 'Phạm Công Cường', '1968-07-09', 'cuongpc@example.com', '0934800744', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tranghk', 'Hồ Kim Trang', '1975-05-26', 'tranghk@example.com', '0857739169', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maihd', 'Hoàng Diệu Mai', '1995-05-22', 'maihd@example.com', '0965835206', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anhvn', 'Vũ Ngọc Anh', '1973-10-21', 'anhvn@example.com', '0800188983', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Chuyên viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('andd', 'Dương Đức An', '1979-02-26', 'andd@example.com', '0529689335', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maivm', 'Võ Mai Mai', '1998-11-03', 'maivm@example.com', '0354203885', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('dungnn', 'Ngô Ngọc Dung', '1995-02-28', 'dungnn@example.com', '0381011098', 'KHỐI QUẢN LÝ RỦI RO', 'Ban quản lý rủi ro và tuân thủ', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mynp', 'Nguyễn Phương My', '1973-07-03', 'mynp@example.com', '0828949809', 'KHỐI QUẢN LÝ RỦI RO', 'Ban quản lý rủi ro và tuân thủ', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trungld', 'Lý Đức Trung', '1976-01-15', 'trungld@example.com', '0779157707', 'KHỐI QUẢN LÝ RỦI RO', 'Ban quản lý rủi ro và tuân thủ', 'Chuyên viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('quynhhd', 'Hoàng Diệu Quỳnh', '1972-09-16', 'quynhhd@example.com', '0542670470', 'KHỐI QUẢN LÝ RỦI RO', 'Ban quản lý rủi ro và tuân thủ', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phuongdd', 'Dương Diệu Phương', '1995-04-09', 'phuongdd@example.com', '0712980922', 'KHỐI QUẢN LÝ RỦI RO', 'Ban quản lý rủi ro và tuân thủ', 'Nhân viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('tulc', 'Lê Công Tú', '1975-06-28', 'tulc@example.com', '0854569831', 'KHỐI QUẢN LÝ RỦI RO', 'Ban quản lý rủi ro và tuân thủ', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('tudt', 'Đỗ Tuấn Tú', '1996-02-19', 'tudt@example.com', '0544621361', 'KHỐI TÀI CHÍNH', 'Ban đầu tư', 'Trưởng Ban', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('thangdv', 'Đỗ Văn Thắng', '1969-02-23', 'thangdv@example.com', '0588690689', 'KHỐI TÀI CHÍNH', 'Ban đầu tư', 'Chuyên viên', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('ngadt', 'Dương Thanh Nga', '1980-04-14', 'ngadt@example.com', '0877722064', 'KHỐI TÀI CHÍNH', 'Ban đầu tư', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhhn', 'Huỳnh Ngọc Oanh', '1991-04-01', 'oanhhn@example.com', '0585315270', 'KHỐI TÀI CHÍNH', 'Ban đầu tư', 'Nhân viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('quynhvt', 'Võ Thu Quỳnh', '1988-09-24', 'quynhvt@example.com', '0871070403', 'KHỐI TÀI CHÍNH', 'Ban đầu tư', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('lannd', 'Ngô Diệu Lan', '1969-07-22', 'lannd@example.com', '0552995801', 'KHỐI TÀI CHÍNH', 'Ban tài chính kế hoạch', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungnb', 'Ngô Bảo Dung', '2002-10-20', 'dungnb@example.com', '0902996589', 'KHỐI TÀI CHÍNH', 'Ban tài chính kế hoạch', 'Phó Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('nhungpt2', 'Phạm Thu Nhung', '1997-11-22', 'nhungpt2@example.com', '0362571128', 'KHỐI TÀI CHÍNH', 'Ban tài chính kế hoạch', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tubh', 'Bùi Hoàng Tú', '1994-08-04', 'tubh@example.com', '0749576238', 'KHỐI TÀI CHÍNH', 'Ban tài chính kế hoạch', 'Chuyên viên', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('haipt', 'Phan Tuấn Hải', '1973-11-01', 'haipt@example.com', '0527366819', 'KHỐI TÀI CHÍNH', 'Ban tài chính kế hoạch', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('huongvb', 'Vũ Bảo Hương', '2000-12-12', 'huongvb@example.com', '0806865327', 'KHỐI TÀI CHÍNH', 'Ban tài chính kế hoạch', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vietdm', 'Đặng Minh Việt', '1975-03-03', 'vietdm@example.com', '0544853280', 'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 'Trưởng Ban', NULL, 'LAM_VIEC', TRUE, NULL),
    ('uyenpt', 'Phan Thị Uyên', '1998-09-13', 'uyenpt@example.com', '0784536736', 'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 'Trưởng nhóm', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hailh', 'Lê Hoàng Hải', '1980-02-13', 'hailh@example.com', '0363087767', 'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 'Thành viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thaovk', 'Võ Kim Thảo', '1970-09-09', 'thaovk@example.com', '0917338353', 'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 'Thành viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('taihv', 'Huỳnh Văn Tài', '1972-12-23', 'taihv@example.com', '0945077392', 'KHỐI KẾ TOÁN', 'Lãnh đạo khối', 'Giám đốc Khối', 'Giám đốc khối kế toán', 'LAM_VIEC', TRUE, NULL),
    ('huongdb', 'Đặng Bảo Hương', '1986-09-14', 'huongdb@example.com', '0954419420', 'KHỐI KẾ TOÁN', 'Lãnh đạo khối', 'Phó Giám đốc Khối', 'Phó Giám đốc khối kế toán', 'LAM_VIEC', TRUE, NULL),
    ('hapm', 'Phan Mai Hà', '2001-05-14', 'hapm@example.com', '0520154547', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Trưởng Ban', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('oanhnk', 'Ngô Kim Oanh', '1970-05-02', 'oanhnk@example.com', '0858193572', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maitp', 'Trần Phương Mai', '1975-02-17', 'maitp@example.com', '0939806227', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonng', 'Nguyễn Gia Sơn', '1990-09-27', 'sonng@example.com', '0575646313', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Nhân viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('mytt', 'Trần Thanh My', '1984-07-10', 'mytt@example.com', '0859696336', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('chaudk', 'Đỗ Khánh Châu', '1970-02-28', 'chaudk@example.com', '0716574250', 'VĂN PHÒNG 2', 'Văn phòng 2', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhlt2', 'Lê Thanh Oanh', '2001-06-01', 'oanhlt2@example.com', '0846786294', 'VĂN PHÒNG 2', 'Văn phòng 2', 'Phó phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vinhnt', 'Nguyễn Thành Vinh', '1992-12-02', 'vinhnt@example.com', '0501923946', 'VĂN PHÒNG 2', 'Văn phòng 2', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('nhungpk', 'Phạm Khánh Nhung', '1976-11-03', 'nhungpk@example.com', '0318029191', 'VĂN PHÒNG 2', 'Văn phòng 2', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phuchh', 'Hồ Hoàng Phúc', '1986-05-26', 'phuchh@example.com', '0541341112', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Sở giao dịch Bảo Long', 'Giám đốc', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('anlt', 'Lý Tuấn An', '1976-11-19', 'anlt@example.com', '0755649401', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Sở giao dịch Bảo Long', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('annt', 'Nguyễn Tuấn An', '1993-05-28', 'annt@example.com', '0575666594', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Sở giao dịch Bảo Long', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('cuongbc', 'Bùi Công Cường', '1991-12-08', 'cuongbc@example.com', '0590470090', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Sở giao dịch Bảo Long', 'Chuyên viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('nhungvd', 'Vũ Diệu Nhung', '1982-06-18', 'nhungvd@example.com', '0540903991', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Sở giao dịch Bảo Long', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hungnt', 'Nguyễn Thành Hùng', '1980-11-18', 'hungnt@example.com', '0343610288', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Sở giao dịch Bảo Long', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, 'SN_HOM_NAY'),
    ('oanhvt', 'Vũ Thanh Oanh', '2000-07-02', 'oanhvt@example.com', '0809216447', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long TP.HCM', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phuongbk', 'Bùi Khánh Phương', '1971-07-11', 'phuongbk@example.com', '0963002441', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long TP.HCM', 'Trưởng phòng', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('huongvn', 'Vũ Ngọc Hương', '1977-04-07', 'huongvn@example.com', '0333046013', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long TP.HCM', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('chautk', 'Trần Khánh Châu', '1974-04-04', 'chautk@example.com', '0818866214', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long TP.HCM', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, 'SN_TUAN_NAY'),
    ('oanhln', 'Lý Ngọc Oanh', '1985-10-14', 'oanhln@example.com', '0896463745', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long TP.HCM', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('dungvd', 'Võ Đức Dũng', '1968-11-13', 'dungvd@example.com', '0910099399', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Sài Gòn', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('datbc', 'Bùi Công Đạt', '1979-01-20', 'datbc@example.com', '0526271575', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Sài Gòn', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anpm', 'Phan Minh An', '1978-12-16', 'anpm@example.com', '0350802180', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Sài Gòn', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('quantt', 'Trần Thành Quân', '1984-07-02', 'quantt@example.com', '0333966431', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Sài Gòn', 'Chuyên viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('phuonght', 'Hồ Thị Phương', '1984-08-22', 'phuonght@example.com', '0349381282', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Sài Gòn', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hant', 'Nguyễn Thanh Hà', '1974-08-01', 'hant@example.com', '0983684070', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Sài Gòn', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('dungnq', 'Ngô Quốc Dũng', '1987-08-07', 'dungnq@example.com', '0959085385', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Gia Định', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vyhd', 'Hoàng Diệu Vy', '1974-02-11', 'vyhd@example.com', '0980940252', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Gia Định', 'Trưởng phòng', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('havt', 'Vũ Thu Hà', '1995-02-26', 'havt@example.com', '0306121819', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Gia Định', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungnh', 'Nguyễn Hữu Dũng', '1986-11-16', 'dungnh@example.com', '0907619349', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Gia Định', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trangtt', 'Trần Thu Trang', '1968-08-09', 'trangtt@example.com', '0841917777', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Gia Định', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('halt2', 'Lê Thanh Hà', '1996-03-12', 'halt2@example.com', '0952851158', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Bến Thành', 'Giám đốc', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('annh', 'Nguyễn Hoàng An', '1985-02-20', 'annh@example.com', '0708102075', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Bến Thành', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('namlc', 'Lý Công Nam', '1973-12-28', 'namlc@example.com', '0376885979', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Bến Thành', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('haihh', 'Huỳnh Hữu Hải', '1991-05-27', 'haihh@example.com', '0358415390', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Bến Thành', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('taidv', 'Đặng Văn Tài', '2000-03-02', 'taidv@example.com', '0361367138', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Bến Thành', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('ngank', 'Nguyễn Khánh Nga', '1985-02-16', 'ngank@example.com', '0563487204', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Nam Sài Gòn', 'Giám đốc', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('mytk', 'Trần Khánh My', '1980-10-07', 'mytk@example.com', '0304534479', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Nam Sài Gòn', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tudh', 'Dương Hoàng Tú', '1998-05-02', 'tudh@example.com', '0822906412', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Nam Sài Gòn', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhvk', 'Võ Khánh Oanh', '1999-05-05', 'oanhvk@example.com', '0345272413', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Nam Sài Gòn', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('quanvt', 'Võ Thành Quân', '1988-03-09', 'quanvt@example.com', '0758519829', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Nam Sài Gòn', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('longvq', 'Võ Quốc Long', '1971-12-05', 'longvq@example.com', '0976546573', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Tân Sơn Nhất', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('haivc', 'Võ Công Hải', '1971-05-02', 'haivc@example.com', '0992922660', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Tân Sơn Nhất', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maidt', 'Đặng Thị Mai', '1973-03-24', 'maidt@example.com', '0745680467', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Tân Sơn Nhất', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('quynhvk', 'Vũ Kim Quỳnh', '1996-08-03', 'quynhvk@example.com', '0999466282', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Tân Sơn Nhất', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('landt', 'Dương Thu Lan', '1973-03-11', 'landt@example.com', '0903817545', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Tân Sơn Nhất', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thangdc', 'Đỗ Công Thắng', '1983-12-07', 'thangdc@example.com', '0388594310', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Tân Sơn Nhất', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vietdq', 'Đặng Quốc Việt', '1969-02-09', 'vietdq@example.com', '0335947808', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Sài Gòn', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vinhdv', 'Dương Văn Vinh', '1977-05-24', 'vinhdv@example.com', '0854089406', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Sài Gòn', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vyvn', 'Vũ Ngọc Vy', '1970-07-16', 'vyvn@example.com', '0893028256', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Sài Gòn', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungdt', 'Đỗ Thành Dũng', '1997-05-06', 'dungdt@example.com', '0334375388', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Sài Gòn', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anng', 'Ngô Gia An', '2000-05-18', 'anng@example.com', '0857297804', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Sài Gòn', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vydt', 'Dương Thu Vy', '1978-08-25', 'vydt@example.com', '0941066939', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Sài Gòn', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('phuongbk2', 'Bùi Khánh Phương', '1979-06-12', 'phuongbk2@example.com', '0328482989', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Phương', 'Giám đốc', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('mylm', 'Lý Mai My', '2002-11-10', 'mylm@example.com', '0799876958', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Phương', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phuonghk', 'Hồ Kim Phương', '1997-08-19', 'phuonghk@example.com', '0591147065', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Phương', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('nhungdd', 'Đỗ Diệu Nhung', '1976-10-27', 'nhungdd@example.com', '0543625445', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Phương', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('cuonghg', 'Huỳnh Gia Cường', '1996-05-05', 'cuonghg@example.com', '0732443964', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Phương', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('havt2', 'Vũ Thanh Hà', '2001-01-04', 'havt2@example.com', '0545303158', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Bảo Long Đông Phương', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('linhlb', 'Lê Bảo Linh', '1968-09-11', 'linhlb@example.com', '0979294364', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Trung tâm kinh doanh Thủ Thiêm', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhbp', 'Bùi Phương Oanh', '1969-07-15', 'oanhbp@example.com', '0756382833', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Trung tâm kinh doanh Thủ Thiêm', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hadb', 'Dương Bảo Hà', '1969-07-23', 'hadb@example.com', '0543247752', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Trung tâm kinh doanh Thủ Thiêm', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('quanht', 'Huỳnh Thành Quân', '1987-04-22', 'quanht@example.com', '0934006322', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Trung tâm kinh doanh Thủ Thiêm', 'Nhân viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('tranghn', 'Hoàng Ngọc Trang', '1992-07-22', 'tranghn@example.com', '0517514976', 'KHU VỰC THÀNH PHỐ HỒ CHÍ MINH', 'Trung tâm kinh doanh Thủ Thiêm', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('andc', 'Đặng Công An', '1970-06-28', 'andc@example.com', '0554203630', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hà Nội', 'Giám đốc', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('thangdm', 'Đỗ Minh Thắng', '1973-12-27', 'thangdm@example.com', '0925257969', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hà Nội', 'Trưởng phòng', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('trungdd', 'Đặng Đức Trung', '1978-03-20', 'trungdd@example.com', '0714060391', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hà Nội', 'Chuyên viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('nhunght', 'Huỳnh Thu Nhung', '2001-02-21', 'nhunght@example.com', '0587394571', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hà Nội', 'Nhân viên', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('thangnq', 'Nguyễn Quốc Thắng', '2000-06-20', 'thangnq@example.com', '0715027801', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hà Nội', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('haln', 'Lý Ngọc Hà', '1990-05-15', 'haln@example.com', '0768619689', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thủ Đô', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('giangnn', 'Nguyễn Ngọc Giang', '2002-07-16', 'giangnn@example.com', '0948923965', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thủ Đô', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('lanhd', 'Huỳnh Diệu Lan', '2000-07-20', 'lanhd@example.com', '0590820745', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thủ Đô', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anhnt', 'Ngô Thu Anh', '1979-01-28', 'anhnt@example.com', '0810546191', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thủ Đô', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anhlt', 'Lê Thanh Anh', '1991-06-19', 'anhlt@example.com', '0865763422', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thủ Đô', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('phuonghk2', 'Huỳnh Kim Phương', '1999-09-18', 'phuonghk2@example.com', '0773159415', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thăng Long', 'Giám đốc', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('dungnv', 'Ngô Văn Dũng', '1974-07-07', 'dungnv@example.com', '0770362707', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thăng Long', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mybk', 'Bùi Khánh My', '1993-08-28', 'mybk@example.com', '0547302673', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thăng Long', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dattq', 'Trần Quốc Đạt', '1980-11-25', 'dattq@example.com', '0843038971', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thăng Long', 'Nhân viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('mypm', 'Phan Mai My', '1990-11-16', 'mypm@example.com', '0383213771', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thăng Long', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('longht', 'Hoàng Tuấn Long', '1979-06-06', 'longht@example.com', '0709220748', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Nguyên', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hanhtt', 'Trần Thanh Hạnh', '1977-06-03', 'hanhtt@example.com', '0830554087', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Nguyên', 'Phó Giám đốc', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('trangdk', 'Đỗ Khánh Trang', '1991-11-10', 'trangdk@example.com', '0832510271', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Nguyên', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonpd', 'Phạm Đức Sơn', '1980-06-08', 'sonpd@example.com', '0977008802', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Nguyên', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhvk2', 'Võ Khánh Oanh', '1996-02-18', 'oanhvk2@example.com', '0333958721', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Nguyên', 'Nhân viên', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('binhdv', 'Đỗ Văn Bình', '2001-05-03', 'binhdv@example.com', '0815306395', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Nguyên', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('anhpk', 'Phạm Khánh Anh', '1978-12-12', 'anhpk@example.com', '0844654499', 'KHU VỰC MIỀN BẮC', 'Bảo Long Quảng Ninh', 'Giám đốc', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('trungpq', 'Phạm Quốc Trung', '1994-12-15', 'trungpq@example.com', '0740668613', 'KHU VỰC MIỀN BẮC', 'Bảo Long Quảng Ninh', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('ngahb', 'Huỳnh Bảo Nga', '1977-12-24', 'ngahb@example.com', '0332281790', 'KHU VỰC MIỀN BẮC', 'Bảo Long Quảng Ninh', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tudg', 'Đỗ Gia Tú', '1971-11-12', 'tudg@example.com', '0990051044', 'KHU VỰC MIỀN BẮC', 'Bảo Long Quảng Ninh', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thangpc', 'Phan Công Thắng', '1968-04-15', 'thangpc@example.com', '0549046097', 'KHU VỰC MIỀN BẮC', 'Bảo Long Quảng Ninh', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('binhbd', 'Bùi Đức Bình', '2001-07-26', 'binhbd@example.com', '0719087354', 'KHU VỰC MIỀN BẮC', 'Bảo Long Quảng Ninh', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('hanhlt', 'Lý Thị Hạnh', '1970-05-11', 'hanhlt@example.com', '0903665083', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Phòng', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hanb', 'Nguyễn Bảo Hà', '1994-08-26', 'hanb@example.com', '0362595626', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Phòng', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tainc', 'Nguyễn Công Tài', '1982-12-10', 'tainc@example.com', '0339867690', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Phòng', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tudv', 'Đặng Văn Tú', '1968-05-08', 'tudv@example.com', '0355511035', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Phòng', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vyhd2', 'Hồ Diệu Vy', '1988-02-17', 'vyhd2@example.com', '0593654510', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Phòng', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('anlh', 'Lê Hữu An', '1971-01-25', 'anlh@example.com', '0863725869', 'KHU VỰC MIỀN BẮC', 'Bảo Long Phú Thọ', 'Giám đốc', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('tung', 'Nguyễn Gia Tú', '1970-05-11', 'tung@example.com', '0540284318', 'KHU VỰC MIỀN BẮC', 'Bảo Long Phú Thọ', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anlh2', 'Lý Hữu An', '1986-01-14', 'anlh2@example.com', '0512990233', 'KHU VỰC MIỀN BẮC', 'Bảo Long Phú Thọ', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('haipm', 'Phạm Minh Hải', '1999-08-06', 'haipm@example.com', '0386313790', 'KHU VỰC MIỀN BẮC', 'Bảo Long Phú Thọ', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonpv', 'Phạm Văn Sơn', '1976-02-15', 'sonpv@example.com', '0776380903', 'KHU VỰC MIỀN BẮC', 'Bảo Long Phú Thọ', 'Nhân viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('phuonghk3', 'Hồ Khánh Phương', '1978-04-06', 'phuonghk3@example.com', '0546858852', 'KHU VỰC MIỀN BẮC', 'Bảo Long Phú Thọ', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vietpm', 'Phan Minh Việt', '1986-05-19', 'vietpm@example.com', '0929867326', 'KHU VỰC MIỀN BẮC', 'Bảo Long Bắc Ninh', 'Giám đốc', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('thanghd2', 'Hoàng Đức Thắng', '1972-11-25', 'thanghd2@example.com', '0550785794', 'KHU VỰC MIỀN BẮC', 'Bảo Long Bắc Ninh', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trangnt', 'Ngô Thị Trang', '1992-02-14', 'trangnt@example.com', '0749129429', 'KHU VỰC MIỀN BẮC', 'Bảo Long Bắc Ninh', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('namvh', 'Võ Hoàng Nam', '1999-07-27', 'namvh@example.com', '0788542488', 'KHU VỰC MIỀN BẮC', 'Bảo Long Bắc Ninh', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhtk', 'Trần Kim Oanh', '2001-05-04', 'oanhtk@example.com', '0980021379', 'KHU VỰC MIỀN BẮC', 'Bảo Long Bắc Ninh', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, 'SN_TUAN_NAY'),
    ('thangvh', 'Võ Hoàng Thắng', '1983-12-24', 'thangvh@example.com', '0596448080', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Dương', 'Giám đốc', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('hanhdk', 'Dương Khánh Hạnh', '1972-12-15', 'hanhdk@example.com', '0776532173', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Dương', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tailc', 'Lý Công Tài', '1970-10-10', 'tailc@example.com', '0575748582', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Dương', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('namdt', 'Dương Thành Nam', '1988-11-18', 'namdt@example.com', '0962551916', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Dương', 'Nhân viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('uyennp', 'Nguyễn Phương Uyên', '1997-03-25', 'uyennp@example.com', '0375934560', 'KHU VỰC MIỀN BẮC', 'Bảo Long Hải Dương', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('tranglk', 'Lý Kim Trang', '1975-06-06', 'tranglk@example.com', '0920701935', 'KHU VỰC MIỀN BẮC', 'Bảo Long Nam Định', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('viethv', 'Hoàng Văn Việt', '1998-06-18', 'viethv@example.com', '0339982263', 'KHU VỰC MIỀN BẮC', 'Bảo Long Nam Định', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('chaupt', 'Phan Thanh Châu', '1982-07-05', 'chaupt@example.com', '0562891415', 'KHU VỰC MIỀN BẮC', 'Bảo Long Nam Định', 'Trưởng phòng', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('andd2', 'Đỗ Đức An', '1974-02-02', 'andd2@example.com', '0823864167', 'KHU VỰC MIỀN BẮC', 'Bảo Long Nam Định', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhlk', 'Lý Khánh Linh', '1977-04-18', 'linhlk@example.com', '0971242589', 'KHU VỰC MIỀN BẮC', 'Bảo Long Nam Định', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mailk', 'Lê Kim Mai', '1970-11-03', 'mailk@example.com', '0803818155', 'KHU VỰC MIỀN BẮC', 'Bảo Long Nam Định', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vypk2', 'Phạm Khánh Vy', '1968-03-21', 'vypk2@example.com', '0707888273', 'KHU VỰC MIỀN BẮC', 'Bảo Long Vĩnh Phúc', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('haht', 'Huỳnh Thị Hà', '1977-11-18', 'haht@example.com', '0589537197', 'KHU VỰC MIỀN BẮC', 'Bảo Long Vĩnh Phúc', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('chaulk', 'Lý Khánh Châu', '1993-08-06', 'chaulk@example.com', '0309655608', 'KHU VỰC MIỀN BẮC', 'Bảo Long Vĩnh Phúc', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('landt2', 'Đỗ Thị Lan', '1990-02-01', 'landt2@example.com', '0752641509', 'KHU VỰC MIỀN BẮC', 'Bảo Long Vĩnh Phúc', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hahd', 'Hồ Diệu Hà', '2001-12-05', 'hahd@example.com', '0979976387', 'KHU VỰC MIỀN BẮC', 'Bảo Long Vĩnh Phúc', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('longhh2', 'Hồ Hoàng Long', '1968-09-15', 'longhh2@example.com', '0897796017', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Hải', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thaotk', 'Trần Khánh Thảo', '1983-12-06', 'thaotk@example.com', '0598052368', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Hải', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thanglq', 'Lê Quốc Thắng', '2001-12-04', 'thanglq@example.com', '0893383049', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Hải', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trungth', 'Trần Hữu Trung', '1977-01-27', 'trungth@example.com', '0925222149', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Hải', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('huongpt', 'Phạm Thanh Hương', '1989-08-08', 'huongpt@example.com', '0783479299', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Hải', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('thaotd', 'Trần Diệu Thảo', '1972-10-15', 'thaotd@example.com', '0875443460', 'KHU VỰC MIỀN BẮC', 'Sở giao dịch miền Bắc', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('datpq', 'Phan Quốc Đạt', '1997-02-26', 'datpq@example.com', '0798772695', 'KHU VỰC MIỀN BẮC', 'Sở giao dịch miền Bắc', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vinhht', 'Hồ Tuấn Vinh', '1977-07-18', 'vinhht@example.com', '0768357657', 'KHU VỰC MIỀN BẮC', 'Sở giao dịch miền Bắc', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('ngatb', 'Trần Bảo Nga', '1980-07-05', 'ngatb@example.com', '0527410446', 'KHU VỰC MIỀN BẮC', 'Sở giao dịch miền Bắc', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mylk', 'Lý Khánh My', '1971-02-28', 'mylk@example.com', '0330393511', 'KHU VỰC MIỀN BẮC', 'Sở giao dịch miền Bắc', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vyvp', 'Võ Phương Vy', '1995-05-05', 'vyvp@example.com', '0734203917', 'KHU VỰC MIỀN BẮC', 'Bảo Long Ninh Bình', 'Giám đốc', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('giangvd', 'Võ Diệu Giang', '1973-08-17', 'giangvd@example.com', '0890483663', 'KHU VỰC MIỀN BẮC', 'Bảo Long Ninh Bình', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('huongnk', 'Nguyễn Kim Hương', '1990-03-19', 'huongnk@example.com', '0831271135', 'KHU VỰC MIỀN BẮC', 'Bảo Long Ninh Bình', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('datvt', 'Vũ Tuấn Đạt', '1993-01-20', 'datvt@example.com', '0910215204', 'KHU VỰC MIỀN BẮC', 'Bảo Long Ninh Bình', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('antm', 'Trần Minh An', '1991-08-12', 'antm@example.com', '0903447323', 'KHU VỰC MIỀN BẮC', 'Bảo Long Ninh Bình', 'Nhân viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('khoalv', 'Lý Văn Khoa', '1990-03-18', 'khoalv@example.com', '0551890243', 'KHU VỰC MIỀN BẮC', 'Bảo Long Ninh Bình', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('anhtn', 'Trần Ngọc Anh', '1973-05-10', 'anhtn@example.com', '0372285135', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Bình', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('giangbb', 'Bùi Bảo Giang', '1970-08-01', 'giangbb@example.com', '0367869884', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Bình', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thaotk2', 'Trần Kim Thảo', '1988-11-12', 'thaotk2@example.com', '0811770491', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Bình', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('nhungnt', 'Ngô Thu Nhung', '1977-11-03', 'nhungnt@example.com', '0863526035', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Bình', 'Nhân viên', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('huongdk2', 'Đặng Khánh Hương', '1998-04-21', 'huongdk2@example.com', '0945183202', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thái Bình', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('thangtg', 'Trần Gia Thắng', '1973-01-07', 'thangtg@example.com', '0546497342', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Đô', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, 'SN_TUAN_NAY'),
    ('trangpt', 'Phạm Thu Trang', '1993-06-18', 'trangpt@example.com', '0929983393', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Đô', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('taipt', 'Phạm Tuấn Tài', '1996-11-24', 'taipt@example.com', '0903497872', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Đô', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thangtt2', 'Trần Tuấn Thắng', '2000-08-01', 'thangtt2@example.com', '0736915878', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Đô', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, 'SN_TUAN_NAY'),
    ('phuongpt', 'Phan Thanh Phương', '1980-10-01', 'phuongpt@example.com', '0920840596', 'KHU VỰC MIỀN BẮC', 'Bảo Long Đông Đô', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('namlc2', 'Lê Công Nam', '1977-10-15', 'namlc2@example.com', '0804398891', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thanh Hóa', 'Giám đốc', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('vietnc', 'Nguyễn Công Việt', '1996-07-27', 'vietnc@example.com', '0999090023', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thanh Hóa', 'Phó Giám đốc', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('dunglv3', 'Lê Văn Dũng', '1990-03-09', 'dunglv3@example.com', '0579775802', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thanh Hóa', 'Trưởng phòng', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('taitm', 'Trần Minh Tài', '1987-11-20', 'taitm@example.com', '0792621968', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thanh Hóa', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('cuongpt', 'Phan Tuấn Cường', '1991-06-14', 'cuongpt@example.com', '0821182120', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thanh Hóa', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mydb', 'Dương Bảo My', '1985-11-05', 'mydb@example.com', '0347941542', 'KHU VỰC MIỀN BẮC', 'Bảo Long Thanh Hóa', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('nhungvn', 'Võ Ngọc Nhung', '1986-05-25', 'nhungvn@example.com', '0943883000', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long KV Tây Nguyên (Daklak)', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mydt', 'Đỗ Thu My', '1977-07-11', 'mydt@example.com', '0994566513', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long KV Tây Nguyên (Daklak)', 'Phó Giám đốc', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('quynhdm', 'Đỗ Mai Quỳnh', '1979-01-27', 'quynhdm@example.com', '0787316547', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long KV Tây Nguyên (Daklak)', 'Trưởng phòng', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('thanglh', 'Lê Hữu Thắng', '2000-07-21', 'thanglh@example.com', '0995731680', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long KV Tây Nguyên (Daklak)', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('chaupb', 'Phan Bảo Châu', '1996-08-08', 'chaupb@example.com', '0786272642', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long KV Tây Nguyên (Daklak)', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungtt', 'Trần Thu Dung', '1971-02-10', 'dungtt@example.com', '0850811528', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long KV Tây Nguyên (Daklak)', 'Văn thư', 'Chuyên viên Văn thư', 'NGHI_VIEC', TRUE, 'Nghỉ việc (mẫu)'),
    ('uyentn', 'Trần Ngọc Uyên', '1974-01-17', 'uyentn@example.com', '0956205983', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Phú Yên', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('cuongvh', 'Võ Hữu Cường', '1977-02-28', 'cuongvh@example.com', '0305925780', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Phú Yên', 'Phó Giám đốc', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('quynhln', 'Lê Ngọc Quỳnh', '1970-04-28', 'quynhln@example.com', '0895219052', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Phú Yên', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('khoalh', 'Lê Hữu Khoa', '1978-07-05', 'khoalh@example.com', '0580151615', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Phú Yên', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhnn', 'Ngô Ngọc Linh', '2001-07-23', 'linhnn@example.com', '0937561908', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Phú Yên', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('quynhnn', 'Nguyễn Ngọc Quỳnh', '1974-03-15', 'quynhnn@example.com', '0342006489', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Phú Yên', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('halk', 'Lê Khánh Hà', '1991-01-05', 'halk@example.com', '0846395224', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Đà Nẵng', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dunglk', 'Lê Kim Dung', '1998-10-09', 'dunglk@example.com', '0531211638', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Đà Nẵng', 'Phó Giám đốc', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, 'SN_HOM_NAY'),
    ('phuongdb', 'Đỗ Bảo Phương', '1992-08-15', 'phuongdb@example.com', '0314042871', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Đà Nẵng', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('longdh', 'Đặng Hữu Long', '1982-11-26', 'longdh@example.com', '0521906562', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Đà Nẵng', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('chaupm', 'Phạm Mai Châu', '1969-10-15', 'chaupm@example.com', '0579846290', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Đà Nẵng', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('binhbd2', 'Bùi Đức Bình', '1976-04-14', 'binhbd2@example.com', '0538488031', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Đà Nẵng', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('quynhtn', 'Trần Ngọc Quỳnh', '1999-11-16', 'quynhtn@example.com', '0861611606', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Trung Bộ (Huế)', 'Giám đốc', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('namlh', 'Lý Hữu Nam', '1983-01-04', 'namlh@example.com', '0540005569', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Trung Bộ (Huế)', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('khoatm', 'Trần Minh Khoa', '1987-08-24', 'khoatm@example.com', '0778324711', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Trung Bộ (Huế)', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vietpt', 'Phan Thành Việt', '1968-02-16', 'vietpt@example.com', '0970480480', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Trung Bộ (Huế)', 'Nhân viên', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('mydd', 'Đặng Diệu My', '1969-11-19', 'mydd@example.com', '0599736399', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Trung Bộ (Huế)', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('huongvk2', 'Vũ Khánh Hương', '2002-12-03', 'huongvk2@example.com', '0757741283', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bắc Trung Bộ (Nghệ An)', 'Giám đốc', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('phuongdk', 'Dương Kim Phương', '1995-03-15', 'phuongdk@example.com', '0511175523', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bắc Trung Bộ (Nghệ An)', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trangdd', 'Đặng Diệu Trang', '1985-07-17', 'trangdd@example.com', '0743919204', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bắc Trung Bộ (Nghệ An)', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hanhdp', 'Đỗ Phương Hạnh', '1971-08-18', 'hanhdp@example.com', '0878349837', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bắc Trung Bộ (Nghệ An)', 'Nhân viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('quynhhm', 'Huỳnh Mai Quỳnh', '1993-07-20', 'quynhhm@example.com', '0580858559', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bắc Trung Bộ (Nghệ An)', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('dungph', 'Phan Hữu Dũng', '1988-12-07', 'dungph@example.com', '0846869364', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Khánh Hòa', 'Giám đốc', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('quynhht', 'Huỳnh Thu Quỳnh', '2002-09-08', 'quynhht@example.com', '0328001410', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Khánh Hòa', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maipt', 'Phạm Thị Mai', '1980-07-05', 'maipt@example.com', '0349487367', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Khánh Hòa', 'Chuyên viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('thanghd3', 'Hồ Đức Thắng', '1973-04-05', 'thanghd3@example.com', '0998775887', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Khánh Hòa', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('uyenht', 'Hoàng Thu Uyên', '1981-10-21', 'uyenht@example.com', '0368091044', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Khánh Hòa', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('maidb', 'Đặng Bảo Mai', '1989-04-10', 'maidb@example.com', '0979963060', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Định', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anph', 'Phạm Hoàng An', '1977-01-20', 'anph@example.com', '0900770229', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Định', 'Trưởng phòng', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('namlm', 'Lê Minh Nam', '1985-05-22', 'namlm@example.com', '0716174072', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Định', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('trungvd', 'Vũ Đức Trung', '1980-07-14', 'trungvd@example.com', '0781082950', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Định', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hatt', 'Trần Thị Hà', '1977-11-17', 'hatt@example.com', '0566386371', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Định', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('sontd2', 'Trần Đức Sơn', '1973-02-22', 'sontd2@example.com', '0997977191', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Thuận', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('datlg', 'Lý Gia Đạt', '1995-06-05', 'datlg@example.com', '0339847132', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Thuận', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anhdk', 'Dương Kim Anh', '1986-01-20', 'anhdk@example.com', '0346170901', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Thuận', 'Chuyên viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('tranglm', 'Lý Mai Trang', '1968-01-16', 'tranglm@example.com', '0354050985', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Thuận', 'Nhân viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('haivh2', 'Vũ Hữu Hải', '1991-12-05', 'haivh2@example.com', '0922450194', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Bình Thuận', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('taihh', 'Huỳnh Hữu Tài', '1995-03-21', 'taihh@example.com', '0807214400', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Ngãi', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dunghb', 'Huỳnh Bảo Dung', '1998-09-22', 'dunghb@example.com', '0339447662', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Ngãi', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('nhungvt', 'Vũ Thị Nhung', '1977-03-19', 'nhungvt@example.com', '0370638470', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Ngãi', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('nhungnp', 'Nguyễn Phương Nhung', '1984-12-20', 'nhungnp@example.com', '0971822835', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Ngãi', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dunghp', 'Hồ Phương Dung', '1979-11-27', 'dunghp@example.com', '0889270368', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Ngãi', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhdn', 'Dương Ngọc Oanh', '1984-06-24', 'oanhdn@example.com', '0898422205', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Ngãi', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('hanhdb', 'Đỗ Bảo Hạnh', '1988-08-10', 'hanhdb@example.com', '0370356134', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Gia Lai', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hieupc', 'Phan Công Hiếu', '2000-07-23', 'hieupc@example.com', '0817637914', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Gia Lai', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dunght', 'Huỳnh Thanh Dung', '1994-04-23', 'dunght@example.com', '0917042810', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Gia Lai', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('anhdb', 'Đỗ Bảo Anh', '1982-02-20', 'anhdb@example.com', '0385882837', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Gia Lai', 'Chuyên viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('hungdq2', 'Đặng Quốc Hùng', '1972-02-10', 'hungdq2@example.com', '0981800959', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Gia Lai', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maint', 'Ngô Thị Mai', '1996-02-23', 'maint@example.com', '0306461550', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Gia Lai', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('uyenpk', 'Phạm Kim Uyên', '1995-01-02', 'uyenpk@example.com', '0875845010', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Lâm Đồng', 'Giám đốc', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('phuongdk2', 'Dương Khánh Phương', '1974-07-27', 'phuongdk2@example.com', '0339223368', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Lâm Đồng', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('khoang', 'Ngô Gia Khoa', '1975-12-02', 'khoang@example.com', '0738619504', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Lâm Đồng', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('oanhht', 'Hồ Thanh Oanh', '1969-06-06', 'oanhht@example.com', '0823810578', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Lâm Đồng', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungdv2', 'Dương Văn Dũng', '1995-06-05', 'dungdv2@example.com', '0578255020', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Lâm Đồng', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('halt3', 'Lý Thị Hà', '2001-05-01', 'halt3@example.com', '0501855078', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Lâm Đồng', 'Văn thư', 'Chuyên viên Văn thư', 'NGHI_VIEC', TRUE, 'Nghỉ việc (mẫu)'),
    ('vinhdd', 'Dương Đức Vinh', '1989-06-14', 'vinhdd@example.com', '0552567877', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Bình', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('huongnm', 'Nguyễn Mai Hương', '2002-07-14', 'huongnm@example.com', '0861494095', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Bình', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('linhhm', 'Hồ Mai Linh', '2000-04-22', 'linhhm@example.com', '0804734598', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Bình', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('ngabd', 'Bùi Diệu Nga', '1980-05-01', 'ngabd@example.com', '0589321140', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Bình', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('lanhm', 'Hoàng Mai Lan', '1992-01-14', 'lanhm@example.com', '0707282625', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Bình', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vinhph', 'Phạm Hoàng Vinh', '1985-03-12', 'vinhph@example.com', '0360642310', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Bảo Long Quảng Bình', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('taibm', 'Bùi Minh Tài', '1969-01-04', 'taibm@example.com', '0861061567', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Trung tâm kinh doanh Sông Hàn', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tudc', 'Đặng Công Tú', '1989-10-14', 'tudc@example.com', '0917975604', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Trung tâm kinh doanh Sông Hàn', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('lanhp2', 'Hồ Phương Lan', '2001-05-11', 'lanhp2@example.com', '0873562773', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Trung tâm kinh doanh Sông Hàn', 'Trưởng phòng', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('gianglt', 'Lý Thanh Giang', '1971-03-24', 'gianglt@example.com', '0822806055', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Trung tâm kinh doanh Sông Hàn', 'Chuyên viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('taidh', 'Dương Hoàng Tài', '1983-10-16', 'taidh@example.com', '0702378832', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Trung tâm kinh doanh Sông Hàn', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('myvd', 'Vũ Diệu My', '1970-08-05', 'myvd@example.com', '0377080228', 'KHU VỰC MIỀN TRUNG TÂY NGUYÊN', 'Trung tâm kinh doanh Sông Hàn', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('myhm', 'Huỳnh Mai My', '1972-11-07', 'myhm@example.com', '0974644190', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Bình Dương', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungdt2', 'Đặng Thu Dung', '1971-07-08', 'dungdt2@example.com', '0357014965', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Bình Dương', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maidk', 'Đỗ Khánh Mai', '2002-03-20', 'maidk@example.com', '0875121758', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Bình Dương', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('vydd', 'Đặng Diệu Vy', '1988-05-16', 'vydd@example.com', '0334959038', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Bình Dương', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hieutd', 'Trần Đức Hiếu', '1992-01-16', 'hieutd@example.com', '0832244495', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Bình Dương', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('datnm', 'Nguyễn Minh Đạt', '1987-01-03', 'datnm@example.com', '0824626011', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Vũng Tàu', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, 'SN_HOM_NAY'),
    ('vydt2', 'Đặng Thanh Vy', '1982-04-17', 'vydt2@example.com', '0992986864', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Vũng Tàu', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('datlh', 'Lý Hoàng Đạt', '1995-05-20', 'datlh@example.com', '0319658534', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Vũng Tàu', 'Trưởng phòng', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('vinhnh', 'Nguyễn Hoàng Vinh', '1969-05-11', 'vinhnh@example.com', '0840903027', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Vũng Tàu', 'Chuyên viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('hungnt2', 'Nguyễn Thành Hùng', '1968-11-23', 'hungnt2@example.com', '0790098961', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Vũng Tàu', 'Nhân viên', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('vinhht2', 'Huỳnh Tuấn Vinh', '1987-02-27', 'vinhht2@example.com', '0887188982', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Vũng Tàu', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('uyenbk', 'Bùi Khánh Uyên', '1991-07-02', 'uyenbk@example.com', '0839527648', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Nai', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('mydp', 'Đặng Phương My', '1969-08-02', 'mydp@example.com', '0735426453', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Nai', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('namdt2', 'Dương Tuấn Nam', '1987-01-15', 'namdt2@example.com', '0507853772', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Nai', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('quanhm', 'Huỳnh Minh Quân', '1985-06-20', 'quanhm@example.com', '0992785847', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Nai', 'Chuyên viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('vinhbt', 'Bùi Thành Vinh', '1983-08-13', 'vinhbt@example.com', '0739711795', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Nai', 'Nhân viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('dungdq', 'Đỗ Quốc Dũng', '1975-08-07', 'dungdq@example.com', '0512860329', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Nai', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('linhpt', 'Phạm Thu Linh', '2002-12-19', 'linhpt@example.com', '0351460619', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Tây Ninh', 'Giám đốc', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('trungtd', 'Trần Đức Trung', '1986-09-21', 'trungtd@example.com', '0869088124', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Tây Ninh', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungdv3', 'Đỗ Văn Dũng', '1968-09-19', 'dungdv3@example.com', '0525480623', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Tây Ninh', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('haihg', 'Huỳnh Gia Hải', '1998-06-03', 'haihg@example.com', '0361407255', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Tây Ninh', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('sonlm', 'Lý Minh Sơn', '1996-04-09', 'sonlm@example.com', '0961707245', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Tây Ninh', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('anvd', 'Võ Đức An', '1990-08-23', 'anvd@example.com', '0905766521', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Long An', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('lannk', 'Ngô Khánh Lan', '1998-07-23', 'lannk@example.com', '0360288305', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Long An', 'Phó Giám đốc', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, NULL),
    ('ngahd', 'Huỳnh Diệu Nga', '1999-05-27', 'ngahd@example.com', '0312993570', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Long An', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phuongnn', 'Ngô Ngọc Phương', '1980-12-06', 'phuongnn@example.com', '0306601866', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Long An', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thangdt', 'Đặng Thành Thắng', '2002-03-20', 'thangdt@example.com', '0840293473', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Long An', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('phuonglp', 'Lý Phương Phương', '1996-01-16', 'phuonglp@example.com', '0363611325', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Long An', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('vietvg', 'Vũ Gia Việt', '1994-04-21', 'vietvg@example.com', '0750518858', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cần Thơ', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('tudq', 'Dương Quốc Tú', '1973-04-01', 'tudq@example.com', '0366565262', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cần Thơ', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dathq', 'Hoàng Quốc Đạt', '1984-11-07', 'dathq@example.com', '0596693725', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cần Thơ', 'Chuyên viên', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('hanhht', 'Huỳnh Thu Hạnh', '1991-04-20', 'hanhht@example.com', '0727077187', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cần Thơ', 'Nhân viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('vinhdt', 'Đặng Thành Vinh', '1975-05-11', 'vinhdt@example.com', '0900107136', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cần Thơ', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('phuongdt', 'Đặng Thanh Phương', '1989-12-23', 'phuongdt@example.com', '0521709982', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cà Mau', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('hungdv', 'Dương Văn Hùng', '1977-04-24', 'hungdv@example.com', '0330478973', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cà Mau', 'Phó Giám đốc', 'Kế toán viên', 'LAM_VIEC', TRUE, NULL),
    ('anhdp', 'Đỗ Phương Anh', '1982-01-07', 'anhdp@example.com', '0706363398', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cà Mau', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('dungdt3', 'Dương Thị Dung', '1983-09-25', 'dungdt3@example.com', '0353448023', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cà Mau', 'Chuyên viên', 'Cán bộ IT', 'LAM_VIEC', TRUE, NULL),
    ('oanhdk', 'Đỗ Kim Oanh', '2002-03-14', 'oanhdk@example.com', '0548256653', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cà Mau', 'Nhân viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('trunglh', 'Lý Hoàng Trung', '1989-08-10', 'trunglh@example.com', '0754181137', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Cà Mau', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('haild', 'Lý Đức Hải', '1978-07-04', 'haild@example.com', '0347308186', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Kiên Giang', 'Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thangtm', 'Trần Minh Thắng', '1990-02-06', 'thangtm@example.com', '0797436748', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Kiên Giang', 'Phó Giám đốc', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('anhht3', 'Huỳnh Thu Anh', '1981-07-27', 'anhht3@example.com', '0564979355', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Kiên Giang', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, NULL),
    ('thaovk2', 'Vũ Kim Thảo', '1970-03-10', 'thaovk2@example.com', '0799099470', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Kiên Giang', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('binhhc', 'Hoàng Công Bình', '1998-03-02', 'binhhc@example.com', '0509388682', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Kiên Giang', 'Nhân viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('phucth', 'Trần Hữu Phúc', '2001-02-26', 'phucth@example.com', '0700465622', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Kiên Giang', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('anhnm', 'Nguyễn Mai Anh', '1988-11-04', 'anhnm@example.com', '0549714799', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Tháp', 'Giám đốc', 'Thư ký', 'LAM_VIEC', TRUE, NULL),
    ('binhbh', 'Bùi Hữu Bình', '1977-08-23', 'binhbh@example.com', '0364909723', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Tháp', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('binhph', 'Phan Hoàng Bình', '1970-06-12', 'binhph@example.com', '0532312861', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Tháp', 'Trưởng phòng', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, NULL),
    ('taipc', 'Phạm Công Tài', '1997-03-18', 'taipc@example.com', '0798260066', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Tháp', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maihk', 'Hoàng Kim Mai', '1976-10-16', 'maihk@example.com', '0975990324', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Tháp', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('longdt', 'Đỗ Thành Long', '1977-09-08', 'longdt@example.com', '0998034445', 'KHU VỰC ĐÔNG NAM BỘ', 'Bảo Long Đồng Tháp', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, NULL),
    ('cuonghm', 'Hoàng Minh Cường', '1974-11-02', 'cuonghm@example.com', '0815385588', 'GIÁM ĐỊNH VÙNG', 'Giám định vùng', 'Giám đốc', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, NULL),
    ('longbt', 'Bùi Tuấn Long', '1986-12-11', 'longbt@example.com', '0969830826', 'GIÁM ĐỊNH VÙNG', 'Giám định vùng', 'Phó Giám đốc', NULL, 'LAM_VIEC', TRUE, NULL),
    ('khoaht', 'Hồ Thành Khoa', '1978-12-18', 'khoaht@example.com', '0347484930', 'GIÁM ĐỊNH VÙNG', 'Giám định vùng', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('maibk', 'Bùi Kim Mai', '1988-06-27', 'maibk@example.com', '0575761340', 'GIÁM ĐỊNH VÙNG', 'Giám định vùng', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, NULL),
    ('demo_nghiviec', 'Nguyễn Đức Thắng', '1986-08-05', 'demo_nghiviec@example.com', '0999863382', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Nhân viên', NULL, 'NGHI_VIEC', TRUE, 'Tài khoản demo'),
    ('namnh', 'Nguyễn Hoàng Nam', '1971-03-10', 'namnh@example.com', '0816204295', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Chuyên viên', NULL, 'LAM_VIEC', FALSE, 'CBNV nội bộ'),
    ('uyendk', 'Đỗ Kim Uyên', '1990-10-08', 'uyendk@example.com', '0332807877', 'KHỐI TÀI CHÍNH', 'Ban đầu tư', 'Chuyên viên', 'Cán bộ pháp chế', 'LAM_VIEC', FALSE, 'CBNV nội bộ'),
    ('mainb', 'Nguyễn Bảo Mai', '1992-02-29', 'mainb@example.com', '0585967761', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Nhân viên', NULL, 'LAM_VIEC', TRUE, 'Sinh ngày 29/02'),
    ('demo_bgd_1', 'Hoàng Minh Bình', '2001-10-19', 'demo_bgd_1@example.com', '0900036063', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Phó Tổng Giám đốc điều hành', 'Kế toán viên', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_bgd_2', 'Đặng Đức Cường', '1978-12-01', 'demo_bgd_2@example.com', '0363600047', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Phó Tổng Giám đốc điều hành', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_bgd_3', 'Bùi Minh Cường', '1969-01-18', 'demo_bgd_3@example.com', '0762641385', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Phó Tổng Giám đốc điều hành', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_bgd_4', 'Lê Kim Thảo', '1976-01-07', 'demo_bgd_4@example.com', '0799559238', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Phó Tổng Giám đốc điều hành', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tlbgd_1', 'Phạm Hữu Dũng', '1989-07-13', 'demo_tlbgd_1@example.com', '0860262727', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Trợ lý TGĐ', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tlbgd_2', 'Đỗ Đức Hiếu', '1989-09-05', 'demo_tlbgd_2@example.com', '0321391078', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Trợ lý TGĐ', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tlbgd_3', 'Đỗ Đức Hùng', '1994-06-18', 'demo_tlbgd_3@example.com', '0528532607', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Trợ lý TGĐ', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tlbgd_4', 'Vũ Bảo Hương', '1969-07-02', 'demo_tlbgd_4@example.com', '0924802247', 'BAN TỔNG GIÁM ĐỐC', 'Ban tổng giám đốc', 'Trợ lý TGĐ', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_kt_1', 'Dương Mai Linh', '1992-03-09', 'demo_kt_1@example.com', '0369873651', 'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 'Kiểm toán viên', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_kt_2', 'Hồ Văn Vinh', '1988-05-25', 'demo_kt_2@example.com', '0922340260', 'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 'Kiểm toán viên', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_kt_3', 'Phạm Thanh Dung', '1987-03-08', 'demo_kt_3@example.com', '0826815672', 'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 'Kiểm toán viên', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_kt_4', 'Lê Quốc Quân', '1988-05-08', 'demo_kt_4@example.com', '0301277929', 'HỘI ĐỒNG QUẢN TRỊ', 'Ban kiểm toán nội bộ', 'Kiểm toán viên', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tp_1', 'Vũ Mai Hạnh', '1993-08-20', 'demo_tp_1@example.com', '0589050825', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Trưởng phòng', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tp_2', 'Đặng Ngọc Hương', '1975-02-25', 'demo_tp_2@example.com', '0750307048', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Trưởng phòng', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tp_3', 'Vũ Phương Dung', '1983-02-15', 'demo_tp_3@example.com', '0780561900', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Trưởng phòng', 'Cán bộ pháp chế', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_tp_4', 'Nguyễn Thu Châu', '1989-09-21', 'demo_tp_4@example.com', '0740485550', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Trưởng phòng', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_cv_1', 'Đặng Mai Hạnh', '1994-01-10', 'demo_cv_1@example.com', '0773465408', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_cv_2', 'Lê Gia Tài', '1995-12-04', 'demo_cv_2@example.com', '0725355275', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', 'Phụ trách tổng hợp', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_cv_3', 'Trần Kim Thảo', '1976-04-01', 'demo_cv_3@example.com', '0829473365', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', 'Phụ trách đối ngoại', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_cv_4', 'Vũ Tuấn Tài', '1978-07-23', 'demo_cv_4@example.com', '0523577191', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_vt_1', 'Huỳnh Văn Vinh', '1988-08-27', 'demo_vt_1@example.com', '0373607240', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_vt_2', 'Lý Khánh Anh', '1972-01-21', 'demo_vt_2@example.com', '0952037315', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_vt_3', 'Huỳnh Thu Hương', '1990-05-13', 'demo_vt_3@example.com', '0846309196', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('demo_vt_4', 'Lê Đức An', '1991-03-09', 'demo_vt_4@example.com', '0514030513', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Văn thư', 'Chuyên viên Văn thư', 'LAM_VIEC', TRUE, 'Tài khoản demo'),
    ('teiusoa', 'Trần Vũ Giang Anh', '2007-10-29', 'teiusoa@gmail.com', '0334564514', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Trưởng Ban', 'Trưởng nhóm 8', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 8'),
    ('em123ngao-arch', 'Nguyễn Duy Bảo', '2007-09-19', 'em123ngao-arch@gmail.com', '0334564529', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 7; kiêm nhiệm Ban dự án MIS (Nhóm 6), Chuyên viên'),
    ('nguyenanhdo0949-create', 'Nguyễn Anh Đô', '2007-07-17', 'nguyenanhdo0949-create@gmail.com', '0334564586', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 2; GitHub: nguyenanhdo0949-create'),
    ('phantahuuduc', 'Phan Tạ Hữu Đức', '2007-11-17', 'phantahuuduc@gmail.com', '0334564517', 'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 'Trưởng Ban', 'Trưởng nhóm 6', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 6'),
    ('thanhhau15112000-dev', 'Lê Thanh Hậu', '2007-11-15', 'thanhhau15112000-dev@gmail.com', '0334564562', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Trưởng Ban', 'Trưởng nhóm 5', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 5; GitHub: thanhhau15112000-dev'),
    ('sidehieu03', 'Nguyễn Phan Minh Hiếu', '1997-12-12', 'sidehieu03@gmail.com', '0334564551', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 7'),
    ('hieunguyen_pro1919', 'Nguyễn Văn Hiếu', '2007-02-11', 'hieunguyen.pro1919@gmail.com', '0334564569', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 1'),
    ('khanhledz8899', 'Lê Duy Khánh', '2006-07-19', 'khanhledz8899@gmail.com', '0334564511', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Quản trị viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 7'),
    ('khiemtan1712', 'Nguyễn Tấn Lộc Khiêm', '2007-12-17', 'khiemtan1712@gmail.com', '0334564501', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 2'),
    ('kietphuchau', 'Châu Tuấn Kiệt', '2007-11-18', 'kietphuchau@gmail.com', '0334564594', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Trưởng Ban', 'Trưởng nhóm 1', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 1'),
    ('kietle205thll-bot', 'Lê Trí Kiệt', '2007-05-20', 'kietle205thll-bot@gmail.com', '0334564574', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Trưởng Ban', 'Trưởng nhóm 2', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 2; GitHub: kietle205thll-bot'),
    ('tnha4209', 'Huỳnh Vương Thanh Nhã', '2007-08-01', 'tnha4209@gmail.com', '0334564545', 'KHỐI HỖ TRỢ', 'Ban truyền thông và marketing', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 8'),
    ('nhi150807', 'Nguyễn Thị Yến Nhi', '2007-08-15', 'nhi150807@gmail.com', '0334564542', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 3'),
    ('dongocphat007-ctrl', 'Đỗ Ngọc Phát', '2007-08-24', 'dongocphat007-ctrl@gmail.com', '0334564543', 'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 6; GitHub: dongocphat007-ctrl'),
    ('dot207208972', 'Đỗ Trung Phong', '2007-08-02', 'dot207208972@gmail.com', '0334564524', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 4'),
    ('nguyenduyquan0609', 'Nguyễn Duy Quân', '2007-09-06', 'nguyenduyquan0609@gmail.com', '0334564582', 'KHỐI HỖ TRỢ', 'Ban hành chính quản trị', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 1'),
    ('domanhquang2006-ops', 'Đỗ Mạnh Quang', '2006-06-19', 'domanhquang2006-ops@gmail.com', '0334564577', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 7; GitHub: domanhquang2006-ops'),
    ('quynhzgaming', 'Thượng Mạnh Quỳnh', '2007-10-21', 'quynhzgaming@gmail.com', '0334564534', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Trưởng Ban', 'Trưởng nhóm 4', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 4'),
    ('krvin2007', 'Lê Thành Tài', '2007-04-09', 'krvin2007@gmail.com', '0334564563', 'KHỐI KẾ TOÁN', 'Ban kế toán', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 5; GitHub: krvin2007'),
    ('thanhtan1208', 'Tô Thanh Tân', '2005-08-12', 'thanhtan1208@gmail.com', '0334564597', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Quản trị viên', 'Trưởng nhóm 7', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 7; GitHub: Thanhtan1208'),
    ('tanbimat', 'Trần Nhật Tân', '2007-12-20', 'tanbimat@gmail.com', '0334564547', 'VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI', 'Văn phòng ban điều hành', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 2'),
    ('thinhabc27-sys', 'Đặng Trường Thịnh', '2007-10-27', 'thinhabc27-sys@gmail.com', '0334564506', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Trưởng Ban', 'Trưởng nhóm 3', 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 3; GitHub: thinhabc27-sys'),
    ('ctnn1001', 'Nguyễn Chí Tín', '2007-10-24', 'ctnn1001@gmail.com', '0334564527', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 4; GitHub: Ctnn1001'),
    ('tinh90020', 'Trần Đình Tình', '2006-10-21', 'tinh90020@gmail.com', '0334564579', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 7'),
    ('tranghuynh_it_work', 'Huỳnh Thị Kim Trang', '2007-08-16', 'tranghuynh.it.work@gmail.com', '0334564581', 'KHỐI HỖ TRỢ', 'Ban nhân sự', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 4'),
    ('hoctap970-cloud', 'Phan Thị Ánh Tuyền', '2007-05-11', 'hoctap970-cloud@gmail.com', '0334564526', 'KHỐI HỖ TRỢ', 'Ban pháp chế', 'Văn thư', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 3; GitHub: hoctap970-cloud'),
    ('lamchivi2k7', 'Lâm Chí Vĩ', '2007-01-17', 'lamchivi2k7@gmail.com', '0334564575', 'KHỐI TÀI CHÍNH', 'Ban dự án MIS', 'Chuyên viên', NULL, 'LAM_VIEC', TRUE, 'Thành viên lớp - Nhóm 6'),
    ('duytp', 'Trần Phương Duy', '2000-01-01', '26948006@grad.uit.edu.vn', '0334564516', 'KHỐI HỖ TRỢ', 'Ban công nghệ thông tin', 'Quản trị viên', 'Giảng viên hướng dẫn', 'LAM_VIEC', TRUE, 'Giảng viên - quản trị toàn quyền')
) AS source (
    username, ho_ten, ngay_sinh, email, sdt, khoi, don_vi, chuc_vu,
    chuc_danh, trang_thai, is_public, ghi_chu
)
JOIN LATERAL (
    SELECT unit.id
    FROM organizations_khoi block
    JOIN organizations_donvi unit ON unit.khoi_id = block.id
    WHERE block.ten = source.khoi AND unit.ten = source.don_vi
    ORDER BY unit.stt_uu_tien, unit.id
    LIMIT 1
) unit ON TRUE
JOIN LATERAL (
    SELECT id
    FROM accounts_position
    WHERE name = source.chuc_vu
    ORDER BY display_order, id
    LIMIT 1
) position_ref ON TRUE
ON CONFLICT DO NOTHING;

-- Gán nhóm quyền theo workbook; giữ nguyên các nhóm đã có.
INSERT INTO accounts_employee_groups (employee_id, group_id)
SELECT employee.id, access_group.id
FROM (
    VALUES
    ('binhdd', 'binhdd@example.com', 'BGD'),
    ('thaopt', 'thaopt@example.com', 'BGD'),
    ('cuonghh', 'cuonghh@example.com', 'CV'),
    ('sontd', 'sontd@example.com', 'CV'),
    ('cuonglh', 'cuonglh@example.com', 'TP'),
    ('namdv', 'namdv@example.com', 'CV,KT'),
    ('huongdk', 'huongdk@example.com', 'CV,KT'),
    ('hadt', 'hadt@example.com', 'TP'),
    ('trungvh', 'trungvh@example.com', 'TP'),
    ('mybt', 'mybt@example.com', 'VT'),
    ('nhunglt', 'nhunglt@example.com', 'CV'),
    ('dungtv', 'dungtv@example.com', 'BGD'),
    ('havd', 'havd@example.com', 'BGD'),
    ('khoadv', 'khoadv@example.com', 'BGD'),
    ('maivt', 'maivt@example.com', 'CV,TLBGD'),
    ('huongpd', 'huongpd@example.com', 'TP'),
    ('vydn', 'vydn@example.com', 'TP'),
    ('thaopt2', 'thaopt2@example.com', 'BGD'),
    ('anpg', 'anpg@example.com', 'TP'),
    ('dunglv', 'dunglv@example.com', 'VT'),
    ('chaudd', 'chaudd@example.com', 'VT'),
    ('phuctt', 'phuctt@example.com', 'CV'),
    ('dunglv2', 'dunglv2@example.com', 'TP'),
    ('longpt', 'longpt@example.com', 'TP'),
    ('nhungpt', 'nhungpt@example.com', 'CV'),
    ('lanht', 'lanht@example.com', 'CV'),
    ('maipk', 'maipk@example.com', 'CV'),
    ('hahb', 'hahb@example.com', 'VT'),
    ('huongvk', 'huongvk@example.com', 'TP'),
    ('haivh', 'haivh@example.com', 'TP'),
    ('hanhnk', 'hanhnk@example.com', 'CV'),
    ('thaont', 'thaont@example.com', 'CV'),
    ('phuongvn', 'phuongvn@example.com', 'CV'),
    ('thaodd', 'thaodd@example.com', 'VT'),
    ('giangdt', 'giangdt@example.com', 'TP'),
    ('dungdd', 'dungdd@example.com', 'CV'),
    ('maipn', 'maipn@example.com', 'CV'),
    ('thangtq', 'thangtq@example.com', 'CV'),
    ('longhh', 'longhh@example.com', 'VT'),
    ('namtt', 'namtt@example.com', 'TP'),
    ('hieuvm', 'hieuvm@example.com', 'TP'),
    ('myht', 'myht@example.com', 'CV'),
    ('huongtn', 'huongtn@example.com', 'CV'),
    ('anhht', 'anhht@example.com', 'CV'),
    ('linhvb', 'linhvb@example.com', 'VT'),
    ('halt', 'halt@example.com', 'TP'),
    ('linhlt', 'linhlt@example.com', 'CV'),
    ('hanhnt', 'hanhnt@example.com', 'CV'),
    ('sonld', 'sonld@example.com', 'CV'),
    ('anhht2', 'anhht2@example.com', 'VT'),
    ('vypk', 'vypk@example.com', 'TP'),
    ('taint', 'taint@example.com', 'TP'),
    ('tainm', 'tainm@example.com', 'CV'),
    ('vynb', 'vynb@example.com', 'CV'),
    ('sonvh', 'sonvh@example.com', 'CV'),
    ('dungdv', 'dungdv@example.com', 'VT'),
    ('hieunh', 'hieunh@example.com', 'TP'),
    ('phucnt', 'phucnt@example.com', 'CV'),
    ('trunglt', 'trunglt@example.com', 'CV'),
    ('dungth', 'dungth@example.com', 'CV'),
    ('thangpd', 'thangpd@example.com', 'VT'),
    ('oanhlt', 'oanhlt@example.com', 'TP'),
    ('myld', 'myld@example.com', 'TP'),
    ('mynt', 'mynt@example.com', 'CV'),
    ('hungnv', 'hungnv@example.com', 'CV'),
    ('oanhld', 'oanhld@example.com', 'CV'),
    ('thangtt', 'thangtt@example.com', 'VT'),
    ('myvk', 'myvk@example.com', 'TP'),
    ('hungdc', 'hungdc@example.com', 'TP'),
    ('sonth', 'sonth@example.com', 'CV'),
    ('mynt2', 'mynt2@example.com', 'CV'),
    ('vietlv', 'vietlv@example.com', 'CV'),
    ('thaott', 'thaott@example.com', 'VT'),
    ('cuongpg', 'cuongpg@example.com', 'TP'),
    ('thanglm', 'thanglm@example.com', 'TP'),
    ('binhlh', 'binhlh@example.com', 'CV'),
    ('hanhlb', 'hanhlb@example.com', 'CV'),
    ('longdv', 'longdv@example.com', 'CV'),
    ('hungdq', 'hungdq@example.com', 'VT'),
    ('anpv', 'anpv@example.com', 'TP'),
    ('thangbm', 'thangbm@example.com', 'TP'),
    ('thaobt', 'thaobt@example.com', 'CV'),
    ('mydk', 'mydk@example.com', 'CV'),
    ('chauvt', 'chauvt@example.com', 'CV'),
    ('anvc', 'anvc@example.com', 'VT'),
    ('hanhnd', 'hanhnd@example.com', 'TP'),
    ('phuclm', 'phuclm@example.com', 'TP'),
    ('linhht', 'linhht@example.com', 'CV'),
    ('longvg', 'longvg@example.com', 'CV'),
    ('cuonghc', 'cuonghc@example.com', 'CV'),
    ('binhhd', 'binhhd@example.com', 'VT'),
    ('huongvt', 'huongvt@example.com', 'TP'),
    ('sonhg', 'sonhg@example.com', 'TP'),
    ('hungpd', 'hungpd@example.com', 'CV'),
    ('vietlt', 'vietlt@example.com', 'CV'),
    ('thaovt', 'thaovt@example.com', 'CV'),
    ('oanhbd', 'oanhbd@example.com', 'VT'),
    ('hanhlb2', 'hanhlb2@example.com', 'TP'),
    ('sonpc', 'sonpc@example.com', 'TP'),
    ('myvk2', 'myvk2@example.com', 'TP'),
    ('thaonk', 'thaonk@example.com', 'TP'),
    ('myln', 'myln@example.com', 'VT'),
    ('nhungdn', 'nhungdn@example.com', 'VT'),
    ('anbh', 'anbh@example.com', 'CV'),
    ('oanhhk', 'oanhhk@example.com', 'TP'),
    ('linhvt', 'linhvt@example.com', 'TP'),
    ('trungdv', 'trungdv@example.com', 'CV'),
    ('linhvd', 'linhvd@example.com', 'CV'),
    ('khoapv', 'khoapv@example.com', 'CV'),
    ('anhvt', 'anhvt@example.com', 'VT'),
    ('vydn2', 'vydn2@example.com', 'TP'),
    ('longlt', 'longlt@example.com', 'TP'),
    ('cuongpg2', 'cuongpg2@example.com', 'CV'),
    ('taidq', 'taidq@example.com', 'CV'),
    ('ngabt', 'ngabt@example.com', 'CV'),
    ('linhnt', 'linhnt@example.com', 'VT'),
    ('ngaht', 'ngaht@example.com', 'TP'),
    ('vietpq', 'vietpq@example.com', 'TP'),
    ('demo_admin', 'demo_admin@example.com', 'ADMIN'),
    ('haipd', 'haipd@example.com', 'CV'),
    ('hanp', 'hanp@example.com', 'CV'),
    ('lanhp', 'lanhp@example.com', 'CV'),
    ('thanghd', 'thanghd@example.com', 'VT'),
    ('cuongpc', 'cuongpc@example.com', 'TP'),
    ('tranghk', 'tranghk@example.com', 'TP'),
    ('maihd', 'maihd@example.com', 'CV'),
    ('anhvn', 'anhvn@example.com', 'CV'),
    ('andd', 'andd@example.com', 'CV'),
    ('maivm', 'maivm@example.com', 'VT'),
    ('dungnn', 'dungnn@example.com', 'TP'),
    ('mynp', 'mynp@example.com', 'TP'),
    ('trungld', 'trungld@example.com', 'CV'),
    ('quynhhd', 'quynhhd@example.com', 'CV'),
    ('phuongdd', 'phuongdd@example.com', 'CV'),
    ('tulc', 'tulc@example.com', 'VT'),
    ('tudt', 'tudt@example.com', 'TP'),
    ('thangdv', 'thangdv@example.com', 'CV'),
    ('ngadt', 'ngadt@example.com', 'CV'),
    ('oanhhn', 'oanhhn@example.com', 'CV'),
    ('quynhvt', 'quynhvt@example.com', 'VT'),
    ('lannd', 'lannd@example.com', 'TP'),
    ('dungnb', 'dungnb@example.com', 'TP'),
    ('nhungpt2', 'nhungpt2@example.com', 'CV'),
    ('tubh', 'tubh@example.com', 'CV'),
    ('haipt', 'haipt@example.com', 'CV'),
    ('huongvb', 'huongvb@example.com', 'VT'),
    ('vietdm', 'vietdm@example.com', 'TP'),
    ('uyenpt', 'uyenpt@example.com', 'CV'),
    ('hailh', 'hailh@example.com', 'CV'),
    ('thaovk', 'thaovk@example.com', 'CV'),
    ('taihv', 'taihv@example.com', 'TP'),
    ('huongdb', 'huongdb@example.com', 'TP'),
    ('hapm', 'hapm@example.com', 'TP'),
    ('oanhnk', 'oanhnk@example.com', 'CV'),
    ('maitp', 'maitp@example.com', 'CV'),
    ('sonng', 'sonng@example.com', 'CV'),
    ('mytt', 'mytt@example.com', 'VT'),
    ('chaudk', 'chaudk@example.com', 'TP'),
    ('oanhlt2', 'oanhlt2@example.com', 'TP'),
    ('vinhnt', 'vinhnt@example.com', 'VT'),
    ('nhungpk', 'nhungpk@example.com', 'CV'),
    ('phuchh', 'phuchh@example.com', 'TP'),
    ('anlt', 'anlt@example.com', 'TP'),
    ('annt', 'annt@example.com', 'TP'),
    ('cuongbc', 'cuongbc@example.com', 'CV'),
    ('nhungvd', 'nhungvd@example.com', 'CV'),
    ('hungnt', 'hungnt@example.com', 'VT'),
    ('oanhvt', 'oanhvt@example.com', 'TP'),
    ('phuongbk', 'phuongbk@example.com', 'TP'),
    ('huongvn', 'huongvn@example.com', 'CV'),
    ('chautk', 'chautk@example.com', 'CV'),
    ('oanhln', 'oanhln@example.com', 'VT'),
    ('dungvd', 'dungvd@example.com', 'TP'),
    ('datbc', 'datbc@example.com', 'TP'),
    ('anpm', 'anpm@example.com', 'TP'),
    ('quantt', 'quantt@example.com', 'CV'),
    ('phuonght', 'phuonght@example.com', 'CV'),
    ('hant', 'hant@example.com', 'VT'),
    ('dungnq', 'dungnq@example.com', 'TP'),
    ('vyhd', 'vyhd@example.com', 'TP'),
    ('havt', 'havt@example.com', 'CV'),
    ('dungnh', 'dungnh@example.com', 'CV'),
    ('trangtt', 'trangtt@example.com', 'VT'),
    ('halt2', 'halt2@example.com', 'TP'),
    ('annh', 'annh@example.com', 'TP'),
    ('namlc', 'namlc@example.com', 'CV'),
    ('haihh', 'haihh@example.com', 'CV'),
    ('taidv', 'taidv@example.com', 'VT'),
    ('ngank', 'ngank@example.com', 'TP'),
    ('mytk', 'mytk@example.com', 'TP'),
    ('tudh', 'tudh@example.com', 'CV'),
    ('oanhvk', 'oanhvk@example.com', 'CV'),
    ('quanvt', 'quanvt@example.com', 'VT'),
    ('longvq', 'longvq@example.com', 'TP'),
    ('haivc', 'haivc@example.com', 'TP'),
    ('maidt', 'maidt@example.com', 'TP'),
    ('quynhvk', 'quynhvk@example.com', 'CV'),
    ('landt', 'landt@example.com', 'CV'),
    ('thangdc', 'thangdc@example.com', 'VT'),
    ('vietdq', 'vietdq@example.com', 'TP'),
    ('vinhdv', 'vinhdv@example.com', 'TP'),
    ('vyvn', 'vyvn@example.com', 'TP'),
    ('dungdt', 'dungdt@example.com', 'CV'),
    ('anng', 'anng@example.com', 'CV'),
    ('vydt', 'vydt@example.com', 'VT'),
    ('phuongbk2', 'phuongbk2@example.com', 'TP'),
    ('mylm', 'mylm@example.com', 'TP'),
    ('phuonghk', 'phuonghk@example.com', 'TP'),
    ('nhungdd', 'nhungdd@example.com', 'CV'),
    ('cuonghg', 'cuonghg@example.com', 'CV'),
    ('havt2', 'havt2@example.com', 'VT'),
    ('linhlb', 'linhlb@example.com', 'TP'),
    ('oanhbp', 'oanhbp@example.com', 'TP'),
    ('hadb', 'hadb@example.com', 'CV'),
    ('quanht', 'quanht@example.com', 'CV'),
    ('tranghn', 'tranghn@example.com', 'VT'),
    ('andc', 'andc@example.com', 'TP'),
    ('thangdm', 'thangdm@example.com', 'TP'),
    ('trungdd', 'trungdd@example.com', 'CV'),
    ('nhunght', 'nhunght@example.com', 'CV'),
    ('thangnq', 'thangnq@example.com', 'VT'),
    ('haln', 'haln@example.com', 'TP'),
    ('giangnn', 'giangnn@example.com', 'TP'),
    ('lanhd', 'lanhd@example.com', 'CV'),
    ('anhnt', 'anhnt@example.com', 'CV'),
    ('anhlt', 'anhlt@example.com', 'VT'),
    ('phuonghk2', 'phuonghk2@example.com', 'TP'),
    ('dungnv', 'dungnv@example.com', 'TP'),
    ('mybk', 'mybk@example.com', 'CV'),
    ('dattq', 'dattq@example.com', 'CV'),
    ('mypm', 'mypm@example.com', 'VT'),
    ('longht', 'longht@example.com', 'TP'),
    ('hanhtt', 'hanhtt@example.com', 'TP'),
    ('trangdk', 'trangdk@example.com', 'TP'),
    ('sonpd', 'sonpd@example.com', 'CV'),
    ('oanhvk2', 'oanhvk2@example.com', 'CV'),
    ('binhdv', 'binhdv@example.com', 'VT'),
    ('anhpk', 'anhpk@example.com', 'TP'),
    ('trungpq', 'trungpq@example.com', 'TP'),
    ('ngahb', 'ngahb@example.com', 'TP'),
    ('tudg', 'tudg@example.com', 'CV'),
    ('thangpc', 'thangpc@example.com', 'CV'),
    ('binhbd', 'binhbd@example.com', 'VT'),
    ('hanhlt', 'hanhlt@example.com', 'TP'),
    ('hanb', 'hanb@example.com', 'TP'),
    ('tainc', 'tainc@example.com', 'CV'),
    ('tudv', 'tudv@example.com', 'CV'),
    ('vyhd2', 'vyhd2@example.com', 'VT'),
    ('anlh', 'anlh@example.com', 'TP'),
    ('tung', 'tung@example.com', 'TP'),
    ('anlh2', 'anlh2@example.com', 'TP'),
    ('haipm', 'haipm@example.com', 'CV'),
    ('sonpv', 'sonpv@example.com', 'CV'),
    ('phuonghk3', 'phuonghk3@example.com', 'VT'),
    ('vietpm', 'vietpm@example.com', 'TP'),
    ('thanghd2', 'thanghd2@example.com', 'TP'),
    ('trangnt', 'trangnt@example.com', 'CV'),
    ('namvh', 'namvh@example.com', 'CV'),
    ('oanhtk', 'oanhtk@example.com', 'VT'),
    ('thangvh', 'thangvh@example.com', 'TP'),
    ('hanhdk', 'hanhdk@example.com', 'TP'),
    ('tailc', 'tailc@example.com', 'CV'),
    ('namdt', 'namdt@example.com', 'CV'),
    ('uyennp', 'uyennp@example.com', 'VT'),
    ('tranglk', 'tranglk@example.com', 'TP'),
    ('viethv', 'viethv@example.com', 'TP'),
    ('chaupt', 'chaupt@example.com', 'TP'),
    ('andd2', 'andd2@example.com', 'CV'),
    ('linhlk', 'linhlk@example.com', 'CV'),
    ('mailk', 'mailk@example.com', 'VT'),
    ('vypk2', 'vypk2@example.com', 'TP'),
    ('haht', 'haht@example.com', 'TP'),
    ('chaulk', 'chaulk@example.com', 'CV'),
    ('landt2', 'landt2@example.com', 'CV'),
    ('hahd', 'hahd@example.com', 'VT'),
    ('longhh2', 'longhh2@example.com', 'TP'),
    ('thaotk', 'thaotk@example.com', 'TP'),
    ('thanglq', 'thanglq@example.com', 'CV'),
    ('trungth', 'trungth@example.com', 'CV'),
    ('huongpt', 'huongpt@example.com', 'VT'),
    ('thaotd', 'thaotd@example.com', 'TP'),
    ('datpq', 'datpq@example.com', 'TP'),
    ('vinhht', 'vinhht@example.com', 'CV'),
    ('ngatb', 'ngatb@example.com', 'CV'),
    ('mylk', 'mylk@example.com', 'VT'),
    ('vyvp', 'vyvp@example.com', 'TP'),
    ('giangvd', 'giangvd@example.com', 'TP'),
    ('huongnk', 'huongnk@example.com', 'TP'),
    ('datvt', 'datvt@example.com', 'CV'),
    ('antm', 'antm@example.com', 'CV'),
    ('khoalv', 'khoalv@example.com', 'VT'),
    ('anhtn', 'anhtn@example.com', 'TP'),
    ('giangbb', 'giangbb@example.com', 'TP'),
    ('thaotk2', 'thaotk2@example.com', 'CV'),
    ('nhungnt', 'nhungnt@example.com', 'CV'),
    ('huongdk2', 'huongdk2@example.com', 'VT'),
    ('thangtg', 'thangtg@example.com', 'TP'),
    ('trangpt', 'trangpt@example.com', 'TP'),
    ('taipt', 'taipt@example.com', 'CV'),
    ('thangtt2', 'thangtt2@example.com', 'CV'),
    ('phuongpt', 'phuongpt@example.com', 'VT'),
    ('namlc2', 'namlc2@example.com', 'TP'),
    ('vietnc', 'vietnc@example.com', 'TP'),
    ('dunglv3', 'dunglv3@example.com', 'TP'),
    ('taitm', 'taitm@example.com', 'CV'),
    ('cuongpt', 'cuongpt@example.com', 'CV'),
    ('mydb', 'mydb@example.com', 'VT'),
    ('nhungvn', 'nhungvn@example.com', 'TP'),
    ('mydt', 'mydt@example.com', 'TP'),
    ('quynhdm', 'quynhdm@example.com', 'TP'),
    ('thanglh', 'thanglh@example.com', 'CV'),
    ('chaupb', 'chaupb@example.com', 'CV'),
    ('dungtt', 'dungtt@example.com', 'VT'),
    ('uyentn', 'uyentn@example.com', 'TP'),
    ('cuongvh', 'cuongvh@example.com', 'TP'),
    ('quynhln', 'quynhln@example.com', 'TP'),
    ('khoalh', 'khoalh@example.com', 'CV'),
    ('linhnn', 'linhnn@example.com', 'CV'),
    ('quynhnn', 'quynhnn@example.com', 'VT'),
    ('halk', 'halk@example.com', 'TP'),
    ('dunglk', 'dunglk@example.com', 'TP'),
    ('phuongdb', 'phuongdb@example.com', 'TP'),
    ('longdh', 'longdh@example.com', 'CV'),
    ('chaupm', 'chaupm@example.com', 'CV'),
    ('binhbd2', 'binhbd2@example.com', 'VT'),
    ('quynhtn', 'quynhtn@example.com', 'TP'),
    ('namlh', 'namlh@example.com', 'TP'),
    ('khoatm', 'khoatm@example.com', 'CV'),
    ('vietpt', 'vietpt@example.com', 'CV'),
    ('mydd', 'mydd@example.com', 'VT'),
    ('huongvk2', 'huongvk2@example.com', 'TP'),
    ('phuongdk', 'phuongdk@example.com', 'TP'),
    ('trangdd', 'trangdd@example.com', 'CV'),
    ('hanhdp', 'hanhdp@example.com', 'CV'),
    ('quynhhm', 'quynhhm@example.com', 'VT'),
    ('dungph', 'dungph@example.com', 'TP'),
    ('quynhht', 'quynhht@example.com', 'TP'),
    ('maipt', 'maipt@example.com', 'CV'),
    ('thanghd3', 'thanghd3@example.com', 'CV'),
    ('uyenht', 'uyenht@example.com', 'VT'),
    ('maidb', 'maidb@example.com', 'TP'),
    ('anph', 'anph@example.com', 'TP'),
    ('namlm', 'namlm@example.com', 'CV'),
    ('trungvd', 'trungvd@example.com', 'CV'),
    ('hatt', 'hatt@example.com', 'VT'),
    ('sontd2', 'sontd2@example.com', 'TP'),
    ('datlg', 'datlg@example.com', 'TP'),
    ('anhdk', 'anhdk@example.com', 'CV'),
    ('tranglm', 'tranglm@example.com', 'CV'),
    ('haivh2', 'haivh2@example.com', 'VT'),
    ('taihh', 'taihh@example.com', 'TP'),
    ('dunghb', 'dunghb@example.com', 'TP'),
    ('nhungvt', 'nhungvt@example.com', 'TP'),
    ('nhungnp', 'nhungnp@example.com', 'CV'),
    ('dunghp', 'dunghp@example.com', 'CV'),
    ('oanhdn', 'oanhdn@example.com', 'VT'),
    ('hanhdb', 'hanhdb@example.com', 'TP'),
    ('hieupc', 'hieupc@example.com', 'TP'),
    ('dunght', 'dunght@example.com', 'TP'),
    ('anhdb', 'anhdb@example.com', 'CV'),
    ('hungdq2', 'hungdq2@example.com', 'CV'),
    ('maint', 'maint@example.com', 'VT'),
    ('uyenpk', 'uyenpk@example.com', 'TP'),
    ('phuongdk2', 'phuongdk2@example.com', 'TP'),
    ('khoang', 'khoang@example.com', 'TP'),
    ('oanhht', 'oanhht@example.com', 'CV'),
    ('dungdv2', 'dungdv2@example.com', 'CV'),
    ('halt3', 'halt3@example.com', 'VT'),
    ('vinhdd', 'vinhdd@example.com', 'TP'),
    ('huongnm', 'huongnm@example.com', 'TP'),
    ('linhhm', 'linhhm@example.com', 'TP'),
    ('ngabd', 'ngabd@example.com', 'CV'),
    ('lanhm', 'lanhm@example.com', 'CV'),
    ('vinhph', 'vinhph@example.com', 'VT'),
    ('taibm', 'taibm@example.com', 'TP'),
    ('tudc', 'tudc@example.com', 'TP'),
    ('lanhp2', 'lanhp2@example.com', 'TP'),
    ('gianglt', 'gianglt@example.com', 'CV'),
    ('taidh', 'taidh@example.com', 'CV'),
    ('myvd', 'myvd@example.com', 'VT'),
    ('myhm', 'myhm@example.com', 'TP'),
    ('dungdt2', 'dungdt2@example.com', 'TP'),
    ('maidk', 'maidk@example.com', 'CV'),
    ('vydd', 'vydd@example.com', 'CV'),
    ('hieutd', 'hieutd@example.com', 'VT'),
    ('datnm', 'datnm@example.com', 'TP'),
    ('vydt2', 'vydt2@example.com', 'TP'),
    ('datlh', 'datlh@example.com', 'TP'),
    ('vinhnh', 'vinhnh@example.com', 'CV'),
    ('hungnt2', 'hungnt2@example.com', 'CV'),
    ('vinhht2', 'vinhht2@example.com', 'VT'),
    ('uyenbk', 'uyenbk@example.com', 'TP'),
    ('mydp', 'mydp@example.com', 'TP'),
    ('namdt2', 'namdt2@example.com', 'TP'),
    ('quanhm', 'quanhm@example.com', 'CV'),
    ('vinhbt', 'vinhbt@example.com', 'CV'),
    ('dungdq', 'dungdq@example.com', 'VT'),
    ('linhpt', 'linhpt@example.com', 'TP'),
    ('trungtd', 'trungtd@example.com', 'TP'),
    ('dungdv3', 'dungdv3@example.com', 'CV'),
    ('haihg', 'haihg@example.com', 'CV'),
    ('sonlm', 'sonlm@example.com', 'VT'),
    ('anvd', 'anvd@example.com', 'TP'),
    ('lannk', 'lannk@example.com', 'TP'),
    ('ngahd', 'ngahd@example.com', 'TP'),
    ('phuongnn', 'phuongnn@example.com', 'CV'),
    ('thangdt', 'thangdt@example.com', 'CV'),
    ('phuonglp', 'phuonglp@example.com', 'VT'),
    ('vietvg', 'vietvg@example.com', 'TP'),
    ('tudq', 'tudq@example.com', 'TP'),
    ('dathq', 'dathq@example.com', 'CV'),
    ('hanhht', 'hanhht@example.com', 'CV'),
    ('vinhdt', 'vinhdt@example.com', 'VT'),
    ('phuongdt', 'phuongdt@example.com', 'TP'),
    ('hungdv', 'hungdv@example.com', 'TP'),
    ('anhdp', 'anhdp@example.com', 'TP'),
    ('dungdt3', 'dungdt3@example.com', 'CV'),
    ('oanhdk', 'oanhdk@example.com', 'CV'),
    ('trunglh', 'trunglh@example.com', 'VT'),
    ('haild', 'haild@example.com', 'TP'),
    ('thangtm', 'thangtm@example.com', 'TP'),
    ('anhht3', 'anhht3@example.com', 'TP'),
    ('thaovk2', 'thaovk2@example.com', 'CV'),
    ('binhhc', 'binhhc@example.com', 'CV'),
    ('phucth', 'phucth@example.com', 'VT'),
    ('anhnm', 'anhnm@example.com', 'TP'),
    ('binhbh', 'binhbh@example.com', 'TP'),
    ('binhph', 'binhph@example.com', 'TP'),
    ('taipc', 'taipc@example.com', 'CV'),
    ('maihk', 'maihk@example.com', 'CV'),
    ('longdt', 'longdt@example.com', 'VT'),
    ('cuonghm', 'cuonghm@example.com', 'TP'),
    ('longbt', 'longbt@example.com', 'TP'),
    ('khoaht', 'khoaht@example.com', 'CV'),
    ('maibk', 'maibk@example.com', 'CV'),
    ('demo_nghiviec', 'demo_nghiviec@example.com', 'CV'),
    ('namnh', 'namnh@example.com', 'CV'),
    ('uyendk', 'uyendk@example.com', 'CV'),
    ('mainb', 'mainb@example.com', 'CV'),
    ('demo_bgd_1', 'demo_bgd_1@example.com', 'BGD'),
    ('demo_bgd_2', 'demo_bgd_2@example.com', 'BGD'),
    ('demo_bgd_3', 'demo_bgd_3@example.com', 'BGD'),
    ('demo_bgd_4', 'demo_bgd_4@example.com', 'BGD'),
    ('demo_tlbgd_1', 'demo_tlbgd_1@example.com', 'CV,TLBGD'),
    ('demo_tlbgd_2', 'demo_tlbgd_2@example.com', 'CV,TLBGD'),
    ('demo_tlbgd_3', 'demo_tlbgd_3@example.com', 'CV,TLBGD'),
    ('demo_tlbgd_4', 'demo_tlbgd_4@example.com', 'CV,TLBGD'),
    ('demo_kt_1', 'demo_kt_1@example.com', 'CV,KT'),
    ('demo_kt_2', 'demo_kt_2@example.com', 'CV,KT'),
    ('demo_kt_3', 'demo_kt_3@example.com', 'CV,KT'),
    ('demo_kt_4', 'demo_kt_4@example.com', 'CV,KT'),
    ('demo_tp_1', 'demo_tp_1@example.com', 'TP'),
    ('demo_tp_2', 'demo_tp_2@example.com', 'TP'),
    ('demo_tp_3', 'demo_tp_3@example.com', 'TP'),
    ('demo_tp_4', 'demo_tp_4@example.com', 'TP'),
    ('demo_cv_1', 'demo_cv_1@example.com', 'CV'),
    ('demo_cv_2', 'demo_cv_2@example.com', 'CV'),
    ('demo_cv_3', 'demo_cv_3@example.com', 'CV'),
    ('demo_cv_4', 'demo_cv_4@example.com', 'CV'),
    ('demo_vt_1', 'demo_vt_1@example.com', 'VT'),
    ('demo_vt_2', 'demo_vt_2@example.com', 'VT'),
    ('demo_vt_3', 'demo_vt_3@example.com', 'VT'),
    ('demo_vt_4', 'demo_vt_4@example.com', 'VT'),
    ('teiusoa', 'teiusoa@gmail.com', 'TP'),
    ('em123ngao-arch', 'em123ngao-arch@gmail.com', 'CV'),
    ('nguyenanhdo0949-create', 'nguyenanhdo0949-create@gmail.com', 'VT'),
    ('phantahuuduc', 'phantahuuduc@gmail.com', 'TP'),
    ('thanhhau15112000-dev', 'thanhhau15112000-dev@gmail.com', 'TP'),
    ('sidehieu03', 'sidehieu03@gmail.com', 'CV'),
    ('hieunguyen_pro1919', 'hieunguyen.pro1919@gmail.com', 'CV'),
    ('khanhledz8899', 'khanhledz8899@gmail.com', 'ADMIN'),
    ('khiemtan1712', 'khiemtan1712@gmail.com', 'VT'),
    ('kietphuchau', 'kietphuchau@gmail.com', 'TP'),
    ('kietle205thll-bot', 'kietle205thll-bot@gmail.com', 'TP'),
    ('tnha4209', 'tnha4209@gmail.com', 'CV'),
    ('nhi150807', 'nhi150807@gmail.com', 'VT'),
    ('dongocphat007-ctrl', 'dongocphat007-ctrl@gmail.com', 'CV'),
    ('dot207208972', 'dot207208972@gmail.com', 'VT'),
    ('nguyenduyquan0609', 'nguyenduyquan0609@gmail.com', 'CV'),
    ('domanhquang2006-ops', 'domanhquang2006-ops@gmail.com', 'CV'),
    ('quynhzgaming', 'quynhzgaming@gmail.com', 'TP'),
    ('krvin2007', 'krvin2007@gmail.com', 'CV'),
    ('thanhtan1208', 'thanhtan1208@gmail.com', 'ADMIN'),
    ('tanbimat', 'tanbimat@gmail.com', 'VT'),
    ('thinhabc27-sys', 'thinhabc27-sys@gmail.com', 'TP'),
    ('ctnn1001', 'ctnn1001@gmail.com', 'VT'),
    ('tinh90020', 'tinh90020@gmail.com', 'CV'),
    ('tranghuynh_it_work', 'tranghuynh.it.work@gmail.com', 'VT'),
    ('hoctap970-cloud', 'hoctap970-cloud@gmail.com', 'VT'),
    ('lamchivi2k7', 'lamchivi2k7@gmail.com', 'CV'),
    ('duytp', '26948006@grad.uit.edu.vn', 'ADMIN')
) AS source (username, email, group_codes)
JOIN accounts_employee employee
    ON employee.username = source.username AND employee.email = source.email
CROSS JOIN LATERAL regexp_split_to_table(source.group_codes, ',') AS role(code)
JOIN auth_group access_group ON access_group.ma_nhom_quyen = btrim(role.code)
ON CONFLICT (employee_id, group_id) DO NOTHING;

-- Nạp 8 phòng họp mẫu.
INSERT INTO meetings_meetingroom (
    name, location, capacity, amenities, is_public, trang_thai, ghi_chu
)
VALUES
    ('Phòng họp lớn tầng 10', 'Trụ sở chính - Tầng 10', '40', 'Máy chiếu, Micro, Video conference', TRUE, 'AVAILABLE'::meetingroom_status, NULL),
    ('Phòng họp HĐQT', 'Trụ sở chính - Tầng 12', '16', 'Màn hình 85 inch, Micro, Ghi âm', FALSE, 'AVAILABLE'::meetingroom_status, NULL),
    ('Phòng họp Ban điều hành', 'Trụ sở chính - Tầng 11', '20', 'Màn hình, Video conference', TRUE, 'AVAILABLE'::meetingroom_status, NULL),
    ('Phòng họp nhỏ A', 'Trụ sở chính - Tầng 8', '8', 'TV, Bảng trắng', TRUE, 'AVAILABLE'::meetingroom_status, NULL),
    ('Phòng họp nhỏ B', 'Trụ sở chính - Tầng 8', '6', 'Bảng trắng', TRUE, 'MAINTENANCE'::meetingroom_status, NULL),
    ('Phòng đào tạo', 'Trụ sở chính - Tầng 5', '60', 'Máy chiếu, Âm thanh, 60 ghế', TRUE, 'AVAILABLE'::meetingroom_status, NULL),
    ('Phòng họp trực tuyến', 'Trụ sở chính - Tầng 9', '12', 'Video conference, Camera 4K', TRUE, 'AVAILABLE'::meetingroom_status, NULL),
    ('Phòng họp chi nhánh Hà Nội', 'Bảo Long Hà Nội - Tầng 3', '15', 'Máy chiếu', TRUE, 'UNAVAILABLE'::meetingroom_status, NULL)
ON CONFLICT (name) DO NOTHING;

-- Nạp 36 lịch họp mẫu; bỏ qua bản trùng và khung giờ đã có người đặt.
INSERT INTO meetings_meetingbooking (
    room_id, organizer_id, department_id, title, date, start_time, end_time,
    attendees_count, purpose, trang_thai
)
SELECT
    room.id,
    organizer.id,
    department.id,
    source.title,
    source.meeting_date::date,
    source.start_time::time,
    source.end_time::time,
    source.attendees_count::integer,
    source.purpose,
    source.trang_thai::meetingbooking_status
FROM (
    VALUES
    ('Phòng họp HĐQT', 'ngank', 'ngank@example.com', 'Bảo Long Nam Sài Gòn', 'Họp dự án chuyển đổi số', '2026-10-12', '08:00:00', '09:30:00', '6', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),
    ('Phòng họp nhỏ A', 'namlc', 'namlc@example.com', 'Bảo Long Bến Thành', 'Họp dự án chuyển đổi số', '2026-10-12', '15:15:00', '16:45:00', '6', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp Ban điều hành', 'mainb', 'mainb@example.com', 'Ban kế toán', 'Họp hội đồng thẩm định', '2026-10-13', '13:30:00', '15:00:00', '11', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp lớn tầng 10', 'hanhtt', 'hanhtt@example.com', 'Bảo Long Thái Nguyên', 'Họp giao ban tuần', '2026-10-13', '15:15:00', '16:45:00', '38', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp Ban điều hành', 'trunglt', 'trunglt@example.com', 'Ban dự án lớn', 'Họp triển khai kế hoạch quý', '2026-10-14', '09:45:00', '11:15:00', '12', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp Ban điều hành', 'hieuvm', 'hieuvm@example.com', 'Ban khách hàng cá nhân', 'Họp tổng kết tháng', '2026-10-14', '15:15:00', '16:45:00', '15', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp nhỏ A', 'tulc', 'tulc@example.com', 'Ban quản lý rủi ro và tuân thủ', 'Họp giao ban tuần', '2026-10-14', '15:15:00', '16:45:00', '8', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp trực tuyến', 'nhungvn', 'nhungvn@example.com', 'Bảo Long KV Tây Nguyên (Daklak)', 'Trao đổi quy trình bồi thường', '2026-10-15', '15:15:00', '16:45:00', '12', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),
    ('Phòng họp trực tuyến', 'longhh2', 'longhh2@example.com', 'Bảo Long Đông Hải', 'Phỏng vấn tuyển dụng', '2026-10-19', '08:00:00', '09:30:00', '3', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp trực tuyến', 'haivh2', 'haivh2@example.com', 'Bảo Long Bình Thuận', 'Trao đổi quy trình bồi thường', '2026-10-21', '13:30:00', '15:00:00', '5', 'Nội dung mẫu phục vụ demo', 'COMPLETED'),
    ('Phòng họp HĐQT', 'hungnt2', 'hungnt2@example.com', 'Bảo Long Vũng Tàu', 'Họp giao ban tuần', '2026-10-21', '15:15:00', '16:45:00', '5', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),
    ('Phòng họp lớn tầng 10', 'vypk', 'vypk@example.com', 'Ban dự án phát triển sản phẩm liên kết với các công ty dịch vụ viễn thông', 'Họp giao ban tuần', '2026-10-22', '08:00:00', '09:30:00', '40', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp HĐQT', 'thanglq', 'thanglq@example.com', 'Bảo Long Đông Hải', 'Họp tổng kết tháng', '2026-10-22', '09:45:00', '11:15:00', '13', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp trực tuyến', 'phuongvn', 'phuongvn@example.com', 'Ban khách hàng qua môi giới', 'Phỏng vấn tuyển dụng', '2026-10-22', '09:45:00', '11:15:00', '12', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp trực tuyến', 'dunglk', 'dunglk@example.com', 'Bảo Long Đà Nẵng', 'Trao đổi quy trình bồi thường', '2026-10-22', '15:15:00', '16:45:00', '7', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp nhỏ A', 'maidt', 'maidt@example.com', 'Bảo Long Tân Sơn Nhất', 'Họp giao ban tuần', '2026-10-23', '08:00:00', '09:30:00', '6', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp HĐQT', 'mydt', 'mydt@example.com', 'Bảo Long KV Tây Nguyên (Daklak)', 'Họp hội đồng thẩm định', '2026-10-23', '09:45:00', '11:15:00', '12', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp HĐQT', 'hungnv', 'hungnv@example.com', 'Ban dự án khách hàng qua đại lý', 'Rà soát hợp đồng bảo hiểm', '2026-10-23', '13:30:00', '15:00:00', '8', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng đào tạo', 'myvd', 'myvd@example.com', 'Trung tâm kinh doanh Sông Hàn', 'Họp tổng kết tháng', '2026-10-23', '13:30:00', '15:00:00', '24', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp lớn tầng 10', 'mydb', 'mydb@example.com', 'Bảo Long Thanh Hóa', 'Họp tổng kết tháng', '2026-10-26', '08:00:00', '09:30:00', '13', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp trực tuyến', 'phuongdb', 'phuongdb@example.com', 'Bảo Long Đà Nẵng', 'Đào tạo nghiệp vụ', '2026-10-26', '08:00:00', '09:30:00', '9', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp nhỏ A', 'cuongpc', 'cuongpc@example.com', 'Ban truyền thông và marketing', 'Phỏng vấn tuyển dụng', '2026-10-27', '09:45:00', '11:15:00', '8', 'Nội dung mẫu phục vụ demo', 'CANCELLED'),
    ('Phòng họp HĐQT', 'dungdv3', 'dungdv3@example.com', 'Bảo Long Tây Ninh', 'Họp dự án chuyển đổi số', '2026-10-27', '15:15:00', '16:45:00', '6', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp lớn tầng 10', 'maivt', 'maivt@example.com', 'Ban tổng giám đốc', 'Rà soát hợp đồng bảo hiểm', '2026-10-27', '15:15:00', '16:45:00', '25', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp nhỏ A', 'anhlt', 'anhlt@example.com', 'Bảo Long Thủ Đô', 'Họp giao ban tuần', '2026-10-27', '15:15:00', '16:45:00', '3', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp lớn tầng 10', 'thangdt', 'thangdt@example.com', 'Bảo Long Long An', 'Họp triển khai kế hoạch quý', '2026-10-28', '13:30:00', '15:00:00', '39', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp lớn tầng 10', 'huongpd', 'huongpd@example.com', 'Giám đốc vùng', 'Họp với đối tác', '2026-10-28', '15:15:00', '16:45:00', '14', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp trực tuyến', 'dunglk', 'dunglk@example.com', 'Bảo Long Đà Nẵng', 'Trao đổi quy trình bồi thường', '2026-10-29', '09:45:00', '11:15:00', '8', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp lớn tầng 10', 'trunglh', 'trunglh@example.com', 'Bảo Long Cà Mau', 'Họp dự án chuyển đổi số', '2026-10-29', '15:15:00', '16:45:00', '5', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng đào tạo', 'huongvk', 'huongvk@example.com', 'Ban khách hàng qua môi giới', 'Họp tổng kết tháng', '2026-10-30', '13:30:00', '15:00:00', '49', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp HĐQT', 'anhnt', 'anhnt@example.com', 'Bảo Long Thủ Đô', 'Họp giao ban tuần', '2026-11-02', '13:30:00', '15:00:00', '5', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp Ban điều hành', 'anhdp', 'anhdp@example.com', 'Bảo Long Cà Mau', 'Họp tổng kết tháng', '2026-11-03', '13:30:00', '15:00:00', '10', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp nhỏ A', 'longdt', 'longdt@example.com', 'Bảo Long Đồng Tháp', 'Họp dự án chuyển đổi số', '2026-11-03', '13:30:00', '15:00:00', '2', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp lớn tầng 10', 'anhdk', 'anhdk@example.com', 'Bảo Long Bình Thuận', 'Phỏng vấn tuyển dụng', '2026-11-03', '15:15:00', '16:45:00', '5', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp Ban điều hành', 'demo_vt_2', 'demo_vt_2@example.com', 'Ban hành chính quản trị', 'Họp với đối tác', '2026-11-04', '13:30:00', '15:00:00', '14', 'Nội dung mẫu phục vụ demo', 'CONFIRMED'),
    ('Phòng họp HĐQT', 'binhdd', 'binhdd@example.com', 'Hội đồng quản trị', 'Họp tổng kết tháng', '2026-11-04', '15:15:00', '16:45:00', '6', 'Nội dung mẫu phục vụ demo', 'CONFIRMED')
) AS source (
    room_name, username, email, department_name, title, meeting_date,
    start_time, end_time, attendees_count, purpose, trang_thai
)
JOIN meetings_meetingroom room ON room.name = source.room_name
JOIN accounts_employee organizer
    ON organizer.username = source.username AND organizer.email = source.email
LEFT JOIN organizations_donvi department ON department.ten = source.department_name
WHERE (source.department_name IS NULL OR department.id IS NOT NULL)
  AND NOT EXISTS (
      SELECT 1
      FROM meetings_meetingbooking existing
      WHERE existing.room_id = room.id
        AND existing.organizer_id = organizer.id
        AND existing.date = source.meeting_date::date
        AND existing.start_time = source.start_time::time
        AND existing.end_time = source.end_time::time
        AND existing.title = source.title
  )
  AND (
      source.trang_thai = 'CANCELLED'
      OR NOT EXISTS (
          SELECT 1
          FROM meetings_meetingbooking occupied
          WHERE occupied.room_id = room.id
            AND occupied.date = source.meeting_date::date
            AND occupied.trang_thai <> 'CANCELLED'
            AND occupied.start_time < source.end_time::time
            AND source.start_time::time < occupied.end_time
      )
  );

-- Nạp 16 lời chúc sinh nhật mẫu.
INSERT INTO birthdays_birthdaywish (
    employee_id, sender_name, message, card_template, is_anonymous, trang_thai
)
SELECT
    employee.id,
    source.sender_name,
    source.message,
    source.card_template,
    source.is_anonymous,
    source.trang_thai::birthdaywish_status
FROM (
    VALUES
    ('hanhlb2', 'hanhlb2@example.com', 'Huỳnh Thu Quỳnh', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),
    ('hungnt', 'hungnt@example.com', 'Huỳnh Kim Phương', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'APPROVED'),
    ('chautk', 'chautk@example.com', 'Phan Tuấn Hải', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'APPROVED'),
    ('oanhtk', 'oanhtk@example.com', 'Ẩn danh', 'Chúc sinh nhật ấm áp bên gia đình và đồng nghiệp.', 'GOLDEN', TRUE, 'APPROVED'),
    ('thangtg', 'thangtg@example.com', 'Trần Khánh Thảo', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),
    ('thangtt2', 'thangtt2@example.com', 'Hoàng Bảo Hà', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'PENDING'),
    ('dunglk', 'dunglk@example.com', 'Huỳnh Thị Nga', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),
    ('datnm', 'datnm@example.com', 'Bùi Diệu Nga', 'Happy birthday! Chúc một năm làm việc hiệu quả.', 'GOLDEN', FALSE, 'APPROVED'),
    ('hanhlb2', 'hanhlb2@example.com', 'Hoàng Kim Mai', 'Happy birthday! Chúc một năm làm việc hiệu quả.', 'GOLDEN', FALSE, 'APPROVED'),
    ('hungnt', 'hungnt@example.com', 'Ngô Diệu Lan', 'Chúc sinh nhật ấm áp bên gia đình và đồng nghiệp.', 'GOLDEN', FALSE, 'REJECTED'),
    ('chautk', 'chautk@example.com', 'Ẩn danh', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', TRUE, 'APPROVED'),
    ('oanhtk', 'oanhtk@example.com', 'Bùi Thành Vinh', 'Happy birthday! Chúc một năm làm việc hiệu quả.', 'GOLDEN', FALSE, 'PENDING'),
    ('thangtg', 'thangtg@example.com', 'Đặng Bảo Hương', 'Chúc tuổi mới thành công và hạnh phúc!', 'GOLDEN', FALSE, 'APPROVED'),
    ('thangtt2', 'thangtt2@example.com', 'Phạm Tuấn Tài', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED'),
    ('dunglk', 'dunglk@example.com', 'Võ Đức An', 'Chúc anh/chị sinh nhật vui vẻ, nhiều sức khỏe!', 'GOLDEN', FALSE, 'APPROVED'),
    ('datnm', 'datnm@example.com', 'Trần Quốc Đạt', 'Chúc mừng sinh nhật, chúc mọi điều tốt đẹp!', 'GOLDEN', FALSE, 'APPROVED')
) AS source (username, email, sender_name, message, card_template, is_anonymous, trang_thai)
JOIN accounts_employee employee
    ON employee.username = source.username AND employee.email = source.email
WHERE NOT EXISTS (
    SELECT 1
    FROM birthdays_birthdaywish existing
    WHERE existing.employee_id = employee.id
      AND existing.sender_name = source.sender_name
      AND existing.message = source.message
);
