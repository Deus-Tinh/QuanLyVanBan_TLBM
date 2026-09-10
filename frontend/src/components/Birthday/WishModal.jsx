import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function WishModal({ staff, isOpen, onClose, onSend }) {
  const [sender, setSender] = useState('Ban Tổng Giám đốc & Công đoàn TLBM');
  const [message, setMessage] = useState('');
  const [attachTemplate, setAttachTemplate] = useState(true);

  useEffect(() => {
    if (staff) {
      setMessage(
        `Kính chúc Anh/Chị ${staff.name} một ngày sinh nhật thật ấm áp, ngập tràn niềm vui, vạn sự hanh thông và luôn giữ trọn ngọn lửa nhiệt huyết cống hiến cùng TLBM!`
      );
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err) {}

    onSend(staff.id, message, sender);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container wish-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <i className="fa-solid fa-cake-candles" style={{ color: '#f59e0b' }} />
            <h3>Soạn &amp; Gửi Thiệp Chúc Mừng Sinh Nhật</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Recipient summary card */}
            <div className="recipient-summary-box">
              <div className="avatar-big">{staff.avatar || '👤'}</div>
              <div>
                <h4 className="recip-name">{staff.name}</h4>
                <div className="recip-role">{staff.role} · {staff.deptName}</div>
                <div className="recip-email"><i className="fa-regular fa-envelope" /> {staff.email}</div>
              </div>
            </div>

            {/* Sender input */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Người / Đơn vị đại diện gửi:</label>
              <input
                type="text"
                className="form-input"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                required
              />
            </div>

            {/* Message textarea */}
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label">Lời chúc mừng riêng:</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {/* Checkbox */}
            <div className="form-checkbox-row" style={{ marginTop: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={attachTemplate}
                  onChange={(e) => setAttachTemplate(e.target.checked)}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-body)' }}>
                  Đính kèm khung thiệp điện tử TLBM sang trọng vào Email
                </span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="close-btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="primary-send-btn">
              <i className="fa-solid fa-paper-plane" /> Gửi thiệp ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
