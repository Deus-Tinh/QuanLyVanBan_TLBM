import React from 'react';
import { useNavigate } from 'react-router-dom';

const MEETINGS = [
  { id: '1', title: 'Lịch họp 26/05 - 30/05', ext: 'PDF' },
  { id: '2', title: 'Lịch họp 19/05 - 23/05', ext: 'DOCX' },
  { id: '3', title: 'Lịch họp giao ban công tác điều hành tuần 38', ext: 'PDF' },
];

export default function MeetingsWidget() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col">
      {/* Amber Header */}
      <div className="bg-[#d9822b] text-white px-3 py-1.5 flex justify-between items-center select-none text-xs font-bold">
        <div className="flex items-center gap-1.5">
          <i className="fa-regular fa-calendar-days text-[11px]" />
          <span>Lịch họp mới nhất</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="text-xs text-amber-100 hover:text-white font-normal cursor-pointer"
        >
          Xem thêm »
        </button>
      </div>

      {/* Bullet List */}
      <div className="p-3 text-xs flex flex-col gap-2">
        {MEETINGS.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate('/calendar')}
            className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group"
          >
            <span className="text-secondary select-none">•</span>
            <span className="text-main group-hover:underline flex-1 truncate">
              {m.title}
            </span>
            <span className="text-[10px] font-bold px-1 py-0.2 bg-amber-500/10 text-amber-600 rounded-xs">
              {m.ext}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

