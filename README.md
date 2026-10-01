# QuanLyVanBan TLBM - AI Chatbox

Chatbot tra cứu tài liệu và hỗ trợ nghiệp vụ cho hệ thống Quản lý Văn bản TLBM. Dự án dùng React + Vite cho giao diện, Django REST Framework cho API, LlamaIndex cho RAG và ChromaDB làm vector store.

Chatbot có thể trả lời theo ba nguồn:

1. Tài liệu được tải lên chatbox và lập chỉ mục trong ChromaDB.
2. Tài liệu văn bản trong PostgreSQL của ứng dụng QLVB, sau khi lọc theo quyền của nhân viên.
3. Thẻ kiến thức mô tả phạm vi các nhánh nghiệp vụ 1–7. Đây là đặc tả chức năng, không phải dữ liệu trạng thái đang chạy.

## Công nghệ

- Frontend: React 18, Vite, Axios, Bootstrap.
- Backend: Django 5, Django REST Framework.
- AI/RAG: Gemini mặc định; có hỗ trợ OpenAI, LlamaIndex và ChromaDB.
- Đọc tài liệu: PDF, DOCX, TXT, CSV, PPTX, Markdown, HTML, JSON, XML và ảnh. OCR dùng pdfplumber, Gemini Vision và RapidOCR tùy định dạng/cấu hình.
- Nguồn dữ liệu QLVB: PostgreSQL, truy vấn chỉ đọc.

## Yêu cầu

- Python 3.11 trở lên.
- Node.js 18 trở lên và npm.
- Khóa API Gemini hoặc OpenAI để gọi mô hình.
- PostgreSQL chỉ cần khi muốn tra cứu dữ liệu từ hệ thống QLVB.

## Cài đặt và chạy trên Windows

Mở PowerShell tại thư mục gốc của repo:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
```

Mở `backend/.env`, đặt `GEMINI_API_KEY` (hoặc cấu hình OpenAI qua phần cài đặt AI trong giao diện). Không đưa khóa thật lên Git.

Khởi động Django trong terminal thứ nhất:

```powershell
python backend/manage.py runserver 127.0.0.1:8000
```

Cài dependencies và chạy React trong terminal thứ hai:

```powershell
cd frontend
npm ci
npm run dev
```

Mở URL Vite hiển thị trong terminal, thường là `http://127.0.0.1:5173`. Frontend mặc định gọi API tại `http://127.0.0.1:8000`; có thể đổi bằng `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Cấu hình backend

Cấu hình mẫu nằm trong `backend/.env.example`. Các biến thường cần chỉnh:

| Biến | Ý nghĩa |
|---|---|
| `DJANGO_SECRET_KEY` | Khóa bí mật Django; thay giá trị mẫu khi triển khai. |
| `DJANGO_DEBUG` | Bật debug khi phát triển; tắt trong môi trường thật. |
| `DJANGO_ALLOWED_HOSTS` | Danh sách host được Django chấp nhận, phân tách bằng dấu phẩy. |
| `CORS_ALLOWED_ORIGINS` | Origin của frontend được phép gọi API. |
| `MODEL_PROVIDER` | `gemini` hoặc `openai`. |
| `GEMINI_API_KEY` | Khóa Gemini khi dùng Gemini. |
| `LLM_MODEL` | Mô hình sinh câu trả lời. |
| `EMBED_MODEL` | Mô hình embedding dùng để lập chỉ mục và tìm kiếm. |
| `VISION_MODEL` | Mô hình xử lý OCR hình ảnh/PDF scan. |
| `CHROMA_DB_PATH` | Thư mục lưu vector database. |
| `VISION_OCR_MODE` | `fallback`, `math`, `all` hoặc `off`. |

Nếu dùng OpenAI, cung cấp `OPENAI_API_KEY` trong môi trường backend hoặc thiết lập khóa trong giao diện cấu hình AI. Không lưu API key trong mã nguồn hay biến `VITE_*`.

## Dùng PostgreSQL của QLVB

Mặc định dự án chạy độc lập với SQLite cho cấu hình Django; chế độ này không đọc dữ liệu QLVB. Để bật nguồn tài liệu PostgreSQL, cấu hình trong `backend/.env`:

```env
DB_ENGINE=postgresql
DB_NAME=qlvb_tlbm
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_HOST=127.0.0.1
DB_PORT=5432
DB_CONN_MAX_AGE=60
QLVB_STORAGE_ROOT=../QuanLyVanBan_TLBM/media
```

Điều chỉnh thông tin kết nối và `QLVB_STORAGE_ROOT` theo môi trường thực tế. Thư mục storage phải chứa các tệp đính kèm được tham chiếu từ database.

