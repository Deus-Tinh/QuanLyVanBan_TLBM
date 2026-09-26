"""
Unit tests cho phân hệ Phòng họp (Issue #22 - Nhóm 7).

Kiểm thử toàn diện:
1. Model PhongHop: default, validator, __str__
2. API PhongHopViewSet: CRUD, validation, search, filter, pagination, permission
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from meetings.models import PhongHop

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
        content_type = ContentType.objects.get_for_model(PhongHop)
        add_perm = Permission.objects.get(content_type=content_type, codename="add_phonghop")
        change_perm = Permission.objects.get(content_type=content_type, codename="change_phonghop")
        delete_perm = Permission.objects.get(content_type=content_type, codename="delete_phonghop")
        self.manager_user.user_permissions.add(add_perm, change_perm, delete_perm)

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
