# Phân công chi tiết & Quy tắc kỹ thuật — Nhóm 7 (bản 2026-09-20 v3)

*Lịch sử: v1 (gốc) → v2 (2026-09-19, Tân chốt lại Phòng họp/Sinh nhật) → **v3 (2026-09-20, Tân chốt lại lần 3): đổi chéo Khánh ↔ Quang, gộp Hiếu+Tình làm chung Phòng họp/Sinh nhật.** Module gốc thầy giao: Phòng họp (0.40), Sinh nhật (0.40), Hệ thống (0.80: Đơn vị/phòng ban, Chức vụ, CBNV, Phân quyền). "Loại tài liệu biểu mẫu" đã chuyển hẳn cho Nhóm 4, không còn thuộc Nhóm 7.*

## 1. Phân công

| Người | Phụ trách | Ghi chú |
| --- | --- | --- |
| Tô Thanh Tân (DA, Trưởng nhóm) | **Phân quyền** (nhóm quyền, gán quyền) + ERD/schema tổng toàn dự án | Không đổi so với các bản trước |
| Lê Duy Khánh | **CBNV** (cán bộ nhân viên) | **Đổi so với v1/v2** (trước là Đơn vị/phòng ban) |
| Đỗ Mạnh Quang | **Đơn vị, phòng ban** (Khối/Khu vực cấp 1 + Đơn vị cấp 2) + **Chức vụ** | **Đổi so với v1/v2** (trước là CBNV) |
| Nguyễn Phan Minh Hiếu + Trần Đình Tình | **Phòng họp** (`PhongHop`, `DatPhongHop`) + **Sinh nhật** (hiển thị lịch, `SinhNhatLog` gửi mail) — làm CHUNG, 2 người tự chia theo bảng bên dưới | Gộp lại so với v2 (trước Hiếu còn có thêm Chức vụ — nay chuyển cho Quang) |

**Cách chia việc gợi ý cho Hiếu + Tình** (theo đúng ranh giới bảng dữ liệu, tránh đụng file nhau):
- Phần **không cần CBNV** (làm ngay Đợt 1): CRUD `PhongHop` (thêm/sửa/xóa/danh sách phòng họp theo ngày) + hiển thị lịch sinh nhật cơ bản (đọc `CBNV.ngay_sinh`, chưa cần gửi mail).
- Phần **cần CBNV** (làm ở Đợt 3, sau khi Khánh có model CBNV): `DatPhongHop` (đặt lịch, khóa giờ, FK `nguoi_dat` → CBNV) + `SinhNhatLog` (gửi mail tự động, FK `cbnv` → CBNV).
- Hai bạn tự thỏa thuận ai làm phần nào trong 2 phần trên (theo module Phòng họp/Sinh nhật, hoặc theo Đợt 1/Đợt 3) — miễn không cùng sửa 1 file cùng lúc.

## 2. Chi tiết chức năng & field theo module (nguồn: bảng spec thầy giao)

### Phòng họp (độ khó 0.40)
- Thêm phòng họp; danh sách phòng họp theo ngày...
- *Ghi chú field DB:* DB cho phòng họp.

### Sinh nhật (độ khó 0.40)
- Hiển thị theo ngày tháng sinh dạng calendar (tham khảo mẫu thầy gửi).
- Gửi mail chúc mừng sinh nhật tự động khi tới ngày — tự thiết kế mẫu email.
- *Ghi chú field DB:* lấy ngày sinh từ thông tin của user (CBNV).

### Hệ thống (độ khó 0.80)

**Trang Đơn vị, phòng ban** (Quang phụ trách):
- Thêm Khối/Khu vực (Cấp 1): id, tên khối/khu vực.
- Thêm Đơn vị, phòng ban (Cấp 2): chọn khối/khu vực, tên đơn vị/phòng ban, địa chỉ, điện thoại, email.
- Danh sách lấy theo số thứ tự ưu tiên; có tìm kiếm; có xuất Excel.
- **Field:** STT ưu tiên hiển thị(*) — kiểm tra trùng, tự động lấy số lớn nhất + 1; Tên đơn vị/phòng ban(*) — text; Địa chỉ — text; Điện thoại — số; Email; isPublic(*) — mặc định true (false vẫn hiện cho admin nhưng đổi màu); Ghi chú.

