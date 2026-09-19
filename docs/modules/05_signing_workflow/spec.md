# ĐẶC TẢ NHIỆM VỤ: NHÁNH 5 — PHÂN HỆ TRÌNH KÝ (SIGNING WORKFLOW)

> **Tài liệu căn cứ:** 
> - File đặc tả dự án: `ITC - Django - QLVB&TL (2).xlsx` (Sheet `Tổng quan`, dòng R14).
> - Phân công: **Nhóm 5** (Trưởng nhóm: Lê Thanh Hậu, Thành viên: Lê Thành Tài).
> - Hệ số độ khó: **1.0**.
> - Nhánh phát triển: `5_signing_workflow`.

---

## 1. MỤC TIÊU & PHẠM VI NHIỆM VỤ (OBJECTIVE & SCOPE)

### 1.1. Mục tiêu
Xây dựng phân hệ **Trình ký (Signing Workflow)** hoàn chỉnh hỗ trợ tạo văn bản trình ký, luân chuyển hồ sơ theo quy trình phê duyệt nhiều cấp (Workflow Engine), trực quan hóa tiến trình dưới dạng sơ đồ ký (Visual Timeline), thực hiện ký duyệt bằng chữ ký điện tử nội bộ kèm kiểm tra tính toàn vẹn tài liệu (Document Hash SHA-256), và tự động gửi thông báo / email đến người có thẩm quyền.

### 1.2. Phạm vi chức năng (In-Scope)
1. **Quản lý Mẫu quy trình trình ký (Workflow Templates):** Định nghĩa trước các luồng phê duyệt theo phòng ban hoặc dùng chung (1 cấp, 2 cấp, 3 cấp...).
2. **Tạo văn bản trình ký (Create Submission):**
   - Tự động điền thông tin người tạo, chức danh, đơn vị/phòng ban từ tài khoản đăng nhập.
   - Chọn mẫu quy trình phù hợp hoặc chỉ định người duyệt tuần tự.
   - Thiết lập mức độ khẩn (`NORMAL`, `URGENT`, `TOP_URGENT`) và mức độ mật (`NORMAL`, `CONFIDENTIAL`, `TOP_SECRET`).
   - Đính kèm tệp tài liệu trình ký (`.pdf`, `.docx`, dung lượng tối đa 20MB).
3. **Danh sách văn bản trình ký (Submissions List & Filter):**
   - Tabs lọc nghiệp vụ: *Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Toàn bộ hồ sơ*.
   - Bộ lọc chi tiết: Theo phòng ban, trạng thái xử lý, độ khẩn, khoảng thời gian.
   - Phân trang chuẩn hóa.
4. **Chi tiết văn bản & Sơ đồ trình ký (Detail & Visual Flow Graph):**
   - Xem nội dung trích yếu, thông tin metadata và bản xem trước tài liệu đính kèm (PDF inline viewer).
   - Sơ đồ trực quan tiến trình ký (Visual Timeline/Stepper): Hiển thị trạng thái các nút (*Đã ký*, *Đang chờ*, *Chưa đến lượt*, *Bị từ chối*), thời gian thực hiện, chữ ký và ý kiến phản hồi.
5. **Thao tác Ký duyệt & Chữ ký số (Digital/Electronic Signature):**
   - Thực hiện ký duyệt kèm chèn ảnh chữ ký cá nhân / con dấu và mã PIN/mật khẩu xác nhận.
   - Tính toán và lưu trữ mã băm SHA-256 của tài liệu tại thời điểm ký để bảo đảm tính toàn vẹn (chống giả mạo hoặc chỉnh sửa sau khi ký).
   - Thao tác Từ chối / Trả về hồ sơ kèm lý do bắt buộc.
6. **Thông báo & Gửi email (Notifications & Email Dispatch):**
   - Bắn thông báo nội bộ (In-app notification) khi hồ sơ chuyển đến lượt người ký.
   - Gửi email thông báo tự động (qua Django Signals/Background Task).

### 1.3. Ngoài phạm vi (Out-of-Scope)
- Không tích hợp phần cứng USB Token hay dịch vụ chứng thực chữ ký số công cộng bên thứ ba (VNPT-CA, Viettel-CA...) do giới hạn môi trường học tập/thực nghiệm.
- Không can thiệp vào các module văn bản đến, văn bản đi (thuộc Nhóm 2) hay quản lý tài liệu lưu trữ (thuộc Nhóm 4).

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA PROPOSAL)

*Phục vụ nộp GVHD phê duyệt theo chỉ thị: "Các bạn chọn các trường rồi báo thầy duyệt".*

### 2.1. Bảng `SigningWorkflowTemplate` (Mẫu quy trình trình ký)
- `id`: BigAutoField (Primary Key)
- `name`: CharField(255), unique=True - Tên quy trình mẫu
- `description`: TextField, blank=True - Mô tả quy trình
- `department_id`: ForeignKey(Department, null=True, blank=True) - Phòng ban áp dụng (Null = dùng chung)
- `is_active`: BooleanField(default=True) - Trạng thái kích hoạt
- `created_at`: DateTimeField(auto_now_add=True) - Thời gian tạo

