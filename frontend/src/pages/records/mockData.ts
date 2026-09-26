import type { RecordItem, DocumentType } from './types';

export const MOCK_RECORDS: RecordItem[] = [
  { id: 1, code: 'HS-2026-001', title: 'Hồ sơ tuyển dụng Q1/2026',        category: 'Nhân sự',   status: 'active',   created_at: '2026-01-10', updated_at: '2026-03-15', owner: 'Nguyễn Văn A' },
  { id: 2, code: 'HS-2026-002', title: 'Hồ sơ hợp đồng bảo hiểm BL-001', category: 'Hợp đồng',  status: 'active',   created_at: '2026-02-05', updated_at: '2026-02-20', owner: 'Trần Thị B'   },
  { id: 3, code: 'HS-2026-003', title: 'Hồ sơ thanh lý tài sản 2025',     category: 'Tài chính', status: 'archived', created_at: '2025-12-01', updated_at: '2026-01-05', owner: 'Lê Văn C'     },
  { id: 4, code: 'HS-2026-004', title: 'Hồ sơ dự án chuyển đổi số',       category: 'Dự án',     status: 'active',   created_at: '2026-03-01', updated_at: '2026-09-20', owner: 'Phạm Thị D'   },
  { id: 5, code: 'HS-2026-005', title: 'Hồ sơ khiếu nại bồi thường',      category: 'Nghiệp vụ', status: 'pending',  created_at: '2026-08-15', updated_at: '2026-09-10', owner: 'Hoàng Văn E'  },
  { id: 6, code: 'HS-2026-006', title: 'Hồ sơ kiểm toán nội bộ',          category: 'Kiểm toán', status: 'active',   created_at: '2026-07-01', updated_at: '2026-09-01', owner: 'Vũ Thị F'     },
  { id: 7, code: 'HS-2026-007', title: 'Hồ sơ pháp lý doanh nghiệp',      category: 'Pháp lý',   status: 'active',   created_at: '2026-01-20', updated_at: '2026-06-30', owner: 'Đặng Văn G'   },
  { id: 8, code: 'HS-2026-008', title: 'Hồ sơ đào tạo nghiệp vụ 2026',   category: 'Nhân sự',   status: 'pending',  created_at: '2026-04-01', updated_at: '2026-09-22', owner: 'Bùi Thị H'    },
];

export const MOCK_DOC_TYPES: DocumentType[] = [
  { id: 1, code: 'VB-DEN', name: 'Văn bản đến',    description: 'Các văn bản nhận từ bên ngoài',    is_active: true,  created_at: '2024-01-01' },
  { id: 2, code: 'VB-DI',  name: 'Văn bản đi',     description: 'Các văn bản phát hành ra ngoài',   is_active: true,  created_at: '2024-01-01' },
  { id: 3, code: 'VB-MAT', name: 'Văn bản mật',    description: 'Tài liệu có độ mật theo quy định', is_active: true,  created_at: '2024-01-01' },
  { id: 4, code: 'VB-NOI', name: 'Văn bản nội bộ', description: 'Lưu hành nội bộ',                  is_active: true,  created_at: '2024-02-15' },
  { id: 5, code: 'VB-HOP', name: 'Biên bản họp',   description: 'Biên bản các cuộc họp',            is_active: true,  created_at: '2024-03-01' },
  { id: 6, code: 'VB-HD',  name: 'Hợp đồng',       description: 'Hợp đồng kinh tế, lao động',      is_active: false, created_at: '2024-01-01' },
];
