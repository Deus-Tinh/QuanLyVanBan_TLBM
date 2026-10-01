"""
Unit tests for authorization.permissions module.
"""
from django.contrib.auth.models import AnonymousUser, Permission, User
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory, force_authenticate

from authorization.permissions import require_permission
from birthdays.models import BirthdayEmailLog


class AuthorizationPermissionsUnitTests(TestCase):
    """
    Test suite for require_permission permission helper and decorator.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.perm_name = "birthdays.view_birthdayemaillog"

        # Users
        self.user_no_perm = User.objects.create_user("no_perm_user", "noperm@example.com", "pass")
        self.user_with_perm = User.objects.create_user("with_perm_user", "withperm@example.com", "pass")

        content_type = ContentType.objects.get_for_model(BirthdayEmailLog)
        self.perm = Permission.objects.get(content_type=content_type, codename="view_birthdayemaillog")
        self.user_with_perm.user_permissions.add(self.perm)

    def test_require_permission_factory_produces_base_permission_subclass(self):
        """require_permission returns a valid BasePermission subclass."""
        PermClass = require_permission(self.perm_name)
        self.assertTrue(issubclass(PermClass, BasePermission))
        perm_instance = PermClass()
        self.assertTrue(isinstance(perm_instance, BasePermission))

    def test_drf_permission_classes_usage(self):
        """Test require_permission used in DRF @permission_classes."""
        @api_view(["GET"])
        @permission_classes([IsAuthenticated, require_permission(self.perm_name)])
        def protected_view(request):
            return Response({"success": True})

        # 1. Anonymous user -> 401
        req_anon = self.factory.get("/")
        res_anon = protected_view(req_anon)
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Authenticated user without permission -> 403
        req_no_perm = self.factory.get("/")
        force_authenticate(req_no_perm, user=self.user_no_perm)
        res_no_perm = protected_view(req_no_perm)
        self.assertEqual(res_no_perm.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Authenticated user with permission -> 200
        req_with_perm = self.factory.get("/")
        force_authenticate(req_with_perm, user=self.user_with_perm)
        res_with_perm = protected_view(req_with_perm)
        self.assertEqual(res_with_perm.status_code, status.HTTP_200_OK)
        self.assertEqual(res_with_perm.data, {"success": True})
