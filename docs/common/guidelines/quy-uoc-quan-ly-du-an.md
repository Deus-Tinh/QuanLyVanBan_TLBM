# Quy ước quản lý dự án

Áp dụng cho cả 8 nhóm, có hiệu lực từ 06/10/2026. Mục tiêu: một nguồn sự thật cho tiến độ và schema, và chỉ merge vào nhánh chung khi đã kiểm soát được.

## 1. Ba quy ước bắt buộc

### 1.1. Chỉ người phụ trách DevOps merge vào `staging` và `ddl_base_v0`

- Người merge: trưởng nhóm 5 (DevOps). Các nhóm mở PR, không tự merge vào hai nhánh này.
- Điều kiện merge:
  - CI xanh trên commit cuối;
  - có ít nhất 1 approve của người ngoài tác giả;
  - không còn xung đột.
- Thứ tự merge theo issue cha của milestone `Base staging`. PR đến sai thứ tự thì chờ, không merge chen.
- Nhánh của từng nhóm (`1_layout_home` … `8_ai_chatbox`) do trưởng nhóm tự quản lý, áp dụng cùng điều kiện merge.

### 1.2. Sửa CSDL thì sửa DDL trước, migration sau

- Nguồn sự thật của schema: `docs/common/database/release_DDL.sql` trên nhánh `ddl_base_v0`.
- Trình tự:
  1. Mở PR vào `ddl_base_v0`, chỉ sửa `docs/common/database/`; CI `ddl-load` phải xanh.
  2. Sau khi PR DDL đã merge, nhóm mới mở PR chứa migration tương ứng. Mô tả PR ghi số PR DDL.
- Migration phải tạo ra đúng tên bảng, cột, kiểu, null, CHECK như DDL. Trigger, view, role chỉ đọc chỉ có trong DDL; môi trường dùng chung dựng DB bằng cách nạp DDL rồi chạy `python backend/manage.py migrate --fake`.
- Không viết migration trước rồi mới sửa DDL theo.

### 1.3. Mỗi PR gắn một issue và một milestone

- Mô tả PR có dòng `Closes #<số>` hoặc `Refs #<số>`.
- PR và issue có label nhóm (`nhom-1` … `nhom-8`) và milestone (`Base staging` hoặc `MVP`).
- PR không gắn issue thì không merge.

## 2. Label và milestone

| Label | Ý nghĩa |
|---|---|
| `nhom-1` … `nhom-8` | Nhóm phụ trách |
| `P0` | Chặn nhóm khác hoặc chặn base staging; xử lý trước |
| `P1` | Cần cho MVP |
| `blocked` | Đang chờ việc khác; mô tả issue ghi rõ chờ issue/PR nào |
| `ddl` | Có thay đổi CSDL, áp dụng mục 1.2 |

| Milestone | Phạm vi |
|---|---|
| `Base staging` | Nền chung: DDL vào staging, `Employee`/RBAC, quy trình dựng DB, CI PostgreSQL, gỡ văn bản mật |
| `MVP` | Chức năng MVP của từng nhóm |

## 3. Bảng GitHub Project

Một bảng Project chung cho tổ chức, gom issue và PR của repo:

- Trường: `Status` (Todo / Doing / Review / Done), `Nhóm`, `Ưu tiên` (P0 / P1), `Milestone`.
- View:
  - **Theo trạng thái**: dạng board, nhóm theo `Status`;
  - **Theo nhóm**: dạng bảng, nhóm theo `Nhóm`;
  - **Đang chặn**: lọc `label:P0` hoặc `label:blocked`.
- Trưởng nhóm cập nhật `Status` khi bắt đầu, khi mở PR và khi merge.

## 4. Bảo vệ nhánh (khi tổ chức có gói hỗ trợ)

Gói GitHub Free không hỗ trợ bảo vệ nhánh cho repo private. Khi tổ chức được nâng lên gói Team (GitHub Education cho giảng viên), bật cho `staging`, `ddl_base_v0`, `main`:

- bắt buộc merge qua PR, tối thiểu 1 approve;
- bắt buộc CI xanh;
- chặn force-push và xóa nhánh.

Trước khi có bảo vệ nhánh, mục 1.1 là quy ước thủ công.
