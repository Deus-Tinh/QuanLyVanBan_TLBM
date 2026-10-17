#!/usr/bin/env bash
# Deploy backend staging: dựng lại DB từ release_DDL.sql thay cho migrate.
# Dùng: deploy.sh <sha7> [tarball.tar.gz | thư mục release]
# Mặc định nguồn: $HOME/deploy/qlvb-<sha7>.tar.gz (gốc tarball chứa backend/, scripts/, docs/common/database/).
# Ghi đè bằng biến môi trường: QLVB_ROOT, QLVB_ENV_FILE, QLVB_SERVICE, QLVB_HEALTH_URL, QLVB_KEEP,
# QLVB_PG_ADMIN, QLVB_SYSTEMCTL, QLVB_PYTHON.
set -euo pipefail

ROOT="${QLVB_ROOT:-/srv/qlvb}"
ENV_FILE="${QLVB_ENV_FILE:-/etc/qlvb/backend.env}"
SERVICE="${QLVB_SERVICE:-qlvb-backend}"
HEALTH_URL="${QLVB_HEALTH_URL:-http://127.0.0.1:8001/api/organizations/units/}"
KEEP="${QLVB_KEEP:-5}"
# Lệnh quản trị PostgreSQL (peer auth, user postgres) và systemctl; test có thể thay bằng wrapper.
read -r -a PG_ADMIN <<< "${QLVB_PG_ADMIN:-sudo -n -u postgres psql}"
read -r -a SYSTEMCTL <<< "${QLVB_SYSTEMCTL:-sudo -n systemctl}"
PYTHON_BIN="${QLVB_PYTHON:-python3}"

RELEASES="$ROOT/releases"
BACKUPS="$ROOT/backups"
LOG="$ROOT/deploy.log"
LOCK="$ROOT/.deploy.lock"

SHA="${1:-}"
SRC="${2:-}"
PHASE="0 khởi tạo"
DB_DESTROYED=0
DUMP=""

[[ "$SHA" =~ ^[0-9a-f]{7,40}$ ]] || { echo "Dùng: $0 <sha7> [tarball|thư mục]" >&2; exit 2; }
SRC="${SRC:-$HOME/deploy/qlvb-$SHA.tar.gz}"
RELEASE="$RELEASES/$SHA"

mkdir -p "$RELEASES" "$BACKUPS"
exec 9>"$LOCK"
flock -n 9 || { echo "Đang có deploy khác chạy (khóa $LOCK)." >&2; exit 3; }
exec > >(exec 9>&-; exec tee -a "$LOG") 2>&1

log() { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*"; }

on_error() {
  local code=$?
  trap - ERR
  log "LỖI ở bước $PHASE (mã $code)."
  if [[ "$PHASE" == [5-7]* ]]; then
    "${SYSTEMCTL[@]}" stop "$SERVICE" || true
    log "Backend được giữ ở trạng thái DỪNG."
    if (( DB_DESTROYED )); then
      log "DB đã bị xóa hoặc dựng dở. Khôi phục theo mục 'Khôi phục từ dump' trong docs/common/database/build_db_runbook.md. Dump bước 4: $DUMP"
    fi
  else
    log "Chưa dừng service và chưa đổi DB; backend vẫn chạy bản cũ."
  fi
  exit "$code"
}
trap on_error ERR

# Nạp backend.env (định dạng KEY=VALUE của systemd) vào môi trường tiến trình, không dùng source.
load_env() {
  local content line key val
  if [[ -r "$ENV_FILE" ]]; then content="$(cat "$ENV_FILE")"; else content="$(sudo -n cat "$ENV_FILE")"; fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"; val="${line#*=}"
    key="${key//[[:space:]]/}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ "$val" =~ ^\"(.*)\"$ || "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"; fi
    export "$key=$val"
  done <<< "$content"
}

pg_admin() { "${PG_ADMIN[@]}" -v ON_ERROR_STOP=1 -X -q "$@"; }
pg_app() { PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -X -At -v ON_ERROR_STOP=1 "$@"; }

###############################################################################
PHASE="1 kiểm đầu vào"; log "== $PHASE: sha=$SHA nguồn=$SRC"
[[ -e "$SRC" ]] || { log "Không thấy nguồn: $SRC"; false; }
load_env
for v in DB_NAME DB_USER DB_HOST DB_PORT DB_PASSWORD DJANGO_SECRET_KEY; do
  [[ -n "${!v:-}" ]] || { log "Thiếu biến $v trong $ENV_FILE"; false; }
done
[[ "$DB_NAME" =~ ^[a-z_][a-z0-9_]*$ && "$DB_USER" =~ ^[a-z_][a-z0-9_]*$ ]] || { log "DB_NAME hoặc DB_USER không hợp lệ"; false; }
[[ "${DB_ENGINE:-}" == postgresql ]] || { log "DB_ENGINE phải là postgresql"; false; }
for c in flock curl pg_dump pg_restore psql sha256sum "$PYTHON_BIN"; do
  command -v "$c" >/dev/null || { log "Thiếu lệnh $c"; false; }
done

###############################################################################
PHASE="2 giải nén và cài thư viện"; log "== $PHASE"
CURRENT_TARGET="$(readlink -f "$ROOT/current" 2>/dev/null || true)"
if [[ -n "$CURRENT_TARGET" && "$CURRENT_TARGET" == "$(readlink -f "$RELEASE")" ]]; then
  log "Release $SHA đang chạy, dùng lại thư mục hiện có."
else
  rm -rf "$RELEASE"
  mkdir -p "$RELEASE"
  if [[ -d "$SRC" ]]; then cp -a "$SRC"/. "$RELEASE"/; else tar -xzf "$SRC" -C "$RELEASE"; fi
fi
for f in backend/manage.py backend/requirements.txt scripts/build_db.py docs/common/database/release_DDL.sql; do
  [[ -f "$RELEASE/$f" ]] || { log "Release thiếu $f"; false; }
done
[[ -x "$RELEASE/venv/bin/python" ]] || "$PYTHON_BIN" -m venv "$RELEASE/venv"
"$RELEASE/venv/bin/pip" install --disable-pip-version-check -q -r "$RELEASE/backend/requirements.txt"
PY="$RELEASE/venv/bin/python"

###############################################################################
PHASE="3 check và collectstatic"; log "== $PHASE"
(cd "$RELEASE/backend" && "$PY" manage.py check && "$PY" manage.py collectstatic --noinput -v 0)

###############################################################################
PHASE="4 backup DB hiện tại"; log "== $PHASE"
DUMP="$BACKUPS/qlvb_$(date -u +%Y%m%dT%H%M%SZ).dump"
if [[ "$(pg_app -d postgres -c "SELECT count(*) FROM pg_database WHERE datname='$DB_NAME'")" == 1 ]]; then
  PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -Fc -f "$DUMP" "$DB_NAME"
  test -s "$DUMP"
  test "$(pg_restore -l "$DUMP" | grep -vc '^;')" -gt 0
  log "Dump đọc được danh mục: $DUMP"
else
  log "DB $DB_NAME chưa tồn tại, bỏ qua backup."; DUMP="(không có)"
fi

###############################################################################
PHASE="5 dựng lại DB"; log "== $PHASE"
"${SYSTEMCTL[@]}" stop "$SERVICE"
DB_DESTROYED=1
pg_admin -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE)"
pg_admin -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER TEMPLATE template0 ENCODING 'UTF8' LOCALE_PROVIDER icu ICU_LOCALE 'vi-VN' LOCALE 'C.UTF-8'"
(cd "$RELEASE" && "$PY" scripts/build_db.py --dbname "$DB_NAME" --seed)

COLLATION="$(pg_app -d postgres -c "SELECT datlocprovider::text || '|' || coalesce(to_jsonb(d)->>'datlocale', to_jsonb(d)->>'daticulocale') FROM pg_database d WHERE datname='$DB_NAME'")"
[[ "$COLLATION" == 'i|vi-VN' ]] || { log "Collation sai: $COLLATION"; false; }
DDL_HASH="$(sha256sum "$RELEASE/docs/common/database/release_DDL.sql" | cut -d' ' -f1)"
MARK="$(pg_app -d postgres -c "SELECT coalesce(shobj_description(oid,'pg_database'),'') FROM pg_database WHERE datname='$DB_NAME'")"
[[ "$MARK" == "build_db:v2 ddl_sha256=$DDL_HASH seed=1 "* ]] || { log "Dấu hoàn tất không khớp: $MARK"; false; }
MIGRATIONS="$(cd "$RELEASE/backend" && "$PY" manage.py showmigrations)"
[[ -n "$MIGRATIONS" ]] || { log "showmigrations rỗng"; false; }
if grep -q '\[ \]' <<< "$MIGRATIONS"; then log "Còn migration chưa áp dụng"; false; fi
DB_DESTROYED=0
log "DB dựng xong: collation=$COLLATION, dấu hoàn tất khớp DDL, mọi migration đã ghi nhận."

###############################################################################
PHASE="6 chuyển symlink và khởi động"; log "== $PHASE"
ln -sfn "$RELEASE" "$ROOT/current.new"
mv -Tf "$ROOT/current.new" "$ROOT/current"
"${SYSTEMCTL[@]}" start "$SERVICE"

###############################################################################
PHASE="7 kiểm tra sau deploy"; log "== $PHASE"
BODY="$(mktemp)"
OK=0; CODE=""
for _ in $(seq 1 30); do
  CODE="$(curl -s -o "$BODY" -w '%{http_code}' -H 'Accept: application/json' "$HEALTH_URL" || true)"
  if [[ "$CODE" == 401 ]] && "$PY" -c 'import json,sys; json.load(open(sys.argv[1]))' "$BODY" 2>/dev/null; then OK=1; break; fi
  sleep 1
done
rm -f "$BODY"
(( OK )) || { log "API không trả 401 JSON (mã cuối: ${CODE:-?})"; false; }
"${SYSTEMCTL[@]}" is-active --quiet "$SERVICE" || { log "Service không active"; false; }
log "API trả 401 JSON đúng kỳ vọng, service active."

###############################################################################
PHASE="8 dọn release cũ"; log "== $PHASE (giữ $KEEP)"
NEW_TARGET="$(readlink -f "$ROOT/current")"
i=0
while IFS= read -r d; do
  i=$((i+1))
  if (( i > KEEP )) && [[ "$(readlink -f "$d")" != "$NEW_TARGET" ]]; then log "Xóa $d"; rm -rf "$d"; fi
done < <(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)
trap - ERR
log "Hoàn tất deploy $SHA."
