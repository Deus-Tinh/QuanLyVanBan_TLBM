"""
URL Configuration cho app meetings (Issue #22 - Nhóm 7).
"""

from rest_framework.routers import DefaultRouter
from meetings.views import PhongHopViewSet

app_name = "meetings"

router = DefaultRouter()
router.register(r"meeting-rooms", PhongHopViewSet, basename="meeting-room")

urlpatterns = router.urls
