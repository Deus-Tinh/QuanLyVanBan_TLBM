# Module 05: Trình ký số (Nhóm 5)

Phân hệ trình ký văn bản đi qua nhiều cấp, ký điện tử nội bộ Ed25519, kết thúc ở **hoàn tất duyệt nội bộ, chưa phát
hành**. Giao diện ở `/approvals`, API dưới `/api/v1/signing/`.

Tài liệu liên quan (không chép lại ở đây):

- [`signing-backend-plan.md`](signing-backend-plan.md): quy tắc nghiệp vụ, bất biến, thiết kế dữ liệu, máy trạng thái, API.
- [`danh-gia-plan-va-tich-hop.md`](danh-gia-plan-va-tich-hop.md): đánh giá plan và tích hợp với các nhóm.
- [`du-lieu-mau-va-tinh-trang-nghiep-vu.md`](du-lieu-mau-va-tinh-trang-nghiep-vu.md): bảng tình trạng flow, file khóa,
  ủy quyền, dữ liệu mẫu chi tiết, hợp đồng API Dashboard đầy đủ.
- [`spec.md`](spec.md), [`qa-test-cases-80.md`](qa-test-cases-80.md).

## 1. Flow nghiệp vụ

| Flow | Tình trạng |
|---|---|
| Quy trình mẫu: tạo nháp, sửa, kích hoạt, ngừng, nhân bản phiên bản; phạm vi công ty/phòng ban | Xong |
| Tạo hồ sơ nháp (văn bản đi, quy trình, PDF, hạn chót), sửa nháp | Xong |
| Trình ký: khóa tệp và mã băm, chọn người ký theo chức vụ, đặt vị trí ký | Xong |
| Ký tuần tự theo cấp, song song trong cấp, ký nháy chặn ký chính | Xong |
| Khóa ký Ed25519 + PIN 8 số (Argon2id + salt, `k_srv`); xuất file khóa; ký bằng file khóa + PIN | Xong |
| Không đồng ý ban hành (kết thúc); trình lại thành hồ sơ mới | Xong |
| Trả lại để sửa → trao đổi → gửi bản sửa → lượt trình mới | Xong |
| Hủy (người tạo; quản trị hủy thay có lý do); thu hồi chữ ký khi cấp còn mở | Xong |
| Hoàn tất: bằng chứng tổng hợp, PDF hoàn tất, xác minh lại | Xong |
| Ủy quyền ký khẩn cấp từng hồ sơ | Xong |
| Thông báo trong ứng dụng + email (gửi lại khi lỗi), nhắc hạn/quá hạn | Xong |
| Ủy quyền theo thời gian, thể thức KT./TL./TUQ., leo thang quá hạn | Chưa làm (mục 8) |

Trạng thái hồ sơ (`signing_request.trang_thai`) và lượt trình (`signing_attempt.trang_thai`):

```mermaid
stateDiagram-v2
    [*] --> NHAP: tạo hồ sơ
    NHAP --> CHO_KY: gửi trình (lượt 1)
    NHAP --> HUY: hủy
    state CHO_KY {
        [*] --> LuotChoKy
        LuotChoKy: lượt CHO_KY (cấp mở tuần tự)
        LuotTraSua: lượt YEU_CAU_SUA (cấp TAM_DUNG)
        LuotChoKy --> LuotTraSua: trả lại để sửa
        LuotTraSua --> LuotChoKy: gửi bản sửa (lượt mới)
    }
    CHO_KY --> HOAN_THANH: cấp cuối ký đủ
    CHO_KY --> TU_CHOI: không đồng ý ban hành
    CHO_KY --> HUY: hủy
    TU_CHOI --> [*]: trình lại = hồ sơ NHAP mới (ho_so_goc)
    HOAN_THANH --> [*]
    HUY --> [*]
```

Khi hồ sơ từ chối hoặc hủy, cấp đang ký chuyển `TAM_DUNG`; người chưa ký hiển thị "Không còn cần ký".

