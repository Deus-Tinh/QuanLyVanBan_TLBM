// Cán bộ nhân viên — tạm lấy từ auth.User của backend.
// Khi nhóm 7 có model CBNV thật thì bổ sung đơn vị, phòng ban tại đây.

export interface Employee {
  id: number;
  fullName: string;
  position: string;
  username?: string;
}

export interface CurrentUser extends Employee {
  isAdmin: boolean;
}
