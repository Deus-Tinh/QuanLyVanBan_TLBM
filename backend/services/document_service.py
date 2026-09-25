import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from backend.config import DOCS_DIR, DOC_REGISTRY_PATH


def save_upload_file(file) -> tuple[Path, bool]:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.name).name
    saved_path = DOCS_DIR / safe_name
    is_reupload = saved_path.exists()

    with saved_path.open("wb") as buffer:
        for chunk in file.chunks():
            buffer.write(chunk)

    return saved_path, is_reupload


# ── Registry CRUD ──────────────────────────────────────────────


def load_registry() -> list[dict]:
    """Đọc doc_registry.json, trả về list entries."""
    if not DOC_REGISTRY_PATH.exists():
        return []

    try:
        data = json.loads(DOC_REGISTRY_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_registry(entries: list[dict]):
    """Ghi list entries vào doc_registry.json."""
    DOC_REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    DOC_REGISTRY_PATH.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def add_to_registry(filename: str, category: str, size: int):
    """Thêm 1 document entry vào registry."""
    entries = load_registry()

    # Xóa entry cũ nếu trùng filename (re-upload)
    entries = [e for e in entries if e.get("filename") != filename]

    entries.append({
        "filename": filename,
        "category": category,
        "size": size,
        "upload_time": datetime.now(timezone.utc).isoformat(),
    })

    save_registry(entries)


def update_category_in_registry(filename: str, category: str):
    """Cập nhật category cho một document trong registry."""
    entries = load_registry()
    
    for entry in entries:
        if entry.get("filename") == filename:
            entry["category"] = category
            break
    
    save_registry(entries)


def remove_from_registry(filename: str):
    """Xóa 1 entry theo filename."""
    entries = load_registry()
    entries = [e for e in entries if e.get("filename") != filename]
    save_registry(entries)


def clear_registry():
    """Xóa toàn bộ registry."""
    if DOC_REGISTRY_PATH.exists():
        DOC_REGISTRY_PATH.unlink()


# ── Document Management ───────────────────────────────────────


def list_documents():
    """Trả về danh sách tài liệu kèm category từ registry."""
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    registry = load_registry()
    registry_map = {e["filename"]: e for e in registry}

    documents = []

    for item in DOCS_DIR.iterdir():
        if not item.is_file() or item.name == ".gitkeep":
            continue

        reg_entry = registry_map.get(item.name, {})

        documents.append({
            "filename": item.name,
            "path": str(item),
            "size": item.stat().st_size,
            "category": reg_entry.get("category", "Chưa phân loại"),
            "upload_time": reg_entry.get("upload_time"),
        })

    return documents


def list_categories():
    """Trả về danh sách các chủ đề hiện có và số tài liệu mỗi chủ đề."""
    documents = list_documents()
    category_counts = {}

    for doc in documents:
        cat = doc["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return [
        {"name": name, "count": count}
        for name, count in sorted(category_counts.items())
    ]


def clear_documents():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    for item in DOCS_DIR.iterdir():
        if item.is_file() and item.name != ".gitkeep":
            item.unlink()

    clear_registry()


def delete_document_file(filename: str) -> bool:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = Path(filename).name
    file_path = DOCS_DIR / safe_name
    existed = file_path.exists() and file_path.is_file()

    if existed and safe_name != ".gitkeep":
        file_path.unlink()

    remove_from_registry(safe_name)

    return existed
