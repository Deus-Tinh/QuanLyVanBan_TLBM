import React from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardStatsProps {
  incomingCount?: number;
  outgoingCount?: number;
  tasksCount?: number;
}

export default function DashboardStats({
  incomingCount = 0,
  outgoingCount = 0,
  tasksCount = 0,
}: DashboardStatsProps) {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Văn bản đến (2026)',
      count: incomingCount,
      subtext: incomingCount > 0 ? `+${incomingCount} văn bản mới trong ngày` : 'Chưa có phát sinh trong ngày',
      icon: 'fa-solid fa-inbox',
      path: '/documents/incoming',
      bgClass: 'bg-primary hover:bg-primary-hover border-primary-border',
    },
    {
      title: 'Văn bản đi (2026)',
      count: outgoingCount,
      subtext: outgoingCount > 0 ? `+${outgoingCount} văn bản phát hành hôm nay` : 'Chưa có phát hành hôm nay',
      icon: 'fa-solid fa-paper-plane',
      path: '/documents/outgoing',
      bgClass: 'bg-primary hover:bg-primary-hover border-primary-border',
    },
    {
      title: 'Nhiệm vụ - Thông báo',
      count: tasksCount,
      subtext: tasksCount > 0 ? `${tasksCount} nhiệm vụ cần xử lý` : 'Không có nhiệm vụ cần xử lý',
      icon: 'fa-solid fa-list-check',
      path: '/tasks',
      bgClass: 'bg-primary hover:bg-primary-hover border-primary-border',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          onClick={() => navigate(card.path)}
          className={`${card.bgClass} text-white p-4 px-5 rounded-sm border shadow-xs transition-all duration-fast flex justify-between items-center cursor-pointer select-none`}
        >
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-blue-100/90 mb-1">
              {card.title}
            </div>
            <div className="text-2xl lg:text-3xl font-bold tracking-tight">
              {card.count.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-200/80 mt-1 flex items-center gap-1.5">
              <span>{card.subtext}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-sm bg-white/10 border border-white/10 flex items-center justify-center text-white text-xl shrink-0">
            <i className={card.icon} />
          </div>
        </div>
      ))}
    </div>
  );
}

