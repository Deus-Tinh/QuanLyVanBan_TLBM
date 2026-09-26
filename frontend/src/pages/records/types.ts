export interface RecordItem {
  id: number;
  code: string;
  title: string;
  category: string;
  status: 'active' | 'archived' | 'pending';
  created_at: string;
  updated_at: string;
  owner?: string;
  description?: string;
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

export const STATUS_META: Record<StatusKey, { label: string; color: 'success' | 'warning' | 'default' }> = {
  active:   { label: 'Đang lưu hành', color: 'success' },
  pending:  { label: 'Chờ xử lý',     color: 'warning' },
  archived: { label: 'Đã lưu trữ',    color: 'default' },
};
