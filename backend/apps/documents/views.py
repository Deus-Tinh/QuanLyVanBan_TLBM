"""
API Views cho Module Văn Bản — Kiến trúc 3 Model (VanBanDen, VanBanDi, VanBanMat).

Hỗ trợ 2 tầng ViewSets:
1. ViewSet chuyên biệt:
   - VanBanDenViewSet:  /api/documents/den/  (hoặc /api/van-ban-den/)
   - VanBanDiViewSet:   /api/documents/di/   (hoặc /api/van-ban-di/)
   - VanBanMatViewSet:  /api/documents/mat/  (hoặc /api/van-ban-mat/)
2. ViewSet hợp nhất (Unified Facade):
   - DocumentViewSet:   /api/documents/      (Hỗ trợ nguyên vẹn 100% frontend React và test suite)
"""

from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .filters import (
    DocumentFilter,
    VanBanDenFilter,
    VanBanDiFilter,
    VanBanMatFilter,
    ViewerFilter,
    get_filter_class_for_model,
)
from .models import (
    HieuLuc,
    LoaiVanBan,
    VanBanDen,
    VanBanDenAttachment,
    VanBanDi,
    VanBanDiAttachment,
    VanBanMat,
    VanBanMatAttachment,
    DocumentViewLog,
    get_document_model,
    get_attachment_model,
)
from .serializers import (
    DocumentCreateUpdateSerializer,
    DocumentDetailSerializer,
    DocumentListSerializer,
    DocumentViewLogSerializer,
    VanBanDenSerializer,
    VanBanDiSerializer,
    VanBanMatSerializer,
)
from .services import (
    check_and_update_expired_documents,
    export_to_excel,
    generate_excel_template,
    generate_so_thu_tu,
    import_from_excel,
    log_document_view,
)


# ═══════════════════════════════════════════════════════════════════
# Pagination
# ═══════════════════════════════════════════════════════════════════

class DocumentPagination(PageNumberPagination):
    """Phân trang chuẩn: 10, 20, 50 bản ghi/trang."""
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


# ═══════════════════════════════════════════════════════════════════
# Helper Functions cho Phân Quyền & Quan Hệ Thay Thế
# ═══════════════════════════════════════════════════════════════════

def is_admin_user(user):
    """Kiểm tra người dùng có quyền Quản trị viên (Admin) hay không."""
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    profile = getattr(user, "profile", None)
    if profile and profile.role == "admin":
        return True
    return False


def can_edit_document(user, instance):
    """Kiểm tra quyền chỉnh sửa văn bản."""
    if not user or not user.is_authenticated:
        return False
    if is_admin_user(user):
        return True
    if instance.nguoi_tao == user:
        return True
    model_name = instance._meta.model_name
    if (
        user.has_perm(f"documents.change_{model_name}")
        or user.has_perm("documents.change_document")
        or user.has_perm("documents.change_vanbanden")
    ):
        return True
    return False


def can_delete_document(user, instance):
    """Kiểm tra quyền xóa văn bản."""
    if not user or not user.is_authenticated:
        return False
    if is_admin_user(user):
        return True
    model_name = instance._meta.model_name
    if (
        user.has_perm(f"documents.delete_{model_name}")
        or user.has_perm("documents.delete_document")
        or user.has_perm("documents.delete_vanbanden")
    ):
        return True
    return False


