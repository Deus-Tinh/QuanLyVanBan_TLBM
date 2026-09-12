import React from 'react';
import { ActivePageId } from '../shared/types/navigation';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import LoginPage from '../modules/auth/pages/LoginPage';

interface RouterProps {
  activePage: ActivePageId;
  onNavigate: (page: ActivePageId) => void;
}

// Bảng thông tin chi tiết từng phân hệ theo đúng đề cương ITC - Django - QLVB&TL.md
interface PageMeta {
  title: string;
  module: string;
  assignedTeam: string;
  codeRef: string;
  isGroup1: boolean;
  desc: string;
}

const PAGE_META: Record<ActivePageId, PageMeta> = {
  dashboard: {
    title: 'Bàn Làm Việc & Trang Chủ',
    module: 'Module 1.2: Trang chủ (Dashboard)',
    assignedTeam: 'Nhóm 1 (Châu Tuấn Kiệt PM, Nguyễn Văn Hiếu, Nguyễn Duy Quân)',
    codeRef: 'Mục 1.2 · Độ khó: 0.80',
    isGroup1: true,
    desc: 'Thống kê văn bản năm, sinh nhật T/T+1, phòng họp, tìm kiếm VB đến/đi, top 5 văn bản, công việc, tài liệu.',
  },
  login: {
    title: 'Trang Đăng Nhập Hệ Thống (2 trường hợp: CBNV & Quản trị viên)',
    module: 'Module 1.1: Layout & Đăng nhập',
    assignedTeam: 'Nhóm 1 (Châu Tuấn Kiệt PM, Nguyễn Văn Hiếu, Nguyễn Duy Quân)',
    codeRef: 'Mục 1.1 · Độ khó: 0.60',
    isGroup1: true,
    desc: 'Xác thực tài khoản cán bộ nhân viên và tài khoản quản trị hệ thống với 2 giao diện riêng biệt.',
  },
  profile: {
    title: 'Thông Tin Người Dùng Cá Nhân',
    module: 'Module 1.1: Layout & Thông tin tài khoản',
    assignedTeam: 'Nhóm 1 (Châu Tuấn Kiệt PM, Nguyễn Văn Hiếu, Nguyễn Duy Quân)',
    codeRef: 'Mục 1.1 · Độ khó: 0.60',
    isGroup1: true,
    desc: 'Xem và cập nhật thông tin cá nhân, chức vụ, đơn vị phòng ban, email và số điện thoại.',
  },
  password_change: {
    title: 'Đổi Mật Khẩu Tài Khoản',
    module: 'Module 1.1: Layout & Bảo mật tài khoản',
    assignedTeam: 'Nhóm 1 (Châu Tuấn Kiệt PM, Nguyễn Văn Hiếu, Nguyễn Duy Quân)',
    codeRef: 'Mục 1.1 · Độ khó: 0.60',
    isGroup1: true,
    desc: 'Chức năng đổi mật khẩu người dùng với chính sách bảo mật mã hóa một chiều.',
  },
  documents_incoming: {
    title: 'Quản Lý Văn Bản Đến',
    module: 'Module 2: Quản lý Văn bản (Trang văn bản đến)',
    assignedTeam: 'Nhóm 2 (Lê Trí Kiệt, Nguyễn Anh Đô, Nguyễn Tấn Lộc Khiêm, Trần Nhật Tân)',
    codeRef: 'Mục 2.1 · Độ khó: 1.00',
    isGroup1: false,
    desc: 'Danh sách, chi tiết, bộ lọc theo ngày/năm, thêm mới, import/export Excel, phân quyền xem văn bản đến.',
  },
  documents_outgoing: {
    title: 'Quản Lý Văn Bản Đi Nội Bộ',
    module: 'Module 2: Quản lý Văn bản (Trang văn bản đi)',
    assignedTeam: 'Nhóm 2 (Lê Trí Kiệt, Nguyễn Anh Đô, Nguyễn Tấn Lộc Khiêm, Trần Nhật Tân)',
    codeRef: 'Mục 2.2 · Độ khó: 1.00',
    isGroup1: false,
    desc: 'Văn bản nội bộ phát hành, quản lý người ký, đơn vị nhận, hiệu lực và đính kèm file.',
  },
  documents_confidential: {
    title: 'Quản Lý Văn Bản Mật',
    module: 'Module 2: Quản lý Văn bản (Trang văn bản mật)',
    assignedTeam: 'Nhóm 2 (Lê Trí Kiệt, Nguyễn Anh Đô, Nguyễn Tấn Lộc Khiêm, Trần Nhật Tân)',
    codeRef: 'Mục 2.3 · Độ khó: 1.00',
    isGroup1: false,
    desc: 'Văn bản bảo mật chỉ gửi đích danh phòng ban hoặc CBNV được cấp quyền an ninh.',
  },
  records: {
    title: 'Quản Lý Hồ Sơ & Loại Văn Bản',
    module: 'Module 3: Hồ sơ tài liệu (Cấp 1 & Cấp 2)',
    assignedTeam: 'Nhóm 3 (Đặng Trường Thịnh, Phan Thị Ánh Tuyền, Nguyễn Thị Yến Nhi)',
    codeRef: 'Mục 3.1 & 3.2 · Độ khó: 0.80',
    isGroup1: false,
    desc: 'Danh mục hồ sơ Cấp 1, Loại văn bản Cấp 2 và liên kết văn bản theo hồ sơ.',
  },
  resources: {
    title: 'Kho Tài Liệu & Biểu Mẫu Chung',
    module: 'Module 4: Tài liệu, biểu mẫu',
    assignedTeam: 'Nhóm 4 (Thượng Mạnh Quỳnh, Huỳnh Thị Kim Trang, Nguyễn Chí Tín, Đỗ Trung Phong)',
    codeRef: 'Mục 4.1 & 4.2 · Độ khó: 0.80',
    isGroup1: false,
    desc: 'Danh mục tài liệu Cấp 1 và kho biểu mẫu quy định tải về sử dụng trong toàn đơn vị.',
  },
  approvals: {
    title: 'Quy Trình Trình Ký Số Điện Tử',
    module: 'Module 5: Trình ký điện tử',
    assignedTeam: 'Nhóm 5 (Lê Thanh Hậu, Lê Thành Tài)',
    codeRef: 'Mục 5.1 · Độ khó: 1.00',
    isGroup1: false,
    desc: 'Tạo luồng trình ký, kiểm tra sơ đồ ký, thông báo người ký, gửi email và ký số.',
  },
  tasks: {
    title: 'Giao Việc & Quản Lý Tiến Độ Công Việc',
    module: 'Module 6: Công việc',
    assignedTeam: 'Nhóm 6 (Phan Tạ Hữu Đức, Nguyễn Duy Bảo, Đỗ Ngọc Phát, Lâm Chí Vĩ)',
    codeRef: 'Mục 6.1 · Độ khó: 0.80',
    isGroup1: false,
    desc: 'Danh sách việc, hạn xử lý, người chủ trì/tham gia, ý kiến xử lý và xuất Excel.',
  },
  meetings: {
    title: 'Quản Lý & Đăng Ký Phòng Họp',
    module: 'Module 7.1: Tiện ích Phòng họp',
    assignedTeam: 'Nhóm 7 (Tô Thanh Tân, Lê Duy Khánh, Đỗ Mạnh Quang, Nguyễn Phan Minh Hiếu, Trần Đình Tình)',
    codeRef: 'Mục 7.1 · Độ khó: 0.40',
    isGroup1: false,
    desc: 'Đăng ký phòng họp, theo dõi lịch sử dụng theo ngày và điều phối tài nguyên hội trường.',
  },
  birthdays: {
    title: 'Tiện Ích Sinh Nhật Cán Bộ Nhân Viên (7.2)',
    module: 'Module 7.2: Sinh nhật CBNV',
    assignedTeam: 'Nhóm 7 (Tô Thanh Tân, Lê Duy Khánh, Đỗ Mạnh Quang, Nguyễn Phan Minh Hiếu, Trần Đình Tình)',
    codeRef: 'Mục 7.2 · Độ khó: 0.40',
    isGroup1: false,
    desc: 'Hiển thị lịch sinh nhật CBNV, gửi email chúc mừng tự động khi đến ngày.',
  },
  organizations: {
    title: 'Cơ Cấu Tổ Chức & Đơn Vị Phòng Ban',
    module: 'Module 7.3: Hệ thống (Khối / Khu vực / Phòng ban)',
    assignedTeam: 'Nhóm 7 (Tô Thanh Tân, Lê Duy Khánh, Đỗ Mạnh Quang, Nguyễn Phan Minh Hiếu, Trần Đình Tình)',
    codeRef: 'Mục 7.3 · Độ khó: 0.80',
    isGroup1: false,
    desc: 'Thêm Khối/Khu vực Cấp 1, Đơn vị phòng ban Cấp 2, quản lý số thứ tự ưu tiên.',
  },
  employees: {
    title: 'Quản Lý Hồ Sơ Cán Bộ Nhân Viên (CBNV)',
    module: 'Module 7.5: Quản trị CBNV',
    assignedTeam: 'Nhóm 7 (Tô Thanh Tân, Lê Duy Khánh, Đỗ Mạnh Quang, Nguyễn Phan Minh Hiếu, Trần Đình Tình)',
    codeRef: 'Mục 7.5 · Độ khó: 0.80',
    isGroup1: false,
    desc: 'Danh sách nhân sự, chức vụ, nhóm quyền, mật khẩu IT cấp và che năm sinh.',
  },
  roles: {
    title: 'Phân Quyền Sử Dụng Theo Nhóm Quyền',
    module: 'Module 7.7: Hệ thống Phân quyền',
    assignedTeam: 'Nhóm 7 (Tô Thanh Tân, Lê Duy Khánh, Đỗ Mạnh Quang, Nguyễn Phan Minh Hiếu, Trần Đình Tình)',
    codeRef: 'Mục 7.7 · Độ khó: 0.80',
    isGroup1: false,
    desc: 'Quản lý ma trận phân quyền, nhóm vai trò Admin/CBNV/Văn thư.',
  },
  ai_assistant: {
    title: 'Trợ Lý AI Chatbot Tra Cứu Quy Trình & Văn Bản',
    module: 'Module 8: Chatbox AI',
    assignedTeam: 'Nhóm 8 (Trần Vũ Giang Anh, Huỳnh Vương Thanh Nhã)',
    codeRef: 'Mục 8.1 · Độ khó: 1.00',
    isGroup1: false,
    desc: 'Hỏi đáp tài liệu quy trình, văn bản đến/đi và liên kết tra cứu thông minh.',
  },
};

