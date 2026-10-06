"""
Unit tests cho phân hệ Phòng họp (Issue #22 - Nhóm 7).

Kiểm thử toàn diện:
1. Model PhongHop: default, validator, __str__
2. API PhongHopViewSet: CRUD, validation, search, filter, pagination, permission
"""

from datetime import timedelta, datetime
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from meetings.models import MeetingRoom, MeetingBooking, PhongHop, DatPhongHop

User = get_user_model()


class PhongHopModelTestCase(TestCase):
    """Kiểm thử cấp Model cho PhongHop."""

    def test_create_phong_hop_defaults(self):
        room = PhongHop.objects.create(ten_phong="Phòng Hội thảo A")
        self.assertEqual(room.ten_phong, "Phòng Hội thảo A")
        self.assertEqual(room.vi_tri, "")
        self.assertEqual(room.suc_chua, 10)
        self.assertEqual(room.thiet_bi, "")
        self.assertTrue(room.is_public)
        self.assertEqual(room.ghi_chu, "")
        self.assertEqual(str(room), "Phòng Hội thảo A (10 chỗ)")

    def test_phong_hop_suc_chua_validator(self):
        room = PhongHop(ten_phong="Phòng Test Lỗi", suc_chua=0)
        with self.assertRaises(ValidationError):
            room.full_clean()


