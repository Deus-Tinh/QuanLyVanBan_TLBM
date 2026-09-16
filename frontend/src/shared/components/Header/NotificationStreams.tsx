import React, { useState, useRef, useEffect } from 'react';
import { SAMPLE_STREAMS } from '../../utils/constants';
import { NotificationStreamType } from '../../types/notification';
import { useTranslation } from '../../locales/i18n';

export default function NotificationStreams() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationStreamType>('incoming');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside (support both pointerdown and touchstart)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const totalUnread = SAMPLE_STREAMS.reduce((acc, s) => acc + s.unreadCount, 0);
  const currentStream = SAMPLE_STREAMS.find((s) => s.type === activeTab) || SAMPLE_STREAMS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-surface-hover transition-colors duration-fast"
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo văn bản (Đến, Đi, Mật)"
        aria-label="Thông báo"
      >
        <i className="fa-regular fa-bell text-base" />
        {totalUnread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-header" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[10000] bg-backdrop backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[380px] max-h-[calc(100vh-80px)] sm:max-h-[520px] rounded-xl bg-surface-elevated border border-subtle shadow-glass flex flex-col z-[10001] overflow-hidden">
            <div className="p-3.5 border-b border-subtle flex items-center justify-between bg-surface/40">
              <div>
                <span className="font-bold text-sm text-text-main">{t('notifications.title')}</span>
                <div className="text-xs text-text-muted">
                  {t('notifications.unreadCount', { count: totalUnread.toString() })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                  onClick={() => alert('Đã đánh dấu đã đọc tất cả!')}
                >
                  {t('notifications.markAllRead')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full bg-surface-hover border border-subtle text-text-secondary flex items-center justify-center hover:text-text-main text-xs"
                  title="Đóng bảng thông báo"
                  aria-label="Đóng"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            {/* 3 Streams Tab Navigation: Đến, Đi, Mật */}
            <div className="flex items-center p-1.5 bg-surface border-b border-subtle gap-1">
              {SAMPLE_STREAMS.map((stream) => {
                const streamLabelKey = `notifications.${stream.type}`;
                const streamLabel = t(streamLabelKey) !== streamLabelKey ? t(streamLabelKey) : stream.label;

                return (
                  <button
                    key={stream.type}
                    type="button"
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-fast ${
                      activeTab === stream.type
                        ? 'bg-surface-elevated text-primary font-semibold shadow-sm'
                        : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                    }`}
                    onClick={() => setActiveTab(stream.type)}
                  >
                    <i className={`fa-solid ${stream.icon} text-xs`} />
                    <span>{streamLabel}</span>
                    {stream.unreadCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          stream.type === 'confidential'
                            ? 'bg-danger-subtle text-danger'
                            : 'bg-primary-subtle text-primary'
                        }`}
                      >
                        {stream.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stream Item List */}
            <div className="flex-1 overflow-y-auto divide-y divide-subtle p-1 max-h-[360px]">
              {currentStream.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-surface-hover rounded-lg transition-colors duration-fast cursor-pointer flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-surface border border-subtle text-text-secondary">
                      {item.code}
                    </span>
                    {item.priority === 'urgent' && (
                      <span className="text-[11px] text-danger font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" /> Khẩn
                      </span>
                    )}
                    {item.priority === 'confidential' && (
                      <span className="text-[11px] text-danger font-bold flex items-center gap-1">
                        🔒 Tuyệt Mật
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-xs text-text-main line-clamp-2 leading-relaxed">
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted mt-1.5">
                    <span>{item.senderOrDept}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