export default function AppRouter({ activePage, onNavigate }: RouterProps) {
  if (activePage === 'dashboard') {
    return <DashboardPage onNavigate={onNavigate} />;
  }

  const meta = PAGE_META[activePage] || {
    title: activePage,
    module: 'Chức năng hệ thống',
    assignedTeam: 'Nhóm 1 (Trưởng nhóm: Châu Tuấn Kiệt)',
    codeRef: 'ITC Django MĐ501911',
    isGroup1: true,
    desc: 'Phân hệ quản lý văn bản & tài liệu mật TLBM.',
  };

  return (
    <div style={{ maxWidth: '820px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Banner Thông Báo Chính Thức Của Nhóm 1 */}
      <div
        style={{
          background: meta.isGroup1
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(234, 88, 12, 0.08))'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.08))',
          border: meta.isGroup1
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'var(--backdrop-blur)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Nhãn trạng thái Nhóm 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: meta.isGroup1 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.2)',
                color: meta.isGroup1 ? '#d97706' : '#2563eb',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className={meta.isGroup1 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'} />
              {meta.isGroup1 ? 'Nhóm 1 đang trong quá trình phát triển' : 'Nhóm 1 phụ trách khung giao diện'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {meta.codeRef}
            </span>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Đề cương: <strong>{meta.module}</strong>
          </span>
        </div>

        {/* Tiêu đề chức năng */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
          {meta.title}
        </h1>

        {/* Mô tả nghiệp vụ */}
        <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {meta.desc}
        </p>

        {/* Thông báo chi tiết phụ trách */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--text-main)' }}>📌 Đơn vị phụ trách:</strong>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meta.assignedTeam}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--text-main)' }}>⚠️ Trạng thái hiện tại:</strong>
            <span style={{ color: '#d97706', fontWeight: 700 }}>
              {meta.isGroup1
                ? 'Nhóm 1 đang trong quá trình phát triển hoàn thiện giao diện và kết nối Backend Django.'
                : 'Nhóm 1 (PM: Châu Tuấn Kiệt) đang trong quá trình phát triển bộ khung Layout & chuẩn bị cổng API tích hợp với ' + meta.assignedTeam + '.'}
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={() => onNavigate('dashboard')}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>Quay lại Bàn Làm Việc (Trang chủ)</span>
          </button>
        </div>
      </div>

      {/* 2. Khung Tương Tác Cụ Thể Cho Từng Phân Hệ Của Nhóm 1 */}
      {activePage === 'login' && (
        <LoginPage
          onNavigate={onNavigate}
          onLoginSuccess={() => onNavigate('dashboard')}
        />
      )}


      {activePage === 'profile' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              👤 Hồ Sơ Cán Bộ Nhân Viên (Thuộc Module 1.1 của Nhóm 1)
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Nhóm 1 đang trong quá trình phát triển
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Họ và tên:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Châu Tuấn Kiệt</div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Vai trò trong dự án:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>Project Manager (PM) · Trưởng Nhóm 1</div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Đơn vị công tác:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Ban Công Nghệ Thông Tin (ITC)</div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email liên hệ:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>kiet.ct@itc.edu.vn</div>
            </div>
          </div>
        </div>
      )}

      {activePage === 'password_change' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              🔑 Thiết Lập Mật Khẩu Mới (Thuộc Module 1.1 của Nhóm 1)
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Nhóm 1 đang trong quá trình phát triển
            </span>
          </div>

          <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mật khẩu hiện tại:</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu cũ..."
                disabled
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mật khẩu mới:</label>
              <input
                type="password"
                placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, số..."
                disabled
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
                disabled
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                }}
              />
            </div>
            <button
              type="button"
              disabled
              style={{
                marginTop: '10px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                opacity: 0.7,
              }}
            >
              Cập Nhật Mật Khẩu (Nhóm 1 đang phát triển)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