## 2. Vai trò và quyền

Quyền kiểm ở API/service (`backend/apps/signing/permissions.py`), giao diện chỉ ẩn/hiện. Nhóm quyền chuẩn lấy từ
DDL/RBAC (Nhóm 7):

| Nhóm | Trình ký |
|---|---|
| Văn thư (VT) | xem, tạo, gửi trình ký |
| Chuyên viên (CV) | xem, tạo, gửi trình hồ sơ do mình tạo (không ký, không hủy thay) |
| Trưởng phòng (TP) | xem, tạo, gửi, ký, ủy quyền (người ký cùng đơn vị), hủy thay, quản lý quy trình phòng ban |
| Ban Giám đốc (BGD) | xem, tạo, gửi, ký, ủy quyền, hủy thay, xem nhật ký mọi hồ sơ |
| Quản trị (ADMIN) | toàn quyền, quản lý quy trình công ty |

Codename: `view_trinhky`, `add_trinhky`, `send_trinhky`, `sign_trinhky`, `delegate_trinhky`, `cancel_trinhky`,
`manage_signing_process`, `view_signing_audit`.

## 3. Cấu trúc thư mục chính

```text
backend/apps/signing/
  models.py, enums.py, permissions.py, errors.py   # model theo DDL, mã trạng thái, kiểm quyền, định dạng lỗi
  services/                                        # nghiệp vụ: trinh_ky, hanh_dong_ky, yeu_cau_sua, uy_quyen,
                                                   #   keys, pin, thong_bao, bang_chung, tep_hoan_tat, process
  selectors.py                                     # selector chỉ đọc cho module khác (Dashboard)
  tich_hop/                                        # đọc văn bản đi (Nhóm 2), tổ chức/nhân sự (Nhóm 7)
  views.py, urls.py, serializers.py                # API /api/v1/signing/
  management/commands/                             # seed_signing_demo, nhac_han_trinh_ky, gui_thong_bao_trinh_ky
  tests/
frontend/src/
  pages/signing/          # SigningModule (route /approvals/*), DanhSach, TaoHoSo, ChiTiet, QuyTrinh, Khoa, ThongBao, TaiLieu
  components/signing/     # HanhDong, TienTrinh, XemPdf, TraoDoiPanel, KetQuaPanel, ...
  lib/signing/            # api, types, khoaKy (Ed25519, Argon2id, AES-GCM), fileKhoa, luongKhoa, pdf, i18n vi/en
```

## 4. API chính (`/api/v1/signing/`)

| Đường dẫn | Mục đích |
|---|---|
| `quy-trinh/`, `quy-trinh/{id}/`, `quy-trinh/{id}/{kich-hoat,ngung,nhan-ban}/` | Quy trình mẫu |
| `trinh-ky/` (GET `?hop=can_toi_ky\|toi_gui\|tat_ca&page=&page_size=`, POST multipart) | Danh sách (phân trang), tạo nháp |
| `trinh-ky/{id}/` (GET, PATCH) | Chi tiết (lượt, cấp, người ký, `lich_su`), sửa nháp |
| `trinh-ky/{id}/{gui,huy,trinh-lai}/` | Gửi, hủy, trình lại |
| `trinh-ky/{id}/{ky,tu-choi,thu-hoi,yeu-cau-sua,uy-quyen}/` | Hành động người ký, ủy quyền khẩn cấp |
| `trinh-ky/{id}/{trao-doi,giai-quyet}/` | Trao đổi khi trả sửa, gửi bản sửa |
| `trinh-ky/{id}/{tep,tep-hoan-tat,bang-chung,tao-lai-tep-hoan-tat}/` | Tệp, tệp hoàn tất, bằng chứng |
| `khoa/`, `khoa/{id}/{thach-thuc,xac-minh,kich-hoat,thu-hoi,xoay-vong,dat-pin,mo-khoa-ky,doi-pin}/` | Khóa ký, PIN |
| `thong-bao/`, `tai-lieu/`, `toi/`, `nguoi-dung/`, `don-vi/`, `van-ban-di/` | Hỗ trợ giao diện |
| `dashboard/` | Dữ liệu Dashboard/Header cho Nhóm 1 |

