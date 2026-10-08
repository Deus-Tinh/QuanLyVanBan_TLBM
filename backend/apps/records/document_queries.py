"""Read-only metadata list for the canonical two-kind release DDL.

Restricted documents require the creator or an explicitly named Employee.
No staff/superuser/department override is applied. Counts, searches and pages
are computed after the ACL. Returning metadata writes an append-only XEM log.
"""
from django.db import connection, transaction


class DocumentDataUnavailable(RuntimeError):
    """Shared document schema is absent or predates the pinned release."""


DOCUMENT_SOURCES = {
    "vanbanden": ("ngay_den", "vanbanden_id"),
    "vanbandi": ("ngay_ban_hanh", "vanbandi_id"),
}


def query_dossier_documents(*, dossier_id, user, search="", year=None,
                            document_type="", scope="", page=1, page_size=10):
    if document_type and document_type not in DOCUMENT_SOURCES:
        raise ValueError("Unsupported document type")
    if scope not in ("", "NOI_BO", "HAN_CHE"):
        raise ValueError("Unsupported scope")
    if page < 1 or not 1 <= page_size <= 100:
        raise ValueError("Invalid pagination")
    if not getattr(user, "is_authenticated", False) or not getattr(user, "is_active", False):
        return 0, []
    selected = [document_type] if document_type else list(DOCUMENT_SOURCES)
    tables = set(connection.introspection.table_names())
    required = {"documents_access_log"}
    for kind in selected:
        required.update(f"documents_{kind}{suffix}" for suffix in ("", "_hoso", "_nguoinhan"))
    if not required.issubset(tables):
        raise DocumentDataUnavailable("Missing canonical shared tables")
    queries, params = [], []
    with connection.cursor() as cursor:
        for kind in selected:
            columns = {field.name for field in connection.introspection.get_table_description(cursor, f"documents_{kind}")}
            if not {"nguoi_tao_id", "pham_vi"}.issubset(columns):
                raise DocumentDataUnavailable("Document schema predates column normalization")
    for kind in selected:
        date_column, link_column = DOCUMENT_SOURCES[kind]
        can_view_internal = bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False)
                                 or user.has_perm(f"view_{kind}") or user.has_perm(f"documents.view_{kind}"))
        internal_clause = "d.pham_vi = 'NOI_BO'" + ("" if can_view_internal else " AND d.hien_thi = TRUE")
        conditions = ["h.hoso_id = %s", f"(({internal_clause}) OR (d.pham_vi = 'HAN_CHE' AND (d.nguoi_tao_id = %s OR EXISTS (SELECT 1 FROM documents_{kind}_nguoinhan r WHERE r.{link_column} = d.id AND r.employee_id = %s))))"]
        values = [dossier_id, user.pk, user.pk]
        if scope:
            conditions.append("d.pham_vi = %s")
            values.append(scope)
        queries.append(f"SELECT d.id, '{kind}' AS document_type, d.so_hieu, d.trich_yeu, COALESCE(d.ngay_van_ban, d.{date_column}) AS ngay_van_ban, d.nam, d.pham_vi FROM documents_{kind} d JOIN documents_{kind}_hoso h ON h.{link_column} = d.id WHERE " + " AND ".join(conditions))
        params.extend(values)
    outer = []
    if search.strip():
        outer.append("(LOWER(doc.so_hieu) LIKE LOWER(%s) OR LOWER(doc.trich_yeu) LIKE LOWER(%s))")
        # Search terms are parameters, never SQL identifiers or text interpolation.
        params.extend([f"%{search.strip()}%"] * 2)
    if year is not None:
        outer.append("doc.nam = %s")
        params.append(year)
    sql = " FROM (" + " UNION ALL ".join(queries) + ") doc" + (" WHERE " + " AND ".join(outer) if outer else "")
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*)" + sql, params)
            count = cursor.fetchone()[0]
            cursor.execute("SELECT doc.*" + sql + " ORDER BY doc.ngay_van_ban DESC NULLS LAST, doc.document_type, doc.id DESC LIMIT %s OFFSET %s", params + [page_size, (page - 1) * page_size])
            columns = [field[0] for field in cursor.description]
            rows = [dict(zip(columns, row, strict=True)) for row in cursor.fetchall()]
            if rows:
                cursor.executemany("INSERT INTO documents_access_log (document_type, document_id, user_id, hanh_dong) VALUES (%s, %s, %s, 'XEM')", [(row["document_type"], row["id"], user.pk) for row in rows])
    for row in rows:
        row["key"] = f"{row['document_type']}:{row['id']}"
    return count, rows
