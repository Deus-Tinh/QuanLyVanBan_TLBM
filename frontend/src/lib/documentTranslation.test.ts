import { describe, it, expect } from 'vitest';
import { getDocumentDisplaySummary, DOCUMENT_SUMMARY_EN_MAP } from './documentTranslation';

describe('documentTranslation utility', () => {
  it('giữ nguyên trích yếu gốc khi ngôn ngữ là vi', () => {
    const raw = 'V/v hướng dẫn thực hiện công tác kiểm định chất lượng đào tạo và chuẩn đầu ra năm học 2026 - 2027';
    expect(getDocumentDisplaySummary({ trich_yeu: raw }, 'vi')).toBe(raw);
  });

  it('dịch chính xác văn bản mẫu chuẩn khi ngôn ngữ là en', () => {
    const raw = 'V/v hướng dẫn thực hiện công tác kiểm định chất lượng đào tạo và chuẩn đầu ra năm học 2026 - 2027';
    expect(getDocumentDisplaySummary({ trich_yeu: raw }, 'en')).toBe(DOCUMENT_SUMMARY_EN_MAP[raw]);
  });

  it('dịch văn bản đi mẫu chuẩn khi ngôn ngữ là en', () => {
    const raw = 'Quyết định ban hành Quy chế bảo vệ thông tin và vận hành hệ thống phần mềm ITC';
    expect(getDocumentDisplaySummary({ trich_yeu: raw }, 'en')).toBe(DOCUMENT_SUMMARY_EN_MAP[raw]);
  });

  it('dịch dữ liệu kiểm thử QA khi ngôn ngữ là en', () => {
    const raw = 'QA kiểm thử luồng tiếp nhận văn bản đến; dữ liệu giả lập, không dùng trong nghiệp vụ thực tế. [ĐÃ CHÍNH SỬA QA]';
    expect(getDocumentDisplaySummary({ trich_yeu: raw }, 'en')).toBe(DOCUMENT_SUMMARY_EN_MAP[raw]);
  });

  it('ưu tiên trich_yeu_en nếu backend cung cấp', () => {
    const doc = {
      trich_yeu: 'Văn bản gốc tiếng Việt',
      trich_yeu_en: 'Custom English Summary from Server',
    };
    expect(getDocumentDisplaySummary(doc, 'en')).toBe('Custom English Summary from Server');
  });

  it('áp dụng quy tắc tiền tố hành chính chuẩn hóa nếu không có trong từ điển mẫu', () => {
    const doc = { trich_yeu: 'Thông báo về việc tổ chức tập huấn cán bộ quý 4' };
    expect(getDocumentDisplaySummary(doc, 'en')).toBe('Notice on việc tổ chức tập huấn cán bộ quý 4');

    const doc2 = { trich_yeu: 'Quyết định ban hành nội quy cơ quan mới' };
    expect(getDocumentDisplaySummary(doc2, 'en')).toBe('Decision on promulgation of nội quy cơ quan mới');
  });

  it('xử lý an toàn khi doc rỗng hoặc không có trich_yeu', () => {
    expect(getDocumentDisplaySummary(null, 'vi')).toBe('');
    expect(getDocumentDisplaySummary(null, 'en')).toBe('');
    expect(getDocumentDisplaySummary({}, 'en')).toBe('');
  });
});
