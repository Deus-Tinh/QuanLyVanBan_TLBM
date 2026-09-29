"""URL routing cho Module Văn Bản — Hỗ trợ cả 3 phân hệ và unified endpoint."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DocumentViewSet,
    VanBanDenViewSet,
    VanBanDiViewSet,
    VanBanMatViewSet,
)

router = DefaultRouter()
router.register(r"documents/den", VanBanDenViewSet, basename="vanbanden")
router.register(r"documents/di", VanBanDiViewSet, basename="vanbandi")
router.register(r"documents/mat", VanBanMatViewSet, basename="vanbanmat")
router.register(r"documents", DocumentViewSet, basename="document")

urlpatterns = [
    path("", include(router.urls)),
]
