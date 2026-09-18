import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ActivePageId } from '../../../shared/types/navigation';
import { UserSession } from '../types';
import { Logo } from '../../../shared/components/common/Logo';
import '../styles/login-characters.css';

interface LoginPageProps {
  onNavigate?: (pageId: ActivePageId) => void;
  onLoginSuccess?: (session: UserSession) => void;
}

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [pupilOffsets, setPupilOffsets] = useState({
    purple: { x: 0, y: 0 },
    black: { x: 0, y: 0 },
    orange: { x: 0, y: 0 },
    yellow: { x: 0, y: 0 },
  });

  useEffect(() => {
    const calculateOffset = (eyeElem: HTMLElement | null, maxOffset: number = 6) => {
      if (!eyeElem) return { x: 0, y: 0 };
      if (isUsernameFocused) {
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

    setPupilOffsets({
      purple: calculateOffset(purpleEyesRef.current, 5),
      black: calculateOffset(blackEyesRef.current, 7),
      orange: calculateOffset(orangeEyesRef.current, 6),
      yellow: calculateOffset(yellowEyesRef.current, 5),
    });
  }, [mousePos, isUsernameFocused]);

  const purpleOffset = pupilOffsets.purple;
  const blackOffset = pupilOffsets.black;
  const orangeOffset = pupilOffsets.orange;
  const yellowOffset = pupilOffsets.yellow;


  const handleCharClick = (charName: string) => {
    setClickedChar(charName);
    setTimeout(() => setClickedChar(null), 550);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      let loginData = data;

      // Hỗ trợ môi trường demo / hosting tĩnh (Netlify trả về 404 do không có Django backend)
      const u = username.trim();
      const p = password.trim();
      const isSeedAdmin = u === 'admin' && p === 'Admin@123';
      const isSeedCanbo = u === 'canbo' && p === 'Canbo@123';

      if (!response.ok || (data.success === false && !data.token)) {
        if (response.status === 404 && (isSeedAdmin || isSeedCanbo)) {
          const isAdm = isSeedAdmin;
          loginData = {
            success: true,
            token: 'demo-jwt-' + u + '-token',
            user: {
              username: u,
              fullName: isAdm ? 'Quản Trị Viên Hệ Thống' : 'Cán Bộ Xử Lý Văn Bản',
              role: isAdm ? 'admin' : 'staff',
              roleTitle: isAdm ? 'Quản trị viên tối cao' : 'Chuyên viên văn thư',
            },
          };
        } else {
          setIsLoading(false);
          const errorMsg =
            data.error || data.detail || data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!';
          setError(errorMsg);
          return;
        }
      }

      setIsLoading(false);
      setIsSuccess(true);

      try {
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback
      }

      const rawUser = loginData.user || {};
      const token = loginData.token || loginData.access || '';
      const isRoleAdmin =
        rawUser.role === 'admin' || username.toLowerCase().includes('admin');
      const session: UserSession = {
        username: rawUser.username || username.trim(),
        fullName:
          rawUser.fullName ||
          rawUser.full_name ||
          (isRoleAdmin ? 'Quản Trị Viên (Admin)' : 'Cán Bộ Chuyên Viên'),
        role: isRoleAdmin ? 'admin' : 'staff',
        roleTitle:
          rawUser.roleTitle ||
          rawUser.position ||
          (isRoleAdmin ? 'Quản trị viên tối cao' : 'Cán bộ xử lý văn bản'),
        token: token,
      };

      try {
        if (token) {
          localStorage.setItem('tlbm_token', token);
        }
        localStorage.setItem('tlbm_session', JSON.stringify(session));
        window.dispatchEvent(new Event('tlbm_auth_changed'));
      } catch {
        // ignore
      }

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(session);
        }
        if (onNavigate) {
          onNavigate('dashboard');
        }
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch {
      const u = username.trim();
      const p = password.trim();
      const isSeedAdmin = u === 'admin' && p === 'Admin@123';
      const isSeedCanbo = u === 'canbo' && p === 'Canbo@123';

      if (isSeedAdmin || isSeedCanbo) {
        const isAdm = isSeedAdmin;
        const session: UserSession = {
          username: u,
          fullName: isAdm ? 'Quản Trị Viên Hệ Thống' : 'Cán Bộ Xử Lý Văn Bản',
          role: isAdm ? 'admin' : 'staff',
          roleTitle: isAdm ? 'Quản trị viên tối cao' : 'Chuyên viên văn thư',
          token: 'demo-jwt-' + u + '-token',
        };
        setIsLoading(false);
        setIsSuccess(true);
        localStorage.setItem('tlbm_token', session.token);
        localStorage.setItem('tlbm_session', JSON.stringify(session));
        window.dispatchEvent(new Event('tlbm_auth_changed'));
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(session);
          }
          if (onNavigate) {
            onNavigate('dashboard');
          }
          navigate('/dashboard', { replace: true });
        }, 700);
        return;
      }

      setIsLoading(false);
      setError('Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại dịch vụ Backend!');
    }
  };

  const isEyesClosed = isPasswordFocused && !showPassword;
  const isShocked = isPasswordFocused && showPassword;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 md:p-6 bg-app bg-auth-backdrop relative overflow-y-auto font-sans">
      {/* Nút quay lại Dashboard nếu có onNavigate */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="absolute top-4 left-4 bg-surface-elevated/80 backdrop-blur-md border border-border-subtle px-4 py-2 rounded-full text-xs font-semibold text-main hover:bg-surface transition-fast flex items-center gap-2 z-20 shadow-sm"
        >
          <i className="fa-solid fa-arrow-left" />
          <span>Vào Bàn Làm Việc (Dashboard)</span>
        </button>
      )}

      {/* THẺ ĐĂNG NHẬP CHÍNH */}
      <div className="w-full max-w-4xl bg-surface rounded-xl overflow-hidden shadow-lg flex flex-col md:flex-row relative z-10 my-auto border border-border-subtle animate-fade-in">
        {/* ============================================================ */}
        {/* NỬA TRÁI: SÂN KHẤU 4 NHÂN VẬT HOẠT HỌA CÓ ANIMATION PHONG PHÚ */}
        {/* ============================================================ */}
        <div className="w-full md:w-[45%] bg-surface-elevated relative flex flex-col justify-between p-5 md:p-6 select-none overflow-hidden min-h-[280px] md:min-h-[380px] border-b md:border-b-0 md:border-r border-border-subtle">
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-10 h-10 rounded-lg bg-surface border border-subtle flex items-center justify-center shadow-sm p-1.5 shrink-0">
              <img src="/favicon.png" alt="Bảo Long Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-main leading-tight">
                QLVB &amp; TL
              </div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider">
                HỆ THỐNG ĐIỀU HÀNH
              </div>
            </div>
          </div>


          {/* CỤM 4 NHÂN VẬT HOẠT HỌA */}
          <div className={`character-cluster scale-[0.78] sm:scale-[0.84] md:scale-[0.88] origin-bottom-left ${error ? 'is-error' : ''} ${isSuccess ? 'is-success' : ''}`}>
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
                  <div className="orange-blush-left" style={{ opacity: isEyesClosed ? 0.7 : 0.15 }} />
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
                  <div className="orange-blush-right" style={{ opacity: isEyesClosed ? 0.7 : 0.15 }} />
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
        <div className="w-full md:w-[55%] bg-surface p-5 md:p-8 flex flex-col justify-center">
          <div className="mb-3" title="Bảo Long Insurance">
            <Logo size="lg" />
          </div>

          <h2 className="text-2xl font-extrabold text-main tracking-tight mb-0.5">
            Welcome back
          </h2>
          <p className="text-xs text-muted mb-4">
            Vui lòng nhập thông tin xác thực để vào hệ thống tác nghiệp.
          </p>

          {error && (
            <div className="bg-danger-subtle border border-danger-border rounded-md p-2.5 text-xs text-danger mb-3 flex items-center gap-2 animate-fade-in">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="text-left">
              <label className="block text-xs font-bold text-secondary mb-1">
                Tài khoản / Mã nhân viên
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    triggerTypingAnimation();
                  }}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                  placeholder="Nhập tên đăng nhập hoặc mã cán bộ..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-md border border-border-subtle bg-surface text-main text-sm outline-none transition-fast focus:border-primary focus:ring-2 focus:ring-primary-glow placeholder:text-muted"
                />
              </div>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold text-secondary mb-1">
                Mật khẩu xác thực
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    triggerTypingAnimation();
                  }}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="Nhập mật khẩu..."
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-md border border-border-subtle bg-surface text-main text-sm outline-none transition-fast focus:border-primary focus:ring-2 focus:ring-primary-glow placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 text-muted hover:text-primary transition-fast text-sm p-1"
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-secondary pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-primary cursor-pointer rounded-xs"
                />
                <span>Ghi nhớ phiên (30 ngày)</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Vui lòng liên hệ Quản trị viên hệ thống để cấp lại mật khẩu!');
                }}
                className="font-semibold text-main hover:text-primary transition-fast hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-2.5 px-4 rounded-md bg-primary hover:bg-primary-hover active:translate-y-0 text-white text-sm font-bold shadow-md hover:shadow-glow transition-normal flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
            >
              {isSuccess && <i className="fa-solid fa-check text-xs" />}
              <span>{isSuccess ? 'Đăng nhập thành công!' : isLoading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              {!isSuccess && <i className="fa-solid fa-arrow-right text-xs" />}
            </button>
          </form>

          <div className="mt-5 text-center text-[11px] text-muted">
            <span>Đồ án ITC Django · GVHD: NCS.ThS. Trần Phương Duy · Nhóm 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
