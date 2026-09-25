"""Read-only access to QLVB PostgreSQL documents, applying account ACLs first."""

import os
from pathlib import Path

from django.db import connection

from backend.config import DATA_DIR


DOCUMENT_TABLES = {
    "vanbanden": ("documents_vanbanden", "view_vanbanden", "documents_vanbanden_nguoinhan", "documents_vanbanden_donvinhan", "vanbanden_id"),
    "vanbandi": ("documents_vanbandi", "view_vanbandi", "documents_vanbandi_nguoinhan", "documents_vanbandi_donvinhan", "vanbandi_id"),
    "vanbanmat": ("documents_vanbanmat", "view_vanbanmat", "documents_vanbanmat_nguoinhan", "documents_vanbanmat_donvinhan", "vanbanmat_id"),
}


class SqlDocumentAccessError(Exception):
    """The SQL document source cannot safely serve this chat request."""


def is_postgres_source():
    return connection.vendor == "postgresql"


def _employee_context(employee_id):
    if not employee_id:
        raise SqlDocumentAccessError("Cần danh tính nhân viên đã đăng nhập để tra cứu dữ liệu QLVB.")
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT e.id, e.don_vi_id, e.is_active, e.trang_thai::text,
                   e.is_superuser, array_remove(array_agg(DISTINCT p.codename), NULL)
            FROM accounts_employee e
            LEFT JOIN accounts_employee_groups eg ON eg.employee_id = e.id
            LEFT JOIN auth_group_permissions gp ON gp.group_id = eg.group_id
            LEFT JOIN auth_permission p ON p.id = gp.permission_id
            WHERE e.id = %s
            GROUP BY e.id
            """,
            [employee_id],
        )
        row = cursor.fetchone()
    if not row or not row[2] or row[3] != "LAM_VIEC":
        raise SqlDocumentAccessError("Tài khoản QLVB không hoạt động hoặc không tồn tại.")
    employee = {
        "id": row[0],
        "department_id": row[1],
        "is_superuser": row[4],
        "permissions": set(row[5] or []),
    }
    if not employee["is_superuser"] and "use_aiassistant" not in employee["permissions"]:
        raise SqlDocumentAccessError("Tài khoản chưa được cấp quyền sử dụng trợ lý AI.")
    return employee


def _dict_rows(cursor):
    columns = [item[0] for item in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def accessible_documents(employee_id):
    """Return only visible SQL rows the signed-in employee can ask the RAG to read."""
    if not is_postgres_source():
        return []
    employee = _employee_context(employee_id)
    docs = []
    for kind, (table, permission, recipient_people, recipient_units, fk) in DOCUMENT_TABLES.items():
        if not employee["is_superuser"] and permission not in employee["permissions"]:
            continue
        if kind == "vanbanden":
            date_field, number_field = "ngay_den", "so_thu_tu"
        elif kind == "vanbandi":
            date_field, number_field = "ngay_ban_hanh", "so"
        else:
            date_field, number_field = "ngay_ban_hanh", "NULL::integer"

        acl = ""
        params = [employee["id"]]
        if kind == "vanbanmat":
            acl = f"""
                AND (
                    EXISTS (SELECT 1 FROM {recipient_people} rp
                            WHERE rp.{fk} = d.id AND rp.employee_id = %s)
                    OR EXISTS (SELECT 1 FROM {recipient_units} ru
                               WHERE ru.{fk} = d.id AND ru.donvi_id = %s)
                )
            """
            params.extend([employee["id"], employee["department_id"]])

        query = f"""
            SELECT %s::text AS source_type, d.id AS source_id,
                   d.so_hieu, {number_field} AS sort_number, d.nam,
                   d.{date_field} AS document_date, d.trich_yeu,
                   d.noi_ban_hanh, d.ngay_van_ban, d.nguoi_ky,
                   d.chuc_vu, d.hieu_luc::text AS hieu_luc,
                   d.ngay_het_hieu_luc, d.ghi_chu, d.file_dinh_kem,
                   d.updated_at
            FROM {table} d
            WHERE d.hien_thi = TRUE
              AND EXISTS (
                  SELECT 1 FROM accounts_employee e
                  WHERE e.id = %s AND e.is_active = TRUE
                    AND e.trang_thai::text = 'LAM_VIEC'
              )
              {acl}
            ORDER BY d.updated_at DESC
        """
        # Bind values in the order they appear in the query.
        query_params = [kind, employee["id"], *params[1:]]
        with connection.cursor() as cursor:
            cursor.execute(query, query_params)
            for row in _dict_rows(cursor):
                row["display_name"] = f"{row['so_hieu']} — {row['trich_yeu']}"[:240]
                docs.append(row)

    if employee["is_superuser"] or "view_tailieu" in employee["permissions"]:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 'tailieu'::text AS source_type, d.id AS source_id,
                       d.ky_hieu AS so_hieu, NULL::integer AS sort_number,
                       NULL::smallint AS nam, d.ngay_dang::timestamptz AS document_date,
                       d.tieu_de AS trich_yeu, d.noi_ban_hanh, NULL::timestamptz AS ngay_van_ban,
                       NULL::text AS nguoi_ky, NULL::text AS chuc_vu,
                       d.hieu_luc::text AS hieu_luc, d.ngay_het_hieu_luc::timestamptz AS ngay_het_hieu_luc,
                       d.ghi_chu, d.file_dinh_kem, d.updated_at
                FROM records_chitiettailieu d
                LEFT JOIN accounts_employee creator ON creator.id = d.nguoi_tao
                WHERE d.hien_thi::text = 'TAT_CA'
                   OR (d.hien_thi::text = 'NOI_BO_PHONG_BAN'
                       AND (d.nguoi_tao = %s OR creator.don_vi_id = %s))
                ORDER BY d.updated_at DESC
                """,
                [employee["id"], employee["department_id"]],
            )
            for row in _dict_rows(cursor):
                row["display_name"] = f"{row['so_hieu'] or 'Tài liệu'} — {row['trich_yeu']}"[:240]
                docs.append(row)

    return docs


def resolve_document_file(file_reference):
    """Resolve a DB storage key inside the configured document root only."""
    if not file_reference:
        return None
    root = Path(os.getenv("QLVB_STORAGE_ROOT", DATA_DIR / "docs")).expanduser().resolve()
    reference = Path(str(file_reference))
    candidate = reference if reference.is_absolute() else root / reference
    try:
        resolved = candidate.resolve(strict=True)
        resolved.relative_to(root)
    except (OSError, ValueError):
        return None
    return resolved if resolved.is_file() else None


def get_accessible_document(employee_id, source_type, source_id):
    return next(
        (doc for doc in accessible_documents(employee_id)
         if doc["source_type"] == source_type and doc["source_id"] == int(source_id)),
        None,
    )
