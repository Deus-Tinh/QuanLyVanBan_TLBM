from django.urls import path
from . import views

app_name = "signing"

urlpatterns = [
    # Kiểm tra app đã được nối vào hệ thống (khung Pha 0)
    path("ping/", views.ping_view, name="ping"),
]
