export interface RecordItem {
  id: number;
  order: number;            // Số TT (thứ tự ưu tiên hiển thị)
  code: string;             // Số ký hiệu hồ sơ / Mã tài liệu
  title: string;            // Tên Tài liệu
  category?: string;        // Danh mục / Khối nghiệp vụ
  status: 'active' | 'archived' | 'pending';
  created_at: string;       // Ngày lập (YYYY-MM-DD)
  updated_at?: string;      // Ngày cập nhật (YYYY-MM-DD)
  owner?: string;           // Người lập
  description?: string;     // Ghi chú / Mô tả
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export type StatusKey = 'active' | 'archived' | 'pending';

export const CATEGORY_OPTIONS = [
  'Quy trình',
  'Nhân sự',
  'Hợp đồng',
  'Tài chính',
  'Dự án',
  'Nghiệp vụ',
  'Kiểm toán',
  'Pháp lý',
];

export const STATUS_META: Record<StatusKey, { label: string; color: 'success' | 'warning' | 'default' }> = {
  active:   { label: 'Đang lưu hành', color: 'success' },
  pending:  { label: 'Chờ xử lý',     color: 'warning' },
  archived: { label: 'Đã lưu trữ',    color: 'default' },
};
