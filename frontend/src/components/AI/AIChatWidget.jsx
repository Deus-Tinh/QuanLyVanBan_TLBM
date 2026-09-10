import React, { useState, useRef, useEffect } from 'react';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Xin chào Anh/Chị! Tôi là Trợ lý AI Hệ thống TLBM. Tôi có thể giúp gì cho Anh/Chị về tra cứu văn bản, lịch trình hoặc danh sách sinh nhật CBNV hôm nay?',
      time: 'Vừa xong',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulated AI Intelligence reply
    setTimeout(() => {
      let replyText = 'Tôi đã tiếp nhận câu hỏi của bạn. Hệ thống đang đồng bộ dữ liệu văn bản và phúc lợi CBNV.';

      const lower = query.toLowerCase();
      if (lower.includes('sinh nhật') || lower.includes('hôm nay') || lower.includes('ai')) {
        replyText =
          '🎂 Hôm nay (10/09/2026), toàn hệ thống có 02 CBNV sinh nhật: 1. Anh Châu Tuấn Kiệt (PM · Ban CNTT); 2. Chị Trần Vũ Giang Anh (Khối Nghiệp vụ). Cả 2 thiệp điện tử đã được hệ thống tự động phát vào lúc 08:00:00 sáng!';
      } else if (lower.includes('ngày mai')) {
        replyText =
          '🎉 Ngày mai (11/09/2026) có sinh nhật của Anh Tô Thanh Tân (Data Architect - Khối Hỗ trợ). Hệ thống đã lên lịch phát tự động lúc 08:00:00 sáng mai.';
      } else if (lower.includes('văn bản') || lower.includes('mật') || lower.includes('khẩn')) {
        replyText =
          '🛡️ Hiện tại luồng Văn bản Mật đang có 02 văn bản cần chú ý: MẬT-04/HĐQT (Tối mật) và HỎA TỐC-09/BQP. Anh/Chị có thể bấm vào biểu tượng khiên đỏ trên thanh Header để xem chi tiết!';
      } else if (lower.includes('lịch') || lower.includes('cấu hình') || lower.includes('cron')) {
        replyText =
          '⚙️ Lịch phát thiệp tự động đang được thiết lập định kỳ vào 08:00 mỗi ngày qua dịch vụ SMTP nội bộ. Anh/Chị có thể chỉnh sửa tại nút "Lịch phát tự động (08:00)" trên thanh công cụ lịch!';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  return (
    <div className="ai-widget-container">
      {/* 3D Round Trigger Button */}
      <button
        type="button"
        className={`ai-fab-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Trợ lý AI TLBM"
      >
        <span className="ai-icon-inner">
          <i className="fa-solid fa-wand-magic-sparkles" />
        </span>
        <span className="ai-fab-label">AI Trợ Lý</span>
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="ai-chatbox-deck">
          {/* Chatbox Header */}
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar-badge">
                <i className="fa-solid fa-robot" />
              </div>
              <div>
                <h4 className="ai-header-title">Trợ Lý AI TLBM</h4>
                <div className="ai-online-status">
                  <span className="status-dot-green" /> Trực tuyến 24/7
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ai-close-btn"
              onClick={() => setIsOpen(false)}
            >
              <i className="fa-solid fa-minus" />
            </button>
          </div>

          {/* Chatbox Messages */}
          <div className="ai-messages-scroll">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message-bubble ${msg.sender}-bubble`}>
                <div className="bubble-text">{msg.text}</div>
                <div className="bubble-time">{msg.time}</div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick suggestions */}
          <div className="ai-quick-suggestions">
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => handleSend('Ai có sinh nhật hôm nay?')}
            >
              🎂 Sinh nhật hôm nay?
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => handleSend('Tra cứu văn bản mật')}
            >
              🛡️ Văn bản mật &amp; khẩn?
            </button>
          </div>

          {/* Chat Input */}
          <form
            className="ai-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi cho AI..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="ai-send-btn">
              <i className="fa-solid fa-paper-plane" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
