# TLBM — Hệ thống Quản lý Văn bản và Tài liệu

Nền tảng quản lý văn bản, tài liệu và quy trình xử lý công việc nội bộ cho doanh nghiệp.

Đồ án môn Django — Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).

---

## Giới thiệu

TLBM số hóa các nghiệp vụ văn phòng của tổ chức trên một hệ thống thống nhất:

- **Văn bản**: quản lý văn bản đến, văn bản đi, phân quyền người xem.
- **Hồ sơ và tài liệu**: lưu trữ hồ sơ, tài liệu, biểu mẫu dùng chung.
- **Trình ký**: luân chuyển và ký duyệt văn bản nhiều cấp.
- **Công việc**: giao việc, theo dõi tiến độ, duyệt kết quả.
- **Quản trị**: cơ cấu tổ chức, cán bộ nhân viên, phân quyền.
- **Tiện ích**: đặt phòng họp, thông báo sinh nhật.
- **Trợ lý AI**: hỏi đáp và tra cứu văn bản.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Python 3.12, Django, Django REST Framework, JWT |
| Frontend | React, TypeScript, Vite |
| Cơ sở dữ liệu | PostgreSQL |
| CI | GitHub Actions |

## Cấu trúc thư mục

```text
.
├── backend/     # Django REST API
├── frontend/    # Ứng dụng React
├── docs/        # Tài liệu dự án
└── .github/     # CI và mẫu issue, pull request
```

## Cài đặt

Yêu cầu: Python 3.12+, Node.js 22.22+ hoặc 24.15+, pnpm 10.

**Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**

```bash
cd frontend
pnpm install
pnpm dev
```

Mặc định backend chạy tại `http://127.0.0.1:8000`, frontend tại `http://localhost:5173`. Cấu hình môi trường tham khảo `.env.example`.

## Tài liệu

- Tài liệu dùng chung: [`docs/common/`](docs/common/)
- Đặc tả theo phân hệ: [`docs/modules/`](docs/modules/)
- Quy ước đóng góp: [`docs/common/guidelines/`](docs/common/guidelines/)

## Đóng góp

Mọi thay đổi thực hiện qua Pull Request vào nhánh `staging`, tuân theo quy ước tại `docs/common/guidelines/`.

## Nhóm phát triển

Dự án được thực hiện bởi 8 nhóm sinh viên Khoa Công nghệ Thông tin, Trường Cao đẳng Công nghệ Thông tin TP.HCM, dưới sự hướng dẫn của NCS.ThS. Trần Phương Duy.

---

© 2026 Dự án TLBM — Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).
