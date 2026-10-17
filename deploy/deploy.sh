#!/usr/bin/env bash
# Deploy backend QLVB:  deploy.sh <ten-release>  (nguon duy nhat: deploy/deploy.sh trong repo, moi lan deploy duoc day len ~/deploy/ cung tarball)
# Can co ~/deploy/qlvb-<ten-release>.tar.gz (thu muc goc chua backend/, scripts/, docs/common/database/). Tao tren may dev:
#   git -c core.autocrlf=false archive --format=tar.gz -o qlvb-<sha>.tar.gz <sha> backend scripts docs/common/database
#   scp -P 2150 qlvb-<sha>.tar.gz <user>@<host>:deploy/
# Thu tu: giai nen -> venv -> check -> backup -> DB (theo DB_MODE) -> doi symlink -> restart -> kiem tra
#         -> (that bai thi tu quay lai ban cu).
# DB_MODE (bien moi truong, mac dinh sync):
#   sync     dau hoan tat DB phai khop hash release_DDL.sql (lech thi dung); neu co migration cho thi thu
#            `build_db.py --sync` tren ban khoi phuc cua backup, dat thi chay that. Dung cho DB co du lieu that.
#   rebuild  xoa va dung lai DB tu release_DDL.sql (`build_db.py --seed`). Chi dung cho staging (du lieu thu nghiem).
# Bien tuy chon cho test: QLVB_BASE, QLVB_ENVF.
set -euo pipefail
umask 022

NAME=${1:?"Dung: deploy.sh <ten-release>"}
[[ $NAME =~ ^[A-Za-z0-9._-]+$ ]] || { echo "Ten release khong hop le: $NAME"; exit 2; }
DB_MODE=${DB_MODE:-sync}
[[ $DB_MODE == sync || $DB_MODE == rebuild ]] || { echo "DB_MODE khong hop le: $DB_MODE (sync|rebuild)"; exit 2; }

BASE=${QLVB_BASE:-/srv/qlvb}
REL=$BASE/releases/$NAME
TAR=$HOME/deploy/qlvb-$NAME.tar.gz
ENVF=${QLVB_ENVF:-/etc/qlvb/backend.env}
SERVICE=qlvb-backend
PORT=8001
KEEP=5
LOG=$BASE/deploy.log

exec > >(exec 9>&-; exec tee -a "$LOG") 2>&1
step() { echo; echo "[$(date -u +%H:%M:%S)] $*"; }

exec 9>"$BASE/.deploy.lock"
flock -n 9 || { echo "Dang co deploy khac chay."; exit 1; }

CREATED=0; SWITCHED=0; TMPDB=""; PREV=""; DUMP=""; DB_REBUILT=0; STOPPED=0
cleanup() {
  rc=$?
  if [ -n "$TMPDB" ]; then sudo -n -u postgres /usr/bin/dropdb --if-exists "$TMPDB" >/dev/null 2>&1 || true; fi
  if [ $rc -ne 0 ]; then
    echo; echo "DEPLOY THAT BAI (exit $rc)."
    if [ $SWITCHED -eq 0 ] && [ $CREATED -eq 1 ]; then
      rm -rf "$REL"; echo "Da xoa release dang do: $REL"
    fi
    if [ $DB_REBUILT -eq 1 ]; then
      echo "DB da bi xoa va dung lai (DB_MODE=rebuild); quay lai release cu KHONG khoi phuc duoc DB."
      if [ $STOPPED -eq 1 ]; then
        echo "Service $SERVICE dang DUNG de khong chay tren DB hong."
      else
        echo "CANH BAO: khong dung duoc $SERVICE (thieu quyen sudo), service van chay tren DB co the hong. Dung thu cong."
      fi
      echo "Khoi phuc DB tu backup: xem muc 'Khoi phuc tu dump' trong docs/common/database/build_db_runbook.md"
    fi
    echo "Ban dang chay: $(readlink -f "$BASE/current")"
    [ -n "$DUMP" ] && echo "Backup truoc deploy: $DUMP"
  fi
}
trap cleanup EXIT