**Trang danh mục Chức vụ** (Quang phụ trách):
- Thêm chức vụ; danh sách lấy theo số thứ tự ưu tiên; import file mẫu (tải về rồi import lên); tìm kiếm.
- **Field:** STT ưu tiên hiển thị(*) — kiểm tra trùng, tự động max+1; Tên chức vụ(*); isPublic(*) — mặc định true; Ghi chú.

**Trang CBNV** (Khánh phụ trách):
- Có tên đăng nhập, mật khẩu. Thêm CBNV mới.
- Danh sách lấy theo thứ tự: đơn vị/phòng ban có ưu tiên → chức vụ. Cột hiển thị: STT, Họ và tên, Đơn vị, Chức danh, Nhóm quyền (**chỉ admin thấy cột này**), Email, SĐT cá nhân/bàn, Trạng thái (Làm việc/Nghỉ việc — **bôi đỏ nếu nghỉ việc**), Thao tác (sửa/xóa).
- Import file mẫu; Chi tiết CBNV dạng popup (hiển thị hết thông tin nhưng **che năm sinh**); có phân trang.
- **Field:** Họ và tên(*); Ngày tháng năm sinh(*) — lưu đủ ngày nhưng giao diện ẩn năm sinh; Chức vụ(*) — chọn từ danh sách (FK); Chức danh — text tự do, khác Chức vụ; Nhóm quyền(*) — chọn từ danh sách; Email; SĐT; Đơn vị(*) — chọn từ danh sách (FK); Mật khẩu IT cấp — chỉ admin thấy khi cấp; isPublic(*) — mặc định true; Ghi chú.

**Trang Phân quyền** (Tân phụ trách):
- Danh sách nhóm quyền; thêm/xóa/sửa nhóm quyền; danh sách phân quyền sử dụng theo từng nhóm.
- *Ghi chú:* tạo bảng DB (Group/Permission theo chuẩn `django.contrib.auth`).

## 3. Thứ tự làm để tránh chồng chéo/block nhau

| Đợt | Việc | Ai | Vì sao |
| --- | --- | --- | --- |
| Đợt 1 (song song, làm ngay) | Đơn vị/Khối + Chức vụ; Nhóm quyền (Phân quyền); Phòng họp (`PhongHop` CRUD); Sinh nhật (hiển thị lịch) | Quang (2 việc), Tân, Hiếu+Tình (2 việc) | Không phụ thuộc CBNV |
| Đợt 2 (sau khi Đợt 1 có model, merge xong) | CBNV | Khánh | FK tới Đơn vị (Quang), Chức vụ (Quang), Nhóm quyền (Tân) — cả 3 phải merge xong |
| Đợt 3 (sau khi CBNV có model) | Đặt lịch phòng họp (`DatPhongHop`); Gửi mail sinh nhật tự động (`SinhNhatLog`) | Hiếu+Tình | Cả 2 bảng đều FK tới `accounts.CBNV` (Khánh) |

**Vì sao chia Phòng họp/Sinh nhật thành 2 phần nhỏ theo bảng (không phải theo người):** `DatPhongHop.nguoi_dat` và `SinhNhatLog.cbnv` đều FK tới `accounts.CBNV` — phần này phải làm SAU khi CBNV (Khánh) có model, nên đẩy sang Đợt 3; còn `PhongHop` (CRUD phòng) và hiển thị lịch sinh nhật cơ bản không cần CBNV thật, làm được ngay từ Đợt 1.

## 4. Cảnh báo va chạm với NHÓM KHÁC

- ~~"Loại tài liệu biểu mẫu" và app `resources` với Nhóm 4~~ — đã giải quyết: chuyển hẳn phần này cho Nhóm 4, không còn cảnh báo conflict Git ở đây.
- Mọi module khác (Văn bản, Hồ sơ, Công việc, Trình ký...) đều FK tới Đơn vị/CBNV/Phân quyền của Nhóm 7 → nhóm 7 nên báo trước cho cả lớp field/tên bảng chính thức để tránh mỗi nhóm tự đặt tên khác nhau rồi phải sửa lại.
- ⚠️ **Theo `FRONTEND_BASELINE_GUIDE.md` (Nhóm 1/DevOps, đã merge vào `staging`):** Nhóm 1 không tự đặt role/permission riêng — hợp đồng phân quyền (contract) do Nhóm 7 cung cấp. Các nhóm khác đang chờ Tân chốt cấu trúc RBAC để tích hợp — **việc Phân quyền cần ưu tiên cao nhất trong Đợt 1**.
- ⚠️ Lưu ý riêng cho Phòng họp/Sinh nhật (app `meetings`, `birthdays`): `PhongHop` và `DatPhongHop` do 2 giai đoạn khác nhau (Đợt 1 và Đợt 3) — người làm Đợt 3 PHẢI branch từ code mới nhất của branch nhóm (đã có `PhongHop` merge) trước khi thêm `DatPhongHop`, không branch từ code cũ. Tương tự với `birthdays`.

