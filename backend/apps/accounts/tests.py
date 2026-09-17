from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import StaffProfile


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword123",
            email="test@itc.edu.vn",
        )
        self.profile = StaffProfile.objects.create(
            user=self.user,
            full_name="Nguyễn Văn Test",
            department="Ban CNTT",
            position="Chuyên viên",
            role="staff",
        )

    def test_login_success(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "testuser", "password": "testpassword123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["full_name"], "Nguyễn Văn Test")

    def test_login_invalid_credentials(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "testuser", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)

    def test_profile_unauthorized(self):
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authorized(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")
        self.assertEqual(response.data["full_name"], "Nguyễn Văn Test")

    def test_change_password_wrong_old_password(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "old_password": "wrongoldpassword",
                "new_password": "newpassword12345",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)
