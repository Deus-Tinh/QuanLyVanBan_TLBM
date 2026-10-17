# Dựng DB từ `release_DDL.sql` và runbook staging

`docs/common/database/release_DDL.sql` là nguồn schema. `scripts/build_db.py` là quy trình dựng DB duy nhất cho local, CI và staging.

## Script `scripts/build_db.py`

Các bước:

1. Tạo DB rỗng với collation ICU `vi-VN` (`CREATE DATABASE ... TEMPLATE template0 ENCODING 'UTF8' LOCALE_PROVIDER icu ICU_LOCALE 'vi-VN' LOCALE 'C.UTF-8'`); script kiểm tra collation sau khi tạo. DB có sẵn khác collation thì dừng, gợi ý `--force`. DB chưa có thì tạo mới, DB có sẵn chỉ dùng tại chỗ khi còn nguyên trạng mới tạo (không schema nào ngoài `public` và schema hệ thống; không relation, type do user tạo hay function/procedure trong `public`; không extension ngoài `plpgsql`), ngược lại dừng trừ khi có `--force` (xóa và dựng lại) hoặc `--if-empty` (xem bên dưới).
2. Nạp `release_DDL.sql`. File này tự có `BEGIN`/`COMMIT` nên không rollback được giữa chừng.
3. Duyệt migration theo thứ tự phụ thuộc: app có đủ bảng model trong DB thì ghi nhận migration đã áp dụng (fake); app không có bảng nào thì migrate thật; app có một phần bảng thì báo lỗi và dừng. App chỉ có model `managed = False` (ví dụ `authorization`) chạy migration thật; các data migration của app này idempotent và không làm đổi số lượng quyền/nhóm quyền so với DDL.
4. Xác nhận không còn migration chưa áp dụng.
5. `--seed`: chạy `seed_db`.
6. Ghi dấu hoàn tất vào `COMMENT ON DATABASE`: sha256 của `release_DDL.sql` và trạng thái seed (`build_db:v2 ddl_sha256=<hash> seed=<0|1> collation=icu:vi-VN`); DB dựng với dấu hoặc collation cũ bị coi là không khớp.

Dọn khi lỗi ở bất kỳ bước nào: DB do lượt chạy tạo mới hoặc thay bằng `--force` bị `DROP DATABASE`; DB có sẵn đạt nguyên trạng được trả về rỗng (`DROP SCHEMA public CASCADE` rồi tạo lại). DB có sẵn và không rỗng không bị xóa khi thiếu `--force`. Nếu việc dọn lỗi, script báo cả lỗi gốc lẫn tên DB còn sót và thoát mã khác 0.

`--if-empty` và `--sync` kiểm tra collation DB đích trước (khác ICU `vi-VN` thì báo lỗi, gợi ý `--force`). `--if-empty` chỉ bỏ qua (exit 0) khi DB có dấu hoàn tất khớp hash DDL hiện tại và khớp yêu cầu `--seed`. DB có bảng mà không có dấu (ví dụ dựng bằng `migrate`), hoặc dấu không khớp, thì báo lỗi và gợi ý `--force`.

`--sync` chạy trên DB đã tồn tại (`pnpm db:migrate` gọi chế độ này): không tạo/xóa DB, không nạp DDL, không ghi dấu hoàn tất, không seed; không dùng chung với `--force`, `--if-empty`, `--seed`.

Điều kiện chạy: dấu hoàn tất có `ddl_sha256` khớp `release_DDL.sql` hiện tại, tức DB đúng bằng nguồn chuẩn. Không có dấu (DB không dựng bằng script) hoặc dấu lệch hash (DDL đã đổi) thì dừng trước mọi thay đổi và yêu cầu `pnpm db:reset` (`--force`); script không chạy migration nâng cấp trên schema DDL cũ.

Khi dấu khớp, chỉ xử lý migration chưa áp dụng, theo thứ tự phụ thuộc:

- app có đủ bảng model trong DB: fake (kiểm tra thêm mọi cột của model có trong DB, thiếu cột thì báo lỗi);
- app chưa có bảng nào: migrate thật;
- app có một phần bảng: báo lỗi.

Lỗi giữa chừng không dọn DB (DB của dev có dữ liệu); thông báo nêu các migration đã ghi nhận.

