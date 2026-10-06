"""
Views cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
Chuẩn hóa 100% theo DDL cơ sở dữ liệu release_DDL.sql (SQL_Fix4, Issue #53).
"""

from datetime import datetime
from django.db import transaction, IntegrityError
from django.db.models import Q, ProtectedError, RestrictedError
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from meetings.models import MeetingRoom, MeetingBooking
from meetings.serializers import MeetingRoomSerializer, MeetingBookingSerializer


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class MeetingRoomPermission(permissions.BasePermission):
    """
    Quyền truy cập danh mục phòng họp theo chuẩn Django RBAC contract:
    - Xem (GET, HEAD, OPTIONS): User đã đăng nhập (IsAuthenticated)
    - Thêm (POST): Cần quyền 'add_phonghop' hoặc superuser/staff
    - Sửa (PUT, PATCH): Cần quyền 'change_phonghop' hoặc superuser/staff
    - Xóa (DELETE): Cần quyền 'delete_phonghop' hoặc superuser/staff
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


class MeetingRoomViewSet(viewsets.ModelViewSet):
    """
    API ViewSet quản lý CRUD Danh mục phòng họp:
    - GET /api/meeting-rooms/ : Xem danh sách (phân trang, tìm kiếm, lọc)
    - POST /api/meeting-rooms/ : Tạo phòng họp mới
    - GET /api/meeting-rooms/{id}/ : Chi tiết phòng họp
    - PUT/PATCH /api/meeting-rooms/{id}/ : Cập nhật phòng họp
    - DELETE /api/meeting-rooms/{id}/ : Xóa phòng họp (an toàn, bảo vệ dữ liệu liên kết)
    """

    queryset = MeetingRoom.objects.all()
    serializer_class = MeetingRoomSerializer
    pagination_class = StandardPagination
    permission_classes = [MeetingRoomPermission]

    def get_queryset(self):
        queryset = MeetingRoom.objects.all()

        # Lọc theo trạng thái is_public
        is_public_param = self.request.query_params.get("is_public")
        if is_public_param is not None and is_public_param != "":
            val = str(is_public_param).strip().lower()
            if val in ["true", "1"]:
                queryset = queryset.filter(is_public=True)
            elif val in ["false", "0"]:
                queryset = queryset.filter(is_public=False)

        # Lọc theo trạng thái status
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param.upper())

        # Tìm kiếm theo từ khóa (name, location, amenities, ghi_chu)
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(location__icontains=search)
                | Q(amenities__icontains=search)
                | Q(ghi_chu__icontains=search)
            )

        # Sắp xếp
        ordering = self.request.query_params.get("ordering", "name")
        valid_orderings = [
            "name",
            "-name",
            "capacity",
            "-capacity",
            "created_at",
            "-created_at",
            "ten_phong",
            "-ten_phong",
            "suc_chua",
            "-suc_chua",
        ]
        if ordering in valid_orderings:
            mapped_ordering = ordering.replace("ten_phong", "name").replace("suc_chua", "capacity")
            queryset = queryset.order_by(mapped_ordering)
        else:
            queryset = queryset.order_by("name")

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        # Hỗ trợ all=true để lấy toàn bộ danh sách không phân trang (cho dropdown)
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
        Xóa phòng họp an toàn. Chặn xóa nếu có dữ liệu liên kết.
        """
        try:
            return super().destroy(request, *args, **kwargs)
        except (ProtectedError, RestrictedError):
            return Response(
                {
                    "error": (
                        "Không thể xóa phòng họp này vì đã có dữ liệu lịch đặt liên kết. "
                        "Vui lòng chuyển trạng thái phòng sang Không khả dụng (UNAVAILABLE) hoặc ẩn (is_public=False) thay vì xóa."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class IsOwnerOrAdminForBooking(permissions.BasePermission):
    """
    Quyền truy cập đặt lịch phòng họp theo chuẩn RBAC Issue #21 & DDL:
    - Xem danh sách / chi tiết: User đã đăng nhập (có view_schedule_phonghop).
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
        is_owner = obj.organizer_id == request.user.id
        if is_owner:
            return request.user.has_perm("change_own_datphonghop")
        return request.user.has_perm("change_any_datphonghop")


class MeetingBookingViewSet(viewsets.ModelViewSet):
    """
    API ViewSet quản lý Đặt lịch phòng họp:
    - GET /api/meeting-bookings/ : Danh sách lịch đặt (hỗ trợ lọc theo date, room_id, status)
    - POST /api/meeting-bookings/ : Tạo lịch đặt mới (Database Lock chống race condition)
    - GET /api/meeting-bookings/{id}/ : Chi tiết lịch đặt
    - PUT/PATCH /api/meeting-bookings/{id}/ : Cập nhật lịch đặt
    - DELETE /api/meeting-bookings/{id}/ : Xóa lịch đặt
    - POST /api/meeting-bookings/{id}/cancel/ : Hủy lịch giải phóng khung giờ
    """

    queryset = MeetingBooking.objects.select_related("room", "organizer", "department").all()
    serializer_class = MeetingBookingSerializer
    permission_classes = [IsOwnerOrAdminForBooking]
    pagination_class = StandardPagination

    def get_queryset(self):
        # Tự động cập nhật các cuộc họp đã qua giờ kết thúc sang trạng thái 'COMPLETED'
        now = timezone.localtime()
        MeetingBooking.objects.filter(
            status=MeetingBooking.Status.CONFIRMED,
            date__lt=now.date(),
        ).update(status=MeetingBooking.Status.COMPLETED)
        MeetingBooking.objects.filter(
            status=MeetingBooking.Status.CONFIRMED,
            date=now.date(),
            end_time__lte=now.time(),
        ).update(status=MeetingBooking.Status.COMPLETED)

        qs = super().get_queryset().order_by("-date", "-start_time")

        # Lọc theo phòng họp
        room_id = self.request.query_params.get("room_id") or self.request.query_params.get("phong_hop") or self.request.query_params.get("room")
        if room_id:
            qs = qs.filter(room_id=room_id)

        # Lọc theo trạng thái
        status_param = self.request.query_params.get("status") or self.request.query_params.get("trang_thai")
        if status_param:
            mapping = {
                "da_dat": MeetingBooking.Status.CONFIRMED,
                "da_huy": MeetingBooking.Status.CANCELLED,
                "hoan_thanh": MeetingBooking.Status.COMPLETED,
            }
            mapped_status = mapping.get(status_param, status_param.upper())
            qs = qs.filter(status=mapped_status)

        # Lọc theo ngày cụ thể (YYYY-MM-DD)
        date_str = self.request.query_params.get("date")
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                qs = qs.filter(date=target_date).order_by("start_time")
            except ValueError:
                pass

        # Lọc theo khoảng ngày (start_date, end_date)
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            try:
                sd = datetime.strptime(start_date, "%Y-%m-%d").date()
                qs = qs.filter(date__gte=sd)
            except ValueError:
                pass
        if end_date:
            try:
                ed = datetime.strptime(end_date, "%Y-%m-%d").date()
                qs = qs.filter(date__lte=ed)
            except ValueError:
                pass

        return qs

    def create(self, request, *args, **kwargs):
        """
        Tạo lịch đặt phòng với Database Lock và chống race condition.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        room = serializer.validated_data["room"]
        booking_date = serializer.validated_data["date"]
        start = serializer.validated_data["start_time"]
        end = serializer.validated_data["end_time"]

        try:
            with transaction.atomic():
                # Khóa bản ghi phòng họp để các request đồng thời phải tuần tự kiểm tra
                locked_room = MeetingRoom.objects.select_for_update().get(id=room.id)

                if locked_room.status in [MeetingRoom.Status.MAINTENANCE, MeetingRoom.Status.UNAVAILABLE]:
                    return Response(
                        {
                            "error": f"Phòng họp '{locked_room.name}' đang ở trạng thái {locked_room.get_status_display()}, không thể đặt lịch."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                conflicts = MeetingBooking.objects.filter(
                    room=locked_room,
                    date=booking_date,
                    start_time__lt=end,
                    end_time__gt=start,
                ).exclude(status=MeetingBooking.Status.CANCELLED)

                if conflicts.exists():
                    conflict = conflicts.first()
                    organizer = conflict.organizer
                    host = getattr(organizer, "ho_ten", None) or organizer.get_full_name() or organizer.username
                    c_start = conflict.start_time.strftime("%H:%M")
                    c_end = conflict.end_time.strftime("%H:%M")
                    c_date = conflict.date.strftime("%d/%m/%Y")
                    return Response(
                        {
                            "error": f"Phòng '{locked_room.name}' vừa được đặt trùng khung giờ: '{conflict.title}' ({c_start} - {c_end} ngày {c_date}) bởi {host}. Vui lòng chọn khung giờ khác!"
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                self.perform_create(serializer)

        except IntegrityError:
            # Bắt lỗi ràng buộc chống trùng cấp CSDL (PostgreSQL GiST excl_room_time)
            return Response(
                {
                    "error": "Khung giờ này vừa có người khác đặt trước. Vui lòng chọn khung giờ khác!"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Cập nhật lịch đặt phòng với Database Lock và chống race condition.
        """
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        room = serializer.validated_data.get("room", instance.room)
        booking_date = serializer.validated_data.get("date", instance.date)
        start = serializer.validated_data.get("start_time", instance.start_time)
        end = serializer.validated_data.get("end_time", instance.end_time)
        new_status = serializer.validated_data.get("status", instance.status)

        try:
            with transaction.atomic():
                locked_room = MeetingRoom.objects.select_for_update().get(id=room.id)

                if new_status != MeetingBooking.Status.CANCELLED:
                    if locked_room.status in [MeetingRoom.Status.MAINTENANCE, MeetingRoom.Status.UNAVAILABLE]:
                        return Response(
                            {
                                "error": f"Phòng họp '{locked_room.name}' đang ở trạng thái {locked_room.get_status_display()}, không thể đặt lịch."
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    conflicts = MeetingBooking.objects.filter(
                        room=locked_room,
                        date=booking_date,
                        start_time__lt=end,
                        end_time__gt=start,
                    ).exclude(status=MeetingBooking.Status.CANCELLED).exclude(pk=instance.pk)

                    if conflicts.exists():
                        conflict = conflicts.first()
                        organizer = conflict.organizer
                        host = getattr(organizer, "ho_ten", None) or organizer.get_full_name() or organizer.username
                        c_start = conflict.start_time.strftime("%H:%M")
                        c_end = conflict.end_time.strftime("%H:%M")
                        c_date = conflict.date.strftime("%d/%m/%Y")
                        return Response(
                            {
                                "error": f"Không thể đổi sang khung giờ này vì bị trùng với cuộc họp '{conflict.title}' ({c_start} - {c_end} ngày {c_date}) bởi {host}!"
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                self.perform_update(serializer)

        except IntegrityError:
            return Response(
                {
                    "error": "Khung giờ này bị trùng lặp với lịch họp khác trên hệ thống!"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """
        Hủy lịch đặt phòng họp: giải phóng khung giờ nhưng vẫn giữ lại bản ghi lịch sử.
        """
        booking = self.get_object()
        if booking.status == MeetingBooking.Status.CANCELLED:
            return Response(
                {"detail": "Lịch đặt phòng này đã được hủy trước đó."},
                status=status.HTTP_200_OK,
            )

        booking.status = MeetingBooking.Status.CANCELLED
        reason = request.data.get("ly_do_huy", "").strip()
        if reason:
            booking.purpose = (booking.purpose + f"\n[Lý do hủy]: {reason}").strip()
        booking.save()

        serializer = self.get_serializer(booking)
        return Response(
            {
                "detail": "Đã hủy lịch đặt phòng thành công. Khung giờ đã được giải phóng.",
                "booking": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# Aliases cho backward-compatibility
PhongHopViewSet = MeetingRoomViewSet
DatPhongHopViewSet = MeetingBookingViewSet
