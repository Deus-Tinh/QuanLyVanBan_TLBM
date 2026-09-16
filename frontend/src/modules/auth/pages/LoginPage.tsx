import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { AuthRole, UserSession } from '../types';

interface LoginPageProps {
  onNavigate?: (pageId: any) => void;
  onLoginSuccess?: (session: UserSession) => void;
}

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('Admin@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<AuthRole>('admin');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Trạng thái tương tác form
  const [isUsernameFocused, setIsUsernameFocused] = useState<boolean>(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [clickedChar, setClickedChar] = useState<string | null>(null);

  // Tọa độ con trỏ chuột
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const typingTimeoutRef = useRef<any>(null);

  // Refs của các cụm mắt
  const purpleEyesRef = useRef<HTMLDivElement>(null);
  const blackEyesRef = useRef<HTMLDivElement>(null);
  const orangeEyesRef = useRef<HTMLDivElement>(null);
  const yellowEyesRef = useRef<HTMLDivElement>(null);

  // Lắng nghe sự kiện di chuột toàn màn hình
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Kích hoạt nhịp gật đầu khi gõ phím
  const triggerTypingAnimation = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 300);
  };

  // Tính toán độ lệch con ngươi theo góc lượng giác Math.atan2
  const calculatePupilOffset = (eyeElem: HTMLElement | null, maxOffset: number = 6) => {
    if (!eyeElem) return { x: 0, y: 0 };
    if (isUsernameFocused) {
      // Khi đang focus ô tài khoản: Cả 4 bạn cùng nhìn chăm chú sang bên phải (về form)
      return { x: maxOffset * 0.95, y: 0 };
    }
    const rect = eyeElem.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;

    const deltaX = mousePos.x - eyeCenterX;
    const deltaY = mousePos.y - eyeCenterY;
    const angle = Math.atan2(deltaY, deltaX);
    const distance = Math.min(maxOffset, Math.hypot(deltaX, deltaY) / 28);

    return {
      x: Math.round(Math.cos(angle) * distance * 100) / 100,
      y: Math.round(Math.sin(angle) * distance * 100) / 100,
    };
  };

  const purpleOffset = calculatePupilOffset(purpleEyesRef.current, 5);
  const blackOffset = calculatePupilOffset(blackEyesRef.current, 7);
  const orangeOffset = calculatePupilOffset(orangeEyesRef.current, 6);
  const yellowOffset = calculatePupilOffset(yellowEyesRef.current, 5);

  const handleRoleSelect = (role: AuthRole) => {
    setSelectedRole(role);
    setError('');
    triggerTypingAnimation();
    if (role === 'admin') {
      setUsername('admin');
      setPassword('Admin@123');
    } else {
      setUsername('canbo');
      setPassword('Canbo@123');
    }
  };

  const handleCharClick = (charName: string) => {
    setClickedChar(charName);
    setTimeout(() => setClickedChar(null), 550);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      try {
        // [DEVOPS AUDIT NOTE]:
        // Thư viện bên thứ ba 'canvas-confetti' vẽ trực tiếp lên HTML5 Canvas,
        // API này bắt buộc nhận mảng chuỗi mã màu hex thuần, không thể đọc CSS/Tailwind classes.
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#ff6b35', '#6d28d9', '#facc15', '#3b82f6', '#10b981'],
        });
      } catch {
        // Fallback
      }

      const isRoleAdmin = username.toLowerCase().includes('admin');
      const session: UserSession = {
        username: username.trim(),
        fullName: isRoleAdmin ? 'Quản Trị Viên (Admin)' : 'Cán Bộ Chuyên Viên',
        role: isRoleAdmin ? 'admin' : 'staff',
        roleTitle: isRoleAdmin ? 'Quản trị viên tối cao' : 'Cán bộ xử lý văn bản',
      };

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(session);
        }
        if (onNavigate) {
          onNavigate('dashboard');
        }
        navigate('/dashboard');
      }, 700);
    }, 600);
  };

  const isEyesClosed = isPasswordFocused && !showPassword;
  const isShocked = isPasswordFocused && showPassword;

  return (
    <div className="interactive-login-page">
      <style>{`
        .interactive-login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          box-sizing: border-box;
          background: #090d16;
          background-image: 
            radial-gradient(at 10% 15%, rgba(99, 102, 241, 0.22) 0px, transparent 55%),
            radial-gradient(at 90% 85%, rgba(236, 72, 153, 0.16) 0px, transparent 55%),
            radial-gradient(at 50% 50%, rgba(245, 158, 11, 0.10) 0px, transparent 65%),
            linear-gradient(145deg, #07090e 0%, #0f172a 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          position: relative;
        }

        .interactive-card-container {
          display: flex;
          width: 100%;
          max-width: 920px;
          min-height: 570px;
          background: #ffffff;
          border-radius: 36px;
          overflow: hidden;
          box-shadow: 
            0 25px 60px -15px rgba(0, 0, 0, 0.55),
            0 0 0 1px rgba(255, 255, 255, 0.14);
          position: relative;
          z-index: 10;
          animation: cardAppear 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* NỬA TRÁI: SÂN KHẤU HOẠT HỌA */
        .character-stage-panel {
          flex: 1 1 46%;
          background: #eeedf2;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 36px 32px 0 32px;
          box-sizing: border-box;
          overflow: hidden;
          user-select: none;
        }

        /* TÁCH RIÊNG: Animation nhịp thở bập bênh (Idle Bobber) KHÔNG đè transform của body */
        .char-bobber {
          position: absolute;
          bottom: 0;
          pointer-events: auto;
        }

        .bobber-purple {
          left: 70px;
          animation: idleBobPurple 3.8s ease-in-out infinite;
        }
        .bobber-black {
          left: 148px;
          animation: idleBobBlack 4.2s ease-in-out infinite 0.4s;
        }
        .bobber-orange {
          left: 0;
          z-index: 3;
          animation: idleBobOrange 3.4s ease-in-out infinite 0.1s;
        }
        .bobber-yellow {
          left: 176px;
          z-index: 4;
          animation: idleBobYellow 3.9s ease-in-out infinite 0.6s;
        }

        @keyframes idleBobPurple {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes idleBobBlack {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes idleBobOrange {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes idleBobYellow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        /* Chớp mắt tự nhiên (Tách riêng trên eye-socket, KHÔNG đè translate của pupil) */
        @keyframes naturalBlink {
          0%, 93%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }

        @keyframes celebrateJump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-26px) scale(1.08); }
        }

        .character-cluster {
          position: absolute;
          bottom: 0;
          left: 28px;
          width: 330px;
          height: 240px;
          ${error ? 'animation: errorShake 0.45s ease-in-out;' : ''}
          ${isSuccess ? 'animation: celebrateJump 0.6s ease-in-out infinite;' : ''}
        }

        /* 1. NHÂN VẬT TÍM (Hình chữ nhật) */
        .char-purple {
          width: 86px;
          height: 145px;
          background: #6d28d9;
          border-radius: 8px 8px 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 24px;
          box-sizing: border-box;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;
        }
        .char-purple:hover {
          transform: translateY(-8px) scale(1.03);
          background: #7c3aed;
        }
        .char-purple.eyes-closed {
          transform: translateY(16px) scale(0.95);
        }
        .char-purple.shocked {
          transform: translateY(-10px) scale(1.05);
        }
        .char-purple.clicked {
          transform: translateY(-18px) rotate(-6deg);
        }
        .char-purple.typing {
          transform: translateY(-4px);
        }

        .purple-eyes {
          display: flex;
          gap: 14px;
        }

        .eye-socket-purple {
          width: 9px;
          height: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: naturalBlink 4.8s infinite;
          transition: height 0.2s ease, transform 0.2s ease;
        }
        .eye-socket-purple.closed {
          height: 2.5px !important;
          animation: none;
        }

        .pupil-purple {
          width: 8px;
          height: 8px;
          background: #111827;
          border-radius: 50%;
          transition: transform 0.05s ease-out;
        }

        .purple-mouth {
          width: 6px;
          height: 6px;
          background: #111827;
          border-radius: 50%;
          margin-top: 10px;
          transition: all 0.2s ease;
        }
        .purple-mouth.shocked {
          width: 7px;
          height: 11px;
          border-radius: 4px;
        }

        /* 2. NHÂN VẬT ĐEN (Trụ tròn to) */
        .char-black {
          width: 70px;
          height: 160px;
          background: #18181b;
          border-radius: 26px 26px 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 26px;
          box-sizing: border-box;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .char-black:hover {
          transform: translateY(-8px) scale(1.04);
        }
        .char-black.eyes-closed {
          transform: translateY(22px) scale(0.92);
        }
        .char-black.shocked {
          transform: translateY(-10px) scale(1.04);
        }
        .char-black.clicked {
          transform: translateY(-18px) scale(1.06);
        }
        .char-black.typing {
          transform: translateY(-5px);
        }

        .black-eyes {
          display: flex;
          gap: 7px;
        }

        .black-eye-sclera {
          width: 18px;
          height: 18px;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.25);
          animation: naturalBlink 5.2s infinite 0.5s;
          transition: transform 0.2s ease;
        }
        .black-eye-sclera.closed {
          transform: scaleY(0.1) !important;
          animation: none;
        }
        .black-eye-sclera.shocked {
          transform: scale(1.22) !important;
        }

        .black-pupil {
          width: 9px;
          height: 9px;
          background: #000000;
          border-radius: 50%;
          transition: transform 0.05s ease-out;
        }

        /* 3. NHÂN VẬT CAM (Bán nguyệt có má hồng) */
        .char-orange {
          width: 180px;
          height: 95px;
          background: #ff6b35;
          border-radius: 100px 100px 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: 16px;
          box-sizing: border-box;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;
        }
        .char-orange:hover {
          transform: translateY(-6px) scale(1.04);
          background: #ff7844;
        }
        .char-orange.eyes-closed {
          transform: translateY(8px);
        }
        .char-orange.shocked {
          transform: translateY(-8px) scale(1.04);
        }
        .char-orange.clicked {
          transform: translateY(-14px) scale(1.06);
        }
        .char-orange.typing {
          transform: translateY(-4px);
        }

        .orange-eyes-row {
          display: flex;
          align-items: center;
          gap: 36px;
          position: relative;
        }

        .orange-blush-left {
          position: absolute;
          left: -18px;
          top: 8px;
          width: 14px;
          height: 7px;
          background: #dc2626;
          border-radius: 50%;
          opacity: ${isEyesClosed ? 0.7 : 0.15};
          transition: opacity 0.3s ease;
        }

        .orange-blush-right {
          position: absolute;
          right: -18px;
          top: 8px;
          width: 14px;
          height: 7px;
          background: #dc2626;
          border-radius: 50%;
          opacity: ${isEyesClosed ? 0.7 : 0.15};
          transition: opacity 0.3s ease;
        }

        .eye-socket-orange {
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: naturalBlink 4.2s infinite 1s;
          transition: height 0.2s ease, transform 0.2s ease;
        }
        .eye-socket-orange.closed {
          height: 3px !important;
          transform: scaleX(1.4) !important;
          border-radius: 9999px;
          animation: none;
        }

        .pupil-orange {
          width: 11px;
          height: 11px;
          background: #111827;
          border-radius: 50%;
          transition: transform 0.05s ease-out;
        }

        .orange-mouth {
          width: 24px;
          height: 12px;
          border-bottom: 3.5px solid #111827;
          border-radius: 0 0 16px 16px;
          margin-top: 8px;
          transition: all 0.2s ease;
        }
        .orange-mouth.shocked {
          width: 12px;
          height: 12px;
          border-bottom: none;
          background: #111827;
          border-radius: 50%;
        }

        /* 4. NHÂN VẬT VÀNG (Mái vòm có đường miệng ngang) */
        .char-yellow {
          width: 80px;
          height: 110px;
          background: #facc15;
          border-radius: 42px 42px 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 24px;
          box-sizing: border-box;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;
        }
        .char-yellow:hover {
          transform: translateY(-6px) scale(1.04) rotate(1deg);
          background: #fcd34d;
        }
        .char-yellow.eyes-closed {
          transform: translateY(12px) rotate(-4deg);
        }
        .char-yellow.shocked {
          transform: translateY(-8px) scale(1.04);
        }
        .char-yellow.clicked {
          transform: translateY(-16px) rotate(7deg);
        }
        .char-yellow.typing {
          transform: translateY(-4px);
        }

        .yellow-eyes {
          display: flex;
          justify-content: flex-end;
          width: 100%;
          padding-right: 20px;
          box-sizing: border-box;
        }

        .eye-socket-yellow {
          width: 9px;
          height: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: naturalBlink 4.5s infinite 1.8s;
          transition: height 0.2s ease, transform 0.2s ease;
        }
        .eye-socket-yellow.closed {
          height: 2.5px !important;
          border-radius: 2px;
          animation: none;
        }

        .pupil-yellow {
          width: 8.5px;
          height: 8.5px;
          background: #111827;
          border-radius: 50%;
          transition: transform 0.05s ease-out;
        }

        .yellow-mouth-line {
          position: absolute;
          bottom: 32px;
          right: -8px;
          width: 28px;
          height: 3.5px;
          background: #111827;
          border-radius: 2px;
          transition: transform 0.2s ease;
        }
        .yellow-mouth-line.shocked {
          transform: rotate(-12deg) scaleX(1.2);
        }

        /* NỬA PHẢI: FORM ĐĂNG NHẬP */
        .login-form-panel {
          flex: 1 1 54%;
          background: #ffffff;
          padding: 44px 42px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
        }

        @keyframes starTwinkle {
          0%, 100% { transform: rotate(0deg) scale(1); filter: drop-shadow(0 0 1px rgba(0,0,0,0.1)); }
          50% { transform: rotate(20deg) scale(1.18); filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.4)); }
        }

        .form-star-icon {
          font-size: 1.55rem;
          color: #111827;
          margin-bottom: 8px;
          display: inline-block;
          width: fit-content;
          animation: starTwinkle 3s ease-in-out infinite;
          cursor: pointer;
        }

        .input-floating-group {
          margin-bottom: 16px;
          text-align: left;
        }

        .input-floating-group label {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 6px;
        }

        .input-field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .clean-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        .clean-input:focus {
          border-color: #18181b;
          box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.08);
          transform: translateY(-1px);
        }

        .black-pill-btn {
          width: 100%;
          padding: 13px;
          border-radius: 9999px;
          background: #18181b;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .black-pill-btn:hover {
          background: #000000;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.25);
        }

        .black-pill-btn:active {
          transform: translateY(0);
        }

        .quick-role-pill {
          flex: 1;
          padding: 9px 12px;
          border-radius: 9999px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .quick-role-pill.active {
          background: #eff6ff;
          border: 1.5px solid #2563eb;
          color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(37, 99, 235, 0.15);
        }

        .quick-role-pill.inactive {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .quick-role-pill.inactive:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        /* RESPONSIVE DESIGN TOÀN DIỆN */
        
        /* 1. Màn hình Tablet & Laptop nhỏ (769px - 1024px) */
        @media (max-width: 1024px) {
          .interactive-card-container {
            max-width: 860px;
            min-height: 520px;
          }
          .character-stage-panel {
            padding: 30px 24px 0 24px;
          }
          .character-cluster {
            transform: scale(0.88);
            transform-origin: bottom left;
            left: 18px;
          }
          .login-form-panel {
            padding: 36px 30px;
          }
        }

        /* 2. Màn hình Tablet dọc & Mobile lớn (481px - 768px) */
        @media (max-width: 768px) {
          .interactive-login-page {
            padding: 16px 12px;
            align-items: flex-start;
          }
          .interactive-card-container {
            flex-direction: column;
            border-radius: 28px;
            max-width: 520px;
            margin: 44px auto 20px auto;
          }
          .character-stage-panel {
            min-height: 200px;
            padding: 20px 20px 0 20px;
          }
          .character-cluster {
            left: 50%;
            transform: translateX(-50%) scale(0.78);
            transform-origin: bottom center;
          }
          .login-form-panel {
            padding: 28px 24px;
          }
          .back-btn-dashboard {
            top: 10px !important;
            left: 12px !important;
            padding: 6px 14px !important;
            font-size: 0.76rem !important;
          }
        }

        /* 3. Màn hình Điện thoại di động chuẩn (<= 480px) */
        @media (max-width: 480px) {
          .interactive-login-page {
            padding: 10px 8px;
          }
          .interactive-card-container {
            border-radius: 24px;
            margin-top: 48px;
          }
          .character-stage-panel {
            min-height: 175px;
            padding: 16px 14px 0 14px;
          }
          .character-hint {
            display: none !important;
          }
          .character-cluster {
            left: 50%;
            transform: translateX(-50%) scale(0.68);
            transform-origin: bottom center;
          }
          .login-form-panel {
            padding: 22px 16px;
          }
          .form-star-icon {
            font-size: 1.3rem;
            margin-bottom: 4px;
          }
          .login-form-panel h2 {
            font-size: 1.4rem !important;
          }
          .login-form-panel p {
            font-size: 0.78rem !important;
            margin-bottom: 16px !important;
          }
          .quick-role-wrapper {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .quick-role-pill {
            width: 100% !important;
            padding: 8px 12px !important;
            font-size: 0.75rem !important;
          }
        }

        /* 4. Màn hình Điện thoại siêu nhỏ (<= 360px) */
        @media (max-width: 360px) {
          .character-cluster {
            transform: translateX(-50%) scale(0.58);
          }
          .character-stage-panel {
            min-height: 155px;
          }
          .clean-input {
            padding: 9px 10px;
            font-size: 0.82rem;
          }
          .black-pill-btn {
            padding: 11px;
            font-size: 0.84rem;
          }
        }

      `}</style>

      {/* Nút quay lại Dashboard */}
      {onNavigate && (
        <button
          type="button"
          className="back-btn-dashboard"
          onClick={() => onNavigate('dashboard')}

          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '8px 18px',
            borderRadius: '9999px',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#f8fafc',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 20,
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <i className="fa-solid fa-arrow-left" />
          <span>Vào Bàn Làm Việc (Dashboard)</span>
        </button>
      )}

      {/* THẺ ĐĂNG NHẬP CHÍNH */}
      <div className="interactive-card-container">
        {/* ============================================================ */}
        {/* NỬA TRÁI: SÂN KHẤU 4 NHÂN VẬT HOẠT HỌA CÓ ANIMATION PHONG PHÚ */}
        {/* ============================================================ */}
        <div className="character-stage-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 5 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.35)',
              }}
            >
              <i className="fa-solid fa-folder-open" />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                QLVB &amp; TL
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                HỆ THỐNG ĐIỀU HÀNH
              </div>
            </div>
          </div>

          {/* Badge phân công Nhóm 1 */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginTop: '10px',
              width: 'fit-content',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              zIndex: 5,
            }}
          >
            <i className="fa-solid fa-shield-halved" />
            <span>NHÓM 1 · NGUYỄN VĂN HIẾU</span>
          </div>

          <div className="character-hint" style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '6px', zIndex: 5 }}>
            <i className="fa-regular fa-hand-pointer" style={{ marginRight: '4px' }} />
            <span>Thử click vào các bạn nhân vật để chơi cùng!</span>
          </div>


          {/* CỤM 4 NHÂN VẬT HOẠT HỌA */}
          <div className="character-cluster">
            {/* 1. NHÂN VẬT TÍM (Hình chữ nhật) */}
            <div className="char-bobber bobber-purple">
              <div
                className={`char-purple ${isEyesClosed ? 'eyes-closed' : ''} ${isShocked ? 'shocked' : ''} ${clickedChar === 'purple' ? 'clicked' : ''} ${isTyping ? 'typing' : ''}`}
                onClick={() => handleCharClick('purple')}
                title="Click để tớ nhảy!"
              >
                <div className="purple-eyes" ref={purpleEyesRef}>
                  <div className={`eye-socket-purple ${isEyesClosed ? 'closed' : ''}`}>
                    <div
                      className="pupil-purple"
                      style={{ transform: `translate3d(${purpleOffset.x}px, ${purpleOffset.y}px, 0)` }}
                    />
                  </div>
                  <div className={`eye-socket-purple ${isEyesClosed ? 'closed' : ''}`}>
                    <div
                      className="pupil-purple"
                      style={{ transform: `translate3d(${purpleOffset.x}px, ${purpleOffset.y}px, 0)` }}
                    />
                  </div>
                </div>
                <div className={`purple-mouth ${isShocked ? 'shocked' : ''}`} />
              </div>
            </div>

            {/* 2. NHÂN VẬT ĐEN (Trụ tròn to) */}
            <div className="char-bobber bobber-black">
              <div
                className={`char-black ${isEyesClosed ? 'eyes-closed' : ''} ${isShocked ? 'shocked' : ''} ${clickedChar === 'black' ? 'clicked' : ''} ${isTyping ? 'typing' : ''}`}
                onClick={() => handleCharClick('black')}
                title="Click để tớ nhún nhảy!"
              >
                <div className="black-eyes" ref={blackEyesRef}>
                  <div className={`black-eye-sclera ${isEyesClosed ? 'closed' : ''} ${isShocked ? 'shocked' : ''}`}>
                    <div
                      className="black-pupil"
                      style={{ transform: `translate3d(${blackOffset.x}px, ${blackOffset.y}px, 0)` }}
                    />
                  </div>
                  <div className={`black-eye-sclera ${isEyesClosed ? 'closed' : ''} ${isShocked ? 'shocked' : ''}`}>
                    <div
                      className="black-pupil"
                      style={{ transform: `translate3d(${blackOffset.x}px, ${blackOffset.y}px, 0)` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. NHÂN VẬT CAM (Bán nguyệt có má hồng & miệng cười) */}
            <div className="char-bobber bobber-orange">
              <div
                className={`char-orange ${isEyesClosed ? 'eyes-closed' : ''} ${isShocked ? 'shocked' : ''} ${clickedChar === 'orange' ? 'clicked' : ''} ${isTyping ? 'typing' : ''}`}
                onClick={() => handleCharClick('orange')}
                title="Click để tớ cười to hơn!"
              >
                <div className="orange-eyes-row" ref={orangeEyesRef}>
                  <div className="orange-blush-left" />
                  <div className={`eye-socket-orange ${isEyesClosed ? 'closed' : ''}`}>
                    <div
                      className="pupil-orange"
                      style={{ transform: `translate3d(${orangeOffset.x}px, ${orangeOffset.y}px, 0)` }}
                    />
                  </div>
                  <div className={`eye-socket-orange ${isEyesClosed ? 'closed' : ''}`}>
                    <div
                      className="pupil-orange"
                      style={{ transform: `translate3d(${orangeOffset.x}px, ${orangeOffset.y}px, 0)` }}
                    />
                  </div>
                  <div className="orange-blush-right" />
                </div>
                <div className={`orange-mouth ${isShocked ? 'shocked' : ''}`} />
              </div>
            </div>

            {/* 4. NHÂN VẬT VÀNG (Mái vòm có đường miệng ngang) */}
            <div className="char-bobber bobber-yellow">
              <div
                className={`char-yellow ${isEyesClosed ? 'eyes-closed' : ''} ${isShocked ? 'shocked' : ''} ${clickedChar === 'yellow' ? 'clicked' : ''} ${isTyping ? 'typing' : ''}`}
                onClick={() => handleCharClick('yellow')}
                title="Click để tớ lắc lư!"
              >
                <div className="yellow-eyes" ref={yellowEyesRef}>
                  <div className={`eye-socket-yellow ${isEyesClosed ? 'closed' : ''}`}>
                    <div
                      className="pupil-yellow"
                      style={{ transform: `translate3d(${yellowOffset.x}px, ${yellowOffset.y}px, 0)` }}
                    />
                  </div>
                </div>
                <div className={`yellow-mouth-line ${isShocked ? 'shocked' : ''}`} />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* NỬA PHẢI: FORM ĐĂNG NHẬP SANG TRỌNG                          */}
        {/* ============================================================ */}
        <div className="login-form-panel">
          <div className="form-star-icon" title="Hệ thống xác thực SSO">✦</div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '0 0 16px 0' }}>
            Vui lòng nhập thông tin xác thực để vào hệ thống tác nghiệp.
          </p>

          {/* Banner minh bạch: Chế độ Mock Auth Prototype theo yêu cầu Code Review */}
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.76rem',
              color: '#92400e',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#d97706' }} />
              <span>CHẾ ĐỘ MOCK AUTH (BẢN MẪU PROTOTYPE - NHÓM 1)</span>
            </div>
            <div style={{ color: '#78350f', fontSize: '0.73rem', lineHeight: '1.4' }}>
              Giao diện giả lập kiểm thử App Shell. Chờ tích hợp API JWT từ Backend Django (Nhóm 1). Bạn có thể chọn nhanh nút Demo bên dưới hoặc nhập tài khoản bất kỳ.
            </div>
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '9px 14px',
                fontSize: '0.78rem',
                color: 'var(--color-danger)',
                marginBottom: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'cardAppear 0.3s ease',
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-floating-group">
              <label>Tài khoản / Mã nhân viên</label>
              <div className="input-field-wrapper">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    triggerTypingAnimation();
                  }}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                  placeholder="admin hoặc mã CBNV..."
                  required
                  className="clean-input"
                />
              </div>
            </div>

            <div className="input-floating-group" style={{ marginBottom: '14px' }}>
              <label>Mật khẩu xác thực</label>
              <div className="input-field-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    triggerTypingAnimation();
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="••••••••"
                  required
                  className="clean-input"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu (Nhân vật sẽ ngạc nhiên!)'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: showPassword ? 'var(--color-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    padding: '4px',
                    transition: 'color 0.2s',
                  }}
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ accentColor: '#18181b', cursor: 'pointer' }}
                />
                <span>Ghi nhớ phiên đăng nhập (30 ngày)</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Vui lòng liên hệ Quản trị viên ITC hoặc GVHD Trần Phương Duy để cấp lại mật khẩu!');
                }}
                style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none' }}
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="black-pill-btn"
            >
              <span>{isSuccess ? '✓ Đăng nhập thành công!' : isLoading ? 'Đang xác thực...' : 'Log in'}</span>
              <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.8rem' }} />
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '20px 0 16px 0',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            <span style={{ padding: '0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              chọn nhanh tài khoản mẫu
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          </div>

          {/* 2 nút chọn nhanh quyền Quản trị & Cán bộ */}
          <div className="quick-role-wrapper" style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className={`quick-role-pill ${selectedRole === 'admin' ? 'active' : 'inactive'}`}
              onClick={() => handleRoleSelect('admin')}
            >
              <i className="fa-solid fa-crown" style={{ color: selectedRole === 'admin' ? 'var(--color-primary)' : 'var(--text-muted)' }} />
              <span>Quản trị viên (Admin)</span>
            </button>
            <button
              type="button"
              className={`quick-role-pill ${selectedRole === 'staff' ? 'active' : 'inactive'}`}
              onClick={() => handleRoleSelect('staff')}
            >
              <i className="fa-solid fa-user-tie" style={{ color: selectedRole === 'staff' ? 'var(--color-primary)' : 'var(--text-muted)' }} />
              <span>Cán bộ chuyên viên</span>
            </button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-arrow-left" />
              <span>Quay về Dashboard (Không cần đăng nhập)</span>
            </button>
          </div>

          <div style={{ marginTop: '18px', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            <span>Đồ án ITC Django · GVHD: NCS.ThS. Trần Phương Duy · Nhóm 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
