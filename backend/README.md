# TLBM SYSTEM — BACKEND API SERVICE
> **Phân hệ Máy chủ & API Dữ liệu (Django 5.x + Python)**  
> **Dự án**: Quản Lý Văn Bản và Tài Liệu (QLVB&TL) — Trường CĐ CNTT TP.HCM (ITC)

---

## 🛠️ 1. Công nghệ & Yêu cầu môi trường

- **Framework**: Django 5.x (Python Web Framework)
- **Python**: Khuyến nghị Python 3.10 trở lên
- **Database**: SQLite (môi trường phát triển nội bộ), có thể chuyển đổi PostgreSQL cho Production
- **API Architecture**: RESTful API, JSON responses

---

## 📂 2. Cấu trúc thư mục Backend

```text
backend/
├── config/                     # Cấu hình dự án Django chính
│   ├── settings.py             # Cấu hình Database, Installed Apps, Middleware, CORS
│   ├── urls.py                 # Định tuyến API cấp cao nhất
│   ├── wsgi.py                 # Cổng WSGI chạy Production
│   └── asgi.py                 # Cổng ASGI hỗ trợ Async / WebSocket
│
├── apps/                       # Các ứng dụng nghiệp vụ Django
│   ├── birthdays/              # Module dữ liệu sinh nhật CBNV (Nhóm 7 / Dashboard Nhóm 1)
│   └── ...                     # Các module khác đang tích hợp (documents, records,...)
│
├── db.sqlite3                  # Cơ sở dữ liệu SQLite cục bộ
└── manage.py                   # Script quản trị lệnh Django CLI
```

---

## 🚀 3. Hướng dẫn cài đặt & Khởi chạy

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Khởi tạo môi trường ảo (tùy chọn nhưng khuyến nghị)
python -m venv venv

# Kích hoạt môi trường ảo:
# Trên Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Trên Windows Command Prompt:
.\venv\Scripts\activate.bat

# 3. Cập nhật các bảng cơ sở dữ liệu
python manage.py migrate

# 4. (Tùy chọn) Tạo tài khoản quản trị tối cao Django Admin
python manage.py createsuperuser

# 5. Khởi chạy máy chủ Backend (Port 8000)
python manage.py runserver 127.0.0.1:8000
```

Truy cập:
- **Trang chủ Backend**: `http://127.0.0.1:8000/`
- **Django Admin Portal**: `http://127.0.0.1:8000/admin/`

---

## 🔗 4. Kết nối với Frontend React

- Frontend gọi đến Backend qua base URL: `http://127.0.0.1:8000/`
- Cấu hình CORS đã được thiết lập sẵn trong `config/settings.py` cho phép nguồn `http://localhost:5173` và `http://localhost:5174`.

---

## 🧪 5. Đặc tả API & Kịch bản Kiểm thử Tham chiếu (Test Reference & API Contracts)

> **Lưu ý trong giai đoạn phát triển**: Để giữ mã nguồn Backend tinh gọn và đúng chuẩn trạng thái ban đầu, các kịch bản kiểm thử đơn vị được lưu trữ tại tài liệu này nhằm làm tài liệu tham chiếu (Contract Specification) cho các lập trình viên Backend khi tiếp tục hoàn thiện nghiệp vụ.

### 5.1. Phân hệ Xác thực & Tài khoản (`apps.accounts`)

#### Danh sách API Endpoints:
| Endpoint | Method | Quyền hạn | Mô tả |
| :--- | :---: | :---: | :--- |
| `/api/auth/login/` | `POST` | Công khai | Đăng nhập cấp JWT Access & Refresh Token |
| `/api/auth/profile/` | `GET` | `IsAuthenticated` | Lấy thông tin hồ sơ cán bộ đăng nhập |
| `/api/auth/change-password/` | `POST` | `IsAuthenticated` | Đổi mật khẩu cá nhân (tối thiểu 8 ký tự) |
| `/api/auth/logout/` | `POST` | `IsAuthenticated` | Đăng xuất và đưa Refresh Token vào blacklist |

