# Trạng thái và bằng chứng bàn giao Nhóm 3

Cập nhật 24/10/2026, staging đối chiếu `7084840b41c2ba8bb4fab240121f054ac9475fa1`. Đây là trạng thái kiểm chứng, không xác nhận #224 đã merge hoặc đã deploy staging.

## Phạm vi

Hồ sơ cấp 1 → Loại văn bản cấp 2 → popup chọn đến/đi và nội bộ/hạn chế → danh sách dùng chung → chọn văn bản cụ thể để mở chi tiết. ID hồ sơ/loại/văn bản phải tách biệt.

Không có danh sách/API metadata Văn bản riêng trong Records. Tạo mới dùng chức năng Nhóm 2; không thêm tự điền form trong #223/#224, theo quyết định phạm vi ngày 23/10.

## Source và issue lịch sử

- **#62:** guard model/trigger Hồ sơ chung, trim và test ngoại lệ PostgreSQL đã có trên nền tích hợp. Source có test save/queryset hạ cờ và `DatabaseError`; API thật đã kiểm chặn xóa 409 và validation. Đã đăng bằng chứng và đóng completed ngày 24/10 sau khi người phụ trách duyệt.
- **#149:** #150 đã merge vào nhánh nhóm trước đây, chức năng CRUD hiện có trên staging qua chuỗi #131/#184. UI thật kiểm thêm/sửa/cập nhật danh sách; xóa thực kiểm qua API, xác nhận và Hủy kiểm trên UI. Đã đăng bằng chứng và đóng completed ngày 24/10 sau duyệt; không dùng base nhánh nhóm cũ cho việc mới.
- **#160:** bản sửa #161 được thay thế bởi nền #184. Records hiện có migrations 0001–0003, không phục hồi chain cũ. Gate schema trên head #224 đạt 0 drift/baseline 0. Đã đóng completed ngày 24/10 sau duyệt, theo bản tích hợp thay thế #184.
- **#164:** đã tích hợp qua #185; source có debounce và reload sau CRUD, không còn lời gọi `beginReload`. Full frontend trên #224 đạt; UI thật kiểm tìm theo ký hiệu, đặt lại, dữ liệu sau ghi. Đã đăng kết quả và đóng completed ngày 24/10 sau duyệt.
- **#223/#224:** phần Records ở `a5b45064a31ada9c7c1288fe7cdf5c8e43e80bd0`, PR Draft, chưa merge. Đã kiểm riêng, còn phụ thuộc #229/#230 và nghiệm thu tích hợp cuối.
- **#83/#93:** chỉ cập nhật phần Nhóm 3, không đóng issue hoặc sửa trạng thái duyệt nhóm khác. Đã đăng tiến độ Nhóm 3 ở #83 và cập nhật chính bình luận Nhóm 3 ở #93 sau duyệt, không tạo báo cáo trùng.

Merge #184 `2afecb5` và #185 `19f949d` là tổ tiên của staging đối chiếu. Ngày 24/10, người phụ trách đã duyệt tám nội dung phản hồi và việc đóng bốn issue riêng nêu trên. Đã đăng bảy bình luận mới, cập nhật chính bình luận Nhóm 3 tại #93, xác minh nội dung và trạng thái sau thao tác. #83/#93/#223/#229 vẫn mở; không sửa bảng duyệt hoặc phần nhóm khác.

## CI trên commit popup đã công bố

Các số liệu sau thuộc #224 `a5b4506`, không phải số test của staging mới hoặc PR tài liệu:

- [CI](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/actions/runs/39919422626): success; frontend 530/530, backend 1045 test, không bỏ qua test; gate frontend đạt.
- [DB Integration](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/actions/runs/39919422570): success; PostgreSQL 16, migration/pending, schema 0 drift/baseline 0, build_db, smoke và full backend đạt.
- [Liên kết issue](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/actions/runs/39921656024): success.
- Build còn cảnh báo chunk lớn/plugin timings; không ghi 0 warning. Kết quả local/CI phải gắn commit thực tế.

## Nghiệm thu thật ngày 23/10

Source #224 chạy backend thật trên PostgreSQL 16 riêng, ICU `vi-VN`, DB dựng bằng DDL chuẩn; account, cổng, volume, dữ liệu tổng hợp riêng. Không dùng dữ liệu vận hành.

