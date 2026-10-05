from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

from signing.models import SigningProcess


def cap_quyen(user, *codenames):
    """
    Gán quyền riêng theo codename trần của DDL. DB dựng từ DDL hoặc có seed RBAC của Nhóm 7 đã có sẵn
    quyền; DB test dựng bằng migration của nhánh thì chưa có, nên tạo tạm gắn content type của app signing.
    """
    for codename in codenames:
        permission = Permission.objects.filter(codename=codename).order_by().first()
        if permission is None:
            permission = Permission.objects.create(
                codename=codename, name=codename,
                content_type=ContentType.objects.get_for_model(SigningProcess),
            )
        user.user_permissions.add(permission)
