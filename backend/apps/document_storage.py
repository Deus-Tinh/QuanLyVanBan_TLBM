"""Lưu tệp nghiệp vụ theo cây `<module>/YYYY/MM/DD/<uuid>.<ext>` dưới DOCUMENT_STORAGE_ROOT.

`DocumentStorage` là `FileSystemStorage` đọc DOCUMENT_STORAGE_ROOT ở mỗi lần truy cập, nên
đường dẫn không bị đóng cứng vào migration và `override_settings` trong test có hiệu lực.
`build_dated_path` sinh đường dẫn tương đối (POSIX) dùng làm giá trị cột `path` qua `upload_to`;
thư mục ngày chỉ được tạo khi có tệp đầu tiên của ngày đó.
"""

import uuid
from pathlib import PurePosixPath

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import FileSystemStorage
from django.utils import timezone

# Module lưu theo ngày upload.
DATED_MODULES = frozenset({"van-ban-den", "van-ban-di", "cong-viec", "ho-so", "mau-van-ban"})
# Tệp gắn với đối tượng, không chia theo ngày: `<module>/<owner>/<filename>`.
OWNED_MODULES = frozenset({"nguoi-dung", "he-thong"})
TMP_DIR = "tmp"

ALLOWED_EXTENSIONS = frozenset({".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"})


class DocumentStorageError(Exception):
    """Module hoặc tệp upload không hợp lệ."""


class DocumentStorage(FileSystemStorage):
    """Gốc lưu là DOCUMENT_STORAGE_ROOT; URL theo MEDIA_URL, gốc phục vụ do server web quyết định."""

    @property
    def base_location(self):
        root = getattr(settings, "DOCUMENT_STORAGE_ROOT", "")
        if not root:
            raise ImproperlyConfigured("Chưa cấu hình DOCUMENT_STORAGE_ROOT.")
        return root

    @property
    def location(self):
        return str(self.base_location)

    @property
    def base_url(self):
        return settings.MEDIA_URL


_storage = DocumentStorage()


def get_document_storage():
    """Callable cho `FileField(storage=...)`: migration ghi tên hàm, không ghi đường dẫn."""
    return _storage


def has_allowed_extension(original_name: str, allowed=ALLOWED_EXTENSIONS) -> bool:
    return _suffix(original_name) in allowed


def _suffix(original_name: str) -> str:
    return PurePosixPath(str(original_name).replace("\\", "/")).suffix.lower()


def build_dated_path(module: str, original_name: str, now=None, allowed=ALLOWED_EXTENSIONS) -> str:
    """Đường dẫn tương đối `<module>/YYYY/MM/DD/<uuid>.<ext>`, ngày theo múi giờ cấu hình.

    Việc kiểm tra định dạng của người dùng phải xảy ra trước khi lưu (trả lỗi 400); lỗi ở đây
    là lỗi lập trình hoặc dữ liệu bỏ qua bước kiểm tra.
    """
    if module not in DATED_MODULES:
        raise DocumentStorageError("Module lưu tệp không hợp lệ.")
    ext = _suffix(original_name)
    if ext not in allowed:
        raise DocumentStorageError("Định dạng tệp không được phép.")
    day = timezone.localtime(now or timezone.now())
    return f"{module}/{day:%Y/%m/%d}/{uuid.uuid4().hex}{ext}"
