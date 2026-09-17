import React, { useState } from 'react';
import { useTranslation } from '../../../shared/locales/i18n';
import { Button } from '../../../shared/components/ui';

export default function SettingsPage() {
  const { t } = useTranslation();

  const [interfaceStyle, setInterfaceStyle] = useState<'classic' | 'modern'>(() => {
    return (localStorage.getItem('tlbm_interface_style') as 'classic' | 'modern') || 'classic';
  });

  const [assistiveTouchEnabled, setAssistiveTouchEnabled] = useState<boolean>(() => {
    return localStorage.getItem('tlbm_enable_assistive_touch') === 'true';
  });

  const [aiModel, setAiModel] = useState<'gpt4o' | 'claude' | 'llama'>(() => {
    return (localStorage.getItem('tlbm_ai_model') as 'gpt4o' | 'claude' | 'llama') || 'gpt4o';
  });

  const handleSelectStyle = (style: 'classic' | 'modern') => {
    setInterfaceStyle(style);
    localStorage.setItem('tlbm_interface_style', style);
    document.documentElement.setAttribute('data-ui-style', style);
    window.dispatchEvent(new Event('tlbm_settings_updated'));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('tlbm_interface_style', interfaceStyle);
    document.documentElement.setAttribute('data-ui-style', interfaceStyle);
    localStorage.setItem('tlbm_enable_assistive_touch', String(assistiveTouchEnabled));
    localStorage.setItem('tlbm_ai_model', aiModel);
    window.dispatchEvent(new Event('tlbm_settings_updated'));
    window.dispatchEvent(new Event('tlbm_ai_model_updated'));
    alert(t('settings.saveSuccessAlert'));
  };

  const handleResetSettings = () => {
    handleSelectStyle('classic');
    setAssistiveTouchEnabled(false);
    setAiModel('gpt4o');
    localStorage.setItem('tlbm_enable_assistive_touch', 'false');
    localStorage.setItem('tlbm_ai_model', 'gpt4o');
    window.dispatchEvent(new Event('tlbm_ai_model_updated'));
    alert(t('settings.resetSuccessAlert'));
  };

  return (
    <div className="max-w-4xl mx-auto my-5 flex flex-col gap-5">
      <div className="bg-surface border border-border-subtle rounded-xl p-7 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* Header trang Cài đặt */}
        <div className="flex justify-between items-center border-b border-border-subtle pb-4.5 flex-wrap gap-2.5">
          <h2 className="text-xl font-extrabold text-main flex items-center gap-2.5 m-0">
            <i className="fa-solid fa-gear text-primary" />
            <span>{t('settings.title')}</span>
          </h2>
        </div>

        {/* 1. Tùy chọn Phong cách Giao diện (Interface Style) */}
        <div className="border-b border-border-subtle pb-5.5">
          <div className="mb-3.5">
            <h3 className="text-base font-bold text-main flex items-center gap-2">
              <i className="fa-solid fa-palette text-primary" />
              <span>{t('settings.interfaceStyleTitle')}</span>
            </h3>
            <div className="text-xs text-muted mt-1">
              {t('settings.interfaceStyleDesc')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Giao diện Cổ điển */}
            <div
              onClick={() => handleSelectStyle('classic')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                interfaceStyle === 'classic'
                  ? 'border-primary bg-primary-subtle/25 shadow-xs'
                  : 'border-border-subtle bg-surface-elevated hover:border-border hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏛️</span>
                  <span className="text-sm font-bold text-main">{t('settings.interfaceStyleClassic')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-border-subtle text-muted">
                    {t('settings.interfaceStyleClassicBadge')}
                  </span>
                  {interfaceStyle === 'classic' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                      ✓ Đang dùng
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed m-0">
                {t('settings.interfaceStyleClassicDesc')}
              </p>
            </div>

            {/* Giao diện Hiện đại */}
            <div
              onClick={() => handleSelectStyle('modern')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                interfaceStyle === 'modern'
                  ? 'border-primary bg-primary-subtle/25 shadow-xs'
                  : 'border-border-subtle bg-surface-elevated hover:border-border hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">✨</span>
                  <span className="text-sm font-bold text-main">{t('settings.interfaceStyleModern')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-border-subtle text-muted">
                    {t('settings.interfaceStyleModernBadge')}
                  </span>
                  {interfaceStyle === 'modern' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                      ✓ Đang dùng
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed m-0">
                {t('settings.interfaceStyleModernDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Cấu hình thông báo */}
        <div className="border-b border-border-subtle pb-5.5">
          <h3 className="text-base font-bold text-main mb-3.5">
            🔔 {t('settings.notificationSectionTitle')}
          </h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-sm text-secondary cursor-pointer hover:text-main transition-colors">
              <input type="checkbox" defaultChecked className="accent-primary" />
              <span>{t('settings.notifIncoming')}</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-secondary cursor-pointer hover:text-main transition-colors">
              <input type="checkbox" defaultChecked className="accent-primary" />
              <span>{t('settings.notifUrgent')}</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-secondary cursor-pointer hover:text-main transition-colors">
              <input type="checkbox" defaultChecked className="accent-primary" />
              <span>{t('settings.notifDeadline')}</span>
            </label>
          </div>
        </div>

        {/* 3. Bảo mật tài khoản */}
        <div className="border-b border-border-subtle pb-5.5">
          <h3 className="text-base font-bold text-main mb-3.5">
            🛡️ {t('settings.securitySectionTitle')}
          </h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 text-sm text-secondary cursor-pointer hover:text-main transition-colors">
              <input type="checkbox" defaultChecked className="accent-primary" />
              <span>{t('settings.secAutoLock')}</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm text-secondary cursor-pointer hover:text-main transition-colors">
              <input type="checkbox" defaultChecked className="accent-primary" />
              <span>{t('settings.sec2FA')}</span>
            </label>
          </div>
        </div>

        {/* 4. Tiện ích di động & Hỗ trợ thao tác (Nút Home ảo AssistiveTouch) */}
        <div>
          <h3 className="text-base font-bold text-main mb-3 flex items-center gap-2">
            <i className="fa-solid fa-mobile-screen text-primary" />
            <span>{t('settings.mobileUtilitiesTitle')}</span>
          </h3>
          <div className="bg-surface-elevated rounded-lg p-4 border border-border-subtle">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assistiveTouchEnabled}
                onChange={(e) => setAssistiveTouchEnabled(e.target.checked)}
                className="mt-1 cursor-pointer accent-primary scale-110"
              />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-main">
                  {t('settings.assistiveTouchToggle')}
                </span>
                <span className="text-xs text-muted leading-relaxed">
                  {t('settings.assistiveTouchDesc')}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 5. Cấu hình Mô hình Trợ lý AI (AI Model) */}
        <div className="border-t border-border-subtle pt-5.5">
          <div className="mb-3.5">
            <h3 className="text-base font-bold text-main flex items-center gap-2">
              <i className="fa-solid fa-microchip text-primary" />
              <span>Cấu hình Mô hình Trợ lý AI</span>
            </h3>
            <div className="text-xs text-muted mt-1">
              Lựa chọn mô hình ngôn ngữ lớn (LLM) phục vụ tra cứu văn bản, quy trình và tương tác với Trợ lý AI.
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg p-4 sm:px-5 border border-border-subtle">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-main">
                Mô hình đang kích hoạt:
              </span>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value as 'gpt4o' | 'claude' | 'llama')}
                className="px-3 py-2 rounded-md border border-border-subtle bg-surface text-main text-sm font-semibold outline-none cursor-pointer max-w-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
