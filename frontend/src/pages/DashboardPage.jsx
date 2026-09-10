import React from 'react';

export default function DashboardPage({ onNavigate }) {
  return (
    <div className="dashboard-page-wrapper">
      {/* Banner chào mừng */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text">
          <h2>Xin chào, Châu Tuấn Kiệt 👋</h2>
          <p>
            Chào mừng bạn đến với <strong>Bàn làm việc tổng quan</strong> · Hệ thống Quản lý Văn bản &amp; Điều hành TLBM.
          </p>
        </div>
        <button
          type="button"
          className="welcome-action-btn"
          onClick={() => onNavigate('birthday')}
        >
          <i className="fa-solid fa-cake-candles" />
          <span>Xem Sinh nhật CBNV hôm nay</span>
        </button>
      </div>

      {/* KPI Overview Deck */}
      <div className="dashboard-kpi-grid">
        <div className="kpi-box">
          <div className="kpi-icon-cell blue-icon">
            <i className="fa-solid fa-inbox" />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Văn bản Đến chờ xử lý</span>
            <span className="kpi-number">12</span>
            <span className="kpi-trend positive">+3 văn bản mới hôm nay</span>
          </div>
        </div>

        <div className="kpi-box">
          <div className="kpi-icon-cell teal-icon">
            <i className="fa-solid fa-paper-plane" />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Văn bản Đi đã ban hành</span>
            <span className="kpi-number">48</span>
            <span className="kpi-trend">Tuần này: 5 văn bản</span>
          </div>
        </div>

        <div className="kpi-box">
          <div className="kpi-icon-cell red-icon">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Văn bản Mật &amp; Khẩn</span>
            <span className="kpi-number">02</span>
            <span className="kpi-trend urgent">Yêu cầu xử lý trong ngày</span>
          </div>
        </div>

        <div className="kpi-box">
          <div className="kpi-icon-cell purple-icon">
            <i className="fa-solid fa-folder-tree" />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Hồ sơ công việc số</span>
            <span className="kpi-number">156</span>
            <span className="kpi-trend">Tỷ lệ số hóa 98.5%</span>
          </div>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="dashboard-shortcuts-deck">
        <h3 className="section-title">Lối tắt thao tác nhanh</h3>
        <div className="shortcuts-grid">
          <button
            type="button"
            className="shortcut-card"
            onClick={() => onNavigate('birthday')}
          >
            <i className="fa-solid fa-cake-candles" style={{ color: '#f59e0b' }} />
            <span className="title">Sinh nhật CBNV (Mục 7.2)</span>
            <span className="desc">Lịch tháng, tự động phát thiệp 08:00</span>
          </button>
          <div className="shortcut-card">
            <i className="fa-solid fa-file-circle-plus" style={{ color: '#2563eb' }} />
            <span className="title">Tiếp nhận Văn bản mới</span>
            <span className="desc">Đăng ký vào sổ và phân luồng xử lý</span>
          </div>
          <div className="shortcut-card">
            <i className="fa-solid fa-signature" style={{ color: '#0d9488' }} />
            <span className="title">Trình ký &amp; Ban hành</span>
            <span className="desc">Ký số token PKI / SmartCA</span>
          </div>
          <div className="shortcut-card">
            <i className="fa-solid fa-magnifying-glass-chart" style={{ color: '#7c3aed' }} />
            <span className="title">Báo cáo &amp; Thống kê</span>
            <span className="desc">Xuất dữ liệu Excel, PDF định kỳ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
