import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { UserSession } from '../types';
import '../styles/login-characters.css';

interface LoginPageProps {
  onNavigate?: (pageId: any) => void;
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

      try {
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
    }, 600);
  };

  const isEyesClosed = isPasswordFocused && !showPassword;
  const isShocked = isPasswordFocused && showPassword;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#090d16] bg-[radial-gradient(at_10%_15%,rgba(99,102,241,0.22)_0px,transparent_55%),radial-gradient(at_90%_85%,rgba(236,72,153,0.16)_0px,transparent_55%),radial-gradient(at_50%_50%,rgba(245,158,11,0.10)_0px,transparent_65%),linear-gradient(145deg,#07090e_0%,#0f172a_100%)] relative overflow-y-auto font-sans">
      {/* Nút quay lại Dashboard nếu có onNavigate */}
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-xs font-semibold text-slate-100 hover:bg-white/20 transition-all flex items-center gap-2 z-20"
        >
          <i className="fa-solid fa-arrow-left" />
          <span>Vào Bàn Làm Việc (Dashboard)</span>
        </button>
      )}

      {/* THẺ ĐĂNG NHẬP CHÍNH */}
      <div className="w-full max-w-[880px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10 my-auto border border-white/10 animate-fade-in">
        {/* ============================================================ */}
        {/* NỬA TRÁI: SÂN KHẤU 4 NHÂN VẬT HOẠT HỌA CÓ ANIMATION PHONG PHÚ */}
        {/* ============================================================ */}
        <div className="w-full md:w-[45%] bg-[#eeedf2] relative flex flex-col justify-between p-5 md:p-6 select-none overflow-hidden min-h-[280px] md:min-h-[380px]">
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-white flex items-center justify-center text-lg shadow-md shadow-blue-700/30">
              <i className="fa-solid fa-folder-open" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 leading-tight">
                QLVB &amp; TL
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                HỆ THỐNG ĐIỀU HÀNH
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 mt-2 z-10 hidden sm:flex items-center gap-1.5">
            <i className="fa-regular fa-hand-pointer" />
            <span>Thử click vào các bạn nhân vật để chơi cùng!</span>
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
        <div className="w-full md:w-[55%] bg-white p-5 md:p-8 flex flex-col justify-center">
          <div className="text-xl text-slate-900 mb-1 inline-block cursor-pointer animate-pulse" title="Hệ thống xác thực SSO">
            ✦
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">
            Welcome back
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Vui lòng nhập thông tin xác thực để vào hệ thống tác nghiệp.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-danger mb-3 flex items-center gap-2 animate-fade-in">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 text-slate-400 hover:text-primary transition-colors text-sm p-1"
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-slate-900 cursor-pointer rounded"
                />
                <span>Ghi nhớ phiên (30 ngày)</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Vui lòng liên hệ Quản trị viên hệ thống để cấp lại mật khẩu!');
                }}
                className="font-semibold text-slate-900 hover:underline"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black active:translate-y-0 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
            >
              <span>{isSuccess ? '✓ Đăng nhập thành công!' : isLoading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </form>

          <div className="mt-5 text-center text-[11px] text-slate-400">
            <span>Đồ án ITC Django · GVHD: NCS.ThS. Trần Phương Duy · Nhóm 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
