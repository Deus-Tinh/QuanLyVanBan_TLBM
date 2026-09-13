import { NavGroup, MainModule } from '../types/navigation';
import { ThemeOption, ThemeMode } from '../types/theme';
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
  // 1. Nhóm Kinh Điển (Classic & Modern)
  {
    id: 'dark',
    name: 'Sleek Dark',
    icon: 'fa-moon',
    category: 'classic',
    categoryLabel: 'Kinh Điển',
    description: 'Nền tối chống mỏi mắt, công nghệ hiện đại',
    previewGradient: 'linear-gradient(135deg, #0b0f17 0%, #1e293b 100%)',
    borderPreview: 'rgba(255, 255, 255, 0.1)',
  },
  {
    id: 'light',
    name: 'Clean Light',
    icon: 'fa-sun',
    category: 'classic',
    categoryLabel: 'Kinh Điển',
    description: 'Văn phòng trang nhã, sáng sủa, thanh lịch',
    previewGradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    borderPreview: '#cbd5e1',
  },
  {
    id: 'minimalism',
    name: 'Minimalism',
    icon: 'fa-circle-half-stroke',
    category: 'classic',
    categoryLabel: 'Kinh Điển',
    description: 'Tối giản Thụy Sĩ, phẳng tuyệt đối, tập trung',
    previewGradient: 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)',
    borderPreview: '#18181b',
  },

  // 2. Nhóm Kính & Khúc Xạ (Glass & Refraction)
  {
    id: 'glass',
    name: 'Glassmorphism',
    icon: 'fa-wand-magic-sparkles',
    category: 'glass',
    categoryLabel: 'Kính & Khúc Xạ',
    description: 'Kính mờ bóng bẩy, viền sáng, chiều sâu',
    previewGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0369a1 100%)',
    borderPreview: 'rgba(255, 255, 255, 0.4)',
  },
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    icon: 'fa-droplet',
    category: 'glass',
    categoryLabel: 'Kính & Khúc Xạ',
    description: 'Thủy tinh lỏng khúc xạ, phản chiếu bóng bẩy',
    previewGradient: 'linear-gradient(135deg, #831843 0%, #09090b 100%)',
    borderPreview: '#f43f5e',
  },

  // 3. Nhóm 3D & Xúc Giác Nổi Khối (Tactile & 3D Morphism)
  {
    id: 'neomorphism',
    name: 'Neomorphism',
    icon: 'fa-cubes',
    category: 'tactile',
    categoryLabel: '3D & Xúc Giác',
    description: 'Bóng kép dập nổi xúc giác, mềm mại nguyên khối',
    previewGradient: 'linear-gradient(135deg, #e0e5ec 0%, #d1d9e6 100%)',
    borderPreview: '#ffffff',
  },
  {
    id: 'claymorphism',
    name: 'Claymorphism',
    icon: 'fa-shapes',
    category: 'tactile',
    categoryLabel: '3D & Xúc Giác',
    description: 'Đất sét 3D bo phồng, bóng trong nổi khối mượt mà',
    previewGradient: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
    borderPreview: '#3b82f6',
  },
  {
    id: 'skeuomorphism',
    name: 'Skeuomorphism',
    icon: 'fa-sliders',
    category: 'tactile',
    categoryLabel: '3D & Xúc Giác',
    description: 'Gờ kim loại cơ học, bóng dập viền vát chân thực',
    previewGradient: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
    borderPreview: '#94a3b8',
  },

  // 4. Nhóm Nghệ Thuật & Đột Phá (Expressive & Bold)
  {
    id: 'brutalism',
    name: 'Brutalism',
    icon: 'fa-cube',
    category: 'expressive',
    categoryLabel: 'Đồ Họa Ấn Tượng',
    description: 'Viền đen dày 2px, bóng khối cứng, màu sắc rực rỡ',
    previewGradient: 'linear-gradient(135deg, #fef08a 0%, #f97316 100%)',
    borderPreview: '#000000',
  },
  {
    id: 'maximalism',
    name: 'Maximalism',
    icon: 'fa-bolt',
    category: 'expressive',
    categoryLabel: 'Đồ Họa Ấn Tượng',
    description: 'Đậm chất nghệ thuật, tem nhãn neon xếp lớp',
    previewGradient: 'linear-gradient(135deg, #09090b 0%, #a3e635 100%)',
    borderPreview: '#a3e635',
  },
];

export const LIGHT_THEMES: ThemeMode[] = [
  'light',
  'minimalism',
  'neomorphism',
  'claymorphism',
  'skeuomorphism',
  'brutalism',
];

export const DARK_THEMES: ThemeMode[] = [
  'dark',
  'glass',
  'liquid-glass',
  'maximalism',
];

export const isLightThemeMode = (theme: ThemeMode): boolean => {
  return LIGHT_THEMES.includes(theme);
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
