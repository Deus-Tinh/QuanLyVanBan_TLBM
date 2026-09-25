"""
API Views cho Module Văn Bản.

Endpoints:
- CRUD:      /api/documents/                    (Base CRUD — phối hợp Kiệt)
- Viewers:   /api/documents/{id}/viewers/       (Đô)
- Template:  /api/documents/template/           (Đô)
- Import:    /api/documents/import/             (Đô)
- Export:    /api/documents/export/             (Đô)
"""

from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .filters import DocumentFilter, ViewerFilter
from .models import Document, DocumentAttachment, DocumentViewLog
from .serializers import (
    DocumentCreateUpdateSerializer,
    DocumentDetailSerializer,
    DocumentListSerializer,
    DocumentViewLogSerializer,
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
# Document ViewSet — CRUD + Custom Actions
# ═══════════════════════════════════════════════════════════════════

class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint cho quản lý Văn bản (Đến / Đi / Mật).

    List:   GET    /api/documents/?loai=DEN&q=...&nam=...
    Create: POST   /api/documents/
    Detail: GET    /api/documents/{id}/
    Update: PUT    /api/documents/{id}/
    Patch:  PATCH  /api/documents/{id}/
    Delete: DELETE /api/documents/{id}/

    Custom:
    - GET    /api/documents/{id}/viewers/    → Danh sách người đã xem
    - GET    /api/documents/template/        → Tải file Excel mẫu
    - POST   /api/documents/import/          → Import từ Excel
    - GET    /api/documents/export/          → Xuất danh sách ra Excel
    """

    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DocumentPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = DocumentFilter
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        """
        QuerySet với phân quyền VB Mật.
        - VB Đến/Đi: Tất cả CBNV đều xem được.
        - VB Mật: Chỉ người tạo, người nhận, hoặc admin mới thấy.
        """
        # Tự động quét và cập nhật các văn bản đã quá ngày hết hiệu lực
        check_and_update_expired_documents()

        qs = Document.objects.select_related("nguoi_tao").prefetch_related(
            "attachments", "nguoi_nhan"
        )

        user = self.request.user

        # Phân quyền Văn bản Mật: CHỈ người tạo hoặc người nhận được chỉ định đích danh mới được xem
        if not user.is_staff:
            from django.db.models import Q

            # Áp dụng cho mọi query: VB Mật luôn được bảo vệ, người ngoài không thể thấy
            qs = qs.filter(
                ~Q(loai=Document.LoaiVanBan.MAT)
                | Q(nguoi_nhan=user)
                | Q(nguoi_tao=user)
            ).distinct()

        return qs

    def get_serializer_class(self):
        """Chọn serializer phù hợp theo action."""
        if self.action == "list":
            return DocumentListSerializer
        elif self.action in ("create", "update", "partial_update"):
            return DocumentCreateUpdateSerializer
        return DocumentDetailSerializer

    def perform_create(self, serializer):
        """
        Xử lý tạo mới văn bản:
        1. Gán nguoi_tao từ request.user
        2. Tự sinh so_thu_tu (nếu VB Đến/Đi)
        3. Tự gán ngay_den cho VB Đến (nếu chưa truyền)
        """
        loai = serializer.validated_data.get("loai")
        nam = serializer.validated_data.get("nam", timezone.now().year)

        # Tự sinh số thứ tự
        so_thu_tu = generate_so_thu_tu(loai, nam)

        extra_kwargs = {
            "nguoi_tao": self.request.user,
            "so_thu_tu": so_thu_tu,
        }

        # VB Đến: tự gán ngày đến nếu chưa có
        if loai == Document.LoaiVanBan.DEN and not serializer.validated_data.get("ngay_den"):
            extra_kwargs["ngay_den"] = timezone.now()

        doc = serializer.save(**extra_kwargs)

        # Xử lý file đính kèm (nếu có)
        self._handle_attachments(doc)

        # Nếu có ngày hết hiệu lực trong quá khứ, tự động chuyển sang HET_HIEU_LUC
        if (
            doc.hieu_luc == Document.HieuLuc.CON_HIEU_LUC
            and doc.ngay_het_hieu_luc
            and doc.ngay_het_hieu_luc <= timezone.now()
        ):
            doc.hieu_luc = Document.HieuLuc.HET_HIEU_LUC
            doc.save(update_fields=["hieu_luc"])

        # Tự động đồng bộ quan hệ văn bản thay thế 2 chiều
        auto_update = self.request.data.get("auto_update_replaced_doc", "true")
        if str(auto_update).lower() in ("true", "1") and doc.link_thay_the:
            self._sync_replacement_document(doc)

    def _is_admin_user(self, user):
        """
        Kiểm tra người dùng có quyền Quản trị viên (Admin) hay không:
        - Là superuser hoặc staff của Django
        - Hoặc có StaffProfile với role='admin'
        """
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser:
            return True
        profile = getattr(user, "profile", None)
        if profile and profile.role == "admin":
            return True
        return False

    def _can_edit_document(self, user, instance):
        """
        Kiểm tra quyền chỉnh sửa văn bản (Lựa chọn 2 + Mở rộng tương lai):
        - Quản trị viên (Admin)
        - Người trực tiếp tạo văn bản (nguoi_tao == user)
        - Hoặc Cán bộ đặc biệt được admin cấp quyền/duyệt (qua Django permission documents.change_document)
        """
        if not user or not user.is_authenticated:
            return False
        if self._is_admin_user(user):
            return True
        if instance.nguoi_tao == user:
            return True
        if user.has_perm("documents.change_document"):
            return True
        return False

    def _can_delete_document(self, user, instance):
        """
        Kiểm tra quyền xóa văn bản (Lựa chọn 2 + Mở rộng tương lai):
        - Quản trị viên (Admin)
        - Hoặc Cán bộ đặc biệt được admin cấp quyền/duyệt (qua Django permission documents.delete_document)
        """
        if not user or not user.is_authenticated:
            return False
        if self._is_admin_user(user):
            return True
        if user.has_perm("documents.delete_document"):
            return True
        return False

    def perform_update(self, serializer):
        """
        Xử lý cập nhật:
        1. Phân quyền: Quản trị viên, Người tạo, hoặc Cán bộ được phân quyền mới được phép sửa.
           Nếu là Văn bản Mật: Người nhận chỉ có quyền đọc.
        2. so_thu_tu không được sửa (read_only trong serializer).
        """
        instance = self.get_object()
        user = self.request.user
        is_admin = self._is_admin_user(user)

        if instance.loai == Document.LoaiVanBan.MAT and not is_admin and instance.nguoi_tao != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Văn bản mật chỉ có quyền đọc. Bạn không có quyền chỉnh sửa văn bản này.")

        if not self._can_edit_document(user, instance):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn không có quyền chỉnh sửa văn bản này. Chỉ Quản trị viên, Người tạo hoặc Cán bộ được cấp quyền mới được phép chỉnh sửa.")

        old_link = (instance.link_thay_the or "").strip()
        old_so_hieu = (instance.so_hieu or "").strip()

        doc = serializer.save()
        self._handle_attachments(doc)

        # Nếu có ngày hết hiệu lực trong quá khứ, tự động chuyển sang HET_HIEU_LUC
        if (
            doc.hieu_luc == Document.HieuLuc.CON_HIEU_LUC
            and doc.ngay_het_hieu_luc
            and doc.ngay_het_hieu_luc <= timezone.now()
        ):
            doc.hieu_luc = Document.HieuLuc.HET_HIEU_LUC
            doc.save(update_fields=["hieu_luc"])

        # Nếu link_thay_the cũ bị xóa hoặc thay đổi, dọn dẹp văn bản cũ
        new_link = (doc.link_thay_the or "").strip()
        if old_link and old_link.lower() != new_link.lower():
            self._cleanup_old_replacement_link(old_link, old_so_hieu)

        # Tự động đồng bộ quan hệ văn bản thay thế 2 chiều
        auto_update = self.request.data.get("auto_update_replaced_doc", "true")
        if str(auto_update).lower() in ("true", "1") and doc.link_thay_the:
            self._sync_replacement_document(doc)

    def perform_destroy(self, instance):
        """
        Xử lý xóa:
        1. Phân quyền: Chỉ Quản trị viên (Admin) hoặc Cán bộ được phân quyền mới có quyền xóa.
        2. Tự động dọn dẹp quan hệ thay thế 2 chiều:
           - Khôi phục trạng thái CON_HIEU_LUC cho văn bản từng bị instance thay thế.
           - Xóa bỏ link_thay_the trỏ tới instance trên các văn bản liên quan.
        """
        user = self.request.user
        is_admin = self._is_admin_user(user)

        if instance.loai == Document.LoaiVanBan.MAT and not is_admin and instance.nguoi_tao != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Văn bản mật chỉ có quyền đọc. Bạn không có quyền xóa văn bản này.")

        if not self._can_delete_document(user, instance):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn không có quyền xóa văn bản này. Quyền xóa chỉ dành cho Quản trị viên (Admin) hoặc Cán bộ được phân quyền.")

        # Tự động dọn dẹp và khôi phục văn bản liên quan trước khi xóa
        self._cleanup_replacement_links_on_delete(instance)

        instance.delete()

    def _cleanup_replacement_links_on_delete(self, instance):
        """
        Dọn dẹp và khôi phục văn bản liên quan khi văn bản bị xóa:
        - Các văn bản có link_thay_the trỏ tới instance.so_hieu:
          + Xóa link_thay_the
          + Khôi phục trạng thái CON_HIEU_LUC nếu đang là HET_VA_THAY_THE
        - Văn bản mà instance trỏ tới qua instance.link_thay_the:
          + Nếu có link trỏ ngược lại instance thì cũng xóa link và khôi phục
        """
        from django.db.models import Q

        so_hieu = (instance.so_hieu or "").strip()
        link_target = (instance.link_thay_the or "").strip()

        now = timezone.now()
        query = Q()
        if so_hieu:
            query |= Q(link_thay_the__iexact=so_hieu)
        if link_target:
            query |= Q(so_hieu__iexact=link_target)

        if not query:
            return

        related_docs = Document.objects.filter(query).exclude(pk=instance.pk)
        for doc in related_docs:
            updated_fields = []
            if so_hieu and doc.link_thay_the and doc.link_thay_the.strip().lower() == so_hieu.lower():
                doc.link_thay_the = ""
                updated_fields.append("link_thay_the")

            if doc.hieu_luc == Document.HieuLuc.HET_VA_THAY_THE:
                doc.hieu_luc = Document.HieuLuc.CON_HIEU_LUC
                doc.ngay_het_hieu_luc = None
                if "ngay_het_hieu_luc" not in updated_fields:
                    updated_fields.append("ngay_het_hieu_luc")
                if "hieu_luc" not in updated_fields:
                    updated_fields.append("hieu_luc")

            if updated_fields:
                doc.save(update_fields=updated_fields)

    def _cleanup_old_replacement_link(self, old_target_so_hieu, current_so_hieu):
        """
        Dọn dẹp quan hệ thay thế cũ khi văn bản sửa đổi/xóa link_thay_the.
        """
        if not old_target_so_hieu:
            return

        from django.db.models import Q

        old_docs = Document.objects.filter(
            Q(so_hieu__iexact=old_target_so_hieu) | Q(link_thay_the__iexact=current_so_hieu)
        )
        for doc in old_docs:
            updated_fields = []
            if current_so_hieu and doc.link_thay_the and doc.link_thay_the.strip().lower() == current_so_hieu.lower():
                doc.link_thay_the = ""
                updated_fields.append("link_thay_the")
            if doc.hieu_luc == Document.HieuLuc.HET_VA_THAY_THE:
                doc.hieu_luc = Document.HieuLuc.CON_HIEU_LUC
                doc.ngay_het_hieu_luc = None
                if "ngay_het_hieu_luc" not in updated_fields:
                    updated_fields.append("ngay_het_hieu_luc")
                if "hieu_luc" not in updated_fields:
                    updated_fields.append("hieu_luc")
            if updated_fields:
                doc.save(update_fields=updated_fields)

    def _sync_replacement_document(self, doc):
        """
        Đồng bộ quan hệ thay thế 2 chiều:
        Nếu văn bản này có link_thay_the và auto_update_replaced_doc != False:
        - Tìm văn bản đối ứng trong CSDL theo so_hieu.
        - Nếu doc đang là CON_HIEU_LUC: doc là văn bản mới thay thế cho văn bản cũ
          -> Cập nhật văn bản cũ: hieu_luc = HET_VA_THAY_THE, link_thay_the = doc.so_hieu,
             ngay_het_hieu_luc = doc.ngay_van_ban hoặc doc.ngay_den hoặc timezone.now().
        - Nếu doc đang là HET_VA_THAY_THE: doc là văn bản cũ bị thay thế bởi văn bản mới
          -> Cập nhật văn bản mới: link_thay_the = doc.so_hieu (nếu chưa có).
        """
        raw_target = (doc.link_thay_the or "").strip()
        if not raw_target:
            return

        other_doc = Document.objects.filter(so_hieu__iexact=raw_target).exclude(pk=doc.pk).first()
        if not other_doc:
            return

        now = timezone.now()
        effective_date = doc.ngay_van_ban or doc.ngay_den or doc.ngay_ban_hanh or now

        if doc.hieu_luc == Document.HieuLuc.CON_HIEU_LUC:
            other_doc.hieu_luc = Document.HieuLuc.HET_VA_THAY_THE
            other_doc.link_thay_the = doc.so_hieu
            other_doc.ngay_het_hieu_luc = effective_date
            other_doc.save(update_fields=["hieu_luc", "link_thay_the", "ngay_het_hieu_luc"])
        elif doc.hieu_luc == Document.HieuLuc.HET_VA_THAY_THE:
            other_doc.link_thay_the = doc.so_hieu
            other_doc.save(update_fields=["link_thay_the"])

    def _handle_attachments(self, document):
        """Upload file đính kèm từ request.FILES."""
        files = self.request.FILES.getlist("files")
        for f in files:
            DocumentAttachment.objects.create(
                document=document,
                file=f,
                file_name=f.name,
                file_size=f.size,
            )

    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/documents/{id}/
        Ghi log người xem khi truy cập chi tiết.
        """
        instance = self.get_object()
        log_document_view(instance, request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    # ───────────────────────────────────────────────────────────────
    # Custom Actions — Đô's endpoints (Tất cả URL bằng Tiếng Anh)
    # ───────────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"], url_path="viewers")
    def viewers(self, request, pk=None):
        """
        GET /api/documents/{id}/viewers/?search=...&don_vi=...
        GET /api/documents/{id}/viewers/?name=...&department=... (English alias)

        Trả về danh sách người đã xem văn bản.
        Hỗ trợ tìm kiếm theo tên (search/name) và phòng ban (don_vi/department).
        """
        document = self.get_object()

        view_logs = DocumentViewLog.objects.filter(
            document=document
        ).select_related("user").order_by("-viewed_at")

        # Áp dụng bộ lọc
        viewer_filter = ViewerFilter(request.query_params, queryset=view_logs)
        filtered_logs = viewer_filter.qs

        # Phân trang
        page = self.paginate_queryset(filtered_logs)
        if page is not None:
            serializer = DocumentViewLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DocumentViewLogSerializer(filtered_logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="template")
    def template(self, request):
        """
        GET /api/documents/template/?loai=DEN
        GET /api/documents/template/?type=den (English alias)

        Tải file Excel mẫu được sinh trực tiếp từ cấu hình DB.
        Khớp 100% với CSDL, không bao giờ lo lệch cột.
        """
        raw_loai = request.query_params.get("loai") or request.query_params.get("type", Document.LoaiVanBan.DEN)
        loai = str(raw_loai).strip().upper()

        if loai not in dict(Document.LoaiVanBan.choices):
            return Response(
                {"error": f"Loại văn bản không hợp lệ: {loai}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        excel_file = generate_excel_template(loai)
        loai_display = dict(Document.LoaiVanBan.choices).get(loai, loai)
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
        """
        POST /api/documents/import/
        Body: file (Excel .xlsx), loai / type (DEN/DI/MAT)

        Import dữ liệu văn bản từ file Excel theo mẫu.
        """
        file_obj = request.FILES.get("file")
        raw_loai = request.data.get("loai") or request.data.get("type", Document.LoaiVanBan.DEN)
        loai = str(raw_loai).strip().upper()

        if not file_obj:
            return Response(
                {"error": "Vui lòng chọn file Excel."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not file_obj.name.endswith((".xlsx", ".xls")):
            return Response(
                {"error": "Chỉ chấp nhận file Excel (.xlsx, .xls)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if loai not in dict(Document.LoaiVanBan.choices):
            return Response(
                {"error": f"Loại văn bản không hợp lệ: {loai}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
        """Alias cho POST /api/documents/import/ để hỗ trợ cả 2 định dạng URL."""
        return self.import_excel(request)

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """
        GET /api/documents/export/?loai=DEN&nam=2026&q=...
        GET /api/documents/export/?type=den&year=2026&keyword=... (English alias)

        Xuất danh sách văn bản ra file Excel theo bộ lọc hiện tại.
        """
        raw_loai = request.query_params.get("loai") or request.query_params.get("type", Document.LoaiVanBan.DEN)
        loai = str(raw_loai).strip().upper()

        if loai not in dict(Document.LoaiVanBan.choices):
            return Response(
                {"error": f"Loại văn bản không hợp lệ: {loai}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Dùng lại bộ lọc của DocumentFilter
        queryset = self.get_queryset()
        doc_filter = DocumentFilter(request.query_params, queryset=queryset)
        filtered_qs = doc_filter.qs

        excel_file = export_to_excel(filtered_qs, loai)
        loai_display = dict(Document.LoaiVanBan.choices).get(loai, loai)
        filename = f"DanhSach_VanBan_{loai}_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"

        response = HttpResponse(
            excel_file.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=["get"], url_path="years")
    def years(self, request):
        """
        GET /api/documents/years/?loai=DEN
        Lấy danh sách các năm thực tế có văn bản trong cơ sở dữ liệu.
        """
        raw_loai = request.query_params.get("loai") or request.query_params.get("type")
        qs = self.get_queryset()
        if raw_loai:
            qs = qs.filter(loai=str(raw_loai).strip().upper())
        years = qs.values_list("nam", flat=True).distinct().order_by("-nam")
        return Response(list(years))

