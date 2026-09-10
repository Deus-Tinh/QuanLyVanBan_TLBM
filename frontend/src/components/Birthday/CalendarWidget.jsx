import React from 'react';
import { DEPARTMENTS } from '../../utils/constants';

const DAY_NAMES = ['Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'CN'];

export default function CalendarWidget({
  currentYear,
  currentMonth,
  selectedDay,
  calendarCells,
  onPrevMonth,
  onNextMonth,
  onGoToday,
  onSelectDay,
  deptFilter,
  onChangeDeptFilter,
  searchKey,
  onChangeSearchKey,
  onOpenConfigModal,
  staffList,
}) {
  return (
    <div className="calendar-deck-card">
      {/* Calendar Header Tools */}
      <div className="calendar-top-bar">
        <div className="cal-title-controls">
          <button
            type="button"
            className="cal-nav-btn"
            onClick={onPrevMonth}
            title="Tháng trước"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <span className="cal-current-label">
            Tháng {String(currentMonth).padStart(2, '0')} - {currentYear}
          </span>
          <button
            type="button"
            className="cal-nav-btn"
            onClick={onNextMonth}
            title="Tháng sau"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
          <button
            type="button"
            className="cal-today-btn"
            onClick={onGoToday}
          >
            Hôm nay (10/09)
          </button>
        </div>

        {/* Filters & Action */}
        <div className="cal-filter-controls">
          {/* Department Filter */}
          <select
            className="cal-select-input"
            value={deptFilter}
            onChange={(e) => onChangeDeptFilter(e.target.value)}
            title="Lọc theo Đơn vị / Phòng ban"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="cal-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Tìm kiếm CBNV..."
              value={searchKey}
              onChange={(e) => onChangeSearchKey(e.target.value)}
            />
          </div>

          {/* Auto Send Schedule Button */}
          <button
            type="button"
            className="cal-config-btn"
            onClick={onOpenConfigModal}
            title="Cài đặt lịch phát tự động hằng ngày"
          >
            <i className="fa-solid fa-clock-rotate-left" />
            <span>Lịch phát tự động (08:00)</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="calendar-grid-table">
        {/* Day Header */}
        <div className="cal-weekdays-row">
          {DAY_NAMES.map((name, i) => (
            <div key={i} className={`cal-weekday-cell ${i >= 5 ? 'weekend' : ''}`}>
              {name}
            </div>
          ))}
        </div>

        {/* Days Grid Cells */}
        <div className="cal-days-grid">
          {calendarCells.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div key={idx} className="cal-cell other-month">
                  <div className="cal-date-number">{cell.day}</div>
                </div>
              );
            }

            // Find matching staff for this day
            const bdays = staffList.filter((c) => {
              const matchDate = c.bdayMonth === currentMonth && c.bdayDay === cell.day;
              const matchDept = deptFilter === 'ALL' || c.dept === deptFilter;
              const matchSearch =
                !searchKey || c.name.toLowerCase().includes(searchKey.toLowerCase().trim());
              return matchDate && matchDept && matchSearch;
            });

            return (
              <div
                key={idx}
                className={`cal-cell ${cell.isToday ? 'today' : ''} ${
                  cell.isSelected ? 'selected' : ''
                }`}
                onClick={() => onSelectDay(cell.day)}
              >
                <div className="cal-date-number">{cell.day}</div>

                {bdays.length > 0 && (
                  <div className="cal-bday-dots">
                    {bdays.slice(0, 2).map((b) => {
                      const shortName = b.name.split(' ').slice(-1)[0];
                      const pillClass = b.dept === 'NV' ? 'coral' : '';
                      return (
                        <div key={b.id} className={`bday-pill ${pillClass}`}>
                          <i className="fa-solid fa-cake-candles" /> {shortName}
                        </div>
                      );
                    })}
                    {bdays.length > 2 && (
                      <div className="bday-more-count">+{bdays.length - 2} nữa</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
