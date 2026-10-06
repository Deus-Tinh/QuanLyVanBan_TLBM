"""
API ViewSets cho phân hệ Quản lý Cán bộ Nhân viên (CBNV - Issue #24).
Tác giả: Lê Duy Khánh (leduykhanhdevs).
"""
from django.db import transaction
from django.db.models import Q, ProtectedError
from django.contrib.auth.models import Group
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Employee
from .serializers import (
    STATUS_API_TO_DB,
    GroupSimpleSerializer,
    EmployeeSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
)
from .excel_cbnv import generate_cbnv_template, import_cbnv_from_excel


class StandardEmployeePagination(PageNumberPagination):
    """Phân trang chuẩn cho danh sách cán bộ nhân viên."""
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Danh sách Nhóm quyền (auth.Group) hỗ trợ cấu hình phân quyền cho CBNV.
    """
    queryset = Group.objects.all().order_by("name")
    serializer_class = GroupSimpleSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    API Quản lý Cán bộ Nhân viên (CBNV - Issue #24).
    Hỗ trợ tìm kiếm, lọc theo đơn vị/chức vụ/trạng thái, tải file mẫu và import Excel.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardEmployeePagination

    def get_queryset(self):
        queryset = (
            Employee.objects.select_related("don_vi__khoi", "chuc_vu")
            .prefetch_related("groups")
            .all()
        )

        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(ho_ten__icontains=search)
                | Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(sdt__icontains=search)
            )

        don_vi_id = self.request.query_params.get("don_vi_id")
        if don_vi_id:
            queryset = queryset.filter(don_vi_id=don_vi_id)

        khoi_id = self.request.query_params.get("khoi_id")
        if khoi_id:
            queryset = queryset.filter(don_vi__khoi_id=khoi_id)

        chuc_vu_id = self.request.query_params.get("chuc_vu_id")
        if chuc_vu_id:
            queryset = queryset.filter(chuc_vu_id=chuc_vu_id)

        trang_thai = self.request.query_params.get("trang_thai")
        if trang_thai:
            queryset = queryset.filter(trang_thai=STATUS_API_TO_DB.get(trang_thai, trang_thai))

        is_public = self.request.query_params.get("is_public")
        if is_public is not None and is_public != "":
            queryset = queryset.filter(is_public=(is_public.lower() in ["true", "1"]))

        ordering = self.request.query_params.get("ordering")
        if ordering:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by(
                "don_vi__stt_uu_tien", "chuc_vu__display_order", "ho_ten", "id"
            )

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if request.query_params.get("all", "").lower() == "true":
            serializer = EmployeeSerializer(queryset, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = EmployeeSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)

        serializer = EmployeeSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = EmployeeSerializer(instance, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        serializer = EmployeeCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        output_serializer = EmployeeSerializer(employee, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = EmployeeUpdateSerializer(
            instance, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        updated_employee = serializer.save()
        output_serializer = EmployeeSerializer(updated_employee, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            with transaction.atomic():
                instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {
                    "detail": "Không thể xóa cán bộ nhân viên này do đang có dữ liệu liên kết khác trong hệ thống."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"], url_path="template")
    def template(self, request):
        """Tải tệp Excel mẫu để nhập danh sách cán bộ nhân viên."""
        buffer = generate_cbnv_template()
        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="mau_danh_sach_cbnv.xlsx"'
        return response

    @action(detail=False, methods=["post"], url_path="import", parser_classes=[MultiPartParser, FormParser])
    def import_excel(self, request):
        """
        Nhập danh sách cán bộ nhân viên từ tệp Excel (.xlsx).
        Yêu cầu quyền accounts.import_cbnv hoặc superuser/staff.
        """
        if not (request.user.is_superuser or request.user.is_staff or request.user.has_perm("accounts.import_cbnv")):
            return Response(
                {"detail": "Bạn không có quyền nhập danh sách cán bộ nhân viên từ Excel."},
                status=status.HTTP_403_FORBIDDEN,
            )

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "Vui lòng chọn tệp Excel (.xlsx) để tải lên."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not file_obj.name.lower().endswith(".xlsx"):
            return Response(
                {"detail": "Định dạng tệp không được hỗ trợ. Vui lòng sử dụng tệp có đuôi .xlsx."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = import_cbnv_from_excel(file_obj)
        if not result["success"]:
            return Response(
                {
                    "success": False,
                    "message": "Dữ liệu tệp Excel chứa lỗi. Vui lòng kiểm tra lại theo danh sách bên dưới.",
                    "errors": result["errors"],
                    "total_errors": len(result["errors"]),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "message": f"Nhập thành công {result['created_count']} cán bộ nhân viên.",
                "created_count": result["created_count"],
            },
            status=status.HTTP_201_CREATED,
        )
