import React, { useState } from 'react';
import { notificationService } from '../../services/notificationService';
import { useDropdown } from '../../hooks/useDropdown';

export default function NotificationStreams() {
  const [activeStream, setActiveStream] = useState(null); // 'incoming', 'outgoing', 'confidential' or null
  const { isOpen, toggle, close, ref } = useDropdown();
  const streams = notificationService.getStreams();

  const handleOpenStream = (streamKey) => {
    if (activeStream === streamKey && isOpen) {
      close();
      setActiveStream(null);
    } else {
      setActiveStream(streamKey);
      if (!isOpen) toggle();
    }
  };

  return (
    <div className="notification-streams-wrapper" ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
      {/* Nút 1: Văn bản Đến */}
      <button
        type="button"
        className={`stream-btn ${activeStream === 'incoming' && isOpen ? 'active' : ''}`}
        onClick={() => handleOpenStream('incoming')}
        title="Luồng Văn bản Đến"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 8px',
          borderRadius: '10px',
          background: 'var(--inset-well-bg)',
          border: '1px solid var(--liquid-glass-border)',
          color: 'var(--text-main)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <i className="fa-solid fa-inbox" style={{ color: '#2563eb' }} />
        <span className="stream-badge blue-badge" style={{ background: '#2563eb', color: '#fff', borderRadius: '20px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}>
          12
        </span>
      </button>

      {/* Nút 2: Văn bản Đi */}
      <button
        type="button"
        className={`stream-btn ${activeStream === 'outgoing' && isOpen ? 'active' : ''}`}
        onClick={() => handleOpenStream('outgoing')}
        title="Luồng Văn bản Đi"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 8px',
          borderRadius: '10px',
          background: 'var(--inset-well-bg)',
          border: '1px solid var(--liquid-glass-border)',
          color: 'var(--text-main)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <i className="fa-solid fa-paper-plane" style={{ color: '#0d9488' }} />
        <span className="stream-badge teal-badge" style={{ background: '#0d9488', color: '#fff', borderRadius: '20px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}>
          5
        </span>
      </button>

      {/* Nút 3: Văn bản Mật & Khẩn */}
      <button
        type="button"
        className={`stream-btn ${activeStream === 'confidential' && isOpen ? 'active' : ''}`}
        onClick={() => handleOpenStream('confidential')}
        title="Luồng Văn bản Mật & Khẩn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 8px',
          borderRadius: '10px',
          background: 'var(--inset-well-bg)',
          border: '1px solid var(--liquid-glass-border)',
          color: 'var(--text-main)',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <i className="fa-solid fa-shield-halved" style={{ color: '#e11d48' }} />
        <span className="stream-badge red-badge pulse-badge" style={{ background: '#e11d48', color: '#fff', borderRadius: '20px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}>
          2
        </span>
      </button>

      {/* Dropdown xem chi tiết danh sách theo luồng */}
      {isOpen && activeStream && (
        <div
          className="stream-dropdown-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '360px',
            background: 'var(--deck-bg)',
            border: '1px solid var(--deck-border)',
            borderRadius: '16px',
            boxShadow: 'var(--deck-shadow)',
            padding: '16px',
            zIndex: 1100,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {activeStream === 'incoming' && '📥 Luồng Văn bản Đến'}
              {activeStream === 'outgoing' && '📤 Luồng Văn bản Đi'}
              {activeStream === 'confidential' && '🛡️ Văn bản Mật & Hỏa Tốc'}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mới nhất</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {activeStream === 'incoming' &&
              streams.incoming.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--inset-well-bg)',
                    border: '1px solid var(--liquid-glass-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                    <span>{item.code}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Người gửi: {item.sender}
                  </div>
                </div>
              ))}

            {activeStream === 'outgoing' &&
              streams.outgoing.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--inset-well-bg)',
                    border: '1px solid var(--liquid-glass-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#0d9488' }}>
                    <span>{item.code}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Trạng thái: <span style={{ color: '#16a34a', fontWeight: 600 }}>{item.status}</span>
                  </div>
                </div>
              ))}

            {activeStream === 'confidential' &&
              streams.confidential.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(225, 29, 72, 0.06)',
                    border: '1px solid rgba(225, 29, 72, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#e11d48' }}>
                    <span>{item.code}</span>
                    <span style={{ background: '#e11d48', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem' }}>
                      {item.securityLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Ký duyệt: {item.signer} · {item.time}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
