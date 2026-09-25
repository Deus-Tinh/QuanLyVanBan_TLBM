from django.urls import path

from backend.api import views


urlpatterns = [
    path("", views.root),
    path("health/ai", views.ai_health),
    path("chat", views.chat),
    path("upload", views.upload_sync),
    path("upload/async", views.upload_async),
    path("upload/progress/<str:job_id>", views.upload_progress),
    path("documents", views.documents),
    path("documents/<path:filename>/preview", views.preview_document),
    path("documents/<path:filename>/file", views.document_file),
    path("documents/<path:filename>", views.document_detail),
    path("categories", views.categories),
    path("reclassify/<path:filename>", views.reclassify),
    path("settings/ai", views.ai_settings),
]
