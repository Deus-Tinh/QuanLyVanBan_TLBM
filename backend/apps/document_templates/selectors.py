from django.db.models import Q


def visible_resources(qs, user):
    """Áp dụng cùng phạm vi xem cho danh sách tài liệu và dashboard."""
    # Người dùng chưa đăng nhập: chỉ thấy tài liệu công khai (TAT_CA)
    if not user or not user.is_authenticated:
        return qs.filter(hien_thi='TAT_CA')

    # Quản trị viên và Staff: thấy toàn bộ
    if user.is_superuser or user.is_staff:
        return qs

    # Người dùng đăng nhập: thấy tài liệu TAT_CA, hoặc do chính mình tạo, hoặc cùng đơn vị/phòng ban
    user_dept = ""
    if hasattr(user, "profile"):
        user_dept = getattr(user.profile, "department", "")
    user_don_vi_id = getattr(user, "don_vi_id", None)

    q_filter = Q(hien_thi='TAT_CA') | Q(nguoi_tao=user)
    if user_don_vi_id:
        q_filter |= Q(hien_thi='NOI_BO_PHONG_BAN', don_vi_id=user_don_vi_id)
    if user_dept:
        q_filter |= Q(hien_thi='NOI_BO_PHONG_BAN', nguoi_tao__profile__department=user_dept)

    return qs.filter(q_filter).distinct()
