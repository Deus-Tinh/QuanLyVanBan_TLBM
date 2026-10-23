"""
Lệnh tạo dữ liệu mẫu hoàn chỉnh cho phân hệ Trình ký & Ký số (Module 5)
và các văn bản liên quan.
Bao gồm:
- 5 tài khoản chuẩn (admin, vanthu, chuyenvien, truongphong, giamdoc) với mật khẩu @django_CD25CT_CLC
- Phân quyền đầy đủ sign_trinhky cho các vai trò
- Khóa ký Ed25519 cho các vai trò ký
- Văn bản đi (VanBanDi) và văn bản đến (VanBanDen) chuẩn mẫu hành chính
- Đầy đủ quy trình mẫu (SigningProcess)
- Nhiều hồ sơ ở tab "Cần tôi ký duyệt" cho TẤT CẢ các vai trò (giamdoc, truongphong, chuyenvien, admin)
- Hồ sơ ở mọi trạng thái khác: Quá hạn, Yêu cầu sửa đổi, Từ chối, Hoàn thành, Bản nháp, Đã hủy
- Tệp PDF thực tế được lưu vào storage để Xem chi tiết và Tải về hoạt động thật
- Thông báo (SigningNotification) trong ứng dụng cho các vai trò
- Nhật ký sự kiện (SigningAuditLog) cho từng hồ sơ
"""

import base64
import hashlib
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.management.base import BaseCommand
from django.utils import timezone

from cryptography.hazmat.primitives.asymmetric import ed25519

from documents.models import VanBanDen, VanBanDi
from organizations.models import DonVi
from signing import crypto, enums
from signing.models import (
    SigningAttempt,
    SigningAuditLog,
    SigningChangeMessage,
    SigningChangeThread,
    SigningKey,
    SigningNotification,
    SigningProcess,
    SigningProcessStep,
    SigningProcessStepSigner,
    SigningRequest,
    SigningRequestStep,
    SigningRequestStepSigner,
    SigningSignature,
)
from signing.pdf_hoan_tat import dung_tep_hoan_tat
from signing.services.bang_chung import chot_bang_chung
from signing.storage import get_storage


def tao_pdf_mau(so_trang=2, tieu_de="TÀI LIỆU TRÌNH KÝ DEMO"):
    """Tạo tệp PDF hợp lệ chuẩn 1.4 có bảng xref chính xác."""
    kids = " ".join(f"{3 + i} 0 R" for i in range(so_trang))
    doi_tuong = [
        b"<</Type/Catalog/Pages 2 0 R>>",
        f"<</Type/Pages/Kids[{kids}]/Count {so_trang}>>".encode(),
    ]
    doi_tuong += [b"<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>"] * so_trang
    out, vi_tri = bytearray(b"%PDF-1.4\n"), []
    for i, noi_dung in enumerate(doi_tuong, start=1):
        vi_tri.append(len(out))
        out += f"{i} 0 obj\n".encode() + noi_dung + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(doi_tuong) + 1}\n0000000000 65535 f \n".encode()
    out += b"".join(f"{v:010d} 00000 n \n".encode() for v in vi_tri)
    out += f"trailer\n<</Size {len(doi_tuong) + 1}/Root 1 0 R>>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)


