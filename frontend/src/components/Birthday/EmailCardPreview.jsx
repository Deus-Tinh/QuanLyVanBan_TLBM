import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function EmailCardPreview({ staff, onClose }) {
  if (!staff) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log('Confetti effect triggered');
    }
  };

  useEffect(() => {
    triggerConfetti();
  }, [staff]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container email-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <i className="fa-solid fa-envelope-open-text" style={{ color: '#2563eb' }} />
            <h3>Bản xem trước Thiệp Chúc Mừng Sinh Nhật (HTML Email)</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body preview-body-scroll">
          {/* Email Template Card */}
          <div className="email-template-frame">
            {/* Header branding */}
            <div className="email-tpl-header">
              <div className="corp-logo">TLBM CORPORATION</div>
              <div className="card-motto">Đồng hành &amp; Phát triển bền vững</div>
            </div>

            {/* Cake & Greeting Graphic */}
            <div className="email-tpl-banner">
              <div className="cake-icon-3d">🎂</div>
              <h2 className="happy-title">HAPPY BIRTHDAY!</h2>
              <div className="happy-subtitle">CHÚC MỪNG SINH NHẬT CÁN BỘ NHÂN VIÊN</div>
            </div>

            {/* Recipient Details */}
            <div className="email-tpl-recipient">
              <p className="greeting-lead">Thân gửi Anh/Chị:</p>
              <h3 className="recipient-fullname">{staff.name}</h3>
              <p className="recipient-title">
                {staff.role} · <strong>{staff.deptName}</strong>
              </p>
            </div>

            {/* Wish Message */}
            <div className="email-tpl-message">
              <p>
                {staff.lastWish ||
                  `Nhân dịp sinh nhật của Anh/Chị (${String(staff.bdayDay).padStart(2, '0')}/${String(staff.bdayMonth).padStart(2, '0')}), Ban Tổng Giám đốc cùng toàn thể CBNV TLBM xin gửi tới Anh/Chị lời chúc mừng chân thành và nồng nhiệt nhất! Chúc Anh/Chị luôn tràn đầy năng lượng, dồi dào sức khỏe, hạnh phúc và gặt hái nhiều thành công rực rỡ trên con đường sự nghiệp cùng đại gia đình TLBM!`}
              </p>
            </div>

            {/* Corporate Signature */}
            <div className="email-tpl-signature">
              <div className="sig-title">Thay mặt Ban Lãnh Đạo &amp; Công đoàn</div>
              <div className="sig-company">TỔNG CÔNG TY CỔ PHẦN BẢO LONG - TLBM</div>
              <div className="sig-timestamp">
                Thời gian phát tự động: 08:00:00 {String(staff.bdayDay).padStart(2, '0')}/{String(staff.bdayMonth).padStart(2, '0')}/2026
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="confetti-btn"
            onClick={triggerConfetti}
          >
            🎉 Bắn pháo hoa chúc mừng
          </button>
          <button type="button" className="close-btn-secondary" onClick={onClose}>
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
}
