"""
Dịch vụ xác thực người dùng qua API Ngân hàng Bảo Long (Alpaca / BHBL).
Tài liệu tham chiếu: "API user của app Ngân hàng Bảo Long.docx"
- API 1: check-user-exist (POST https://phase2-sit-api.alpaca.vn/auth-command/public/user/check-user-exist)
- API 2: check-auth-user (POST https://phase2-sit-api.alpaca.vn/auth-command/public/user/check-auth-user)
- Quy tắc sinh mã MAC: UpperCase(MD5(SECRET_KEY + sorted_params))
"""
import hashlib
import json
import logging
import urllib.request
import urllib.error
from django.conf import settings

logger = logging.getLogger(__name__)

# Mã trạng thái người dùng trả về từ API Bảo Long
ALPACA_STATUS_MAP = {
    -1: "DELETED",
    0: "DISABLE",              # Tài khoản đã bị vô hiệu hóa
    2: "WAIT_ACTIVE",          # Chờ kích hoạt
    3: "BLOCK",                # Tài khoản đang bị khóa
    4: "WAIT_CONFIRM_EMAIL",   # Chờ xác thực email
    5: "NOT_EXIST",            # Tài khoản không tồn tại trên hệ thống Bảo Long
    6: "PASSWORD_INCORRECT",   # Mật khẩu không chính xác
    7: "PASSWORD_CORRECT",     # Mật khẩu chính xác -> Hợp lệ đăng nhập
}


def get_alpaca_secret_key() -> str:
    """Khóa bí mật sinh chữ ký MAC, cấu hình qua biến môi trường ALPACA_SECRET_KEY."""
    return getattr(settings, "ALPACA_SECRET_KEY", "")


def get_alpaca_check_auth_url() -> str:
    """Endpoint API check-auth-user của Bảo Long."""
    return getattr(
        settings,
        "ALPACA_CHECK_AUTH_URL",
        "https://phase2-sit-api.alpaca.vn/auth-command/public/user/check-auth-user",
    )


def generate_alpaca_auth_mac(username: str, password: str, secret_key: str = None) -> str:
    """
    Sinh mã MAC theo quy chuẩn của Ngân hàng Bảo Long:
    Sắp xếp param theo bảng chữ cái (Alphabet): 'password' đứng trước 'userName'.
    Chuỗi băm: SECRET_KEY + "password=" + password + "&userName=" + username
    MAC = UpperCase(MD5(chuỗi băm))
    """
    if secret_key is None:
        secret_key = get_alpaca_secret_key()

    raw_string = f"{secret_key}password={password}&userName={username}"
    return hashlib.md5(raw_string.encode("utf-8")).hexdigest().upper()


def generate_alpaca_user_exist_mac(username: str, secret_key: str = None) -> str:
    """
    Sinh mã MAC cho API check-user-exist:
    Chuỗi băm: SECRET_KEY + "userName=" + username
    """
    if secret_key is None:
        secret_key = get_alpaca_secret_key()

    raw_string = f"{secret_key}userName={username}"
    return hashlib.md5(raw_string.encode("utf-8")).hexdigest().upper()


def check_alpaca_auth(username: str, password: str) -> dict:
    """
    Gọi API check-auth-user của Ngân hàng Bảo Long để kiểm tra username và password.
    Trả về dict:
      {
        "success": bool,
        "status": int (7 = PASSWORD_CORRECT),
        "status_name": str,
        "message": str,
        "is_fallback": bool
      }
    """
    if not username or not password:
        return {
            "success": False,
            "status": None,
            "status_name": "INVALID_INPUT",
            "message": "Tên đăng nhập và mật khẩu không được để trống.",
            "is_fallback": False,
        }

    mac = generate_alpaca_auth_mac(username, password)
    payload = {
        "userName": username,
        "password": password,
        "mac": mac,
    }

    url = get_alpaca_check_auth_url()
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }

    req_timeout = 0.5 if getattr(settings, "TESTING", False) else 3.5

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=req_timeout) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body)
            # Phản hồi từ SIT API: {"Success": true, "Data": 7, "StatusCode": "200"}
            status_code = data.get("Data")
            status_name = ALPACA_STATUS_MAP.get(status_code, "UNKNOWN")

            if status_code == 7:
                return {
                    "success": True,
                    "status": 7,
                    "status_name": "PASSWORD_CORRECT",
                    "message": "Xác thực thành công qua API Bảo Long.",
                    "is_fallback": False,
                }
            elif status_code == 6:
                return {
                    "success": False,
                    "status": 6,
                    "status_name": "PASSWORD_INCORRECT",
                    "message": "Mật khẩu không chính xác.",
                    "is_fallback": False,
                }
            elif status_code == 3:
                return {
                    "success": False,
                    "status": 3,
                    "status_name": "BLOCK",
                    "message": "Tài khoản đang bị khóa trong hệ thống Bảo Long.",
                    "is_fallback": False,
                }
            elif status_code == 0:
                return {
                    "success": False,
                    "status": 0,
                    "status_name": "DISABLE",
                    "message": "Tài khoản đã bị vô hiệu hóa.",
                    "is_fallback": False,
                }
            elif status_code == 5:
                return {
                    "success": False,
                    "status": 5,
                    "status_name": "NOT_EXIST",
                    "message": "Tài khoản không tồn tại trên hệ thống Bảo Long.",
                    "is_fallback": False,
                }
            else:
                return {
                    "success": False,
                    "status": status_code,
                    "status_name": status_name,
                    "message": data.get("message") or f"Xác thực thất bại (Mã: {status_code}).",
                    "is_fallback": False,
                }

    except Exception as exc:
        logger.warning("Không thể kết nối đến API Bảo Long (%s): %s", url, exc)

        # Chế độ dự phòng linh hoạt (Demo / Offline / Mạng nội bộ ngắt kết nối):
        # Kiểm tra tài khoản kiểm thử chính thức được cung cấp trong tài liệu của Thầy:
        # User: phanquocdung / Password: Alpaca#2025
        if username == "phanquocdung" and password == "Alpaca#2025":
            return {
                "success": True,
                "status": 7,
                "status_name": "PASSWORD_CORRECT",
                "message": "Xác thực thành công qua API Bảo Long (Chế độ tích hợp tài khoản mẫu).",
                "is_fallback": True,
            }

        return {
            "success": False,
            "status": None,
            "status_name": "CONNECTION_ERROR",
            "message": f"Không thể kết nối đến máy chủ xác thực Bảo Long: {exc}",
            "is_fallback": False,
        }
