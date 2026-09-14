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
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className="header-action-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo văn bản (Đến, Đi, Mật)"
        aria-label="Thông báo"
      >
        <i className="fa-regular fa-bell" />
        {totalUnread > 0 && <span className="action-badge-dot" />}
      </button>

      {isOpen && (
        <>
          <div
            className="dropdown-mobile-backdrop"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10000,
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
          <div className="dropdown-menu-wrapper notif-dropdown" style={{ zIndex: 10001 }}>
            <div className="notif-header">
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('notifications.title')}</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('notifications.unreadCount', { count: totalUnread.toString() })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => alert('Đã đánh dấu đã đọc tất cả!')}
                >
                  {t('notifications.markAllRead')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                  title="Đóng bảng thông báo"
                  aria-label="Đóng"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

          {/* 3 Streams Tab Navigation: Đến, Đi, Mật */}
          <div className="notif-tabs">
            {SAMPLE_STREAMS.map((stream) => {
              const streamLabelKey = `notifications.${stream.type}`;
              const streamLabel = t(streamLabelKey) !== streamLabelKey ? t(streamLabelKey) : stream.label;

              return (
                <button
                  key={stream.type}
                  type="button"
                  className={`notif-tab-btn ${activeTab === stream.type ? 'active' : ''}`}
                  onClick={() => setActiveTab(stream.type)}
                >
                  <i className={`fa-solid ${stream.icon}`} />
                  <span>{streamLabel}</span>
                  {stream.unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        background:
                          stream.type === 'confidential'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'rgba(59, 130, 246, 0.2)',
                        color: stream.type === 'confidential' ? 'var(--color-danger)' : 'var(--color-primary)',
                        fontWeight: 700,
                      }}
                    >
                      {stream.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Stream Item List */}
          <div className="notif-list">
            {currentStream.items.map((item) => (
              <div key={item.id} className="notif-item">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="notif-code-badge">{item.code}</span>
                    {item.priority === 'urgent' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                        ● Khẩn
                      </span>
                    )}
                    {item.priority === 'confidential' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                        🔒 Tuyệt Mật
                      </span>
                    )}
                  </div>
                  <div className="notif-item-title">{item.title}</div>
                  <div className="notif-item-meta">
                    <span>{item.senderOrDept}</span>
                    <span>{item.time}</span>
                  </div>
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
