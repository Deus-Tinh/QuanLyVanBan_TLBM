"""
WSGI config for QuanLyVanBan_TLBM project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'QuanLyVanBan_TLBM.settings')

application = get_wsgi_application()