#### Bộ kịch bản kiểm thử mẫu (`AccountsAPITests`):
1. **`test_login_success`**: Đăng nhập đúng username/password ➔ Trả về `200 OK`, token JWT, payload `user` chuẩn hỗ trợ cả camelCase (`fullName`, `roleTitle`, `unit`) và snake_case.
2. **`test_login_invalid_credentials`**: Đăng nhập sai mật khẩu ➔ Trả về `401 Unauthorized` và thông báo lỗi tiếng Việt.
3. **`test_profile_unauthorized`**: Truy cập profile khi thiếu Header Bearer ➔ Trả về `401 Unauthorized`.
4. **`test_profile_authorized`**: Truy cập profile khi có token hợp lệ ➔ Trả về `200 OK` với thông tin cá nhân.
5. **`test_change_password_wrong_old_password`**: Nhập sai mật khẩu cũ ➔ Trả về `400 Bad Request` (*"Mật khẩu hiện tại không chính xác!"*).
6. **`test_change_password_short_new_password`**: Mật khẩu mới dưới 8 ký tự ➔ Trả về `400 Bad Request`.
7. **`test_change_password_success`**: Đổi mật khẩu hợp lệ ➔ Trả về `200 OK`.
8. **`test_logout`**: Gửi yêu cầu đăng xuất ➔ Trả về `200 OK`.

<details>
<summary><b>👉 Xem mã nguồn kiểm thử mẫu (Python TestCase)</b></summary>

```python
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import StaffProfile


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="admin",
            password="AdminPassword@123",
            email="quantri@donvi.gov.vn",
        )
        self.profile = StaffProfile.objects.create(
            user=self.user,
            full_name="Quản Trị Viên Hệ Thống",
            department="Văn phòng Trung tâm",
            position="Quản trị viên tối cao",
            role="admin",
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "AdminPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "admin")

    def test_login_invalid_credentials(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "WrongPassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_unauthorized(self):
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authorized(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["fullName"], "Quản Trị Viên Hệ Thống")

    def test_change_password_wrong_old_password(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {"old_password": "WrongPassword@123", "new_password": "NewSecurePassword@456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_short_new_password(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {"old_password": "AdminPassword@123", "new_password": "123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {"old_password": "AdminPassword@123", "new_password": "NewSecurePassword@456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_logout(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```
</details>

---

### 5.2. Phân hệ Quản lý Sinh nhật & Gửi Email Tự động (`apps.birthdays` — Issue #23)

Phân hệ Sinh nhật đảm nhiệm quản lý danh sách ngày sinh nhật của cán bộ nhân viên (CBNV), hiển thị widget trên Bảng điều khiển (Dashboard) và trang Lịch sinh nhật, đồng thời vận hành worker tự động gửi email chúc mừng sinh nhật kèm thiệp điện tử HTML trang trọng theo đúng ngày.

#### 1. Danh sách API Endpoints:
| Endpoint | Method | Quyền hạn | Mô tả |
| :--- | :---: | :---: | :--- |
| `/api/birthdays/calendar/?month=&year=` | `GET` | `IsAuthenticated` | Xem số lượng CBNV có sinh nhật theo từng ngày trong tháng (chỉ trả về số lượng đếm, không lộ thông tin cá nhân/năm sinh) |
| `/api/birthdays/day/?month=&day=&year=&page=&page_size=` | `GET` | `IsAuthenticated` | Lấy danh sách CBNV có sinh nhật trong ngày chỉ định (hỗ trợ phân trang, trả về họ tên, ngày/tháng sinh gốc, chức vụ, đơn vị) |
| `/api/birthdays/logs/?month=&year=&status=&page=` | `GET` | Quản trị viên (`is_staff`, `is_superuser`, hoặc `role == "admin"`) | Xem danh sách nhật ký gửi email chúc mừng sinh nhật, hỗ trợ lọc theo tháng, năm, trạng thái |
| `/admin/birthdays/birthdayemaillog/` | `GET/POST` | Quản trị viên Django Admin (`is_staff` / `is_superuser`) | Cổng quản trị, giám sát tiến trình worker, đối soát thủ công các bản ghi `PROCESSING` / `UNCERTAIN` |

