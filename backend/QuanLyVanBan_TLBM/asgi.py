"""
ASGI config for QuanLyVanBan_TLBM project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'QuanLyVanBan_TLBM.settings')

application = get_asgi_application()
