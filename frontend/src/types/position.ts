export interface Position {
  id: number;
  stt_uu_tien: number;
  ten_chuc_vu: string;
  is_public: boolean;
  ghi_chu: string | null;
}

export interface PositionFormData {
  stt_uu_tien?: number | null;
  ten_chuc_vu: string;
  is_public: boolean;
  ghi_chu: string;
}

export interface PositionImportError {
  row: number;
  field: 'stt_uu_tien' | 'ten_chuc_vu' | 'is_public';
  code: string;
  value: string;
}

export interface PositionImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: PositionImportError[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
