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
    -c "SELECT datlocprovider::text || '|' || coalesce(to_jsonb(d)->>'datlocale', to_jsonb(d)->>'daticulocale') FROM pg_database d WHERE datname = 'qlvb'")"
  test "$COLLATION" = 'i|vi-VN'
  MIGRATIONS="$(cd backend && DB_ENGINE=postgresql DB_NAME=qlvb python manage.py showmigrations)"
  test -n "$MIGRATIONS"
  if grep -q '\[ \]' <<< "$MIGRATIONS"; then echo 'Còn migration chưa áp dụng' >&2; exit 1; fi
  sudo systemctl start <tên service backend>
)
```

Cluster staging cần hỗ trợ ICU và locale hệ điều hành `C.UTF-8` (PostgreSQL 16 build với ICU). Nếu bước 2 báo lỗi khi `CREATE DATABASE` (không có ICU hoặc `C.UTF-8`) thì dừng và báo người phụ trách, không đổi locale để vượt qua. Nếu bước 2 hoặc 3 lỗi sau khi backend đã dừng, backend giữ nguyên trạng thái dừng; xử lý lỗi rồi khởi động lại thủ công. Script tự dọn DB dựng dở (xem phần Script). DB gốc chỉ khôi phục được từ file dump ở bước 1.

Deploy backend sau bước này không chạy `migrate` lên DB đã dựng bằng DDL; mỗi lần cần schema mới, cập nhật `release_DDL.sql` và dựng lại bằng script.

## Deploy backend

`deploy/deploy.sh <tên release>` trong repo là nguồn duy nhất của quy trình deploy backend; mỗi lần deploy script được đẩy lên `~/deploy/` cùng tarball và chạy từ đó. `/srv/qlvb/tools/deploy.sh` cũ không còn dùng (có thể xóa sau lần deploy đầu thành công); `/srv/qlvb/tools/backup.sh` vẫn ở đó và được script gọi theo đường dẫn này. Job CI `Deploy backend to Ubuntu` (`.github/workflows/ci.yml`) chạy script khi push vào `staging`, sau khi job `backend` đạt, với `DB_MODE=rebuild`. Đầu vào là `~/deploy/qlvb-<tên release>.tar.gz` chứa `backend/`, `scripts/`, `docs/common/database/`.

Các bước (log `/srv/qlvb/deploy.log`, khóa `flock` ở `/srv/qlvb/.deploy.lock`):

1. Kiểm đầu vào (tên release, tarball, release chưa tồn tại).
2. Giải nén vào `/srv/qlvb/releases/<tên>`, tạo venv, cài `backend/requirements.txt`.
3. Nạp `/etc/qlvb/backend.env`, `manage.py check`, `collectstatic`.
4. `/srv/qlvb/tools/backup.sh`; đọc dòng cuối `backups/backup.log` (chứa ` OK `, trường thứ 3 là tên file dump).
5. Cơ sở dữ liệu theo `DB_MODE` (xem dưới).
6. Chuyển symlink `current`, `systemctl restart qlvb-backend`. Restart lỗi thì rollback (xem dưới).
7. Kiểm tra `http://127.0.0.1:8001/api/auth/profile/` trả 401 và service active (15 lần × 2 giây). Thất bại thì rollback.
8. Giữ 5 release mới nhất, không xóa release đang chạy và release trước đó.

Lỗi trước bước 6: release dở bị xóa, symlink `current` không đổi. Log in bản đang chạy và đường dẫn dump.

Rollback (hàm dùng chung cho restart lỗi ở bước 6 và kiểm tra thất bại ở bước 7): chuyển `current` về release trước, `systemctl restart qlvb-backend`, in cảnh báo về DB (`rebuild`: DB đã dựng lại nên không khôi phục được bằng rollback, xem "Khôi phục từ dump"; `sync`: DB có thể mới hơn code cũ) và đường dẫn dump. Release mới được giữ lại để điều tra. Nếu restart trong rollback cũng lỗi, script in "service đang dừng / không chạy, xử lý thủ công" và thoát mã khác 0.

### `DB_MODE`

| | `sync` (mặc định) | `rebuild` (chỉ staging) |
|---|---|---|
| Dùng cho | DB có dữ liệu thật (production sau này) | DB staging, dữ liệu thử nghiệm |
| Bước 5 | Kiểm dấu hoàn tất của DB khớp hash `release_DDL.sql` của release trước tiên (lệch thì dừng). Sau đó: nếu `migrate --check` sạch thì bỏ qua; nếu có migration chờ: restore dump vào DB tạm ICU `vi-VN`, chép dấu hoàn tất sang DB tạm, chạy `build_db.py --sync` trên DB tạm; đạt thì chạy `--sync` trên DB thật | Dừng service (bắt buộc; `stop` lỗi thì dừng deploy trước khi xóa DB), `dropdb --if-exists --force`, `createdb` ICU `vi-VN` owner là role ứng dụng, `build_db.py --seed`; kiểm collation `i\|vi-VN`, dấu hoàn tất khớp hash DDL kèm `seed=1`, không còn migration chờ |
| Dấu không khớp hash DDL (kể cả khi không có migration mới) | Dừng, không đổi DB, không switch; staging dùng `rebuild`, production cần quy trình nâng cấp riêng | Không áp dụng |
| Lỗi | Release dở bị xóa, DB thật chưa đổi | Release dở bị xóa; DB đã bị dựng lại nên chuyển symlink về release cũ không khôi phục được DB; service giữ trạng thái dừng; `stop` lỗi thì DB và service giữ nguyên |