#### 2. Quy tắc Dương lịch & Xử lý ngày 29/02 trong năm không nhuận:
- **Múi giờ & Lịch:** Hệ thống sử dụng thuần **Dương lịch** (Gregorian Calendar) và múi giờ chuẩn Việt Nam `Asia/Ho_Chi_Minh` (`USE_TZ = True`, `TIME_ZONE = "Asia/Ho_Chi_Minh"`). Dữ liệu ngày sinh nhật của nhân sự được truy vấn trực tiếp từ bảng `accounts_staffprofile` (`user.is_active = True`).
- **Chiến lược năm nhuận (`BIRTHDAY_LEAP_DAY_STRATEGY`):** Cấu hình mặc định là `FEB_28`.
  - Trong năm nhuận (như 2024, 2028,...): CBNV sinh ngày 29/02 được hiển thị và gửi email chúc mừng đúng ngày 29/02.
  - Trong năm không nhuận (như 2025, 2026, 2027,...): CBNV sinh ngày 29/02 được tổ chức và gửi email chúc mừng vào ngày **28/02**.
  - Các tùy chọn chiến lược hợp lệ: `FEB_28` (chúc mừng 28/02 - mặc định), `MAR_01` (chúc mừng 01/03), `SKIP` (bỏ qua không chúc mừng trong năm không nhuận).
  - Quy tắc này được áp dụng đồng bộ nhất quán giữa Frontend Calendar, Dashboard Widget và Worker gửi email tự động.

#### 3. Cấu hình SMTP & Lập lịch gửi thư (Scheduler):
- **Cấu hình biến môi trường (`.env`):**
  | Biến môi trường | Giá trị mặc định / Khuyến nghị | Mô tả |
  | :--- | :--- | :--- |
  | `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` | Backend gửi email (console cho dev nội bộ, SMTP cho staging/prod) |
  | `EMAIL_HOST` | `smtp.example.com` | Địa chỉ máy chủ SMTP của nhà cung cấp |
  | `EMAIL_PORT` | `587` (hoặc `465` cho SSL) | Cổng kết nối SMTP |
  | `EMAIL_HOST_USER` | `your-smtp-account` | Tài khoản xác thực gửi thư |
  | `EMAIL_HOST_PASSWORD` | `your-smtp-password` | Mật khẩu ứng dụng / Token SMTP (tuyệt đối không commit vào git) |
  | `EMAIL_USE_TLS` | `true` | Bật mã hóa STARTTLS (cổng 587) |
  | `EMAIL_USE_SSL` | `false` | Bật mã hóa SSL/TLS (cổng 465) |
  | `EMAIL_TIMEOUT` | `30` | Thời gian timeout kết nối (giây) |
  | `DEFAULT_FROM_EMAIL` | `qlvb-admin@itc.edu.vn` | Địa chỉ hiển thị người gửi |
  | `BIRTHDAY_LEAP_DAY_STRATEGY` | `FEB_28` | Chiến lược xử lý ngày 29/02 trong năm không nhuận |

- **Lệnh thực thi gửi tự động (Management Command):**
  ```bash
  python manage.py send_birthday_emails [--date YYYY-MM-DD] [--retries N] [--allow-locmem]
  ```
  - `--date YYYY-MM-DD`: Chỉ định ngày gửi cụ thể (mặc định là ngày hiện tại theo giờ Việt Nam).
  - `--retries N`: Số lần thử lại tối đa sau lượt đầu khi gặp sự cố mạng tạm thời (mặc định 3, tối đa 10). Chỉ các lỗi xảy ra trước khi SMTP chấp nhận thư mới được tự động retry.
  - `--allow-locmem`: Chỉ dùng riêng trong môi trường test tự động, cấm dùng trên môi trường thật.

