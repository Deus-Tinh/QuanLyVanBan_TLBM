from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import StaffProfile


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="admin",
            password="AdminPassword@123",
            email="quantri@donvi.gov.vn",
        )
        self.profile = StaffProfile.objects.create(
            user=self.user,
            full_name="Quản Trị Viên Hệ Thống",
            department="Văn phòng Trung tâm",
            position="Quản trị viên tối cao",
            role="admin",
        )

    def test_login_success(self):
        """Test API login khớp chuẩn API contract của Hieu.md"""
        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "AdminPassword@123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
        self.assertIn("token", response.data)
        self.assertIn("access", response.data)
        self.assertIn("user", response.data)

        user_data = response.data["user"]
        self.assertEqual(user_data["username"], "admin")
        self.assertEqual(user_data["fullName"], "Quản Trị Viên Hệ Thống")
        self.assertEqual(user_data["unit"], "Văn phòng Trung tâm")
        self.assertEqual(user_data["roleTitle"], "Quản trị viên tối cao")
        self.assertEqual(user_data["role"], "admin")

    def test_login_invalid_credentials(self):
        """Test API login sai mật khẩu trả về 401 và thông báo tiếng Việt"""
        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "WrongPassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data.get("success"))
        self.assertIn("error", response.data)

    def test_profile_unauthorized(self):
        """Test API profile chặn 401 khi không có token"""
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authorized(self):
        """Test API profile trả về thông tin CBNV chuẩn"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "admin")
        self.assertEqual(response.data["fullName"], "Quản Trị Viên Hệ Thống")
        self.assertEqual(response.data["unit"], "Văn phòng Trung tâm")

    def test_change_password_wrong_old_password(self):
        """Test đổi mật khẩu sai mật khẩu hiện tại"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "old_password": "WrongPassword@123",
                "new_password": "NewSecurePassword@456",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get("success"))
        self.assertIn("Mật khẩu hiện tại không chính xác", response.data.get("message", ""))

    def test_change_password_short_new_password(self):
        """Test đổi mật khẩu mới < 8 ký tự"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "old_password": "AdminPassword@123",
                "new_password": "123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_success(self):
        """Test đổi mật khẩu thành công"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "old_password": "AdminPassword@123",
                "new_password": "NewSecurePassword@456",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))

    def test_logout(self):
        """Test đăng xuất thành công"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("success"))
