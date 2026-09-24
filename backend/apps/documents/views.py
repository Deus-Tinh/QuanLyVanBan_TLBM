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

    def perform_update(self, serializer):
        """
        Xử lý cập nhật:
        1. VB Mật CHỈ CÓ QUYỀN ĐỌC đối với người nhận được chỉ định.
           Chỉ người tạo (nguoi_tao) hoặc admin (is_staff) mới được sửa.
        2. so_thu_tu không được sửa (read_only trong serializer).
        """
        instance = self.get_object()
        user = self.request.user
        if instance.loai == Document.LoaiVanBan.MAT and not user.is_staff and instance.nguoi_tao != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Văn bản mật chỉ có quyền đọc. Bạn không có quyền chỉnh sửa văn bản này.")

        doc = serializer.save()
        self._handle_attachments(doc)

    def perform_destroy(self, instance):
        """
        Xử lý xóa:
        VB Mật CHỈ CÓ QUYỀN ĐỌC đối với người nhận được chỉ định.
        Chỉ người tạo (nguoi_tao) hoặc admin (is_staff) mới được xóa.
        """
        user = self.request.user
        if instance.loai == Document.LoaiVanBan.MAT and not user.is_staff and instance.nguoi_tao != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Văn bản mật chỉ có quyền đọc. Bạn không có quyền xóa văn bản này.")

        instance.delete()

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

