import { NavGroup } from '../types/navigation';
import { ThemeOption } from '../types/theme';
import { UserProfile } from '../types/user';
import { StreamData } from '../types/notification';

export const CURRENT_USER: UserProfile = {
  id: 1,
  username: 'chautuankiet',
  fullName: 'Châu Tuấn Kiệt',
  role: 'Project Manager (PM) · Nhóm 1',
  team: 'Nhóm 1 (Layout & Dashboard)',
  department: 'Ban Công Nghệ Thông Tin',
  avatar: '👨‍💼',
  email: 'kiet.ct@itc.edu.vn',
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dark',
    name: 'Sleek Dark',
    icon: 'fa-moon',
    description: 'Nền tối chống mỏi mắt, tương phản cao',
  },
  {
    id: 'light',
    name: 'Clean Light',
    icon: 'fa-sun',
    description: 'Giao diện văn phòng sáng sủa, thanh lịch',
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    icon: 'fa-wand-magic-sparkles',
    description: 'Kính mờ bóng bẩy, phong cách hiện đại',
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'nhom_1',
    groupTitle: 'Bàn Làm Việc & Tổng Quan',
    teamTag: 'Nhóm 1',
    items: [
      {
        id: 'dashboard',
        label: 'Trang Chủ Dashboard',
        icon: 'fa-gauge-high',
        badge: 'Live',
        badgeColor: 'blue',
      },
    ],
  },
  {
    id: 'nhom_2',
    groupTitle: 'Quản Lý Văn Bản',
    teamTag: 'Nhóm 2',
    items: [
      {
        id: 'documents_incoming',
        label: 'Văn Bản Đến',
        icon: 'fa-inbox',
        badge: 12,
        badgeColor: 'blue',
      },
      {
        id: 'documents_outgoing',
        label: 'Văn Bản Đi',
        icon: 'fa-paper-plane',
        badge: 5,
        badgeColor: 'emerald',
      },
      {
        id: 'documents_confidential',
        label: 'Văn Bản Mật',
        icon: 'fa-shield-halved',
        badge: 2,
        badgeColor: 'rose',
      },
    ],
  },
  {
    id: 'nhom_3',
    groupTitle: 'Hồ Sơ & Lưu Trữ',
    teamTag: 'Nhóm 3',
    items: [
      {
        id: 'records',
        label: 'Danh Mục Hồ Sơ',
        icon: 'fa-folder-tree',
      },
    ],
  },
  {
    id: 'nhom_4',
    groupTitle: 'Tài Liệu & Biểu Mẫu',
    teamTag: 'Nhóm 4',
    items: [
      {
        id: 'resources',
        label: 'Kho Tài Liệu Chung',
        icon: 'fa-file-lines',
      },
    ],
  },
  {
    id: 'nhom_5',
    groupTitle: 'Trình Ký Số',
    teamTag: 'Nhóm 5',
    items: [
      {
        id: 'approvals',
        label: 'Quy Trình Ký Số',
        icon: 'fa-file-signature',
        badge: '3 chờ ký',
        badgeColor: 'amber',
      },
    ],
  },
  {
    id: 'nhom_6',
    groupTitle: 'Giao Việc & Tiến Độ',
    teamTag: 'Nhóm 6',
    items: [
      {
        id: 'tasks',
        label: 'Quản Lý Công Việc',
        icon: 'fa-list-check',
        badge: 8,
        badgeColor: 'purple',
      },
    ],
  },
  {
    id: 'nhom_7',
    groupTitle: 'Tiện Ích & Quản Trị',
    teamTag: 'Nhóm 7',
    items: [
      {
        id: 'birthdays',
        label: 'Sinh Nhật CBNV',
        icon: 'fa-cake-candles',
        badge: 'Hôm nay',
        badgeColor: 'rose',
      },
      {
        id: 'meetings',
        label: 'Đặt Phòng Họp',
        icon: 'fa-calendar-days',
      },
      {
        id: 'organizations',
        label: 'Đơn Vị & Phòng Ban',
        icon: 'fa-sitemap',
      },
      {
        id: 'employees',
        label: 'Hồ Sơ Cán Bộ NV',
        icon: 'fa-users',
      },
    ],
  },
  {
    id: 'nhom_8',
    groupTitle: 'Trợ Lý AI',
    teamTag: 'Nhóm 8',
    items: [
      {
        id: 'ai_assistant',
        label: 'AI Chat Tra Cứu',
        icon: 'fa-robot',
        badge: 'GPT-4o',
        badgeColor: 'emerald',
      },
    ],
  },
];

export const SAMPLE_STREAMS: StreamData[] = [
  {
    type: 'incoming',
    label: 'Văn Bản Đến',
    icon: 'fa-inbox',
    color: 'blue',
    unreadCount: 3,
    items: [
      {
        id: 'in_1',
        code: '128/QĐ-BGDĐT',
        title: 'Quyết định hướng dẫn công tác tuyển sinh và tổ chức năm học mới',
        senderOrDept: 'Bộ Giáo dục & Đào tạo',
        time: '10 phút trước',
        isRead: false,
        priority: 'urgent',
      },
      {
        id: 'in_2',
        code: '45/CV-UBND',
        title: 'Công văn tăng cường bảo đảm an toàn thông tin cơ sở dữ liệu',
        senderOrDept: 'UBND TP.HCM',
        time: '45 phút trước',
        isRead: false,
        priority: 'normal',
      },
      {
        id: 'in_3',
        code: '09/TB-ITC',
        title: 'Thông báo lịch họp hội đồng khoa học kỳ 2 năm 2026',
        senderOrDept: 'Phòng Đào tạo ITC',
        time: '2 giờ trước',
        isRead: false,
        priority: 'normal',
      },
    ],
  },
  {
    type: 'outgoing',
    label: 'Văn Bản Đi',
    icon: 'fa-paper-plane',
    color: 'emerald',
    unreadCount: 2,
    items: [
      {
        id: 'out_1',
        code: '312/TTr-TLBM',
        title: 'Tờ trình phê duyệt triển khai thử nghiệm hệ thống văn bản số',
        senderOrDept: 'Ban Giám Hiệu',
        time: '1 giờ trước',
        isRead: false,
        priority: 'urgent',
      },
      {
        id: 'out_2',
        code: '88/BC-CNTT',
        title: 'Báo cáo rà soát cấu hình phân quyền dữ liệu CBNV quý 3',
        senderOrDept: 'Ban CNTT',
        time: '3 giờ trước',
        isRead: false,
        priority: 'normal',
      },
    ],
  },
  {
    type: 'confidential',
    label: 'Văn Bản Mật',
    icon: 'fa-shield-halved',
    color: 'rose',
    unreadCount: 1,
    items: [
      {
        id: 'sec_1',
        code: '03/MẬT-HĐQT',
        title: 'Nghị quyết mật về phương án quy hoạch nhân sự cấp cao 2026 - 2030',
        senderOrDept: 'Hội đồng Quản trị',
        time: 'Hôm nay lúc 09:30',
        isRead: false,
        priority: 'confidential',
      },
    ],
  },
];