- Records API: **25/25** đạt, gồm CRUD, trim/rỗng/trùng, quyền, 404, phân trang và xóa tham chiếu/hệ thống.
- Popup UI: **8/8** URL đúng từ hai nguồn × đến/đi × nội bộ/hạn chế.
- HTTP bổ sung: **34/36** đạt. Sáu ca quyền chi tiết Văn bản và hai ca API đủ hồ sơ/loại đạt; hai ca lọc ID loại không có hồ sơ chưa đạt.
- UI đã kiểm: thêm/sửa Hồ sơ/Loại; tìm tức thời/đặt lại; tên URL sai được sửa theo API; Tab/Shift+Tab/Escape/focus; Records/popup VI/EN; danh sách; chi tiết đúng ID/hướng; reload chi tiết đến; 404, thiếu quyền; người nhận/người ngoài với Văn bản đến hạn chế.
- Tạm dừng/chạy lại backend QA để kiểm lỗi kết nối và Thử lại: danh sách phục hồi.
- Xóa thực kiểm qua HTTP; không ghi là đã bấm xác nhận xóa trên UI. Không thử mọi thiết bị/race condition hoặc nghiệm thu dịch vụ xác thực ngoài.

Log/ảnh/manifest/kết quả chi tiết giữ trong bộ QA local bị Git bỏ qua. Không đưa raw log, account, password hoặc ID fixture vào Git/Issue/PR. Số liệu không thay thế nghiệm thu sau bản sửa Văn bản.

## Phần còn chặn toàn luồng

#230 Draft tại `44e52a3952a9f4bc6bed9c69fbcc5339b465c874`, cần đồng bộ staging, giải conflict, chạy CI. Chủ module Văn bản cần:

1. Gửi `ho_so` trong request danh sách đầu trên cả hai hướng.
2. Giữ `ten_ho_so` khi cùng hồ sơ, bỏ tên cũ khi đổi/xóa ID.
3. ID loại lọc FK chính xác, không OR với nội dung/số hiệu.
4. Giữ ACL trước count/phân trang, bàn giao head/CI cuối.

[Bàn giao đã duyệt](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/pull/230#issuecomment-6361307530) ghi tiêu chí. Nghiệm thu thật tái hiện lấy thêm bản ghi sai hồ sơ/loại trên cả hai hướng; đây là lỗi lọc, không phải bằng chứng vượt ACL. Ghi nhận giao diện khác của module Văn bản, nếu cần theo dõi, đi chủ module và issue riêng, không ghép sửa vào Records.

## Checklist còn lại

- [x] Chốt tự điền tạo mới ngoài #223/#224.
- [x] Gửi yêu cầu phối hợp #230 sau duyệt.
- [x] Nghiệm thu riêng Records bằng HTTP/trình duyệt/backend PostgreSQL 16 thật.
- [ ] Nhận bản sửa #230 đồng bộ staging/CI đạt; nghiệm thu lại danh sách/count/chi tiết theo quyền.
- [ ] Đồng bộ #224 với staging cuối và chạy gate trên head mới; không dùng CI head cũ cho head mới.
- [x] Duyệt và đăng phản hồi issue lịch sử, cập nhật đúng bình luận Nhóm 3 #93; đóng riêng #62/#149/#160/#164, giữ issue chung mở.
- [ ] Người phụ trách rà soát PR tài liệu #256 và CI cuối; tự thao tác merge, theo dõi deploy/nghiệm thu staging, không đóng issue chung.

Không ghi ngày chốt tích hợp cố định khi phụ thuộc chưa bàn giao. ETA lịch sử đã qua không được dùng làm trạng thái hiện hành.

## Tài liệu và an toàn

[API](../../modules/03_dossiers_records/api.md), [hướng dẫn Git](../../modules/03_dossiers_records/GROUP3_DEVELOPMENT_GUIDE.md) là tài liệu hiện hành. Việc mới đi issue → nhánh từ staging → PR staging theo AGENTS.md.

PR tài liệu chỉ thay markdown Nhóm 3; không sửa code, DDL/migration, dependency, CI hoặc dữ liệu. Không đổi nhánh của workspace gốc/#224, không merge/deploy staging.
