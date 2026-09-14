import React, { useState } from 'react';
import { ActivePageId } from '../shared/types/navigation';
import { ThemeMode } from '../shared/types/theme';
import {
  THEME_OPTIONS,
  LIGHT_THEMES,
  DARK_THEMES,
  isLightThemeMode,
} from '../shared/utils/constants';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import AiAssistantPage from '../modules/ai/pages/AiAssistantPage';

interface RouterProps {
  activePage: ActivePageId;
  currentTheme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
  onSetPreferredLightTheme?: (theme: ThemeMode) => void;
  onSetPreferredDarkTheme?: (theme: ThemeMode) => void;
  onNavigate: (page: ActivePageId) => void;
}

import { useTranslation } from '../shared/locales/i18n';

// Bảng thông tin chi tiết từng phân hệ theo đúng đề cương ITC - Django - QLVB&TL.md được quản trị qua file i18n
interface PageMeta {
  title: string;
  module: string;
  assignedTeam: string;
  codeRef: string;
  isGroup1: boolean;
  desc: string;
}

export default function AppRouter({
  activePage,
  currentTheme = 'dark',
  onSelectTheme,
  onToggleTheme,
  preferredLightTheme = 'light',
  preferredDarkTheme = 'dark',
  onSetPreferredLightTheme,
  onSetPreferredDarkTheme,
  onNavigate,
}: RouterProps) {
  const { t, translations } = useTranslation();
  const pageMap = (translations.pages || {}) as Record<ActivePageId, PageMeta>;

  // Trạng thái mở rộng danh sách phong cách: 'light' | 'dark' | null (chỉ mở khi bấm vào icon tương ứng)
  const [expandedMode, setExpandedMode] = useState<'light' | 'dark' | null>(() => {
    return isLightThemeMode(currentTheme) ? 'light' : 'dark';
  });

  if (activePage === 'dashboard') {
    return <DashboardPage onNavigate={onNavigate} />;
  }

  if (activePage === 'ai_assistant') {
    return <AiAssistantPage onNavigate={onNavigate} />;
  }

  const meta = pageMap[activePage] || {
    title: activePage,
    module: 'Chức năng hệ thống',
    assignedTeam: 'Nhóm 1 (Trưởng nhóm: Châu Tuấn Kiệt)',
    codeRef: 'ITC Django MĐ501911',
    isGroup1: true,
    desc: 'Phân hệ quản lý văn bản & tài liệu mật TLBM.',
  };

  return (
    <div style={{ maxWidth: '820px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Banner Thông Báo Chính Thức Của Nhóm 1 */}
      <div
        style={{
          background: meta.isGroup1
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(234, 88, 12, 0.08))'
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.08))',
          border: meta.isGroup1
            ? '1px solid rgba(245, 158, 11, 0.4)'
            : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'var(--backdrop-blur)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Nhãn trạng thái Nhóm 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: meta.isGroup1 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.2)',
                color: meta.isGroup1 ? '#d97706' : '#2563eb',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className={meta.isGroup1 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'} />
              {meta.isGroup1 ? t('common.group1Developing') : t('common.group1Layout')}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {meta.codeRef}
            </span>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('common.outline')}: <strong>{meta.module}</strong>
          </span>
        </div>

        {/* Tiêu đề chức năng */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
          {meta.title}
        </h1>

        {/* Mô tả nghiệp vụ */}
        <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {meta.desc}
        </p>

        {/* Thông báo chi tiết phụ trách */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--text-main)' }}>📌 {t('common.assignedUnit')}:</strong>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meta.assignedTeam}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--text-main)' }}>⚠️ {t('common.currentStatus')}:</strong>
            <span style={{ color: '#d97706', fontWeight: 700 }}>
              {meta.isGroup1
                ? t('common.group1DescSelf')
                : t('common.group1DescOther', { team: meta.assignedTeam })}
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={() => onNavigate('dashboard')}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>{t('common.backToDashboard')}</span>
          </button>
        </div>
      </div>

      {/* 2. Khung Tương Tác Cụ Thể Cho Từng Phân Hệ Của Nhóm 1 */}
      {activePage === 'login' && (
        <LoginPage
          onNavigate={onNavigate}
          onLoginSuccess={() => onNavigate('dashboard')}
        />
      )}


      {activePage === 'profile' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              👤 Hồ Sơ Cán Bộ Nhân Viên (Thuộc Module 1.1 của Nhóm 1)
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Nhóm 1 đang trong quá trình phát triển
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Họ và tên:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Châu Tuấn Kiệt</div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Vai trò trong dự án:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>Project Manager (PM) · Trưởng Nhóm 1</div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Đơn vị công tác:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Ban Công Nghệ Thông Tin (ITC)</div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email liên hệ:</span>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>kiet.ct@itc.edu.vn</div>
            </div>
          </div>
        </div>
      )}

      {activePage === 'password_change' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              🔑 Thiết Lập Mật Khẩu Mới (Thuộc Module 1.1 của Nhóm 1)
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Nhóm 1 đang trong quá trình phát triển
            </span>
          </div>

          <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mật khẩu hiện tại:</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu cũ..."
                disabled
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mật khẩu mới:</label>
              <input
                type="password"
                placeholder="Tối thiểu 8 ký tự, gồm chữ hoa, số..."
                disabled
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
                disabled
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                }}
              />
            </div>
            <button
              type="button"
              disabled
              style={{
                marginTop: '10px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                opacity: 0.7,
              }}
            >
              Cập Nhật Mật Khẩu (Nhóm 1 đang phát triển)
            </button>
          </div>
        </div>
      )}

      {activePage === 'settings' && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-gear" style={{ color: 'var(--color-primary)' }} />
              <span>Cài Đặt Hệ Thống & Tùy Chọn Ứng Dụng (Module 1.1)</span>
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#d97706',
                fontWeight: 700,
              }}
            >
              Nhóm 1 đang phát triển
            </span>
          </div>

          {/* 1. Cài đặt Giao diện Sáng / Tối (Theme Mode) */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-palette" style={{ color: 'var(--color-primary)' }} />
                  <span>Cài Đặt Chế Độ & Phong Cách Giao Diện</span>
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Nút trên thanh Header sẽ chuyển đổi trực tiếp giữa Giao diện Sáng và Giao diện Tối bạn đã cấu hình tại đây.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: isLightThemeMode(currentTheme) ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: isLightThemeMode(currentTheme) ? '#d97706' : '#0284c7',
                    fontWeight: 700,
                  }}
                >
                  Đang dùng: {THEME_OPTIONS.find((t) => t.id === currentTheme)?.name || currentTheme} ({isLightThemeMode(currentTheme) ? 'Sáng' : 'Tối'})
                </span>
              </div>
            </div>

            {/* 1.1. Chuyển đổi nhanh Chế độ Sáng / Tối (2 Icon Sáng / Tối) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Chế độ hiển thị tức thì (Nhấp vào Icon để mở phong cách tương ứng)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {/* 1. ICON CHẾ ĐỘ SÁNG */}
                <div
                  onClick={() => {
                    if (onSelectTheme && !isLightThemeMode(currentTheme)) {
                      onSelectTheme(preferredLightTheme);
                    }
                    setExpandedMode(expandedMode === 'light' ? null : 'light');
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: expandedMode === 'light'
                      ? '2px solid #f59e0b'
                      : isLightThemeMode(currentTheme)
                      ? '1.5px solid rgba(245, 158, 11, 0.5)'
                      : '1px solid var(--border-subtle)',
                    background: expandedMode === 'light'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : isLightThemeMode(currentTheme)
                      ? 'rgba(245, 158, 11, 0.06)'
                      : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.22s ease',
                    boxShadow: expandedMode === 'light' ? '0 0 16px rgba(245, 158, 11, 0.3)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-sun" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-main)' }}>Chế độ Sáng</span>
                      {isLightThemeMode(currentTheme) && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#f59e0b', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
                          ✓ Đang bật
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Giao diện: <strong style={{ color: 'var(--text-main)' }}>{THEME_OPTIONS.find((t) => t.id === preferredLightTheme)?.name}</strong>
                    </div>
                  </div>
                  <i
                    className={`fa-solid ${expandedMode === 'light' ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                    style={{
                      fontSize: '0.82rem',
                      color: expandedMode === 'light' ? '#f59e0b' : 'var(--text-muted)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </div>

                {/* 2. ICON CHẾ ĐỘ TỐI */}
                <div
                  onClick={() => {
                    if (onSelectTheme && isLightThemeMode(currentTheme)) {
                      onSelectTheme(preferredDarkTheme);
                    }
                    setExpandedMode(expandedMode === 'dark' ? null : 'dark');
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: expandedMode === 'dark'
                      ? '2px solid #0284c7'
                      : !isLightThemeMode(currentTheme)
                      ? '1.5px solid rgba(2, 132, 199, 0.5)'
                      : '1px solid var(--border-subtle)',
                    background: expandedMode === 'dark'
                      ? 'rgba(2, 132, 199, 0.14)'
                      : !isLightThemeMode(currentTheme)
                      ? 'rgba(2, 132, 199, 0.06)'
                      : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.22s ease',
                    boxShadow: expandedMode === 'dark' ? '0 0 16px rgba(2, 132, 199, 0.3)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-moon" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-main)' }}>Chế độ Tối</span>
                      {!isLightThemeMode(currentTheme) && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#0284c7', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
                          ✓ Đang bật
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Giao diện: <strong style={{ color: 'var(--text-main)' }}>{THEME_OPTIONS.find((t) => t.id === preferredDarkTheme)?.name}</strong>
                    </div>
                  </div>
                  <i
                    className={`fa-solid ${expandedMode === 'dark' ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                    style={{
                      fontSize: '0.82rem',
                      color: expandedMode === 'dark' ? '#0284c7' : 'var(--text-muted)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* DANH SÁCH GIAO DIỆN CON: CHỈ HIỆN KHI BẤM VÀO ICON TƯƠNG ỨNG */}
            {expandedMode === 'light' && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(245, 158, 11, 0.04)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  animation: 'dropdownFadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-sun" style={{ color: '#f59e0b' }} />
                    <span>Các phong cách cho Chế độ Sáng ({LIGHT_THEMES.length} phong cách)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Đang chọn: <strong style={{ color: '#d97706' }}>{THEME_OPTIONS.find((t) => t.id === preferredLightTheme)?.name}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Nhấp vào một phong cách bên dưới để gán làm giao diện mặc định mỗi khi bạn bật Chế độ Sáng:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                  {THEME_OPTIONS.filter((t) => LIGHT_THEMES.includes(t.id)).map((themeOpt) => {
                    const isAssignedLight = preferredLightTheme === themeOpt.id;
                    return (
                      <div
                        key={themeOpt.id}
                        onClick={() => {
                          if (onSetPreferredLightTheme) {
                            onSetPreferredLightTheme(themeOpt.id);
                          } else if (onSelectTheme) {
                            onSelectTheme(themeOpt.id);
                          }
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: isAssignedLight ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
                          background: isAssignedLight ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface-elevated)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                          boxShadow: isAssignedLight ? '0 0 12px rgba(245, 158, 11, 0.25)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: themeOpt.previewGradient,
                            border: `1px solid ${themeOpt.borderPreview || 'rgba(0,0,0,0.1)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            color: '#0f172a',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          <i className={`fa-solid ${themeOpt.icon}`} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {themeOpt.name}
                            </span>
                            {isAssignedLight && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap' }}>
                                ✓ Đã chọn
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {themeOpt.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {expandedMode === 'dark' && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(2, 132, 199, 0.04)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  animation: 'dropdownFadeIn 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-moon" style={{ color: '#0284c7' }} />
                    <span>Các phong cách cho Chế độ Tối ({DARK_THEMES.length} phong cách)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Đang chọn: <strong style={{ color: '#0284c7' }}>{THEME_OPTIONS.find((t) => t.id === preferredDarkTheme)?.name}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Nhấp vào một phong cách bên dưới để gán làm giao diện mặc định mỗi khi bạn bật Chế độ Tối:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                  {THEME_OPTIONS.filter((t) => DARK_THEMES.includes(t.id)).map((themeOpt) => {
                    const isAssignedDark = preferredDarkTheme === themeOpt.id;
                    return (
                      <div
                        key={themeOpt.id}
                        onClick={() => {
                          if (onSetPreferredDarkTheme) {
                            onSetPreferredDarkTheme(themeOpt.id);
                          } else if (onSelectTheme) {
                            onSelectTheme(themeOpt.id);
                          }
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: isAssignedDark ? '2px solid #0284c7' : '1px solid var(--border-subtle)',
                          background: isAssignedDark ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-surface-elevated)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                          boxShadow: isAssignedDark ? '0 0 12px rgba(2, 132, 199, 0.25)' : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: themeOpt.previewGradient,
                            border: `1px solid ${themeOpt.borderPreview || 'rgba(255,255,255,0.1)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            color: '#ffffff',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        >
                          <i className={`fa-solid ${themeOpt.icon}`} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {themeOpt.name}
                            </span>
                            {isAssignedDark && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap' }}>
                                ✓ Đã chọn
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3, marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {themeOpt.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1.4. Chú thích nghiệp vụ */}
            <div
              style={{
                marginTop: '18px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px dashed var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              <i className="fa-solid fa-lightbulb" style={{ color: '#f59e0b', fontSize: '1rem', flexShrink: 0 }} />
              <div>
                <strong>Tiện ích chuyển đổi nhanh:</strong> Nút bấm trên thanh Header (cạnh đồng hồ) là nút chuyển đổi trực tiếp 1-chạm giữa <strong>Giao diện Sáng</strong> và <strong>Giao diện Tối</strong> bạn đã cấu hình tại đây, không còn mở menu dài gây vướng mắt.
              </div>
            </div>
          </div>

          {/* 2. Tùy chọn thông báo */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              🔔 Cấu hình thông báo văn bản
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Nhận thông báo khi có văn bản đến mới được phân phối</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Cảnh báo âm thanh đối với văn bản có độ khẩn "HỎA TỐC" hoặc "TUYỆT MẬT"</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Nhắc việc tự động trước hạn xử lý 01 ngày</span>
              </label>
            </div>
          </div>

          {/* 2. Bảo mật tài khoản */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              🛡️ Bảo mật phiên làm việc
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Tự động khóa màn hình làm việc sau 15 phút không thao tác</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>Bắt buộc xác thực hai bước (2FA) khi truy cập tài liệu Tuyệt Mật</span>
              </label>
            </div>
          </div>

          {/* 3. Ngôn ngữ & Khu vực */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
              🌐 Ngôn ngữ & Định dạng thời gian
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ngôn ngữ hiển thị:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>Tiếng Việt (Mặc định)</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Múi giờ chuẩn:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>GMT+7 (Hà Nội, TP.HCM)</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Định dạng ngày hành chính:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>DD/MM/YYYY HH:mm:ss</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
              onClick={() => alert('Cấu hình cài đặt đã được hoàn nguyên về mặc định.')}
            >
              Mặc định
            </button>
            <button
              type="button"
              style={{
                padding: '9px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--color-primary-glow)',
              }}
              onClick={() => alert('Đã lưu thành công cấu hình cài đặt hệ thống!')}
            >
              Lưu Cài Đặt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
