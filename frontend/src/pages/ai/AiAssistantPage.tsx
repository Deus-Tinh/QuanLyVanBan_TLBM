import React, { useState, useRef, useEffect } from 'react';
import AlertModal from '@components/common/AlertModal';
import { ActivePageId } from '@app-types/navigation';
import '@styles/ai-chat.css';

interface AiAssistantPageProps {
  onNavigate?: (page: ActivePageId) => void;
}

interface CitationLink {
  label: string;
  code: string;
  targetPage: ActivePageId;
  type: 'incoming' | 'outgoing' | 'confidential' | 'approval';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  citations?: CitationLink[];
  quickPrompts?: string[];
  isThinking?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timeLabel: 'Hôm nay' | 'Hôm qua' | '7 ngày trước';
  snippet: string;
}

const INITIAL_SESSIONS: ChatSession[] = [];

const PROMPT_TEMPLATES = [
  {
    icon: 'fa-inbox',
    iconClass: 'text-primary bg-primary-subtle border-primary/30',
    title: 'Tiếp nhận Văn bản Đến',
    desc: 'Hỏi các bước vào sổ, scan số hóa và trình Ban Giám Hiệu bút phê.',
    query: 'Hướng dẫn quy trình tiếp nhận và xử lý văn bản đến trong ngày?',
  },
  {
    icon: 'fa-shield-halved',
    iconClass: 'text-danger bg-danger-subtle border-danger/30',
    title: 'Xử lý Văn bản Mật',
    desc: 'Quy chuẩn mã hóa, xác thực 2FA và quyền xem tài liệu Tuyệt Mật.',
    query: 'Quy định bảo mật và quy trình chuyển giao văn bản tuyệt mật?',
  },
  {
    icon: 'fa-file-signature',
    iconClass: 'text-warning-text bg-warning-subtle border-warning/30',
    title: 'Quy trình Trình Ký Số',
    desc: 'Sơ đồ luồng ký số Token PKI/Cloud HSM và phát hành văn bản đi.',
    query: 'Làm thế nào để tạo luồng trình ký số điện tử trên hệ thống?',
  },
  {
    icon: 'fa-sitemap',
    iconClass: 'text-success bg-success-subtle border-success/30',
    title: 'Cơ cấu & Phân quyền',
    desc: 'Tra cứu danh mục phòng ban Cấp 1, Cấp 2 và ma trận quyền CBNV.',
    query: 'Hệ thống phân quyền cán bộ nhân viên hoạt động như thế nào?',
  },
];

function getSessionUser() {
  try {
    const raw = localStorage.getItem('tlbm_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        fullName: parsed.fullName || 'Cán bộ nhân viên',
        role: parsed.roleTitle || 'Cán bộ nghiệp vụ',
      };
    }
  } catch {
    // fallback
  }
  return {
    fullName: 'Cán bộ nhân viên',
    role: 'Cán bộ nghiệp vụ',
  };
}

let chatMsgSeq = 0;
function createAiMessage(
  sender: 'user' | 'ai',
  text: string,
  citations?: CitationLink[]
): ChatMessage {
  const now = new Date();
  return {
    id: `${sender}-${now.getTime()}-${++chatMsgSeq}`,
    sender,
    text,
    time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    citations,
  };
}

