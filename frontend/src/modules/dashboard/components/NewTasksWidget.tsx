import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewTasksWidget() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border-subtle rounded-sm overflow-hidden shadow-xs flex flex-col">
      {/* Yellow/Amber Header */}
      <div className="bg-[#df9b2d] text-white px-3 py-1.5 flex justify-between items-center select-none text-xs font-bold">
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-briefcase text-[11px]" />
          <span>Nhiệm vụ mới (công việc)</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="text-xs text-yellow-100 hover:text-white font-normal cursor-pointer"
        >
          Xem thêm »
        </button>
      </div>

      {/* Content */}
      <div className="p-3 text-xs text-muted italic text-left">
        Chưa có nhiệm vụ mới được giao
      </div>
    </div>
  );
}