Thao tác đổi trạng thái bắt buộc header `Idempotency-Key`. Lỗi trả dạng `{"code", "detail", "fields"}` (tiếng Việt).

- Danh sách hồ sơ phân trang như các module khác (`PageNumberPagination`): `page` (mặc định 1), `page_size` (mặc định
  10, tối đa 100); trả `{"count", "next", "previous", "results"}`. Trang vượt quá số trang trả 404.
- Tìm kiếm (`q` của danh sách hồ sơ, `tai-lieu/`, `van-ban-di/`) không phân biệt hoa thường và dấu tiếng Việt: "mua sam"
  khớp "Mua sắm", "10/qd" khớp "10/QĐ".
- Mỗi văn bản chỉ có một hồ sơ đang mở (nháp hoặc đang chờ ký). Tạo nháp, gửi trình hoặc trình lại khi văn bản đang có
  hồ sơ mở khác trả 409 `van_ban_da_co_ho_so_dang_mo`. Hồ sơ đã hoàn thành, từ chối hoặc hủy không chặn việc trình mới.

### `GET /api/v1/signing/dashboard/` (Nhóm 1)

Yêu cầu đăng nhập (JWT); chưa đăng nhập trả 401. Chỉ dữ liệu của người đang đăng nhập. Backend có thể gọi
`signing.selectors.tong_quan_dashboard(user)`. Mẫu (rút gọn từ dữ liệu `seed_signing_demo`, tài khoản `truongphong`;
bản đầy đủ ở `du-lieu-mau-va-tinh-trang-nghiep-vu.md` mục 6.2):

```json
{
  "so_cho_ky": 2,
  "gan_day": [
    {
      "id": 2,
      "tieu_de": "102/TTr-CNTT — Tờ trình mua sắm thiết bị mạng cho văn phòng khu vực",
      "nguoi_trinh": "Văn thư Ban CNTT",
      "ngay_trinh": "2026-10-21T15:29:41.935258+07:00",
      "trang_thai": "CHO_KY",
      "nhan_trang_thai": "Chờ ký",
      "can_toi_ky": true
    }
  ]
}
```

`gan_day` tối đa 5 phiếu, mới nhất trước. `trang_thai`: `NHAP`, `CHO_KY`, `HOAN_THANH`, `TU_CHOI`, `HUY`
(nhãn: Nháp, Chờ ký, Đã ký, Từ chối, Đã hủy).

## 5. Cấu hình môi trường (`backend/.env`, không commit giá trị bí mật)

| Biến | Ghi chú |
|---|---|
| `SIGNING_DOCUMENT_ROOT` | Thư mục lưu tệp PDF, ảnh chữ ký snapshot, tệp hoàn tất |
| `SIGNING_PIN_SECRET` | Bí mật máy chủ cho PIN và `k_srv`; bắt buộc trên staging/production (`check --deploy` báo `signing.E001/E002`) |
| `SIGNING_PDF_FONT`, `SIGNING_PDF_FONT_BOLD` | Phông có dấu cho PDF hoàn tất; trống thì tự dò phông hệ thống |
| `SIGNING_EMAIL_BACKEND` | Để trống trên staging/production. Chỉ dùng để chọn backend không cần máy chủ thư khi dev/test: `django.core.mail.backends.console.EmailBackend` hoặc `django.core.mail.backends.locmem.EmailBackend`. Đặt giá trị SMTP thì được coi như để trống (gửi qua cấu hình `EMAIL_*`); giá trị không nạp được báo `signing.E004` |
| `SIGNING_FRONTEND_URL` | Địa chỉ giao diện dùng trong liên kết email |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP chung của dự án (Django 6.1 `MAILERS`); `EMAIL_HOST` trống thì email in ra console |
| `DEFAULT_FROM_EMAIL` | Địa chỉ người gửi, bắt buộc khi gửi SMTP, ví dụ `Hệ thống QLVB <qlvb@baohiembaolong.vn>`. Để trống thì mọi thư lỗi `Invalid address ''`; `manage.py check` báo `signing.W003` |
| `ADMIN_PASSWORD` | Mật khẩu `admin` khi khởi tạo bằng `seed_db` / `scripts/build_db.py --seed` |
| `DEMO_PASSWORD` | Mật khẩu tài khoản mẫu của `seed_signing_demo` |