def cleanup_replacement_links_on_delete(instance):
    """Dọn dẹp và khôi phục văn bản liên quan khi một văn bản bị xóa."""
    so_hieu = (instance.so_hieu or "").strip()
    link_target = (instance.link_thay_the or "").strip()
    if not so_hieu and not link_target:
        return

    query = Q()
    if so_hieu:
        query |= Q(link_thay_the__iexact=so_hieu)
    if link_target:
        query |= Q(so_hieu__iexact=link_target)

    for model in (VanBanDen, VanBanDi, VanBanMat):
        for doc in model.objects.filter(query).exclude(pk=instance.pk):
            updated_fields = []
            if so_hieu and doc.link_thay_the and doc.link_thay_the.strip().lower() == so_hieu.lower():
                doc.link_thay_the = ""
                updated_fields.append("link_thay_the")

            if doc.hieu_luc == HieuLuc.HET_VA_THAY_THE:
                doc.hieu_luc = HieuLuc.CON_HIEU_LUC
                doc.ngay_het_hieu_luc = None
                if "ngay_het_hieu_luc" not in updated_fields:
                    updated_fields.append("ngay_het_hieu_luc")
                if "hieu_luc" not in updated_fields:
                    updated_fields.append("hieu_luc")

            if updated_fields:
                doc.save(update_fields=updated_fields)


def cleanup_old_replacement_link(old_target_so_hieu, current_so_hieu):
    """Dọn dẹp quan hệ thay thế cũ khi văn bản sửa đổi/xóa link_thay_the."""
    if not old_target_so_hieu:
        return

    query = Q(so_hieu__iexact=old_target_so_hieu) | Q(link_thay_the__iexact=current_so_hieu)
    for model in (VanBanDen, VanBanDi, VanBanMat):
        for doc in model.objects.filter(query):
            updated_fields = []
            if current_so_hieu and doc.link_thay_the and doc.link_thay_the.strip().lower() == current_so_hieu.lower():
                doc.link_thay_the = ""
                updated_fields.append("link_thay_the")
            if doc.hieu_luc == HieuLuc.HET_VA_THAY_THE:
                doc.hieu_luc = HieuLuc.CON_HIEU_LUC
                doc.ngay_het_hieu_luc = None
                if "ngay_het_hieu_luc" not in updated_fields:
                    updated_fields.append("ngay_het_hieu_luc")
                if "hieu_luc" not in updated_fields:
                    updated_fields.append("hieu_luc")
            if updated_fields:
                doc.save(update_fields=updated_fields)


def sync_replacement_document(doc):
    """Đồng bộ quan hệ thay thế 2 chiều giữa các văn bản (hỗ trợ nhiều văn bản phân tách bằng dấu phẩy)."""
    raw_target = (doc.link_thay_the or "").strip()
    if not raw_target:
        return

    targets = [t.strip() for t in raw_target.split(",") if t.strip()]
    now = timezone.now()
    effective_date = (
        getattr(doc, "ngay_van_ban", None)
        or getattr(doc, "ngay_den", None)
        or getattr(doc, "ngay_ban_hanh", None)
        or now
    )

    for target in targets:
        other_doc = None
        for model in (VanBanDen, VanBanDi, VanBanMat):
            found = model.objects.filter(so_hieu__iexact=target).exclude(pk=doc.pk).first()
            if found:
                other_doc = found
                break

        if not other_doc:
            continue

        if doc.hieu_luc in (HieuLuc.CON_HIEU_LUC, HieuLuc.CON_HIEU_LUC_1_PHAN):
            other_doc.hieu_luc = HieuLuc.HET_VA_THAY_THE
            existing_links = [s.strip() for s in (other_doc.link_thay_the or "").split(",") if s.strip()]
            if doc.so_hieu and doc.so_hieu not in existing_links:
                existing_links.append(doc.so_hieu)
            other_doc.link_thay_the = ", ".join(existing_links)
            other_doc.ngay_het_hieu_luc = effective_date
            other_doc.save(update_fields=["hieu_luc", "link_thay_the", "ngay_het_hieu_luc"])
        elif doc.hieu_luc == HieuLuc.HET_VA_THAY_THE:
            existing_links = [s.strip() for s in (other_doc.link_thay_the or "").split(",") if s.strip()]
            if doc.so_hieu and doc.so_hieu not in existing_links:
                existing_links.append(doc.so_hieu)
            other_doc.link_thay_the = ", ".join(existing_links)
            other_doc.save(update_fields=["link_thay_the"])


