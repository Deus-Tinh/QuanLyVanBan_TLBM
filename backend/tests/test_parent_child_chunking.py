from pathlib import Path

from backend.services.rag_service import (
    build_parent_child_documents,
    chunk_text,
    make_source_preview,
)


def test_chunk_text_uses_overlap():
    text = "a" * 700

    chunks = chunk_text(text, chunk_size=300, overlap=50)

    assert len(chunks) == 3
    assert chunks[0]["start"] == 0
    assert chunks[1]["start"] == 250
    assert chunks[2]["start"] == 500


def test_parent_child_documents_keep_source_metadata():
    page_items = [{
        "text": (
            "Phần mở đầu nói về hệ thống hỏi đáp tài liệu. "
            "Phần phương pháp mô tả parent child chunking và citation theo trang. "
        ) * 20,
        "page": 2,
        "reader": "pdfplumber",
    }]

    documents = build_parent_child_documents(Path("baitap.pdf"), page_items)
    first_doc = documents[0]

    assert documents
    assert first_doc.metadata["file_name"] == "baitap.pdf"
    assert first_doc.metadata["page"] == 2
    assert first_doc.metadata["parent_context"]
    assert first_doc.metadata["child_text"] == first_doc.text


def test_source_preview_prefers_question_keyword():
    text = (
        "Đoạn đầu chỉ giới thiệu tài liệu. "
        "Hệ thống sử dụng parent child chunking để tìm đoạn nhỏ và gửi ngữ cảnh lớn cho LLM. "
        "Đoạn cuối nói về giao diện."
    )

    preview = make_source_preview(text, "parent child chunking hoạt động thế nào?")

    assert "parent child chunking" in preview
