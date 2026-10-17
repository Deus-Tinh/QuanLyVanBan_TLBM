import unittest

try:
    from backend.services.rag_service import build_category_filters
except ImportError as exc:
    # Test kiểu pytest; cần thư viện RAG (chromadb, llama_index...) chưa nằm trong backend/requirements.txt.
    raise unittest.SkipTest(f"Thiếu thư viện RAG: {exc}")


def test_build_category_filters_returns_none_for_empty_value():
    assert build_category_filters(None) is None
    assert build_category_filters("") is None
    assert build_category_filters("   ") is None


def test_build_category_filters_matches_category_metadata():
    filters = build_category_filters("Tin học")

    assert filters is not None
    assert len(filters.filters) == 1
    assert filters.filters[0].key == "category"
    assert filters.filters[0].value == "Tin học"