step "1/8 Kiem tra dau vao ($NAME, DB_MODE=$DB_MODE)"
[ -f "$TAR" ] || { echo "Thieu file $TAR"; exit 1; }
[ ! -e "$REL" ] || { echo "Release $NAME da ton tai"; exit 1; }
PREV=$(readlink -f "$BASE/current")
echo "Ban hien tai: $PREV"
systemctl is-active --quiet "$SERVICE" || echo "CANH BAO: $SERVICE khong active truoc khi deploy"

step "2/8 Giai nen va cai thu vien"
mkdir -p "$REL"; CREATED=1
tar -xzf "$TAR" -C "$REL"
for f in backend/manage.py scripts/build_db.py docs/common/database/release_DDL.sql; do
  [ -f "$REL/$f" ] || { echo "Tarball khong co $f"; exit 1; }
done
python3 -m venv "$REL/venv"
"$REL/venv/bin/pip" install -q --upgrade pip
"$REL/venv/bin/pip" install -q -r "$REL/backend/requirements.txt"
"$REL/venv/bin/pip" check
PY="$REL/venv/bin/python"
BUILD_DB="$REL/scripts/build_db.py"
DDL="$REL/docs/common/database/release_DDL.sql"

step "3/8 Nap cau hinh, check, collectstatic"
set -a; . "$ENVF"; set +a
cd "$REL/backend"
$PY manage.py check
$PY manage.py collectstatic --noinput | tail -1

# psql bang role ung dung (thong tin tu backend.env)
pgapp() { PGPASSWORD="${DB_PASSWORD:-}" psql -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "$DB_USER" -X -At -v ON_ERROR_STOP=1 "$@"; }
ICU_CREATE=(-T template0 -E UTF8 --locale-provider=icu --icu-locale=vi-VN --locale=C.UTF-8)

step "4/8 Backup truoc khi doi"
"$BASE/tools/backup.sh"
LAST=$(tail -1 "$BASE/backups/backup.log")
[[ $LAST == *" OK "* ]] || { echo "Backup khong thanh cong: $LAST"; exit 1; }
DUMP="$BASE/backups/$(echo "$LAST" | awk '{print $3}')"
echo "Backup: $DUMP"

step "5/8 Co so du lieu ($DB_MODE)"
if [ "$DB_MODE" = rebuild ]; then
  [[ ${DB_NAME:-} =~ ^[a-z_][a-z0-9_]*$ && ${DB_USER:-} =~ ^[a-z_][a-z0-9_]*$ ]] \
    || { echo "DB_NAME/DB_USER trong $ENVF khong hop le"; exit 1; }
  test -s "$DUMP" && [ "$(pg_restore -l "$DUMP" | grep -vc '^;')" -gt 0 ] \
    || { echo "Dump khong doc duoc danh muc: $DUMP"; exit 1; }
  if sudo -n /usr/bin/systemctl stop "$SERVICE"; then
    STOPPED=1
  else
    echo "CANH BAO: khong co quyen sudo systemctl stop; $SERVICE van chay, dropdb --force se cat ket noi."
  fi
  DB_REBUILT=1
  sudo -n -u postgres /usr/bin/dropdb --if-exists --force "$DB_NAME"
  sudo -n -u postgres /usr/bin/createdb -O "$DB_USER" "${ICU_CREATE[@]}" "$DB_NAME"
  $PY "$BUILD_DB" --seed
  COLL=$(pgapp -d postgres -c "SELECT datlocprovider::text || '|' || coalesce(to_jsonb(d)->>'datlocale', to_jsonb(d)->>'daticulocale') FROM pg_database d WHERE datname='$DB_NAME'")
  [ "$COLL" = 'i|vi-VN' ] || { echo "Collation DB sai: $COLL"; exit 1; }
  HASH=$(sha256sum "$DDL" | cut -d' ' -f1)
  MARK=$(pgapp -d postgres -c "SELECT coalesce(shobj_description(oid,'pg_database'),'') FROM pg_database WHERE datname='$DB_NAME'")
  [[ $MARK == "build_db:v2 ddl_sha256=$HASH seed=1 "* ]] || { echo "Dau hoan tat khong khop DDL: $MARK"; exit 1; }
  $PY manage.py migrate --check
  echo "DB dung lai xong: collation=$COLL, dau hoan tat khop DDL, khong con migration cho."
