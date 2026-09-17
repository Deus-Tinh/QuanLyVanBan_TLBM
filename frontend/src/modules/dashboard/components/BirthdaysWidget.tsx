import React from 'react';

export interface BirthdayEmployee {
  id: string | number;
  name: string; // Ưu tiên 1: Họ tên
  birthdate: string; // Ưu tiên 2: Ngày tháng sinh nhật
  position: string; // Ưu tiên 3: Chức vụ
  department?: string; // Đơn vị công tác
  isToday?: boolean;
}

const DEFAULT_BIRTHDAYS: BirthdayEmployee[] = [
  {
    id: 1,
    name: 'Nguyễn Văn An',
    birthdate: '17/09 (Hôm nay)',
    position: 'Trưởng phòng Nghiệp vụ',
    department: 'Ban Quản lý Văn bản',
    isToday: true,
  },
  {
    id: 2,
    name: 'Trần Thị Mai',
    birthdate: '17/09 (Hôm nay)',
    position: 'Chuyên viên chính',
    department: 'Văn phòng Hành chính',
    isToday: true,
  },
  {
    id: 3,
    name: 'Lê Hoàng Long',
    birthdate: '18/09 (Ngày mai)',
    position: 'Phó Trưởng ban',
    department: 'Ban CNTT & CĐS',
    isToday: false,
  },
  {
    id: 4,
    name: 'Phạm Minh Tuấn',
    birthdate: '18/09 (Ngày mai)',
    position: 'Cán bộ Lưu trữ',
    department: 'Trung tâm Lưu trữ',
    isToday: false,
  },
];

interface BirthdaysWidgetProps {
  birthdays?: BirthdayEmployee[];
}

export default function BirthdaysWidget({
  birthdays = DEFAULT_BIRTHDAYS,
}: BirthdaysWidgetProps) {
  // Nhân đôi danh sách để tạo luồng chạy vô tận mượt mà (-50% translateX)
  const marqueeItems = [...birthdays, ...birthdays];

  if (birthdays.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-sm shadow-xs px-3 py-2 flex items-center gap-3 overflow-hidden relative select-none">
      {/* Label / Badge cố định bên trái */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-success text-white text-xs font-bold shrink-0 shadow-2xs">
        <i className="fa-solid fa-cake-candles text-[11px]" />
        <span className="whitespace-nowrap">Chúc mừng sinh nhật:</span>
      </div>

      {/* Marquee Viewport with Soft Gradient Edge Masks */}
      <div className="relative w-full overflow-hidden flex-1 py-0.5">
        {/* Fade mask trái */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-surface to-transparent z-10" />

        {/* Dải Marquee chạy liên tục */}
        <div className="animate-marquee gap-5 pl-2 items-center">
          {marqueeItems.map((emp, idx) => (
            <div
              key={`${emp.id}-${idx}`}
              className="inline-flex items-center gap-2 text-xs shrink-0 cursor-default"
              title={`${emp.name} - ${emp.birthdate} - ${emp.position} (${emp.department || ''})`}
            >
              {/* 1. ƯU TIÊN: TÊN */}
              <span className="font-bold text-main flex items-center gap-1">
                <span>🎂</span>
                <span className="text-primary font-bold">{emp.name}</span>
              </span>

              {/* 2. ƯU TIÊN: NGÀY THÁNG SINH NHẬT */}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                  emp.isToday
                    ? 'bg-danger/15 text-danger border border-danger/30'
                    : 'bg-success/15 text-success border border-success/30'
                }`}
              >
                {emp.birthdate}
              </span>

              {/* 3. ƯU TIÊN: CHỨC VỤ */}
              <span className="text-secondary text-[11px] whitespace-nowrap">
                {emp.position}
                {emp.department && (
                  <span className="text-muted"> · {emp.department}</span>
                )}
              </span>

              <span className="text-border-subtle ml-2">•</span>
            </div>
          ))}
        </div>

        {/* Fade mask phải */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10" />
      </div>
    </div>
  );
}