`sync` giữ nguyên bước thử trên bản khôi phục của quy trình cũ. `pg_dump -Fc` không mang `COMMENT ON DATABASE` nên script đọc dấu hoàn tất từ DB thật và đặt lại cho DB tạm (`--sync` yêu cầu dấu khớp).

`rebuild` không dùng `migrate`: DB staging dựng từ DDL, mỗi lần cần schema mới thì cập nhật `release_DDL.sql` và deploy lại.

### Điều kiện tiên quyết trên host

- User deploy là user chạy script, có quyền ghi `/srv/qlvb` và `~/deploy`, có role PostgreSQL cùng tên (kết nối qua socket `/var/run/postgresql`, peer) để restore vào DB tạm, và `python3` (3.12) kèm `venv`.
- Quyền `sudo` không mật khẩu đã dùng: `sudo -n -u postgres /usr/bin/createdb`, `sudo -n -u postgres /usr/bin/dropdb`, `sudo -n /usr/bin/systemctl restart qlvb-backend`.
- Bắt buộc cho `DB_MODE=rebuild` (dừng service trước khi xóa DB):

```
<user deploy> ALL=(root) NOPASSWD: /usr/bin/systemctl stop qlvb-backend
```

  Thiếu rule này, `rebuild` dừng ở bước 5 trước `dropdb`: DB và service giữ nguyên, release mới bị dọn. Lần deploy đầu bằng CI sẽ dừng ở đây nếu chưa thêm rule.
- Role ứng dụng (`DB_USER`) là owner DB, không cần `CREATEDB` hay superuser. Cluster hỗ trợ ICU và locale `C.UTF-8`.
- `/etc/qlvb/backend.env` đọc được bởi user deploy (script `source` file này), có `DB_ENGINE=postgresql`, `DB_NAME`, `DB_USER`, `DB_HOST`, `DB_PORT`, `DB_PASSWORD`, `DJANGO_SECRET_KEY`.
- `/srv/qlvb/tools/backup.sh` ghi dòng kết quả vào `/srv/qlvb/backups/backup.log` theo hợp đồng ở bước 4.

### Chạy tay (không qua CI)

Từ máy dev (Windows 10/11, Linux, macOS) có `git`, `node`, OpenSSH client (`ssh`, `scp`), tại thư mục gốc repo:

```bash
pnpm deploy:staging
```

Lệnh `git fetch origin staging` rồi deploy đúng commit `origin/staging`; không pull, không checkout, working tree và nhánh hiện tại không bị đổi. Lệnh in commit, host, `DB_MODE=rebuild` và yêu cầu gõ `DEPLOY` trước khi gửi gì lên host (`pnpm deploy:staging --yes` bỏ bước xác nhận). Tarball (`backend`, `scripts`, `docs/common/database`) và `deploy/deploy.sh` của commit đó được `scp` vào `~/deploy/`, sau đó chạy `DB_MODE=rebuild bash deploy/deploy.sh <sha7>`. Log stream ra terminal; mã thoát của lệnh là mã thoát của `deploy.sh`. File tạm được xóa sau khi chạy.

Cấu hình host (không ghi IP, tên tài khoản hay mật khẩu vào repo):

- `QLVB_DEPLOY_HOST` (bắt buộc): alias trong `~/.ssh/config` hoặc `user@host`. Ví dụ alias:

  ```
  Host qlvb-staging
      HostName <host>
      User <user deploy>
      Port 2150
  ```

  rồi đặt `QLVB_DEPLOY_HOST=qlvb-staging`.
- `QLVB_DEPLOY_PORT` (tùy chọn): chỉ khi đặt thì lệnh truyền `-p`/`-P`; không đặt thì cổng lấy từ cấu hình ssh (alias có `Port`, hoặc mặc định 22). Với `user@host` không qua alias, đặt `QLVB_DEPLOY_PORT=2150`.
- Mật khẩu SSH nhập trực tiếp khi `ssh`/`scp` hỏi (mỗi lần gọi một lần); nên dùng khóa SSH để tránh nhập lặp.

Điều kiện tiên quyết trên host giữ nguyên như mục trên, gồm rule sudoers `systemctl stop qlvb-backend`.

### Khôi phục từ dump

Dùng khi `DB_MODE=rebuild` lỗi từ bước 5 trở đi. `<dump>` là đường dẫn in ở cuối log; `<release cũ>` là release in ở dòng "Ban dang chay". Dump không mang collation của DB nên DB đích tạo lại với ICU `vi-VN` (cùng collation với DB dựng bằng script). Dấu hoàn tất không có trong dump; DB sau khôi phục chưa có dấu cho đến lần `rebuild` kế tiếp, nên không dùng `sync` trên DB này.

```bash
(
  set -euo pipefail
  sudo -n -u postgres /usr/bin/dropdb --if-exists --force qlvb
  sudo -n -u postgres /usr/bin/createdb -O <role ứng dụng> -T template0 -E UTF8 --locale-provider=icu --icu-locale=vi-VN --locale=C.UTF-8 qlvb
  PGPASSWORD=<mật khẩu> pg_restore -h 127.0.0.1 -U <role ứng dụng> -d qlvb --no-owner --exit-on-error <dump>
  ln -sfn /srv/qlvb/releases/<release cũ> /srv/qlvb/current
  sudo -n /usr/bin/systemctl restart qlvb-backend
)
```

Đã kiểm trong container: restore dump của DB libc vào DB ICU thành công (65 bản ghi `django_migrations`). Chưa kiểm trên host thật.

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