else
  # sync: DB phai dung bang dung release_DDL.sql cua release nay, kiem truoc ca khi co hay khong migration moi.
  HASH=$(sha256sum "$DDL" | cut -d' ' -f1)
  MARK=$(pgapp -d postgres -c "SELECT coalesce(shobj_description(oid,'pg_database'),'') FROM pg_database WHERE datname='$DB_NAME'")
  if [[ $MARK != "build_db:v2 ddl_sha256=$HASH "* ]]; then
    echo "Dau hoan tat cua DB $DB_NAME khong khop release_DDL.sql cua release nay (dau: '$MARK')."
    echo "build_db.py --sync tu choi: DDL da doi hoac DB khong dung bang script. Khong doi gi, khong switch."
    echo "Staging: dung DB_MODE=rebuild. Production: can quy trinh nang cap rieng."
    exit 1
  fi
  if $PY manage.py migrate --check >/dev/null 2>&1; then
    echo "Khong co migration moi."
  else
    echo "Co migration moi:"
    $PY manage.py migrate --plan
    TMPDB="qlvb_migtest_$$"
    ME=$(id -un)
    echo "Thu tren ban khoi phuc cua backup (DB tam $TMPDB)..."
    sudo -n -u postgres /usr/bin/createdb -O "$ME" "${ICU_CREATE[@]}" "$TMPDB"
    pg_restore --no-owner --no-privileges -d "$TMPDB" "$DUMP"
    # pg_dump -Fc khong mang COMMENT ON DATABASE; build_db.py --sync can dau hoan tat.
    psql -X -q -v ON_ERROR_STOP=1 -v m="$MARK" -d postgres <<<"COMMENT ON DATABASE \"$TMPDB\" IS :'m';"
    TESTENV=(DB_NAME="$TMPDB" DB_USER="$ME" DB_PASSWORD= DB_HOST=/var/run/postgresql DB_PORT=5432)
    env "${TESTENV[@]}" "$PY" "$BUILD_DB" --sync
    env "${TESTENV[@]}" "$PY" manage.py migrate --check
    sudo -n -u postgres /usr/bin/dropdb "$TMPDB"; TMPDB=""
    echo "Thu migration: DAT. Chay that tren DB $DB_NAME..."
    $PY "$BUILD_DB" --sync
    $PY manage.py migrate --check
  fi
fi

step "6/8 Chuyen release va restart"
ln -sfn "$REL" "$BASE/current"; SWITCHED=1
sudo -n /usr/bin/systemctl restart "$SERVICE"

step "7/8 Kiem tra sau deploy"
ok=0; code=000
for _ in $(seq 1 15); do
  sleep 2
  code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' -H 'Host: 127.0.0.1' "http://127.0.0.1:$PORT/api/auth/profile/" || true)
  if [ "$code" = 401 ] && systemctl is-active --quiet "$SERVICE"; then ok=1; break; fi
done
if [ $ok -ne 1 ]; then
  echo "Kiem tra THAT BAI (http=$code). Quay lai $PREV"
  ln -sfn "$PREV" "$BASE/current"
  sudo -n /usr/bin/systemctl restart "$SERVICE"
  if [ $DB_REBUILT -eq 1 ]; then
    echo "DB da duoc dung lai theo DDL moi nen code cu co the khong chay duoc tren DB nay; quay lai khong khoi phuc DB."
  else
    echo "Neu migration da chay thi DB co the moi hon code cu."
  fi
  echo "Backup truoc deploy: $DUMP"
  exit 1
fi
echo "API tra 401 JSON dung ky vong, service active."

step "8/8 Don release cu (giu $KEEP ban moi nhat)"
CUR=$(readlink -f "$BASE/current")
ls -1dt "$BASE"/releases/*/ | tail -n +$((KEEP+1)) | while read -r d; do
  d=${d%/}
  if [ "$d" = "$CUR" ] || [ "$d" = "$PREV" ]; then continue; fi
  echo "xoa $d"; rm -rf "$d"
done

echo; echo "DEPLOY OK: $PREV -> $REL"
