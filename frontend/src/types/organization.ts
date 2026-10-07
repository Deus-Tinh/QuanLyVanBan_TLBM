/**
 * Types definition for Module 7.3: Organizations (Regions & Units)
 */

export interface Region {
  id: number;
  ten: string;
  don_vi_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Unit {
  id: number;
  khoi: number;
  khoi_ten?: string;
  stt_uu_tien: number;
  ten: string;
  dia_chi: string;
  dien_thoai: string;
  email: string;
  is_public: boolean;
  ghi_chu: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RegionFormData {
  ten: string;
}

export interface UnitFormData {
  khoi: number | '';
  stt_uu_tien?: number | '';
  ten: string;
  dia_chi?: string;
  dien_thoai?: string;
  email?: string;
  is_public: boolean;
  ghi_chu?: string;
}