Chatbot lọc quyền trước khi đọc các bản ghi văn bản đến, văn bản đi, văn bản mật và tài liệu dùng chung. Khi kết nối PostgreSQL, API cần nhận danh tính đã xác thực từ ứng dụng QLVB (`request.user` hoặc `request.employee_id`). Cấu hình Django độc lập trong repo này chưa cung cấp đăng nhập/SSO QLVB; vì vậy muốn dùng dữ liệu thật cần tích hợp API sau lớp xác thực của ứng dụng chính. Nếu không xác định được danh tính hoặc quyền, chatbot từ chối tra cứu SQL.

Nguồn SQL hiện là nguồn chỉ đọc, không tạo hoặc cập nhật hồ sơ. Nội dung trong SQL được lập chỉ mục vào ChromaDB theo nhu cầu và được đồng bộ lại khi tệp hoặc `updated_at` thay đổi. Các đường dẫn tệp ngoài `QLVB_STORAGE_ROOT` sẽ bị bỏ qua.

## Phạm vi hỏi đáp nhánh 1–7

Chatbot có thể giải thích phạm vi chức năng của các nhánh:

1. Dashboard và thông tin tổng quan.
2. Văn bản đến, văn bản đi và văn bản mật.
3. Hồ sơ và loại văn bản.
4. Tài liệu dùng chung và biểu mẫu.
5. Quy trình trình ký và ký số.
6. Giao việc và xử lý công việc.
7. Tổ chức, phân quyền, phòng họp và sự kiện.

Các mô tả này giúp trả lời câu hỏi về cách hệ thống được thiết kế. Chúng không xác nhận số lượng hồ sơ, trạng thái công việc, lịch họp, quyền người dùng hay tính năng đã được triển khai. Những thông tin hiện thời chỉ được khẳng định khi có nguồn dữ liệu được phép tương ứng.

## API chính

Base URL mặc định: `http://127.0.0.1:8000`.

| Endpoint | Chức năng |
|---|---|
| `GET /health/ai` | Trạng thái cấu hình AI. |
| `POST /chat` | Hỏi đáp; body gồm `question`, `history` và tùy chọn `category`. |
| `POST /upload` | Tải lên và lập chỉ mục tài liệu đồng bộ. |
| `POST /upload/async` | Tải lên và lập chỉ mục nền; trả về `job_id`. |
| `GET /upload/progress/<job_id>` | Theo dõi tiến trình lập chỉ mục nền. |
| `GET /documents` | Danh sách tài liệu cục bộ đã tải lên. |
| `GET /categories` | Danh sách danh mục. |
| `GET /documents/<filename>/preview` | Xem trước tài liệu. |
| `GET /settings/ai` | Xem cấu hình AI đã che khóa. |
| `POST /settings/ai` | Kiểm tra và cập nhật provider/model/API key. |

Ví dụ gọi chat:

```json
{
  "question": "Quy trình trình ký được mô tả như thế nào?",
  "history": [],
  "category": null
}
```

## Dữ liệu và thư mục

- `data/docs/`: tài liệu tải lên cục bộ; nội dung bị Git bỏ qua, chỉ giữ `.gitkeep`.
- `data/chroma_db/`: vector database, được tạo khi chạy và không đưa lên Git.
- `backend/services/rag_service.py`: lập chỉ mục, truy xuất nguồn và tạo câu trả lời.
- `backend/services/sql_document_source.py`: truy vấn PostgreSQL và áp dụng quyền truy cập.
- `backend/services/business_knowledge.py`: thẻ mô tả chức năng nhánh 1–7.
- `backend/docs/sql_document_source.md`: tài liệu chi tiết về DDL bảng/cột, tài khoản chỉ đọc và cơ chế phân quyền.
- `frontend/src/`: giao diện chat React.

## Tích hợp Cơ sở dữ liệu QLVB (Truy vấn SQL thô & Phân quyền bảo mật)

Module AI Chatbox tích hợp trực tiếp với cơ sở dữ liệu PostgreSQL của hệ thống Quản lý Văn bản TLBM.

### 1. Lý do sử dụng truy vấn SQL thô (Không định nghĩa Django Models)
Hệ thống QLVB đã có sẵn cấu trúc DDL được quản lý độc lập bởi các nhánh nghiệp vụ 1–7. Module AI Chatbox sử dụng **truy vấn SQL thô (Raw SQL qua cursor)** để:
- Tránh xung đột migrations hoặc trùng lặp models với hệ thống core QLVB.
- Dễ dàng cắm vào (plug-and-play) cơ sở dữ liệu PostgreSQL hiện có.
- Tối ưu hóa các truy vấn lọc phân quyền phức tạp (phân quyền văn bản mật, nội bộ phòng ban) trong một câu lệnh đơn.

