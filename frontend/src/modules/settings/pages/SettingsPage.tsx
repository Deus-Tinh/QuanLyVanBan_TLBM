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

  const [expandedMode, setExpandedMode] = useState<'light' | 'dark' | null>(() => {
    return isLightThemeMode(currentTheme) ? 'light' : 'dark';
  });

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

          {/* 1.1. Chuyển đổi nhanh 2 Chế độ Sáng / Tối */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {/* Chế độ Sáng */}
            <div
              onClick={() => {
                if (onSelectTheme && !isLightThemeMode(currentTheme)) {
                  onSelectTheme(preferredLightTheme);
                }
                setExpandedMode(expandedMode === 'light' ? null : 'light');
              }}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: expandedMode === 'light'
                  ? '2px solid var(--color-warning)'
                  : isLightThemeMode(currentTheme)
                  ? '1.5px solid var(--color-warning-border)'
                  : '1px solid var(--border-subtle)',
                background: expandedMode === 'light'
                  ? 'var(--color-warning-subtle)'
                  : 'var(--bg-surface-elevated)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-sun" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                    {currentLang === 'en' ? 'Light Theme' : 'Chế độ Sáng'}
                  </span>
                  {isLightThemeMode(currentTheme) && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'var(--color-warning)', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
                      ✓ {t('settings.activeSelected')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {t('settings.lightModeHeading')}: <strong style={{ color: 'var(--text-main)' }}>{THEME_OPTIONS.find((tOpt) => tOpt.id === preferredLightTheme)?.name}</strong>
                </div>
              </div>

              <i className={`fa-solid ${expandedMode === 'light' ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'var(--text-muted)' }} />
            </div>

            {/* Chế độ Tối */}
            <div
              onClick={() => {
                if (onSelectTheme && isLightThemeMode(currentTheme)) {
                  onSelectTheme(preferredDarkTheme);
                }
                setExpandedMode(expandedMode === 'dark' ? null : 'dark');
              }}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: expandedMode === 'dark'
                  ? '2px solid var(--color-primary)'
                  : !isLightThemeMode(currentTheme)
                  ? '1.5px solid var(--color-primary-border)'
                  : '1px solid var(--border-subtle)',
                background: expandedMode === 'dark'
                  ? 'var(--color-primary-subtle)'
                  : 'var(--bg-surface-elevated)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-moon" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                    {currentLang === 'en' ? 'Dark Theme' : 'Chế độ Tối'}
                  </span>
                  {!isLightThemeMode(currentTheme) && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'var(--color-primary)', color: '#fff', padding: '2px 7px', borderRadius: '10px' }}>
                      ✓ {t('settings.activeSelected')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {t('settings.darkModeHeading')}: <strong style={{ color: 'var(--text-main)' }}>{THEME_OPTIONS.find((tOpt) => tOpt.id === preferredDarkTheme)?.name}</strong>
                </div>
              </div>

              <i className={`fa-solid ${expandedMode === 'dark' ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* 1.2. Danh sách các Theme chi tiết khi mở rộng */}
          {expandedMode && (
            <div
              style={{
                padding: '18px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                marginTop: '12px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                {expandedMode === 'light' ? t('settings.lightModeHeading') : t('settings.darkModeHeading')} ({expandedMode === 'light' ? '6 styles' : '4 styles'}):
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px' }}>
                {THEME_OPTIONS.filter((tOpt) =>
                  expandedMode === 'light' ? LIGHT_THEMES.includes(tOpt.id) : DARK_THEMES.includes(tOpt.id)
                ).map((tOpt) => {
                  const isCurrentActive = currentTheme === tOpt.id;
                  const isPreferred = expandedMode === 'light' ? preferredLightTheme === tOpt.id : preferredDarkTheme === tOpt.id;

                  return (
                    <div
                      key={tOpt.id}
                      onClick={() => {
                        if (expandedMode === 'light') {
                          onSetPreferredLightTheme?.(tOpt.id);
                        } else {
                          onSetPreferredDarkTheme?.(tOpt.id);
                        }
                        onSelectTheme?.(tOpt.id);
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: isCurrentActive
                          ? '2px solid var(--color-primary)'
                          : isPreferred
                          ? '1.5px solid var(--color-primary-border)'
                          : '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isCurrentActive ? '0 0 12px var(--color-primary-glow)' : 'none',
                      }}
                    >
                      {/* Thẻ preview màu */}
                      <div
                        style={{
                          height: '42px',
                          borderRadius: 'var(--radius-sm)',
                          background: tOpt.previewGradient,
                          border: `1px solid ${tOpt.borderPreview}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '1rem',
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        }}
                      >
                        <i className={`fa-solid ${tOpt.icon}`} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{tOpt.name}</span>
                          {isCurrentActive && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>● {t('settings.activeSelected')}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                          {tOpt.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            onClick={() => alert(t('settings.resetSuccessAlert'))}
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
            onClick={() => alert(t('settings.saveSuccessAlert'))}
          >
            {t('settings.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
