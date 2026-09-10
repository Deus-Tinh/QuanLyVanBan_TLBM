import React from 'react';

export default function TodayBirthdayCards({
  todayStaff = [],
  tomorrowStaff = [],
  onOpenWishModal,
  onPreviewCard,
}) {
  return (
    <div className="today-tomorrow-container">
      {/* Cột 1: Hôm nay (T) */}
      <div className="event-column">
        <div className="column-header">
          <div className="header-badge coral-badge">Hôm nay · 10/09/2026</div>
          <span className="count-sub">{todayStaff.length} sinh nhật</span>
        </div>

        <div className="cards-vertical-list">
          {todayStaff.map((staff) => (
            <div key={staff.id} className="birthday-person-card highlight-card">
              <div className="card-ribbon">Hôm nay</div>
              <div className="person-avatar-box">{staff.avatar || '🎂'}</div>
              <div className="person-info-content">
                <h4 className="person-name">{staff.name}</h4>
                <div className="person-role">{staff.role}</div>
                <div className="person-dept">{staff.deptName}</div>

                <div className="person-actions">
                  <button
                    type="button"
                    className="card-btn secondary-btn"
                    onClick={() => onPreviewCard(staff)}
                  >
                    <i className="fa-solid fa-gift" /> Xem thiệp
                  </button>
                  <button
                    type="button"
                    className="card-btn primary-btn"
                    onClick={() => onOpenWishModal(staff)}
                  >
                    <i className="fa-solid fa-paper-plane" /> Chúc mừng
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cột 2: Ngày mai (T+1) */}
      <div className="event-column">
        <div className="column-header">
          <div className="header-badge amber-badge">Ngày mai · 11/09/2026</div>
          <span className="count-sub">{tomorrowStaff.length} sinh nhật</span>
        </div>

        <div className="cards-vertical-list">
          {tomorrowStaff.map((staff) => (
            <div key={staff.id} className="birthday-person-card">
              <div className="person-avatar-box">{staff.avatar || '🎉'}</div>
              <div className="person-info-content">
                <h4 className="person-name">{staff.name}</h4>
                <div className="person-role">{staff.role}</div>
                <div className="person-dept">{staff.deptName}</div>

                <div className="person-actions">
                  <button
                    type="button"
                    className="card-btn secondary-btn"
                    onClick={() => onPreviewCard(staff)}
                  >
                    <i className="fa-solid fa-gift" /> Xem thiệp
                  </button>
                  <button
                    type="button"
                    className="card-btn primary-btn"
                    onClick={() => onOpenWishModal(staff)}
                  >
                    <i className="fa-solid fa-clock" /> Đặt lịch gửi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