> ⚠️ **Lưu ý rủi ro DDL**: *"Truy vấn thô phụ thuộc trực tiếp tên bảng của DDL nên đổi cấu trúc sẽ vỡ ngầm."*  
> Nếu hệ thống core đổi tên bảng hoặc tên cột trong DDL, câu truy vấn sẽ lỗi runtime. Để khắc phục:
> - Danh sách bảng và cột bắt buộc phải được ghi chép và kiểm soát tập trung tại `SQL_SCHEMA_REGISTRY` trong `backend/services/sql_document_source.py`.
> - Module cung cấp hàm `verify_sql_schema()` để tự động kiểm tra đối chiếu schema thực tế trong PostgreSQL, cảnh báo sớm bất kỳ sai lệch nào.

### 2. Danh mục Bảng và Cột CSDL truy vấn thô

| Bảng CSDL | Các cột truy vấn | Mục đích & Nghiệp vụ |
|---|---|---|
| `accounts_employee` | `id`, `don_vi_id`, `is_active`, `trang_thai`, `is_superuser` | Xác thực nhân viên, đơn vị công tác; bắt buộc `is_active=TRUE` và `trang_thai='LAM_VIEC'`. |
| `accounts_employee_groups` | `employee_id`, `group_id` | Liên kết nhân viên với nhóm quyền. |
| `auth_group_permissions` | `group_id`, `permission_id` | Liên kết nhóm quyền với quyền hạn. |
| `auth_permission` | `id`, `codename` | Kiểm tra mã quyền: `use_aiassistant`, `view_vanbanden`, `view_vanbandi`, `view_vanbanmat`, `view_tailieu`. |
| `documents_vanbanden` | `id`, `so_hieu`, `so_thu_tu`, `nam`, `ngay_den`, `trich_yeu`, `noi_ban_hanh`, `ngay_van_ban`, `nguoi_ky`, `chuc_vu`, `hieu_luc`, `ngay_het_hieu_luc`, `ghi_chu`, `file_dinh_kem`, `updated_at`, `hien_thi` | Văn bản đến (yêu cầu quyền `view_vanbanden` và `hien_thi=TRUE`). |
| `documents_vanbandi` | `id`, `so_hieu`, `so`, `nam`, `ngay_ban_hanh`, `trich_yeu`, `noi_ban_hanh`, `ngay_van_ban`, `nguoi_ky`, `chuc_vu`, `hieu_luc`, `ngay_het_hieu_luc`, `ghi_chu`, `file_dinh_kem`, `updated_at`, `hien_thi` | Văn bản đi (yêu cầu quyền `view_vanbandi` và `hien_thi=TRUE`). |
| `documents_vanbanmat` | `id`, `so_hieu`, `nam`, `ngay_ban_hanh`, `trich_yeu`, `noi_ban_hanh`, `ngay_van_ban`, `nguoi_ky`, `chuc_vu`, `hieu_luc`, `ngay_het_hieu_luc`, `ghi_chu`, `file_dinh_kem`, `updated_at`, `hien_thi` | Văn bản mật (yêu cầu quyền `view_vanbanmat` và kiểm tra ACL nghiêm ngặt). |
| `documents_vanbanmat_nguoinhan` | `vanbanmat_id`, `employee_id` | Danh sách cán bộ nhận đích danh của văn bản mật. |
| `documents_vanbanmat_donvinhan` | `vanbanmat_id`, `donvi_id` | Danh sách đơn vị/phòng ban nhận của văn bản mật. |
| `records_chitiettailieu` | `id`, `ky_hieu`, `tieu_de`, `noi_ban_hanh`, `hieu_luc`, `ngay_dang`, `ngay_het_hieu_luc`, `ghi_chu`, `file_dinh_kem`, `updated_at`, `hien_thi`, `nguoi_tao` | Hồ sơ tài liệu chuyên môn nội bộ (yêu cầu quyền `view_tailieu`). |