### 2.2. Bảng `SigningWorkflowStep` (Bước mẫu trong quy trình)
- `id`: BigAutoField (Primary Key)
- `template`: ForeignKey(SigningWorkflowTemplate, on_delete=CASCADE, related_name='steps')
- `step_order`: PositiveIntegerField - Thứ tự thực hiện bước (1, 2, 3...)
- `step_name`: CharField(255) - Tên bước (VD: "Trưởng phòng thẩm định", "Ban Giám đốc phê duyệt")
- `role_required`: CharField(100), blank=True - Vai trò/chức vụ người duyệt tương ứng
- `sign_type`: CharField(20, default='APPROVE') - Loại ký (`APPROVE`: Phê duyệt, `SIGN`: Ký số, `FLASH`: Ký nháy)

### 2.3. Bảng `SigningDocument` (Hồ sơ / Văn bản trình ký)
- `id`: BigAutoField (Primary Key)
- `doc_code`: CharField(50), unique=True, db_index=True - Mã văn bản trình ký (Tự động sinh: `TK-YYYY-XXXXX`)
- `title`: CharField(500) - Trích yếu / Tiêu đề văn bản (*)
- `workflow_template`: ForeignKey(SigningWorkflowTemplate, on_delete=SET_NULL, null=True, blank=True)
- `creator`: ForeignKey(User, on_delete=PROTECT, related_name='created_signing_docs') - Người lập hồ sơ
- `department`: ForeignKey(Department, on_delete=PROTECT) - Đơn vị/phòng ban của người tạo (*)
- `urgency_level`: CharField(20, default='NORMAL', choices=[('NORMAL', 'Thường'), ('URGENT', 'Khẩn'), ('TOP_URGENT', 'Hỏa tốc')])
- `security_level`: CharField(20, default='NORMAL', choices=[('NORMAL', 'Thường'), ('CONFIDENTIAL', 'Mật'), ('TOP_SECRET', 'Tuyệt mật')])
- `content_summary`: TextField, blank=True - Nội dung đề xuất / Ý kiến trình
- `attached_file`: FileField(upload_to='signing/documents/%Y/%m/') - File đính kèm (.pdf, .docx, max 20MB)
- `file_hash`: CharField(64) - SHA-256 hash của tệp gốc
- `status`: CharField(20, default='DRAFT', choices=[('DRAFT', 'Dự thảo'), ('IN_PROGRESS', 'Đang trình ký'), ('APPROVED', 'Đã ký duyệt'), ('REJECTED', 'Bị từ chối'), ('CANCELLED', 'Đã thu hồi')])
- `current_step_order`: PositiveIntegerField(default=1) - Vị trí bước hiện tại đang xử lý
- `created_at`: DateTimeField(auto_now_add=True) - Thời gian tạo (đầy đủ ngày giờ giây)
- `updated_at`: DateTimeField(auto_now=True) - Thời gian cập nhật

### 2.4. Bảng `SigningProcessStep` (Bước xử lý thực tế của hồ sơ)
- `id`: BigAutoField (Primary Key)
- `document`: ForeignKey(SigningDocument, on_delete=CASCADE, related_name='process_steps')
- `step_order`: PositiveIntegerField - Thứ tự bước thực tế
- `step_name`: CharField(255) - Tên bước
- `assigned_user`: ForeignKey(User, on_delete=PROTECT, related_name='assigned_signing_steps') - Người được phân công duyệt ở bước này
- `status`: CharField(20, default='WAITING', choices=[('WAITING', 'Chờ đến lượt'), ('PENDING', 'Đến lượt'), ('APPROVED', 'Đã ký duyệt'), ('REJECTED', 'Từ chối')])
- `opinion`: TextField, blank=True - Ý kiến phê duyệt / Lý do từ chối
- `action_time`: DateTimeField(null=True, blank=True) - Thời điểm người duyệt thực hiện thao tác

### 2.5. Bảng `DigitalSignatureLog` (Nhật ký xác thực chữ ký điện tử)
- `id`: BigAutoField (Primary Key)
- `process_step`: OneToOneField(SigningProcessStep, on_delete=PROTECT, related_name='signature_log')
- `signer`: ForeignKey(User, on_delete=PROTECT) - Người thực hiện ký
- `signature_image`: ImageField(upload_to='signing/signatures/', null=True, blank=True) - Ảnh chữ ký cá nhân / con dấu
- `document_hash`: CharField(64) - Chuỗi SHA-256 của file tại lúc ký
- `signature_token`: CharField(128), unique=True - Token băm bảo mật định danh hành động ký
- `signed_at`: DateTimeField - Thời gian ký chính xác
- `ip_address`: GenericIPAddressField(null=True, blank=True) - Địa chỉ IP của người ký

---

## 3. THIẾT KẾ KIẾN TRÚC API (RESTFUL ENDPOINTS)