- **Cấu hình Scheduler (Cronjob):**
  Khuyến nghị cấu hình cronjob chạy **1 lần mỗi ngày** vào đầu giờ làm việc buổi sáng (ví dụ: 07:00 sáng theo giờ `Asia/Ho_Chi_Minh`):
  ```bash
  # Tham khảo file mẫu tại backend/deploy/birthday-email.cron.example
  0 7 * * * cd /path/to/QuanLyVanBan_TLBM/backend && /path/to/venv/bin/python manage.py send_birthday_emails >> /path/to/logs/birthday-email.log 2>&1
  ```

#### 4. Quy trình gửi email, `attempt_id` & Cơ chế chống gửi trùng:
- **Ràng buộc toàn vẹn CSDL:** Khóa duy nhất `UniqueConstraint(fields=["staff", "birthday_year"], name="unique_staff_birthday_year")` đảm bảo tuyệt đối không có 2 bản ghi gửi thư cho cùng một nhân sự trong cùng một năm dương lịch.
- **Khóa hàng đồng thời (`select_for_update`):** Khi worker nhận bản ghi hợp lệ (`PENDING`, `SKIPPED`, hoặc `FAILED` còn lượt thử lại), hàm `_claim_delivery` thực thi `select_for_update()` trong `transaction.atomic()`, gán trạng thái `PROCESSING`, sinh mã phiên ngẫu nhiên `attempt_id = uuid.uuid4()` và ghi lại `worker_pid`, `worker_host`.
- **Cơ chế chống worker cũ ghi đè (Stale Worker Protection):** Khi worker hoàn thành gửi và gọi `_record_delivery_result`, hệ thống kiểm tra `locked_log.attempt_id == attempt_id`. Nếu worker bị timeout/treo và worker mới hoặc admin đã can thiệp thay đổi `attempt_id`, kết quả từ worker cũ bị từ chối triệt để, không thể ghi đè trạng thái.
- **Giới hạn tốc độ gửi (Rate Limiting):** Worker áp dụng giới hạn an toàn tối đa 60 email/phút và chèn khoảng nghỉ tối thiểu 1 giây giữa các lượt gửi để bảo đảm không vượt quá quota của nhà cung cấp SMTP.

#### 5. Quy trình quản trị viên đối soát trạng thái (PROCESSING / UNCERTAIN):
- **Trạng thái `PROCESSING`:**
  - Biểu thị worker đang thực thi gửi email. Giao diện Django Admin hiển thị thông tin worker (`worker_host:worker_pid`) và trạng thái tiến trình thực tế (`is_pid_alive`).
  - Nếu worker vẫn đang chạy cục bộ: Admin bị KHÓA form, không thể chuyển sang `FAILED`, `PENDING` hay `UNCERTAIN` để ngăn ngừa xung đột gửi trùng.
  - Nếu worker đã dừng (crash, reboot máy chủ): Admin phải tích chọn `Xác nhận worker đã dừng` (`worker_stopped = True`), đồng thời cung cấp bằng chứng (`evidence`) nếu worker chạy trên máy chủ khác.
- **Trạng thái `UNCERTAIN`:**
  - Phát sinh khi sự cố mạng hoặc ngắt kết nối xảy ra sau khi máy chủ SMTP đã nhận dữ liệu thư nhưng client chưa nhận được mã phản hồi 250 OK.
  - Hệ thống **KHÔNG tự động gửi lại** khi ở trạng thái này để tránh nguy cơ gửi lặp 2 email chúc mừng.
  - Quản trị viên đối soát với log/dashboard của nhà cung cấp SMTP:
    - *Nếu SMTP đã nhận và gửi thư:* Admin chuyển sang `SUCCESS`, bắt buộc nhập thời điểm gửi `sent_at` và bằng chứng đối soát `evidence`.
    - *Nếu SMTP xác nhận chưa nhận được thư:* Admin chuyển sang `FAILED`, ghi rõ lý do vào `evidence`. Sau đó scheduler mới được phép gửi lại.
  - An toàn giao dịch: Hàm `save_model` của Admin thực thi `select_for_update()`, xóa `attempt_id = None`, lưu `reconciled_at` và ghi chú `reconciliation_note`. Nếu 2 admin cùng mở form và submit đồng thời, admin submit sau sẽ bị chặn bởi lỗi xung đột `_loaded_attempt_id` (`forms.ValidationError`).
