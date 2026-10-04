"""Read-only queries for documents linked to a dossier.

The document tables belong to Group 2 and intentionally have no Django models
inside the ``records`` app.  This module reads the approved shared DDL without
claiming ownership of those tables or creating duplicate migrations.
"""

from django.db import connection


class DocumentDataUnavailable(RuntimeError):
    """Raised when the shared Group 2 document schema is not available yet."""


DOCUMENT_SOURCES = {
    "vanbanden": {
        "table": "documents_vanbanden",
        "link_table": "documents_vanbanden_hoso",
        "link_column": "vanbanden_id",
        "date_expression": "COALESCE(d.ngay_van_ban, d.ngay_den)",
    },
    "vanbandi": {
        "table": "documents_vanbandi",
        "link_table": "documents_vanbandi_hoso",
        "link_column": "vanbandi_id",
        "date_expression": "COALESCE(d.ngay_van_ban, d.ngay_ban_hanh)",
    },
    "vanbanmat": {
        "table": "documents_vanbanmat",
        "link_table": "documents_vanbanmat_hoso",
        "link_column": "vanbanmat_id",
        "date_expression": "COALESCE(d.ngay_van_ban, d.ngay_ban_hanh)",
    },
}


def _department_id(user):
    for attribute in ("don_vi_id", "donvi_id", "department_id"):
        value = getattr(user, attribute, None)
        if value is not None:
            return value
    return None


def _row_dicts(cursor):
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row, strict=True)) for row in cursor.fetchall()]


def query_dossier_documents(
    *,
    dossier_id,
    user,
    search="",
    year=None,
    document_type="",
    page=1,
    page_size=10,
):
    """Return ``(count, rows)`` for the approved three-table document DDL."""

    selected_types = (
        [document_type]
        if document_type
        else list(DOCUMENT_SOURCES)
    )
    existing_tables = set(connection.introspection.table_names())
    required_tables = {
        table_name
        for selected_type in selected_types
        for table_name in (
            DOCUMENT_SOURCES[selected_type]["table"],
            DOCUMENT_SOURCES[selected_type]["link_table"],
        )
    }
    missing_tables = sorted(required_tables - existing_tables)
    if missing_tables:
        raise DocumentDataUnavailable(
            "Thiếu bảng văn bản dùng chung: " + ", ".join(missing_tables)
        )

    user_id = getattr(user, "pk", None) or -1
    is_staff = bool(
        getattr(user, "is_staff", False)
        or getattr(user, "is_superuser", False)
    )
    department_id = _department_id(user)
    subqueries = []
    parameters = []

    for selected_type in selected_types:
        source = DOCUMENT_SOURCES[selected_type]
        conditions = ["h.hoso_id = %s"]
        source_parameters = [dossier_id]

        if not is_staff:
            conditions.append("d.hien_thi = TRUE")

        if selected_type == "vanbanmat" and not is_staff:
            confidential_rules = ["d.nguoi_tao = %s"]
            source_parameters.append(user_id)

            recipient_table = "documents_vanbanmat_nguoinhan"
            if recipient_table in existing_tables:
                confidential_rules.append(
                    "EXISTS ("
                    "SELECT 1 FROM documents_vanbanmat_nguoinhan nr "
                    "WHERE nr.vanbanmat_id = d.id AND nr.employee_id = %s"
                    ")"
                )
                source_parameters.append(user_id)

            department_table = "documents_vanbanmat_donvinhan"
            if department_id is not None and department_table in existing_tables:
                confidential_rules.append(
                    "EXISTS ("
                    "SELECT 1 FROM documents_vanbanmat_donvinhan dr "
                    "WHERE dr.vanbanmat_id = d.id AND dr.donvi_id = %s"
                    ")"
                )
                source_parameters.append(department_id)

            conditions.append("(" + " OR ".join(confidential_rules) + ")")

        subqueries.append(
            f"""
            SELECT
                d.id,
                '{selected_type}' AS document_type,
                d.so_hieu,
                d.trich_yeu,
                {source['date_expression']} AS ngay_van_ban,
                d.nam
            FROM {source['table']} d
            INNER JOIN {source['link_table']} h
                ON h.{source['link_column']} = d.id
            WHERE {' AND '.join(conditions)}
            """
        )
        parameters.extend(source_parameters)

    union_sql = " UNION ALL ".join(subqueries)
    outer_conditions = []
    outer_parameters = []

    normalized_search = search.strip()
    if normalized_search:
        search_pattern = f"%{normalized_search}%"
        outer_conditions.append(
            "(LOWER(document.so_hieu) LIKE LOWER(%s) "
            "OR LOWER(document.trich_yeu) LIKE LOWER(%s))"
        )
        outer_parameters.extend([search_pattern, search_pattern])

    if year is not None:
        outer_conditions.append("document.nam = %s")
        outer_parameters.append(year)

    where_sql = (
        "WHERE " + " AND ".join(outer_conditions)
        if outer_conditions
        else ""
    )
    count_sql = f"""
        SELECT COUNT(*)
        FROM ({union_sql}) document
        {where_sql}
    """
    data_sql = f"""
        SELECT
            document.id,
            document.document_type,
            document.so_hieu,
            document.trich_yeu,
            document.ngay_van_ban,
            document.nam
        FROM ({union_sql}) document
        {where_sql}
        ORDER BY document.ngay_van_ban DESC NULLS LAST,
                 document.document_type,
                 document.id DESC
        LIMIT %s OFFSET %s
    """

    shared_parameters = parameters + outer_parameters
    with connection.cursor() as cursor:
        cursor.execute(count_sql, shared_parameters)
        count = cursor.fetchone()[0]
        cursor.execute(
            data_sql,
            shared_parameters + [page_size, (page - 1) * page_size],
        )
        rows = _row_dicts(cursor)

    for row in rows:
        row["key"] = f"{row['document_type']}:{row['id']}"

    return count, rows
