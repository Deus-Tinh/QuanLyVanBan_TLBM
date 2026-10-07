"""
Unit tests cho phân hệ Phòng họp (Issue #22 - Nhóm 7).

Kiểm thử toàn diện:
1. Model PhongHop: default, validator, __str__
2. API PhongHopViewSet: CRUD, validation, search, filter, pagination, permission
"""

from datetime import timedelta, datetime, time, date
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

        # Staff user thông thường (có quyền xem lịch phòng họp, chưa có quyền ghi PhongHop)
        self.regular_user = User.objects.create_user(
            username="regular_user",
            email="regular@tlbm.vn",
            password="RegularPassword123!",
        )
        view_perm = Permission.objects.filter(codename="view_schedule_phonghop")
        self.regular_user.user_permissions.add(*view_perm)

        # Staff user có quyền quản lý phòng họp
        self.manager_user = User.objects.create_user(
            username="manager_user",
            email="manager@tlbm.vn",
            password="ManagerPassword123!",
        )
        manager_perms = Permission.objects.filter(
            codename__in=["view_schedule_phonghop", "add_phonghop", "change_phonghop", "delete_phonghop"]
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
        """Lấy danh sách phòng họp có phân trang: User thường chỉ thấy phòng public, Quản lý thấy tất cả."""
        # User thường chỉ thấy phòng is_public=True
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/meeting-rooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("count", response.data)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Phòng Hội trường A")

        # Quản lý có quyền change_phonghop thấy cả phòng nội bộ
        self.client.force_authenticate(user=self.manager_user)
        res_mgr = self.client.get("/api/meeting-rooms/")
        self.assertEqual(res_mgr.status_code, status.HTTP_200_OK)
        self.assertEqual(res_mgr.data["count"], 2)

    def test_list_rooms_all_unpaginated(self):
        """Tham số all=true trả về danh sách thuần không phân trang."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get("/api/meeting-rooms/?all=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)

    def test_user_without_view_schedule_permission_denied(self):
        """Tài khoản đăng nhập nhưng không có view_schedule_phonghop bị 403."""
        no_perm_user = User.objects.create_user(
            username="no_perm_user",
            email="noperm@tlbm.vn",
            password="NoPermPassword123!",
        )
        self.client.force_authenticate(user=no_perm_user)
        res = self.client.get("/api/meeting-rooms/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_room_detail(self):
        """Xem chi tiết một phòng họp."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/meeting-rooms/{self.room1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["ten_phong"], "Phòng Hội trường A")
        self.assertEqual(response.data["suc_chua"], 100)

    def test_search_rooms(self):
        """Tìm kiếm phòng họp theo từ khóa (tên, vị trí, thiết bị)."""
        self.client.force_authenticate(user=self.manager_user)

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
        """Lọc phòng họp theo trạng thái công khai / nội bộ."""
        # Manager thấy cả 2
        self.client.force_authenticate(user=self.manager_user)
        res_public = self.client.get("/api/meeting-rooms/?is_public=true")
        self.assertEqual(res_public.data["count"], 1)
        self.assertEqual(res_public.data["results"][0]["ten_phong"], "Phòng Hội trường A")

        res_hidden = self.client.get("/api/meeting-rooms/?is_public=false")
        self.assertEqual(res_hidden.data["count"], 1)
        self.assertEqual(res_hidden.data["results"][0]["ten_phong"], "Phòng Họp B")

        # Regular user không bao giờ thấy phòng is_public=false
        self.client.force_authenticate(user=self.regular_user)
        res_reg_hidden = self.client.get("/api/meeting-rooms/?is_public=false")
        self.assertEqual(res_reg_hidden.data["count"], 0)

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
        tz = timezone.get_current_timezone()
        base = timezone.make_aware(datetime(2026, 10, 20, 8, 0, 0), tz)
        booking = DatPhongHop.objects.create(
            phong_hop=self.room,
            nguoi_dat=self.user,
            tieu_de="Họp Bàn Giao",
            thoi_gian_bat_dau=base + timedelta(hours=1),
            thoi_gian_ket_thuc=base + timedelta(hours=2),
            so_nguoi_tham_gia=10,
        )
        self.assertEqual(booking.trang_thai, DatPhongHop.STATUS_DA_DAT)
        self.assertIn("Họp Bàn Giao", str(booking))

    def test_clean_end_time_before_start_time(self):
        tz = timezone.get_current_timezone()
        base = timezone.make_aware(datetime(2026, 10, 20, 8, 0, 0), tz)
        booking = DatPhongHop(
            phong_hop=self.room,
            nguoi_dat=self.user,
            tieu_de="Họp Lỗi Giờ",
            thoi_gian_bat_dau=base + timedelta(hours=2),
            thoi_gian_ket_thuc=base + timedelta(hours=1),
            so_nguoi_tham_gia=5,
        )
        with self.assertRaises(ValidationError):
            booking.clean()

    def test_clean_capacity_exceeded(self):
        tz = timezone.get_current_timezone()
        base = timezone.make_aware(datetime(2026, 10, 20, 8, 0, 0), tz)
        booking = DatPhongHop(
            phong_hop=self.room,
            nguoi_dat=self.user,
            tieu_de="Họp Quá Tải",
            thoi_gian_bat_dau=base + timedelta(hours=1),
            thoi_gian_ket_thuc=base + timedelta(hours=2),
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

        vn_tz = timezone.get_current_timezone()
        self.base_time = timezone.make_aware(datetime(2026, 10, 20, 0, 0, 0), vn_tz)
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

    def test_staff_user_without_add_phonghop_cannot_create_room(self):
        """User có is_staff=True nhưng không có quyền add_phonghop bị 403 Forbidden."""
        staff_only_user = User.objects.create_user(
            username="staff_only_user",
            email="staff@tlbm.vn",
            password="StaffPassword123!",
            is_staff=True,  # Chỉ có cờ admin site, không có quyền nghiệp vụ
        )
        self.client.force_authenticate(user=staff_only_user)
        res = self.client.post("/api/meeting-rooms/", {
            "name": "Phòng Tạo Lậu",
            "capacity": 10,
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_status_param_returns_400(self):
        """Truyền status không thuộc enum (ví dụ ?status=bogus) phải trả về 400 thay vì 500 DataError."""
        self.client.force_authenticate(user=self.admin_user)
        # Phòng họp
        res_rooms = self.client.get("/api/meeting-rooms/?status=BOGUS")
        self.assertEqual(res_rooms.status_code, status.HTTP_400_BAD_REQUEST)

        # Lịch đặt phòng
        res_bookings = self.client.get("/api/meeting-bookings/?status=BOGUS")
        self.assertEqual(res_bookings.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_room_id_param_returns_400(self):
        """Truyền room_id không phải số (ví dụ ?room_id=abc) phải trả về 400 thay vì 500 ValueError."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get("/api/meeting-bookings/?room_id=abc")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_room_name_max_length_100(self):
        """Tên phòng dài hơn 100 ký tự phải báo lỗi 400 thay vì DataError varchar(100)."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post("/api/meeting-rooms/", {
            "name": "A" * 105,
            "capacity": 10,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_capacity_max_value_overflow(self):
        """Sức chứa vượt quá giới hạn 32-bit integer phải báo lỗi 400 thay vì DataError integer overflow."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post("/api/meeting-rooms/", {
            "name": "Phòng Quá Lớn",
            "capacity": 99999999999999,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_room_without_is_public_preserves_privacy(self):
        """PUT phòng họp không gửi trường is_public phải giữ nguyên giá trị cũ (không bị reset về True)."""
        self.client.force_authenticate(user=self.admin_user)
        private_room = PhongHop.objects.create(
            ten_phong="Phòng Cơ Mật HĐQT",
            suc_chua=10,
            is_public=False,
        )
        res = self.client.put(f"/api/meeting-rooms/{private_room.id}/", {
            "name": "Phòng Cơ Mật HĐQT (Cập nhật)",
            "capacity": 12,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        private_room.refresh_from_db()
        self.assertFalse(private_room.is_public)
        self.assertEqual(private_room.capacity, 12)

    def test_regular_user_cannot_book_private_room(self):
        """Người dùng thường không có quyền change_phonghop thì không được đặt lịch vào phòng nội bộ."""
        private_room = PhongHop.objects.create(
            ten_phong="Phòng Riêng VIP Ban Giám Đốc",
            suc_chua=8,
            is_public=False,
        )
        self.client.force_authenticate(user=self.user2)
        payload = {
            "room": private_room.id,
            "title": "Họp Thử Phòng Riêng",
            "date": (self.base_time.date()).isoformat(),
            "start_time": "14:00:00",
            "end_time": "15:00:00",
            "attendees_count": 4,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertIn(res.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

        # Admin hoặc người có quyền change_phonghop thì đặt được
        self.client.force_authenticate(user=self.admin_user)
        res_admin = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res_admin.status_code, status.HTTP_201_CREATED)

    def test_past_booking_returns_completed_status_and_filtered(self):
        """Lịch đã diễn ra trong quá khứ tự động hiển thị COMPLETED (hoan_thanh) và lọc được bằng ?status=hoan_thanh."""
        self.client.force_authenticate(user=self.admin_user)
        yesterday = timezone.localtime(timezone.now()).date() - timedelta(days=1)
        past_booking = DatPhongHop.objects.create(
            room=self.room1,
            organizer=self.user1,
            title="Cuộc họp hôm qua",
            date=yesterday,
            start_time=time(9, 0),
            end_time=time(10, 0),
            attendees_count=5,
            status=DatPhongHop.Status.CONFIRMED,
        )
        # 1. GET chi tiết lịch họp -> trạng thái động trả về COMPLETED / hoan_thanh
        res = self.client.get(f"/api/meeting-bookings/{past_booking.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "COMPLETED")
        self.assertEqual(res.data["trang_thai"], "hoan_thanh")

        # 2. Lọc theo ?status=hoan_thanh -> tìm thấy lịch này
        res_list = self.client.get("/api/meeting-bookings/?status=hoan_thanh")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in res_list.data.get("results", [])]
        self.assertIn(past_booking.id, ids)

        # 3. Lọc theo ?status=da_dat -> không chứa lịch này
        res_confirmed = self.client.get("/api/meeting-bookings/?status=da_dat")
        self.assertEqual(res_confirmed.status_code, status.HTTP_200_OK)
        confirmed_ids = [item["id"] for item in res_confirmed.data.get("results", [])]
        self.assertNotIn(past_booking.id, confirmed_ids)

    def test_cross_day_booking_rejected(self):
        """Đặt lịch vắt qua ngày hôm sau phải bị từ chối với 400 Bad Request và key crossDayNotAllowed."""
        self.client.force_authenticate(user=self.user2)
        payload = {
            "room": self.room1.id,
            "title": "Họp Xuyên Đêm",
            "thoi_gian_bat_dau": (self.base_time + timedelta(hours=23)).isoformat(),
            "thoi_gian_ket_thuc": (self.base_time + timedelta(hours=25)).isoformat(),
            "attendees_count": 5,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.crossDayNotAllowed", str(res.data))

    def test_cancel_past_booking_rejected(self):
        """Hủy lịch đã kết thúc trong quá khứ phải trả về 400 kèm key bookingAlreadyEnded."""
        self.client.force_authenticate(user=self.admin_user)
        yesterday = timezone.localtime(timezone.now()).date() - timedelta(days=1)
        past_booking = DatPhongHop.objects.create(
            room=self.room1,
            organizer=self.user1,
            title="Cuộc họp hôm qua",
            date=yesterday,
            start_time=time(9, 0),
            end_time=time(10, 0),
            attendees_count=5,
            status=DatPhongHop.Status.CONFIRMED,
        )
        res = self.client.post(
            f"/api/meeting-bookings/{past_booking.id}/cancel/",
            {"ly_do_huy": "Hủy muộn"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data.get("error"), "meetings.messages.bookingAlreadyEnded")
        # Bản ghi vẫn phải giữ nguyên COMPLETED / CONFIRMED, không bị chuyển sang CANCELLED
        past_booking.refresh_from_db()
        self.assertNotEqual(past_booking.status, DatPhongHop.Status.CANCELLED)

    def test_update_past_booking_rejected(self):
        """Cập nhật lịch đã kết thúc trong quá khứ phải trả về 400 kèm key bookingAlreadyEnded."""
        self.client.force_authenticate(user=self.admin_user)
        yesterday = timezone.localtime(timezone.now()).date() - timedelta(days=1)
        past_booking = DatPhongHop.objects.create(
            room=self.room1,
            organizer=self.user1,
            title="Cuộc họp hôm qua",
            date=yesterday,
            start_time=time(9, 0),
            end_time=time(10, 0),
            attendees_count=5,
            status=DatPhongHop.Status.CONFIRMED,
        )
        res = self.client.put(
            f"/api/meeting-bookings/{past_booking.id}/",
            {"title": "Đổi tiêu đề lịch đã qua"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data.get("error"), "meetings.messages.bookingAlreadyEnded")

    def test_cancel_booking_reason_saved_without_hardcoded_label(self):
        """Hủy lịch hợp lệ: lý do hủy không được kèm nhãn tiếng Việt viết cứng [Lý do hủy]:"""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post(
            f"/api/meeting-bookings/{self.booking1.id}/cancel/",
            {"ly_do_huy": "Thay đổi kế hoạch nội bộ"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.booking1.refresh_from_db()
        self.assertEqual(self.booking1.status, DatPhongHop.Status.CANCELLED)
        self.assertNotIn("[Lý do hủy]:", self.booking1.purpose)
        self.assertIn("Thay đổi kế hoạch nội bộ", self.booking1.purpose)

    def test_room_name_too_long_error_key(self):
        """Tạo phòng họp có tên > 100 ký tự trả về 400 và key roomNameTooLong."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "name": "P" * 101,
            "capacity": 10,
        }
        res = self.client.post("/api/meeting-rooms/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.roomNameTooLong", str(res.data))

    def test_room_capacity_too_large_error_key(self):
        """Tạo phòng họp có sức chứa quá lớn trả về 400 và key capacityTooLarge."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "name": "Phòng Siêu Lớn",
            "capacity": 2147483648,
        }
        res = self.client.post("/api/meeting-rooms/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.capacityTooLarge", str(res.data))

    def test_permission_denied_custom_message(self):
        """Người dùng không có quyền nhận 403 với detail meetings.messages.permissionDenied."""
        no_perm_user = User.objects.create_user(
            username="no_perm_user",
            email="noperm@tlbm.vn",
            password="Password123!",
        )
        self.client.force_authenticate(user=no_perm_user)
        res = self.client.post(
            "/api/meeting-rooms/",
            {"name": "Phòng Trái Quyền", "capacity": 10},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("meetings.messages.permissionDenied", str(res.data))

    def test_client_cannot_change_booking_status_directly(self):
        """Client không thể tự ý thay đổi status sang CANCELLED/COMPLETED qua POST hoặc PUT/PATCH."""
        self.client.force_authenticate(user=self.user1)
        future_date = (timezone.localtime(timezone.now()).date() + timedelta(days=5)).isoformat()

        # 1. POST với status: CANCELLED vẫn được lưu là CONFIRMED
        payload = {
            "room_id": self.room1.id,
            "title": "Họp Thử Cố Đổi Trạng Thái",
            "date": future_date,
            "start_time": "14:00:00",
            "end_time": "15:00:00",
            "attendees_count": 5,
            "status": "CANCELLED",
        }
        res_post = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
        booking_id = res_post.data["id"]
        booking = DatPhongHop.objects.get(id=booking_id)
        self.assertEqual(booking.status, MeetingBooking.Status.CONFIRMED)

        # 2. PUT với status: CANCELLED bị bỏ qua, status vẫn giữ nguyên CONFIRMED
        res_put = self.client.put(
            f"/api/meeting-bookings/{booking_id}/",
            {
                "title": "Họp Đã Đổi Tên",
                "room_id": self.room1.id,
                "date": future_date,
                "start_time": "14:00:00",
                "end_time": "15:00:00",
                "status": "CANCELLED",
            },
        )
        self.assertEqual(res_put.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, MeetingBooking.Status.CONFIRMED)

    def test_delete_booking_returns_405_and_keeps_record(self):
        """Xóa lịch đặt phòng phải trả về 405 Method Not Allowed và không xóa bản ghi trong DB."""
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.delete(f"/api/meeting-bookings/{self.booking1.id}/")
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertIn("meetings.messages.deleteBookingNotAllowed", str(res.data))
        self.assertTrue(DatPhongHop.objects.filter(id=self.booking1.id).exists())

    def test_create_past_booking_rejected(self):
        """Không cho phép tạo lịch đặt trong quá khứ, trả về 400 và key bookingInPast."""
        self.client.force_authenticate(user=self.user1)
        yesterday = (timezone.localtime(timezone.now()).date() - timedelta(days=1)).isoformat()
        payload = {
            "room_id": self.room1.id,
            "title": "Họp Trong Quá Khứ",
            "date": yesterday,
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "attendees_count": 5,
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.bookingInPast", str(res.data))

    def test_reschedule_booking_to_past_rejected(self):
        """Không cho phép dời lịch họp hiện tại về ngày/giờ trong quá khứ."""
        self.client.force_authenticate(user=self.user1)
        yesterday = (timezone.localtime(timezone.now()).date() - timedelta(days=1)).isoformat()
        res = self.client.patch(
            f"/api/meeting-bookings/{self.booking1.id}/",
            {"date": yesterday},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.bookingInPast", str(res.data))

    def test_put_room_without_status_preserves_maintenance(self):
        """PUT phòng họp mà không truyền trường status thì không bị reset về AVAILABLE."""
        self.client.force_authenticate(user=self.admin_user)
        m_room = PhongHop.objects.create(
            name="Phòng Đang Sửa",
            capacity=15,
            status=MeetingRoom.Status.MAINTENANCE,
        )
        res = self.client.put(
            f"/api/meeting-rooms/{m_room.id}/",
            {
                "name": "Phòng Đang Sửa Cập Nhật",
                "capacity": 20,
            },
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        m_room.refresh_from_db()
        self.assertEqual(m_room.status, MeetingRoom.Status.MAINTENANCE)

    def test_update_cancelled_booking_rejected(self):
        """Cập nhật lịch họp đã bị hủy phải trả về 400 kèm key bookingAlreadyCancelled."""
        self.client.force_authenticate(user=self.user1)
        self.booking1.status = DatPhongHop.Status.CANCELLED
        self.booking1.save(update_fields=["status"])

        res = self.client.put(
            f"/api/meeting-bookings/{self.booking1.id}/",
            {"title": "Cố Sửa Lịch Đã Hủy"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.bookingAlreadyCancelled", str(res.data))

    def test_create_booking_without_title_rejected(self):
        """Tạo lịch họp thiếu tiêu đề hoặc để trống phải trả về 400 kèm key titleRequired."""
        self.client.force_authenticate(user=self.user1)
        future_date = (timezone.localtime(timezone.now()).date() + timedelta(days=5)).isoformat()
        payload = {
            "room_id": self.room1.id,
            "title": "   ",
            "date": future_date,
            "start_time": "14:00:00",
            "end_time": "15:00:00",
        }
        res = self.client.post("/api/meeting-bookings/", payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.titleRequired", str(res.data))

    def test_staff_cannot_see_other_users_private_room_bookings(self):
        """User thường không thể xem lịch phòng nội bộ của người khác, trừ khi chính mình là người đặt."""
        private_room = PhongHop.objects.create(
            name="Phòng Họp Mật HĐQT",
            capacity=10,
            is_public=False,
        )
        future_date = (timezone.localtime(timezone.now()).date() + timedelta(days=10))
        # Booking của admin trong phòng riêng
        admin_booking = DatPhongHop.objects.create(
            room=private_room,
            organizer=self.admin_user,
            title="Họp Mật Của Admin",
            date=future_date,
            start_time=time(14, 0),
            end_time=time(15, 0),
            status=DatPhongHop.Status.CONFIRMED,
        )
        # Booking của user1 trong phòng riêng
        user1_booking = DatPhongHop.objects.create(
            room=private_room,
            organizer=self.user1,
            title="Họp Mật Của User 1",
            date=future_date,
            start_time=time(16, 0),
            end_time=time(17, 0),
            status=DatPhongHop.Status.CONFIRMED,
        )

        # 1. user2 (staff thường, không phải organizer) vào xem danh sách -> không thấy cả 2 lịch phòng riêng
        self.client.force_authenticate(user=self.user2)
        res_user2 = self.client.get("/api/meeting-bookings/")
        ids_user2 = [b["id"] for b in res_user2.data.get("results", [])]
        self.assertNotIn(admin_booking.id, ids_user2)
        self.assertNotIn(user1_booking.id, ids_user2)

        # 2. user1 (chính là organizer của user1_booking) vào xem danh sách -> thấy lịch của mình, không thấy của admin
        self.client.force_authenticate(user=self.user1)
        res_user1 = self.client.get("/api/meeting-bookings/")
        ids_user1 = [b["id"] for b in res_user1.data.get("results", [])]
        self.assertIn(user1_booking.id, ids_user1)
        self.assertNotIn(admin_booking.id, ids_user1)

        # 3. Manager/Admin có quyền change_phonghop -> thấy tất cả
        self.client.force_authenticate(user=self.admin_user)
        res_admin = self.client.get("/api/meeting-bookings/")
        ids_admin = [b["id"] for b in res_admin.data.get("results", [])]
        self.assertIn(admin_booking.id, ids_admin)
        self.assertIn(user1_booking.id, ids_admin)

    def test_status_fields_db_column_is_trang_thai(self):
        """Cột status trong database của MeetingRoom và MeetingBooking phải có db_column là trang_thai."""
        self.assertEqual(MeetingRoom._meta.get_field("status").column, "trang_thai")
        self.assertEqual(MeetingBooking._meta.get_field("status").column, "trang_thai")

    def test_cancel_already_cancelled_booking_returns_400(self):
        """Hủy lại lịch họp đã bị hủy phải trả về 400 kèm key bookingAlreadyCancelled."""
        self.client.force_authenticate(user=self.user1)
        self.booking1.status = DatPhongHop.Status.CANCELLED
        self.booking1.save(update_fields=["status"])
        res = self.client.post(f"/api/meeting-bookings/{self.booking1.id}/cancel/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("meetings.messages.bookingAlreadyCancelled", str(res.data))

    def test_ongoing_meeting_can_update_title_without_reschedule_error(self):
        """Cuộc họp đang diễn ra có thể cập nhật tiêu đề/ghi chú bằng PUT mà không bị coi là dời lịch về quá khứ."""
        now_local = timezone.localtime(timezone.now())
        today = now_local.date()
        start_time = (now_local - timedelta(minutes=15)).time().replace(microsecond=0)
        end_time = (now_local + timedelta(minutes=45)).time().replace(microsecond=0)

        ongoing_booking = DatPhongHop.objects.create(
            room=self.room1,
            organizer=self.user1,
            title="Cuộc họp đang diễn ra",
            date=today,
            start_time=start_time,
            end_time=end_time,
            status=DatPhongHop.Status.CONFIRMED,
            attendees_count=5,
        )

        self.client.force_authenticate(user=self.user1)
        payload = {
            "phong_hop": self.room1.id,
            "tieu_de": "Cuộc họp đang diễn ra - Đã cập nhật tiêu đề",
            "thoi_gian_bat_dau": datetime.combine(today, start_time).isoformat(),
            "thoi_gian_ket_thuc": datetime.combine(today, end_time).isoformat(),
            "so_nguoi_tham_gia": 5,
        }
        res = self.client.put(f"/api/meeting-bookings/{ongoing_booking.id}/", payload)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ongoing_booking.refresh_from_db()
        self.assertEqual(ongoing_booking.title, "Cuộc họp đang diễn ra - Đã cập nhật tiêu đề")