export default function AiAssistantPage({ onNavigate }: AiAssistantPageProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gpt4o' | 'claude' | 'llama'>(() => {
    return (localStorage.getItem('tlbm_ai_model') as 'gpt4o' | 'claude' | 'llama') || 'gpt4o';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleModelUpdate = () => {
      const saved = (localStorage.getItem('tlbm_ai_model') as 'gpt4o' | 'claude' | 'llama') || 'gpt4o';
      setSelectedModel(saved);
    };
    window.addEventListener('tlbm_ai_model_updated', handleModelUpdate);
    window.addEventListener('storage', handleModelUpdate);
    return () => {
      window.removeEventListener('tlbm_ai_model_updated', handleModelUpdate);
      window.removeEventListener('storage', handleModelUpdate);
    };
  }, []);

  // Danh sách tin nhắn theo session
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `**Xin chào!**\n\nTôi là **Trợ Lý AI TLBM** — hệ thống hỏi đáp tài liệu quy trình, văn bản đến/đi và liên kết tra cứu thông minh.\n\nBạn có thể chọn thẻ mẫu bên dưới hoặc gõ câu hỏi bất kỳ!`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      quickPrompts: [
        'Quy trình tiếp nhận văn bản đến?',
        'Tiêu chuẩn bảo mật tài liệu Tuyệt Mật?',
        'Hướng dẫn ký số điện tử?',
        'Xem phân quyền cán bộ nhân viên?',
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
    const [aiAlertOpen, setAiAlertOpen] = useState(false);
    const [aiAlertMsg, setAiAlertMsg] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Bộ lọc tìm kiếm phiên chat
  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tạo phiên chat mới
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Hội thoại mới #${sessions.length + 1}`,
      timeLabel: 'Hôm nay',
      snippet: 'Bắt đầu cuộc trò chuyện mới...',
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: `**Phiên Trò Chuyện Mới Đã Sẵn Sàng!**\nBạn muốn tra cứu thông tin văn bản nào hôm nay? Hãy nhập số hiệu hoặc nội dung cần tìm kiếm.`,
        time: 'Vừa xong',
        quickPrompts: [
          'Văn bản đến hôm nay',
          'Văn bản mật cần xử lý',
          'Tờ trình chờ ký số',
        ],
      },
    ]);
  };

  // Giả lập câu trả lời AI chuyên sâu với trích dẫn link web/văn bản trực tiếp
  const generateResponse = (promptText: string): { text: string; citations?: CitationLink[] } => {
    const q = promptText.toLowerCase();

    if (q.includes('đến') || q.includes('tiếp nhận') || q.includes('vào sổ')) {
      return {
        text: `**Quy Trình Tiếp Nhận & Phân Phối Văn Bản Đến:**\n\n1. **Bước 1 (Tiếp nhận & Vào sổ):** Văn thư tiếp nhận công văn (bưu điện hoặc gửi qua mạng), kiểm tra dấu niêm phong, cấp số đến và ngày đến.\n2. **Bước 2 (Scan số hóa):** Quét tài liệu gốc định dạng PDF chất lượng cao, nhập trích yếu vào phân hệ Quản lý Văn Bản Đến.\n3. **Bước 3 (Bút phê lãnh đạo):** Trình Ban Giám Hiệu xem xét, phân công phòng ban xử lý chính và các đơn vị phối hợp.\n4. **Bước 4 (Theo dõi tiến độ):** Hệ thống tự động đẩy cảnh báo nhắc việc khi gần đến hạn xử lý.\n\n**Liên kết phân hệ liên quan:**`,
        citations: [
          {
            label: 'Phân hệ Quản lý Văn bản Đến',
            code: 'DOCS-INCOMING',
            targetPage: 'documents_incoming',
            type: 'incoming',
          },
          {
            label: 'Danh mục Sổ Đăng ký Văn bản Đến',
            code: 'DOCS-INCOMING-LOG',
            targetPage: 'documents_incoming',
            type: 'incoming',
          },
        ],
      };
    }

    if (q.includes('mật') || q.includes('tuyệt mật') || q.includes('bảo mật')) {
      return {
        text: `**Quy Định Bảo Vệ Bí Mật Nhà Nước & Tài Liệu Mật (TLBM · Phân hệ Mật):**\n\n- **Phân loại cấp độ:** Hệ thống hỗ trợ 3 cấp độ: *Mật*, *Tối Mật*, *Tuyệt Mật* theo đúng quy chuẩn Bộ Công An.\n- **Kiểm soát truy cập:** Chỉ tài khoản có thẩm quyền và được giao đích danh mới được mở tệp nội dung.\n- **Mã hóa & Xác thực:** Toàn bộ tệp mật được mã hóa AES-256 trên cơ sở dữ liệu. Truy cập tài liệu Tuyệt Mật yêu cầu mã xác thực 2 bước (2FA).\n- **Nhật ký truy vết (Audit Trail):** Mọi hành vi đọc, tải hoặc in ấn đều được ghi nhận vào sổ nhật ký không thể xóa sửa.\n\n**Liên kết phân hệ tài liệu mật:**`,
        citations: [
          {
            label: 'Phân hệ Quản lý Tài liệu Mật',
            code: 'DOCS-CONFIDENTIAL',
            targetPage: 'documents_confidential',
            type: 'confidential',
          },
        ],
      };
    }

    if (q.includes('ký số') || q.includes('trình ký') || q.includes('module 5')) {
      return {
        text: `**Quy Trình Trình Ký Số Điện Tử:**\n\n1. **Khởi tạo hồ sơ:** Cán bộ soạn thảo tờ trình, đính kèm dự thảo văn bản và tệp phụ lục.\n2. **Thiết lập luồng ký:** Chọn danh sách người ký duyệt (Trưởng phòng duyệt thể thức -> Lãnh đạo ký ban hành).\n3. **Ký số điện tử:** Lãnh đạo cắm Token PKI hoặc dùng chữ ký số đám mây (Cloud HSM) xác thực qua OTP.\n4. **Đóng dấu số & Chuyển luồng:** Văn thư đóng dấu cơ quan điện tử, hệ thống tự động sinh số hiệu văn bản đi và chuyển phát hành.\n\n**Liên kết phân hệ trình ký:**`,
        citations: [
          {
            label: 'Danh sách Hồ sơ Trình ký',
            code: 'APPROVALS-LIST',
            targetPage: 'approvals',
            type: 'approval',
          },
          {
            label: 'Kiểm tra phân hệ: Quy trình Ký số điện tử',
            code: 'APPROVALS-FLOW',
            targetPage: 'approvals',
            type: 'approval',
          },
        ],
      };
    }

    if (q.includes('phân quyền') || q.includes('nhân sự') || q.includes('cbnv') || q.includes('nhóm 7')) {
      return {
        text: `**Cấu Trúc Phân Quyền & Quản Trị Nhân Sự:**\n\n- **Cơ cấu tổ chức 2 cấp:** Khối/Khu vực (Cấp 1) -> Đơn vị/Phòng ban (Cấp 2).\n- **Ma trận vai trò RBAC:**\n  + *Quản trị viên (Admin):* Cấu hình tham số hệ thống, quản lý tài khoản CBNV.\n  + *Lãnh đạo Ban/Khối:* Quyền duyệt bút phê, ký số và phân công nhiệm vụ.\n  + *Văn thư đơn vị:* Quyền vào sổ văn bản đến, cấp số văn bản đi, lưu trữ hồ sơ.\n  + *Cán bộ xử lý:* Nhận việc, giải quyết văn bản và báo cáo tiến độ.\n- **Bảo vệ quyền riêng tư:** Thông tin năm sinh và dữ liệu cá nhân của CBNV được tự động che giấu trên danh sách chung.`,
        citations: [
          {
            label: 'Quản lý Hồ Sơ Cán Bộ Nhân Viên',
            code: 'EMP-PROFILES',
            targetPage: 'employees',
            type: 'incoming',
          },
          {
            label: 'Ma trận Phân quyền Sử dụng',
            code: 'ROLES-RBAC',
            targetPage: 'roles',
            type: 'confidential',
          },
        ],
      };
    }

    // Mặc định
    const currentUser = getSessionUser();
    return {
      text: `**Trợ Lý AI TLBM (Mô hình: ${selectedModel.toUpperCase()}):**\n\nTôi đã tiếp nhận câu hỏi của bạn: *"${promptText}"*.\n\nDựa trên dữ liệu hệ thống Quản lý Văn bản:\n- **Người dùng:** ${currentUser.fullName} (${currentUser.role})\n- **Hệ thống liên kết:** Phân hệ Văn bản đến/đi, Hồ sơ tài liệu, Quy trình duyệt ký.\n\nBạn có thể chọn một trong các liên kết dưới đây để truy cập nhanh tài liệu:`,
      citations: [
        {
          label: 'Văn bản Đến',
          code: 'INCOMING',
          targetPage: 'documents_incoming',
          type: 'incoming',
        },
        {
          label: 'Văn bản Đi',
          code: 'OUTGOING',
          targetPage: 'documents_outgoing',
          type: 'outgoing',
        },
        {
          label: 'Quy trình Ký số',
          code: 'APPROVALS',
          targetPage: 'approvals',
          type: 'approval',
        },
      ],
    };
  };

  const handleSend = (overrideText?: string) => {
    const text = (overrideText || inputVal).trim();
    if (!text && !attachedFile) return;

    const queryContent = attachedFile ? `[Tệp đính kèm: ${attachedFile}]\n${text}` : text;
    const userMsg = createAiMessage('user', queryContent);

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setAttachedFile(null);
    setIsGenerating(true);

    // Cập nhật tiêu đề phiên nếu là hội thoại mới
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, snippet: text.slice(0, 45) + '...' } : s))
    );

    // Giả lập độ trễ AI sinh kết quả
    setTimeout(() => {
      const response = generateResponse(text);
      const aiMsg = createAiMessage('ai', response.text, response.citations);

      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 850);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0].name);
    }
  };

  const handleExportChat = () => {
    const transcript = messages
      .map((m) => `[${m.time}] ${m.sender.toUpperCase()}:\n${m.text}\n`)
      .join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TLBM_AI_Chat_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-chat-page-root">
      {/* 1. THANH ĐIỀU HƯỚNG LỊCH SỬ CHAT (SIDEBAR) */}
      <aside className={`ai-chat-sidebar ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}>
        {/* Nút Tạo đoạn chat mới */}
        <div className="ai-sidebar-top">
          <button type="button" className="new-chat-btn" onClick={handleNewChat}>
            <i className="fa-solid fa-plus" />
            <span>Đoạn chat mới</span>
          </button>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Thu gọn lịch sử' : 'Mở rộng lịch sử'}
          >
            <i className={`fa-solid ${isSidebarOpen ? 'fa-angles-left' : 'fa-angles-right'}`} />
          </button>
        </div>

        {/* Ô tìm kiếm hội thoại */}
        {isSidebarOpen && (
          <div className="ai-sidebar-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              placeholder="Tìm kiếm phiên chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Danh sách các phiên hội thoại */}
        {isSidebarOpen && (
          <div className="ai-sidebar-sessions-list">
            {(['Hôm nay', 'Hôm qua', '7 ngày trước'] as const).map((group) => {
              const groupSessions = filteredSessions.filter((s) => s.timeLabel === group);
              if (groupSessions.length === 0) return null;

              return (
                <div key={group} className="session-group">
                  <div className="session-group-title">{group}</div>
                  <div className="session-items">
                    {groupSessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        className={`session-item-btn ${session.id === activeSessionId ? 'active' : ''}`}
                        onClick={() => setActiveSessionId(session.id)}
                      >
                        <i className="fa-regular fa-message session-item-icon" />
                        <div className="session-item-text">
                          <div className="session-item-title">{session.title}</div>
                          <div className="session-item-snippet">{session.snippet}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Thống kê tri thức AI ở đáy Sidebar */}
        {isSidebarOpen && (
          <div className="ai-sidebar-footer">
            <div className="ai-stats-badge">
              <span className="live-pulse-dot" />
              <span>Đã đồng bộ 482 văn bản TLBM</span>
            </div>
            <div className="ai-partner-tag">Hệ thống Trợ lý số · TLBM AI v2.5</div>
          </div>
        )}
      </aside>

      {/* 2. KHUNG CHAT CHÍNH (MAIN CHAT STAGE) */}
      <main className="ai-chat-main-stage">
        {/* Header trên cùng của phòng chat */}
        <header className="ai-chat-top-header">
          <div className="top-header-left">
            <div className="ai-brand-badge">
              <div className="ai-brand-icon">
                <i className="fa-solid fa-robot" />
              </div>
              <div>
                <div className="ai-brand-title">
                  <span>Trợ Lý AI Tra Cứu Quy Trình & Văn Bản</span>
                </div>
                <div className="ai-brand-sub">Mô hình AI chuyên biệt cho hệ thống QLVB & TLBM</div>
              </div>
            </div>
          </div>

          {/* Công cụ & Thao tác */}
          <div className="top-header-actions">
            {/* Nút Cài đặt AI (chuyển sang Cài đặt) */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => onNavigate && onNavigate('settings')}
              title="Cài đặt mô hình AI trong Cài đặt hệ thống"
            >
              <i className="fa-solid fa-gear" />
              <span>Cài đặt AI</span>
            </button>

            {/* Nút Xuất file */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={handleExportChat}
              title="Xuất nội dung chat ra tệp Markdown"
            >
              <i className="fa-solid fa-download" />
              <span>Xuất</span>
            </button>

            {/* Nút Làm mới */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => {
                if (confirm('Làm mới đoạn trò chuyện này?')) {
                  setMessages([messages[0]]);
                }
              }}
              title="Xóa lịch sử tin nhắn hiện tại"
            >
              <i className="fa-solid fa-rotate-left" />
            </button>
          </div>
        </header>

        {/* Vùng hiển thị tin nhắn (Scrollable) */}
        <div className="ai-chat-viewport">
          {/* Lưới thẻ Prompt gợi ý ban đầu */}
          {messages.length <= 1 && (
            <div className="ai-prompt-grid-container">
              <div className="prompt-grid-header">
                <h3>Gợi Ý Tra Cứu Nhanh Dành Cho Bạn</h3>
                <p>Nhấp vào thẻ bất kỳ để gửi yêu cầu tra cứu tự động đến Trợ lý AI</p>
              </div>

              <div className="ai-prompt-cards-grid">
                {PROMPT_TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    className="ai-prompt-card"
                    onClick={() => handleSend(tmpl.query)}
                  >
                    <div className={`prompt-card-icon border ${tmpl.iconClass}`}>
                      <i className={`fa-solid ${tmpl.icon}`} />
                    </div>
                    <div className="prompt-card-body">
                      <div className="prompt-card-title">{tmpl.title}</div>
                      <div className="prompt-card-desc">{tmpl.desc}</div>
                    </div>
                    <i className="fa-solid fa-arrow-right prompt-card-arrow" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách các tin nhắn */}
          <div className="ai-messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chat-message-row ${msg.sender === 'user' ? 'is-user' : 'is-ai'}`}
              >
                {/* Avatar người gửi */}
                <div className="message-avatar">
                  {msg.sender === 'user' ? (
                    <span className="user-avatar-text">{getSessionUser().fullName.charAt(0) || 'U'}</span>
                  ) : (
                    <i className="fa-solid fa-brain" />
                  )}
                </div>

                {/* Bong bóng tin nhắn */}
                <div className="message-content-wrapper">
                  <div className="message-header-meta">
                    <span className="sender-name">
                      {msg.sender === 'user' ? getSessionUser().fullName : 'Trợ Lý AI TLBM (GPT-4o)'}
                    </span>
                    <span className="message-time">{msg.time}</span>
                  </div>

                  <div className="message-bubble-body">
                    {msg.text.split('\n').map((line, lIdx) => {
                      if (!line.trim()) return <div key={lIdx} className="h-2" />;

                      // Header giả lập ###
                      if (line.startsWith('### ')) {
                        return <h4 key={lIdx} className="bubble-h4">{line.replace('### ', '')}</h4>;
                      }

                      // Bold bullet points
                      return (
                        <p key={lIdx} className="bubble-p">
                          {line}
                        </p>
                      );
                    })}

                    {/* DẪN LINK WEB / VĂN BẢN MỚI TRONG CHATGPT THEO ĐỀ CƯƠNG */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="ai-citations-box">
                        <div className="citations-title">
                          <i className="fa-solid fa-link" />
                          <span>Văn bản & liên kết liên quan trong hệ thống (Nhấp để mở):</span>
                        </div>

                        <div className="citations-list">
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              className={`citation-pill ${cite.type}`}
                              onClick={() => {
                                if (onNavigate) {
                                  onNavigate(cite.targetPage);
                                } else {
                                  setAiAlertMsg(`Điều hướng tới: ${cite.label} (${cite.code})`);
                                  setAiAlertOpen(true);
                                }
                              }}
                              title={`Nhấp để mở trang ${cite.label}`}
                            >
                              <i
                                className={`fa-solid ${
                                  cite.type === 'confidential'
                                    ? 'fa-shield-halved'
                                    : cite.type === 'approval'
                                    ? 'fa-file-signature'
                                    : 'fa-file-lines'
                                }`}
                              />
                              <span className="citation-name">{cite.label}</span>
                              <span className="citation-code">{cite.code}</span>
                              <i className="fa-solid fa-arrow-up-right-from-square citation-ext-icon" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Câu hỏi gợi ý tiếp theo (Quick prompts) */}
                    {msg.quickPrompts && msg.quickPrompts.length > 0 && (
                      <div className="ai-followup-prompts">
                        {msg.quickPrompts.map((qPrompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            className="followup-btn"
                            onClick={() => handleSend(qPrompt)}
                          >
                            <i className="fa-solid fa-bolt-lightning" />
                            <span>{qPrompt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thanh công cụ hành động dưới phản hồi AI */}
                  {msg.sender === 'ai' && (
                    <div className="message-toolbar">
                      <button
                        type="button"
                        className="msg-tool-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Sao chép nội dung"
                      >
                        <i className={`fa-solid ${copiedId === msg.id ? 'fa-check' : 'fa-copy'}`} />
                        <span>{copiedId === msg.id ? 'Đã sao chép' : 'Sao chép'}</span>
                      </button>

                      <button
                        type="button"
                        className="msg-tool-btn"
                        onClick={() => { setAiAlertMsg('Cảm ơn bạn đã đánh giá câu trả lời hữu ích!'); setAiAlertOpen(true); }}
                        title="Hữu ích"
                      >
                        <i className="fa-regular fa-thumbs-up" />
                      </button>

                      <button
                        type="button"
                        className="msg-tool-btn"
                        onClick={() => { setAiAlertMsg('Hệ thống đã ghi nhận phản hồi để hoàn thiện mô hình AI!'); setAiAlertOpen(true); }}
                        title="Cần cải thiện"
                      >
                        <i className="fa-regular fa-thumbs-down" />
                      </button>

                      <button
                        type="button"
                        className="msg-tool-btn"
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance(msg.text.replace(/[*#]/g, ''));
                          utterance.lang = 'vi-VN';
                          window.speechSynthesis.speak(utterance);
                        }}
                        title="Đọc to bằng giọng nói tiếng Việt"
                      >
                        <i className="fa-solid fa-volume-high" />
                        <span>Đọc</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Trạng thái AI đang suy nghĩ / phân tích */}
            {isGenerating && (
              <div className="ai-chat-message-row is-ai">
                <div className="message-avatar">
                  <i className="fa-solid fa-brain" />
                </div>
                <div className="message-content-wrapper">
                  <div className="ai-thinking-card">
                    <span className="thinking-spinner" />
                    <span>Trợ lý AI đang tra cứu cơ sở dữ liệu văn bản TLBM và tổng hợp câu trả lời...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 3. THANH NHẬP LIỆU CHAT CHUYÊN NGHIỆP Ở ĐÁY */}
        <footer className="ai-chat-bottom-input">
          {/* Tệp đính kèm xem trước */}
          {attachedFile && (
            <div className="attached-file-preview">
              <i className="fa-solid fa-paperclip" />
              <span className="attached-name">{attachedFile}</span>
              <button
                type="button"
                className="remove-file-btn"
                onClick={() => setAttachedFile(null)}
                title="Gỡ tệp"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          )}

          <div className="input-box-container">
            {/* Ẩn input file */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xlsx,.txt"
            />

            {/* Nút Đính kèm file */}
            <button
              type="button"
              className="input-tool-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm văn bản (PDF, Word, Excel) để AI tóm tắt hoặc tra cứu"
            >
              <i className="fa-solid fa-paperclip" />
            </button>

            {/* Khung gõ câu hỏi */}
            <textarea
              className="chat-textarea"
              placeholder="Nhập câu hỏi tra cứu quy trình, số hiệu văn bản, tài liệu mật... (Nhấn Enter để gửi)"
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            {/* Nút Nhập giọng nói */}
            <button
              type="button"
              className="input-tool-btn voice-btn"
              onClick={() => { setAiAlertMsg('Đang kích hoạt micro thu âm giọng nói tiếng Việt...'); setAiAlertOpen(true); }}
              title="Nhập bằng giọng nói"
            >
              <i className="fa-solid fa-microphone" />
            </button>

            {/* Nút Gửi */}
            <button
              type="button"
              className="send-message-btn"
              disabled={!inputVal.trim() && !attachedFile}
              onClick={() => handleSend()}
              title="Gửi câu hỏi (Enter)"
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>

          <div className="chat-disclaimer">
            <span>
              Trợ lý AI TLBM có thể hỗ trợ tra cứu văn bản và quy trình nghiệp vụ. Vui lòng đối chiếu với văn bản gốc đối với các tài liệu mật hoặc pháp lý quan trọng.
            </span>
          </div>
        </footer>
      </main>
      <AlertModal open={aiAlertOpen} onClose={()=>setAiAlertOpen(false)} message={aiAlertMsg} />
    </div>
  );
}