| Phương thức | Endpoint | Chức năng | Phân quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/signing/documents/` | Danh sách hồ sơ trình ký (phân trang, lọc tab: `my_pending`, `my_created`, `all`; lọc phòng ban, trạng thái) | Authenticated |
| `POST` | `/api/signing/documents/` | Khởi tạo hồ sơ trình ký mới kèm file đính kèm | Authenticated |
| `GET` | `/api/signing/documents/<id>/` | Chi tiết hồ sơ trình ký, metadata và quyền hành động | Người trong luồng ký hoặc Admin |
| `PATCH` | `/api/signing/documents/<id>/` | Cập nhật thông tin hồ sơ (chỉ khi ở trạng thái `DRAFT`) | Người tạo hồ sơ |
| `POST` | `/api/signing/documents/<id>/action/` | Thực hiện Ký duyệt (`APPROVE`) hoặc Từ chối (`REJECT`) | Người được chỉ định tại bước hiện tại |
| `POST` | `/api/signing/documents/<id>/cancel/` | Thu hồi văn bản trình ký | Người tạo hồ sơ |
| `GET` | `/api/signing/documents/<id>/timeline/` | Dữ liệu sơ đồ tiến trình ký (Visual Timeline) | Người trong luồng ký |
| `GET` | `/api/signing/templates/` | Danh sách các mẫu quy trình trình ký khả dụng | Toàn bộ CBNV |

---

## 4. QUY CHUẨN GIAO DIỆN (UI/UX SPECIFICATION)

1. **Trang Danh sách (`SigningListPage`):**
   - KPI Summary Cards: 3 thẻ đếm (*Cần tôi ký duyệt*, *Tôi đã gửi trình*, *Đã hoàn tất*).
   - Bộ lọc tích hợp: Dropdown chọn phòng ban, độ khẩn, trạng thái; Input tìm kiếm trích yếu / mã hồ sơ.
   - Bảng dữ liệu: Cột mã, trích yếu, người gửi, ngày gửi, bước hiện tại, trạng thái (badge màu), thao tác nhanh.
2. **Trang Tạo mới (`SigningCreatePage`):**
   - Form 2 phần: Thông tin chung (Tiêu đề, Độ khẩn, Độ mật, Mẫu quy trình) và Xem trước các bước duyệt.
   - Drag & Drop Upload: Kiểm tra client-side định dạng `.pdf`, `.docx` và dung lượng < 20MB.
3. **Trang Chi tiết & Sơ đồ Ký (`SigningDetailPage`):**
   - **Bố cục 2 cột (Split View):**
     - *Cột trái*: Trực quan hóa Sơ đồ ký (Visual Stepper Node: Xanh lá = Đã duyệt, Vàng = Đang chờ xử lý, Xám = Chưa đến lượt, Đỏ = Trả về). Hiển thị tên người ký, chức vụ, giờ ký và ý kiến.
     - *Cột phải*: Inline PDF Viewer hiển thị văn bản đính kèm.
   - **Khung hành động phê duyệt:**
     - Hiển thị khi tài khoản hiện tại khớp với `assigned_user` của bước đang chờ.
     - Cho phép chèn ảnh chữ ký cá nhân, nhập mã PIN xác nhận.
     - 2 nút hành động: `Ký duyệt` (Màu xanh thương hiệu) và `Từ chối / Trả về` (Màu cảnh báo đỏ kèm lý do bắt buộc).

---

## 5. TECHNICAL INVARIANTS & QUALITY GATES

- **i18n (Trụ cột 1):** 100% text trên giao diện sử dụng `useTranslation()`, khai báo đầy đủ cả 2 nhánh `vi` và `en` trong `translations.js`.
- **CSS Design Tokens (Trụ cột 3):** Sử dụng 100% biến từ `src/styles/global.css` (`var(--color-primary)`, `var(--bg-surface)`, `var(--border-subtle)`...). Không hardcode mã màu hex hay pixel.
- **Tính toàn vẹn mã băm (Document Integrity):** Tính hash SHA-256 ngay khi upload và đối chiếu trước khi ghi nhận `DigitalSignatureLog`.
- **Technical Gates:**
  - `python backend/manage.py check` (Pass 0 lỗi).
  - `python backend/manage.py test apps.signing` (Pass 100% unit tests).
  - `pnpm --dir frontend run build` (Pass 0 error).

---

## 6. KẾ HOẠCH TÍCH HỢP GIT CHO NHÓM 5

1. **Phân tách mã nguồn độc lập (Modular Isolation):**
   - Backend: Toàn bộ logic nằm trọn gói tại `backend/apps/signing/`.
   - Frontend: Toàn bộ màn hình đặt tại `frontend/src/pages/signing/`, components tại `frontend/src/components/signing/`.
2. **Kịch bản đồng bộ với PR #3 và Staging:**
   - Trong thời gian PR #3 đang được tái cấu trúc, Nhóm 5 tập trung hoàn thiện module nội bộ độc lập.
   - Khi `staging` chính thức ổn định và merge nền tảng chung, Nhóm 5 thực hiện rebase nhánh `5_signing_workflow` lên `staging` và cắm route `signing` vào router chính mà không gây bất kỳ xung đột nào.
