import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';
import DashboardStats from '../components/DashboardStats';
import QuickSearchWidget from '../components/QuickSearchWidget';
import IncomingDocumentsWidget from '../components/IncomingDocumentsWidget';
import RecentOutgoingWidget from '../components/RecentOutgoingWidget';
import RecentTasksWidget from '../components/RecentTasksWidget';
import BirthdaysWidget from '../components/BirthdaysWidget';
import RecentResourcesWidget from '../components/RecentResourcesWidget';

const ALL_INCOMING = [
  { code: '128/QĐ-BGDĐT', title: 'Hướng dẫn công tác năm học mới 2026', date: '11/09/2026' },
  { code: '45/CV-UBND', title: 'Tăng cường an toàn thông tin CSDL nhà nước', date: '10/09/2026' },
  { code: '09/TB-ITC', title: 'Thông báo lịch bảo vệ đồ án chuyên ngành', date: '09/09/2026' },
  { code: '77/HD-TCHQ', title: 'Quy trình kiểm tra hồ sơ điện tử liên ngành', date: '08/09/2026' },
  { code: '14/KH-ITC', title: 'Kế hoạch triển khai hệ thống quản lý văn bản', date: '07/09/2026' },
];

const ALL_OUTGOING = [
  { code: '210/TB-BL', title: 'Thông báo kết luận cuộc họp giao ban quý 3', date: '11/09/2026' },
  { code: '89/QĐ-BL', title: 'Quyết định ban hành khung an ninh thông tin', date: '10/09/2026' },
  { code: '62/TTr-ITC', title: 'Tờ trình phê duyệt kinh phí trang bị máy chủ', date: '09/09/2026' },
  { code: '55/CV-BL', title: 'Công văn gửi các đơn vị phòng ban cấp 2', date: '08/09/2026' },
  { code: '31/QĐ-BL', title: 'Quyết định phân công nhiệm vụ đồ án Django', date: '06/09/2026' },
];

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

  const handleNavigate = (pathOrPageId: string) => {
    if (pathOrPageId.startsWith('/')) {
      navigate(pathOrPageId);
    } else if (onNavigate) {
      onNavigate(pathOrPageId);
    } else {
      navigate(`/${pathOrPageId.replace('_', '/')}`);
    }
  };

  // Lọc dữ liệu tìm kiếm tương tác (Interactive filter thay vì alert)
  const filteredIncoming = useMemo(() => {
    if (searchFilter === 'outgoing') return [];
    if (!searchTerm.trim()) return ALL_INCOMING;
    const term = searchTerm.toLowerCase();
    return ALL_INCOMING.filter(
      (d) => d.code.toLowerCase().includes(term) || d.title.toLowerCase().includes(term)
    );
  }, [searchTerm, searchFilter]);

  const filteredOutgoing = useMemo(() => {
    if (searchFilter === 'incoming') return [];
    if (!searchTerm.trim()) return ALL_OUTGOING;
    const term = searchTerm.toLowerCase();
    return ALL_OUTGOING.filter(
      (d) => d.code.toLowerCase().includes(term) || d.title.toLowerCase().includes(term)
    );
  }, [searchTerm, searchFilter]);

  const handleSearchClick = () => {
    // Scroll smoothly to results or feedback
    if (searchTerm.trim()) {
      const matchCount = filteredIncoming.length + filteredOutgoing.length;
      console.log(`[Dashboard Search] Tìm thấy ${matchCount} kết quả cho: "${searchTerm}"`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Welcome Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-subtle), transparent)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backdropFilter: 'var(--backdrop-blur)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {t('dashboardDetails.greeting')}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-subtle)',
                border: '1px solid var(--color-primary-border)',
                color: 'var(--color-primary)',
                fontWeight: 700,
              }}
            >
              {t('dashboardDetails.roleBadge')}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.92rem' }}>
            {t('dashboardDetails.leadDescription')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={() => handleNavigate('/documents/incoming')}
          >
            <i className="fa-solid fa-plus" />
            <span>{t('dashboardDetails.receiveDocBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. KHỐI TÌM KIẾM VĂN BẢN ĐẾN VÀ ĐI */}
      <QuickSearchWidget
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        onSearch={handleSearchClick}
      />

      {/* 3. KPI METRICS DECK & THỐNG KÊ (Component Tách Riêng) */}
      <DashboardStats />

      {/* 4. KHỐI WIDGET: THÔNG BÁO SINH NHẬT THEO NGÀY T, T + 1 & PHÒNG HỌP */}
      <BirthdaysWidget />

      {/* 5. DANH SÁCH VĂN BẢN ĐẾN & VĂN BẢN ĐI (Component Tách Riêng) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
        {searchFilter !== 'outgoing' && (
          <IncomingDocumentsWidget documents={filteredIncoming} />
        )}
        {searchFilter !== 'incoming' && (
          <RecentOutgoingWidget documents={filteredOutgoing} />
        )}
      </div>

      {/* 6. DANH SÁCH CÔNG VIỆC & TÀI LIỆU, BIỂU MẪU CHUNG (Component Tách Riêng) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
        <RecentTasksWidget />
        <RecentResourcesWidget />
      </div>
    </div>
  );
}
