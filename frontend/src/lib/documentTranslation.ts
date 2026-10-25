/**
 * Tiện ích chuyển ngữ nội dung trích yếu văn bản (Document Summary Translation)
 * Phục vụ hỗ trợ song ngữ (VI / EN) cho Module 02: Quản lý Văn bản.
 *
 * Nguyên tắc:
 * 1. Khi ngôn ngữ hệ thống là 'vi' -> Giữ nguyên 100% trích yếu gốc tiếng Việt.
 * 2. Khi ngôn ngữ hệ thống là 'en':
 *    - Ưu tiên 1: Giá trị `trich_yeu_en` hoặc `summary_en` nếu API backend trả về.
 *    - Ưu tiên 2: Từ điển ánh xạ chính xác cho toàn bộ 22 văn bản mẫu chuẩn (12 đến, 10 đi) và dữ liệu QA.
 *    - Ưu tiên 3: Dịch tiền tố hành chính chuẩn hóa (V/v -> Re:, Thông báo -> Notice on,...).
 *    - Fallback: Trích yếu gốc nếu không khớp tiền tố.
 */

export const DOCUMENT_SUMMARY_EN_MAP: Record<string, string> = {
  // --- 12 Văn bản Đến mẫu chuẩn năm 2026 ---
  'V/v hướng dẫn thực hiện công tác kiểm định chất lượng đào tạo và chuẩn đầu ra năm học 2026 - 2027':
    'Guidance on conducting training quality accreditation and learning outcomes for academic year 2026 - 2027',
  'Thông báo kế hoạch phát động Tháng hành động vì an toàn thông tin và chuyển đổi số trường học năm 2026':
    'Notice on launch plan of Action Month for Information Security and School Digital Transformation 2026',
  'V/v rà soát, kiểm tra phương án bảo đảm an toàn hệ thống thông tin phục vụ xét tuyển trực tuyến':
    'Review and inspection of information system security plan for online admissions',
  'Hướng dẫn tổ chức Ngày hội tư vấn hướng nghiệp và phân luồng học sinh sau THPT năm 2026':
    'Guidance on organizing Career Guidance and Post-High School Streaming Festival 2026',
  'Thông báo kết luận thanh tra công tác quản lý tài chính và cơ sở vật chất CNTT':
    'Notice of inspection conclusions on financial management and IT infrastructure',
  'Triển khai chỉ tiêu tuyển sinh đào tạo hệ Cao đẳng chính quy nghề trọng điểm quốc gia năm 2026':
    'Implementation of admission quotas for full-time College program in national key occupations 2026',
  'Kế hoạch tổ chức Hội thi kỹ năng nghề cấp Thành phố dành cho học sinh, sinh viên năm 2026':
    'Plan for organizing City-level Vocational Skills Competition for pupils and students 2026',
  'V/v phối hợp bảo đảm an ninh trật tự và phòng cháy chữa cháy khu vực ký túc xá sinh viên':
    'Coordination in ensuring security, order, and fire prevention in student dormitory area',
  'Hướng dẫn tổ chức các hoạt động văn hóa thể thao chào mừng ngày Nhà giáo Việt Nam 20/11':
    'Guidance on organizing cultural and sports activities to celebrate Vietnamese Teachers\' Day Nov 20',
  'Khuyến cáo tăng cường vệ sinh phòng dịch bệnh theo mùa trong môi trường trường học':
    'Recommendations to strengthen seasonal epidemic prevention and hygiene in school environment',
  'Thông báo danh mục đề tài NCKH ứng dụng công nghệ AI được duyệt kinh phí năm 2026':
    'Notice of approved AI technology application research projects list for funding in 2026',
  'Đôn đốc rà soát, đồng bộ thẻ Bảo hiểm y tế điện tử (VssID) cho sinh viên khóa mới':
    'Urging review and synchronization of electronic health insurance cards (VssID) for new students',

  // --- 10 Văn bản Đi mẫu chuẩn năm 2026 ---
  'Quyết định ban hành Quy chế bảo vệ thông tin và vận hành hệ thống phần mềm ITC':
    'Decision on promulgation of Information Protection Regulations and ITC software system operation',
  'Thông báo kế hoạch phát động phong trào thi đua dạy tốt - học tốt năm học 2026':
    'Notice on launching good teaching - good learning emulation movement for academic year 2026',
  'Kế hoạch nâng cấp hạ tầng mạng máy tính thực hành Khoa Công nghệ Thông tin':
    'Plan for upgrading computer practice network infrastructure of Information Technology Faculty',
  'Quyết định kiện toàn Ban chỉ đạo Đảm bảo An toàn thông tin và Chuyển đổi số ITC':
    'Decision on consolidating Steering Committee for Information Security and Digital Transformation of ITC',
  'Thông báo lịch thi đánh giá chuẩn đầu ra Tin học ứng dụng & Ngoại ngữ đợt 1/2026':
    'Notice of examination schedule for Applied IT and Foreign Language exit standards Round 1/2026',
  'Thông báo kế hoạch nghỉ hè và đăng ký bồi dưỡng chuyên môn nghiệp vụ hè 2026':
    'Notice of summer vacation plan and registration for summer 2026 professional training',
  'Quyết định phê duyệt danh mục đề tài Nghiên cứu khoa học sinh viên năm 2025 - 2026':
    'Decision on approving student Scientific Research projects list for academic year 2025 - 2026',
  'Triển khai cấp phát chứng thư số cá nhân và chữ ký số điện tử cho toàn thể cán bộ':
    'Deployment of digital personal certificates and electronic signatures issuance for all staff',
  'Công văn gửi Sở GD&ĐT TP.HCM về việc phối hợp tổ chức tư vấn hướng nghiệp':
    'Official letter to Ho Chi Minh City DOET on coordinating organization of career counseling',
  'Kế hoạch tổ chức Hội thao và Hội diễn văn nghệ chào mừng Ngày thành lập Đoàn 26/3':
    'Plan for organizing Sports Festival and Arts Performance to celebrate Youth Union Foundation Day Mar 26',

  // --- Dữ liệu kiểm thử QA & Mock test ---
  'QA kiểm thử luồng tiếp nhận văn bản đến; dữ liệu giả lập, không dùng trong nghiệp vụ thực tế. [ĐÃ CHÍNH SỬA QA]':
    'QA testing incoming document receiving workflow; simulated test data, not for production use. [QA EDITED]',
  'QA kiểm thử luồng tiếp nhận văn bản đến; dữ liệu giả lập, không dùng trong nghiệp vụ thực tế.':
    'QA testing incoming document receiving workflow; simulated test data, not for production use.',
  'Văn bản hợp nhất quy chế': 'Consolidated regulation document',
  'Quy định tiêu chuẩn kỹ thuật': 'Technical standards regulation',
  'Thông báo phân công lịch trực': 'Notice on duty schedule assignment',
};

