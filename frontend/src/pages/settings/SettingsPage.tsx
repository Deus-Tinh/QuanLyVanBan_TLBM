import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@i18n/translate';
import { Button } from '@components/common';

// Component Toggle Switch phong cách Hiện đại (Modern UI)
function ModernToggle({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-surface-elevated/40 hover:bg-surface-hover/80 border border-border-subtle/70 transition-all cursor-pointer group select-none"
      onClick={() => onChange(!checked)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-colors ${
              checked ? 'bg-primary-subtle text-primary' : 'bg-surface text-text-muted border border-border-subtle'
            }`}
          >
            <i className={`fa-solid ${icon}`} />
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-main group-hover:text-primary transition-colors">
            {label}
          </span>
          {description && (
            <span className="text-xs text-muted leading-relaxed">
              {description}
            </span>
          )}
        </div>
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 p-0.5 flex items-center ${
          checked
            ? 'bg-primary border border-primary/90 shadow-xs'
            : 'bg-slate-300 dark:bg-slate-700 border border-slate-300/80 dark:border-slate-600/80'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md border border-black/5 transition-transform duration-200 transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [aiModel, setAiModel] = useState<'gpt4o' | 'claude' | 'llama'>(() => {
    return (localStorage.getItem('tlbm_ai_model') as 'gpt4o' | 'claude' | 'llama') || 'gpt4o';
  });

  // Trạng thái thông báo & bảo mật
  const [notifIncoming, setNotifIncoming] = useState(true);
  const [notifUrgent, setNotifUrgent] = useState(true);
  const [notifDeadline, setNotifDeadline] = useState(true);
  const [secAutoLock, setSecAutoLock] = useState(true);
  const [sec2FA, setSec2FA] = useState(true);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSaveSettings = () => {
    localStorage.setItem('tlbm_interface_style', 'modern');
    document.documentElement.setAttribute('data-ui-style', 'modern');
    localStorage.setItem('tlbm_ai_model', aiModel);
    window.dispatchEvent(new Event('tlbm_settings_updated'));
    window.dispatchEvent(new Event('tlbm_ai_model_updated'));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  const handleResetSettings = () => {
    localStorage.setItem('tlbm_interface_style', 'modern');
    document.documentElement.setAttribute('data-ui-style', 'modern');
    setAiModel('gpt4o');
    setNotifIncoming(true);
    setNotifUrgent(true);
    setNotifDeadline(true);
    setSecAutoLock(true);
    setSec2FA(true);
    localStorage.setItem('tlbm_ai_model', 'gpt4o');
    window.dispatchEvent(new Event('tlbm_settings_updated'));
    window.dispatchEvent(new Event('tlbm_ai_model_updated'));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto my-4 sm:my-6 flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Toast thông báo lưu thành công */}
      {showSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-surface border border-success/30 shadow-lg rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
            <i className="fa-solid fa-circle-check" />
          </div>
          <div>
            <div className="text-sm font-bold text-main">{t('settings.saveSuccessAlert')}</div>
            <div className="text-xs text-muted">Đã áp dụng cấu hình trực tiếp vào hệ thống.</div>
          </div>
        </div>
      )}

      {/* 1. Header Banner: Giới thiệu & Nút xem trước Trang Chủ */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <i className="fa-solid fa-gear text-[11px]" />
              <span>Cấu hình ứng dụng</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-main mt-2">
            {t('settings.title')}
          </h1>
          <p className="text-sm text-secondary mt-1 max-w-2xl">
            Tùy biến cấu hình thông báo văn bản, phiên làm việc bảo mật và mô hình Trợ lý AI trên hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 shadow-xs"
          >
            <i className="fa-solid fa-eye text-primary" />
            <span>Xem thử Trang Chủ</span>
          </Button>
        </div>
      </div>

      {/* 2. Cấu hình thông báo & Bảo mật */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Cấu hình thông báo */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary flex items-center justify-center text-sm">
              <i className="fa-solid fa-bell" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-main">
                {t('settings.notificationSectionTitle')}
              </h3>
              <p className="text-xs text-muted">Tùy biến kênh nhận tin và cảnh báo</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <ModernToggle
              checked={notifIncoming}
              onChange={setNotifIncoming}
              label={t('settings.notifIncoming')}
              description="Thông báo đẩy khi văn bản mới đến hòm thư phân phối"
              icon="fa-envelope"
            />
            <ModernToggle
              checked={notifUrgent}
              onChange={setNotifUrgent}
              label={t('settings.notifUrgent')}
              description="Phát âm thanh chuông cảnh báo với văn bản hỏa tốc"
              icon="fa-triangle-exclamation"
            />
            <ModernToggle
              checked={notifDeadline}
              onChange={setNotifDeadline}
              label={t('settings.notifDeadline')}
              description="Tự động thông báo công việc sắp hết hạn xử lý"
              icon="fa-clock"
            />
          </div>
        </div>

        {/* Card: Bảo mật phiên làm việc */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary flex items-center justify-center text-sm">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-main">
                {t('settings.securitySectionTitle')}
              </h3>
              <p className="text-xs text-muted">Bảo vệ phiên làm việc và dữ liệu mật</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <ModernToggle
              checked={secAutoLock}
              onChange={setSecAutoLock}
              label={t('settings.secAutoLock')}
              description="Khóa ứng dụng khi không có thao tác chuột hoặc phím"
              icon="fa-lock"
            />
            <ModernToggle
              checked={sec2FA}
              onChange={setSec2FA}
              label={t('settings.sec2FA')}
              description="Yêu cầu mã xác thực OTP qua email/SMS khi đăng nhập"
              icon="fa-key"
            />
          </div>
        </div>
      </div>

      {/* 3. Cấu hình mô hình AI phân tích văn bản */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary flex items-center justify-center text-sm">
              <i className="fa-solid fa-brain" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-main">
                {t('settings.aiModelSectionTitle')}
              </h3>
              <p className="text-xs text-muted">
                Lựa chọn công cụ trí tuệ nhân tạo để tóm tắt, trích xuất thực thể và phân loại văn bản
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-elevated text-text-muted border border-border-subtle">
            Mô hình đang chọn: {aiModel.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* GPT-4o */}
          <div
            onClick={() => setAiModel('gpt4o')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              aiModel === 'gpt4o'
                ? 'border-primary bg-primary-subtle/20 shadow-xs'
                : 'border-border-subtle bg-surface-elevated hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-main flex items-center gap-1.5">
                <i className="fa-solid fa-bolt text-warning" />
                <span>{t('settings.aiModelGpt4o')}</span>
              </span>
              {aiModel === 'gpt4o' && (
                <i className="fa-solid fa-circle-check text-primary text-sm" />
              )}
            </div>
            <p className="text-xs text-muted">
              Tốc độ phân tích siêu tốc, xử lý văn bản hành chính khối lượng lớn và trích xuất thực thể chính xác.
            </p>
          </div>

          {/* Claude 3.5 Sonnet */}
          <div
            onClick={() => setAiModel('claude')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              aiModel === 'claude'
                ? 'border-primary bg-primary-subtle/20 shadow-xs'
                : 'border-border-subtle bg-surface-elevated hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-main flex items-center gap-1.5">
                <i className="fa-solid fa-feather text-primary" />
                <span>{t('settings.aiModelClaude')}</span>
              </span>
              {aiModel === 'claude' && (
                <i className="fa-solid fa-circle-check text-primary text-sm" />
              )}
            </div>
            <p className="text-xs text-muted">
              Văn phong hành chính chuẩn mực, tóm tắt chỉ đạo điều hành sâu sắc và phân tích sắc bén.
            </p>
          </div>

          {/* Llama 3 On-Premise */}
          <div
            onClick={() => setAiModel('llama')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              aiModel === 'llama'
                ? 'border-primary bg-primary-subtle/20 shadow-xs'
                : 'border-border-subtle bg-surface-elevated hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-main flex items-center gap-1.5">
                <i className="fa-solid fa-server text-success" />
                <span>{t('settings.aiModelLlama')}</span>
              </span>
              {aiModel === 'llama' && (
                <i className="fa-solid fa-circle-check text-primary text-sm" />
              )}
            </div>
            <p className="text-xs text-muted">
              Triển khai tại máy chủ nội bộ (On-Premise), bảo mật tối đa cho tài liệu tuyệt mật và nội bộ.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Khối Lưu & Khôi phục (Footer Actions) */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-muted">
          Nhấn nút bên phải để lưu vĩnh viễn cấu hình vào hồ sơ của bạn.
        </p>
        <div className="flex items-center gap-3">
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
            <i className="fa-solid fa-floppy-disk mr-1.5" />
            {t('settings.saveSettings')}
          </Button>
        </div>
      </div>
    </div>
  );
}


