"""URL configuration for QLVB&TL project."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # API endpoints
    path("api/", include("documents.urls")),
]

# Serve media files trong development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
