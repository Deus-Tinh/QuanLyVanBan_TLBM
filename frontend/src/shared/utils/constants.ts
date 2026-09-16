import { NavGroup, MainModule } from '../types/navigation';
import { ThemeOption, ThemeMode } from '../types/theme';
import { UserProfile } from '../types/user';
import { StreamData } from '../types/notification';

export const CURRENT_USER: UserProfile = {
  id: 1,
  username: 'chautuankiet',
  fullName: 'Châu Tuấn Kiệt',
  role: 'Project Manager (PM)',
  team: 'Ban Công Nghệ Thông Tin',
  department: 'Ban Công Nghệ Thông Tin',
  avatar: '👨‍💼',
  email: 'kiet.ct@itc.edu.vn',
};

// [DEVOPS AUDIT NOTE]:
// previewGradient và borderPreview dưới đây là các ô màu mẫu tĩnh (swatches)
// dùng riêng cho bộ chọn theme (ThemeSelector) để người dùng xem trước màu sắc
// trước khi áp dụng, không phải là style của UI components.
export const THEME_OPTIONS: ThemeOption[] = [
  // 1. Chế độ Tối Hiện Đại (Sleek Dark)
  {
    id: 'dark',
    name: 'Sleek Dark',
    icon: 'fa-moon',
    category: 'modern',
    categoryLabel: 'Chế độ Tối',
    description: 'Nền tối sâu công nghệ chống mỏi mắt, tương phản dịu êm, bảo vệ thị lực tối đa',
    previewGradient: 'linear-gradient(135deg, #0b0f17 0%, #1e293b 100%)',
    borderPreview: 'rgba(56, 189, 248, 0.4)',
  },
  // 2. Chế độ Sáng Hiện Đại (Clean Light)
  {
    id: 'light',
    name: 'Clean Light',
    icon: 'fa-sun',
    category: 'modern',
    categoryLabel: 'Chế độ Sáng',
    description: 'Văn phòng trang nhã, tương phản chuẩn mực, sáng sủa, thanh lịch và chuyên nghiệp',
    previewGradient: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    borderPreview: 'rgba(59, 130, 246, 0.35)',
  },
];

export const LIGHT_THEMES: ThemeMode[] = ['light'];

export const DARK_THEMES: ThemeMode[] = ['dark'];

export const isLightThemeMode = (theme: ThemeMode): boolean => {
  return theme === 'light';
};

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

// ==========================================
// 6 PHÂN HỆ LỚN CHO SIDEBAR DỌC (TẦNG 1)
// Cùng danh mục các trang con cho thanh Tab ngang (Tầng 2)
// ==========================================
export const MAIN_MODULES: MainModule[] = [
  {
    id: 'dashboard',
    label: 'Bàn Làm Việc',
    shortLabel: 'Trang Chủ',
    icon: 'fa-gauge-high',
    teamTag: 'Nhóm 1',
    defaultPage: 'dashboard',
    subItems: [
      {
        id: 'dashboard',
        label: 'Trang Chủ Dashboard',
        icon: 'fa-chart-pie',
        badge: 'Live',
        badgeColor: 'blue',
        description: 'Bàn làm việc tổng quan, thống kê số liệu năm',
      },
    ],
  },
  {
    id: 'documents',
    label: 'Quản Lý Văn Bản',
    shortLabel: 'Văn Bản',
    icon: 'fa-folder-open',
    teamTag: 'Nhóm 2',
    defaultPage: 'documents_incoming',
    subItems: [
      {
        id: 'documents_incoming',
        label: 'Văn Bản Đến',
        icon: 'fa-inbox',
        badge: 12,
        badgeColor: 'blue',
        description: 'Công văn, văn bản ngoài gửi đến đơn vị',
      },
      {
        id: 'documents_outgoing',
        label: 'Văn Bản Đi',
        icon: 'fa-paper-plane',
        badge: 5,
        badgeColor: 'emerald',
        description: 'Văn bản phát hành nội bộ công ty',
      },
      {
        id: 'documents_confidential',
        label: 'Văn Bản Mật',
        icon: 'fa-shield-halved',
        badge: 2,
        badgeColor: 'rose',
        description: 'Văn bản bảo mật gửi đích danh phòng ban',
      },
    ],
  },
  {
    id: 'records_resources',
    label: 'Hồ Sơ & Tài Liệu',
    shortLabel: 'Hồ Sơ & TL',
    icon: 'fa-box-archive',
    teamTag: 'Nhóm 3 & 4',
    defaultPage: 'records',
    subItems: [
      {
        id: 'records',
        label: 'Danh Mục Hồ Sơ',
        icon: 'fa-folder-tree',
        description: 'Quản lý hồ sơ Cấp 1 và phân loại văn bản Cấp 2',
      },
      {
        id: 'resources',
        label: 'Kho Tài Liệu & Biểu Mẫu',
        icon: 'fa-file-lines',
        description: 'Biểu mẫu quy định dùng chung toàn hệ thống',
      },
    ],
  },
  {
    id: 'workflow',
    label: 'Công Việc & Ký Số',
    shortLabel: 'Giao Việc & Ký',
    icon: 'fa-list-check',
    teamTag: 'Nhóm 5 & 6',
    defaultPage: 'tasks',
    subItems: [
      {
        id: 'tasks',
        label: 'Quản Lý Công Việc',
        icon: 'fa-tasks',
        badge: 8,
        badgeColor: 'purple',
        description: 'Theo dõi tiến độ, hạn xử lý và phân công',
      },
      {
        id: 'approvals',
        label: 'Quy Trình Trình Ký',
        icon: 'fa-file-signature',
        badge: '3 chờ ký',
        badgeColor: 'amber',
        description: 'Sơ đồ ký số điện tử và phê duyệt văn bản',
      },
    ],
  },
  {
    id: 'system',
    label: 'Tiện Ích & Hệ Thống',
    shortLabel: 'Hệ Thống',
    icon: 'fa-building-columns',
    teamTag: 'Nhóm 7',
    defaultPage: 'birthdays',
    subItems: [
      {
        id: 'birthdays',
        label: 'Sinh Nhật CBNV',
        icon: 'fa-cake-candles',
        badge: 'Hôm nay',
        badgeColor: 'rose',
        description: 'Lịch sinh nhật cán bộ nhân viên ngày T & T+1',
      },
      {
        id: 'meetings',
        label: 'Đặt Phòng Họp',
        icon: 'fa-calendar-days',
        description: 'Lịch hội nghị, họp trực tuyến các phòng ban',
      },
      {
        id: 'organizations',
        label: 'Đơn Vị & Phòng Ban',
        icon: 'fa-sitemap',
        description: 'Cơ cấu khối, ban và chi nhánh Bảo Long',
      },
      {
        id: 'employees',
        label: 'Hồ Sơ Cán Bộ NV',
        icon: 'fa-users',
        description: 'Danh sách và thông tin nhân sự toàn công ty',
      },
    ],
  },
  {
    id: 'ai',
    label: 'Trợ Lý AI Tra Cứu',
    shortLabel: 'Trợ Lý AI',
    icon: 'fa-robot',
    teamTag: 'Nhóm 8',
    defaultPage: 'ai_assistant',
    subItems: [
      {
        id: 'ai_assistant',
        label: 'AI Chatbox Tra Cứu',
        icon: 'fa-comments',
        badge: 'GPT-4o',
        badgeColor: 'emerald',
        description: 'Trợ lý AI thông minh hỏi đáp quy trình và văn bản',
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