System check của phân hệ (`python manage.py check`): `signing.W002` khi `SIGNING_EMAIL_BACKEND` đặt SMTP mà dự án chưa
có `EMAIL_HOST`; `signing.W003` khi gửi SMTP mà `DEFAULT_FROM_EMAIL` trống; `signing.E004` khi `SIGNING_EMAIL_BACKEND`
không nạp được.

### 5.1. Tài khoản demo và mật khẩu

- Năm tài khoản demo `admin`, `vanthu`, `chuyenvien`, `truongphong`, `giamdoc` dùng chung **mật khẩu demo của lớp**:
  đặt `ADMIN_PASSWORD` và `DEMO_PASSWORD` cùng một giá trị (mật khẩu demo của lớp) trong `.env`. Không ghi giá trị này
  vào repo, tài liệu hay issue.
- `admin` do `seed_db` tạo theo `ADMIN_PASSWORD`; `seed_signing_demo` không đổi mật khẩu `admin` đã có. Nếu `admin` đã
  tồn tại với mật khẩu khác, đổi bằng:

  ```bash
  cd backend
  python manage.py changepassword admin     # hoặc: pnpm manage changepassword admin
  ```

- Bốn tài khoản còn lại đã có mà mật khẩu khác: `python manage.py seed_signing_demo --dat-lai-mat-khau`.
- Windows (PowerShell, CMD) không dùng được cú pháp `BIEN=... lệnh`: ghi biến vào tệp `backend/.env` (settings tự nạp
  `backend/.env`, sau đó `.env` ở thư mục gốc):

  ```dotenv
  ADMIN_PASSWORD=<mật khẩu demo của lớp>
  DEMO_PASSWORD=<mật khẩu demo của lớp>
  ```

  rồi chạy `pnpm manage seed_signing_demo --email-domain <miền email>`.

### 5.2. Thử gửi email thật

1. Ghi vào `backend/.env`:

   ```dotenv
   EMAIL_HOST=<máy chủ SMTP>
   EMAIL_PORT=587
   EMAIL_USE_TLS=true
   EMAIL_HOST_USER=<tài khoản SMTP>
   EMAIL_HOST_PASSWORD=<mật khẩu SMTP>
   DEFAULT_FROM_EMAIL="Hệ thống QLVB <qlvb@baohiembaolong.vn>"
   ```

   `SIGNING_EMAIL_BACKEND` để trống.
2. Kiểm tra cấu hình: `pnpm manage check` (không có `signing.W002`, `signing.W003`), rồi gửi thư thử:
   `pnpm manage sendtestemail <email nhận>`.
3. Tài khoản mẫu cần có email thì thông báo mới có kênh email: chạy `seed_signing_demo --email-domain <miền>` (gán
   `<username>@<miền>` cho tài khoản mẫu chưa có email). Không có email thì chỉ có thông báo trong ứng dụng.
4. Email lỗi được ghi `THAT_BAI` kèm lý do trong `signing_notification`; sửa cấu hình xong chạy
   `python manage.py gui_thong_bao_trinh_ky` để gửi lại.

## 6. Cách chạy

