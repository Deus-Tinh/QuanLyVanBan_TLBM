from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import StaffProfile


class AccountsAuthenticationTests(APITestCase):
    """
    Test suite cho Issue #8: Django Authentication & Quản lý phiên JWT.
    Kiểm tra toàn diện: Đăng nhập (thành công/thất bại/inactive), Refresh Token, Profile, Logout Blacklist.
    """

    def setUp(self):
        # 1. Tạo user chuẩn
        self.password = "Secr3tP@ssword"
        self.user = User.objects.create_user(
            username="canbo_test",
            email="canbo_test@donvi.gov.vn",
            password=self.password,
            first_name="Văn Thư",
            last_name="Kiểm Thử",
            is_active=True,
        )
        self.profile = StaffProfile.objects.create(
            user=self.user,
            full_name="Văn Thư Kiểm Thử",
            department="Ban Pháp Chế",
            position="Chuyên viên chính",
            role="staff",
        )

        # 2. Tạo user bị khóa (inactive)
        self.inactive_user = User.objects.create_user(
            username="inactive_test",
            email="inactive@donvi.gov.vn",
            password=self.password,
            is_active=False,
        )

        self.login_url = reverse("accounts:login")
        self.refresh_url = reverse("accounts:token_refresh")
        self.profile_url = reverse("accounts:profile")
        self.logout_url = reverse("accounts:logout")

    def test_login_success(self):
        """Đăng nhập thành công với username và password chính xác."""
        response = self.client.post(
            self.login_url,
            {"username": "canbo_test", "password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("token", data)
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["username"], "canbo_test")
        self.assertEqual(data["user"]["fullName"], "Văn Thư Kiểm Thử")
        self.assertEqual(data["user"]["role"], "staff")

    def test_login_wrong_password(self):
        """Đăng nhập thất bại khi nhập sai mật khẩu -> HTTP 401."""
        response = self.client.post(
            self.login_url,
            {"username": "canbo_test", "password": "WrongPassword@999"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertFalse(data.get("success"))
        self.assertIn("error", data)

    def test_login_nonexistent_user(self):
        """Đăng nhập thất bại khi tài khoản không tồn tại -> HTTP 401."""
        response = self.client.post(
            self.login_url,
            {"username": "user_khong_ton_tai", "password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertFalse(data.get("success"))

    def test_login_inactive_user(self):
        """Tài khoản bị vô hiệu hóa (is_active=False) bị từ chối -> HTTP 403."""
        response = self.client.post(
            self.login_url,
            {"username": "inactive_test", "password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        data = response.json()
        self.assertFalse(data.get("success"))

    def test_login_missing_credentials(self):
        """Thiếu username hoặc password -> HTTP 400 Bad Request."""
        response = self.client.post(
            self.login_url,
            {"username": "", "password": ""},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh(self):
        """Làm mới Access Token bằng Refresh Token hợp lệ -> HTTP 200 + token mới."""
        refresh = RefreshToken.for_user(self.user)
        response = self.client.post(
            self.refresh_url,
            {"refresh": str(refresh)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("access", data)

    def test_profile_authenticated(self):
        """User có token hợp lệ xem được thông tin cá nhân qua Header Bearer."""
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["username"], "canbo_test")
        self.assertEqual(data["fullName"], "Văn Thư Kiểm Thử")

    def test_profile_unauthenticated(self):
        """Không gửi Bearer Token -> HTTP 401 Unauthorized."""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_token(self):
        """Đăng xuất thành công và đưa Refresh Token vào Blacklist."""
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        refresh_str = str(refresh)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.post(
            self.logout_url,
            {"refresh": refresh_str},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json().get("success"))

        # Kiểm tra thử dùng lại Refresh Token đã bị blacklist -> Bị từ chối
        refresh_response = self.client.post(
            self.refresh_url,
            {"refresh": refresh_str},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