- **Trạng thái `SUCCESS`:**
  - Là trạng thái bất biến (immutable): Không thể sửa đổi thông tin gửi hay kích hoạt gửi lại từ Admin Portal.

#### 6. Giới hạn của SMTP & Các vấn đề phụ thuộc Issue #21 / #24:
- **Giới hạn kỹ thuật của SMTP:**
  - Trạng thái `SUCCESS` trong hệ thống chỉ xác nhận rằng máy chủ SMTP chấp nhận tiếp nhận thư (mã phản hồi 250 OK). Nó không bảo đảm 100% email đã đến hộp thư đến (Inbox) của người nhận (thư có thể bị lọc vào Spam, bị máy chủ người nhận từ chối sau đó, hoặc hộp thư người nhận bị đầy).
  - Giao thức SMTP không hỗ trợ giao dịch phân tán 2 pha (2PC). Nếu xảy ra ngắt kết nối sau khi máy chủ nhận xong phần DATA nhưng trước khi client nhận mã 250, việc rơi vào trạng thái `UNCERTAIN` là bắt buộc về mặt an toàn để tránh gửi lặp.
- **Phụ thuộc Issue #21 (Phân hệ Phòng họp):**
  - Module Sinh nhật và Phòng họp chia sẻ API Bảng điều khiển (`/api/dashboard/overview/`) để cung cấp thông tin sinh nhật hôm nay / ngày mai cùng lịch phòng họp trực quan cho cán bộ.
- **Phụ thuộc Issue #24 (Hồ sơ cán bộ & Phân quyền RBAC):**
  - Module Sinh nhật sử dụng `accounts.StaffProfile` (`full_name`, `department`, `position`, `birthday`, `user.email`). Hiện tại việc đối soát trong Admin đang dựa trên `is_staff`/`is_superuser` và kiểm tra vai trò `admin`. Khi Issue #24 hoàn tất phân quyền chi tiết (RBAC), quyền đối soát nhật ký sinh nhật sẽ được liên kết trực tiếp với permissions cụ thể (ví dụ: `birthdays.can_reconcile_email`).

---

### 5.3. Phân hệ Bảng điều khiển (`apps.dashboard`)

#### Danh sách API Endpoints:
| Endpoint | Method | Quyền hạn | Mô tả |
| :--- | :---: | :---: | :--- |
| `/api/dashboard/overview/` | `GET` | `IsAuthenticated` | Cung cấp KPI, văn bản mới, phòng họp hôm nay, sinh nhật |

#### Bộ kịch bản kiểm thử mẫu (`DashboardAPITests`):
1. **`test_overview_unauthorized`**: Kiểm tra chặn `401 Unauthorized` khi chưa có JWT Token.
2. **`test_overview_authorized_contract`**: Kiểm tra cấu trúc dữ liệu theo hợp đồng API:
   - `kpis`: `incomingCount`, `outgoingCount`, `confidentialCount`, `tasksCount`.
   - Danh sách mảng: `recentIncoming`, `recentOutgoing`, `tasks`, `meetingRooms`, `birthdays`.
3. **`test_tomorrow_date_calculation`**: Kiểm tra tính toán ngày sinh nhật chuyển giao tháng/năm.

<details>
<summary><b>👉 Xem mã nguồn kiểm thử mẫu (Python TestCase)</b></summary>

```python
from datetime import date, timedelta, time
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import StaffProfile
from dashboard.models import MeetingRoom


class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="testpassword123")
        self.today = timezone.localdate()
        self.tomorrow = self.today + timedelta(days=1)

        StaffProfile.objects.create(
            user=self.user,
            full_name="Cán Bộ Ngày Mai",
            department="Ban Kế hoạch",
            position="Chuyên viên",
            birthday=date(1995, self.tomorrow.month, self.tomorrow.day),
        )

        MeetingRoom.objects.create(
            room_name="Phòng họp A1 - Khu A",
            meeting_title="Họp giao ban định kỳ",
            date=self.today,
            start_time=time(8, 30),
            end_time=time(11, 30),
            organizer="Văn phòng Trung tâm",
            status="ready",
        )

    def test_overview_unauthorized(self):
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_overview_authorized_contract(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/dashboard/overview/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("kpis", response.data)
        self.assertIn("recentIncoming", response.data)
        self.assertIn("recentOutgoing", response.data)
        self.assertIn("meetingRooms", response.data)
        self.assertIn("birthdays", response.data)
```
</details>