```bash
pnpm db:setup                                           # dựng DB local (scripts/build_db.py --seed)
cd backend
DEMO_PASSWORD='<mật khẩu demo>' python manage.py seed_signing_demo   # dữ liệu mẫu, chạy lại không nhân bản
python manage.py seed_signing_demo --reset              # hủy bộ hồ sơ mẫu cũ (giữ bằng chứng, lùi 30 ngày) rồi tạo lại
python manage.py nhac_han_trinh_ky                      # nhắc hạn/quá hạn, chạy định kỳ
python manage.py gui_thong_bao_trinh_ky                 # gửi lại email lỗi, chạy định kỳ
python manage.py runserver                              # cùng `pnpm dev` ở frontend
```

Trên staging, deploy chỉ chạy migration; lệnh dữ liệu mẫu chạy tay một lần trên máy chủ (xem
`du-lieu-mau-va-tinh-trang-nghiep-vu.md` mục 5.6).

Tài khoản mẫu: `truongphong` (ký cấp 1, có hồ sơ chờ ký), `giamdoc` (ký cấp 2, ký thay theo ủy quyền), `vanthu`
(người trình, đủ trạng thái), `chuyenvien` (soạn nháp), `admin` (quản trị, ủy quyền). Sau khi chạy lệnh mẫu, mỗi người
ký tự tạo khóa ký ở trang **Khóa ký & PIN** (tải file khóa) trước khi ký.

## 7. Kiểm thử

```bash
python backend/manage.py test signing                   # PostgreSQL 16
python backend/manage.py test                           # toàn bộ
pnpm --dir frontend lint && pnpm --dir frontend exec tsc -b
pnpm --dir frontend check:i18n && pnpm --dir frontend check:tokens
pnpm --dir frontend test && pnpm --dir frontend build
```

Kết quả tại PR #251 (local, PostgreSQL 16): backend toàn bộ 1069 test, 0 skip, đạt; `test signing` 265 test đạt;
frontend lint, typecheck, i18n, tokens sạch, 525 test đạt, build đạt. E2E Playwright Chromium trên dữ liệu mẫu: tạo
khóa và tải file khóa, ký bằng file khóa + PIN, trả sửa, gửi bản sửa, không đồng ý ban hành, hủy, ủy quyền, xem PDF
desktop và mobile 390px, thông báo có người thực hiện và lý do.

## 8. Chưa làm và lý do

- Ủy quyền theo thời gian (`signing_delegation`) và thể thức `hinh_thuc_ky` (KT./TL./TUQ.): DDL chưa có bảng/cột, cần
  PR đổi schema riêng (DDL + migration + `DDL_CHANGELOG.md`).
- Leo thang quá hạn cho cấp trên trực tiếp: chưa có dữ liệu cấp trên trực tiếp từ Nhóm 7.
- Đánh dấu đã đọc thông báo lưu ở trình duyệt; bảng `signing_notification` chưa có cột đã đọc.
- Tìm không dấu dùng `LOWER(TRANSLATE(...))` sẵn có của PostgreSQL, quét tuần tự (đủ cho quy mô hiện tại). Muốn dùng
  extension `unaccent` và index theo biểu thức thì phải đổi `release_DDL.sql` (`CREATE EXTENSION`, function
  `IMMUTABLE`, index), cần PR đổi schema riêng theo AGENTS.md mục 5–6. Dữ liệu lưu dạng tổ hợp (NFD) chưa được chuẩn
  hóa khi tìm.

## 9. Sửa lỗi kiểm thử staging (sau PR #251)

- `DEFAULT_FROM_EMAIL` trống làm mọi email SMTP lỗi `Invalid address ''`: thêm system check `signing.W003`, giá trị mẫu
  trong `.env.example`, hướng dẫn mục 5.2.
- Một văn bản có nhiều hồ sơ trình ký chạy song song: chặn ở service (tạo nháp, gửi trình, trình lại), trả 409
  `van_ban_da_co_ho_so_dang_mo`; khóa advisory theo văn bản tránh hai yêu cầu đồng thời cùng qua.
