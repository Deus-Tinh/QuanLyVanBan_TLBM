# TLBM — Hệ thống Quản lý Văn bản và Tài liệu (QLVB&TL)

Hệ thống nội bộ số hóa luồng văn bản đến/đi, hồ sơ lưu trữ, tài liệu biểu mẫu, trình ký, giao việc và tiện ích văn phòng cho doanh nghiệp. Đồ án môn Django, Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).

| Hạng mục | Giá trị |
|---|---|
| Nhánh tích hợp | `staging` |
| Trạng thái | Đang tích hợp nền chung (xem [Trạng thái bàn giao](#2-trạng-thái-bàn-giao)) |
| Backend | Django 6.1, Django REST Framework, SimpleJWT — Python 3.12 |
| Frontend | React 19, TypeScript 6, Vite 8 — Node.js 22.22+ / 24.15+, pnpm 10 |
| Cơ sở dữ liệu | PostgreSQL 16 (môi trường dùng chung), SQLite (phát triển cục bộ) |
| Theo dõi tiến độ | Issue tổng [#68](../../issues/68), milestone `Base staging`, `MVP` |

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Trạng thái bàn giao](#2-trạng-thái-bàn-giao)
3. [Phạm vi chức năng](#3-phạm-vi-chức-năng)
4. [Kiến trúc](#4-kiến-trúc)
5. [Cấu trúc mã nguồn](#5-cấu-trúc-mã-nguồn)
6. [Cài đặt và chạy cục bộ](#6-cài-đặt-và-chạy-cục-bộ)
7. [Cơ sở dữ liệu](#7-cơ-sở-dữ-liệu)
8. [Kiểm thử và CI](#8-kiểm-thử-và-ci)
9. [Triển khai](#9-triển-khai)
10. [Bảo mật và dữ liệu](#10-bảo-mật-và-dữ-liệu)
11. [Quy trình phát triển](#11-quy-trình-phát-triển)
12. [Hạn chế đã biết](#12-hạn-chế-đã-biết)
13. [Tổ chức dự án](#13-tổ-chức-dự-án)
14. [Tài liệu liên quan](#14-tài-liệu-liên-quan)

---

## 1. Tổng quan

TLBM quản lý vòng đời văn bản và tài liệu trong tổ chức:

- **Văn bản đến/đi**: tiếp nhận, vào sổ, cấp số, phân phối, tra cứu; phạm vi xem `Nội bộ` hoặc `Hạn chế`; độ khẩn.
- **Hồ sơ và tài liệu**: hồ sơ lưu trữ, loại văn bản, tài liệu và biểu mẫu dùng chung.
- **Trình ký**: quy trình ký nhiều cấp, chữ ký điện tử nội bộ có kiểm tra toàn vẹn, khâu phát hành.
- **Công việc**: giao việc, theo dõi tiến độ, duyệt kết quả.
- **Quản trị và tiện ích**: cơ cấu tổ chức, chức vụ, cán bộ nhân viên, phân quyền, phòng họp, sinh nhật.
- **Trợ lý AI**: hỏi đáp trên văn bản người dùng có quyền xem.

Hệ thống tách backend (REST API) và frontend (SPA), giao tiếp qua JSON và JWT.

---

## 2. Trạng thái bàn giao

Cập nhật: 07/10/2026. Nguồn chi tiết: issue [#68](../../issues/68).

| Thành phần | Trên `staging` | Ghi chú |
|---|---|---|
| App Shell, đăng nhập JWT, dashboard (Nhóm 1) | Có | Dashboard đang dùng model tạm, chuyển sang dữ liệu thật theo [#83](../../issues/83) |
| Trợ lý AI (Nhóm 8) | Có | Chuyển sang đọc view `ai_*` theo [#83](../../issues/83) |
| Sinh nhật (Nhóm 7) | Có | |
| CI: lint, test, build, i18n, design token, migration PostgreSQL | Có | Check `frontend` đang đỏ do design token (mục 12) |
| `Employee`, RBAC, đơn vị, chức vụ (Nhóm 7) | Chưa | PR [#72](../../pull/72), điều kiện tiên quyết cho các nhóm còn lại |
| DDL chuẩn (`docs/common/database/release_DDL.sql`) | Chưa | Đang ở nhánh `ddl_base_v0` |
| Văn bản, hồ sơ, tài liệu, trình ký, công việc (Nhóm 2–6) | Chưa | Phát triển trên nhánh nhóm, tích hợp theo thứ tự trong [#68](../../issues/68) |

Thứ tự tích hợp: `Employee`/RBAC → DDL → các phân hệ nghiệp vụ. Triển khai lên máy chủ Linux chỉ thực hiện sau khi toàn bộ mục trong milestone `Base staging` hoàn thành.

---

## 3. Phạm vi chức năng

| Nhóm | Phân hệ | Nhánh | App backend | Chức năng chính |
|:---:|---|---|---|---|
| 1 | Layout, Dashboard | `1_layout_home` | `dashboard`, `accounts` | App Shell dùng chung qua `<Outlet />`, header, sidebar đa cấp, 2 giao diện sáng/tối, đăng nhập, dashboard |
| 2 | Văn bản | `2_documents` | `documents` | Văn bản đến/đi, phạm vi xem, độ khẩn, nhật ký xem, nhập/xuất Excel |
| 3 | Hồ sơ | `3_dossiers_documents` | `records` | Hồ sơ lưu trữ, loại văn bản, liên kết văn bản – hồ sơ |
| 4 | Tài liệu, biểu mẫu | `4_documents_templates` | `document_templates` | Danh mục và chi tiết tài liệu, biểu mẫu, tệp đính kèm, hiệu lực |
| 5 | Trình ký | `5_signing_workflow` | `signing` | Quy trình ký nhiều cấp, khóa ký Ed25519 bảo vệ bằng PIN, nhật ký chỉ ghi thêm, phát hành |
| 6 | Công việc | `6_tasks` | `work` | Giao việc, người chủ trì/phối hợp, duyệt, báo cáo |
| 7 | Quản trị, tiện ích | `7_meeting_rooms_birthdays_system` | `accounts`, `authorization`, `organizations`, `birthdays` | Cán bộ nhân viên, đơn vị, chức vụ, nhóm quyền, phòng họp, sinh nhật |
| 8 | Trợ lý AI | `8_ai_chatbox` | `backend/services`, `backend/api` | Hỏi đáp trên văn bản có quyền xem, truy vấn chỉ đọc |

Đặc tả chi tiết từng phân hệ: `docs/modules/<số>_<tên>/`.

---

## 4. Kiến trúc

```text
┌───────────────────────────┐     HTTPS / JSON + JWT     ┌──────────────────────────────┐
│ Frontend (React SPA)      │ ─────────────────────────► │ Backend (Django + DRF)       │
│ Vite build → file tĩnh    │ ◄───────────────────────── │ /api/auth, /api/<phân hệ>/   │
└───────────────────────────┘                            └──────────────┬───────────────┘
                                                                        │ ORM / SQL
                                                         ┌──────────────▼───────────────┐
                                                         │ PostgreSQL 16                │
                                                         │ Schema: release_DDL.sql      │
                                                         │ Role chỉ đọc qlvb_readonly   │
                                                         │ (trợ lý AI, chỉ qua view ai_*)│
                                                         └──────────────────────────────┘
```

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Giao diện | React 19, TypeScript 6, Vite 8, `react-router-dom` | Định tuyến URL thật, mọi trang dùng chung `MainLayout` |
| Định dạng giao diện | CSS Variables (`frontend/src/styles/global.css`) | Không dùng mã màu hex hoặc cỡ chữ pixel trực tiếp |
| Đa ngôn ngữ | `vi`, `en` | Mọi chuỗi giao diện qua `t('namespace.key')` |
| API | Django REST Framework | Tiền tố `/api/` |
| Xác thực | SimpleJWT (access + refresh) | `apiClient` tự gắn Bearer token, tự làm mới khi nhận 401 |
| Phân quyền | RBAC theo codename (`user.has_perm("<codename>")`) | Quyền và nhóm quyền seed từ DDL |
| Người dùng | `accounts.Employee` làm `AUTH_USER_MODEL` | Có hiệu lực trên `staging` sau PR #72 |

---

## 5. Cấu trúc mã nguồn

```text
.
├── backend/
│   ├── config/             # settings.py, settings_ci.py, urls.py, wsgi.py, asgi.py
│   ├── apps/               # App nghiệp vụ Django (accounts, dashboard, birthdays, ...)
│   ├── api/                # API trợ lý AI
│   ├── services/           # Dịch vụ trợ lý AI (RAG, nguồn dữ liệu SQL chỉ đọc)
│   ├── tests/              # Test tích hợp dùng chung
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/            # Router, App, main
│   │   ├── layouts/        # MainLayout
│   │   ├── pages/          # Trang theo phân hệ
│   │   ├── components/     # Component theo phân hệ
│   │   ├── lib/            # apiClient, authService, routes, constants
│   │   ├── i18n/           # en.json, translate.ts, vi.json
│   │   ├── styles/         # global.css (design token)
│   │   └── types/
│   ├── scripts/            # check-i18n.mjs, check-css-tokens.mjs
│   └── package.json
├── data/                   # Dữ liệu tham chiếu của trợ lý AI
├── docs/
│   ├── common/             # Kiến trúc, quy chuẩn, CSDL, quy trình dùng chung
│   └── modules/            # Đặc tả theo phân hệ
├── .github/                # Workflow CI, mẫu issue/PR
└── .env.example
```

---

## 6. Cài đặt và chạy cục bộ

### Yêu cầu

| Công cụ | Phiên bản |
|---|---|
| Python | 3.12 trở lên |
| Node.js | 22.22.2+ hoặc 24.15.0+ (Node 18/20 không chạy được `pnpm test`) |
| pnpm | 10.x (không dùng npm/yarn để giữ nguyên `pnpm-lock.yaml`) |
| PostgreSQL | 16 (chỉ cần khi chạy với DDL chuẩn hoặc test tích hợp) |

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

- API: `http://127.0.0.1:8000/api/`
- Django Admin: `http://127.0.0.1:8000/admin/`

Mặc định chạy SQLite để phát triển nhanh. Chạy trên PostgreSQL theo [mục 7](#7-cơ-sở-dữ-liệu).

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

- Ứng dụng: `http://localhost:5173/`
- Địa chỉ API cấu hình qua `VITE_API_BASE_URL` (xem `.env.example`).

Tài khoản đăng nhập cục bộ tạo bằng `createsuperuser`. Repo không chứa tài khoản hoặc mật khẩu mặc định.

---

## 7. Cơ sở dữ liệu

**Nguồn sự thật của schema:** `docs/common/database/release_DDL.sql` trên nhánh `ddl_base_v0` (54 bảng, 21 ENUM, 77 quyền, 5 nhóm quyền). Migration Django phải tạo ra đúng bảng, cột, kiểu và ràng buộc như DDL.

Quy tắc thay đổi schema:

1. Mở PR vào `ddl_base_v0`, chỉ sửa `docs/common/database/`; workflow `DDL Check` phải pass.
2. Sau khi PR DDL đã merge, phân hệ mới mở PR chứa migration tương ứng.

Dựng cơ sở dữ liệu cho môi trường dùng chung:

```bash
# 1. Tạo role chỉ đọc cho trợ lý AI TRƯỚC khi nạp DDL (khối cấp quyền chỉ chạy khi role đã tồn tại)
psql -d postgres -c "CREATE ROLE qlvb_readonly LOGIN PASSWORD '<mật khẩu từ biến môi trường>'"

# 2. Tạo database và nạp DDL
createdb tlbm
psql -d tlbm -v ON_ERROR_STOP=1 -f docs/common/database/release_DDL.sql

# 3. Đánh dấu migration nền đã áp dụng (bảng đã có từ DDL)
cd backend
python manage.py migrate contenttypes
python manage.py migrate auth --fake
python manage.py migrate accounts --fake
python manage.py migrate organizations --fake
python manage.py migrate authorization
python manage.py migrate --fake-initial
```

Trigger bảo toàn dữ liệu (chữ ký, nhật ký chỉ ghi thêm), view `ai_*` và quyền của role chỉ đọc chỉ có trong DDL, Django migration không tạo ra. Vì vậy môi trường dùng chung luôn dựng từ DDL, không dựng bằng `migrate` thuần.

---

## 8. Kiểm thử và CI

Chạy cục bộ trước khi mở PR:

```bash
# Backend
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test

# Frontend
cd frontend
pnpm lint
pnpm test
pnpm build
pnpm check:i18n
pnpm check:tokens
```

Workflow trên GitHub Actions:

| Workflow | Job | Nội dung |
|---|---|---|
| `CI` | `backend` | `check`, kiểm tra migration, test (Python 3.12) |
| `CI` | `frontend` | lint, test, build, kiểm tra i18n và design token (Node 24) |
| `DB Integration` | `migrate-postgres` | Áp migration trên PostgreSQL, phát hiện xung đột giữa các nhánh |
| `DDL Check` (nhánh `ddl_base_v0`) | `ddl-load` | Nạp DDL trên PostgreSQL trống, có và không có role chỉ đọc |
| `Route pull request reviews` | `route-reviewers` | Tự gán người review theo phân hệ |

---

## 9. Triển khai

Môi trường đích: máy chủ Linux, PostgreSQL 16, backend chạy WSGI sau reverse proxy, frontend phục vụ file tĩnh từ `pnpm build`.

Điều kiện triển khai: toàn bộ milestone `Base staging` hoàn thành và CI trên `staging` xanh.

Trình tự:

1. Dựng database theo [mục 7](#7-cơ-sở-dữ-liệu); sao lưu ngay sau khi nạp DDL (`pg_dump`).
2. Cấu hình biến môi trường production:
   - `DJANGO_DEBUG=False`, `DJANGO_SECRET_KEY` riêng, `DJANGO_ALLOWED_HOSTS` theo tên miền;
   - `SIGNING_PIN_SECRET` riêng (phân hệ trình ký; đổi giá trị làm mọi PIN đã đặt mất hiệu lực);
   - thông tin kết nối PostgreSQL và mật khẩu role `qlvb_readonly`.
3. Cài backend, chạy `python manage.py collectstatic`, khởi động WSGI.
4. Build frontend với `VITE_API_BASE_URL` của môi trường, đặt file tĩnh sau reverse proxy.
5. Kiểm tra nhanh:
   - đăng nhập bằng tài khoản `Employee`;
   - mở danh sách văn bản đến/đi;
   - role `qlvb_readonly` truy vấn bảng `documents_vanbanden` phải bị từ chối quyền.

Không đưa khóa, mật khẩu hoặc file `.env` vào repo.

---

## 10. Bảo mật và dữ liệu

- **Phạm vi xem văn bản**: văn bản `HAN_CHE` chỉ người tạo, người nhận và thành viên đơn vị nhận xem được, không ngoại lệ cho superuser. Mọi lượt mở được ghi `documents_view_log`. Toàn bộ phân hệ lấy văn bản qua một hàm dùng chung của phân hệ Văn bản.
- **Trợ lý AI**: không dùng văn bản `HAN_CHE` trong mọi trường hợp; chỉ đọc qua view `ai_*` bằng role chỉ đọc.
- **Trình ký**: backend không lưu khóa bí mật; khóa ký bảo vệ bằng PIN, chống dò PIN theo số lần sai; chữ ký và nhật ký là bằng chứng bất biến.
- **Phân quyền**: mọi thao tác ghi kiểm quyền RBAC ở API; không có endpoint ghi cho người dùng ẩn danh.
- **Dữ liệu cá nhân**: hệ thống xử lý dữ liệu nhân viên và có thể chứa dữ liệu khách hàng. Kiểm soát truy cập và nhật ký truy cập là yêu cầu bắt buộc theo Luật Bảo vệ dữ liệu cá nhân 2025.

---

## 11. Quy trình phát triển

| Nhánh | Vai trò | Người merge |
|---|---|---|
| `main` | Bản phát hành | DevOps |
| `staging` | Tích hợp chung | DevOps |
| `ddl_base_v0` | Schema chuẩn | DevOps |
| `<số>_<phân hệ>` | Nhánh của từng nhóm | Trưởng nhóm |
| `feat/...`, `fix/...`, `docs/...` | Nhánh tính năng, tạo từ nhánh nhóm hoặc `staging` | — |

Quy tắc:

- Không commit trực tiếp vào `main`, `staging`, `ddl_base_v0`. Mọi thay đổi qua Pull Request.
- PR được merge khi CI xanh, có ít nhất 1 approve, không còn xung đột.
- Mỗi PR gắn issue (`Closes #<số>`), label nhóm (`nhom-1` … `nhom-8`) và milestone (`Base staging` hoặc `MVP`).
- Commit theo Conventional Commits: `feat(scope): ...`, `fix(scope): ...`, `docs: ...`.
- Thay đổi schema theo [mục 7](#7-cơ-sở-dữ-liệu): DDL trước, migration sau.

Chi tiết: `docs/common/guidelines/quy-uoc-quan-ly-du-an.md`, `docs/common/guidelines/git_workflow.md`, `docs/common/QUALITY_GATE_STAGING.md`.

---

## 12. Hạn chế đã biết

| Hạn chế | Ảnh hưởng | Theo dõi |
|---|---|---|
| `backend/config/settings.py` đặt cứng `SECRET_KEY`, `DEBUG = True`, SQLite; chưa đọc biến trong `.env.example` | Chưa dùng được cho production | [#68](../../issues/68) mục C8 |
| `backend/django_project/settings.py` trùng lặp, không được sử dụng | Gây nhầm cấu hình | [#68](../../issues/68) mục C8 |
| `frontend/src/style.css` còn 37 mã màu hex | Check `frontend` đỏ trên mọi PR vào `staging` | [#68](../../issues/68) mục C9 |
| `psycopg` chưa có trong `requirements.txt` (CI cài riêng) | Chạy PostgreSQL cục bộ phải cài thêm `psycopg[binary]` | [#68](../../issues/68) mục C8 |
| Một số chỗ còn tham chiếu văn bản mật (đã bỏ khỏi thiết kế) | Lệch với DDL hiện hành | [#83](../../issues/83) |
| Repo private trên gói GitHub Free không hỗ trợ bảo vệ nhánh | Quy tắc merge đang là quy ước thủ công | [#67](../../issues/67) mục 7 |

---

## 13. Tổ chức dự án

| Vai trò | Người phụ trách |
|---|---|
| Giảng viên hướng dẫn | NCS.ThS. Trần Phương Duy |
| Project Manager | Châu Tuấn Kiệt (Nhóm 1) |
| Data Architect | Tô Thanh Tân (Nhóm 7) |
| DevOps Lead | Lê Thanh Hậu (Nhóm 5) |

| Nhóm | Trưởng nhóm | Thành viên | Phân hệ |
|:---:|---|---|---|
| 1 | Châu Tuấn Kiệt | Nguyễn Văn Hiếu, Nguyễn Duy Quân | Layout, Dashboard |
| 2 | Lê Trí Kiệt | Nguyễn Anh Đô, Nguyễn Tấn Lộc Khiêm, Trần Nhật Tân | Văn bản |
| 3 | Đặng Trường Thịnh | Phan Thị Ánh Tuyền, Nguyễn Thị Yến Nhi | Hồ sơ |
| 4 | Thượng Mạnh Quỳnh | Huỳnh Thị Kim Trang, Nguyễn Chí Tín, Đỗ Trung Phong | Tài liệu, biểu mẫu |
| 5 | Lê Thanh Hậu | Lê Thành Tài | Trình ký, DevOps |
| 6 | Phan Tạ Hữu Đức | Nguyễn Duy Bảo, Đỗ Ngọc Phát, Lâm Chí Vĩ | Công việc |
| 7 | Tô Thanh Tân | Lê Duy Khánh, Đỗ Mạnh Quang, Nguyễn Phan Minh Hiếu, Trần Đình Tình | Quản trị, phòng họp, sinh nhật |
| 8 | Trần Vũ Giang Anh | Huỳnh Vương Thanh Nhã | Trợ lý AI |

---

## 14. Tài liệu liên quan

| Tài liệu | Nội dung |
|---|---|
| `docs/common/ITC - Django - QLVB&TL.md` | Đặc tả đề bài và phân công |
| `docs/common/architecture/structure.md` | Cấu trúc thư mục chuẩn |
| `docs/common/FRONTEND_BASELINE_GUIDE.md` | Hướng dẫn thêm màn hình vào App Shell |
| `docs/common/QUALITY_GATE_STAGING.md` | Điều kiện đưa mã nguồn lên `staging` |
| `docs/common/guidelines/git_workflow.md` | Quy trình Git |
| `docs/common/guidelines/quy-uoc-quan-ly-du-an.md` | Quy ước merge, schema, issue/label/milestone |
| `docs/modules/` | Đặc tả từng phân hệ |

---

© 2026 Dự án QLVB&TL — Khoa Công nghệ Thông tin, Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).