def handle_attachments(document, request):
    """Lưu các file đính kèm từ request.FILES vào model attachment tương ứng."""
    files = request.FILES.getlist("files")
    att_model = get_attachment_model(document)
    for f in files:
        att_model.objects.create(
            document=document,
            file=f,
            name=f.name,
            file_size=f.size,
            created_user=request.user if request.user.is_authenticated else None,
        )


# ═══════════════════════════════════════════════════════════════════
# Document ViewSet — Unified Facade Endpoint (/api/documents/)
# ═══════════════════════════════════════════════════════════════════

class DocumentViewSet(viewsets.ViewSet):
    """
    API endpoint hợp nhất quản lý Văn bản (Đến / Đi / Mật).
    Đảm bảo 100% tương thích ngược với React frontend và các unit tests.
    """

    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DocumentPagination
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def _get_active_model(self):
        loai = self.request.query_params.get("loai") or self.request.query_params.get("type", "DEN")
        return get_document_model(loai)

    def _get_queryset_for_model(self, model):
        check_and_update_expired_documents()
        qs = model.objects.select_related("nguoi_tao").prefetch_related("attachments", "nguoi_nhan")
        user = self.request.user

        # Bảo vệ Văn bản Mật
        if model == VanBanMat and not user.is_staff:
            qs = qs.filter(Q(nguoi_nhan=user) | Q(nguoi_tao=user)).distinct()
        return qs

    def _get_object_across_models(self, pk):
        loai = self.request.query_params.get("loai") or self.request.query_params.get("type")
        if loai:
            model = get_document_model(loai)
            obj = self._get_queryset_for_model(model).filter(pk=pk).first()
            if obj:
                return obj

        for model in (VanBanDen, VanBanDi, VanBanMat):
            obj = self._get_queryset_for_model(model).filter(pk=pk).first()
            if obj:
                return obj

        raise NotFound(f"Không tìm thấy văn bản với ID {pk}.")

    def list(self, request):
        """GET /api/documents/?loai=DEN&nam=...&q=..."""
        loai_param = request.query_params.get("loai") or request.query_params.get("type")

        if loai_param:
            model = get_document_model(loai_param)
        else:
            model = VanBanDen

        qs = self._get_queryset_for_model(model)
        filter_cls = get_filter_class_for_model(model)
        doc_filter = filter_cls(request.query_params, queryset=qs)
        filtered_qs = doc_filter.qs

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(filtered_qs, request, view=self)
        if page is not None:
            serializer = DocumentListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DocumentListSerializer(filtered_qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """GET /api/documents/{id}/"""
        instance = self._get_object_across_models(pk)
        log_document_view(instance, request.user)
        serializer = DocumentDetailSerializer(instance)
        return Response(serializer.data)

    def create(self, request):
        """POST /api/documents/"""
        serializer = DocumentCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        loai = serializer.validated_data.get("loai", LoaiVanBan.DEN)
        nam = serializer.validated_data.get("nam", timezone.now().year)

        extra_kwargs = {
            "nguoi_tao": request.user,
        }

        if str(loai).upper() not in ("MAT", "VANBANMAT"):
            extra_kwargs["so_thu_tu"] = generate_so_thu_tu(loai, nam)

        if str(loai).upper() in ("DEN", "VANBANDEN") and not serializer.validated_data.get("ngay_den"):
            extra_kwargs["ngay_den"] = timezone.now()

        instance = serializer.save(**extra_kwargs)
        handle_attachments(instance, request)

        if (
            instance.hieu_luc == HieuLuc.CON_HIEU_LUC
            and instance.ngay_het_hieu_luc
            and instance.ngay_het_hieu_luc <= timezone.now()
        ):
            instance.hieu_luc = HieuLuc.HET_HIEU_LUC
            instance.save(update_fields=["hieu_luc"])

        auto_update = request.data.get("auto_update_replaced_doc", "true")
        if str(auto_update).lower() in ("true", "1") and instance.link_thay_the:
            sync_replacement_document(instance)

        out_serializer = DocumentDetailSerializer(instance)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        """PATCH /api/documents/{id}/"""
        return self.update(request, pk, partial=True)

    def update(self, request, pk=None, partial=False):
        """PUT /api/documents/{id}/"""
        instance = self._get_object_across_models(pk)
        user = request.user
        is_admin = is_admin_user(user)

        if getattr(instance, "loai", "") == "MAT" and not is_admin and instance.nguoi_tao != user:
            raise PermissionDenied("Văn bản mật chỉ có quyền đọc. Bạn không có quyền chỉnh sửa văn bản này.")

        if not can_edit_document(user, instance):
            raise PermissionDenied("Bạn không có quyền chỉnh sửa văn bản này. Chỉ Quản trị viên, Người tạo hoặc Cán bộ được cấp quyền mới được phép chỉnh sửa.")

        old_link = (instance.link_thay_the or "").strip()
        old_so_hieu = (instance.so_hieu or "").strip()

        serializer = DocumentCreateUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()

        handle_attachments(doc, request)

        if (
            doc.hieu_luc == HieuLuc.CON_HIEU_LUC
            and doc.ngay_het_hieu_luc
            and doc.ngay_het_hieu_luc <= timezone.now()
        ):
            doc.hieu_luc = HieuLuc.HET_HIEU_LUC
            doc.save(update_fields=["hieu_luc"])

        new_link = (doc.link_thay_the or "").strip()
        if old_link and old_link.lower() != new_link.lower():
            cleanup_old_replacement_link(old_link, old_so_hieu)

        auto_update = request.data.get("auto_update_replaced_doc", "true")
        if str(auto_update).lower() in ("true", "1") and doc.link_thay_the:
            sync_replacement_document(doc)

        out_serializer = DocumentDetailSerializer(doc)
        return Response(out_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        """DELETE /api/documents/{id}/"""
        instance = self._get_object_across_models(pk)
        user = request.user
        is_admin = is_admin_user(user)

        if getattr(instance, "loai", "") == "MAT" and not is_admin and instance.nguoi_tao != user:
            raise PermissionDenied("Văn bản mật chỉ có quyền đọc. Bạn không có quyền xóa văn bản này.")

        if not can_delete_document(user, instance):
            raise PermissionDenied("Bạn không có quyền xóa văn bản này. Quyền xóa chỉ dành cho Quản trị viên (Admin) hoặc Cán bộ được phân quyền.")

        cleanup_replacement_links_on_delete(instance)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ───────────────────────────────────────────────────────────────
    # Custom Actions
    # ───────────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="viewers")
    def viewers(self, request, pk=None):
        """GET /api/documents/{id}/viewers/"""
        instance = self._get_object_across_models(pk)
        if request.user and request.user.is_authenticated:
            log_document_view(instance, request.user)

        view_logs = DocumentViewLog.objects.filter(
            document_type=instance.document_kind,
            document_id=instance.pk,
        ).select_related("user").order_by("-viewed_at")

        viewer_filter = ViewerFilter(request.query_params, queryset=view_logs)
        filtered_logs = viewer_filter.qs

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(filtered_logs, request, view=self)
        if page is not None:
            serializer = DocumentViewLogSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = DocumentViewLogSerializer(filtered_logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="template")
    def template(self, request):
        """GET /api/documents/template/?loai=DEN"""
        raw_loai = request.query_params.get("loai") or request.query_params.get("type", "DEN")
        loai = str(raw_loai).strip().upper()

        excel_file = generate_excel_template(loai)
        filename = f"Mau_VanBan_{loai}_{timezone.now().strftime('%Y%m%d')}.xlsx"

        response = HttpResponse(
            excel_file.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser],
    )
    def import_excel(self, request):
        """POST /api/documents/import/"""
        file_obj = request.FILES.get("file")
        raw_loai = request.data.get("loai") or request.data.get("type", "DEN")
        loai = str(raw_loai).strip().upper()

        if not file_obj:
            return Response({"error": "Vui lòng chọn file Excel."}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj.name.endswith((".xlsx", ".xls")):
            return Response({"error": "Chỉ chấp nhận file Excel (.xlsx, .xls)."}, status=status.HTTP_400_BAD_REQUEST)

        result = import_from_excel(file_obj, loai, request.user)
        return Response(
            {
                "message": f"Import thành công {result['created']} văn bản.",
                "created": result["created"],
                "errors": result["errors"],
            },
            status=status.HTTP_201_CREATED if result["created"] > 0 else status.HTTP_400_BAD_REQUEST,
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="import_excel",
        parser_classes=[MultiPartParser],
    )
    def import_excel_alias(self, request):
        return self.import_excel(request)

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """GET /api/documents/export/?loai=DEN"""
        raw_loai = request.query_params.get("loai") or request.query_params.get("type", "DEN")
        loai = str(raw_loai).strip().upper()

        model = get_document_model(loai)
        qs = self._get_queryset_for_model(model)
        filter_cls = get_filter_class_for_model(model)
        doc_filter = filter_cls(request.query_params, queryset=qs)
        filtered_qs = doc_filter.qs

        excel_file = export_to_excel(filtered_qs, loai)
        filename = f"DanhSach_VanBan_{loai}_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"

        response = HttpResponse(
            excel_file.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=["get"], url_path="years")
    def years(self, request):
        """GET /api/documents/years/?loai=DEN"""
        raw_loai = request.query_params.get("loai") or request.query_params.get("type", "DEN")
        model = get_document_model(raw_loai)
        qs = self._get_queryset_for_model(model)
        years = qs.values_list("nam", flat=True).distinct().order_by("-nam")
        return Response(list(years))


# ═══════════════════════════════════════════════════════════════════
# Dedicated ViewSets cho từng Model
# ═══════════════════════════════════════════════════════════════════

class VanBanDenViewSet(viewsets.ModelViewSet):
    """API ViewSet riêng biệt cho Văn bản Đến."""
    queryset = VanBanDen.objects.select_related("nguoi_tao").prefetch_related("attachments", "nguoi_nhan")
    serializer_class = VanBanDenSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DocumentPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = VanBanDenFilter

    def perform_create(self, serializer):
        nam = serializer.validated_data.get("nam", timezone.now().year)
        so_thu_tu = generate_so_thu_tu("DEN", nam)
        ngay_den = serializer.validated_data.get("ngay_den") or timezone.now()
        doc = serializer.save(nguoi_tao=self.request.user, so_thu_tu=so_thu_tu, ngay_den=ngay_den)
        handle_attachments(doc, self.request)


class VanBanDiViewSet(viewsets.ModelViewSet):
    """API ViewSet riêng biệt cho Văn bản Đi."""
    queryset = VanBanDi.objects.select_related("nguoi_tao").prefetch_related("attachments", "nguoi_nhan")
    serializer_class = VanBanDiSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DocumentPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = VanBanDiFilter

    def perform_create(self, serializer):
        nam = serializer.validated_data.get("nam", timezone.now().year)
        so_thu_tu = generate_so_thu_tu("DI", nam)
        ngay_ban_hanh = serializer.validated_data.get("ngay_ban_hanh") or timezone.now()
        doc = serializer.save(nguoi_tao=self.request.user, so_thu_tu=so_thu_tu, ngay_ban_hanh=ngay_ban_hanh)
        handle_attachments(doc, self.request)


class VanBanMatViewSet(viewsets.ModelViewSet):
    """API ViewSet riêng biệt cho Văn bản Mật."""
    serializer_class = VanBanMatSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DocumentPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = VanBanMatFilter

    def get_queryset(self):
        user = self.request.user
        qs = VanBanMat.objects.select_related("nguoi_tao").prefetch_related("attachments", "nguoi_nhan")
        if not user.is_staff:
            qs = qs.filter(Q(nguoi_nhan=user) | Q(nguoi_tao=user)).distinct()
        return qs

    def perform_create(self, serializer):
        doc = serializer.save(nguoi_tao=self.request.user)
        handle_attachments(doc, self.request)
