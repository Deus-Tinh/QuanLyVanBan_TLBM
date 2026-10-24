# Bàn giao công việc Nhóm 5 (Trình ký số)

Cập nhật: 24/10/2026, khoảng 04:45 UTC (11:45 giờ Việt Nam).
Người giao: Lê Thành Tài (GitHub `krvin2007`).
Repo nhóm: https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM (nhánh chung `staging`).
Trang deploy staging: http://quanlyvanban.duckdns.org:8088

---

## 1. Việc ĐANG LÀM DỞ (ưu tiên số 1)

**Sửa 19 vấn đề giao diện/nghiệp vụ từ lượt rà soát cuối**

- Đã sửa xong toàn bộ:
  - [x] Trang Khóa ký & PIN: hiển thị mã khóa (`k.ma_khoa || '#'+k.id`) thay cho nhãn cố định "MÃ PIN".
  - [x] Bảng "Văn bản công khai": thêm `min-w-[850px]`, dùng `line-clamp-2` tránh cắt chữ, phân định màu semantic token cho loại tệp (`DU_THAO`: warning, `LUOT`: primary, `HOAN_TAT`: success).
  - [x] Thanh tab trên điện thoại: chuyển sang 1 hàng cuộn ngang (`overflow-x-auto flex-nowrap whitespace-nowrap`).
  - [x] Lưới thẻ Quy trình: mở rộng trường phạm vi chiếm 2 cột (`sm:col-span-2`) khi là `CONG_TY` để tránh trống ô cuối.
  - [x] Hồ sơ trả sửa: hiển thị 1 badge trạng thái duy nhất ưu tiên lượt trình hiện hành; trang lỗi 404 ẩn nút "Thử lại".
  - [x] Email "Tin nhắn trao đổi": bổ sung người gửi và nội dung tin nhắn trao đổi (`thao_tac` & `noi_dung`).
  - [x] README và `du-lieu-mau-va-tinh-trang-nghiep-vu.md`: cập nhật Chuyên viên đã có quyền `send_trinhky` theo PR #254.
  - [x] Tìm kiếm người dùng: hỗ trợ tìm theo chức danh tự do (`chuc_danh`, gộp từ PR #245).
  - [x] Chạy toàn bộ gates kiểm tra: Backend check (Pass), Backend test (283/283 OK), Token (Pass), i18n (Pass), Vitest (Pass), Lint (Pass), Build (Pass).
  - [x] Đã mở PR [#262](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/pull/262) vào `staging` (gắn Issue #261, Refs #248).

---

## 2. Việc ĐÃ XONG (đã merge vào `staging`, deploy xanh)

| PR | Nội dung |
|---|---|
| [#251](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/pull/251) | Hoàn thiện nghiệp vụ, kèm lệnh dữ liệu mẫu `seed_signing_demo` và API Dashboard `GET /api/v1/signing/dashboard/` cho Nhóm 1. Chi tiết dưới bảng. |
| [#254](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/pull/254) | Cấp quyền `send_trinhky` cho Chuyên viên (migration `authorization/0007_grant_cv_send_trinhky`, issue #226) |
| [#258](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/pull/258) | Sửa lỗi từ bảng kiểm thử 8 chức năng và đổi tab thành "Văn bản công khai". Chi tiết dưới bảng. |
| [#262](https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM/pull/262) | Sửa các vấn đề giao diện và nghiệp vụ từ lượt rà soát cuối (Issue #261). |

---

## 3. Việc CẦN NGƯỜI LÀM (không tự động được)

1. **Hậu (cần SSH vào máy chủ staging):**
   - Thêm vào file env backend trên máy chủ: `ADMIN_PASSWORD`, `DEMO_PASSWORD` (cả hai bằng mật khẩu demo của lớp), `DEFAULT_FROM_EMAIL=qlvb@baohiembaolong.vn`. Nếu gửi mail thật thì thêm cả `EMAIL_HOST_PASSWORD`.
   - Chạy:
     ```
     cd /srv/qlvb/current/backend
     set -a; . /etc/qlvb/backend.env; set +a
     /srv/qlvb/current/venv/bin/python manage.py seed_signing_demo
     ```
   - Đường dẫn trên lấy từ cấu hình deploy trong repo. Nếu máy chủ đặt ở chỗ khác thì sửa lại cho đúng.
2. **Báo Nhóm 7:** PR #231 và #211 của họ cũng dùng số migration `0007` nên trùng với #254. Họ cần merge `staging`, đổi sang `0008`, chạy `check_max_migration.py --write`, sửa test đếm phân quyền (+1 lượt). Ngoài ra nhờ Nhóm 7 review lại PR #254 vì nó được merge khi chưa có review.
3. **Nhóm 1 (Kiệt):** đã nhận lệnh `seed_signing_demo` và API Dashboard. Trang chủ của Nhóm 1 chưa gọi API này; đó là việc của Nhóm 1.
4. **Thử mail thật trên máy cá nhân:** `pnpm manage sendtestemail <email>`. Phải có đủ các biến `EMAIL_*` và `DEFAULT_FROM_EMAIL` trong `.env`.

---

## 4. Chạy project trên máy (Windows, PowerShell)

- **Cần cài:** Docker Desktop (đang chạy), Git, Node.js 22 hoặc 24, Python 3.12 trở lên. Chạy `corepack enable` để bật pnpm.
- **Lấy code:**
  ```
  git switch staging
  git pull origin staging
  ```
- **File `.env`:** đặt ở **thư mục gốc repo**, chép từ `.env.example`, thêm:
  ```
  DEMO_PASSWORD=<mật khẩu demo của lớp>
  DEFAULT_FROM_EMAIL=qlvb@baohiembaolong.vn
  ```
- **Chạy:** cửa sổ 1 `pnpm runserver`, cửa sổ 2 `pnpm dev`. Mở http://127.0.0.1:5173/login, vào Công việc & Ký số → Trình ký.
- **Tài khoản demo:** `admin`, `vanthu`, `chuyenvien`, `truongphong`, `giamdoc`. Cả 5 dùng chung mật khẩu demo của lớp.

---

## 5. Tài liệu và báo cáo

- README module: `docs/modules/05_signing_workflow/README.md`
- Dữ liệu mẫu và API cho Nhóm 1: `docs/modules/05_signing_workflow/du-lieu-mau-va-tinh-trang-nghiep-vu.md`
- Plan gốc: `docs/modules/05_signing_workflow/signing-backend-plan.md`
- Đánh giá plan: `docs/modules/05_signing_workflow/danh-gia-plan-va-tich-hop.md`
