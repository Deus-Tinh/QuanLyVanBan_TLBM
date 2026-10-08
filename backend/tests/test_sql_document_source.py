import pytest
from unittest.mock import MagicMock, patch

from backend.services.sql_document_source import (
    DOCUMENT_TABLES,
    SQL_SCHEMA_REGISTRY,
    SqlDocumentAccessError,
    _employee_context,
    accessible_documents,
    get_readonly_connection,
    is_postgres_source,
    verify_sql_schema,
)


def test_sql_schema_registry_contains_all_required_tables():
    """Kiểm tra đầy đủ 10 bảng CSDL QLVB trong danh mục truy vấn thô."""
    expected_tables = {
        "accounts_employee",
        "accounts_employee_groups",
        "auth_group_permissions",
        "auth_permission",
        "documents_vanbanden",
        "documents_vanbandi",
        "documents_vanbanmat",
        "documents_vanbanmat_nguoinhan",
        "documents_vanbanmat_donvinhan",
        "records_chitiettailieu",
    }
    assert expected_tables.issubset(set(SQL_SCHEMA_REGISTRY.keys()))

    for table_name in expected_tables:
        meta = SQL_SCHEMA_REGISTRY[table_name]
        assert "columns" in meta and len(meta["columns"]) > 0
        assert "description" in meta and len(meta["description"]) > 0


def test_get_readonly_connection_returns_valid_connection():
    """Kiểm tra hàm get_readonly_connection luôn trả về kết nối hợp lệ."""
    conn = get_readonly_connection()
    assert conn is not None
    assert hasattr(conn, "cursor")


def test_verify_sql_schema_skips_cleanly_on_sqlite():
    """Khi không chạy PostgreSQL, verify_sql_schema bỏ qua an toàn không báo lỗi."""
    report = verify_sql_schema()
    assert report["status"] in {"skipped", "ok"}


def test_employee_context_raises_when_no_id():
    """Từ chối tra cứu nếu không có employee_id của người đăng nhập."""
    with pytest.raises(SqlDocumentAccessError) as exc_info:
        _employee_context(None)
    assert "danh tính nhân viên" in str(exc_info.value)


@patch("backend.services.sql_document_source.get_readonly_connection")
def test_employee_context_inactive_employee_denied(mock_get_conn):
    """Từ chối tài khoản không hoạt động hoặc không ở trạng thái LAM_VIEC."""
    mock_cursor = MagicMock()
    # row: id, don_vi_id, is_active, trang_thai, is_superuser, permissions
    mock_cursor.fetchone.return_value = (10, 2, False, "LAM_VIEC", False, ["use_aiassistant"])
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_conn.return_value = mock_conn

    with pytest.raises(SqlDocumentAccessError) as exc_info:
        _employee_context(10)
    assert "không hoạt động" in str(exc_info.value)


@patch("backend.services.sql_document_source.get_readonly_connection")
def test_employee_context_status_not_working_denied(mock_get_conn):
    """Từ chối tài khoản đã nghỉ việc."""
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = (10, 2, True, "NGHI_VIEC", False, ["use_aiassistant"])
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_conn.return_value = mock_conn

    with pytest.raises(SqlDocumentAccessError) as exc_info:
        _employee_context(10)
    assert "không hoạt động" in str(exc_info.value)


@patch("backend.services.sql_document_source.get_readonly_connection")
def test_employee_context_missing_ai_permission_denied(mock_get_conn):
    """Từ chối tài khoản không có quyền use_aiassistant và không phải superuser."""
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = (10, 2, True, "LAM_VIEC", False, ["view_vanbanden"])
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_conn.return_value = mock_conn

    with pytest.raises(SqlDocumentAccessError) as exc_info:
        _employee_context(10)
    assert "chưa được cấp quyền sử dụng trợ lý AI" in str(exc_info.value)


@patch("backend.services.sql_document_source.get_readonly_connection")
def test_employee_context_superuser_allowed_without_explicit_perm(mock_get_conn):
    """Tài khoản superuser luôn được phép sử dụng trợ lý AI."""
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = (1, 1, True, "LAM_VIEC", True, [])
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_conn.return_value = mock_conn

    emp = _employee_context(1)
    assert emp["id"] == 1
    assert emp["is_superuser"] is True


@patch("backend.services.sql_document_source.is_postgres_source", return_value=True)
@patch("backend.services.sql_document_source._employee_context")
@patch("backend.services.sql_document_source.get_readonly_connection")
def test_accessible_documents_vanbanmat_applies_strict_acl(mock_get_conn, mock_emp, mock_is_pg):
    """Kiểm tra văn bản mật bắt buộc áp dụng ACL người nhận và đơn vị nhận."""
    mock_emp.return_value = {
        "id": 99,
        "department_id": 5,
        "is_superuser": False,
        "permissions": {"use_aiassistant", "view_vanbanmat"},
    }

    executed_queries = []
    mock_cursor = MagicMock()
    mock_cursor.description = [("source_type",), ("source_id",), ("so_hieu",), ("trich_yeu",)]
    mock_cursor.fetchall.return_value = [
        ("vanbanmat", 101, "01/MAT-UBND", "Nội dung văn bản mật"),
    ]

    def record_execute(sql, params):
        executed_queries.append((sql, params))

    mock_cursor.execute.side_effect = record_execute
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_conn.return_value = mock_conn

    docs = accessible_documents(99)

    # Tìm truy vấn liên quan đến văn bản mật
    vanbanmat_query = next((q for q in executed_queries if "documents_vanbanmat" in q[0]), None)
    assert vanbanmat_query is not None
    sql, params = vanbanmat_query

    # Bắt buộc phải có điều kiện lọc theo người nhận hoặc đơn vị nhận
    assert "documents_vanbanmat_nguoinhan" in sql
    assert "documents_vanbanmat_donvinhan" in sql
    assert 99 in params
    assert 5 in params
    assert len(docs) >= 1
    assert docs[0]["source_type"] == "vanbanmat"