*Chi tiết thông số kỹ thuật từng trường xem tại [backend/docs/sql_document_source.md](file:///d:/QuanLyVanBan_TLBM-8_ai_chatbox/backend/docs/sql_document_source.md).*

### 3. Dùng tài khoản CSDL chỉ đọc (Read-Only Database Account)
Để bảo vệ toàn vẹn dữ liệu và loại bỏ nguy cơ sửa đổi hay xóa nhầm dữ liệu hệ thống:
- **Tạo user chỉ đọc trong PostgreSQL**:
  ```sql
  CREATE USER qlvb_readonly WITH PASSWORD 'mat_khau_chi_doc_an_toan';
  GRANT CONNECT ON DATABASE qlvb_tlbm TO qlvb_readonly;
  GRANT USAGE ON SCHEMA public TO qlvb_readonly;
  GRANT SELECT ON accounts_employee, accounts_employee_groups,
                  auth_group_permissions, auth_permission,
                  documents_vanbanden, documents_vanbandi, documents_vanbanmat,
                  documents_vanbanmat_nguoinhan, documents_vanbanmat_donvinhan,
                  records_chitiettailieu TO qlvb_readonly;
  ```
- **Khai báo trong `backend/.env`**:
  ```bash
  DB_ENGINE=postgresql
  DB_NAME=qlvb_tlbm
  DB_READONLY_USER=qlvb_readonly
  DB_READONLY_PASSWORD=mat_khau_chi_doc_an_toan
  DB_READONLY_HOST=127.0.0.1
  DB_READONLY_PORT=5432
  ```
- **Bảo vệ cấp phiên**: Backend tự động cấu hình `options: "-c default_transaction_read_only=on"`, chặn mọi câu lệnh ghi ở cấp độ engine PostgreSQL.

### 4. Lọc dữ liệu theo quyền của người hỏi (Giảm rủi ro lộ văn bản mật)
- **Xác thực danh tính**: Nhận `employee_id` từ phiên đăng nhập backend (JWT/Session), tuyệt đối không nhận từ JSON client để ngăn ngừa IDOR.
- **Quyền AI**: Chỉ nhân viên đang làm việc (`is_active=TRUE`, `trang_thai='LAM_VIEC'`) và có quyền `use_aiassistant` (hoặc `is_superuser`) mới được phép gửi câu hỏi.
- **Văn bản mật**: Chỉ hiển thị nếu cán bộ có quyền `view_vanbanmat` **VÀ** thuộc danh sách người nhận đích danh (`rp.employee_id = %s`) hoặc đơn vị nhận (`ru.donvi_id = %s`).
- **Hồ sơ nội bộ**: Tài liệu có phạm vi `NOI_BO_PHONG_BAN` chỉ người tạo hoặc cán bộ cùng phòng ban mới có thể tra cứu.
- **Cơ chế Fail-Closed**: Nếu người hỏi không có quyền truy cập văn bản nào, retrieval trả về rỗng và không sử dụng kho tài liệu chung để trả lời, giảm tối đa rủi ro lộ văn bản mật.


## OCR cho PDF và hình ảnh

`VISION_OCR_MODE` điều khiển cách dùng Vision OCR:

- `fallback`: chỉ gọi Vision khi không trích được văn bản đủ tốt; phù hợp mặc định.
- `math`: ưu tiên nhận dạng nội dung có công thức, ký hiệu và hình học.
- `all`: xử lý Vision trên mọi trang; có thể chậm và tốn API hơn.
- `off`: tắt Vision OCR.

Có thể điều chỉnh `VISION_OCR_PDF_DPI`, `VISION_OCR_MAX_IMAGE_SIZE`, `VISION_OCR_JPEG_QUALITY`, `VISION_OCR_PARALLEL_WORKERS` để cân bằng chất lượng, thời gian và chi phí. PDF scan cần OCR; chất lượng đầu ra phụ thuộc độ rõ của tài liệu và mô hình.

## Lưu ý bảo mật

- Không commit `.env`, API key, mật khẩu database, tài liệu nội bộ hoặc dữ liệu trong ChromaDB.
- Không mở API tải lên, xóa tài liệu hoặc cấu hình AI trực tiếp ra Internet nếu chưa đặt xác thực và giới hạn truy cập phù hợp.
- Khi dùng PostgreSQL, chỉ tích hợp qua lớp xác thực QLVB và kiểm tra quyền của người dùng ở backend. Không nhận `employee_id` từ nội dung JSON do trình duyệt gửi.
- Tắt `DJANGO_DEBUG` và đặt secret key riêng trước khi triển khai.

## Khắc phục nhanh

- **Frontend không kết nối được backend:** kiểm tra Django đang chạy cổng `8000`, `VITE_API_BASE_URL` và `CORS_ALLOWED_ORIGINS`.
- **AI báo thiếu cấu hình:** kiểm tra provider và API key trong `backend/.env`, sau đó khởi động lại backend.
- **Không tra được SQL:** xác nhận PostgreSQL, schema/tên bảng, đường dẫn `QLVB_STORAGE_ROOT`, quyền nhân viên và việc API đã nhận danh tính xác thực.
- **PDF scan không có nội dung:** đặt `VISION_OCR_MODE=math` hoặc `all`, tăng DPI, và kiểm tra cấu hình Vision API.
- **Lập chỉ mục chậm:** giảm số worker OCR hoặc dùng `fallback` thay cho `all`.
