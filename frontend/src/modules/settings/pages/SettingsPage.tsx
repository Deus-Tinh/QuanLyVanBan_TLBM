import React, { useState } from 'react';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';

interface SettingsPageProps {
  onNavigate: (page: ActivePageId) => void;
}

export default function SettingsPage({
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

        {/* 1. Cấu hình thông báo */}
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

        {/* 2. Bảo mật tài khoản */}
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

        {/* 3. Ngôn ngữ & Khu vực */}
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

        {/* 4. Phong cách Thanh Điều Hướng Bên Trái (Facebook Style vs Dock Style) */}
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

        {/* 5. Tiện ích di động & Hỗ trợ thao tác (Nút Home ảo AssistiveTouch) */}
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
