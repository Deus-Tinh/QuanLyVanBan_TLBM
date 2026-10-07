import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  ResourceItem,
  ResourceCategory,
  ResourceType,
} from '@app-types/resource';
import { ResourceTable } from '@components/resources/ResourceTable';
import { ResourceDetailModal } from '@components/resources/ResourceDetailModal';
import { ResourceFormModal, ResourceFormData } from '@components/resources/ResourceFormModal';
import { CategoryManagementModal } from '@components/resources/CategoryManagementModal';
import { Button } from '@components/common/Button';
import { useTranslation } from '@i18n/translate';
import LanguageSwitcher from '@components/layout/LanguageSwitcher';

// ============================================================================
// DỮ LIỆU MẪU CHUẨN ĐẶC TẢ TỪ THẦY HƯỚNG DẪN (IMAGE 1 & IMAGE 2)
// Cấp 1: Tài liệu chung | Hồ sơ Ban Nhân sự | Hồ sơ Bảo Long Bến Thành | Đơn vị PB cấp 2
// Cấp 2: Tài liệu bảo hiểm | Biểu mẫu bảo hiểm | Tờ trình | Quy định | ...
// ============================================================================
const initialMockCategories: ResourceCategory[] = [
  {
    id: 1,
    stt_uu_tien: 1,
    ten_tai_lieu: 'Tài liệu, Biểu mẫu chung',
    ky_hieu: 'TLBM-CHUNG',
    nguoi_lap_name: 'Thượng Mạnh Quỳnh',
    ngay_lap: '2026-01-02',
    ghi_chu: 'Toàn bộ quy chế, văn bản biểu mẫu áp dụng chung toàn Tổng công ty Bảo Long',
  },
  {
    id: 2,
    stt_uu_tien: 2,
    ten_tai_lieu: 'Hồ sơ Ban Nhân sự',
    ky_hieu: 'HS-BNS',
    nguoi_lap_name: 'Huỳnh Thị Kim Trang',
    ngay_lap: '2026-01-05',
    ghi_chu: 'Hồ sơ quản trị nhân sự, quy trình tuyển dụng và chế độ chính sách',
  },
  {
    id: 3,
    stt_uu_tien: 3,
    ten_tai_lieu: 'Hồ sơ Bảo Long Bến Thành',
    ky_hieu: 'HS-BLBT',
    nguoi_lap_name: 'Nguyễn Chí Tín',
    ngay_lap: '2026-01-10',
    ghi_chu: 'Hồ sơ tài liệu nghiệp vụ chi nhánh Bảo Long Bến Thành',
  },
  {
    id: 4,
    stt_uu_tien: 4,
    ten_tai_lieu: 'Các đơn vị phòng ban cấp 2',
    ky_hieu: 'DV-PB2',
    nguoi_lap_name: 'Đỗ Trung Phong',
    ngay_lap: '2026-01-12',
    ghi_chu: 'Tài liệu hành chính lưu hành nội bộ phòng ban đơn vị thành viên cấp 2',
  },
  {
    id: 5,
    stt_uu_tien: 5,
    ten_tai_lieu: 'Ban Tài chính - Kế toán',
    ky_hieu: 'HS-TCKT',
    nguoi_lap_name: 'Trần Minh Hoàng',
    ngay_lap: '2026-01-15',
    ghi_chu: 'Quy trình tài chính, chứng từ thanh toán và quyết toán ngân sách',
  },
  {
    id: 6,
    stt_uu_tien: 6,
    ten_tai_lieu: 'Ban Giám định & Bồi thường',
    ky_hieu: 'HS-GDBT',
    nguoi_lap_name: 'Lê Thanh Thảo',
    ngay_lap: '2026-01-18',
    ghi_chu: 'Hồ sơ thẩm định hiện trường và quy trình giải quyết chi trả bảo hiểm',
  },
  {
    id: 7,
    stt_uu_tien: 7,
    ten_tai_lieu: 'Ban Công nghệ Thông tin',
    ky_hieu: 'HS-CNTT',
    nguoi_lap_name: 'Phạm Đức Anh',
    ngay_lap: '2026-01-20',
    ghi_chu: 'Chính sách an toàn thông tin, bảo mật dữ liệu và hạ tầng mạng',
  },
  {
    id: 8,
    stt_uu_tien: 8,
    ten_tai_lieu: 'Ban Pháp chế & Kiểm soát nội bộ',
    ky_hieu: 'HS-PCKS',
    nguoi_lap_name: 'Võ Thị Hồng Nhung',
    ngay_lap: '2026-01-22',
    ghi_chu: 'Hồ sơ kiểm toán nội bộ, rà soát pháp lý và phòng chống gian lận',
  },
];

const initialMockTypes: ResourceType[] = [
  // Cấp 2 thuộc Cấp 1 = 1 (Tài liệu, Biểu mẫu chung)
  { id: 1, dm_tai_lieu: 1, ten_loai: 'Tài liệu bảo hiểm', is_public: true, ghi_chu: 'Tài liệu quy tắc và biểu phí bảo hiểm' },
  { id: 2, dm_tai_lieu: 1, ten_loai: 'Biểu mẫu bảo hiểm', is_public: true, ghi_chu: 'Mẫu đơn yêu cầu bảo hiểm và phụ lục' },
  { id: 3, dm_tai_lieu: 1, ten_loai: 'Tờ trình', is_public: true, ghi_chu: 'Mẫu tờ trình phê duyệt công việc' },
  { id: 4, dm_tai_lieu: 1, ten_loai: 'Quy định', is_public: true, ghi_chu: 'Quy định nội bộ và an toàn thông tin' },
  { id: 5, dm_tai_lieu: 1, ten_loai: 'Quy chế quản trị', is_public: true, ghi_chu: 'Quy chế tài chính và chi tiêu nội bộ' },
  { id: 6, dm_tai_lieu: 1, ten_loai: 'Dự thảo nội bộ (Chưa công bố)', is_public: false, ghi_chu: 'Đang thử nghiệm, chỉ quản trị viên nhìn thấy (đổi màu)' },

  // Cấp 2 thuộc Cấp 1 = 2 (Hồ sơ Ban Nhân sự)
  { id: 7, dm_tai_lieu: 2, ten_loai: 'Hồ sơ tuyển dụng & HĐLĐ', is_public: true, ghi_chu: 'Mẫu đánh giá ứng viên và hợp đồng' },
  { id: 8, dm_tai_lieu: 2, ten_loai: 'Quyết định bổ nhiệm & Khen thưởng', is_public: true, ghi_chu: 'Mẫu quyết định nhân sự' },
  { id: 12, dm_tai_lieu: 2, ten_loai: 'Đánh giá KPI & Hiệu suất', is_public: true, ghi_chu: 'Mẫu đánh giá hoàn thành nhiệm vụ định kỳ' },
  { id: 13, dm_tai_lieu: 2, ten_loai: 'Quy chế tiền lương & Phúc lợi', is_public: true, ghi_chu: 'Chính sách đãi ngộ và phụ cấp nhân viên' },

  // Cấp 2 thuộc Cấp 1 = 3 (Hồ sơ Bảo Long Bến Thành)
  { id: 9, dm_tai_lieu: 3, ten_loai: 'Báo cáo doanh số chi nhánh', is_public: true, ghi_chu: 'Báo cáo định kỳ Bến Thành' },
  { id: 10, dm_tai_lieu: 3, ten_loai: 'Hồ sơ giám định & Bồi thường', is_public: true, ghi_chu: 'Hồ sơ giải quyết khiếu nại bồi thường' },
  { id: 14, dm_tai_lieu: 3, ten_loai: 'Kế hoạch kinh doanh khu vực', is_public: true, ghi_chu: 'Mục tiêu khai thác doanh số quý và năm' },
  { id: 15, dm_tai_lieu: 3, ten_loai: 'Hồ sơ đại lý & Mạng lưới Bến Thành', is_public: true, ghi_chu: 'Quản lý thông tin hợp đồng đại lý' },

  // Cấp 2 thuộc Cấp 1 = 4 (Các đơn vị phòng ban cấp 2)
  { id: 11, dm_tai_lieu: 4, ten_loai: 'Biên bản họp phòng ban', is_public: true, ghi_chu: 'Mẫu biên bản tổng kết tuần/tháng' },
  { id: 16, dm_tai_lieu: 4, ten_loai: 'Đề xuất trang thiết bị văn phòng', is_public: true, ghi_chu: 'Phiếu đề xuất mua sắm tài sản cố định' },
  { id: 17, dm_tai_lieu: 4, ten_loai: 'Kế hoạch công tác tuần/tháng', is_public: true, ghi_chu: 'Lịch làm việc và phân công nhiệm vụ' },

  // Cấp 2 thuộc Cấp 1 = 5 (Ban Tài chính - Kế toán)
  { id: 18, dm_tai_lieu: 5, ten_loai: 'Biểu mẫu thanh quyết toán & Hoàn ứng', is_public: true, ghi_chu: 'Mẫu đề nghị thanh toán và bảng kê hóa đơn' },
  { id: 19, dm_tai_lieu: 5, ten_loai: 'Quy trình tạm ứng ngân sách', is_public: true, ghi_chu: 'Hồ sơ đề nghị và hạn mức tạm ứng' },
  { id: 20, dm_tai_lieu: 5, ten_loai: 'Báo cáo tài chính & Kiểm toán', is_public: true, ghi_chu: 'Báo cáo lưu chuyển tiền tệ và bảng cân đối' },

  // Cấp 2 thuộc Cấp 1 = 6 (Ban Giám định & Bồi thường)
  { id: 21, dm_tai_lieu: 6, ten_loai: 'Quy trình giám định tổn thất', is_public: true, ghi_chu: 'Hướng dẫn chụp ảnh và lập biên bản hiện trường' },
  { id: 22, dm_tai_lieu: 6, ten_loai: 'Thỏa thuận chi trả bồi thường', is_public: true, ghi_chu: 'Văn bản cam kết và quyết định bồi thường' },

  // Cấp 2 thuộc Cấp 1 = 7 (Ban Công nghệ Thông tin)
  { id: 23, dm_tai_lieu: 7, ten_loai: 'Quy định an toàn thông tin & Mật khẩu', is_public: true, ghi_chu: 'Chính sách mật khẩu và bảo mật dữ liệu khách hàng' },
  { id: 24, dm_tai_lieu: 7, ten_loai: 'Hướng dẫn sử dụng hệ thống phần mềm', is_public: true, ghi_chu: 'Cẩm nang thao tác hệ thống Quản lý văn bản' },

  // Cấp 2 thuộc Cấp 1 = 8 (Ban Pháp chế & Kiểm soát nội bộ)
  { id: 25, dm_tai_lieu: 8, ten_loai: 'Mẫu rà soát hợp đồng kinh tế', is_public: true, ghi_chu: 'Checklist thẩm định tính pháp lý của hợp đồng' },
  { id: 26, dm_tai_lieu: 8, ten_loai: 'Quy chế phòng chống gian lận bảo hiểm', is_public: true, ghi_chu: 'Quy định phát hiện và xử lý trục lợi bảo hiểm' },
];

