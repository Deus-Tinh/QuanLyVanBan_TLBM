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
  trang_thai?: 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE' | string;
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
  trang_thai?: 'AVAILABLE' | 'MAINTENANCE' | 'UNAVAILABLE' | string;
  ghi_chu?: string;
}

export type UpdateMeetingRoomDTO = Partial<CreateMeetingRoomDTO>;

export interface BookingUser {
  id: number;
  username: string;
  full_name: string;
  department: string;
  role: string;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface MeetingBooking {
  id: number;
  phong_hop: number;
  phong_hop_detail?: MeetingRoom;
  nguoi_dat: number;
  nguoi_dat_detail?: BookingUser;
  don_vi_to_chuc: string;
  tieu_de: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  so_nguoi_tham_gia: number;
  trang_thai: BookingStatus;
  ghi_chu: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingDTO {
  phong_hop: number;
  tieu_de: string;
  don_vi_to_chuc?: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  so_nguoi_tham_gia?: number;
  ghi_chu?: string;
}

export type UpdateBookingDTO = Partial<CreateBookingDTO> & {
  trang_thai?: BookingStatus;
};

export interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

