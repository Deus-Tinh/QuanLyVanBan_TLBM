import React from 'react';

export default function SelectedDayStaff({
  selectedDay,
  selectedMonth,
  selectedYear,
  staffList = [],
  onOpenWishModal,
  onPreviewCard,
}) {
  const matchingStaff = staffList.filter(
    (s) => s.bdayDay === selectedDay && s.bdayMonth === selectedMonth
  );

  return (
    <div className="selected-day-deck">
      <div className="selected-day-header">
        <div className="title-with-badge">
          <h3 className="section-title">
            <i className="fa-solid fa-users" style={{ color: 'var(--blue-pill-bg, #2563eb)' }} />
            <span>Danh sách CBNV sinh nhật ngày {String(selectedDay).padStart(2, '0')}/{String(selectedMonth).padStart(2, '0')}/{selectedYear}</span>
          </h3>
          <span className="count-pill">{matchingStaff.length} nhân sự</span>
        </div>
      </div>

      {matchingStaff.length === 0 ? (
        <div className="empty-day-state">
          <div className="empty-icon">
            <i className="fa-regular fa-calendar-xmark" />
          </div>
          <div className="empty-title">Không có sinh nhật CBNV trong ngày này</div>
          <div className="empty-desc">
            Hãy chọn các ngày có biểu tượng bánh kem trên lịch để xem danh sách CBNV.
          </div>
        </div>
      ) : (
        <div className="staff-table-wrapper">
          <table className="staff-data-table">
            <thead>
              <tr>
                <th>Họ và tên &amp; Chức vụ</th>
                <th>Đơn vị / Khối phòng ban</th>
                <th>Hộp thư (Email)</th>
                <th>Trạng thái gửi thiệp</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {matchingStaff.map((staff) => (
                <tr key={staff.id}>
                  <td>
                    <div className="staff-user-cell">
                      <div className="staff-avatar-circle">{staff.avatar || '👤'}</div>
                      <div>
                        <div className="staff-name-text">{staff.name}</div>
                        <div className="staff-role-subtext">{staff.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dept-tag-pill">{staff.deptName}</span>
                  </td>
                  <td className="staff-email-text">{staff.email}</td>
                  <td>
                    {staff.sent ? (
                      <span className="status-badge sent-badge">
                        <i className="fa-solid fa-circle-check" /> Đã gửi ({staff.sentTime || '08:00:00 10/09/2026'})
                      </span>
                    ) : (
                      <span className="status-badge pending-badge">
                        <i className="fa-solid fa-clock" /> Chờ gửi (Lịch 08:00)
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="btn-action-view"
                        onClick={() => onPreviewCard(staff)}
                        title="Xem thiệp chúc mừng"
                      >
                        <i className="fa-solid fa-eye" />
                        <span>Xem thiệp</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-send"
                        onClick={() => onOpenWishModal(staff)}
                        title="Gửi thiệp riêng"
                      >
                        <i className="fa-solid fa-paper-plane" />
                        <span>{staff.sent ? 'Gửi lại' : 'Soạn & Gửi'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
