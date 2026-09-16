import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';

interface DashboardStatsProps {
  incomingCount?: number;
  outgoingCount?: number;
  confidentialCount?: number;
  tasksCount?: number;
}

export default function DashboardStats({
  incomingCount = 1248,
  outgoingCount = 856,
  confidentialCount = 24,
  tasksCount = 18,
}: DashboardStatsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Văn bản đến (2026)',
      count: incomingCount,
      subtext: '+12 văn bản mới trong ngày',
      icon: 'fa-solid fa-inbox',
      path: '/documents/incoming',
      bgClass: 'bg-[#003865] hover:bg-[#002f55] border-[#002a4d]',
    },
    {
      title: 'Văn bản đi (2026)',
      count: outgoingCount,
      subtext: '+5 văn bản phát hành hôm nay',
      icon: 'fa-solid fa-paper-plane',
      path: '/documents/outgoing',
      bgClass: 'bg-[#003865] hover:bg-[#002f55] border-[#002a4d]',
    },
    {
      title: 'Văn bản mật (2026)',
      count: confidentialCount,
      subtext: 'Bảo mật cao & trình duyệt riêng',
      icon: 'fa-solid fa-shield-halved',
      path: '/documents/incoming',
      bgClass: 'bg-[#003865] hover:bg-[#002f55] border-[#002a4d]',
    },
    {
      title: 'Nhiệm vụ - Thông báo',
      count: tasksCount,
      subtext: '4 nhiệm vụ sắp đến hạn xử lý',
      icon: 'fa-solid fa-list-check',
      path: '/tasks',
      bgClass: 'bg-[#003865] hover:bg-[#002f55] border-[#002a4d]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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

