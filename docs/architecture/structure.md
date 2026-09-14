# QLVB&TL — Cấu trúc dự án

Tài liệu này mô tả cấu trúc thư mục dự án, cách phân chia Backend Django và Frontend React, cùng tên các module nghiệp vụ. Khi tạo hoặc di chuyển mã nguồn, các nhóm sử dụng tài liệu này làm căn cứ tham chiếu.

## 1. Tầng ngoài cùng

| Tầng | Cấu trúc |
|---|---|
| Backend | `backend/` |
| Frontend | `frontend/` |
| Environment mẫu | `.env.example` |
| Tài liệu kỹ thuật | `docs/` |
| Git ignore | `.gitignore` |
| Tổng quan project | `README.md` |

```text
qlvbtl/
├── backend/
├── frontend/
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

---

## 2. Cấu trúc chi tiết

```text
qlvbtl/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   └── apps/
│       │
│       ├── accounts/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── organizations/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── authorization/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── documents/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── records/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── resources/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── approvals/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── work/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── meetings/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       ├── birthdays/
│       │   ├── migrations/
│       │   ├── __init__.py
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── urls.py
│       │   ├── views.py
│       │   └── tests.py
│       │
│       └── ai_assistant/
│           ├── migrations/
│           ├── __init__.py
│           ├── admin.py
│           ├── apps.py
│           ├── models.py
│           ├── serializers.py
│           ├── urls.py
│           ├── views.py
│           └── tests.py
│
├── frontend/
│   ├── package.json
│   │
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   └── router.tsx
│       │
│       ├── modules/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── documents/
│       │   │   ├── incoming/
│       │   │   ├── outgoing/
│       │   │   └── confidential/
│       │   ├── records/
│       │   ├── resources/
│       │   ├── approvals/
│       │   ├── work/
│       │   ├── meetings/
│       │   ├── birthdays/
│       │   ├── system/
│       │   │   ├── organizations/
│       │   │   ├── employees/
│       │   │   └── authorization/
│       │   └── ai-assistant/
│       │
│       └── shared/
│           ├── components/
│           ├── api/
│           ├── types/
│           └── utils/
│
├── docs/
│   ├── architecture/
│   │   └── structure.md
│   ├── api/
│   │   └── api.md
│   ├── database/
│   │   └── schema.md
│   └── development/
│       └── setup.md
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Cấu trúc module Django

```text
apps/<module>/
├── migrations/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── serializers.py
├── urls.py
├── views.py
└── tests.py
```

---

## 4. Cấu trúc module Frontend

```text
modules/<module>/
├── api/
├── components/
├── pages/
└── types/
```

---

## 5. Domain Map

```text
QLVB&TL
│
├── Tài khoản / CBNV
│   └── accounts
│
├── Cơ cấu tổ chức
│   └── organizations
│
├── Phân quyền
│   └── authorization
│
├── Văn bản
│   ├── Văn bản đến
│   ├── Văn bản đi
│   ├── Văn bản mật
│   └── documents
│
├── Hồ sơ
│   └── records
│
├── Tài liệu / Biểu mẫu
│   └── resources
│
├── Trình ký
│   └── approvals
│
├── Công việc
│   └── work
│
├── Phòng họp
│   └── meetings
│
├── Sinh nhật
│   └── birthdays
│
└── Chatbox AI
    └── ai_assistant
```

---

## 6. Cập nhật cấu trúc dự án

- Mã nguồn Backend đặt trong `backend/`; mã nguồn Frontend đặt trong `frontend/`.
- Mỗi module nghiệp vụ đặt trong đúng domain tương ứng ở Backend và Frontend.
- Thành phần dùng chung đặt trong `frontend/src/shared/`.
- Khi cần thay đổi cấu trúc dự án, cập nhật tài liệu này cùng thay đổi liên quan.
- Không tạo thư mục rỗng chỉ để mô phỏng cây thư mục. Thư mục được thêm khi có mã nguồn, file cấu hình hoặc file đánh dấu cần thiết.
