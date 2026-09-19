import React, { useState, useEffect } from 'react';
import QuickSearchWidget from '@components/dashboard/QuickSearchWidget';
import DashboardStats from '@components/dashboard/DashboardStats';
import IncomingDocumentsWidget from '@components/dashboard/IncomingDocumentsWidget';
import RecentOutgoingWidget from '@components/dashboard/RecentOutgoingWidget';
import RecentTasksWidget from '@components/dashboard/RecentTasksWidget';
import BirthdaysWidget from '@components/dashboard/BirthdaysWidget';
import ModernDashboardView from '@components/dashboard/ModernDashboardView';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [interfaceStyle, setInterfaceStyle] = useState<'classic' | 'modern'>(() => {
    return (localStorage.getItem('tlbm_interface_style') as 'classic' | 'modern') || 'modern';
  });

  useEffect(() => {
    const handleUpdate = () => {
      const savedStyle = (localStorage.getItem('tlbm_interface_style') as 'classic' | 'modern') || 'modern';
      setInterfaceStyle(savedStyle);
    };

    window.addEventListener('tlbm_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tlbm_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // 1. Giao diện Hiện đại (Modern UI): bo góc mềm mại, icon đa sắc, bảng và thẻ hiện đại theo ảnh mẫu
  if (interfaceStyle === 'modern') {
    return <ModernDashboardView onNavigate={onNavigate} />;
  }

  // 2. Giao diện Cổ điển (Classic UI): phong cách GovTech đặc trưng, 3 khối navy, bảng phẳng gọn
  return (
    <div className="flex flex-col gap-3">
      {/* 1. THANH TÌM KIẾM VĂN BẢN ĐẾN / ĐI (CHUYỂN TỪ HEADER XUỐNG DƯỚI) */}
      <QuickSearchWidget />

      {/* 2. 3 KHỐI THỐNG KÊ XANH NAVY ĐẬM */}
      <DashboardStats />

      {/* 3. THANH MARQUEE CHẠY CHỮ SINH NHẬT CBNV (ĐẶT NGAY DƯỚI THỐNG KÊ) */}
      <BirthdaysWidget />

      {/* 4. SONG SONG 2 BẢNG: VĂN BẢN ĐẾN & VĂN BẢN ĐI (TOÀN CHIỀU RỘNG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <IncomingDocumentsWidget />
        <RecentOutgoingWidget />
      </div>

      {/* 5. DANH SÁCH NHIỆM VỤ ĐẦY ĐỦ 4 BỘ LỌC */}
      <RecentTasksWidget />
    </div>
  );
}



