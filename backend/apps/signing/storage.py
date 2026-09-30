import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path

from django.conf import settings


class StorageError(Exception):
    """Vị trí lưu không hợp lệ hoặc tệp không đọc được."""


@dataclass(frozen=True)
class StoredFileMeta:
    vi_tri_luu_tep: str
    kich_thuoc: int


class DocumentStorageAdapter(ABC):
    """Đọc tệp văn bản theo `vi_tri_luu_tep`; nghiệp vụ ký không phụ thuộc cách lưu."""

    @abstractmethod
    def read_bytes(self, vi_tri_luu_tep: str) -> bytes: ...

    @abstractmethod
    def metadata(self, vi_tri_luu_tep: str) -> StoredFileMeta: ...


class FilesystemStorageAdapter(DocumentStorageAdapter):
    """Đọc từ thư mục gốc cấu hình; vị trí lưu là đường dẫn tương đối so với thư mục gốc."""

    def __init__(self, root: str | os.PathLike | None = None):
        root = root or getattr(settings, "SIGNING_DOCUMENT_ROOT", None)
        if not root:
            raise StorageError("Chưa cấu hình SIGNING_DOCUMENT_ROOT.")
        self.root = Path(root).resolve()

    def _resolve(self, vi_tri_luu_tep: str) -> Path:
        if not vi_tri_luu_tep or os.path.isabs(vi_tri_luu_tep):
            raise StorageError("Vị trí lưu tệp phải là đường dẫn tương đối.")
        path = (self.root / vi_tri_luu_tep).resolve()
        if not path.is_relative_to(self.root):
            raise StorageError("Vị trí lưu tệp nằm ngoài thư mục gốc.")
        if not path.is_file():
            raise StorageError("Không tìm thấy tệp tại vị trí lưu.")
        return path

    def read_bytes(self, vi_tri_luu_tep: str) -> bytes:
        return self._resolve(vi_tri_luu_tep).read_bytes()

    def metadata(self, vi_tri_luu_tep: str) -> StoredFileMeta:
        path = self._resolve(vi_tri_luu_tep)
        return StoredFileMeta(vi_tri_luu_tep, path.stat().st_size)