const initialMockDocuments: ResourceItem[] = [
  // --- NHÓM 1: TÀI LIỆU, BIỂU MẪU CHUNG (10 TÀI LIỆU) ---
  {
    id: 1,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [1, 4],
    loai_tai_lieu_names: ['Tài liệu bảo hiểm', 'Quy định'],
    ky_hieu: '01/QĐ-BL-2026',
    tieu_de: 'Quy định bảo hiểm xe cơ giới và quy tắc thẩm định rủi ro 2026',
    ngay_dang: '2026-01-15',
    noi_ban_hanh: 'Ban Giám Đốc',
    hieu_luc: 'CON_HIEU_LUC',
    ghi_chu: 'Áp dụng cho toàn thể cán bộ nhân viên và đại lý trong toàn hệ thống.',
    file_dinh_kem: 'https://example.com/files/quy_tac_bao_hiem_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 2,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [2],
    loai_tai_lieu_names: ['Biểu mẫu bảo hiểm'],
    ky_hieu: 'BM-BH-08',
    tieu_de: 'Giấy yêu cầu bảo hiểm sức khỏe toàn diện Bảo Long Care (Mẫu cũ)',
    ngay_dang: '2024-03-10',
    noi_ban_hanh: 'Ban Nghiệp vụ Bảo hiểm',
    hieu_luc: 'HET_HIEU_LUC',
    ngay_het_hieu_luc: '2025-12-31',
    ghi_chu: 'Biểu mẫu này đã hết hiệu lực từ ngày 31/12/2025, thay bằng mẫu trực tuyến mới.',
    file_dinh_kem: 'https://example.com/files/bieu_mau_bh_cu.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 3,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [3],
    loai_tai_lieu_names: ['Tờ trình'],
    ky_hieu: '12/TTr-TC-2023',
    tieu_de: 'Mẫu tờ trình thanh toán công tác phí và tiếp khách niên độ 2023-2024',
    ngay_dang: '2023-11-20',
    noi_ban_hanh: 'Phòng Tài chính - Kế toán',
    hieu_luc: 'HET_VA_THAY_THE',
    ngay_het_hieu_luc: '2026-01-01',
    link_thay_the: 'https://example.com/docs/huong_dan_cong_tac_phi_2026',
    ghi_chu: 'Đã có văn bản hướng dẫn mới 2026 thay thế, vui lòng bấm link thay thế để xem văn bản mới.',
    file_dinh_kem: 'https://example.com/files/to_trinh_cong_tac_phi_cu.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 4,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [2, 5],
    loai_tai_lieu_names: ['Biểu mẫu bảo hiểm', 'Quy chế quản trị'],
    ky_hieu: 'BM-KT-02',
    tieu_de: 'Giấy đề nghị tạm ứng kinh phí bồi thường khẩn cấp (Áp dụng 2026)',
    ngay_dang: '2026-02-15',
    noi_ban_hanh: 'Phòng Tài chính - Kế toán',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/giay_de_nghi_tam_ung.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 8,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [1],
    loai_tai_lieu_names: ['Tài liệu bảo hiểm'],
    ky_hieu: 'TL-CHAYNO-2026',
    tieu_de: 'Biểu phí chuẩn và quy tắc bảo hiểm Cháy nổ bắt buộc 2026',
    ngay_dang: '2026-01-20',
    noi_ban_hanh: 'Ban Nghiệp vụ Bảo hiểm',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/quy_tac_chay_no_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Thượng Mạnh Quỳnh',
  },
  {
    id: 9,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [4],
    loai_tai_lieu_names: ['Quy định'],
    ky_hieu: '08/QĐ-BL-2025',
    tieu_de: 'Quy định văn hóa doanh nghiệp và chuẩn mực giao tiếp khách hàng Bảo Long',
    ngay_dang: '2025-05-12',
    noi_ban_hanh: 'Ban Tổng Giám Đốc',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/van_hoa_doanh_nghiep_2025.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 10,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [3],
    loai_tai_lieu_names: ['Tờ trình'],
    ky_hieu: '45/TTr-VP-2026',
    tieu_de: 'Mẫu tờ trình xin phê duyệt chủ trương ký kết đối tác phân phối liên kết',
    ngay_dang: '2026-02-28',
    noi_ban_hanh: 'Văn Phòng Tổng Công Ty',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/mau_to_trinh_doi_tac_2026.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 11,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [5],
    loai_tai_lieu_names: ['Quy chế quản trị'],
    ky_hieu: 'QC-QTNB-2024',
    tieu_de: 'Quy chế quản trị rủi ro hoạt động và phòng ngừa sự cố vận hành',
    ngay_dang: '2024-08-15',
    noi_ban_hanh: 'Hội Đồng Quản Trị',
    hieu_luc: 'CON_HIEU_LUC_1_PHAN',
    ghi_chu: 'Một số điều khoản về thẩm quyền duyệt chi đã được sửa đổi theo Quyết định 15/2026.',
    file_dinh_kem: 'https://example.com/files/quy_che_quan_tri_rui_ro_2024.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 12,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [2],
    loai_tai_lieu_names: ['Biểu mẫu bảo hiểm'],
    ky_hieu: 'BM-TAISAN-03',
    tieu_de: 'Giấy chứng nhận bảo hiểm mọi rủi ro tài sản và công trình xây dựng',
    ngay_dang: '2026-03-02',
    noi_ban_hanh: 'Ban Nghiệp vụ Bảo hiểm',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/gcn_bao_hiem_tai_san.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Thượng Mạnh Quỳnh',
  },
  {
    id: 13,
    dm_tai_lieu: 1,
    dm_tai_lieu_name: 'Tài liệu, Biểu mẫu chung',
    loai_tai_lieu: [6],
    loai_tai_lieu_names: ['Dự thảo nội bộ (Chưa công bố)'],
    ky_hieu: 'DT-TLBM-2026',
    tieu_de: 'Dự thảo Sổ tay hướng dẫn phát hành đơn bảo hiểm điện tử E-Policy',
    ngay_dang: '2026-03-10',
    noi_ban_hanh: 'Ban Đổi Mới Số',
    hieu_luc: 'CON_HIEU_LUC',
    ghi_chu: 'Bản dự thảo nội bộ đang lấy ý kiến các đơn vị thành viên trước khi ban hành chính thức.',
    file_dinh_kem: 'https://example.com/files/du_thao_epolicy_2026.docx',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Phạm Đức Anh',
  },

  // --- NHÓM 2: HỒ SƠ BAN NHÂN SỰ (7 TÀI LIỆU) ---
  {
    id: 5,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [7],
    loai_tai_lieu_names: ['Hồ sơ tuyển dụng & HĐLĐ'],
    ky_hieu: 'HDLD-NS-2025',
    tieu_de: 'Mẫu hợp đồng lao động xác định thời hạn cho khối kinh doanh',
    ngay_dang: '2025-06-18',
    noi_ban_hanh: 'Ban Nhân Sự',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/hop_dong_lao_dong_2025.docx',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 14,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [7],
    loai_tai_lieu_names: ['Hồ sơ tuyển dụng & HĐLĐ'],
    ky_hieu: 'BM-TD-01',
    tieu_de: 'Phiếu đánh giá phỏng vấn ứng viên và đề xuất tuyển dụng nhân sự',
    ngay_dang: '2026-01-08',
    noi_ban_hanh: 'Ban Nhân Sự',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/phieu_phong_van_tuyen_dung.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 15,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [8],
    loai_tai_lieu_names: ['Quyết định bổ nhiệm & Khen thưởng'],
    ky_hieu: 'QĐ-KT-2025',
    tieu_de: 'Mẫu quyết định khen thưởng thành tích xuất sắc tập thể và cá nhân năm 2025',
    ngay_dang: '2025-12-25',
    noi_ban_hanh: 'Tổng Giám Đốc',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/quyet_dinh_khen_thuong_2025.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 16,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [12],
    loai_tai_lieu_names: ['Đánh giá KPI & Hiệu suất'],
    ky_hieu: 'KPI-NS-2026',
    tieu_de: 'Khung tiêu chí đánh giá KPI quý và bảng phân bổ trọng số công việc 2026',
    ngay_dang: '2026-01-10',
    noi_ban_hanh: 'Ban Nhân Sự',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/khung_kpi_2026.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 17,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [13],
    loai_tai_lieu_names: ['Quy chế tiền lương & Phúc lợi'],
    ky_hieu: 'QC-LUONG-2024',
    tieu_de: 'Quy chế chi trả tiền lương hiệu quả kinh doanh và trợ cấp độc hại (Cũ)',
    ngay_dang: '2024-04-15',
    noi_ban_hanh: 'Hội Đồng Quản Trị',
    hieu_luc: 'HET_VA_THAY_THE',
    ngay_het_hieu_luc: '2025-12-31',
    link_thay_the: 'https://example.com/docs/quy_che_luong_moi_2026',
    ghi_chu: 'Thay thế bởi Quy chế tiền lương và phúc lợi mới ban hành tháng 01/2026.',
    file_dinh_kem: 'https://example.com/files/quy_che_luong_cu_2024.pdf',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 18,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [13],
    loai_tai_lieu_names: ['Quy chế tiền lương & Phúc lợi'],
    ky_hieu: 'QC-LUONG-2026',
    tieu_de: 'Quy chế tiền lương, phụ cấp công tác và chế độ bảo hiểm chăm sóc sức khỏe 2026',
    ngay_dang: '2026-01-02',
    noi_ban_hanh: 'Hội Đồng Quản Trị',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/quy_che_luong_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },
  {
    id: 19,
    dm_tai_lieu: 2,
    dm_tai_lieu_name: 'Hồ sơ Ban Nhân sự',
    loai_tai_lieu: [7],
    loai_tai_lieu_names: ['Hồ sơ tuyển dụng & HĐLĐ'],
    ky_hieu: 'HD-CTV-2025',
    tieu_de: 'Mẫu hợp đồng cộng tác viên tư vấn bảo hiểm và cam kết bảo mật thông tin',
    ngay_dang: '2025-09-01',
    noi_ban_hanh: 'Ban Nhân Sự',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/hop_dong_ctv_2025.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Huỳnh Thị Kim Trang',
  },

  // --- NHÓM 3: HỒ SƠ BẢO LONG BẾN THÀNH (6 TÀI LIỆU) ---
  {
    id: 6,
    dm_tai_lieu: 3,
    dm_tai_lieu_name: 'Hồ sơ Bảo Long Bến Thành',
    loai_tai_lieu: [10],
    loai_tai_lieu_names: ['Hồ sơ giám định & Bồi thường'],
    ky_hieu: 'GD-BLBT-2026',
    tieu_de: 'Biên bản giám định tổn thất hiện trường nghiệp vụ Bến Thành',
    ngay_dang: '2026-03-01',
    noi_ban_hanh: 'Bảo Long Bến Thành',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bien_ban_giam_dinh_blbt.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Thượng Mạnh Quỳnh',
  },
  {
    id: 20,
    dm_tai_lieu: 3,
    dm_tai_lieu_name: 'Hồ sơ Bảo Long Bến Thành',
    loai_tai_lieu: [9],
    loai_tai_lieu_names: ['Báo cáo doanh số chi nhánh'],
    ky_hieu: 'BC-DS-BT-Q4-2025',
    tieu_de: 'Báo cáo tổng kết doanh số khai thác quý IV/2025 chi nhánh Bến Thành',
    ngay_dang: '2026-01-05',
    noi_ban_hanh: 'Ban Giám Đốc Chi Nhánh Bến Thành',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bao_cao_doanh_so_q4_blbt.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 21,
    dm_tai_lieu: 3,
    dm_tai_lieu_name: 'Hồ sơ Bảo Long Bến Thành',
    loai_tai_lieu: [14],
    loai_tai_lieu_names: ['Kế hoạch kinh doanh khu vực'],
    ky_hieu: 'KH-KD-BT-2026',
    tieu_de: 'Kế hoạch phát triển thị trường và mở rộng kênh bán lẻ Quận 1 năm 2026',
    ngay_dang: '2026-01-15',
    noi_ban_hanh: 'Phòng Phát Triển Kinh Doanh Bến Thành',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/ke_hoach_kinh_doanh_2026_blbt.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 22,
    dm_tai_lieu: 3,
    dm_tai_lieu_name: 'Hồ sơ Bảo Long Bến Thành',
    loai_tai_lieu: [15],
    loai_tai_lieu_names: ['Hồ sơ đại lý & Mạng lưới Bến Thành'],
    ky_hieu: 'HD-DL-BT-2025',
    tieu_de: 'Hợp đồng đại lý bảo hiểm tổ chức và phụ lục phân bổ chỉ tiêu doanh thu',
    ngay_dang: '2025-07-20',
    noi_ban_hanh: 'Bảo Long Bến Thành',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/hop_dong_dai_ly_blbt.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 23,
    dm_tai_lieu: 3,
    dm_tai_lieu_name: 'Hồ sơ Bảo Long Bến Thành',
    loai_tai_lieu: [10],
    loai_tai_lieu_names: ['Hồ sơ giám định & Bồi thường'],
    ky_hieu: 'TT-BT-2024',
    tieu_de: 'Thỏa thuận giải quyết bồi thường tổn thất tai nạn xe cơ giới Bến Thành (2024)',
    ngay_dang: '2024-11-10',
    noi_ban_hanh: 'Bảo Long Bến Thành',
    hieu_luc: 'HET_HIEU_LUC',
    ngay_het_hieu_luc: '2025-11-10',
    ghi_chu: 'Hồ sơ vụ việc đã tất toán thanh toán và đóng hồ sơ lưu trữ.',
    file_dinh_kem: 'https://example.com/files/thoa_thuan_boi_thuong_cu.pdf',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },
  {
    id: 24,
    dm_tai_lieu: 3,
    dm_tai_lieu_name: 'Hồ sơ Bảo Long Bến Thành',
    loai_tai_lieu: [9],
    loai_tai_lieu_names: ['Báo cáo doanh số chi nhánh'],
    ky_hieu: 'BC-THANG-BT-02',
    tieu_de: 'Báo cáo theo dõi tiến độ hoàn thành doanh thu tháng 02/2026 chi nhánh Bến Thành',
    ngay_dang: '2026-03-01',
    noi_ban_hanh: 'Bảo Long Bến Thành',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bao_cao_thang_02_2026_blbt.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Nguyễn Chí Tín',
  },

  // --- NHÓM 4: CÁC ĐƠN VỊ PHÒNG BAN CẤP 2 (5 TÀI LIỆU) ---
  {
    id: 7,
    dm_tai_lieu: 4,
    dm_tai_lieu_name: 'Các đơn vị phòng ban cấp 2',
    loai_tai_lieu: [11],
    loai_tai_lieu_names: ['Biên bản họp phòng ban'],
    ky_hieu: 'BBH-PB2-2026',
    tieu_de: 'Biên bản họp giao ban công tác các đơn vị phòng ban cấp 2',
    ngay_dang: '2026-03-05',
    noi_ban_hanh: 'Các Đơn Vị Phòng Ban Cấp 2',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bien_ban_hop_pb2.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 25,
    dm_tai_lieu: 4,
    dm_tai_lieu_name: 'Các đơn vị phòng ban cấp 2',
    loai_tai_lieu: [16],
    loai_tai_lieu_names: ['Đề xuất trang thiết bị văn phòng'],
    ky_hieu: 'ĐX-TB-PB2-2026',
    tieu_de: 'Phiếu đề xuất cấp mới máy in chuyên dụng và thiết bị văn phòng quý I/2026',
    ngay_dang: '2026-01-22',
    noi_ban_hanh: 'Tổ Hành Chính Phòng Ban Cấp 2',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/phieu_de_xuat_thiet_bi.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 26,
    dm_tai_lieu: 4,
    dm_tai_lieu_name: 'Các đơn vị phòng ban cấp 2',
    loai_tai_lieu: [17],
    loai_tai_lieu_names: ['Kế hoạch công tác tuần/tháng'],
    ky_hieu: 'KH-TUAN-10-2026',
    tieu_de: 'Kế hoạch công tác tuần số 10 niên độ 2026 khối văn phòng cấp 2',
    ngay_dang: '2026-03-09',
    noi_ban_hanh: 'Văn Phòng Khối Cấp 2',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/ke_hoach_tuan_10.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 27,
    dm_tai_lieu: 4,
    dm_tai_lieu_name: 'Các đơn vị phòng ban cấp 2',
    loai_tai_lieu: [11],
    loai_tai_lieu_names: ['Biên bản họp phòng ban'],
    ky_hieu: 'BBH-TK-2025',
    tieu_de: 'Biên bản họp tổng kết đánh giá thi đua khối phòng ban cấp 2 năm 2025',
    ngay_dang: '2025-12-28',
    noi_ban_hanh: 'Hội đồng Thi đua Cấp 2',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bien_ban_tong_ket_2025_pb2.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },
  {
    id: 28,
    dm_tai_lieu: 4,
    dm_tai_lieu_name: 'Các đơn vị phòng ban cấp 2',
    loai_tai_lieu: [16],
    loai_tai_lieu_names: ['Đề xuất trang thiết bị văn phòng'],
    ky_hieu: 'ĐX-TB-2023',
    tieu_de: 'Phiếu đề xuất thanh lý bàn ghế và máy tính cũ hư hỏng niên độ 2023',
    ngay_dang: '2023-10-14',
    noi_ban_hanh: 'Tổ Quản Trị Cấp 2',
    hieu_luc: 'HET_HIEU_LUC',
    ngay_het_hieu_luc: '2024-01-01',
    ghi_chu: 'Đã hoàn tất thanh lý theo biên bản nghiệm thu tài sản số 14/2023.',
    file_dinh_kem: 'https://example.com/files/thanh_ly_tai_san_2023.pdf',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Đỗ Trung Phong',
  },

  // --- NHÓM 5: BAN TÀI CHÍNH - KẾ TOÁN (5 TÀI LIỆU) ---
  {
    id: 29,
    dm_tai_lieu: 5,
    dm_tai_lieu_name: 'Ban Tài chính - Kế toán',
    loai_tai_lieu: [18],
    loai_tai_lieu_names: ['Biểu mẫu thanh quyết toán & Hoàn ứng'],
    ky_hieu: 'BM-TC-QT-2026',
    tieu_de: 'Giấy đề nghị thanh toán công tác phí và bảng kê hóa đơn điện tử hợp lệ',
    ngay_dang: '2026-01-18',
    noi_ban_hanh: 'Ban Tài Chính - Kế Toán',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/de_nghi_thanh_toan_2026.xlsx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Trần Minh Hoàng',
  },
  {
    id: 30,
    dm_tai_lieu: 5,
    dm_tai_lieu_name: 'Ban Tài chính - Kế toán',
    loai_tai_lieu: [19],
    loai_tai_lieu_names: ['Quy trình tạm ứng ngân sách'],
    ky_hieu: 'QT-TU-2026',
    tieu_de: 'Quy trình xét duyệt hạn mức tạm ứng và thời hạn hoàn ứng chi tiêu sự vụ',
    ngay_dang: '2026-02-01',
    noi_ban_hanh: 'Ban Tài Chính - Kế Toán',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/quy_trinh_tam_ung_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Trần Minh Hoàng',
  },
  {
    id: 31,
    dm_tai_lieu: 5,
    dm_tai_lieu_name: 'Ban Tài chính - Kế toán',
    loai_tai_lieu: [20],
    loai_tai_lieu_names: ['Báo cáo tài chính & Kiểm toán'],
    ky_hieu: 'BCTC-2025-KD',
    tieu_de: 'Báo cáo tài chính hợp nhất kiểm toán năm tài chính 2025 Bảo Long',
    ngay_dang: '2026-03-02',
    noi_ban_hanh: 'Ban Kiểm Toán & Kế Toán',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/bctc_kiem_toan_2025.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Trần Minh Hoàng',
  },
  {
    id: 32,
    dm_tai_lieu: 5,
    dm_tai_lieu_name: 'Ban Tài chính - Kế toán',
    loai_tai_lieu: [18],
    loai_tai_lieu_names: ['Biểu mẫu thanh quyết toán & Hoàn ứng'],
    ky_hieu: 'BM-TC-05-2024',
    tieu_de: 'Mẫu biên nhận chi hoa hồng đại lý và kê khai thuế thu nhập cá nhân 2024',
    ngay_dang: '2024-06-20',
    noi_ban_hanh: 'Phòng Kế Toán Thuế',
    hieu_luc: 'CON_HIEU_LUC_1_PHAN',
    ghi_chu: 'Biểu mẫu vẫn áp dụng cho các hợp đồng đại lý ký trước tháng 01/2026.',
    file_dinh_kem: 'https://example.com/files/bien_nhan_hoa_hong_2024.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Trần Minh Hoàng',
  },
  {
    id: 33,
    dm_tai_lieu: 5,
    dm_tai_lieu_name: 'Ban Tài chính - Kế toán',
    loai_tai_lieu: [19],
    loai_tai_lieu_names: ['Quy trình tạm ứng ngân sách'],
    ky_hieu: 'QT-TU-2023',
    tieu_de: 'Quy trình duyệt chi tạm ứng ngoại tệ phục vụ tái bảo hiểm quốc tế (Cũ)',
    ngay_dang: '2023-09-15',
    noi_ban_hanh: 'Ban Tài Chính',
    hieu_luc: 'HET_VA_THAY_THE',
    ngay_het_hieu_luc: '2025-12-31',
    link_thay_the: 'https://example.com/docs/quy_trinh_tai_chinh_quoc_te_2026',
    ghi_chu: 'Thay thế bằng Quy chế thanh toán giao dịch quốc tế ban hành mới năm 2026.',
    file_dinh_kem: 'https://example.com/files/tam_ung_ngoai_te_cu.pdf',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Trần Minh Hoàng',
  },

  // --- NHÓM 6: BAN GIÁM ĐỊNH & BỒI THƯỜNG (4 TÀI LIỆU) ---
  {
    id: 34,
    dm_tai_lieu: 6,
    dm_tai_lieu_name: 'Ban Giám định & Bồi thường',
    loai_tai_lieu: [21],
    loai_tai_lieu_names: ['Quy trình giám định tổn thất'],
    ky_hieu: 'QT-GDTT-2026',
    tieu_de: 'Quy trình chuẩn chụp ảnh hiện trường và lập biên bản giám định xe cơ giới',
    ngay_dang: '2026-01-25',
    noi_ban_hanh: 'Ban Giám Định & Bồi Thường',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/quy_trinh_giam_dinh_xe_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Lê Thanh Thảo',
  },
  {
    id: 35,
    dm_tai_lieu: 6,
    dm_tai_lieu_name: 'Ban Giám định & Bồi thường',
    loai_tai_lieu: [22],
    loai_tai_lieu_names: ['Thỏa thuận chi trả bồi thường'],
    ky_hieu: 'TT-CTBT-2026',
    tieu_de: 'Mẫu thông báo duyệt phương án bồi thường và phiếu bảo lãnh viện phí viện trợ',
    ngay_dang: '2026-02-12',
    noi_ban_hanh: 'Ban Giám Định & Bồi Thường',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/mau_thong_bao_boi_thuong.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Lê Thanh Thảo',
  },
  {
    id: 36,
    dm_tai_lieu: 6,
    dm_tai_lieu_name: 'Ban Giám định & Bồi thường',
    loai_tai_lieu: [21],
    loai_tai_lieu_names: ['Quy trình giám định tổn thất'],
    ky_hieu: 'QT-GD-HANGHOA-2025',
    tieu_de: 'Hướng dẫn giám định tổn thất hàng hóa vận chuyển nội địa và xuất nhập khẩu',
    ngay_dang: '2025-08-30',
    noi_ban_hanh: 'Ban Giám Định',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/giam_dinh_hang_hoa_2025.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Lê Thanh Thảo',
  },
  {
    id: 37,
    dm_tai_lieu: 6,
    dm_tai_lieu_name: 'Ban Giám định & Bồi thường',
    loai_tai_lieu: [22],
    loai_tai_lieu_names: ['Thỏa thuận chi trả bồi thường'],
    ky_hieu: 'BM-BT-TAU-2024',
    tieu_de: 'Hồ sơ thỏa thuận từ chối bồi thường do vi phạm điều khoản loại trừ (2024)',
    ngay_dang: '2024-05-18',
    noi_ban_hanh: 'Phòng Bồi Thường Nghiệp Vụ',
    hieu_luc: 'CON_HIEU_LUC_1_PHAN',
    ghi_chu: 'Tham khảo khung pháp lý áp dụng cho các hợp đồng bảo hiểm ký năm 2024.',
    file_dinh_kem: 'https://example.com/files/tu_choi_boi_thuong_2024.pdf',
    hien_thi: 'NOI_BO_PHONG_BAN',
    nguoi_tao_name: 'Lê Thanh Thảo',
  },

  // --- NHÓM 7: BAN CÔNG NGHỆ THÔNG TIN (3 TÀI LIỆU) ---
  {
    id: 38,
    dm_tai_lieu: 7,
    dm_tai_lieu_name: 'Ban Công nghệ Thông tin',
    loai_tai_lieu: [23],
    loai_tai_lieu_names: ['Quy định an toàn thông tin & Mật khẩu'],
    ky_hieu: 'QĐ-ATTT-2026',
    tieu_de: 'Chính sách bảo mật mật khẩu cấp phát tài khoản và sao lưu dữ liệu máy trạm',
    ngay_dang: '2026-01-05',
    noi_ban_hanh: 'Ban Công Nghệ Thông Tin',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/chinh_sach_an_toan_thong_tin_2026.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Phạm Đức Anh',
  },
  {
    id: 39,
    dm_tai_lieu: 7,
    dm_tai_lieu_name: 'Ban Công nghệ Thông tin',
    loai_tai_lieu: [24],
    loai_tai_lieu_names: ['Hướng dẫn sử dụng hệ thống phần mềm'],
    ky_hieu: 'HD-PM-TLBM-2026',
    tieu_de: 'Tài liệu hướng dẫn thao tác tra cứu, xuất Excel và phân quyền phân hệ Tài liệu',
    ngay_dang: '2026-02-20',
    noi_ban_hanh: 'Tổ Phát Triển Phần Mềm',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/huong_dan_su_dung_tlbm.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Phạm Đức Anh',
  },
  {
    id: 40,
    dm_tai_lieu: 7,
    dm_tai_lieu_name: 'Ban Công nghệ Thông tin',
    loai_tai_lieu: [23],
    loai_tai_lieu_names: ['Quy định an toàn thông tin & Mật khẩu'],
    ky_hieu: 'QĐ-VPN-2025',
    tieu_de: 'Quy trình cấp quyền truy cập từ xa qua mạng riêng ảo VPN cho cán bộ lưu động',
    ngay_dang: '2025-03-15',
    noi_ban_hanh: 'Ban Công Nghệ Thông Tin',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/quy_trinh_vpn_2025.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Phạm Đức Anh',
  },

  // --- NHÓM 8: BAN PHÁP CHẾ & KIỂM SOÁT NỘI BỘ (2 TÀI LIỆU) ---
  {
    id: 41,
    dm_tai_lieu: 8,
    dm_tai_lieu_name: 'Ban Pháp chế & Kiểm soát nội bộ',
    loai_tai_lieu: [25],
    loai_tai_lieu_names: ['Mẫu rà soát hợp đồng kinh tế'],
    ky_hieu: 'PC-HD-2026',
    tieu_de: 'Mẫu phiếu thẩm định pháp lý hợp đồng kinh tế và rà soát điều khoản phạt cọc',
    ngay_dang: '2026-01-28',
    noi_ban_hanh: 'Ban Pháp Chế',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/phieu_tham_dinh_phap_ly_2026.docx',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Võ Thị Hồng Nhung',
  },
  {
    id: 42,
    dm_tai_lieu: 8,
    dm_tai_lieu_name: 'Ban Pháp chế & Kiểm soát nội bộ',
    loai_tai_lieu: [26],
    loai_tai_lieu_names: ['Quy chế phòng chống gian lận bảo hiểm'],
    ky_hieu: 'QC-GLBH-2025',
    tieu_de: 'Sổ tay nhận diện các dấu hiệu trục lợi bảo hiểm xe cơ giới và sức khỏe',
    ngay_dang: '2025-11-05',
    noi_ban_hanh: 'Ban Pháp Chế & Kiểm Soát Nội Bộ',
    hieu_luc: 'CON_HIEU_LUC',
    file_dinh_kem: 'https://example.com/files/so_tay_chong_gian_lan_2025.pdf',
    hien_thi: 'TAT_CA',
    nguoi_tao_name: 'Võ Thị Hồng Nhung',
  },
];

