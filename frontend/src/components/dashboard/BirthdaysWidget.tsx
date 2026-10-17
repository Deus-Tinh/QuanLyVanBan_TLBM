import React from 'react';
import { useTranslation } from '@i18n/translate';

export interface BirthdayEmployee {
  id: string | number;
  name: string; // Ưu tiên 1: Họ tên
  birthdate: string; // Ưu tiên 2: Ngày tháng sinh nhật
  position: string; // Ưu tiên 3: Chức vụ
  department?: string; // Đơn vị công tác
  isToday?: boolean;
}

interface BirthdaysWidgetProps {
  birthdays?: BirthdayEmployee[];
}

export default function BirthdaysWidget({
  birthdays = [],
}: BirthdaysWidgetProps) {
  const { t } = useTranslation();

  const formatBirthdate = (dateStr: string) => {
    return dateStr
      .replace('(Hôm nay)', `(${t('dashboardDetails.today') || 'Hôm nay'})`)
      .replace('(Ngày mai)', `(${t('dashboardDetails.tomorrow') || 'Ngày mai'})`);
  };

  // Nhân đôi danh sách để tạo luồng chạy vô tận mượt mà (-50% translateX)
  const marqueeItems = [...birthdays, ...birthdays];

  if (birthdays.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-xl shadow-sm px-4 py-3 flex items-center gap-3.5 overflow-hidden relative select-none">
      {/* Label / Badge cố định bên trái */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-white text-sm font-bold shrink-0 shadow-xs">
        <i className="fa-solid fa-cake-candles text-xs" />
        <span className="whitespace-nowrap">{t('dashboardDetails.happyBirthday') || 'Chúc mừng sinh nhật:'}</span>
      </div>

      {/* Marquee Viewport with Optical Edge Alpha Masking */}
      <div
        className="relative w-full overflow-hidden flex-1 py-0.5"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 12px, black calc(100% - 24px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12px, black calc(100% - 24px), transparent 100%)',
        }}
      >
        {/* Dải Marquee chạy liên tục */}
        <div className="animate-marquee gap-6 pl-2 items-center">
          {marqueeItems.map((emp, idx) => (
            <div
              key={`${emp.id}-${idx}`}
              className="inline-flex items-center gap-2 text-sm shrink-0 cursor-default"
              title={`${emp.name} - ${emp.birthdate} - ${emp.position} (${emp.department || ''})`}
            >
              {/* 1. ƯU TIÊN: TÊN */}
              <span className="font-bold text-main flex items-center gap-1.5">
                <i className="fa-solid fa-cake-candles text-pink shrink-0 text-xs" />
                <span className="text-primary font-bold">{emp.name}</span>
              </span>

              {/* 2. ƯU TIÊN: NGÀY THÁNG SINH NHẬT */}
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                  emp.isToday
                    ? 'bg-danger-subtle text-danger border border-danger-border'
                    : 'bg-success-subtle text-success border border-success-border'
                }`}
              >
                {formatBirthdate(emp.birthdate)}
              </span>

              {/* 3. ƯU TIÊN: CHỨC VỤ */}
              <span className="text-secondary text-xs whitespace-nowrap">
                {emp.position}
                {emp.department && (
                  <span className="text-muted"> · {emp.department}</span>
                )}
              </span>

              <span className="text-border-subtle ml-2">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





