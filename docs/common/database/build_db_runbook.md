# Dựng DB từ `release_DDL.sql` và runbook staging

`docs/common/database/release_DDL.sql` là nguồn schema. `scripts/build_db.py` là quy trình dựng DB duy nhất cho local, CI, DB template của test và staging.

## Script `scripts/build_db.py`

Các bước:

1. Tạo DB rỗng; DB đã có bảng thì dừng, trừ khi có `--force` (xóa và dựng lại) hoặc `--if-empty` (bỏ qua, exit 0).
2. Nạp `release_DDL.sql` trong một transaction; lỗi thì rollback, không để lại DB nạp dở.
3. Duyệt migration theo thứ tự phụ thuộc: app có đủ bảng model trong DB thì ghi nhận migration đã áp dụng (fake); app không có bảng nào thì migrate thật; app có một phần bảng thì báo lỗi và dừng. App chỉ có model `managed = False` (ví dụ `authorization`) chạy migration thật; các data migration của app này idempotent và không làm đổi số lượng quyền/nhóm quyền so với DDL.
4. Xác nhận không còn migration chưa áp dụng.
5. `--seed`: chạy `seed_db`.

Kết nối đọc từ `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`--host`, `--port`, `--user`, `--dbname` ghi đè; mật khẩu chỉ đọc từ `DB_PASSWORD`). User cần quyền `CREATEDB`. Cần `DJANGO_SECRET_KEY` và các thư viện trong `backend/requirements.txt`.

```bash
python scripts/build_db.py --dbname <tên DB> [--force | --if-empty] [--seed]
```

## Test trên PostgreSQL

Test chạy trên PostgreSQL; test DB do Django tự dựng bằng migration (không dùng template DDL):

```bash
cd backend
DB_ENGINE=postgresql DB_NAME=<tên DB> DB_USER=<user> DB_PASSWORD=<mật khẩu> python manage.py test
```

CI chạy thêm `scripts/build_db.py` trên một DB riêng để kiểm chứng DDL nạp được và migration đồng bộ được.

## Dựng lại DB staging

Dữ liệu staging là dữ liệu thử nghiệm. Thực hiện trên host staging, tài khoản có quyền `CREATEDB`, trong thư mục mã nguồn đã checkout đúng release và đã kích hoạt môi trường Python của backend.

1. Dừng backend:

```bash
sudo systemctl stop <tên service backend>
```

2. Sao lưu DB hiện tại:

```bash
pg_dump -h 127.0.0.1 -p 5432 -U <user DB> -Fc -f qlvb_$(date +%Y%m%d_%H%M%S).dump qlvb
```

3. Dựng lại DB (biến môi trường như của process backend):

```bash
export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=<user DB> DB_PASSWORD=<mật khẩu> DJANGO_SECRET_KEY=<khóa>
python scripts/build_db.py --dbname qlvb --force --seed
```

4. Kiểm tra và khởi động lại:

```bash
cd backend && DB_ENGINE=postgresql DB_NAME=qlvb python manage.py showmigrations | grep -c "\[ \]"   # kết quả 0
sudo systemctl start <tên service backend>
```

Deploy backend sau bước này không chạy `migrate` lên DB đã dựng bằng DDL; mỗi lần cần schema mới, cập nhật `release_DDL.sql` và dựng lại bằng script.

## Dọn instance PostgreSQL thừa trên host staging

Container `qlvb-main-db` (DB `qlvb_main`, `qlvb_ddl_verify_tmp`, volume `qlvb_main_pgdata`) không được backend tham chiếu. Sao lưu rồi xóa:

```bash
docker exec qlvb-main-db pg_dump -U <user DB> -Fc qlvb_main > qlvb_main_$(date +%Y%m%d_%H%M%S).dump
docker stop qlvb-main-db
docker rm qlvb-main-db
docker volume rm qlvb_main_pgdata
```

Sau khi xóa, host chỉ còn một instance PostgreSQL (native, cổng 5432).
