import React, { useState, useEffect, useRef } from 'react';
import { ActivePageId } from '../../types/navigation';

interface FloatingAIBoxProps {
  onNavigate?: (pageId: ActivePageId) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  quickReplies?: string[];
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-init',
    sender: 'ai',
    text: `👋 **Xin chào Châu Tuấn Kiệt (PM Nhóm 1)!**\nTôi là **Trợ Lý AI TLBM (GPT-4o)** — trợ lý tra cứu quy trình và hỗ trợ nghiệp vụ văn bản.\n\nBạn có thể kéo phím AI này đặt tự do ở bất kỳ đâu trên màn hình. Hãy chọn gợi ý bên dưới hoặc gõ câu hỏi để tôi hỗ trợ bạn ngay!`,
    time: 'Vừa xong',
    quickReplies: [
      '📋 Quy trình tiếp nhận văn bản đến?',
      '🔒 Quy chế xử lý văn bản Tuyệt Mật?',
      '✍️ Sơ đồ trình ký số điện tử Module 5?',
      '👥 Phân quyền vai trò CBNV Nhóm 7?',
    ],
  },
];

export default function FloatingAIBox({ onNavigate }: FloatingAIBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  // Vị trí tọa độ tự do của nút Orb (X, Y)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('tlbm_ai_box_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Mặc định: Góc phải dưới, cách mép phải 24px, cách mép dưới 160px
    return {
      x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 80) : 1200,
      y: typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 170) : 600,
    };
  });

  // Vị trí cửa sổ khi người dùng chủ động nắm Header kéo đi
  const [windowDragOffset, setWindowDragOffset] = useState<{ x: number; y: number } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draggingTarget, setDraggingTarget] = useState<'orb' | 'window'>('orb');

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
    hasMoved: false,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Kích thước ước tính của cửa sổ chat
  const winWidth = typeof window !== 'undefined' ? Math.min(390, window.innerWidth - 24) : 390;
  const winHeight = isMinimized
    ? 56
    : typeof window !== 'undefined'
    ? Math.min(530, window.innerHeight - 30)
    : 530;

  // TÍNH TOÁN VỊ TRÍ CỬA SỔ CHAT TỰ ĐỘNG THÔNG MINH
  // Đảm bảo 100% cửa sổ luôn luôn nằm trọn vẹn trong màn hình, không bao giờ bị tràn mép hay khuất góc:
  // - Nếu nút nằm ở góc dưới: XỔ NGƯỢC LÊN TRÊN!
  // - Nếu nút nằm ở mép phải: XỔ SANG TRÁI!
  const getComputedWindowPosition = () => {
    if (typeof window === 'undefined') {
      return { x: position.x, y: position.y, origin: 'bottom right' };
    }

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Nếu người dùng đã chủ động nắm Header kéo cửa sổ, ưu tiên vị trí kéo đó
    if (windowDragOffset) {
      const clampedX = Math.max(12, Math.min(windowDragOffset.x, screenW - winWidth - 12));
      const clampedY = Math.max(12, Math.min(windowDragOffset.y, screenH - winHeight - 12));
      return { x: clampedX, y: clampedY, origin: 'center' };
    }

    // 1. Phân tích hướng ngang:
    // Nếu nút nằm ở nửa phải màn hình (hoặc mở sang phải sẽ vượt quá mép màn hình): Căn mép phải của cửa sổ với nút
    const isRightSide = position.x + winWidth > screenW - 16 || position.x > screenW / 2;
    let targetX = isRightSide
      ? position.x + 58 - winWidth // Lấy mép phải làm mốc
      : position.x;               // Lấy mép trái làm mốc

    // 2. Phân tích hướng dọc (THEO ĐÚNG YÊU CẦU CỦA USER: "nằm dưới góc thì phải xổ ngược lên trên"):
    // Nếu nút nằm ở nửa dưới màn hình (hoặc mở xuống dưới sẽ tràn mép đáy): XỔ NGƯỢC LÊN TRÊN!
    const isBottomSide = position.y + winHeight > screenH - 16 || position.y > screenH / 2;
    let targetY = isBottomSide
      ? position.y + 58 - winHeight // Mép đáy của cửa sổ trùng đáy nút Orb -> vươn ngược lên trên
      : position.y;                // Xổ xuôi xuống dưới

    // 3. Khóa an toàn (Clamping) cách mép màn hình tối thiểu 12px
    const clampedX = Math.max(12, Math.min(targetX, screenW - winWidth - 12));
    const clampedY = Math.max(12, Math.min(targetY, screenH - winHeight - 12));

    const originV = isBottomSide ? 'bottom' : 'top';
    const originH = isRightSide ? 'right' : 'left';

    return {
      x: clampedX,
      y: clampedY,
      origin: `${originV} ${originH}`,
    };
  };

  const computedWin = getComputedWindowPosition();

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Đảm bảo tọa độ luôn nằm trong khung nhìn khi xoay hoặc resize màn hình
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(16, window.innerWidth - 70);
        const maxY = Math.max(16, window.innerHeight - 70);
        const clampedX = Math.min(Math.max(16, prev.x), maxX);
        const clampedY = Math.min(Math.max(16, prev.y), maxY);
        return { x: clampedX, y: clampedY };
      });
      setWindowDragOffset(null); // Reset vị trí kéo tự do khi resize để tự căn chỉnh lại
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bắt đầu kéo
  const startDragging = (target: 'orb' | 'window', clientX: number, clientY: number) => {
    setIsDragging(true);
    setDraggingTarget(target);

    const initialX = target === 'orb' ? position.x : computedWin.x;
    const initialY = target === 'orb' ? position.y : computedWin.y;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialPosX: initialX,
      initialPosY: initialY,
      hasMoved: false,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (Math.hypot(dx, dy) > 5) {
        dragRef.current.hasMoved = true;
      }

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      if (draggingTarget === 'orb') {
        const maxX = Math.max(10, screenW - 70);
        const maxY = Math.max(10, screenH - 70);
        const nextX = Math.min(Math.max(10, dragRef.current.initialPosX + dx), maxX);
        const nextY = Math.min(Math.max(10, dragRef.current.initialPosY + dy), maxY);
        setPosition({ x: nextX, y: nextY });
      } else {
        // Kéo cửa sổ Chatbox
        const maxX = Math.max(10, screenW - winWidth - 10);
        const maxY = Math.max(10, screenH - winHeight - 10);
        const nextX = Math.min(Math.max(10, dragRef.current.initialPosX + dx), maxX);
        const nextY = Math.min(Math.max(10, dragRef.current.initialPosY + dy), maxY);
        setWindowDragOffset({ x: nextX, y: nextY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;

      if (Math.hypot(dx, dy) > 5) {
        dragRef.current.hasMoved = true;
      }

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      if (draggingTarget === 'orb') {
        const maxX = Math.max(10, screenW - 70);
        const maxY = Math.max(10, screenH - 70);
        const nextX = Math.min(Math.max(10, dragRef.current.initialPosX + dx), maxX);
        const nextY = Math.min(Math.max(10, dragRef.current.initialPosY + dy), maxY);
        setPosition({ x: nextX, y: nextY });
      } else {
        // Kéo cửa sổ Chatbox
        const maxX = Math.max(10, screenW - winWidth - 10);
        const maxY = Math.max(10, screenH - winHeight - 10);
        const nextX = Math.min(Math.max(10, dragRef.current.initialPosX + dx), maxX);
        const nextY = Math.min(Math.max(10, dragRef.current.initialPosY + dy), maxY);
        setWindowDragOffset({ x: nextX, y: nextY });
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('tlbm_ai_box_pos', JSON.stringify(position));
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, draggingTarget, position, winWidth, winHeight]);

  // Trả lời AI thông minh
  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('văn bản đến') || q.includes('tiếp nhận') || q.includes('đến')) {
      return `📋 **Quy Trình Tiếp Nhận Văn Bản Đến (Module 2 · Nhóm 2):**\n1. **Tiếp nhận & Vào sổ:** Văn thư tiếp nhận văn bản giấy hoặc điện tử, kiểm tra dấu và tính hợp lệ.\n2. **Số hóa & Phân loại:** Quét scan tài liệu PDF đính kèm, gắn số đến, phân loại độ khẩn (Thường/Khẩn/Hỏa tốc).\n3. **Trình Bút phê:** Chuyển Ban Giám Hiệu duyệt phân công đơn vị chủ trì xử lý qua hệ thống.`;
    }

    if (q.includes('mật') || q.includes('tuyệt mật') || q.includes('bảo mật')) {
      return `🔒 **Quy Chế Xử Lý Văn Bản Mật & Tuyệt Mật (TLBM):**\n- Phân định rõ 3 mức độ bảo mật: **Mật, Tối mật, Tuyệt mật**.\n- Văn bản Tuyệt mật được mã hóa đầu cuối, phân phối đích danh CBNV có thẩm quyền.\n- Hệ thống ghi vết nhật ký truy cập (Audit Log) theo tiêu chuẩn an toàn an ninh dữ liệu số.`;
    }

    if (q.includes('ký số') || q.includes('trình ký') || q.includes('phê duyệt') || q.includes('module 5')) {
      return `✍️ **Quy Trình Trình Ký Số Điện Tử (Module 5 · Nhóm 5):**\n- Cán bộ khởi tạo tờ trình/văn bản > Chọn luồng ký duyệt đa cấp.\n- Lãnh đạo xác thực ký số điện tử (USB Token / Cloud HSM).\n- Sau khi ký đủ thẩm quyền, hệ thống tự động ban hành và chuyển sang luồng Văn Bản Đi.`;
    }

    if (q.includes('phân quyền') || q.includes('nhân viên') || q.includes('cbnv') || q.includes('nhóm 7')) {
      return `👥 **Hệ Thống Phân Quyền & Hồ Sơ CBNV (Module 7 · Nhóm 7):**\n- Cấu trúc 2 cấp: Cấp 1 (Khối/Khu vực) và Cấp 2 (Đơn vị phòng ban).\n- Ma trận quyền RBAC chi tiết: Admin hệ thống, Lãnh đạo duyệt ký, Văn thư lưu trữ, Cán bộ chuyên môn.\n- Tự động che giấu năm sinh và mã hóa thông tin nhạy cảm của nhân sự.`;
    }

    return `🤖 **Trợ Lý AI TLBM (GPT-4o):**\nTôi đã ghi nhận yêu cầu của bạn về: *"${query}"*.\n\nTrong hệ thống TLBM, bạn có thể xem nhanh dữ liệu tại:\n- 📊 **Trang chủ Dashboard:** Thống kê văn bản đến/đi trong năm.\n- 📁 **Quản lý văn bản:** Danh mục phân loại và xử lý luồng công việc.\n- ⚙️ **Cài đặt:** Tùy chỉnh chế độ hiển thị Sáng/Tối theo sở thích.\n\nBạn có muốn tôi điều hướng đến phân hệ tương ứng không?`;
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Giả lập độ trễ xử lý AI thông minh
    setTimeout(() => {
      const replyText = generateAIResponse(text);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        time: 'Vừa xong',
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 650);
  };

  const handleClearHistory = () => {
    if (confirm('Bạn có muốn làm mới cuộc trò chuyện với Trợ lý AI không?')) {
      setMessages(INITIAL_MESSAGES);
    }
  };

  return (
    <>
      {/* 1. NÚT ORB THU NHỎ (Kéo tự do, có thể đặt ở bất kỳ góc nào) */}
      {!isOpen && (
        <div
          className="floating-ai-root"
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 9998,
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          <div
            className={`floating-ai-orb ${isDragging && draggingTarget === 'orb' ? 'is-dragging' : ''}`}
            onMouseDown={(e) => startDragging('orb', e.clientX, e.clientY)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                startDragging('orb', e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onClick={() => {
              if (!dragRef.current.hasMoved) {
                setIsOpen(true);
                setIsMinimized(false);
                setWindowDragOffset(null); // Tự tính toán vị trí xổ thông minh
              }
            }}
            title="Trợ Lý AI Tra Cứu TLBM (Kéo di chuyển tự do · Nhấp để mở)"
            role="button"
            tabIndex={0}
          >
            {/* Vòng hào quang sáng xung quanh */}
            <div className="ai-orb-pulse-ring" />
            <div className="ai-orb-inner">
              <i className="fa-solid fa-robot ai-orb-icon" />
            </div>
            {/* Chấm trạng thái trực tuyến */}
            <span className="ai-orb-status-dot" />
          </div>
        </div>
      )}

      {/* 2. CỬA SỔ HỘI THOẠI AI CHATBOX (Định vị tự động không bao giờ bị cắt xén) */}
      {isOpen && (
        <div
          ref={windowRef}
          className={`floating-ai-window ${isMinimized ? 'is-minimized' : ''} ${
            isDragging && draggingTarget === 'window' ? 'is-dragging' : ''
          }`}
          style={{
            position: 'fixed',
            left: `${computedWin.x}px`,
            top: `${computedWin.y}px`,
            width: `${winWidth}px`,
            maxHeight: `${winHeight}px`,
            zIndex: 9999,
            transformOrigin: computedWin.origin,
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {/* Thanh tiêu đề (Header): Có thể nắm kéo di chuyển cả cửa sổ */}
          <div
            className="ai-window-header"
            onMouseDown={(e) => startDragging('window', e.clientX, e.clientY)}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                startDragging('window', e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            title="Nhấn giữ và kéo để di chuyển hộp AI tự do trên màn hình"
          >
            <div className="ai-header-left">
              <div className="ai-avatar-badge">
                <i className="fa-solid fa-robot" />
                <span className="ai-live-dot" />
              </div>
              <div className="ai-header-info">
                <div className="ai-header-title">
                  <span>Trợ Lý AI TLBM</span>
                  <span className="ai-model-tag">GPT-4o</span>
                </div>
                <div className="ai-header-desc">Kéo di chuyển tự do • Tự căn chỉnh vị trí</div>
              </div>
            </div>

            <div className="ai-header-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ai-header-btn"
                onClick={handleClearHistory}
                title="Làm mới đoạn chat"
              >
                <i className="fa-solid fa-rotate-left" />
              </button>

              <button
                type="button"
                className="ai-header-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng hộp thoại' : 'Thu nhỏ'}
              >
                <i className={`fa-solid ${isMinimized ? 'fa-window-maximize' : 'fa-window-minimize'}`} />
              </button>

              <button
                type="button"
                className="ai-header-btn close-btn"
                onClick={() => {
                  setIsOpen(false);
                  setWindowDragOffset(null);
                }}
                title="Đóng về nút AI nổi"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>

          {/* Thân cửa sổ chat (khi không bị thu nhỏ) */}
          {!isMinimized && (
            <>
              <div className="ai-chat-body">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ai-message-row ${msg.sender === 'user' ? 'is-user' : 'is-ai'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="ai-message-avatar">
                        <i className="fa-solid fa-brain" />
                      </div>
                    )}

                    <div className="ai-message-bubble-wrapper">
                      <div className="ai-message-bubble">
                        {msg.text.split('\n').map((line, idx) => (
                          <p key={idx} style={{ margin: '3px 0' }}>
                            {line}
                          </p>
                        ))}
                      </div>

                      {/* Các nút bấm gợi ý câu hỏi nhanh (Quick Replies) */}
                      {msg.quickReplies && msg.quickReplies.length > 0 && (
                        <div className="ai-quick-replies-container">
                          {msg.quickReplies.map((reply, rIdx) => (
                            <button
                              key={rIdx}
                              type="button"
                              className="ai-quick-reply-pill"
                              onClick={() => handleSendMessage(reply)}
                            >
                              <i className="fa-solid fa-bolt-lightning" />
                              <span>{reply}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="ai-message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}

                {/* Trạng thái AI đang phản hồi */}
                {isTyping && (
                  <div className="ai-message-row is-ai">
                    <div className="ai-message-avatar">
                      <i className="fa-solid fa-brain" />
                    </div>
                    <div className="ai-typing-indicator">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Thanh nhập tin nhắn ở đáy */}
              <form
                className="ai-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  type="text"
                  className="ai-input-field"
                  placeholder="Hỏi trợ lý AI về văn bản, quy trình..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />

                <button
                  type="button"
                  className="ai-action-btn"
                  title="Nhập bằng giọng nói (Mô phỏng)"
                  onClick={() => alert('Chức năng nhận diện giọng nói tiếng Việt đang được kết nối Micro!')}
                >
                  <i className="fa-solid fa-microphone" />
                </button>

                <button
                  type="submit"
                  className="ai-send-btn"
                  disabled={!inputMessage.trim()}
                  title="Gửi câu hỏi"
                >
                  <i className="fa-solid fa-paper-plane" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
