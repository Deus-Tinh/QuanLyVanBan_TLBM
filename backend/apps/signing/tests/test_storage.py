import tempfile
from pathlib import Path

from django.test import SimpleTestCase, override_settings

from signing.storage import FilesystemStorageAdapter, StorageError


class FilesystemStorageTests(SimpleTestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.root = Path(self._tmp.name) / "docs"
        (self.root / "2026").mkdir(parents=True)
        (self.root / "2026" / "a.pdf").write_bytes(b"%PDF-1.4 noi dung")
        (Path(self._tmp.name) / "secret.txt").write_bytes(b"ngoai thu muc goc")
        self.adapter = FilesystemStorageAdapter(self.root)

    def test_read_and_metadata(self):
        self.assertEqual(self.adapter.read_bytes("2026/a.pdf"), b"%PDF-1.4 noi dung")
        self.assertEqual(self.adapter.metadata("2026/a.pdf").kich_thuoc, len(b"%PDF-1.4 noi dung"))

    def test_rejects_path_traversal(self):
        with self.assertRaises(StorageError):
            self.adapter.read_bytes("../secret.txt")

    def test_rejects_absolute_and_empty(self):
        with self.assertRaises(StorageError):
            self.adapter.read_bytes(str(Path(self._tmp.name) / "secret.txt"))
        with self.assertRaises(StorageError):
            self.adapter.read_bytes("")

    def test_missing_file_and_directory(self):
        with self.assertRaises(StorageError):
            self.adapter.read_bytes("2026/khong-co.pdf")
        with self.assertRaises(StorageError):
            self.adapter.read_bytes("2026")

    @override_settings(SIGNING_DOCUMENT_ROOT="")
    def test_requires_root_configuration(self):
        with self.assertRaises(StorageError):
            FilesystemStorageAdapter()