---

### 5.4. Hướng dẫn thực thi kiểm thử cục bộ & Cơ sở dữ liệu (SQLite & PostgreSQL)

#### 1. Kiểm thử trên SQLite (Môi trường phát triển cục bộ mặc định):
SQLite được dùng cho kiểm thử nhanh đơn vị và tích hợp trong môi trường phát triển:
```bash
# Kiểm thử toàn bộ phân hệ Sinh nhật trên SQLite:
python manage.py test apps.birthdays.tests.BirthdaySystemTests
python manage.py test apps.birthdays.tests.BirthdayEmailDeliveryTests
python manage.py test apps.birthdays.tests.BirthdayEmailConcurrencyTests
```
*Lưu ý:* Do SQLite chỉ khóa ở cấp toàn bộ tệp cơ sở dữ liệu (`has_select_for_update = False`), các bài test đồng thời trong `BirthdayEmailConcurrencyTests` sẽ chạy theo nhánh kiểm tra loại trừ trạng thái tuần tự và tính bất biến dữ liệu.

#### 2. Kiểm thử đồng thời (Concurrency) trên PostgreSQL thực tế:
Để kiểm thử khóa hàng thực tế (`SELECT ... FOR UPDATE`), chống race condition và tương tranh đa luồng:

1. **Khởi chạy container PostgreSQL test độc lập bằng Docker** (khuyến nghị cổng 5433 để không xung đột cổng 5432 cục bộ):
   ```powershell
   docker run -d --name qlvb-postgres-test -p 5433:5432 -e POSTGRES_DB=qlvb_test_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=<mat_khau_cua_ban> postgres:16-alpine
   ```

2. **Thiết lập biến môi trường phiên làm việc (không lưu mật khẩu vào mã nguồn):**
   ```powershell
   $env:TEST_DB_HOST="127.0.0.1"
   $env:TEST_DB_PORT="5433"
   $env:TEST_DB_NAME="qlvb_test_db"
   $env:TEST_DB_USER="postgres"
   $secPass = Read-Host -Prompt "Nhap mat khau PostgreSQL" -AsSecureString
   $env:TEST_DB_PASSWORD = [System.Net.NetworkCredential]::new("", $secPass).Password
   Remove-Variable secPass
   ```

3. **Chạy bộ kiểm thử Concurrency với cấu hình PostgreSQL riêng biệt:**
   ```powershell
   python manage.py test apps.birthdays.tests.BirthdayEmailConcurrencyTests --settings=config.settings_test_pg -v 2
   ```

4. **Kết quả kiểm thử thực tế đã nghiệm thu (Issue #23 - Task 6):**
   Toàn bộ **7/7 concurrency tests PASS trên PostgreSQL**, xác minh đầy đủ:
   - `test_1`: 2 worker claim đồng thời qua `threading.Barrier(2)` chỉ đúng 1 worker claim thành công nhờ khóa hàng `FOR UPDATE`.
   - `test_2`: Worker cũ bị từ chối kết quả sau khi `attempt_id` thay đổi.
   - `test_3`: Chặn admin chuyển trạng thái không an toàn khi worker đang gửi.
   - `test_4`: Worker gián đoạn sau khi SMTP nhận thư giữ `PROCESSING`, scheduler tiếp theo bỏ qua không tự gửi lại.
   - `test_5`: 2 luồng scheduler chạy song song qua `threading.Barrier(2)` chỉ gửi đúng 1 email duy nhất.
   - `test_6`: Chặn xung đột khi 2 admin cùng đối soát một bản ghi.
   - `test_7`: Xác minh câu truy vấn SQL thực tế chứa mệnh đề `FOR UPDATE` trong giao dịch `atomic()`.
