/* ==========================================================================
   TLBM I18N - TRANSLATIONS DICTIONARY (VIETNAMESE & ENGLISH)
   QuanLyVanBan_TLBM — Nhóm 1: Layout & Core Foundation
   Trưởng nhóm / PM: Châu Tuấn Kiệt
   ========================================================================== */

export const translations = {
  vi: {
    // 1. Phân hệ dùng chung (Common)
    common: {
      appName: 'TLBM - Quản Lý Văn Bản & Tài Liệu',
      appSubtitle: 'ITC Django MĐ501911 - GVHD: NCS.ThS. Trần Phương Duy',
      loading: 'Đang tải dữ liệu...',
      error: 'Đã xảy ra lỗi, vui lòng thử lại',
      save: 'Lưu lại',
      cancel: 'Hủy bỏ',
      confirm: 'Xác nhận',
      delete: 'Xóa',
      edit: 'Chỉnh sửa',
      search: 'Tìm kiếm nhanh...',
      filter: 'Bộ lọc',
      refresh: 'Làm mới',
      close: 'Đóng',
      viewAll: 'Xem tất cả',
      status: 'Trạng thái',
      action: 'Thao tác',
      noData: 'Không có dữ liệu hiển thị',
      today: 'Hôm nay',
      tomorrow: 'Ngày mai',
      all: 'Tất cả',
      systemActive: 'Hệ thống đang hoạt động ổn định',
    },

    // 2. Thanh điều hướng (Navigation / Sidebar)
    nav: {
      workspace: 'BÀN LÀM VIỆC CHÍNH',
      dashboard: 'Bàn làm việc (Tổng quan)',
      utilities: 'TIỆN ÍCH & NÂNG CAO',
      birthdays: '7.2 Sinh nhật CBNV',
      documents: 'QUẢN LÝ VĂN BẢN',
      incomingDocs: 'Văn bản đến',
      outgoingDocs: 'Văn bản đi',
      confidentialDocs: 'Văn bản mật (Cơ yếu)',
      internalDocs: 'Văn bản nội bộ',
      reports: 'BÁO CÁO & THỐNG KÊ',
      systemReports: 'Báo cáo tổng hợp',
      auditLog: 'Nhật ký hệ thống',
      settings: 'Cài đặt hệ thống',
      groupBadge: 'Nhóm 1 - Layout',
      version: 'Phiên bản 2.5.0 Full Stack',
    },

    // 3. Tiêu đề và Thanh điều khiển đỉnh (Header)
    header: {
      breadcrumbHome: 'Trang chủ',
      breadcrumbUtilities: 'Tiện ích & Phúc lợi',
      breadcrumbBirthday: 'Sinh nhật CBNV',
      breadcrumbDashboard: 'Bàn làm việc',
      pageTitleBirthday: 'QUẢN LÝ SINH NHẬT CBNV',
      pageTitleDashboard: 'BÀN LÀM VIỆC TỔNG QUAN',
      liveClockTitle: 'Thời gian hệ thống chuẩn',
      notifications: 'Thông báo',
      themeSelector: 'Giao diện hệ thống',
      userRole: 'Châu Tuấn Kiệt (PM / Admin)',
      userDepartment: 'Phòng Công nghệ & Chuyển đổi số',
      languageSelect: 'Ngôn ngữ',
      langVi: 'Tiếng Việt',
      langEn: 'English',
    },

    // 4. Phân hệ Sinh nhật CBNV (Nhóm 7.2)
    birthday: {
      bannerTitle: 'Chúc mừng Sinh nhật Cán bộ Nhân viên',
      bannerSubtitle: 'Hệ thống gửi lời chúc tự động & lưu giữ khoảnh khắc tri ân CBNV',
      todayTitle: 'Sinh nhật hôm nay',
      tomorrowTitle: 'Sinh nhật ngày mai',
      thisMonthTitle: 'Sinh nhật trong tháng',
      upcomingDays: 'Sắp diễn ra trong 7 ngày tới',
      age: 'tuổi',
      turningAge: 'Tròn {age} tuổi',
      department: 'Phòng ban',
      position: 'Chức vụ',
      email: 'Hộp thư',
      phone: 'Điện thoại',
      birthdayDate: 'Ngày sinh',
      sendWish: 'Gửi lời chúc',
      sendGift: 'Tặng quà tri ân',
      wishedBadge: 'Đã gửi lời chúc',
      emptyToday: 'Hôm nay không có sinh nhật cán bộ nhân viên nào.',
      emptyTomorrow: 'Ngày mai không có sinh nhật cán bộ nhân viên nào.',
      wishModalTitle: 'Gửi thiệp mừng & Lời chúc sinh nhật',
      wishInputPlaceholder: 'Nhập nội dung lời chúc ý nghĩa gửi đến đồng nghiệp...',
      wishSuccessAlert: 'Đã gửi lời chúc sinh nhật thành công tới {name}!',
      sampleWish1: 'Chúc mừng sinh nhật! Chúc bạn tuổi mới luôn ngập tràn niềm vui, nhiều sức khỏe và gặt hái thật nhiều thành công trong công việc!',
      sampleWish2: 'Happy Birthday! Chúc bạn một ngày sinh nhật thật ấm áp, ý nghĩa bên gia đình và đồng nghiệp tại TLBM!',
    },

    // 5. Dashboard Bàn làm việc (Nhóm 1)
    dashboard: {
      statsTotalDocs: 'Tổng văn bản lưu trữ',
      statsPendingDocs: 'Văn bản chờ xử lý',
      statsProcessedDocs: 'Văn bản đã ban hành',
      statsUrgentDocs: 'Văn bản hỏa tốc / khẩn',
      recentActivities: 'Nhật ký xử lý văn bản gần đây',
      quickShortcuts: 'Lối tắt thao tác nhanh',
      createNewDoc: 'Tạo văn bản mới',
      dispatchDoc: 'Chuyển xử lý văn bản',
      searchAdvanced: 'Tra cứu nâng cao',
    },

    // 6. Trợ lý ảo AI Chatbot
    ai: {
      title: 'Trợ lý Ảo TLBM AI',
      subtitle: 'Hỗ trợ tra cứu văn bản & thủ tục nhanh chóng',
      placeholder: 'Hỏi AI về quy trình văn bản, sinh nhật hoặc tra cứu số hiệu...',
      send: 'Gửi câu hỏi',
      suggest1: 'Hôm nay có ai sinh nhật không?',
      suggest2: 'Văn bản khẩn cần xử lý hôm nay gồm những gì?',
      suggest3: 'Hướng dẫn quy trình ký số văn bản đi.',
    }
  },

  en: {
    // 1. Common
    common: {
      appName: 'TLBM - Document & Archive Management System',
      appSubtitle: 'ITC Django MĐ501911 - Supervisor: MSc. Tran Phuong Duy',
      loading: 'Loading data...',
      error: 'An error occurred, please try again',
      save: 'Save Changes',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Quick search...',
      filter: 'Filter',
      refresh: 'Refresh',
      close: 'Close',
      viewAll: 'View All',
      status: 'Status',
      action: 'Actions',
      noData: 'No data to display',
      today: 'Today',
      tomorrow: 'Tomorrow',
      all: 'All',
      systemActive: 'System is running smoothly',
    },

    // 2. Navigation / Sidebar
    nav: {
      workspace: 'MAIN WORKSPACE',
      dashboard: 'Dashboard (Overview)',
      utilities: 'UTILITIES & WELFARE',
      birthdays: '7.2 Staff Birthdays',
      documents: 'DOCUMENT MANAGEMENT',
      incomingDocs: 'Incoming Documents',
      outgoingDocs: 'Outgoing Documents',
      confidentialDocs: 'Confidential Documents',
      internalDocs: 'Internal Documents',
      reports: 'REPORTS & ANALYTICS',
      systemReports: 'Consolidated Reports',
      auditLog: 'System Audit Log',
      settings: 'System Settings',
      groupBadge: 'Team 1 - Layout',
      version: 'Version 2.5.0 Full Stack',
    },

    // 3. Header
    header: {
      breadcrumbHome: 'Home',
      breadcrumbUtilities: 'Utilities & Welfare',
      breadcrumbBirthday: 'Staff Birthdays',
      breadcrumbDashboard: 'Workspace',
      pageTitleBirthday: 'STAFF BIRTHDAYS',
      pageTitleDashboard: 'WORKSPACE DASHBOARD',
      liveClockTitle: 'Standard System Time',
      notifications: 'Notifications',
      themeSelector: 'System Theme',
      userRole: 'Chau Tuan Kiet (PM / Administrator)',
      userDepartment: 'Technology & Digital Transformation Dept',
      languageSelect: 'Language',
      langVi: 'Tiếng Việt',
      langEn: 'English',
    },

    // 4. Staff Birthday Module (Team 7.2)
    birthday: {
      bannerTitle: 'Happy Birthday to our Valued Staff',
      bannerSubtitle: 'Automated greeting system & staff celebration archive',
      todayTitle: "Today's Birthdays",
      tomorrowTitle: "Tomorrow's Birthdays",
      thisMonthTitle: "Birthdays This Month",
      upcomingDays: 'Upcoming in next 7 days',
      age: 'years old',
      turningAge: 'Turning {age} years old',
      department: 'Department',
      position: 'Position',
      email: 'Email',
      phone: 'Phone',
      birthdayDate: 'Date of Birth',
      sendWish: 'Send Greeting',
      sendGift: 'Appreciation Gift',
      wishedBadge: 'Greeted',
      emptyToday: 'No staff birthdays scheduled for today.',
      emptyTomorrow: 'No staff birthdays scheduled for tomorrow.',
      wishModalTitle: 'Send Birthday Card & Greetings',
      wishInputPlaceholder: 'Type a meaningful greeting to your colleague...',
      wishSuccessAlert: 'Birthday greetings successfully sent to {name}!',
      sampleWish1: 'Happy Birthday! Wishing you good health, great joy, and brilliant success in your endeavors!',
      sampleWish2: 'Warmest birthday wishes! Have a memorable celebration with your family and colleagues at TLBM!',
    },

    // 5. Dashboard (Team 1)
    dashboard: {
      statsTotalDocs: 'Total Archived Docs',
      statsPendingDocs: 'Pending Processing',
      statsProcessedDocs: 'Issued Documents',
      statsUrgentDocs: 'Urgent / Priority Docs',
      recentActivities: 'Recent Document Audit Log',
      quickShortcuts: 'Quick Shortcuts',
      createNewDoc: 'Create Document',
      dispatchDoc: 'Dispatch Document',
      searchAdvanced: 'Advanced Search',
    },

    // 6. AI Assistant Chatbot
    ai: {
      title: 'TLBM Virtual Assistant AI',
      subtitle: 'Fast lookup for documents & institutional workflows',
      placeholder: 'Ask AI about document workflows, birthdays or file numbers...',
      send: 'Send Inquiry',
      suggest1: "Who celebrates a birthday today?",
      suggest2: "Which urgent documents require attention today?",
      suggest3: "Guide me through the digital signature workflow.",
    }
  }
};