// Danh sách quy tắc tiền tố hành chính chuẩn hóa
const PREFIX_RULES: Array<{ pattern: RegExp; prefixEn: string }> = [
  { pattern: /^V\/v\s+/i, prefixEn: 'Re: ' },
  { pattern: /^Về việc\s+/i, prefixEn: 'Re: ' },
  { pattern: /^Thông báo về\s+/i, prefixEn: 'Notice on ' },
  { pattern: /^Thông báo\s+/i, prefixEn: 'Notice on ' },
  { pattern: /^Quyết định ban hành\s+/i, prefixEn: 'Decision on promulgation of ' },
  { pattern: /^Quyết định về\s+/i, prefixEn: 'Decision on ' },
  { pattern: /^Quyết định\s+/i, prefixEn: 'Decision on ' },
  { pattern: /^Kế hoạch tổ chức\s+/i, prefixEn: 'Plan for organizing ' },
  { pattern: /^Kế hoạch\s+/i, prefixEn: 'Plan for ' },
  { pattern: /^Hướng dẫn tổ chức\s+/i, prefixEn: 'Guidance on organizing ' },
  { pattern: /^Hướng dẫn\s+/i, prefixEn: 'Guidance on ' },
  { pattern: /^Báo cáo tình hình\s+/i, prefixEn: 'Report on situation of ' },
  { pattern: /^Báo cáo\s+/i, prefixEn: 'Report on ' },
  { pattern: /^Tờ trình về\s+/i, prefixEn: 'Submission on ' },
  { pattern: /^Tờ trình\s+/i, prefixEn: 'Submission on ' },
  { pattern: /^Công văn về\s+/i, prefixEn: 'Official letter on ' },
  { pattern: /^Công văn\s+/i, prefixEn: 'Official letter on ' },
  { pattern: /^Quy định về\s+/i, prefixEn: 'Regulations on ' },
  { pattern: /^Quy định\s+/i, prefixEn: 'Regulations on ' },
  { pattern: /^Quy chế\s+/i, prefixEn: 'Statute on ' },
];

/**
 * Lấy chuỗi trích yếu hiển thị theo ngôn ngữ hiện tại.
 */
export function getDocumentDisplaySummary(
  doc: { trich_yeu?: string; trich_yeu_en?: string; summary_en?: string } | null | undefined,
  lang: string
): string {
  if (!doc) return '';
  const rawTrichYeu = (doc.trich_yeu || '').trim();

  // Khi đang ở tiếng Việt, trả về trích yếu gốc không thay đổi
  if (lang !== 'en') {
    return rawTrichYeu;
  }

  // 1. Ưu tiên bản dịch backend nếu có
  if (doc.trich_yeu_en && doc.trich_yeu_en.trim()) {
    return doc.trich_yeu_en.trim();
  }
  if (doc.summary_en && doc.summary_en.trim()) {
    return doc.summary_en.trim();
  }

  if (!rawTrichYeu) return '';

  // 2. Tra cứu từ điển ánh xạ chính xác
  if (DOCUMENT_SUMMARY_EN_MAP[rawTrichYeu]) {
    return DOCUMENT_SUMMARY_EN_MAP[rawTrichYeu];
  }

  // Thử tra cứu sau khi loại bỏ khoảng trắng thừa
  const normalizedKey = rawTrichYeu.replace(/\s+/g, ' ');
  if (DOCUMENT_SUMMARY_EN_MAP[normalizedKey]) {
    return DOCUMENT_SUMMARY_EN_MAP[normalizedKey];
  }

  // 3. Quy tắc tiền tố hành chính chuẩn hóa
  for (const rule of PREFIX_RULES) {
    if (rule.pattern.test(rawTrichYeu)) {
      const remainder = rawTrichYeu.replace(rule.pattern, '').trim();
      return `${rule.prefixEn}${remainder}`;
    }
  }

  // Fallback: giữ nguyên trích yếu gốc
  return rawTrichYeu;
}
