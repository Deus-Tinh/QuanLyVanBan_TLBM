# TLBM — Hệ thống Quản lý Văn bản và Tài liệu

TLBM là nền tảng quản lý văn bản, tài liệu và điều hành công việc nội bộ dành cho doanh nghiệp. Hệ thống tập trung toàn bộ luồng văn bản, hồ sơ, phê duyệt và trao đổi công việc của tổ chức về một nơi, giúp việc xử lý nhanh hơn, minh bạch hơn và dễ tra cứu hơn.

Đồ án môn Django — Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).

---

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Frontend | React, TypeScript, Vite |
| Cơ sở dữ liệu | PostgreSQL |
| CI | GitHub Actions |

## Cài đặt

Yêu cầu: Python 3.12+, Node.js 22+, pnpm.

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
# Frontend
cd frontend
pnpm install
pnpm dev
```

## Tài liệu

Tài liệu dự án nằm trong thư mục [`docs/`](docs/).

## Đóng góp

Mọi thay đổi thực hiện qua Pull Request vào nhánh `staging`.

## Thực hiện

Lớp CD25CT_CLC — Khoa Công nghệ Thông tin, Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).

Giảng viên hướng dẫn: NCS.ThS. Trần Phương Duy.

---

© 2026 Dự án TLBM.
