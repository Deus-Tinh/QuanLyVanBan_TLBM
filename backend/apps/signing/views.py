from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def ping_view(request):
    """GET /api/v1/signing/ping/ — yêu cầu đăng nhập (permission mặc định IsAuthenticated)."""
    return Response({"module": "signing", "status": "ok"})
