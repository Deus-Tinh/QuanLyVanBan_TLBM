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
- `frontend/src/`: giao diện chat React.

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