- `SIGNING_EMAIL_BACKEND` đặt SMTP lỗi trên Django 6.1 (`The EMAIL_HOST setting is not available when MAILERS is
  defined`): giá trị SMTP dùng mailer mặc định của dự án; chạy được trên Django 5.2 và 6.1; check `signing.W002`,
  `signing.E004`.
- Danh sách hồ sơ phân trang (backend `page`/`page_size`, giao diện thanh phân trang, đổi bộ lọc về trang 1).
- Tìm không dấu ở danh sách hồ sơ, trang tệp, chọn văn bản đi và lọc quy trình.
- Form "Tạo quy trình": ô tên cấp ký có nhãn "Tên cấp ký" (trước đó dùng nhầm "Tên quy trình").
- Email và thông báo "Cần ký", "Sắp đến hạn", "Quá hạn" ghi hạn xử lý của cấp (dd/mm/yyyy HH:MM); API `thong-bao/`
  trả `han_xu_ly`.
- `seed_signing_demo --reset`: bộ hồ sơ mẫu cũ lùi ngày tạo/ngày trình 30 ngày nên không chen vào 5 phiếu gần nhất
  của Dashboard.
- Tab "Tệp trình ký" đổi lại thành "Văn bản công khai" (en "Public documents") theo quyết định của nhóm, đảo ngược
  thay đổi ở PR #251. Khối "Tài liệu" trong trang chi tiết hồ sơ giữ nguyên.

## 10. Nhật ký thay đổi PR #251

- Ủy quyền ký khẩn cấp `POST trinh-ky/{id}/uy-quyen/`; người giao ủy quyền vẫn xem được hồ sơ; giao diện "Ký thay".
- File khóa `.tlbmkey` (bản bọc private key): xuất khi tạo khóa và đổi PIN, nhập vào thiết bị, ký bằng file + PIN.
- Thông báo: hủy báo người tạo (khi hủy thay) và người đã ký; tin nhắn trao đổi; nhắc hạn/quá hạn (`nhac_han_trinh_ky`);
  số thông báo mới ở tab; email và thông báo ghi người thực hiện và lý do.
- Lịch sử hiển thị người thực hiện; ghi "Gửi trình ký" trước "Mở cấp ký".
- API Dashboard cho Nhóm 1 và selector `tong_quan_dashboard`.
- Lệnh dữ liệu mẫu duy nhất `seed_signing_demo` (`--reset`, mật khẩu từ `DEMO_PASSWORD`); gỡ lệnh cũ
  `seed_demo_signing` (ghi cứng mật khẩu, khóa bí mật suy ra từ chuỗi cố định).
- Lỗi từ rà soát E2E staging:
  - vùng xem PDF trắng do pdfjs-dist 5.x gọi `Map.prototype.getOrInsertComputed`: dùng bản legacy có polyfill, hiện lỗi
    thay vì nuốt, hủy lần vẽ cũ trước khi vẽ lại;
  - danh sách trên màn hình 390px mất cột trạng thái: dạng thẻ cho màn hình hẹp;
  - hồ sơ từ chối/hủy vẫn "đang ký": cấp chuyển `TAM_DUNG`, người chưa ký "Không còn cần ký";
  - email từ chối, trả sửa, hủy thiếu lý do và người thao tác: đã bổ sung;
  - lỗi 404/401 của API trả tiếng Anh: trả tiếng Việt;
  - hồ sơ trả lại hiện "Đang chờ ký", quá hạn không có dấu: badge "Đang trả lại để sửa", "Quá hạn";
  - tab tài liệu "Văn bản công khai": đổi thành "Tệp trình ký";
  - nút trợ lý AI nổi che nút hành động: chừa khoảng dưới trong trang Trình ký;
  - bổ sung test frontend cho TaoHoSoPage, KhoaPage, TraoDoiPanel, KetQuaPanel, XemPdf.
