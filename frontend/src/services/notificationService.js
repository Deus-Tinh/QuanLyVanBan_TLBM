/**
 * Notification Service (3 Streams: Đến, Đi, Mật)
 */

const mockNotifications = {
  incoming: [
    {
      id: 'den-1',
      code: 'CV-104/BTC-TCDN',
      title: 'Hướng dẫn kiểm toán báo cáo tài chính bán niên 2026',
      sender: 'Bộ Tài chính',
      time: '14:20 10/09/2026',
      unread: true,
      priority: 'normal',
    },
    {
      id: 'den-2',
      code: 'NQ-88/HĐQT-TLBM',
      title: 'Nghị quyết thông qua kế hoạch chuyển đổi số Quý IV',
      sender: 'Văn phòng HĐQT',
      time: '11:05 10/09/2026',
      unread: true,
      priority: 'high',
    },
    {
      id: 'den-3',
      code: 'TB-45/BCA-ANM',
      title: 'Cảnh báo nguy cơ an ninh mạng và lộ lọt dữ liệu nội bộ',
      sender: 'Cục An ninh Mạng',
      time: '09:15 10/09/2026',
      unread: false,
      priority: 'urgent',
    },
  ],
  outgoing: [
    {
      id: 'di-1',
      code: 'TTr-12/TGD-VP',
      title: 'Tờ trình phê duyệt kinh phí bảo trì máy chủ trung tâm',
      receiver: 'Ban Tổng Giám đốc',
      time: '13:45 10/09/2026',
      status: 'Đã ký duyệt',
    },
    {
      id: 'di-2',
      code: 'TB-33/NS-TLBM',
      title: 'Thông báo lịch nghỉ phép và phân công trực cuối tuần',
      receiver: 'Toàn thể CBNV',
      time: '10:30 10/09/2026',
      status: 'Đang ban hành',
    },
  ],
  confidential: [
    {
      id: 'mat-1',
      code: 'MẬT-04/HĐQT',
      title: 'Phương án tái cơ cấu vốn đầu tư chiến lược 2026 - 2030',
      securityLevel: 'Tối mật',
      signer: 'Chủ tịch HĐQT',
      time: '08:30 10/09/2026',
      unread: true,
    },
    {
      id: 'mat-2',
      code: 'HỎA TỐC-09/BQP',
      title: 'Kế hoạch hiệp đồng phòng chống lụt bão khu vực miền Trung',
      securityLevel: 'Hỏa tốc',
      signer: 'Bộ Quốc phòng',
      time: '07:15 10/09/2026',
      unread: true,
    },
  ],
};

export const notificationService = {
  getStreams: () => ({ ...mockNotifications }),

  getUnreadCounts: () => ({
    incoming: mockNotifications.incoming.filter((n) => n.unread).length,
    outgoing: mockNotifications.outgoing.length,
    confidential: mockNotifications.confidential.filter((n) => n.unread).length,
  }),
};