const STORAGE_KEY = 'tlbm_resources_filter_state';

interface PersistedResourceState {
  category?: string;
  type?: string;
  year?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

const getInitialFilterState = (searchParams: URLSearchParams): PersistedResourceState => {
  // Kiểm tra xem lần tải trang này có phải là Reload (F5 / Refresh) của trình duyệt hay không
  const isReload = (() => {
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        return (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      }
      return (performance as any).navigation?.type === 1;
    } catch {
      return false;
    }
  })();

  // 1. Nếu trên URL có query params, luôn ưu tiên đọc trực tiếp từ URL
  const hasUrlParams = searchParams.toString().length > 0;
  if (hasUrlParams) {
    return {
      category: searchParams.get('category') || undefined,
      type: searchParams.get('type') || undefined,
      year: searchParams.get('year') || undefined,
      status: searchParams.get('status') || undefined,
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
    };
  }

  // 2. Nếu là Reload (F5 / Refresh) mà URL không có param, phục hồi từ sessionStorage
  if (isReload) {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Không thể đọc trạng thái kho tài liệu từ sessionStorage', e);
    }
  }

  // 3. Mặc định mới vào: Xóa sạch cache cũ để đảm bảo bắt đầu ở "Tất cả" & 5 dòng
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  return {};
};

