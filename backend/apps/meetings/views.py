"""
Views cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
"""

from django.db.models import Q, ProtectedError
from rest_framework import status, viewsets, permissions
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from meetings.models import PhongHop
from meetings.serializers import PhongHopSerializer


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class MeetingRoomPermission(permissions.BasePermission):
    """
    Quyền truy cập danh mục phòng họp theo chuẩn Django RBAC:
    - Xem (GET, HEAD, OPTIONS): User đã đăng nhập (IsAuthenticated)
    - Thêm (POST): Cần quyền 'meetings.add_phonghop' hoặc superuser/staff
    - Sửa (PUT, PATCH): Cần quyền 'meetings.change_phonghop' hoặc superuser/staff
    - Xóa (DELETE): Cần quyền 'meetings.delete_phonghop' hoặc superuser/staff
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        if request.user.is_superuser or request.user.is_staff:
            return True

        if request.method == "POST":
            return request.user.has_perm("meetings.add_phonghop")
        if request.method in ["PUT", "PATCH"]:
            return request.user.has_perm("meetings.change_phonghop")
        if request.method == "DELETE":
            return request.user.has_perm("meetings.delete_phonghop")

        return False


class PhongHopViewSet(viewsets.ModelViewSet):
    """
    API ViewSet quản lý CRUD Danh mục phòng họp:
    - GET /api/meeting-rooms/ : Xem danh sách (phân trang, tìm kiếm, lọc)
    - POST /api/meeting-rooms/ : Tạo phòng họp mới
    - GET /api/meeting-rooms/{id}/ : Chi tiết phòng họp
    - PUT/PATCH /api/meeting-rooms/{id}/ : Cập nhật phòng họp
    - DELETE /api/meeting-rooms/{id}/ : Xóa phòng họp (an toàn, bảo vệ dữ liệu liên kết)
    """

    queryset = PhongHop.objects.all()
    serializer_class = PhongHopSerializer
    pagination_class = StandardPagination
    permission_classes = [MeetingRoomPermission]

    def get_queryset(self):
        queryset = PhongHop.objects.all()

        # Lọc theo trạng thái is_public nếu có query param
        is_public_param = self.request.query_params.get("is_public")
        if is_public_param is not None and is_public_param != "":
            val = str(is_public_param).strip().lower()
            if val in ["true", "1"]:
                queryset = queryset.filter(is_public=True)
            elif val in ["false", "0"]:
                queryset = queryset.filter(is_public=False)

        # Tìm kiếm theo từ khóa (ten_phong, vi_tri, thiet_bi, ghi_chu)
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(ten_phong__icontains=search)
                | Q(vi_tri__icontains=search)
                | Q(thiet_bi__icontains=search)
                | Q(ghi_chu__icontains=search)
            )

        # Sắp xếp
        ordering = self.request.query_params.get("ordering", "ten_phong")
        valid_orderings = [
            "ten_phong",
            "-ten_phong",
            "suc_chua",
            "-suc_chua",
            "created_at",
            "-created_at",
        ]
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by("ten_phong")

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        # Hỗ trợ all=true để lấy toàn bộ danh sách không phân trang (dành cho dropdown/select)
        if request.query_params.get("all", "").lower() == "true":
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """
        Xóa phòng họp an toàn. Chặn xóa dây chuyền nếu có dữ liệu liên kết.
        """
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {
                    "error": (
                        "Không thể xóa phòng họp này vì đã có dữ liệu lịch đặt liên kết. "
                        "Vui lòng chuyển trạng thái phòng sang ẩn (is_public=False) thay vì xóa."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
