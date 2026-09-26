/**
 * Type definitions cho phân hệ Phòng họp (Issue #22 - Nhóm 7).
 * Giai đoạn 1 (Đợt 1): Quản lý danh mục phòng họp (PhongHop).
 */

export interface MeetingRoom {
  id: number;
  ten_phong: string;
  vi_tri: string;
  suc_chua: number;
  thiet_bi: string;
  is_public: boolean;
  ghi_chu: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingRoomDTO {
  ten_phong: string;
  vi_tri?: string;
  suc_chua: number;
  thiet_bi?: string;
  is_public?: boolean;
  ghi_chu?: string;
}

export type UpdateMeetingRoomDTO = Partial<CreateMeetingRoomDTO>;

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}
