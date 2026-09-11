/**
 * Application Constants
 */

export const DEPARTMENTS = [
  { code: 'ALL', name: 'Tất cả phòng ban' },
  { code: 'HĐQT', name: 'Hội đồng Quản trị' },
  { code: 'BAN_TGD', name: 'Ban Tổng Giám đốc' },
  { code: 'KD', name: 'Phòng Kinh doanh' },
  { code: 'NV', name: 'Phòng Nghiệp vụ' },
  { code: 'HT', name: 'Phòng Hỗ trợ' },
  { code: 'BL_HCM', name: 'Bán lẻ TP. Hồ Chí Minh' },
  { code: 'BL_HN', name: 'Bán lẻ Hà Nội' },
];

export const THEMES = [
  {
    id: 'skeuomorphism',
    name: 'Skeuomorphism 3D',
    desc: 'Đổ bóng nổi khối, tactile phím gõ, màu đá xám tự nhiên',
    icon: 'fa-cube',
  },
  {
    id: 'dark',
    name: 'Dark Mesh Kim Cương',
    desc: 'Nền lưới xám đen vàng kim, viền vàng kim, sang trọng',
    icon: 'fa-moon',
  },
  {
    id: 'light',
    name: 'Executive Light',
    desc: 'Kính mờ thanh lịch, sắc thái xanh navy công sở dịu mắt',
    icon: 'fa-sun',
  },
];

export const NAV_GROUPS = [
  {
    title: 'Tổng quan',
    items: [
      { id: 'dashboard', label: 'Bàn làm việc tổng quan', icon: 'fa-gauge-high', active: false },
    ],
  },
  {
    title: 'Xử lý Văn bản',
    items: [
      { id: 'vb-den', label: 'Văn bản Đến', icon: 'fa-inbox', badge: '12', badgeType: 'primary' },
      { id: 'vb-di', label: 'Văn bản Đi', icon: 'fa-paper-plane', badge: '5', badgeType: 'success' },
      { id: 'vb-mat', label: 'Văn bản Mật & Khẩn', icon: 'fa-shield-halved', badge: '2', badgeType: 'danger' },
      { id: 'vb-noibo', label: 'Văn bản Nội bộ', icon: 'fa-file-lines' },
    ],
  },
  {
    title: 'Lưu trữ & Tra cứu',
    items: [
      { id: 'ho-so', label: 'Hồ sơ Công việc', icon: 'fa-folder-closed' },
      { id: 'kho-luutru', label: 'Kho lưu trữ số', icon: 'fa-box-archive' },
    ],
  },
  {
    title: 'Tiện ích & Phúc lợi CBNV',
    items: [
      { id: 'sinh-nhat', label: 'Sinh nhật CBNV', icon: 'fa-cake-candles', active: true, badge: 'Mới', badgeType: 'warning' },
      { id: 'lich-tuan', label: 'Lịch công tác tuần', icon: 'fa-calendar-week' },
      { id: 'dat-xe-hop', label: 'Đăng ký phòng họp & xe', icon: 'fa-handshake' },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { id: 'cau-hinh', label: 'Cấu hình hệ thống', icon: 'fa-sliders' },
      { id: 'phan-quyen', label: 'Phân quyền người dùng', icon: 'fa-users-gear' },
    ],
  },
];