## 5. Quy tắc kỹ thuật áp dụng cho MỌI module của Nhóm 7

**Validate (bắt buộc ở Backend, dù JS đã validate rồi):**
- Không tin dữ liệu từ client — JS có thể bị tắt hoặc bị bypass bằng gọi API trực tiếp (Postman...). Validate lại 100% ở Django serializer/form.
- Trong bảng mô tả field của thầy: có dấu **(*)** = bắt buộc nhập (`required=True`, `null=False, blank=False`); không có dấu (*) = không bắt buộc.
- Field chọn từ danh sách (FK/dropdown) phải kiểm tra giá trị có tồn tại trong DB, không nhận giá trị tùy ý gửi lên.
- Field có "kiểm tra trùng" (STT ưu tiên...) phải validate unique trước khi lưu.
- Đúng định dạng: email → `EmailField`; ngày giờ → lưu đủ giờ:phút:giây; số điện thoại → validate regex VN.

**Giới hạn dung lượng khi POST/nhập liệu:**
- File đính kèm giới hạn dung lượng theo module, chặn cả FE lẫn BE (`FILE_UPLOAD_MAX_MEMORY_SIZE`, `DATA_UPLOAD_MAX_MEMORY_SIZE`).
- Text field đặt `max_length` hợp lý.
- Danh sách trả về API luôn phân trang, không trả toàn bộ bảng 1 lần.

**CSRF:**
- Mọi form/API có thao tác ghi (POST/PUT/PATCH/DELETE) bắt buộc gửi kèm CSRF token, thiếu/sai token → 403 Forbidden.
- FE lấy token từ cookie Django, gửi qua header `X-CSRFToken`.

**Thông báo trạng thái (UX):**
- Mọi thao tác Thêm/Sửa/Xóa phải có 3 trạng thái: đang xử lý → thành công (thông báo rõ) → thất bại (lý do cụ thể, không chỉ "Có lỗi xảy ra").

**Quy tắc URL:** tiếng Anh, số nhiều kebab-case (`/organizations/`, `/positions/`, `/employees/`, `/permissions/`, `/meetings/`, `/meeting-bookings/`, `/birthdays/`), không dùng tiếng Việt có dấu.

**Danh sách nhiều cấp** (Khối → Đơn vị): mỗi cấp có ô tìm kiếm + phân trang riêng.

**Nguồn dữ liệu tự động:** "Người lập/Người tạo" → lấy từ tài khoản đăng nhập; "STT ưu tiên" → tự động max+1; các field khác lấy trực tiếp từ form.

## 6. Quy tắc Git — tóm tắt nhanh

**Mô hình:** `main` (tích hợp cuối) ← `staging` (tích hợp chung) ← branch nhóm (`7_meeting_rooms_birthdays_system`...) ← `feat/<task>` trên fork cá nhân.

**Quyền:** Thành viên (`team_7`) = Read, phải fork + PR vào branch nhóm. Trưởng nhóm (Tân) = Write, push thẳng branch nhóm, merge PR thành viên, mở PR nhóm → staging. Admin/owner merge staging → main.

**Quy trình 1 task:**
```bash
git worktree add -b feat/<task> ../qlvb-<task> upstream/7_meeting_rooms_birthdays_system
cd ../qlvb-<task>
git branch --show-current
# code, test/lint/build
git add <file-cụ-thể>
git commit -m "feat: mô tả thay đổi"
git push -u fork HEAD
# → mở PR: fork:feat/<task> → QuanLyVanBanTLBM/QuanLyVanBan_TLBM:7_meeting_rooms_birthdays_system
```

**Cấm/hạn chế:** không `git push --force` (chỉ `--force-with-lease` trên fork) · không `git reset --hard` tùy tiện · không code/commit trực tiếp trên `main`/`staging` · không `git add .`/`-A` bừa bãi · không commit secret/`.env`/token.

*(Bản đầy đủ 10 mục về Git, xử lý conflict, quy trình reviewer: xem tài liệu Git workflow chính thức của repo.)*
