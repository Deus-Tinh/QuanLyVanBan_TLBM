# API Hồ sơ và Loại văn bản (Nhóm 3)

Tiền tố: `/api/records/`. Tất cả endpoint yêu cầu JWT. Sau khi RBAC Nhóm 7
được tích hợp, quyền được kiểm tra bằng codename trần trong bảng dưới đây.

## Endpoint

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/dossiers/` | `view_hoso` | Danh sách hồ sơ |
| `POST` | `/dossiers/` | `add_hoso` | Tạo hồ sơ; `nguoi_lap` luôn lấy từ `request.user` |
| `GET` | `/dossiers/{id}/` | `view_hoso` | Chi tiết hồ sơ |
| `PATCH` | `/dossiers/{id}/` | `change_hoso` | Sửa hồ sơ |
| `DELETE` | `/dossiers/{id}/` | `delete_hoso` | Xóa hồ sơ; không xóa Hồ sơ chung hoặc hồ sơ đang được tham chiếu |
| `GET` | `/dossiers/{id}/document-types/` | `view_hoso` | Danh sách loại văn bản thuộc đúng hồ sơ |
| `POST` | `/dossiers/{id}/document-types/` | `add_hoso` | Tạo loại văn bản trong hồ sơ |
| `GET` | `/document-types/{id}/` | `view_hoso` | Chi tiết loại văn bản |
| `PATCH` | `/document-types/{id}/` | `change_hoso` | Sửa loại văn bản |
| `DELETE` | `/document-types/{id}/` | `delete_hoso` | Xóa loại văn bản; trả `409` nếu đang được văn bản tham chiếu |
| `GET` | `/dossiers/{id}/documents/` | `view_hoso` | Danh sách chỉ đọc các văn bản thuộc hồ sơ |

## Query danh sách

- Hồ sơ và loại văn bản: `search`, `year`, `page`, `page_size`.
- Văn bản thuộc hồ sơ: `search`, `year`, `type`, `page`, `page_size`.
- `type` nhận `vanbanden`, `vanbandi`, `vanbanmat`; bỏ trống để lấy tất cả.
- `page_size` tối đa `100`; `year` từ `1` đến `9999`.

Phản hồi phân trang:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": []
}
```

## Quy tắc dữ liệu

- `stt_uu_tien` là số nguyên dương, duy nhất; bỏ trống khi tạo để hệ thống gán
  `MAX + 1` trong transaction có khóa chống trùng trên PostgreSQL.
- `so_ky_hieu`, `ten_ho_so`, `ten_loai` được trim và không nhận chuỗi rỗng.
- `nguoi_lap` và `is_he_thong` là chỉ đọc; client không thể ghi đè.
- `LOWER(TRIM(ten_loai))` không được trùng trong cùng một hồ sơ.
- Hồ sơ chung không thể bị xóa hoặc hạ `is_he_thong` từ `true` xuống `false`.
- Xóa dữ liệu được Nhóm 2 tham chiếu trả `409 Conflict`, không trả `500`.
- Văn bản mật chỉ hiện với người tạo, người nhận hoặc đơn vị nhận, kể cả khi
  tài khoản là staff/superuser. Khi Nhóm 2 cung cấp hàm visibility dùng chung,
  endpoint này phải chuyển sang gọi hàm đó theo mục C5 của kế hoạch Ship MVP.

## Mã lỗi chính

| HTTP | Ý nghĩa |
|---|---|
| `400` | Dữ liệu hoặc bộ lọc không hợp lệ; trùng mã/STT/tên loại |
| `401` | Chưa xác thực |
| `403` | Đã đăng nhập nhưng thiếu quyền |
| `404` | Hồ sơ hoặc loại văn bản không tồn tại |
| `409` | Không thể xóa Hồ sơ chung hoặc dữ liệu đang được tham chiếu |
| `503` | Schema văn bản dùng chung của Nhóm 2 chưa sẵn sàng |

## Dựng cơ sở dữ liệu từ DDL base

Hai migration nền `records.0001_initial` và `records.0002_hoso_guards` tương
ứng các bảng, index và trigger đã có trong DDL. Trên DB dựng từ DDL phải đánh
dấu đúng migration nền theo quy trình cấp dự án; không chạy lại SQL tạo bảng
hoặc trigger. Kiểm thử tích hợp phải dùng PostgreSQL và không dùng DB cục bộ đã
từng migrate dở.
