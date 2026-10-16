"""
Custom SMTP EmailBackend tương thích với máy chủ thư nội bộ Bảo Long (mail.baohiembaolong.vn).
Hỗ trợ chứng chỉ và thuật toán mã hóa kế thừa (legacy TLS ciphers) của máy chủ thư công ty.
"""

import ssl
from django.core.mail.backends.smtp import EmailBackend
from django.utils.functional import cached_property


class BaoLongSmtpEmailBackend(EmailBackend):
    """
    Subclass của django.core.mail.backends.smtp.EmailBackend cho phép kết nối thành công
    với mail.baohiembaolong.vn qua TLS/STARTTLS mà không bị chặn bởi các quy định cipher ngặt nghèo
    của OpenSSL trên Python 3.10+.
    """

    @cached_property
    def ssl_context(self):
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ctx.minimum_version = ssl.TLSVersion.MINIMUM_SUPPORTED
        ctx.set_ciphers("ALL:@SECLEVEL=0")
        return ctx