class PhongHopAPITestCase(APITestCase):
    """Kiểm thử API endpoints cho /api/meeting-rooms/."""

    def setUp(self):
        # Admin user (có mọi quyền)
        self.admin_user = User.objects.create_superuser(
            username="admin_user",
            email="admin@tlbm.vn",
            password="AdminPassword123!",
        )

        # Staff user thông thường (chưa có quyền ghi PhongHop)
        self.regular_user = User.objects.create_user(
            username="regular_user",
            email="regular@tlbm.vn",
            password="RegularPassword123!",
        )

        # Staff user có quyền quản lý phòng họp
        self.manager_user = User.objects.create_user(
            username="manager_user",
            email="manager@tlbm.vn",
            password="ManagerPassword123!",
        )
        manager_perms = Permission.objects.filter(
            codename__in=["add_phonghop", "change_phonghop", "delete_phonghop"]
        )
        self.manager_user.user_permissions.add(*manager_perms)

        # Tạo sẵn một số phòng họp mẫu
        self.room1 = PhongHop.objects.create(
            ten_phong="Phòng Hội trường A",
            vi_tri="Tầng 1, Tòa Hành chính",
            suc_chua=100,
            thiet_bi="Hệ thống âm thanh hội nghị, 2 máy chiếu, 4 micro",
            is_public=True,
            ghi_chu="Dành cho hội nghị lớn",
        )
        self.room2 = PhongHop.objects.create(
            ten_phong="Phòng Họp B",
            vi_tri="Tầng 2, Tòa Kỹ thuật",
            suc_chua=15,
            thiet_bi="Tivi 75 inch, bảng viết kính",
            is_public=False,
            ghi_chu="Đang sửa điều hòa",
        )

    def test_unauthenticated_access_denied(self):
        """Người dùng chưa đăng nhập không thể truy cập API."""
        response = self.client.get("/api/meeting-rooms/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_rooms_paginated(self):
        """Lấy danh sách phòng họp có phân trang."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/meeting-rooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["count"], 2)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_rooms_all_unpaginated(self):
        """Tham số all=true trả về danh sách thuần không phân trang."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/meeting-rooms/?all=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)

    def test_retrieve_room_detail(self):
        """Xem chi tiết một phòng họp."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/meeting-rooms/{self.room1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["ten_phong"], "Phòng Hội trường A")
        self.assertEqual(response.data["suc_chua"], 100)

    def test_search_rooms(self):
        """Tìm kiếm phòng họp theo từ khóa (tên, vị trí, thiết bị)."""
        self.client.force_authenticate(user=self.regular_user)

        # Tìm theo tên
        res1 = self.client.get("/api/meeting-rooms/?search=Hội trường")
        self.assertEqual(res1.data["count"], 1)
        self.assertEqual(res1.data["results"][0]["ten_phong"], "Phòng Hội trường A")

        # Tìm theo vị trí
        res2 = self.client.get("/api/meeting-rooms/?search=Kỹ thuật")
        self.assertEqual(res2.data["count"], 1)
        self.assertEqual(res2.data["results"][0]["ten_phong"], "Phòng Họp B")

        # Tìm theo thiết bị
        res3 = self.client.get("/api/meeting-rooms/?search=máy chiếu")
        self.assertEqual(res3.data["count"], 1)

    def test_filter_by_is_public(self):
        """Lọc phòng họp theo trạng thái công khai / khả dụng."""
        self.client.force_authenticate(user=self.regular_user)

        res_public = self.client.get("/api/meeting-rooms/?is_public=true")
        self.assertEqual(res_public.data["count"], 1)
        self.assertEqual(res_public.data["results"][0]["ten_phong"], "Phòng Hội trường A")

        res_hidden = self.client.get("/api/meeting-rooms/?is_public=false")
        self.assertEqual(res_hidden.data["count"], 1)
        self.assertEqual(res_hidden.data["results"][0]["ten_phong"], "Phòng Họp B")

    def test_create_room_as_manager(self):
        """User có quyền có thể tạo phòng họp mới."""
        self.client.force_authenticate(user=self.manager_user)
        payload = {
            "ten_phong": "Phòng Họp Ban Giám Đốc",
            "vi_tri": "Tầng 5, Tòa Nhà A",
            "suc_chua": 20,
            "thiet_bi": "Micro cổ ngỗng, màn hình tương tác thông minh",
            "is_public": True,
            "ghi_chu": "Phục vụ các cuộc họp lãnh đạo cấp cao",
        }
        response = self.client.post("/api/meeting-rooms/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["ten_phong"], "Phòng Họp Ban Giám Đốc")
        self.assertTrue(PhongHop.objects.filter(ten_phong="Phòng Họp Ban Giám Đốc").exists())

    def test_create_room_permission_denied_for_regular_user(self):
        """User không có quyền tạo phòng sẽ bị chặn 403."""
        self.client.force_authenticate(user=self.regular_user)
        payload = {
            "ten_phong": "Phòng Không Được Phép",
            "suc_chua": 10,
        }
        response = self.client.post("/api/meeting-rooms/", payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_room_validation_empty_name(self):
        """Tên phòng rỗng hoặc chỉ có khoảng trắng phải báo lỗi 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "ten_phong": "   ",
            "suc_chua": 15,
        }
        response = self.client.post("/api/meeting-rooms/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ten_phong", response.data)

    def test_create_room_validation_duplicate_name(self):
        """Trùng tên phòng họp (kể cả khác hoa thường) phải báo lỗi 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "ten_phong": "phòng hội trường a",  # self.room1 đã có "Phòng Hội trường A"
            "suc_chua": 50,
        }
        response = self.client.post("/api/meeting-rooms/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ten_phong", response.data)

    def test_create_room_validation_invalid_capacity(self):
        """Sức chứa <= 0 phải báo lỗi 400."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "ten_phong": "Phòng Sức Chứa Sai",
            "suc_chua": 0,
        }
        response = self.client.post("/api/meeting-rooms/", payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("suc_chua", response.data)

    def test_update_room_put_and_patch(self):
        """Cập nhật phòng họp thành công qua PUT và PATCH."""
        self.client.force_authenticate(user=self.manager_user)

        # PATCH: chỉ sửa sức chứa và trạng thái
        patch_res = self.client.patch(
            f"/api/meeting-rooms/{self.room2.id}/",
            {"suc_chua": 25, "is_public": True},
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.room2.refresh_from_db()
        self.assertEqual(self.room2.suc_chua, 25)
        self.assertTrue(self.room2.is_public)

        # PUT: cập nhật toàn bộ
        put_payload = {
            "ten_phong": "Phòng Họp B (Đã Nâng Cấp)",
            "vi_tri": "Tầng 2, Tòa Kỹ thuật",
            "suc_chua": 30,
            "thiet_bi": "Tivi 85 inch, Bảng thông minh",
            "is_public": True,
            "ghi_chu": "Hoàn tất sửa chữa",
        }
        put_res = self.client.put(f"/api/meeting-rooms/{self.room2.id}/", put_payload)
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        self.room2.refresh_from_db()
        self.assertEqual(self.room2.ten_phong, "Phòng Họp B (Đã Nâng Cấp)")

    def test_delete_room_success(self):
        """Xóa phòng họp khi chưa có dữ liệu ràng buộc."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.delete(f"/api/meeting-rooms/{self.room2.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PhongHop.objects.filter(id=self.room2.id).exists())

    def test_delete_room_forbidden_for_regular_user(self):
        """User không có quyền delete_phonghop bị 403."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(f"/api/meeting-rooms/{self.room1.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DatPhongHopModelTestCase(TestCase):
    """Kiểm thử cấp Model cho DatPhongHop."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="test_booker",
            email="booker@tlbm.vn",
            password="Password123!",
        )
        self.room = PhongHop.objects.create(
            ten_phong="Phòng Hội Thảo Model Test",
            suc_chua=20,
        )

    def test_create_dat_phong_hop_success(self):
        now = timezone.now()
        booking = DatPhongHop.objects.create(
            phong_hop=self.room,
            nguoi_dat=self.user,
            tieu_de="Họp Bàn Giao",
            thoi_gian_bat_dau=now + timedelta(hours=1),
            thoi_gian_ket_thuc=now + timedelta(hours=2),
            so_nguoi_tham_gia=10,
        )
        self.assertEqual(booking.trang_thai, DatPhongHop.STATUS_DA_DAT)
        self.assertIn("Họp Bàn Giao", str(booking))

    def test_clean_end_time_before_start_time(self):
        now = timezone.now()
        booking = DatPhongHop(
            phong_hop=self.room,
            nguoi_dat=self.user,
            tieu_de="Họp Lỗi Giờ",
            thoi_gian_bat_dau=now + timedelta(hours=2),
            thoi_gian_ket_thuc=now + timedelta(hours=1),
            so_nguoi_tham_gia=5,
        )
        with self.assertRaises(ValidationError):
            booking.clean()

    def test_clean_capacity_exceeded(self):
        now = timezone.now()
        booking = DatPhongHop(
            phong_hop=self.room,
            nguoi_dat=self.user,
            tieu_de="Họp Quá Tải",
            thoi_gian_bat_dau=now + timedelta(hours=1),
            thoi_gian_ket_thuc=now + timedelta(hours=2),
            so_nguoi_tham_gia=25,  # sức chứa phòng là 20
        )
        with self.assertRaises(ValidationError):
            booking.clean()


class DatPhongHopAPITestCase(APITestCase):
    """Kiểm thử API endpoints cho /api/meeting-bookings/."""

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="booking_admin",
            email="admin@tlbm.vn",
            password="AdminPassword123!",
        )
        self.user1 = User.objects.create_user(
            username="user_one",
            email="user1@tlbm.vn",
            password="UserOnePass123!",
        )
        self.user2 = User.objects.create_user(
            username="user_two",
            email="user2@tlbm.vn",
            password="UserTwoPass123!",
        )

        booking_perms = Permission.objects.filter(
            codename__in=["add_datphonghop", "change_own_datphonghop", "view_schedule_phonghop"]
        )
        self.user1.user_permissions.add(*booking_perms)
        self.user2.user_permissions.add(*booking_perms)

        self.room1 = PhongHop.objects.create(
            ten_phong="Phòng Họp VIP 1",
            suc_chua=15,
            is_public=True,
        )
        self.room2 = PhongHop.objects.create(
            ten_phong="Phòng Họp VIP 2",
            suc_chua=10,
            is_public=True,
        )

        self.base_time = timezone.now().replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
        self.booking1 = DatPhongHop.objects.create(
            phong_hop=self.room1,
            nguoi_dat=self.user1,
            don_vi_to_chuc="Ban Kế Hoạch",
            tieu_de="Cuộc họp sáng của User 1",
            thoi_gian_bat_dau=self.base_time + timedelta(hours=9),
            thoi_gian_ket_thuc=self.base_time + timedelta(hours=10, minutes=30),
            so_nguoi_tham_gia=8,
            trang_thai=DatPhongHop.STATUS_DA_DAT,
        )

    def test_list_bookings_authenticated(self):
        """User đã xác thực có thể xem danh sách lịch đặt."""
        self.client.force_authenticate(user=self.user2)
        res = self.client.get("/api/meeting-bookings/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # response phân trang có results
        count = res.data.get("count", len(res.data.get("results", [])))
        self.assertGreaterEqual(count, 1)

    def test_filter_bookings_by_room(self):
        """Lọc lịch đặt theo phòng họp."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.get(f"/api/meeting-bookings/?room_id={self.room1.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get("results", [])
        for item in results:
            self.assertEqual(item["phong_hop"], self.room1.id)

    def test_create_booking_success(self):
        """Tạo lịch đặt phòng mới thành công và tự gán nguoi_dat."""
        self.client.force_authenticate(user=self.user2)
        payload = {
            "phong_hop": self.room1.id,
            "tieu_de": "Họp Triển Khai Chiều",
            "don_vi_to_chuc": "Ban Kỹ Thuật",
            "thoi_gian_bat_dau": (self.base_time + timedelta(hours=14)).isoformat(),
            "thoi_gian_ket_thuc": (self.base_time + timedelta(hours=16)).isoformat(),
            "so_nguoi_tham_gia": 10,
            "ghi_chu": "Yêu cầu máy chiếu",
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["nguoi_dat"], self.user2.id)
        self.assertEqual(res.data["tieu_de"], "Họp Triển Khai Chiều")

    def test_create_booking_conflict_error(self):
        """Chặn đặt trùng khung giờ trong cùng phòng họp."""
        self.client.force_authenticate(user=self.user2)
        # Booking1 diễn ra từ 09:00 đến 10:30 phòng 1
        # Thử đặt từ 10:00 đến 11:30 phòng 1 -> Bị từ chối
        payload = {
            "phong_hop": self.room1.id,
            "tieu_de": "Họp Cố Tình Trùng Lịch",
            "thoi_gian_bat_dau": (self.base_time + timedelta(hours=10)).isoformat(),
            "thoi_gian_ket_thuc": (self.base_time + timedelta(hours=11, minutes=30)).isoformat(),
            "so_nguoi_tham_gia": 5,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_booking_capacity_error(self):
        """Chặn đặt số người vượt quá sức chứa phòng."""
        self.client.force_authenticate(user=self.user2)
        payload = {
            "phong_hop": self.room2.id,  # sức chứa 10
            "tieu_de": "Họp Quá Đông",
            "thoi_gian_bat_dau": (self.base_time + timedelta(hours=14)).isoformat(),
            "thoi_gian_ket_thuc": (self.base_time + timedelta(hours=15)).isoformat(),
            "so_nguoi_tham_gia": 50,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("so_nguoi_tham_gia", res.data)

    def test_cancel_booking_action(self):
        """Hủy lịch đặt phòng giải phóng khung giờ."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(
            f"/api/meeting-bookings/{self.booking1.id}/cancel/",
            {"ly_do_huy": "Hoãn họp sang tuần sau"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.trang_thai, DatPhongHop.STATUS_DA_HUY)
        self.assertIn("Hoãn họp sang tuần sau", self.booking1.ghi_chu)

    def test_rebook_after_cancellation(self):
        """Sau khi lịch cũ bị hủy, người khác có thể đặt vào cùng khung giờ đó."""
        # 1. User 1 hủy lịch
        self.client.force_authenticate(user=self.user1)
        self.client.post(f"/api/meeting-bookings/{self.booking1.id}/cancel/")

        # 2. User 2 đặt vào chính khung giờ đó -> Thành công!
        self.client.force_authenticate(user=self.user2)
        payload = {
            "phong_hop": self.room1.id,
            "tieu_de": "Họp Khẩn Cấp Chiếm Slot Đã Hủy",
            "thoi_gian_bat_dau": (self.base_time + timedelta(hours=9)).isoformat(),
            "thoi_gian_ket_thuc": (self.base_time + timedelta(hours=10, minutes=30)).isoformat(),
            "so_nguoi_tham_gia": 6,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_regular_user_cannot_cancel_other_user_booking(self):
        """User thường không thể hủy lịch của người khác."""
        self.client.force_authenticate(user=self.user2)
        res = self.client.post(f"/api/meeting-bookings/{self.booking1.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_cancel_any_booking(self):
        """Admin có quyền hủy bất kỳ lịch đặt phòng nào."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post(
            f"/api/meeting-bookings/{self.booking1.id}/cancel/",
            {"ly_do_huy": "Admin điều phối phòng"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.trang_thai, DatPhongHop.STATUS_DA_HUY)

    def test_create_booking_with_ddl_english_payload(self):
        """Tạo lịch đặt phòng bằng payload tiếng Anh theo đúng DDL SQL_Fix4."""
        self.client.force_authenticate(user=self.user1)
        target_date = (self.base_time + timedelta(days=2)).date()
        payload = {
            "room_id": self.room1.id,
            "title": "Họp Chiến Lược Quý 4",
            "date": target_date.isoformat(),
            "start_time": "14:00:00",
            "end_time": "15:30:00",
            "attendees_count": 6,
            "purpose": "Đánh giá KPI và kế hoạch ngân sách",
            "status": "CONFIRMED",
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "Họp Chiến Lược Quý 4")
        self.assertEqual(res.data["status"], "CONFIRMED")
        self.assertEqual(res.data["attendees_count"], 6)

    def test_cannot_book_maintenance_room(self):
        """Không cho phép đặt phòng họp đang ở trạng thái MAINTENANCE."""
        m_room = PhongHop.objects.create(
            name="Phòng Bảo Trì 101",
            location="Tầng 1",
            capacity=20,
            status=MeetingRoom.Status.MAINTENANCE,
        )
        self.client.force_authenticate(user=self.user1)
        payload = {
            "room_id": m_room.id,
            "title": "Họp Thử Phòng Bảo Trì",
            "date": (self.base_time + timedelta(days=3)).date().isoformat(),
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "attendees_count": 5,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_book_unavailable_room(self):
        """Không cho phép đặt phòng họp đang ở trạng thái UNAVAILABLE."""
        u_room = PhongHop.objects.create(
            name="Phòng Khóa Tạm Thời",
            location="Tầng 2",
            capacity=10,
            status=MeetingRoom.Status.UNAVAILABLE,
        )
        self.client.force_authenticate(user=self.user1)
        payload = {
            "phong_hop": u_room.id,
            "tieu_de": "Họp Thử Phòng Khóa",
            "thoi_gian_bat_dau": (self.base_time + timedelta(days=3, hours=9)).isoformat(),
            "thoi_gian_ket_thuc": (self.base_time + timedelta(days=3, hours=10)).isoformat(),
            "so_nguoi_tham_gia": 4,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_with_change_any_datphonghop_can_cancel_other_booking(self):
        """User có quyền change_any_datphonghop có thể hủy lịch của người khác."""
        perm_user = User.objects.create_user(
            username="dispatcher_user",
            email="dispatcher@tlbm.vn",
            password="DispatcherPass123!",
        )
        perm = Permission.objects.get(codename="change_any_datphonghop")
        perm_user.user_permissions.add(perm)

        self.client.force_authenticate(user=perm_user)
        res = self.client.post(
            f"/api/meeting-bookings/{self.booking1.id}/cancel/",
            {"ly_do_huy": "Điều phối bởi bộ phận hành chính"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.status, MeetingBooking.Status.CANCELLED)

