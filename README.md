# TLBM — Hệ thống Quản lý Văn bản và Tài liệu

TLBM là nền tảng quản lý văn bản, tài liệu và điều hành công việc nội bộ dành cho doanh nghiệp. Hệ thống đưa toàn bộ luồng giấy tờ, phê duyệt và trao đổi công việc của tổ chức lên môi trường số, giúp việc xử lý nhanh hơn, minh bạch hơn và dễ tra cứu hơn.

Đồ án môn Django — Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).

---

## Tổng quan

Trong nhiều tổ chức, văn bản, hồ sơ và yêu cầu phê duyệt vẫn được luân chuyển qua giấy tờ, email và tin nhắn rời rạc, khó theo dõi và dễ thất lạc. TLBM giải quyết bài toán đó bằng một hệ thống tập trung, nơi mỗi văn bản, tài liệu và đầu việc đều có chủ thể phụ trách, trạng thái xử lý và lịch sử rõ ràng.

Hệ thống hướng tới ba mục tiêu:

- **Tập trung**: một nơi duy nhất để lưu trữ, tra cứu và xử lý văn bản, tài liệu của toàn tổ chức.
- **Minh bạch**: mọi bước luân chuyển, phê duyệt và truy cập đều được ghi nhận.
- **An toàn**: dữ liệu được phân quyền theo vai trò và đơn vị; tài liệu hạn chế chỉ người được chỉ định mới truy cập được.

## Tính năng chính

- Quản lý văn bản đến, văn bản đi và hồ sơ lưu trữ.
- Kho tài liệu, biểu mẫu dùng chung trong tổ chức.
- Luân chuyển và phê duyệt văn bản nhiều cấp với chữ ký điện tử nội bộ.
- Giao việc, theo dõi tiến độ và duyệt kết quả công việc.
- Quản trị cơ cấu tổ chức, nhân sự và phân quyền.
- Tiện ích văn phòng: đặt phòng họp, thông báo nội bộ.
- Trợ lý AI hỗ trợ tra cứu và hỏi đáp trên văn bản.

## Kiến trúc

Hệ thống gồm hai thành phần độc lập, giao tiếp qua REST API:

- **Backend** cung cấp API, xác thực bằng JWT và phân quyền theo vai trò.
- **Frontend** là ứng dụng web một trang, giao diện thống nhất, hỗ trợ chế độ sáng/tối và đa ngôn ngữ (Tiếng Việt, Tiếng Anh).

| Thành phần | Công nghệ |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Frontend | React, TypeScript, Vite |
| Cơ sở dữ liệu | PostgreSQL |
| CI | GitHub Actions |

## Cài đặt

Yêu cầu: Python 3.12+, Node.js 22+, pnpm.

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

Sau khi khởi động, truy cập ứng dụng tại `http://localhost:5173`. Cấu hình môi trường tham khảo `.env.example`.

## Cấu trúc dự án

```text
.
├── backend/     # Máy chủ API
├── frontend/    # Ứng dụng web
├── docs/        # Tài liệu dự án
└── .github/     # Quy trình CI và mẫu đóng góp
```

## Tài liệu

Tài liệu kiến trúc, quy chuẩn và đặc tả nghiệp vụ nằm trong thư mục [`docs/`](docs/).

## Đóng góp

Mọi thay đổi được thực hiện qua Pull Request vào nhánh `staging` và phải vượt qua kiểm tra tự động trước khi hợp nhất. Quy ước chi tiết xem tại `docs/common/guidelines/`.

## Thực hiện

Lớp **CD25CT_CLC** — Khoa Công nghệ Thông tin, Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).

Giảng viên hướng dẫn: NCS.ThS. Trần Phương Duy.

---

© 2026 Dự án QLVB&TL — Lớp CD25CT_CLC, giảng viên hướng dẫn NCS.ThS. Trần Phương Duy — Khoa Công nghệ Thông tin, Trường Cao đẳng Công nghệ Thông tin TP.HCM (ITC).