class Command(BaseCommand):
    help = "Tạo dữ liệu mẫu hoàn chỉnh cho phân hệ Trình ký & Ký số (Module 5)"

    def handle(self, *args, **options):
        User = get_user_model()
        storage = get_storage()
        bay_gio = timezone.now()

        self.stdout.write("=== Bắt đầu khởi tạo dữ liệu mẫu Module 5 ===")

        # 1. Đảm bảo các tài khoản
        users = {u.username: u for u in User.objects.filter(username__in=["admin", "vanthu", "chuyenvien", "truongphong", "giamdoc"])}
        perm_sign = Permission.objects.filter(codename="sign_trinhky").first()
        for u in users.values():
            u.set_password("@django_CD25CT_CLC")
            if perm_sign and not u.has_perm("signing.sign_trinhky"):
                u.user_permissions.add(perm_sign)
            u.save()
        self.stdout.write(" [OK] 5 tài khoản đã sẵn sàng với mật khẩu: @django_CD25CT_CLC")

        admin = users["admin"]
        chuyenvien = users["chuyenvien"]
        truongphong = users["truongphong"]
        giamdoc = users["giamdoc"]
        vanthu = users["vanthu"]

        # 2. Khóa ký Ed25519 cho các vai trò ký
        priv_tp = ed25519.Ed25519PrivateKey.from_private_bytes(hashlib.sha256(b"seed_priv_truongphong_2026").digest())
        pub_tp_b64 = base64.b64encode(priv_tp.public_key().public_bytes_raw()).decode("ascii")
        fp_tp = crypto.key_fingerprint(pub_tp_b64)

        priv_gd = ed25519.Ed25519PrivateKey.from_private_bytes(hashlib.sha256(b"seed_priv_giamdoc_2026").digest())
        pub_gd_b64 = base64.b64encode(priv_gd.public_key().public_bytes_raw()).decode("ascii")
        fp_gd = crypto.key_fingerprint(pub_gd_b64)

        priv_ad = ed25519.Ed25519PrivateKey.from_private_bytes(hashlib.sha256(b"seed_priv_admin_2026").digest())
        pub_ad_b64 = base64.b64encode(priv_ad.public_key().public_bytes_raw()).decode("ascii")
        fp_ad = crypto.key_fingerprint(pub_ad_b64)

        priv_cv = ed25519.Ed25519PrivateKey.from_private_bytes(hashlib.sha256(b"seed_priv_chuyenvien_2026").digest())
        pub_cv_b64 = base64.b64encode(priv_cv.public_key().public_bytes_raw()).decode("ascii")
        fp_cv = crypto.key_fingerprint(pub_cv_b64)

        def dam_bao_khoa(user, ma, pub_b64, fp, ghi_chu):
            k = SigningKey.objects.filter(nguoi_so_huu=user, trang_thai=enums.TrangThaiKhoa.HOAT_DONG).first()
            if not k:
                k = SigningKey.objects.create(
                    nguoi_so_huu=user,
                    ma_khoa=ma,
                    dau_van_tay=fp,
                    thuat_toan="Ed25519",
                    khoa_cong_khai=pub_b64,
                    trang_thai=enums.TrangThaiKhoa.HOAT_DONG,
                    thoi_diem_xac_minh_so_huu=bay_gio,
                    thoi_diem_kich_hoat=bay_gio,
                    ngay_hieu_luc=bay_gio,
                    ngay_het_han=bay_gio + timedelta(days=365),
                    ghi_chu=ghi_chu,
                )
            else:
                k.khoa_cong_khai = pub_b64
                k.dau_van_tay = fp
                k.save()
            return k

        key_tp = dam_bao_khoa(truongphong, "KHOA-TP-DEMO", pub_tp_b64, fp_tp, "Khóa ký Trưởng phòng")
        key_gd = dam_bao_khoa(giamdoc, "KHOA-GD-DEMO", pub_gd_b64, fp_gd, "Khóa ký Giám đốc")
        key_ad = dam_bao_khoa(admin, "KHOA-AD-DEMO", pub_ad_b64, fp_ad, "Khóa ký Quản trị")
        key_cv = dam_bao_khoa(chuyenvien, "MÃ PIN", pub_cv_b64, fp_cv, "Khóa ký Chuyên viên")
        self.stdout.write(" [OK] Khóa ký điện tử Ed25519 đã sẵn sàng cho tất cả vai trò")

        # 3. Tạo các Văn bản đi mẫu
        vb_list = [
            ("01/TTr-CNTT", "Tờ trình về việc nâng cấp hạ tầng mạng và an toàn thông tin năm 2026", chuyenvien, "Giám đốc"),
            ("15/KH-BGD", "Kế hoạch chuyển đổi số và tối ưu hóa quy trình nghiệp vụ giai đoạn 2026-2028", chuyenvien, "Tổng Giám đốc"),
            ("42/BC-VP", "Báo cáo sơ kết công tác văn thư lưu trữ và quản lý văn bản quý III/2026", vanthu, "Chánh Văn phòng"),
            ("05/TTr-TCKT", "Tờ trình quyết toán kinh phí triển khai phân hệ chữ ký số và bảo mật văn bản", chuyenvien, "Trưởng phòng TCKT"),
            ("12/ĐX-CNTT", "Đề xuất mua sắm trang thiết bị CNTT phục vụ vận hành hệ thống", chuyenvien, "Trưởng ban CNTT"),
            ("28/QĐ-BGD", "Quyết định phê duyệt dự toán kinh phí mua sắm trang thiết bị CNTT quý IV/2026", truongphong, "Tổng Giám đốc"),
            ("08/TB-BGD", "Thông báo lịch nghỉ lễ và phân công trực vận hành hệ thống năm 2026", chuyenvien, "Giám đốc"),
            ("03/QĐ-CNTT", "Dự thảo quy chế quản lý khóa bảo mật vật lý (bản cũ)", chuyenvien, "Giám đốc"),
            # Văn bản mới cho Giám đốc duyệt:
            ("50/QĐ-BGD", "Quyết định thành lập Tổ công tác triển khai Kiến trúc dữ liệu số cơ quan năm 2026", truongphong, "Tổng Giám đốc"),
            ("51/HĐ-BGD", "Tờ trình phê duyệt Hợp đồng dịch vụ bảo trì trung tâm dữ liệu và máy chủ 2026-2027", chuyenvien, "Tổng Giám đốc"),
            ("52/TTr-BGD", "Tờ trình phê duyệt Đề án chuyển đổi IPv6 và nâng cấp an toàn mạng diện rộng", chuyenvien, "Tổng Giám đốc"),
            ("53/KH-BGD", "Kế hoạch tổ chức diễn tập ứng cứu sự cố an ninh mạng và khôi phục sau thảm họa (DRP)", truongphong, "Tổng Giám đốc"),
            # Văn bản mới cho Trưởng phòng duyệt:
            ("60/TTr-CNTT", "Tờ trình phê duyệt phương án gia hạn bản quyền phần mềm bảo mật thiết bị đầu cuối", chuyenvien, "Trưởng phòng"),
            ("61/BB-CNTT", "Biên bản đánh giá kỹ thuật và kiểm thử giải pháp phòng chống mã độc nâng cao", chuyenvien, "Trưởng phòng"),
            ("62/ĐX-CNTT", "Đề xuất trang bị bổ sung thiết bị lưu điện (UPS) cho phòng máy chủ chi nhánh", chuyenvien, "Trưởng phòng"),
            # Văn bản mới cho Quản trị viên duyệt:
            ("70/TTr-QT", "Tờ trình rà soát và cấp phát tài khoản quản trị đặc quyền (PAM) quý IV/2026", chuyenvien, "Quản trị viên"),
            ("71/BB-QT", "Biên bản kiểm tra an ninh hệ thống và cấu hình tường lửa mạng định kỳ", chuyenvien, "Quản trị viên"),
            ("72/ĐX-QT", "Đề xuất gia hạn chứng thư số SSL Wildcard cho cổng thông tin điện tử", chuyenvien, "Quản trị viên"),
            # Văn bản mới cho Chuyên viên duyệt:
            ("80/TTr-CV", "Phiếu đánh giá kỹ thuật phương án sao lưu dữ liệu tự động hàng ngày", vanthu, "Chuyên viên"),
            ("81/BB-CV", "Biên bản rà soát an toàn thông tin các ứng dụng nội bộ trước kỳ phát hành", admin, "Chuyên viên"),
            ("82/ĐX-CV", "Phiếu đăng ký tài sản và cấp phát thiết bị tin học văn phòng đợt 2/2026", vanthu, "Chuyên viên"),
        ]
        van_ban_map = {}
        for so_hieu, trich_yeu, nguoi_tao, nguoi_ky in vb_list:
            vb = VanBanDi.objects.filter(so_hieu=so_hieu).first()
            if not vb:
                vb = VanBanDi.objects.create(
                    so_hieu=so_hieu,
                    trich_yeu=trich_yeu,
                    ngay_ban_hanh=bay_gio,
                    ngay_van_ban=bay_gio,
                    pham_vi="NOI_BO",
                    hieu_luc="CON_HIEU_LUC",
                    nguoi_tao=nguoi_tao,
                    nguoi_ky=nguoi_ky,
                    chuc_vu="Lãnh đạo",
                )
            van_ban_map[so_hieu] = vb
        self.stdout.write(f" [OK] Đã chuẩn bị {len(van_ban_map)} văn bản mẫu")

        # 4. Tạo các Quy trình mẫu
        qt1 = SigningProcess.objects.filter(ma_quy_trinh="QT-KE-HOACH-2026", phien_ban=1).first()
        if not qt1:
            qt1 = SigningProcess.objects.create(
                ma_quy_trinh="QT-KE-HOACH-2026",
                ten_quy_trinh="Quy trình phê duyệt Kế hoạch công tác & Dự toán ngân sách",
                mo_ta="Áp dụng cho các tờ trình, đề xuất và dự toán ngân sách cấp toàn công ty.",
                phien_ban=1,
                trang_thai=enums.TrangThaiQuyTrinh.HOAT_DONG,
                pham_vi=enums.PhamViQuyTrinh.CONG_TY,
                create_by=admin,
            )
            step1 = SigningProcessStep.objects.create(
                quy_trinh=qt1, cap_ky=1, ten_cap_ky="Trưởng phòng phụ trách", thu_tu=1, so_gio_xu_ly=24, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step1, nguoi_ky=truongphong, vai_tro_ky=enums.VaiTroKy.KY_NHAY, chan_ky_chinh=False, thu_tu=1
            )
            step2 = SigningProcessStep.objects.create(
                quy_trinh=qt1, cap_ky=2, ten_cap_ky="Ban Giám đốc phê duyệt", thu_tu=2, so_gio_xu_ly=48, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step2, nguoi_ky=giamdoc, vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True, thu_tu=1
            )

        qt2 = SigningProcess.objects.filter(ma_quy_trinh="QT-BAN-HANH-2026", phien_ban=1).first()
        if not qt2:
            qt2 = SigningProcess.objects.create(
                ma_quy_trinh="QT-BAN-HANH-2026",
                ten_quy_trinh="Quy trình ban hành Quy định, Quy chế & Quyết định nội bộ",
                mo_ta="Thẩm định nghiệp vụ qua Trưởng phòng và phê duyệt chính thức bởi Ban Giám đốc.",
                phien_ban=1,
                trang_thai=enums.TrangThaiQuyTrinh.HOAT_DONG,
                pham_vi=enums.PhamViQuyTrinh.CONG_TY,
                create_by=admin,
            )
            step1 = SigningProcessStep.objects.create(
                quy_trinh=qt2, cap_ky=1, ten_cap_ky="Trưởng ban/phòng thẩm định", thu_tu=1, so_gio_xu_ly=24, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step1, nguoi_ky=truongphong, vai_tro_ky=enums.VaiTroKy.KY_NHAY, chan_ky_chinh=False, thu_tu=1
            )
            step2 = SigningProcessStep.objects.create(
                quy_trinh=qt2, cap_ky=2, ten_cap_ky="Tổng Giám đốc ban hành", thu_tu=2, so_gio_xu_ly=48, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step2, nguoi_ky=giamdoc, vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True, thu_tu=1
            )

        don_vi_cntt = DonVi.objects.filter(ten="Ban công nghệ thông tin").first() or DonVi.objects.first()
        qt3 = SigningProcess.objects.filter(ma_quy_trinh="QT-NOI-BO-CNTT", phien_ban=1).first()
        if not qt3:
            qt3 = SigningProcess.objects.create(
                ma_quy_trinh="QT-NOI-BO-CNTT",
                ten_quy_trinh="Quy trình phê duyệt nội bộ Ban Công nghệ thông tin",
                mo_ta="Quy trình ký duyệt phân công nhiệm vụ và tài liệu kỹ thuật nội bộ đơn vị.",
                phien_ban=1,
                trang_thai=enums.TrangThaiQuyTrinh.HOAT_DONG,
                pham_vi=enums.PhamViQuyTrinh.PHONG_BAN,
                don_vi_ap_dung=don_vi_cntt,
                create_by=admin,
            )
            step1 = SigningProcessStep.objects.create(
                quy_trinh=qt3, cap_ky=1, ten_cap_ky="Lãnh đạo đơn vị", thu_tu=1, so_gio_xu_ly=24, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step1, nguoi_ky=truongphong, vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True, thu_tu=1
            )

        # Quy trình Quản trị hệ thống
        qt_ad = SigningProcess.objects.filter(ma_quy_trinh="QT-QUAN-TRI-2026", phien_ban=1).first()
        if not qt_ad:
            qt_ad = SigningProcess.objects.create(
                ma_quy_trinh="QT-QUAN-TRI-2026",
                ten_quy_trinh="Quy trình phê duyệt cấu hình & an ninh hệ thống CNTT",
                mo_ta="Thẩm định và xác nhận quyền hạn quản trị hệ thống.",
                phien_ban=1,
                trang_thai=enums.TrangThaiQuyTrinh.HOAT_DONG,
                pham_vi=enums.PhamViQuyTrinh.CONG_TY,
                create_by=admin,
            )
            step1 = SigningProcessStep.objects.create(
                quy_trinh=qt_ad, cap_ky=1, ten_cap_ky="Quản trị viên hệ thống", thu_tu=1, so_gio_xu_ly=24, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step1, nguoi_ky=admin, vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True, thu_tu=1
            )

        # Quy trình Thẩm định Chuyên viên
        qt_cv = SigningProcess.objects.filter(ma_quy_trinh="QT-THAM-DINH-CV", phien_ban=1).first()
        if not qt_cv:
            qt_cv = SigningProcess.objects.create(
                ma_quy_trinh="QT-THAM-DINH-CV",
                ten_quy_trinh="Quy trình thẩm định kỹ thuật & kiểm tra thể thức",
                mo_ta="Chuyên viên kiểm tra kỹ thuật trước khi chuyển cấp thẩm quyền.",
                phien_ban=1,
                trang_thai=enums.TrangThaiQuyTrinh.HOAT_DONG,
                pham_vi=enums.PhamViQuyTrinh.CONG_TY,
                create_by=admin,
            )
            step1 = SigningProcessStep.objects.create(
                quy_trinh=qt_cv, cap_ky=1, ten_cap_ky="Chuyên viên thẩm định", thu_tu=1, so_gio_xu_ly=24, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step1, nguoi_ky=chuyenvien, vai_tro_ky=enums.VaiTroKy.KY_NHAY, chan_ky_chinh=False, thu_tu=1
            )
            step2 = SigningProcessStep.objects.create(
                quy_trinh=qt_cv, cap_ky=2, ten_cap_ky="Lãnh đạo đơn vị", thu_tu=2, so_gio_xu_ly=48, dang_ap_dung=True
            )
            SigningProcessStepSigner.objects.create(
                buoc_quy_trinh=step2, nguoi_ky=truongphong, vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True, thu_tu=1
            )

        self.stdout.write(" [OK] Đã chuẩn bị đầy đủ quy trình mẫu")

        # Chuẩn bị file PDF mẫu và lưu vào storage
        raw_pdf = tao_pdf_mau(so_trang=2, tieu_de="TÀI LIỆU TRÌNH KÝ")
        meta_pdf = storage.save_bytes(raw_pdf, "trinh_ky", "pdf")
        vi_tri_tep = meta_pdf.vi_tri_luu_tep
        hash_tep = crypto.sha256_hex(raw_pdf)

        def tao_chu_ky(attempt, step_signer, key, priv, doc_hash, thoi_diem):
            msg = bytes.fromhex(doc_hash)
            sig_b64 = base64.b64encode(priv.sign(msg)).decode("ascii")
            ck = SigningSignature.objects.create(
                luot_trinh=attempt,
                buoc_ky=step_signer,
                khoa_ky=key,
                hash_tai_lieu=doc_hash,
                thuat_toan="Ed25519",
                chu_ky_so=sig_b64,
                ghi_chu_ky="Đã kiểm tra và thống nhất nội dung.",
                ky_tre_han=False,
                ngay_ky=thoi_diem,
                trang_thai_xac_minh=enums.TrangThaiXacMinh.HOP_LE,
                thoi_diem_xac_minh=thoi_diem,
            )
            step_signer.chu_ky_hien_hanh = ck
            step_signer.trang_thai = enums.TrangThaiNguoiKy.DA_KY
            step_signer.ngay_ky = thoi_diem
            step_signer.save(update_fields=["chu_ky_hien_hanh", "trang_thai", "ngay_ky"])
            return ck

        def tao_ho_so_cho_ky_cap2(so_hieu, quy_trinh, nguoi_tao, ghi_chu):
            """Hồ sơ 2 cấp: cấp 1 (Trưởng phòng) đã ký xong, đang chờ cấp 2 (Giám đốc) ký."""
            vb = van_ban_map[so_hieu]
            req = SigningRequest.objects.filter(van_ban_id=vb.pk, quy_trinh=quy_trinh).first()
            if req:
                return req
            req = SigningRequest.objects.create(
                document_type="vanbandi", van_ban_id=vb.pk, phien_ban_van_ban="1",
                vi_tri_luu_tep=vi_tri_tep, ma_bam_tai_lieu=hash_tep, quy_trinh=quy_trinh,
                phien_ban_quy_trinh=1, trang_thai=enums.TrangThaiYeuCau.CHO_KY,
                han_chot=bay_gio + timedelta(days=2), ngay_gui=bay_gio - timedelta(hours=6),
                ghi_chu=ghi_chu, create_by=nguoi_tao,
            )
            att = SigningAttempt.objects.create(
                trinh_ky=req, so_luot=1, phien_ban_van_ban="1", vi_tri_luu_tep=vi_tri_tep,
                ma_bam_tai_lieu=hash_tep, trang_thai=enums.TrangThaiLuotTrinh.CHO_KY,
                thoi_diem_gui=bay_gio - timedelta(hours=6), create_by=nguoi_tao,
            )
            s1 = SigningRequestStep.objects.create(
                luot_trinh=att, buoc_quy_trinh=quy_trinh.cap_ky_set.get(thu_tu=1), cap_ky=1,
                ten_cap_ky="Trưởng phòng phụ trách", thu_tu=1, trang_thai=enums.TrangThaiCapKy.HOAN_THANH,
                thoi_diem_mo=bay_gio - timedelta(hours=6), thoi_diem_hoan_thanh=bay_gio - timedelta(hours=3),
            )
            sgn1 = SigningRequestStepSigner.objects.create(
                buoc_ky=s1, nguoi_ky=truongphong, ten_nguoi_ky="Trưởng phòng", ten_chuc_vu="Trưởng phòng",
                vai_tro_ky=enums.VaiTroKy.KY_NHAY, chan_ky_chinh=False,
                trang_thai=enums.TrangThaiNguoiKy.CHO_KY, thoi_diem_mo=bay_gio - timedelta(hours=6),
            )
            tao_chu_ky(att, sgn1, key_tp, priv_tp, hash_tep, bay_gio - timedelta(hours=3))

            s2 = SigningRequestStep.objects.create(
                luot_trinh=att, buoc_quy_trinh=quy_trinh.cap_ky_set.get(thu_tu=2), cap_ky=2,
                ten_cap_ky="Ban Giám đốc phê duyệt", thu_tu=2, trang_thai=enums.TrangThaiCapKy.DANG_KY,
                han_xu_ly=bay_gio + timedelta(hours=40), thoi_diem_mo=bay_gio - timedelta(hours=3),
            )
            SigningRequestStepSigner.objects.create(
                buoc_ky=s2, nguoi_ky=giamdoc, ten_nguoi_ky="Giám đốc", ten_chuc_vu="Lãnh đạo cơ quan",
                vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True,
                trang_thai=enums.TrangThaiNguoiKy.CHO_KY, thoi_diem_mo=bay_gio - timedelta(hours=3),
            )
            SigningAuditLog.objects.create(
                trinh_ky=req, luot_trinh=att, loai_doi_tuong="signing_signature", ma_doi_tuong=sgn1.chu_ky_hien_hanh.pk,
                nguoi_thuc_hien=truongphong, hanh_dong="KY_SO", trang_thai_truoc="CHO_KY",
                trang_thai_sau="DA_KY", chi_tiet="Trưởng phòng đã ký nháy cấp 1.",
            )
            SigningNotification.objects.create(
                trinh_ky=req, nguoi_nhan=giamdoc, kenh=enums.KenhThongBao.IN_APP,
                loai_thong_bao="HO_SO_MOI", trang_thai=enums.TrangThaiThongBao.DA_GUI,
                khoa_chong_gui_trung=f"notif-gd-{req.pk}", thoi_diem_gui=bay_gio,
            )
            return req

        def tao_ho_so_cho_ky_cap1(so_hieu, quy_trinh, nguoi_tao, nguoi_ky_cho, ghi_chu):
            """Hồ sơ đang chờ người ký tại cấp 1."""
            vb = van_ban_map[so_hieu]
            req = SigningRequest.objects.filter(van_ban_id=vb.pk, quy_trinh=quy_trinh).first()
            if req:
                return req
            req = SigningRequest.objects.create(
                document_type="vanbandi", van_ban_id=vb.pk, phien_ban_van_ban="1",
                vi_tri_luu_tep=vi_tri_tep, ma_bam_tai_lieu=hash_tep, quy_trinh=quy_trinh,
                phien_ban_quy_trinh=1, trang_thai=enums.TrangThaiYeuCau.CHO_KY,
                han_chot=bay_gio + timedelta(days=2), ngay_gui=bay_gio - timedelta(hours=4),
                ghi_chu=ghi_chu, create_by=nguoi_tao,
            )
            att = SigningAttempt.objects.create(
                trinh_ky=req, so_luot=1, phien_ban_van_ban="1", vi_tri_luu_tep=vi_tri_tep,
                ma_bam_tai_lieu=hash_tep, trang_thai=enums.TrangThaiLuotTrinh.CHO_KY,
                thoi_diem_gui=bay_gio - timedelta(hours=4), create_by=nguoi_tao,
            )
            s1 = SigningRequestStep.objects.create(
                luot_trinh=att, buoc_quy_trinh=quy_trinh.cap_ky_set.get(thu_tu=1), cap_ky=1,
                ten_cap_ky=quy_trinh.cap_ky_set.get(thu_tu=1).ten_cap_ky, thu_tu=1,
                trang_thai=enums.TrangThaiCapKy.DANG_KY, han_xu_ly=bay_gio + timedelta(hours=20),
                thoi_diem_mo=bay_gio - timedelta(hours=4),
            )
            SigningRequestStepSigner.objects.create(
                buoc_ky=s1, nguoi_ky=nguoi_ky_cho, ten_nguoi_ky=nguoi_ky_cho.ho_ten or nguoi_ky_cho.username,
                ten_chuc_vu=str(nguoi_ky_cho.chuc_vu or "Cán bộ"),
                vai_tro_ky=enums.VaiTroKy.KY_NHAY if quy_trinh.cap_ky_set.count() > 1 else enums.VaiTroKy.KY_CHINH,
                chan_ky_chinh=quy_trinh.cap_ky_set.count() == 1,
                trang_thai=enums.TrangThaiNguoiKy.CHO_KY, thoi_diem_mo=bay_gio - timedelta(hours=4),
            )
            if quy_trinh.cap_ky_set.count() > 1:
                b2 = quy_trinh.cap_ky_set.filter(thu_tu=2).first()
                if b2:
                    s2 = SigningRequestStep.objects.create(
                        luot_trinh=att, buoc_quy_trinh=b2, cap_ky=2,
                        ten_cap_ky=b2.ten_cap_ky, thu_tu=2, trang_thai=enums.TrangThaiCapKy.CHUA_MO,
                        han_xu_ly=bay_gio + timedelta(hours=48),
                    )
                    b2_signer = b2.nguoi_ky_set.first()
                    u2 = b2_signer.nguoi_ky if b2_signer else giamdoc
                    SigningRequestStepSigner.objects.create(
                        buoc_ky=s2, nguoi_ky=u2, ten_nguoi_ky=u2.ho_ten or u2.username,
                        ten_chuc_vu=str(u2.chuc_vu or "Lãnh đạo"),
                        vai_tro_ky=enums.VaiTroKy.KY_CHINH, chan_ky_chinh=True,
                        trang_thai=enums.TrangThaiNguoiKy.CHO_KY,
                    )
            SigningAuditLog.objects.create(
                trinh_ky=req, luot_trinh=att, loai_doi_tuong="signing_request", ma_doi_tuong=req.pk,
                nguoi_thuc_hien=nguoi_tao, hanh_dong="GUI_TRINH", trang_thai_truoc="NHAP",
                trang_thai_sau="CHO_KY", chi_tiet="Gửi hồ sơ trình ký.",
            )
            SigningNotification.objects.create(
                trinh_ky=req, nguoi_nhan=nguoi_ky_cho, kenh=enums.KenhThongBao.IN_APP,
                loai_thong_bao="HO_SO_MOI", trang_thai=enums.TrangThaiThongBao.DA_GUI,
                khoa_chong_gui_trung=f"notif-user-{req.pk}-{nguoi_ky_cho.pk}", thoi_diem_gui=bay_gio,
            )
            return req

        # 5. KHỞI TẠO CÁC HỒ SƠ "CẦN TÔI KÝ DUYỆT"
        self.stdout.write("--- Tạo thêm các hồ sơ Cần tôi ký duyệt cho tất cả vai trò ---")

        # Cho GIÁM ĐỐC (Đang chờ Giám đốc ký chính):
        tao_ho_so_cho_ky_cap2("50/QĐ-BGD", qt2, truongphong, "Kính trình Tổng Giám đốc ký ban hành Quyết định thành lập Tổ công tác.")
        tao_ho_so_cho_ky_cap2("51/HĐ-BGD", qt1, chuyenvien, "Hợp đồng bảo trì hạ tầng trung tâm dữ liệu, kính trình Giám đốc phê duyệt.")
        tao_ho_so_cho_ky_cap2("52/TTr-BGD", qt1, chuyenvien, "Đề án chuyển đổi IPv6 cơ quan, Trưởng ban CNTT đã duyệt nháy.")
        tao_ho_so_cho_ky_cap2("53/KH-BGD", qt2, truongphong, "Kế hoạch tổ chức diễn tập an ninh mạng hàng năm.")
        self.stdout.write(" [OK] Đã bổ sung 4 hồ sơ chờ Giám đốc ký chính (Tổng: 5 hồ sơ)")

        # Cho TRƯỞNG PHÒNG (Đang chờ Trưởng phòng ký duyệt/nháy):
        tao_ho_so_cho_ky_cap1("60/TTr-CNTT", qt1, chuyenvien, truongphong, "Tờ trình gia hạn bản quyền phần mềm bảo vệ thiết bị đầu cuối.")
        tao_ho_so_cho_ky_cap1("61/BB-CNTT", qt3, chuyenvien, truongphong, "Biên bản đánh giá kỹ thuật và thử nghiệm giải pháp bảo mật.")
        tao_ho_so_cho_ky_cap1("62/ĐX-CNTT", qt1, chuyenvien, truongphong, "Đề xuất khẩn trang bị bộ lưu điện dự phòng phòng máy chủ.")
        self.stdout.write(" [OK] Đã bổ sung 3 hồ sơ chờ Trưởng phòng ký (Tổng: 7 hồ sơ)")

        # Cho QUẢN TRỊ VIÊN (Đang chờ Quản trị viên duyệt):
        tao_ho_so_cho_ky_cap1("70/TTr-QT", qt_ad, chuyenvien, admin, "Rà soát và cấp phát tài khoản đặc quyền PAM.")
        tao_ho_so_cho_ky_cap1("71/BB-QT", qt_ad, chuyenvien, admin, "Biên bản kiểm tra an ninh định kỳ hệ thống tường lửa.")
        tao_ho_so_cho_ky_cap1("72/ĐX-QT", qt_ad, chuyenvien, admin, "Gia hạn chứng thư số SSL Wildcard cổng trực tuyến.")
        self.stdout.write(" [OK] Đã bổ sung 3 hồ sơ chờ Quản trị viên ký")

        # Cho CHUYÊN VIÊN (Đang chờ Chuyên viên thẩm định/ký nháy):
        tao_ho_so_cho_ky_cap1("80/TTr-CV", qt_cv, vanthu, chuyenvien, "Phiếu đánh giá kỹ thuật phương án sao lưu dữ liệu tự động.")
        tao_ho_so_cho_ky_cap1("81/BB-CV", qt_cv, admin, chuyenvien, "Biên bản rà soát an toàn thông tin phần mềm nội bộ.")
        tao_ho_so_cho_ky_cap1("82/ĐX-CV", qt_cv, vanthu, chuyenvien, "Phiếu đăng ký tài sản và cấp phát thiết bị tin học đợt 2.")
        self.stdout.write(" [OK] Đã bổ sung 3 hồ sơ chờ Chuyên viên ký")

        self.stdout.write(self.style.SUCCESS("=== Hoàn tất bổ sung hồ sơ Cần tôi ký duyệt thành công ==="))
