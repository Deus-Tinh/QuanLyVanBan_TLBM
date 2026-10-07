import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ToastNotification {
  id: number;
  message: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
  title?: string;
  duration?: number;
}

export interface ToastProps {
  toast: ToastNotification | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    setProgress(100);
    const duration = toast.duration || 3800;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  if (typeof document === 'undefined') return null;

  const type = toast.type || 'success';

  const config = {
    success: {
      icon: 'fa-circle-check',
      iconBg: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
      badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      defaultTitle: 'Thành công',
      accentBorder: 'border-l-4 border-l-emerald-500',
      progressBar: 'bg-emerald-500',
    },
    danger: {
      icon: 'fa-circle-xmark',
      iconBg: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
      badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
      defaultTitle: 'Đã xóa',
      accentBorder: 'border-l-4 border-l-rose-500',
      progressBar: 'bg-rose-500',
    },
    warning: {
      icon: 'fa-triangle-exclamation',
      iconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
      badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
      defaultTitle: 'Cảnh báo',
      accentBorder: 'border-l-4 border-l-amber-500',
      progressBar: 'bg-amber-500',
    },
    info: {
      icon: 'fa-circle-info',
      iconBg: 'bg-sky-500/10 text-sky-500 border border-sky-500/20',
      badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
      defaultTitle: 'Thông báo',
      accentBorder: 'border-l-4 border-l-sky-500',
      progressBar: 'bg-sky-500',
    },
  }[type];

  return createPortal(
    <div
      className="fixed top-6 right-6 z-[999999] max-w-sm sm:max-w-md w-full px-3 sm:px-0 animate-fade-in pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-surface/95 border border-border-subtle shadow-2xl backdrop-blur-md p-4 transition-all ${config.accentBorder}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon badge */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}
          >
            <i className={`fa-solid ${config.icon} text-base`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.badgeBg}`}
              >
                {toast.title || config.defaultTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-main font-semibold leading-snug break-words">
              {toast.message}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted hover:text-main hover:bg-surface-elevated flex items-center justify-center transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            aria-label="Đóng thông báo"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Progress bar countdown */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-border-subtle/50">
          <div
            className={`h-full transition-all duration-75 ${config.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
