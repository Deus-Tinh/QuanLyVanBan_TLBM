import React from 'react';

const EMPLOYEES = [
  {
    name: 'Nguyễn Thị Hiền',
    position: 'Tổ trưởng Kiểm toán nội bộ',
    department: 'Ban Kiểm toán nội bộ',
  },
  {
    name: 'Đinh Thị Kiều Hạnh',
    position: 'Phó phụ trách Phòng',
    department: 'Bảo Long Nam Sài Gòn',
  },
  {
    name: 'Trịnh Thị Giang',
    position: 'Nhân viên',
    department: 'Bảo Long Trung Bộ',
  },
];

export default function BirthdaysWidget() {
  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col">
      {/* Forest Green Header */}
      <div className="bg-[#168b3e] text-white px-3 py-1.5 flex justify-between items-center select-none text-xs font-bold">
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-cake-candles text-[11px]" />
          <span>Thông báo sinh nhật - ngày 16-09 (3 cán bộ)</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 text-xs flex flex-col gap-1.5">
        <div className="text-red-600 dark:text-red-400 font-bold text-xs mb-1 select-none">
          Chúc mừng sinh nhật:
        </div>
        {EMPLOYEES.map((emp, idx) => (
          <div key={idx} className="flex items-start gap-1.5 text-secondary leading-relaxed">
            <span className="text-red-500 select-none">•</span>
            <span className="text-main">
              <span className="font-semibold">{emp.name}</span> ({emp.position}) - {emp.department}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


