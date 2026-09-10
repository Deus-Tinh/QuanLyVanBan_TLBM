import React, { useState } from 'react';

export default function ConfigModal({ isOpen, onClose, initialConfig, onSave }) {
  const [time, setTime] = useState(initialConfig?.time || '08:00');
  const [autoSend, setAutoSend] = useState(initialConfig?.autoSend ?? true);
  const [templateTitle, setTemplateTitle] = useState(
    initialConfig?.templateTitle || 'Chúc mừng sinh nhật CBNV TLBM'
  );

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ time, autoSend, templateTitle });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0d9488' }} />
            <h3>Cấu Hình Lịch Phát Tự Động Hằng Ngày</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Hệ thống sẽ tự động quét danh sách CBNV có sinh nhật trong ngày và gửi email thiệp chúc mừng theo đúng giờ đã đặt.
            </p>

            <div className="form-group">
              <label className="form-label">Khung giờ quét &amp; phát tự động:</label>
              <input
                type="time"
                className="form-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
              <span className="field-hint">Mặc định: 08:00 sáng mỗi ngày làm việc</span>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Tiêu đề Email gửi đến nhân sự:</label>
              <input
                type="text"
                className="form-input"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-checkbox-row" style={{ marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-body)', fontWeight: 600 }}>
                  Kích hoạt dịch vụ Cron Scheduler tự động phát thiệp
                </span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="close-btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="primary-send-btn">
              <i className="fa-solid fa-floppy-disk" /> Lưu cấu hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