Kết nối đọc từ `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (`--host`, `--port`, `--user`, `--dbname` ghi đè; mật khẩu chỉ đọc từ `DB_PASSWORD`). User cần quyền `CREATEDB`. Cần `DJANGO_SECRET_KEY` và các thư viện trong `backend/requirements.txt`.

```bash
python scripts/build_db.py --dbname <tên DB> [--force | --if-empty] [--seed]
python scripts/build_db.py --dbname <tên DB> --sync
```

## Test trên PostgreSQL

Test chạy trên PostgreSQL; test DB do Django tự dựng bằng migration (không dùng template DDL):

```bash
cd backend
DB_ENGINE=postgresql DB_NAME=<tên DB> DB_USER=<user> DB_PASSWORD=<mật khẩu> python manage.py test
```

CI chạy thêm `scripts/build_db.py` trên một DB riêng để kiểm chứng DDL nạp được và migration đồng bộ được.

## Dựng lại DB staging

Dữ liệu staging là dữ liệu thử nghiệm. Thực hiện trên host staging, tài khoản có quyền `CREATEDB`, trong thư mục mã nguồn đã checkout đúng release và đã kích hoạt môi trường Python của backend. Mỗi quy trình nằm trong subshell `( set -euo pipefail; ... )`: lỗi ở bước nào thì quy trình dừng tại đó, phiên SSH không bị thoát.

Kiểm tra dump (`test -s`, `pg_restore -l`, số entry > 0) chỉ xác nhận archive đọc được danh mục; chưa chứng minh restore thành công toàn bộ.

```bash
(
  set -euo pipefail
  export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=<user DB> DB_PASSWORD=<mật khẩu> DJANGO_SECRET_KEY=<khóa>
  DUMP=<thư mục sao lưu trên host>/qlvb_$(date +%Y%m%d_%H%M%S).dump

  # 1. Sao lưu DB hiện tại ra host và kiểm tra archive
  PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -Fc qlvb > "$DUMP"
  test -s "$DUMP"
  test "$(pg_restore -l "$DUMP" | grep -vc '^;')" -gt 0

  # 2. Dừng backend, dựng lại DB
  sudo systemctl stop <tên service backend>
  python scripts/build_db.py --dbname qlvb --force --seed

  # 3. Kiểm tra collation (kỳ vọng: i|vi-VN), migration, rồi khởi động lại backend
  COLLATION="$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -At \
    -c "SELECT datlocprovider || '|' || coalesce(to_jsonb(d)->>'datlocale', to_jsonb(d)->>'daticulocale') FROM pg_database d WHERE datname = 'qlvb'")"
  test "$COLLATION" = 'i|vi-VN'
  MIGRATIONS="$(cd backend && DB_ENGINE=postgresql DB_NAME=qlvb python manage.py showmigrations)"
  test -n "$MIGRATIONS"
  if grep -q '\[ \]' <<< "$MIGRATIONS"; then echo 'Còn migration chưa áp dụng' >&2; exit 1; fi
  sudo systemctl start <tên service backend>
)
```

Cluster staging cần hỗ trợ ICU và locale hệ điều hành `C.UTF-8` (PostgreSQL 16 build với ICU). Nếu bước 2 báo lỗi khi `CREATE DATABASE` (không có ICU hoặc `C.UTF-8`) thì dừng và báo người phụ trách, không đổi locale để vượt qua. Nếu bước 2 hoặc 3 lỗi sau khi backend đã dừng, backend giữ nguyên trạng thái dừng; xử lý lỗi rồi khởi động lại thủ công. Script tự dọn DB dựng dở (xem phần Script). DB gốc chỉ khôi phục được từ file dump ở bước 1.

Deploy backend sau bước này không chạy `migrate` lên DB đã dựng bằng DDL; mỗi lần cần schema mới, cập nhật `release_DDL.sql` và dựng lại bằng script.

## Dọn instance PostgreSQL thừa trên host staging

Container `qlvb-main-db` (DB `qlvb_main`, `qlvb_ddl_verify_tmp`, volume `qlvb_main_pgdata`) không được backend tham chiếu. Dump ghi ra host, ngoài container và volume sắp xoá; chỉ xoá sau khi archive đọc được:

```bash
(
  set -euo pipefail
  DUMP=<thư mục sao lưu trên host>/qlvb_main_$(date +%Y%m%d_%H%M%S).dump

  docker exec qlvb-main-db pg_dump -U <user DB> -Fc qlvb_main > "$DUMP"
  test -s "$DUMP"
  test "$(pg_restore -l "$DUMP" | grep -vc '^;')" -gt 0

  docker stop qlvb-main-db
  docker rm qlvb-main-db
  docker volume rm qlvb_main_pgdata
)
```

Sau khi xóa, host chỉ còn một instance PostgreSQL (native, cổng 5432).