export default function ResourceManagementPage() {
  const { t, currentLang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilterState = useMemo(() => getInitialFilterState(searchParams), []);

  const [documents, setDocuments] = useState<ResourceItem[]>(initialMockDocuments);
  const [categories, setCategories] = useState<ResourceCategory[]>(initialMockCategories);
  const [types, setTypes] = useState<ResourceType[]>(initialMockTypes);

  // ============================================================================
  // BỘ LỌC ĐA NĂNG & PHÂN TẦNG:
  // - selectedCategory: Lọc theo Cấp 1 (Mặc định 'all' để xem toàn bộ kho)
  // - selectedType: Lọc theo Cấp 2 (Bên trong Cấp 1 đang chọn)
  // - selectedYear: Lọc theo năm văn bản (2026, 2025, 2024...)
  // - statusFilter: Lọc theo trạng thái hiệu lực
  // - searchTerm: Tìm theo tiêu đề, ký hiệu, nơi ban hành
  // ============================================================================
  // Bộ lọc: Search debounced 300ms
  const [searchInput, setSearchInput] = useState(initialFilterState.q || '');
  const [searchTerm, setSearchTerm] = useState(initialFilterState.q || '');
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sắp xếp Thư mục (Cấp 1) theo STT ưu tiên (Mặc định mới vào hiển thị tab 'all' - Tất cả)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.stt_uu_tien || 0) - (b.stt_uu_tien || 0));
  }, [categories]);

  // Ref cho thanh tab ngang — dùng để cuộn bằng nút mũi tên khi nhiều thư mục
  const tabBarRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabBarRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  // Ref cho thanh loại tài liệu ngang — dùng để cuộn bằng nút mũi tên khi nhiều loại
  const typeBarRef = useRef<HTMLDivElement>(null);
  const scrollTypes = (direction: 'left' | 'right') => {
    const el = typeBarRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  // Mặc định mới vào: hiện ở Tất cả ('all')
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilterState.category || 'all');
  const [selectedType, setSelectedType] = useState<string>(initialFilterState.type || 'all');
  const [selectedYear, setSelectedYear] = useState<string>(initialFilterState.year || 'all');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilterState.status || 'all');

  // Phân trang: Mặc định mới vào hiển thị 5 dòng
  const [currentPage, setCurrentPage] = useState<number>(
    initialFilterState.page && initialFilterState.page > 0 ? initialFilterState.page : 1
  );
  const [pageSize, setPageSize] = useState<number>(
    initialFilterState.pageSize && initialFilterState.pageSize > 0 ? initialFilterState.pageSize : 5
  );

  // Tự động lưu trạng thái vào sessionStorage và đồng bộ URL Query Parameters
  // Khi reload lại trang (F5), toàn bộ mục đang chọn, trang và dòng hiển thị vẫn được giữ nguyên
  useEffect(() => {
    const stateToSave: PersistedResourceState = {
      category: selectedCategory,
      type: selectedType,
      year: selectedYear,
      status: statusFilter,
      q: searchTerm || undefined,
      page: currentPage > 1 ? currentPage : undefined,
      pageSize: pageSize !== 5 ? pageSize : undefined,
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {}

    const newParams = new URLSearchParams();
    if (selectedCategory !== 'all') newParams.set('category', selectedCategory);
    if (selectedType !== 'all') newParams.set('type', selectedType);
    if (selectedYear !== 'all') newParams.set('year', selectedYear);
    if (statusFilter !== 'all') newParams.set('status', statusFilter);
    if (searchTerm.trim()) newParams.set('q', searchTerm.trim());
    if (currentPage > 1) newParams.set('page', String(currentPage));
    if (pageSize !== 5) newParams.set('pageSize', String(pageSize));

    setSearchParams(newParams, { replace: true });
  }, [
    selectedCategory,
    selectedType,
    selectedYear,
    statusFilter,
    searchTerm,
    currentPage,
    pageSize,
    setSearchParams,
  ]);

  // Modal State
  const [detailItem, setDetailItem] = useState<ResourceItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<ResourceItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Modal Xóa Tài liệu
  const [deleteItem, setDeleteItem] = useState<ResourceItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Danh sách năm trích xuất từ dữ liệu thực tế
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    documents.forEach((d) => {
      if (d.ngay_dang) {
        yearsSet.add(d.ngay_dang.substring(0, 4));
      }
    });
    yearsSet.add('2026');
    yearsSet.add('2025');
    yearsSet.add('2024');
    return Array.from(yearsSet).sort().reverse();
  }, [documents]);

  // Cascading Loại tài liệu thuộc Thư mục đang chọn
  const availableTypesForFilter = useMemo(() => {
    if (selectedCategory === 'all') {
      return types;
    }
    return types.filter((t) => t.dm_tai_lieu === Number(selectedCategory));
  }, [types, selectedCategory]);

  // Đổi Thư mục: Tự động reset Loại tài liệu về 'all' và về trang 1
  const handleCategorySelect = (newCat: string) => {
    setSelectedCategory(newCat);
    setSelectedType('all');
    setCurrentPage(1);
    setIsCategoryDropdownOpen(false);
    setIsTypeDropdownOpen(false);
  };

  // Dropdown Popovers State (Nút bấm sổ dropdown bên phải cho Danh mục & Loại tài liệu)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(target)
      ) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'Tất cả danh mục';
    const found = categories.find((c) => String(c.id) === selectedCategory);
    return found ? found.ten_tai_lieu : 'Chọn danh mục';
  }, [selectedCategory, categories]);

  const currentTypeLabel = useMemo(() => {
    if (selectedType === 'all') return 'Tất cả loại';
    const found = types.find((t) => String(t.id) === selectedType);
    return found ? found.ten_loai : 'Chọn loại';
  }, [selectedType, types]);

  // Xóa toàn bộ bộ lọc
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedType('all');
    setSelectedYear('all');
    setStatusFilter('all');
    setCurrentPage(1);
    setIsCategoryDropdownOpen(false);
    setIsTypeDropdownOpen(false);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedType !== 'all' ||
    selectedYear !== 'all' ||
    statusFilter !== 'all'
  );

  // ============================================================================
  // LỌC DỮ LIỆU BẢNG TỔNG HỢP THEO TẤT CẢ TIÊU CHÍ
  // ============================================================================
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Tìm kiếm từ khóa (Tiêu đề, Ký hiệu, Nơi ban hành)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = doc.tieu_de.toLowerCase().includes(term);
        const matchSymbol = (doc.ky_hieu || '').toLowerCase().includes(term);
        const matchPublisher = (doc.noi_ban_hanh || '').toLowerCase().includes(term);
        if (!matchTitle && !matchSymbol && !matchPublisher) return false;
      }

      // 2. Lọc Danh mục Cấp 1
      if (selectedCategory !== 'all') {
        if (doc.dm_tai_lieu !== Number(selectedCategory)) return false;
      }

      // 3. Lọc Loại tài liệu Cấp 2 (Bộ lọc phân tầng Cấp 1 ➔ Cấp 2)
      if (selectedType !== 'all') {
        if (!doc.loai_tai_lieu || !doc.loai_tai_lieu.includes(Number(selectedType))) {
          return false;
        }
      }

      // 4. Lọc theo Năm đăng văn bản (theo đặc tả yêu cầu trong đề án)
      if (selectedYear !== 'all') {
        const docYear = doc.ngay_dang ? doc.ngay_dang.substring(0, 4) : '';
        if (docYear !== selectedYear) return false;
      }

      // 5. Lọc Trạng thái hiệu lực
      if (statusFilter !== 'all') {
        if (doc.hieu_luc !== statusFilter) return false;
      }

      return true;
    });
  }, [documents, searchTerm, selectedCategory, selectedType, selectedYear, statusFilter]);

  // Phân trang danh sách
  const totalCount = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Hành động Xem chi tiết
  const handleViewDetail = (item: ResourceItem) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  // Hành động Mở Modal Thêm mới
  const handleAddNew = () => {
    setFormInitialData(null);
    setIsFormOpen(true);
  };

  // Hành động Mở Modal Sửa
  const handleEdit = (item: ResourceItem) => {
    setFormInitialData(item);
    setIsFormOpen(true);
  };

  // Hành động Mở Modal Xóa tài liệu
  const handleDelete = (item: ResourceItem) => {
    setDeleteItem(item);
    setIsDeleteOpen(true);
  };

  // Xác nhận Xóa tài liệu
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      setIsDeleting(true);

      // Thử gọi API Backend nếu có kết nối
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `/api/resources/documents/${deleteItem.id}/`;
      const token = localStorage.getItem('tlbm_access_token') || localStorage.getItem('tlbm_token');

      await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {
        // Backend offline / mock mode -> không chặn xóa local
      });

      // Xóa khỏi danh sách tài liệu
      const targetId = deleteItem.id;
      const targetTitle = deleteItem.tieu_de;
      setDocuments((prev) => prev.filter((d) => d.id !== targetId));

      // Đóng modal xác nhận
      setIsDeleteOpen(false);
      setDeleteItem(null);

      // Hiển thị Toast thông báo thành công
      setToastMessage(`Đã xóa thành công tài liệu: "${targetTitle}"`);
      setTimeout(() => setToastMessage(null), 3500);

      // Tự động điều chỉnh trang nếu trang hiện tại bị trống
      const remainingDocs = documents.filter((d) => d.id !== targetId);
      const newTotalPages = Math.max(1, Math.ceil(remainingDocs.length / pageSize));
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Xử lý Submit Form Thêm/Sửa Tài liệu
  const handleFormSubmit = async (data: { formData: FormData; payload: ResourceFormData }) => {
    const payload = data.payload;
    const cat = categories.find((c) => c.id === Number(payload.dm_tai_lieu));
    const selectedTypeNames = types
      .filter((t) => payload.loai_tai_lieu.includes(t.id))
      .map((t) => t.ten_loai);

    if (formInitialData) {
      // Cập nhật
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === formInitialData.id
            ? {
              ...d,
              dm_tai_lieu: Number(payload.dm_tai_lieu),
              dm_tai_lieu_name: cat?.ten_tai_lieu,
              loai_tai_lieu: payload.loai_tai_lieu,
              loai_tai_lieu_names: selectedTypeNames,
              ky_hieu: payload.ky_hieu,
              tieu_de: payload.tieu_de,
              ngay_dang: payload.ngay_dang,
              noi_ban_hanh: payload.noi_ban_hanh,
              hieu_luc: payload.hieu_luc,
              ngay_het_hieu_luc: payload.ngay_het_hieu_luc,
              link_thay_the: payload.link_thay_the,
              ghi_chu: payload.ghi_chu,
              hien_thi: payload.hien_thi,
              file_dinh_kem: payload.file
                ? URL.createObjectURL(payload.file)
                : d.file_dinh_kem,
            }
            : d
        )
      );
    } else {
      // Tạo mới
      const newDoc: ResourceItem = {
        id: Date.now(),
        dm_tai_lieu: Number(payload.dm_tai_lieu),
        dm_tai_lieu_name: cat?.ten_tai_lieu,
        loai_tai_lieu: payload.loai_tai_lieu,
        loai_tai_lieu_names: selectedTypeNames,
        ky_hieu: payload.ky_hieu,
        tieu_de: payload.tieu_de,
        ngay_dang: payload.ngay_dang,
        noi_ban_hanh: payload.noi_ban_hanh,
        hieu_luc: payload.hieu_luc,
        ngay_het_hieu_luc: payload.ngay_het_hieu_luc,
        link_thay_the: payload.link_thay_the,
        ghi_chu: payload.ghi_chu,
        hien_thi: payload.hien_thi,
        file_dinh_kem: payload.file ? URL.createObjectURL(payload.file) : '',
        nguoi_tao_name: 'Đỗ Trung Phong',
      };
      setDocuments((prev) => [newDoc, ...prev]);
    }

    setIsFormOpen(false);
    setToastMessage('Đã lưu tài liệu');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quản lý Danh mục Cấp 1
  const handleSaveCategory = (category: ResourceCategory, isEdit: boolean) => {
    if (isEdit) {
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
      setDocuments((prev) =>
        prev.map((d) =>
          d.dm_tai_lieu === category.id ? { ...d, dm_tai_lieu_name: category.ten_tai_lieu } : d
        )
      );
    } else {
      setCategories((prev) => [...prev, category]);
    }
    setToastMessage(`Đã ${isEdit ? 'cập nhật' : 'thêm'} danh mục Cấp 1: "${category.ten_tai_lieu}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteCategory = (id: number) => {
    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setToastMessage(`Đã xóa danh mục Cấp 1: "${cat?.ten_tai_lieu || id}"`);
    setTimeout(() => setToastMessage(null), 3500);
    if (selectedCategory === String(id)) {
      setSelectedCategory('all');
    }
  };

  // Quản lý Loại biểu mẫu Cấp 2
  const handleSaveType = (typeItem: ResourceType, isEdit: boolean) => {
    if (isEdit) {
      setTypes((prev) => prev.map((t) => (t.id === typeItem.id ? typeItem : t)));
    } else {
      setTypes((prev) => [...prev, typeItem]);
    }
    setToastMessage(`Đã ${isEdit ? 'cập nhật' : 'thêm'} loại Cấp 2: "${typeItem.ten_loai}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteType = (id: number) => {
    const typeItem = types.find((t) => t.id === id);
    setTypes((prev) => prev.filter((t) => t.id !== id));
    setToastMessage(`Đã xóa loại Cấp 2: "${typeItem?.ten_loai || id}"`);
    setTimeout(() => setToastMessage(null), 3500);
    if (selectedType === String(id)) {
      setSelectedType('all');
    }
  };

  // Xuất Excel: Liên kết API Backend để tải file về máy (theo đặc tả phân hệ của Nguyễn Chí Tín)
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      // Chuẩn bị tham số bộ lọc gửi lên Backend
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCategory !== 'all') params.append('dm_tai_lieu', selectedCategory);
      if (selectedType !== 'all') params.append('loai_tai_lieu', selectedType);
      if (selectedYear !== 'all') params.append('nam', selectedYear);
      if (statusFilter !== 'all') params.append('hieu_luc', statusFilter);

      const baseUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = `/api/resources/documents/export-excel/?${params.toString()}`;
      const token = localStorage.getItem('tlbm_access_token') || localStorage.getItem('tlbm_token');

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        // Nhận file blob từ Backend và kích hoạt tải về máy
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Danh_sach_tai_lieu_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        throw new Error(`Máy chủ phản hồi mã lỗi ${response.status}`);
      }
    } catch (error) {
      console.warn(
        'Backend API xuất Excel chưa sẵn sàng hoặc offline, kích hoạt cơ chế xuất file trực tiếp:',
        error
      );

      // Fallback: Xuất dữ liệu bảng hiện tại sang file CSV/Excel UTF-8 có BOM để mở tiếng Việt không lỗi
      const headers = [
        'STT',
        'Ký hiệu',
        'Tiêu đề',
        'Danh mục',
        'Loại tài liệu',
        'Nơi ban hành',
        'Ngày đăng',
        'Hiệu lực',
        'Phạm vi',
      ];
      const rows = filteredDocuments.map((doc, idx) => [
        idx + 1,
        `"${doc.ky_hieu || ''}"`,
        `"${doc.tieu_de.replace(/"/g, '""')}"`,
        `"${doc.dm_tai_lieu_name || ''}"`,
        `"${(doc.loai_tai_lieu_names || []).join('; ')}"`,
        `"${doc.noi_ban_hanh || ''}"`,
        doc.ngay_dang,
        doc.hieu_luc === 'CON_HIEU_LUC'
          ? 'Còn hiệu lực'
          : doc.hieu_luc === 'CON_HIEU_LUC_1_PHAN'
            ? 'Còn hiệu lực một phần'
            : doc.hieu_luc === 'HET_HIEU_LUC'
              ? 'Hết hiệu lực'
              : 'Hết và thay thế',
        doc.hien_thi === 'TAT_CA' ? 'Tất cả' : 'Nội bộ phòng ban',
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Danh_sach_tai_lieu_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } finally {
      setIsExporting(false);
    }
  };

  // Xử lý tải tệp đính kèm về máy
  const handleDownloadFile = (item: ResourceItem) => {
    if (!item.file_dinh_kem) return;
    const a = document.createElement('a');
    a.href = item.file_dinh_kem;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = item.file_dinh_kem.split('/').pop() || 'tai_lieu';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header trang & Nút hành động (GIỮ NGUYÊN KHÔNG ĐỤNG VÀO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-2xl border border-border-subtle shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-main tracking-tight">
            {t('resourceManagement.pageTitle')}
          </h1>
          <p className="text-xs text-secondary mt-1">
            {t('resourceManagement.pageSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Nút chuyển đổi ngôn ngữ VN / EN ngay trên trang Resources */}
          <LanguageSwitcher />

          {/* Nút Quản lý Danh mục (Thao tác cấu hình phụ) */}
          <Button
            variant="secondary"
            size="md"
            icon="fa-folder-tree"
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold border-border-subtle shadow-2xs hover:border-primary/50 hover:text-primary transition-all"
            title={t('resourceManagement.categoriesBtn')}
          >
            {t('resourceManagement.categoriesBtn')}
          </Button>

          {/* Nút Thêm mới tài liệu (Thao tác chính nổi bật) */}
          <Button
            variant="primary"
            size="md"
            icon="fa-plus"
            onClick={handleAddNew}
            className="h-10 px-4.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-glow transition-all"
            title={t('resourceManagement.addDocumentBtn')}
          >
            {t('resourceManagement.addDocumentBtn')}
          </Button>
        </div>
      </div>

      {/* 1. THANH TAB THƯ MỤC NGANG (CẤP 1) — Thiết kế 5 cột đối xứng, đường kẻ căn chỉnh 100% */}
      <div className="bg-surface rounded-xl border border-border-subtle shadow-xs">
        {/* Hàng tab chính (Row 1 - Danh mục Cấp 1) */}
        <div className="relative z-20 flex items-stretch h-11 border-b border-border-subtle">
          {/* Cột 1: Tab Tất cả (cố định bên trái, độ rộng w-[130px]) */}
          <div className="w-[130px] shrink-0 flex items-stretch border-r border-border-subtle">
            {(() => {
              const isAll = selectedCategory === 'all';
              return (
                <button
                  key="all"
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className={`w-full flex items-center justify-center gap-2 px-3 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer rounded-tl-xl ${
                    isAll
                      ? 'border-b-2 border-primary text-primary bg-primary/5 font-bold'
                      : 'border-b-2 border-transparent text-secondary hover:text-main hover:bg-surface-elevated/60'
                  }`}
                  aria-current={isAll ? 'page' : undefined}
                >
                  <i className={`fa-solid fa-layer-group text-xs ${isAll ? 'text-primary' : 'text-muted'}`} />
                  <span>{t('resourceManagement.all')}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                      isAll
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated text-secondary border border-border-subtle'
                    }`}
                  >
                    {documents.length}
                  </span>
                </button>
              );
            })()}
          </div>

          {/* Cột 2: Nút cuộn trái (nằm ngay bên phải chữ Tất cả) */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="w-9 shrink-0 flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors border-r border-border-subtle cursor-pointer"
            aria-label="Cuộn tab sang trái"
            title="Cuộn danh mục sang trái"
          >
            <i className="fa-solid fa-chevron-left text-xs" />
          </button>

          {/* Cột 3: Vùng danh mục cuộn ngang */}
          <div
            ref={tabBarRef}
            className="flex items-stretch gap-0 overflow-x-auto scrollbar-none flex-1 min-w-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {sortedCategories.map((cat) => {
              const isSelected = selectedCategory === String(cat.id);
              const count = documents.filter((d) => d.dm_tai_lieu === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(String(cat.id))}
                  className={`flex items-center gap-1.5 px-3.5 h-full text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'border-primary text-primary bg-primary/5 font-bold'
                      : 'border-transparent text-secondary hover:text-main hover:bg-surface-elevated/60'
                  }`}
                  aria-current={isSelected ? 'page' : undefined}
                  title={cat.ghi_chu || cat.ten_tai_lieu}
                >
                  <i className={`fa-solid ${isSelected ? 'fa-folder-open text-primary' : 'fa-folder text-muted'} text-xs`} />
                  <span>{cat.ten_tai_lieu}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-surface-elevated text-muted border border-border-subtle'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cột 4: Nút cuộn phải */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="w-9 shrink-0 flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors border-l border-border-subtle cursor-pointer"
            aria-label="Cuộn tab sang phải"
            title="Cuộn danh mục sang phải"
          >
            <i className="fa-solid fa-chevron-right text-xs" />
          </button>

          {/* Cột 5: Nút dropdown chọn Danh mục trực tiếp ở góc phải (cố định w-36) */}
          <div className="relative w-36 shrink-0 flex items-stretch border-l border-border-subtle" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCategoryDropdownOpen((prev) => !prev);
                setIsTypeDropdownOpen(false);
              }}
              className="w-full px-3 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-elevated transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap rounded-tr-xl"
              title="Mở danh sách tất cả Danh mục"
              aria-label="Danh sách tất cả Danh mục"
            >
              <i className="fa-solid fa-folder-tree text-xs text-primary" />
              <span>Danh mục</span>
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-surface rounded-xl border border-border-subtle shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                  <span>Danh mục tài liệu</span>
                  <span className="text-[10px] text-primary lowercase font-medium">Cấp 1</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCategorySelect('all');
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white font-bold'
                      : 'text-main hover:bg-surface-elevated'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <i className="fa-solid fa-layer-group text-xs" />
                    <span className="truncate">{t('resourceManagement.allFolders')}</span>
                  </span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-elevated text-secondary border border-border-subtle'
                    }`}
                  >
                    {documents.length}
                  </span>
                </button>

                <div className="my-1 border-t border-border-subtle" />

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                  {sortedCategories.map((cat) => {
                    const isSelected = selectedCategory === String(cat.id);
                    const count = documents.filter((d) => d.dm_tai_lieu === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          handleCategorySelect(String(cat.id));
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white font-bold'
                            : 'text-main hover:bg-surface-elevated'
                        }`}
                        title={cat.ghi_chu || cat.ten_tai_lieu}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <i className={`fa-solid ${isSelected ? 'fa-folder-open' : 'fa-folder'} text-xs`} />
                          <span className="truncate">{cat.ten_tai_lieu}</span>
                        </span>
                        <span
                          className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-elevated text-secondary border border-border-subtle'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="my-1 border-t border-border-subtle" />

                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(true);
                    setIsCategoryDropdownOpen(false);
                  }}
                  className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-primary hover:bg-primary/5 flex items-center justify-between transition-colors cursor-pointer border border-primary/20 hover:border-primary/40 bg-primary/2"
                  title="Mở bảng cấu hình Quản lý Danh mục & Loại tài liệu"
                >
                  <span className="flex items-center gap-2 truncate">
                    <i className="fa-solid fa-folder-tree text-xs text-primary" />
                    <span className="truncate">Cài đặt &amp; Quản lý danh mục</span>
                  </span>
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-primary/70 shrink-0" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hàng Cấp 2 — Sub-chips & Dropdown Loại tài liệu (đồng bộ 100% với Cấp 1) */}
        {selectedCategory !== 'all' && availableTypesForFilter.length > 0 && (
          <div className="relative z-10 flex items-stretch h-11 bg-surface-elevated/40 rounded-b-xl">
            {/* Cột 1: Nhãn Loại tài liệu (cố định bên trái, độ rộng w-[130px] thẳng hàng với Cột 1 hàng trên) */}
            <div className="w-[130px] shrink-0 flex items-center justify-center px-3 border-r border-border-subtle rounded-bl-xl">
              <span className="text-[11px] text-muted font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <i className="fa-solid fa-sitemap text-[10px] text-primary" />
                {t('resourceManagement.fieldType')}:
              </span>
            </div>

            {/* Cột 2: Nút cuộn trái loại tài liệu */}
            <button
              type="button"
              onClick={() => scrollTypes('left')}
              className="w-9 shrink-0 flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors border-r border-border-subtle cursor-pointer"
              aria-label="Cuộn loại tài liệu sang trái"
              title="Cuộn loại tài liệu sang trái"
            >
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>

            {/* Cột 3: Vùng chips loại tài liệu cuộn ngang (bao gồm chip Tất cả nằm ở đầu) */}
            <div
              ref={typeBarRef}
              className="flex items-center gap-1.5 px-2.5 overflow-x-auto scrollbar-none flex-1 min-w-0"
              style={{ scrollbarWidth: 'none' }}
            >
              {/* Chip "Tất cả" loại tài liệu (chuyển sang bên này cùng hàng với các loại) */}
              <button
                type="button"
                onClick={() => { setSelectedType('all'); setCurrentPage(1); }}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedType === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface text-secondary border border-border-subtle hover:border-primary hover:text-primary'
                }`}
              >
                <span>{t('resourceManagement.all')}</span>
                <span className={`text-[10px] font-bold ${
                  selectedType === 'all' ? 'text-white/80' : 'text-muted'
                }`}>
                  ({documents.filter((d) => d.dm_tai_lieu === Number(selectedCategory)).length})
                </span>
              </button>

              {availableTypesForFilter.map((t) => {
                const isActive = selectedType === String(t.id);
                const docCount = documents.filter(
                  (d) =>
                    d.dm_tai_lieu === Number(selectedCategory) &&
                    Array.isArray(d.loai_tai_lieu) &&
                    d.loai_tai_lieu.includes(t.id)
                ).length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSelectedType(String(t.id)); setCurrentPage(1); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface text-secondary border border-border-subtle hover:border-primary hover:text-primary'
                    }`}
                    title={t.ghi_chu || t.ten_loai}
                  >
                    {!t.is_public && (
                      <i className="fa-solid fa-lock text-[9px] opacity-70" />
                    )}
                    <span>{t.ten_loai}</span>
                    <span className={`text-[10px] font-bold ${
                      isActive ? 'text-white/80' : 'text-muted'
                    }`}>
                      ({docCount})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cột 4: Nút cuộn phải loại tài liệu */}
            <button
              type="button"
              onClick={() => scrollTypes('right')}
              className="w-9 shrink-0 flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors border-l border-border-subtle cursor-pointer"
              aria-label="Cuộn loại tài liệu sang phải"
              title="Cuộn loại tài liệu sang phải"
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>

            {/* Cột 5: Nút dropdown Loại tài liệu ở góc phải (cố định w-36) */}
            <div className="relative w-36 shrink-0 flex items-stretch border-l border-border-subtle" ref={typeDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTypeDropdownOpen((prev) => !prev);
                  setIsCategoryDropdownOpen(false);
                }}
                className="w-full px-3 text-xs font-semibold text-secondary hover:text-primary hover:bg-surface-elevated transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap rounded-br-xl"
                title="Mở danh sách tất cả Loại tài liệu"
                aria-haspopup="listbox"
                aria-expanded={isTypeDropdownOpen}
              >
                <i className="fa-solid fa-tags text-xs text-primary" />
                <span>Loại tài liệu</span>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {isTypeDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-surface rounded-xl border border-border-subtle shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>Loại tài liệu</span>
                    <span className="text-[10px] text-primary lowercase font-medium">Cấp 2</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('all');
                      setCurrentPage(1);
                      setIsTypeDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selectedType === 'all'
                        ? 'bg-primary text-white font-bold'
                        : 'text-main hover:bg-surface-elevated'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <i className="fa-solid fa-layer-group text-xs" />
                      <span className="truncate">Tất cả loại tài liệu</span>
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedType === 'all' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-secondary border border-border-subtle'
                    }`}>
                      {documents.filter((d) => d.dm_tai_lieu === Number(selectedCategory)).length}
                    </span>
                  </button>

                  <div className="my-1 border-t border-border-subtle" />

                  <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                    {availableTypesForFilter.map((t) => {
                      const isSelected = selectedType === String(t.id);
                      const docCount = documents.filter(
                        (d) =>
                          d.dm_tai_lieu === Number(selectedCategory) &&
                          Array.isArray(d.loai_tai_lieu) &&
                          d.loai_tai_lieu.includes(t.id)
                      ).length;

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedType(String(t.id));
                            setCurrentPage(1);
                            setIsTypeDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white font-bold'
                              : 'text-main hover:bg-surface-elevated'
                          }`}
                          title={t.ghi_chu || t.ten_loai}
                        >
                          <span className="flex items-center gap-2 truncate">
                            {!t.is_public ? (
                              <i className="fa-solid fa-lock text-[10px] opacity-70" />
                            ) : (
                              <i className="fa-solid fa-tag text-xs opacity-70" />
                            )}
                            <span className="truncate">{t.ten_loai}</span>
                          </span>
                          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-surface-elevated text-secondary border border-border-subtle'
                          }`}>
                            {docCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="my-1 border-t border-border-subtle" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(true);
                      setIsTypeDropdownOpen(false);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-primary hover:bg-primary/5 flex items-center justify-between transition-colors cursor-pointer border border-primary/20 hover:border-primary/40 bg-primary/2"
                    title="Mở bảng cấu hình Quản lý Danh mục & Loại tài liệu"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <i className="fa-solid fa-folder-tree text-xs text-primary" />
                      <span className="truncate">Cài đặt &amp; Quản lý danh mục</span>
                    </span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-primary/70 shrink-0" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Khi ở chế độ Tất cả: hiện gợi ý chọn thư mục để lọc sâu */}
        {selectedCategory === 'all' && (
          <div className="px-4 py-2.5 flex items-center gap-2 bg-primary/3 rounded-b-xl border-t border-border-subtle">
            <i className="fa-solid fa-circle-info text-primary text-[11px] shrink-0" />
            <span className="text-[11px] text-secondary">
              Đang xem toàn bộ <strong className="text-main font-bold">{documents.length} tài liệu</strong> trong kho.
              Chọn một <strong className="text-primary">Thư mục</strong> ở trên để lọc theo phòng ban và xem các <strong className="text-primary">Loại tài liệu</strong> con.
            </span>
          </div>
        )}
      </div>

      {/* 2. THANH BỘ LỌC TÌM KIẾM (MỤC 3) */}
      <div className="bg-surface p-3.5 rounded-xl border border-border-subtle shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
          {/* Ô Tìm kiếm rộng rãi: 8 cols */}
          <div className="sm:col-span-2 md:col-span-8 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none" />
            <input
              type="text"
              placeholder={t('resourceManagement.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-[13px] rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-hidden focus:border-primary placeholder:text-muted transition-colors"
              aria-label="Tìm theo tiêu đề, ký hiệu, nơi ban hành"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs p-1 cursor-pointer"
                title="Xóa từ khóa"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {/* Dropdown Năm ban hành - 2 cols */}
          <div className="sm:col-span-1 md:col-span-2 relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-3 pr-8 text-[13px] rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-hidden focus:border-primary cursor-pointer font-medium transition-colors appearance-none"
              aria-label="Lọc theo năm ban hành"
            >
              <option value="all">{t('resourceManagement.allYears')}</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {currentLang === 'en' ? `Year ${yr}` : `Năm ${yr}`}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-xs" />
          </div>

          {/* Dropdown Hiệu lực - 2 cols */}
          <div className="sm:col-span-1 md:col-span-2 relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-3 pr-8 text-[13px] rounded-lg bg-surface-elevated text-main border border-border-subtle focus:outline-hidden focus:border-primary cursor-pointer font-medium transition-colors appearance-none"
              aria-label="Lọc theo tình trạng hiệu lực"
            >
              <option value="all">{t('resourceManagement.allStatuses')}</option>
              <option value="CON_HIEU_LUC">🟢 {t('resourceManagement.statusActive')}</option>
              <option value="CON_HIEU_LUC_1_PHAN">🟡 {t('resourceManagement.statusPartial')}</option>
              <option value="HET_HIEU_LUC">🔴 {t('resourceManagement.statusExpired')}</option>
              <option value="HET_VA_THAY_THE">🟠 {t('resourceManagement.statusExpired')}</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none text-xs" />
          </div>
        </div>

        {/* Chip bộ lọc & Nút Xóa bộ lọc (Mục 3) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border-subtle text-xs">
            <div className="flex flex-wrap items-center gap-1.5 text-secondary">
              <span className="text-muted font-medium mr-0.5">{t('resourceManagement.filteringBadge')}</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>Tìm: "{searchTerm}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                    }}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc tìm kiếm"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>Loại: {types.find((t) => t.id === Number(selectedType))?.ten_loai}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedType('all')}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc loại tài liệu"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
              {selectedYear !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>Năm: {selectedYear}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedYear('all')}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc năm"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-border-subtle text-main font-medium">
                  <span>
                    Hiệu lực: {
                      statusFilter === 'CON_HIEU_LUC'
                        ? 'Còn hiệu lực'
                        : statusFilter === 'CON_HIEU_LUC_1_PHAN'
                          ? 'Còn hiệu lực 1 phần'
                          : statusFilter === 'HET_HIEU_LUC'
                            ? 'Hết hiệu lực'
                            : 'Hết và thay thế'
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="text-muted hover:text-danger cursor-pointer"
                    aria-label="Xóa bộ lọc hiệu lực"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-danger hover:bg-danger-subtle rounded-md transition-colors font-semibold cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-rotate-left text-[11px]" />
              <span>{t('resourceManagement.clearFilter')}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. THANH KẾT QUẢ TRÊN BẢNG (MỤC 4) */}
      <div className="flex items-center justify-between text-xs text-secondary px-1">
        <div>
          {totalCount === 0 ? (
            <span>Hiển thị <strong className="text-main font-bold">0 / 0</strong> tài liệu</span>
          ) : (
            <span>
              Hiển thị <strong className="text-main font-bold">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)}</strong> / <strong className="text-main font-bold">{totalCount}</strong> tài liệu
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          icon="fa-file-excel"
          onClick={handleExportExcel}
          isLoading={isExporting}
          title={t('resourceManagement.exportTooltip')}
          aria-label={t('resourceManagement.exportTooltip')}
          className="text-xs font-semibold"
        >
          {t('resourceManagement.exportExcel')}
        </Button>
      </div>

      {/* 4. BẢNG DỮ LIỆU TÀI LIỆU CHÍNH (MỤC 5) */}
      <ResourceTable
        items={paginatedDocuments}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownloadFile={handleDownloadFile}
        onClearFilters={handleClearFilters}
        onDrillDown={(categoryId, typeId) => {
          // Bấm dòng: chuyển sang Tab Thư mục tương ứng + chọn Loại tài liệu
          setSelectedCategory(String(categoryId));
          setSelectedType(typeId ? String(typeId) : 'all');
          setCurrentPage(1);
        }}
      />

      {/* MODAL XEM CHI TIẾT TÀI LIỆU (MỤC 6) */}
      <ResourceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={detailItem}
        onDownloadFile={handleDownloadFile}
        onEdit={(item) => {
          setIsDetailOpen(false);
          handleEdit(item);
        }}
        onDelete={(item) => {
          setIsDetailOpen(false);
          handleDelete(item);
        }}
      />

      {/* MODAL THÊM MỚI / SỬA TÀI LIỆU (MỤC 7) */}
      <ResourceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={formInitialData}
        categories={categories}
        types={types}
      />

      {/* MODAL QUẢN LÝ CẤU TRÚC DANH MỤC CẤP 1 & LOẠI BIỂU MẪU CẤP 2 (MỤC 8) */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        types={types}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onSaveType={handleSaveType}
        onDeleteType={handleDeleteType}
      />

      {/* MODAL XÁC NHẬN XÓA TÀI LIỆU (MỤC 5) */}
      {isDeleteOpen && deleteItem && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => {
            if (!isDeleting) {
              setIsDeleteOpen(false);
              setDeleteItem(null);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-surface rounded-2xl border border-border-subtle shadow-xl p-6 space-y-4 animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-danger-subtle text-danger flex items-center justify-center text-xl shrink-0">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <div>
                <h3 className="text-base font-bold text-main">
                  {t('resourceManagement.confirmDeleteTitle')}
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  {t('resourceManagement.confirmDeleteDesc', { code: deleteItem.ky_hieu || deleteItem.tieu_de })}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-surface-elevated rounded-xl border border-border-subtle text-xs space-y-1.5">
              <div className="text-muted font-medium">{t('resourceManagement.docToDelete')}</div>
              <div className="font-semibold text-main text-sm line-clamp-2">
                {deleteItem.tieu_de}
              </div>
              {deleteItem.ky_hieu && (
                <div className="font-mono text-muted">
                  {t('resourceManagement.colCode')}: <span className="text-main font-semibold">{deleteItem.ky_hieu}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-danger font-medium flex items-center gap-1.5">
              <i className="fa-solid fa-circle-exclamation text-xs" />
              <span>{t('resourceManagement.confirmDeleteNote')}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
              <Button
                variant="secondary"
                size="md"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteItem(null);
                }}
              >
                {t('resourceManagement.cancel')}
              </Button>
              <Button
                variant="danger"
                size="md"
                icon="fa-trash"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                {t('resourceManagement.delete')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* TOAST THÔNG BÁO HOÀN TẤT THAO TÁC */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg animate-slide-in-bottom">
          <i className="fa-solid fa-circle-check text-base shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white ml-1 cursor-pointer"
            aria-label="Đóng"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
