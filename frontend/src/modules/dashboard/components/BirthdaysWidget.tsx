import React from 'react';

const EMPLOYEES: Array<{ name: string; position: string; department: string }> = [];

export default function BirthdaysWidget() {
  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col">
      {/* Forest Green Header */}
      <div className="bg-success text-white px-3 py-1.5 flex justify-between items-center select-none text-xs font-bold">
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-cake-candles text-[11px]" />
          <span>Thông báo sinh nhật {EMPLOYEES.length > 0 ? `(${EMPLOYEES.length} cán bộ)` : ''}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 text-xs flex flex-col gap-1.5 min-h-[60px] justify-center">
        {EMPLOYEES.length === 0 ? (
          <div className="p-3 text-xs text-muted text-center flex flex-col items-center justify-center gap-1">
            <i className="fa-solid fa-cake-candles text-lg opacity-40 text-emerald-600" />
            <span>Hôm nay không có sinh nhật cán bộ nhân viên</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}


