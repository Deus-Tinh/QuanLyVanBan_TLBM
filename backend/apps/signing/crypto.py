import base64
import binascii
import hashlib
import re

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

SHA256_HEX_RE = re.compile(r"^[0-9a-f]{64}$")
ALGORITHM = "Ed25519"


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def is_sha256_hex(value: str) -> bool:
    return bool(SHA256_HEX_RE.match(value or ""))


def _load_public_key(public_key_b64: str) -> Ed25519PublicKey:
    """Khóa công khai Ed25519 dạng 32 byte thô, mã hóa Base64."""
    raw = base64.b64decode(public_key_b64, validate=True)
    return Ed25519PublicKey.from_public_bytes(raw)


def key_fingerprint(public_key_b64: str) -> str:
    """Dấu vân tay khóa = SHA-256 (hex) của 32 byte khóa công khai thô."""
    raw = base64.b64decode(public_key_b64, validate=True)
    return sha256_hex(raw)


def is_valid_public_key(public_key_b64: str) -> bool:
    try:
        _load_public_key(public_key_b64)
    except (ValueError, binascii.Error):
        return False
    return True


def verify_signature(public_key_b64: str, message: bytes, signature_b64: str) -> bool:
    """True khi chữ ký Base64 hợp lệ với message; mọi đầu vào sai định dạng trả False."""
    try:
        key = _load_public_key(public_key_b64)
        signature = base64.b64decode(signature_b64, validate=True)
        key.verify(signature, message)
    except (InvalidSignature, ValueError, binascii.Error):
        return False
    return True
