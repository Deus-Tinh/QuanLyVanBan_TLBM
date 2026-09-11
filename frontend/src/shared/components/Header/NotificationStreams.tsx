import React, { useState, useRef, useEffect } from 'react';
import { SAMPLE_STREAMS } from '../../utils/constants';
import { NotificationStreamType } from '../../types/notification';

export default function NotificationStreams() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationStreamType>('incoming');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        <div className="dropdown-menu-wrapper notif-dropdown">
          <div className="notif-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Thông Báo Văn Bản</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {totalUnread} văn bản chưa đọc
              </div>
            </div>
            <button
              type="button"
              style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}
              onClick={() => alert('Đã đánh dấu đã đọc tất cả!')}
            >
              Đánh dấu đã đọc
            </button>
          </div>

          {/* 3 Streams Tab Navigation: Đến, Đi, Mật */}
          <div className="notif-tabs">
            {SAMPLE_STREAMS.map((stream) => (
              <button
                key={stream.type}
                type="button"
                className={`notif-tab-btn ${activeTab === stream.type ? 'active' : ''}`}
                onClick={() => setActiveTab(stream.type)}
              >
                <i className={`fa-solid ${stream.icon}`} />
                <span>{stream.label}</span>
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
                      color: stream.type === 'confidential' ? '#ef4444' : '#3b82f6',
                      fontWeight: 700,
                    }}
                  >
                    {stream.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Stream Item List */}
          <div className="notif-list">
            {currentStream.items.map((item) => (
              <div key={item.id} className="notif-item">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="notif-code-badge">{item.code}</span>
                    {item.priority === 'urgent' && (
                      <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>
                        ● Khẩn
                      </span>
                    )}
                    {item.priority === 'confidential' && (
                      <span style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 700 }}>
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
      )}
    </div>
  );
}
