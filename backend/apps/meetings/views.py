"""
Views cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
"""

from datetime import datetime
from django.db import transaction
from django.db.models import Q, ProtectedError
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from meetings.models import PhongHop, DatPhongHop
from meetings.serializers import PhongHopSerializer, DatPhongHopSerializer


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
            return request.user.has_perm("add_phonghop")
        if request.method in ["PUT", "PATCH"]:
            return request.user.has_perm("change_phonghop")
        if request.method == "DELETE":
            return request.user.has_perm("delete_phonghop")

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


class IsOwnerOrAdminForBooking(permissions.BasePermission):
    """
    Quyền truy cập đặt lịch phòng họp theo RBAC contract Issue #21:
    - Xem danh sách / chi tiết: Bất kỳ user đã xác thực (IsAuthenticated).
    - Tạo mới (POST): Cần quyền 'add_datphonghop' hoặc superuser/staff.
    - Sửa / Hủy / Xóa:
      * Nếu là người đặt: cần quyền 'change_own_datphonghop' hoặc superuser/staff.
      * Nếu là người khác: cần quyền 'change_any_datphonghop' hoặc superuser/staff.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == "POST" and getattr(view, "action", None) != "cancel":
            return request.user.has_perm("add_datphonghop")
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_superuser or request.user.is_staff:
            return True
        is_owner = obj.nguoi_dat_id == request.user.id
        if is_owner:
            return request.user.has_perm("change_own_datphonghop")
        return request.user.has_perm("change_any_datphonghop")


class DatPhongHopViewSet(viewsets.ModelViewSet):
    """
    API ViewSet quản lý Đặt lịch phòng họp:
    - GET /api/meeting-bookings/ : Danh sách lịch đặt (hỗ trợ lọc theo date, room_id, status)
    - POST /api/meeting-bookings/ : Tạo lịch đặt mới (Database Lock chống race condition)
    - GET /api/meeting-bookings/{id}/ : Chi tiết lịch đặt
    - PUT/PATCH /api/meeting-bookings/{id}/ : Cập nhật lịch đặt (Database Lock)
    - DELETE /api/meeting-bookings/{id}/ : Xóa lịch đặt
    - POST /api/meeting-bookings/{id}/cancel/ : Hủy lịch giải phóng khung giờ
    """

    queryset = DatPhongHop.objects.select_related("phong_hop", "nguoi_dat").all()
    serializer_class = DatPhongHopSerializer
    permission_classes = [IsOwnerOrAdminForBooking]
    pagination_class = StandardPagination

    def get_queryset(self):
        # Tự động cập nhật các cuộc họp đã qua giờ kết thúc sang trạng thái 'hoan_thanh'
        now = timezone.now()
        DatPhongHop.objects.filter(
            trang_thai=DatPhongHop.STATUS_DA_DAT,
            thoi_gian_ket_thuc__lte=now,
        ).update(trang_thai=DatPhongHop.STATUS_HOAN_THANH)

        qs = super().get_queryset().order_by("-thoi_gian_bat_dau")

        # Lọc theo phòng họp
        phong_id = self.request.query_params.get("room_id") or self.request.query_params.get("phong_hop")
        if phong_id:
            qs = qs.filter(phong_hop_id=phong_id)

        # Lọc theo trạng thái
        trang_thai = self.request.query_params.get("status") or self.request.query_params.get("trang_thai")
        if trang_thai:
            qs = qs.filter(trang_thai=trang_thai)

        # Lọc theo ngày cụ thể (YYYY-MM-DD)
        date_str = self.request.query_params.get("date")
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                tz = timezone.get_current_timezone()
                start_of_day = timezone.make_aware(
                    datetime.combine(target_date, datetime.min.time()), tz
                )
                end_of_day = timezone.make_aware(
                    datetime.combine(target_date, datetime.max.time()), tz
                )
                qs = qs.filter(
                    thoi_gian_bat_dau__lt=end_of_day,
                    thoi_gian_ket_thuc__gt=start_of_day,
                ).order_by("thoi_gian_bat_dau")
            except ValueError:
                pass

        # Lọc theo khoảng ngày (start_date, end_date)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        tz = timezone.get_current_timezone()
        if start_date:
            try:
                sd = datetime.strptime(start_date, "%Y-%m-%d").date()
                qs = qs.filter(thoi_gian_ket_thuc__gte=timezone.make_aware(datetime.combine(sd, datetime.min.time()), tz))
            except ValueError:
                pass
        if end_date:
            try:
                ed = datetime.strptime(end_date, "%Y-%m-%d").date()
                qs = qs.filter(thoi_gian_bat_dau__lte=timezone.make_aware(datetime.combine(ed, datetime.max.time()), tz))
            except ValueError:
                pass

        return qs

    def create(self, request, *args, **kwargs):
        """
        Tạo lịch đặt phòng với Database Lock (select_for_update) chống race condition.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phong_hop = serializer.validated_data["phong_hop"]
        start = serializer.validated_data["thoi_gian_bat_dau"]
        end = serializer.validated_data["thoi_gian_ket_thuc"]

        with transaction.atomic():
            # Khóa bản ghi phòng họp để các request đồng thời phải tuần tự kiểm tra
            locked_room = PhongHop.objects.select_for_update().get(id=phong_hop.id)

            conflicts = DatPhongHop.objects.filter(
                phong_hop=locked_room,
                thoi_gian_bat_dau__lt=end,
                thoi_gian_ket_thuc__gt=start,
            ).exclude(trang_thai=DatPhongHop.STATUS_DA_HUY)

            if conflicts.exists():
                conflict = conflicts.first()
                host = getattr(conflict.nguoi_dat, "ho_ten", None) or conflict.nguoi_dat.get_full_name() or conflict.nguoi_dat.username
                tz = timezone.get_current_timezone()
                c_start = timezone.localtime(conflict.thoi_gian_bat_dau, tz).strftime("%H:%M")
                c_end = timezone.localtime(conflict.thoi_gian_ket_thuc, tz).strftime("%H:%M ngày %d/%m/%Y")
                return Response(
                    {
                        "error": f"Phòng '{locked_room.ten_phong}' vừa được đặt trùng khung giờ: '{conflict.tieu_de}' ({c_start} - {c_end}) bởi {host}. Vui lòng chọn khung giờ khác!"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(nguoi_dat=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Cập nhật lịch đặt phòng với Database Lock và chống race condition.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        phong_hop = serializer.validated_data.get("phong_hop", instance.phong_hop)
        start = serializer.validated_data.get("thoi_gian_bat_dau", instance.thoi_gian_bat_dau)
        end = serializer.validated_data.get("thoi_gian_ket_thuc", instance.thoi_gian_ket_thuc)
        new_status = serializer.validated_data.get("trang_thai", instance.trang_thai)

        with transaction.atomic():
            locked_room = PhongHop.objects.select_for_update().get(id=phong_hop.id)

            if new_status != DatPhongHop.STATUS_DA_HUY:
                conflicts = DatPhongHop.objects.filter(
                    phong_hop=locked_room,
                    thoi_gian_bat_dau__lt=end,
                    thoi_gian_ket_thuc__gt=start,
                ).exclude(trang_thai=DatPhongHop.STATUS_DA_HUY).exclude(pk=instance.pk)

                if conflicts.exists():
                    conflict = conflicts.first()
                    host = getattr(conflict.nguoi_dat, "ho_ten", None) or conflict.nguoi_dat.get_full_name() or conflict.nguoi_dat.username
                    tz = timezone.get_current_timezone()
                    c_start = timezone.localtime(conflict.thoi_gian_bat_dau, tz).strftime("%H:%M")
                    c_end = timezone.localtime(conflict.thoi_gian_ket_thuc, tz).strftime("%H:%M ngày %d/%m/%Y")
                    return Response(
                        {
                            "error": f"Không thể đổi sang khung giờ này vì bị trùng với cuộc họp '{conflict.tieu_de}' ({c_start} - {c_end}) bởi {host}!"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            self.perform_update(serializer)

        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """
        Hủy lịch đặt phòng họp: giải phóng khung giờ nhưng vẫn giữ lại bản ghi lịch sử.
        """
        booking = self.get_object()
        if booking.trang_thai == DatPhongHop.STATUS_DA_HUY:
            return Response(
                {"detail": "Lịch đặt phòng này đã được hủy trước đó."},
                status=status.HTTP_200_OK,
            )

        booking.trang_thai = DatPhongHop.STATUS_DA_HUY
        reason = request.data.get("ly_do_huy", "").strip()
        if reason:
            booking.ghi_chu = (booking.ghi_chu + f"\n[Lý do hủy]: {reason}").strip()
        booking.save()

        serializer = self.get_serializer(booking)
        return Response(
            {
                "detail": "Đã hủy lịch đặt phòng thành công. Khung giờ đã được giải phóng.",
                "booking": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

