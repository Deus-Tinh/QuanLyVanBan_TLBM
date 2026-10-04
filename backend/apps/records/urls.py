from django.urls import path

from .views import (
    DossierDocumentListAPIView,
    HoSoDetailAPIView,
    HoSoListCreateAPIView,
    LoaiVanBanDetailAPIView,
    LoaiVanBanListCreateAPIView,
)


app_name = "records"

urlpatterns = [
    path(
        "dossiers/",
        HoSoListCreateAPIView.as_view(),
        name="dossier-list-create",
    ),
    path(
        "dossiers/<int:pk>/",
        HoSoDetailAPIView.as_view(),
        name="dossier-detail",
    ),
    path(
        "dossiers/<int:dossier_id>/document-types/",
        LoaiVanBanListCreateAPIView.as_view(),
        name="document-type-list-create",
    ),
    path(
        "dossiers/<int:dossier_id>/documents/",
        DossierDocumentListAPIView.as_view(),
        name="dossier-document-list",
    ),
    path(
        "document-types/<int:pk>/",
        LoaiVanBanDetailAPIView.as_view(),
        name="document-type-detail",
    ),
]
