import React, { useState } from 'react';
import { ActivePageId } from '../../../shared/types/navigation';
import { useTranslation } from '../../../shared/locales/i18n';
import { Button } from '../../../shared/components/ui';

interface SettingsPageProps {
  onNavigate?: (page: ActivePageId) => void;
}

export default function SettingsPage(_props: SettingsPageProps) {
  const { t } = useTranslation();

  const [assistiveTouchEnabled, setAssistiveTouchEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tlbm_enable_assistive_touch') === 'true';
  });

  const [aiModel, setAiModel] = useState<'gpt4o' | 'claude' | 'llama'>(() => {
    return (localStorage.getItem('tlbm_ai_model') as 'gpt4o' | 'claude' | 'llama') || 'gpt4o';
  });

  const handleSaveSettings = () => {
    localStorage.setItem('tlbm_enable_assistive_touch', String(assistiveTouchEnabled));
    localStorage.setItem('tlbm_ai_model', aiModel);
    window.dispatchEvent(new Event('tlbm_settings_updated'));
    window.dispatchEvent(new Event('tlbm_ai_model_updated'));
    alert(t('settings.saveSuccessAlert'));
  };

  const handleResetSettings = () => {
    setAssistiveTouchEnabled(false);
    setAiModel('gpt4o');
    localStorage.setItem('tlbm_enable_assistive_touch', 'false');
    localStorage.setItem('tlbm_ai_model', 'gpt4o');
    window.dispatchEvent(new Event('tlbm_settings_updated'));
    window.dispatchEvent(new Event('tlbm_ai_model_updated'));
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
          </h2>
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

        {/* 3. Tiện ích di động & Hỗ trợ thao tác (Nút Home ảo AssistiveTouch) */}
        <div>
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

        {/* 6. Cấu hình Mô hình Trợ lý AI (AI Model) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '22px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-microchip" style={{ color: 'var(--color-primary)' }} />
              <span>Cấu hình Mô hình Trợ lý AI</span>
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Lựa chọn mô hình ngôn ngữ lớn (LLM) phục vụ tra cứu văn bản, quy trình và tương tác với Trợ lý AI.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Mô hình đang kích hoạt:
              </span>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value as 'gpt4o' | 'claude' | 'llama')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '360px',
                }}
              >
                <option value="gpt4o">GPT-4o Enterprise (Khuyên dùng)</option>
                <option value="claude">Claude 3.5 Sonnet</option>
                <option value="llama">Llama 3 TLBM Finetuned (Nội bộ)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-3 mt-2.5 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleResetSettings}
          >
            {t('settings.resetDefault')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSaveSettings}
          >
            {t('settings.saveSettings')}
          </Button>
        </div>
      </div>
    </div>
  );
}
