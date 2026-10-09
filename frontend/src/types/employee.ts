/**
 * Kiểu dữ liệu cho Phân hệ Quản lý Cán bộ Nhân viên (CBNV - Issue #24).
 * Tác giả: Lê Duy Khánh (leduykhanhdevs).
 */

export type EmployeeStatus = 'dang_lam_viec' | 'nghi_viec';

export interface EmployeeGroup {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  user_id: number;
  username: string;
  email: string;
  ho_ten: string;
  full_name: string;
  ngay_sinh: string | null;
  birthday: string | null;
  is_birthday_masked: boolean;
  don_vi_id: number | null;
  don_vi_ten: string;
  khoi_ten: string;
  chuc_vu_id: number | null;
  chuc_vu_ten: string;
  chuc_danh: string | null;
  sdt: string | null;
  phone: string | null;
  avatar_url: string;
  trang_thai: EmployeeStatus;
  trang_thai_display: string;
  is_active: boolean;
  is_public: boolean;
  ghi_chu: string | null;
  nhom_quyen: EmployeeGroup[];
  has_sensitive_permission: boolean;
  temporary_password?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: number;
  stt_uu_tien: number;
  ten_chuc_vu: string;
  is_public: boolean;
  ghi_chu: string | null;
}

export interface GroupSimple {
  id: number;
  name: string;
}

export interface EmployeeCreatePayload {
  ho_ten: string;
  email: string;
  username?: string;
  password?: string;
  ngay_sinh: string;
  don_vi_id?: number | null;
  chuc_vu_id?: number | null;
  chuc_danh?: string;
  sdt?: string;
  nhom_quyen_ids?: number[];
  trang_thai?: EmployeeStatus;
  is_public?: boolean;
  ghi_chu?: string;
}

export interface EmployeeUpdatePayload {
  ho_ten?: string;
  email?: string;
  ngay_sinh?: string | null;
  don_vi_id?: number | null;
  chuc_vu_id?: number | null;
  chuc_danh?: string;
  sdt?: string;
  nhom_quyen_ids?: number[];
  trang_thai?: EmployeeStatus;
  is_public?: boolean;
  ghi_chu?: string;
  avatar_url?: string;
}

export interface ExcelImportError {
  row: number;
  field?: string;
  code?: string;
  value?: string;
  message: string;
}

export interface ExcelImportResponse {
  success: boolean;
  message: string;
  created_count?: number;
  errors?: ExcelImportError[];
  total_errors?: number;
}
