/**
 * Birthday Service (Module 7.2 Quản lý Sinh nhật CBNV)
 * Manages staff directory, greeting cards, and automated email schedule
 */

let staffDirectory = [
  {
    id: 1,
    name: 'Châu Tuấn Kiệt',
    role: 'Project Manager (PM) · Nhóm 1',
    dept: 'HT',
    deptName: 'Ban Công nghệ Thông tin',
    bdayMonth: 9,
    bdayDay: 10,
    email: 'kiet.ct@itc.edu.vn',
    sent: true,
    sentTime: '08:00:00 10/09/2026',
    avatar: '👨‍💼',
    gender: 'male',
  },
  {
    id: 2,
    name: 'Trần Vũ Giang Anh',
    role: 'Trưởng nhóm 8 (AI)',
    dept: 'NV',
    deptName: 'Khối Nghiệp vụ Bảo hiểm',
    bdayMonth: 9,
    bdayDay: 10,
    email: 'anh.tvg@itc.edu.vn',
    sent: true,
    sentTime: '08:00:00 10/09/2026',
    avatar: '👩‍💼',
    gender: 'female',
  },
  {
    id: 3,
    name: 'Tô Thanh Tân',
    role: 'Data Architect · Trưởng nhóm 7',
    dept: 'HT',
    deptName: 'Khối Hỗ trợ (CNTT & QTHệ Thống)',
    bdayMonth: 9,
    bdayDay: 11,
    email: 'tan.tt@itc.edu.vn',
    sent: false,
    sentTime: null,
    avatar: '👨‍💻',
    gender: 'male',
  },
  {
    id: 4,
    name: 'Lê Thanh Hậu',
    role: 'DevOps · Trưởng nhóm 5',
    dept: 'HT',
    deptName: 'Ban Pháp chế & Hệ thống',
    bdayMonth: 9,
    bdayDay: 15,
    email: 'hau.lt@itc.edu.vn',
    sent: false,
    sentTime: null,
    avatar: '👨‍🔧',
    gender: 'male',
  },
  {
    id: 5,
    name: 'Phan Thị Ánh Tuyền',
    role: 'Trưởng nhóm 3 (Hồ sơ)',
    dept: 'KD',
    deptName: 'Khối Kinh doanh Bảo hiểm',
    bdayMonth: 9,
    bdayDay: 18,
    email: 'tuyen.pta@itc.edu.vn',
    sent: false,
    sentTime: null,
    avatar: '👩‍💻',
    gender: 'female',
  },
  {
    id: 6,
    name: 'Lê Trí Kiệt',
    role: 'Trưởng nhóm 2 (Văn bản)',
    dept: 'BL_HCM',
    deptName: 'Bảo Long Sài Gòn & Bến Thành',
    bdayMonth: 9,
    bdayDay: 22,
    email: 'kiet.lt@itc.edu.vn',
    sent: false,
    sentTime: null,
    avatar: '👨‍💼',
    gender: 'male',
  },
  {
    id: 7,
    name: 'Thượng Mạnh Quỳnh',
    role: 'Trưởng nhóm 4 (Tài liệu)',
    dept: 'HĐQT',
    deptName: 'Văn phòng Hội đồng Quản trị',
    bdayMonth: 9,
    bdayDay: 25,
    email: 'quynh.tm@itc.edu.vn',
    sent: false,
    sentTime: null,
    avatar: '👩‍⚖️',
    gender: 'female',
  },
  {
    id: 8,
    name: 'Phan Tạ Hữu Đức',
    role: 'Trưởng nhóm 6 (Giao việc)',
    dept: 'BAN_TGD',
    deptName: 'Văn phòng Ban Tổng Giám đốc',
    bdayMonth: 9,
    bdayDay: 28,
    email: 'duc.pth@itc.edu.vn',
    sent: false,
    sentTime: null,
    avatar: '👨‍💼',
    gender: 'male',
  },
];

let cronConfig = {
  enabled: true,
  time: '08:00',
  autoSend: true,
  templateTitle: 'Chúc mừng sinh nhật CBNV TLBM',
  recipientsGroup: 'ALL',
};

export const birthdayService = {
  getAllStaff: () => [...staffDirectory],

  getFilteredStaff: ({ month, day, dept = 'ALL', search = '' }) => {
    return staffDirectory.filter((staff) => {
      const matchMonth = month ? staff.bdayMonth === month : true;
      const matchDay = day ? staff.bdayDay === day : true;
      const matchDept = dept === 'ALL' || staff.dept === dept;
      const matchSearch = !search || staff.name.toLowerCase().includes(search.toLowerCase().trim());
      return matchMonth && matchDay && matchDept && matchSearch;
    });
  },

  getTodayBirthdays: (refDay = 10, refMonth = 9) => {
    return staffDirectory.filter((s) => s.bdayDay === refDay && s.bdayMonth === refMonth);
  },

  getTomorrowBirthdays: (refDay = 11, refMonth = 9) => {
    return staffDirectory.filter((s) => s.bdayDay === refDay && s.bdayMonth === refMonth);
  },

  sendWishCard: async (staffId, customWish = '', sender = 'Ban Tổng Giám đốc & Công đoàn TLBM') => {
    const staff = staffDirectory.find((s) => s.id === staffId);
    if (!staff) throw new Error('Không tìm thấy cán bộ nhân viên');

    staff.sent = true;
    staff.sentTime = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
    staff.lastWish = customWish;
    staff.sender = sender;

    return {
      success: true,
      message: `Đã gửi thiệp chúc mừng thành công tới ${staff.name} (${staff.email})`,
      staff,
    };
  },

  getCronConfig: () => ({ ...cronConfig }),

  updateCronConfig: async (newConfig) => {
    cronConfig = { ...cronConfig, ...newConfig };
    return {
      success: true,
      message: 'Cập nhật lịch phát tự động thành công',
      config: { ...cronConfig },
    };
  },
};
