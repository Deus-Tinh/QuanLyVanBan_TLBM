from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .document_queries import DocumentDataUnavailable, query_dossier_documents
from .models import HoSo, LoaiVanBan
from .pagination import RecordsPagination
from .serializers import (
    DossierDocumentFilterSerializer,
    DossierDocumentSerializer,
    HoSoSerializer,
    LoaiVanBanSerializer,
)


def filter_by_year(queryset, year_value):
    if not year_value:
        return queryset

    try:
        year = int(year_value)
    except (TypeError, ValueError) as error:
        raise ValidationError(
            {"year": "Năm phải là một số nguyên hợp lệ."}
        ) from error

    if year < 1 or year > 9999:
        raise ValidationError(
            {"year": "Năm phải nằm trong khoảng từ 1 đến 9999."}
        )

    return queryset.filter(ngay_lap__year=year)


class HoSoListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = HoSoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = RecordsPagination

    def get_queryset(self):
        queryset = HoSo.objects.select_related("nguoi_lap").all()

        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(so_ky_hieu__icontains=search)
                | Q(ten_ho_so__icontains=search)
                | Q(ghi_chu__icontains=search)
            )

        return filter_by_year(
            queryset,
            self.request.query_params.get("year"),
        )

    def perform_create(self, serializer):
        serializer.save(nguoi_lap=self.request.user)


class HoSoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HoSo.objects.select_related("nguoi_lap").all()
    serializer_class = HoSoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.is_he_thong:
            return Response(
                {
                    "detail": (
                        "Không thể xóa Hồ sơ chung hoặc hồ sơ hệ thống."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Không thể xóa hồ sơ vì vẫn còn loại văn bản "
                        "đang thuộc hồ sơ này."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class LoaiVanBanListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = LoaiVanBanSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = RecordsPagination

    def get_dossier(self):
        if not hasattr(self, "_dossier"):
            self._dossier = get_object_or_404(
                HoSo,
                pk=self.kwargs["dossier_id"],
            )
        return self._dossier

    def get_queryset(self):
        queryset = (
            LoaiVanBan.objects
            .select_related("ho_so")
            .filter(ho_so=self.get_dossier())
        )

        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(ten_loai__icontains=search)
                | Q(ghi_chu__icontains=search)
            )

        return filter_by_year(
            queryset,
            self.request.query_params.get("year"),
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["dossier"] = self.get_dossier()
        return context

    def perform_create(self, serializer):
        serializer.save(ho_so=self.get_dossier())


class LoaiVanBanDetailAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = LoaiVanBan.objects.select_related("ho_so").all()
    serializer_class = LoaiVanBanSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]


def _page_url(request, page):
    query = request.query_params.copy()
    if page == 1:
        query.pop("page", None)
    else:
        query["page"] = page
    query_string = query.urlencode()
    path = request.path
    return request.build_absolute_uri(f"{path}?{query_string}" if query_string else path)


class DossierDocumentListAPIView(APIView):
    """Read-only Level-3 list aggregated from Group 2 DDL tables."""

    permission_classes = [IsAuthenticated]

    def get(self, request, dossier_id):
        get_object_or_404(HoSo, pk=dossier_id)
        filters = DossierDocumentFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        values = filters.validated_data

        try:
            count, documents = query_dossier_documents(
                dossier_id=dossier_id,
                user=request.user,
                search=values["search"],
                year=values.get("year"),
                document_type=values["type"],
                page=values["page"],
                page_size=values["page_size"],
            )
        except DocumentDataUnavailable:
            return Response(
                {
                    "detail": (
                        "Dữ liệu văn bản dùng chung chưa sẵn sàng. "
                        "Cần đồng bộ schema DDL của Nhóm 2 trước khi sử dụng."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        page = values["page"]
        page_size = values["page_size"]
        return Response(
            {
                "count": count,
                "next": _page_url(request, page + 1) if page * page_size < count else None,
                "previous": _page_url(request, page - 1) if page > 1 else None,
                "results": DossierDocumentSerializer(documents, many=True).data,
            }
        )
