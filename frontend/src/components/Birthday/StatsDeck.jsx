import React from 'react';

export default function StatsDeck({ staffList = [] }) {
  const monthCount = staffList.filter((s) => s.bdayMonth === 9).length;
  const todayList = staffList.filter((s) => s.bdayDay === 10 && s.bdayMonth === 9);
  const tomorrowList = staffList.filter((s) => s.bdayDay === 11 && s.bdayMonth === 9);
  const sentTodayCount = todayList.filter((s) => s.sent).length;

  return (
    <div className="stats-deck-container">
      {/* Thẻ 1: Sinh nhật trong tháng */}
      <div className="stat-card">
        <div className="stat-icon-wrapper blue-icon">
          <i className="fa-solid fa-calendar-days" />
        </div>
        <div className="stat-info">
          <span className="stat-label">Sinh nhật tháng 09</span>
          <span className="stat-value">{monthCount} <small>CBNV</small></span>
          <span className="stat-note">Toàn hệ thống 7 đơn vị</span>
        </div>
      </div>

      {/* Thẻ 2: Sinh nhật hôm nay (T) */}
      <div className="stat-card highlight-today">
        <div className="stat-icon-wrapper coral-icon">
          <i className="fa-solid fa-cake-candles" />
        </div>
        <div className="stat-info">
          <span className="stat-label">Hôm nay (10/09)</span>
          <span className="stat-value">{todayList.length} <small>CBNV</small></span>
          <span className="stat-note success-note">
            <i className="fa-solid fa-check" /> Đã gửi {sentTodayCount}/{todayList.length} thiệp
          </span>
        </div>
      </div>

      {/* Thẻ 3: Sinh nhật ngày mai (T+1) */}
      <div className="stat-card">
        <div className="stat-icon-wrapper amber-icon">
          <i className="fa-solid fa-bell" />
        </div>
        <div className="stat-info">
          <span className="stat-label">Ngày mai (11/09)</span>
          <span className="stat-value">{tomorrowList.length} <small>CBNV</small></span>
          <span className="stat-note">Lịch gửi tự động 08:00</span>
        </div>
      </div>

      {/* Thẻ 4: Tiến độ tự động gửi */}
      <div className="stat-card">
        <div className="stat-icon-wrapper emerald-icon">
          <i className="fa-solid fa-envelope-circle-check" />
        </div>
        <div className="stat-info">
          <span className="stat-label">Tỷ lệ hoàn thành</span>
          <span className="stat-value">100%</span>
          <span className="stat-note success-note">Hệ thống gửi tự động chuẩn</span>
        </div>
      </div>
    </div>
  );
}
