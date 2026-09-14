import React, { useState } from 'react';
import { ActivePageId } from '../../../shared/types/navigation';
import { ThemeMode } from '../../../shared/types/theme';
import {
  THEME_OPTIONS,
  LIGHT_THEMES,
  DARK_THEMES,
  isLightThemeMode,
} from '../../../shared/utils/constants';
import { useTranslation } from '../../../shared/locales/i18n';

interface SettingsPageProps {
  currentTheme?: ThemeMode;
  onSelectTheme?: (theme: ThemeMode) => void;
  onToggleTheme?: () => void;
  preferredLightTheme?: ThemeMode;
  preferredDarkTheme?: ThemeMode;
  onSetPreferredLightTheme?: (theme: ThemeMode) => void;
  onSetPreferredDarkTheme?: (theme: ThemeMode) => void;
  onNavigate: (page: ActivePageId) => void;
}

export default function SettingsPage({
  currentTheme = 'dark',
  onSelectTheme,
  preferredLightTheme = 'light',
  preferredDarkTheme = 'dark',
  onSetPreferredLightTheme,
  onSetPreferredDarkTheme,
  onNavigate,
}: SettingsPageProps) {
  const { t, currentLang } = useTranslation();

  const [assistiveTouchEnabled, setAssistiveTouchEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tlbm_enable_assistive_touch') === 'true';
  });

  const [sidebarStyle, setSidebarStyle] = useState<'facebook' | 'dock'>(() => {
    return (localStorage.getItem('tlbm_sidebar_style') as 'facebook' | 'dock') || 'facebook';
  });

  const handleSaveSettings = () => {
    localStorage.setItem('tlbm_enable_assistive_touch', String(assistiveTouchEnabled));
    localStorage.setItem('tlbm_sidebar_style', sidebarStyle);
    window.dispatchEvent(new Event('tlbm_settings_updated'));
    alert(t('settings.saveSuccessAlert'));
  };

  const handleResetSettings = () => {
    setAssistiveTouchEnabled(false);
    setSidebarStyle('facebook');
    localStorage.setItem('tlbm_enable_assistive_touch', 'false');
    localStorage.setItem('tlbm_sidebar_style', 'facebook');
    window.dispatchEvent(new Event('tlbm_settings_updated'));
    alert(t('settings.resetSuccessAlert'));
  };

  const activeOption = THEME_OPTIONS.find((tOpt) => tOpt.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div style={{ maxWidth: '840px', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header trang Cài đặt */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <i className="fa-solid fa-gear" style={{ color: 'var(--color-primary)' }} />
            <span>{t('settings.title')}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              ({t('settings.moduleTag')})
            </span>
          </h2>

          <span
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-warning-subtle)',
              border: '1px solid var(--color-warning-border)',
              color: 'var(--color-warning-text)',
              fontWeight: 700,
            }}
          >
            {t('common.group1Developing')}
          </span>
        </div>

        {/* 1. Cài đặt Giao diện Sáng / Tối (Theme Mode) */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-palette" style={{ color: 'var(--color-primary)' }} />
                <span>{t('settings.themeSectionTitle')}</span>
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('settings.themeSectionDesc')}
              </div>
            </div>

            <span
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: isLightThemeMode(currentTheme) ? 'var(--color-warning-subtle)' : 'var(--color-primary-subtle)',
                border: isLightThemeMode(currentTheme) ? '1px solid var(--color-warning-border)' : '1px solid var(--color-primary-border)',
                color: isLightThemeMode(currentTheme) ? 'var(--color-warning-text)' : 'var(--color-primary)',
                fontWeight: 700,
              }}
            >
              {t('settings.currentActive')}: {activeOption.name} ({isLightThemeMode(currentTheme) ? (currentLang === 'en' ? 'Light' : 'Sáng') : (currentLang === 'en' ? 'Dark' : 'Tối')})
            </span>
          </div>

          {/* 1.1. Lựa chọn 2 Chế độ Giao diện đẹp & hiện đại nhất (Clean Light & Sleek Dark) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* 1. Clean Light */}
            <div
              onClick={() => onSelectTheme?.('light')}
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-lg)',
                border: currentTheme === 'light'
                  ? '2px solid #f59e0b'
                  : '1px solid var(--border-subtle)',
                background: currentTheme === 'light'
                  ? 'var(--color-warning-subtle)'
                  : 'var(--bg-surface-elevated)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all var(--transition-fast)',
                boxShadow: currentTheme === 'light' ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-sun" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                      Clean Light
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {currentLang === 'en' ? 'Modern Light Theme' : 'Chế độ Sáng Hiện Đại'}
                    </div>
                  </div>
                </div>
                {currentTheme === 'light' && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f59e0b', color: '#fff', padding: '3px 8px', borderRadius: '10px' }}>
                    ✓ {t('settings.activeSelected')}
                  </span>
                )}
              </div>

              {/* Preview strip */}
              <div
                style={{
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {currentLang === 'en'
                  ? 'Clean office environment, crisp contrast, bright and elegant design for daytime productivity.'
                  : 'Văn phòng trang nhã, tương phản chuẩn mực, sáng sủa và thanh lịch, tối ưu làm việc ban ngày.'}
              </div>
            </div>

            {/* 2. Sleek Dark */}
            <div
              onClick={() => onSelectTheme?.('dark')}
              style={{
                padding: '18px',
                borderRadius: 'var(--radius-lg)',
                border: currentTheme === 'dark'
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--border-subtle)',
                background: currentTheme === 'dark'
                  ? 'var(--color-primary-subtle)'
                  : 'var(--bg-surface-elevated)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all var(--transition-fast)',
                boxShadow: currentTheme === 'dark' ? '0 0 16px var(--color-primary-glow)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-moon" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                      Sleek Dark
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {currentLang === 'en' ? 'Modern Dark Theme' : 'Chế độ Tối Công Nghệ'}
                    </div>
                  </div>
                </div>
                {currentTheme === 'dark' && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'var(--color-primary)', color: '#fff', padding: '3px 8px', borderRadius: '10px' }}>
                    ✓ {t('settings.activeSelected')}
                  </span>
                )}
              </div>

              {/* Preview strip */}
              <div
                style={{
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #0b0f17 0%, #1e293b 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {currentLang === 'en'
                  ? 'Deep slate technology theme, reduces eye strain, sleek depth, and ideal for night-time work.'
                  : 'Nền tối sâu công nghệ chống mỏi mắt, chiều sâu thanh lịch, bảo vệ thị lực và tiết kiệm năng lượng.'}
              </div>
            </div>
          </div>

          {/* Mẹo nhỏ */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-warning-subtle)',
              border: '1px solid var(--color-warning-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <i className="fa-solid fa-lightbulb" style={{ color: 'var(--color-warning)', fontSize: '1.1rem', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--text-main)' }}>{t('settings.tipTitle')}: </strong>
              {t('settings.tipDesc')}
            </div>
          </div>
        </div>

        {/* 2. Cấu hình thông báo */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '22px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            🔔 {t('settings.notificationSectionTitle')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>{t('settings.notifIncoming')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>{t('settings.notifUrgent')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>{t('settings.notifDeadline')}</span>
            </label>
          </div>
        </div>

        {/* 3. Bảo mật tài khoản */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '22px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            🛡️ {t('settings.securitySectionTitle')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>{t('settings.secAutoLock')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>{t('settings.sec2FA')}</span>
            </label>
          </div>
        </div>

        {/* 4. Ngôn ngữ & Khu vực */}
        <div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            🌐 {t('settings.localeSectionTitle')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('settings.localeLanguage')}:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                {currentLang === 'en' ? 'English (EN)' : 'Tiếng Việt (VN)'}
              </div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('settings.localeTimezone')}:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>GMT+7 (Hanoi, HCMC)</div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('settings.localeDateFormat')}:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>DD/MM/YYYY HH:mm:ss</div>
            </div>
          </div>
        </div>

        {/* 5. Phong cách Thanh Điều Hướng Bên Trái (Facebook Style vs Dock Style) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '22px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-bars-staggered" style={{ color: 'var(--color-primary)' }} />
              <span>{t('settings.sidebarStyleTitle')}</span>
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('settings.sidebarStyleDesc')}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Card Facebook Style */}
            <div
              onClick={() => setSidebarStyle('facebook')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: sidebarStyle === 'facebook'
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--border-subtle)',
                background: sidebarStyle === 'facebook'
                  ? 'var(--color-primary-subtle)'
                  : 'var(--bg-surface-elevated)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all var(--transition-fast)',
                boxShadow: sidebarStyle === 'facebook' ? '0 0 14px var(--color-primary-glow)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1877f2 0%, #0d5bbd 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    <i className="fa-brands fa-facebook" />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {t('settings.sidebarStyleFacebook')}
                    </span>
                  </div>
                </div>
                {sidebarStyle === 'facebook' && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    ● {t('settings.activeSelected')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {t('settings.sidebarStyleFacebookDesc')}
              </div>
            </div>

            {/* Card Dock Style */}
            <div
              onClick={() => setSidebarStyle('dock')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: sidebarStyle === 'dock'
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--border-subtle)',
                background: sidebarStyle === 'dock'
                  ? 'var(--color-primary-subtle)'
                  : 'var(--bg-surface-elevated)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all var(--transition-fast)',
                boxShadow: sidebarStyle === 'dock' ? '0 0 14px var(--color-primary-glow)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                    }}
                  >
                    <i className="fa-solid fa-layer-group" />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {t('settings.sidebarStyleDock')}
                    </span>
                  </div>
                </div>
                {sidebarStyle === 'dock' && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    ● {t('settings.activeSelected')}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {t('settings.sidebarStyleDockDesc')}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Tiện ích di động & Hỗ trợ thao tác (Nút Home ảo AssistiveTouch) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '22px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-mobile-screen" style={{ color: 'var(--color-primary)' }} />
            <span>{t('settings.mobileUtilitiesTitle')}</span>
          </h3>
          <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={assistiveTouchEnabled}
                onChange={(e) => setAssistiveTouchEnabled(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--color-primary)', transform: 'scale(1.15)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {t('settings.assistiveTouchToggle')}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {t('settings.assistiveTouchDesc')}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
            onClick={handleResetSettings}
          >
            {t('settings.resetDefault')}
          </button>
          <button
            type="button"
            style={{
              padding: '10px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={handleSaveSettings}
          >
            {t('settings.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
