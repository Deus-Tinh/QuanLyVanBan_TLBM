import { useCallback, useEffect, useRef, useState } from "react";
import {
  uploadDocumentAsync,
  getUploadProgress,
  askQuestion,
  getDocuments,
  getCategories,
  deleteDocuments,
  deleteDocument,
  reclassifyDocument,
  previewDocument,
  getAISettings,
} from "./api";
import AISettingsModal from "./components/AISettingsModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ── Prompt Templates (QuanLyVanBan_TLBM) ─────────────────────────
const PROMPT_TEMPLATES = [
  {
    icon: "fa-magnifying-glass",
    iconClass: "text-primary bg-primary-subtle",
    title: "Tra cứu tài liệu",
    desc: "Tìm thông tin dựa trên các tệp đã được tải lên và lập chỉ mục.",
    query: "Tìm nội dung về [chủ đề] trong các tài liệu đã tải lên.",
  },
  {
    icon: "fa-file-lines",
    iconClass: "text-success bg-success-subtle",
    title: "Tóm tắt tài liệu",
    desc: "Tóm tắt các ý chính trong tài liệu có liên quan.",
    query: "Tóm tắt các ý chính của tài liệu liên quan trong kho.",
  },
  {
    icon: "fa-table",
    iconClass: "text-warning bg-warning-subtle",
    title: "Trích xuất dữ liệu",
    desc: "Tìm số liệu, mốc thời gian hoặc bảng biểu trong tài liệu đã nạp.",
    query: "Trích xuất các số liệu và mốc thời gian có trong tài liệu liên quan.",
  },
  {
    icon: "fa-square-root-variable",
    iconClass: "text-danger bg-danger-subtle",
    title: "Giải thích nội dung",
    desc: "Hỏi về khái niệm, công thức hoặc đoạn văn trong tài liệu đã tải.",
    query: "Giải thích khái niệm hoặc công thức được nêu trong tài liệu liên quan.",
  },
];

// ── Markdown Formatter ──────────────────────────────────────────
function formatInline(str = "") {
  const parts = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(<code key={match.index}>{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts.length > 0 ? parts : str;
}

function FormattedContent({ content = "" }) {
  const lines = content.split("\n");
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="ps-3 mb-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="mb-1">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${lineIdx}`} className="bubble-h4">
          {trimmed.replace("### ", "")}
        </h4>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
      const textContent = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "");
      listItems.push(formatInline(textContent));
    } else {
      flushList();
      if (trimmed === "") {
        elements.push(<div key={`br-${lineIdx}`} className="h-2 my-1" />);
      } else {
        elements.push(
          <p key={`p-${lineIdx}`} className="bubble-p">
            {formatInline(line)}
          </p>
        );
      }
    }
  });
  flushList();

  return <div className="message-content">{elements}</div>;
}

// ── Document Preview Modal ──────────────────────────────────────
function DocumentPreviewModal({ filename, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("full");
  const contentRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    previewDocument(filename)
      .then((res) => setData(res))
      .catch((err) => {
        const msg =
          err.response?.data?.detail ||
          err.message ||
          "Không thể tải nội dung tài liệu.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [filename]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleCopyAll() {
    if (!data?.full_text) return;
    try {
      await navigator.clipboard.writeText(data.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (contentRef.current) {
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }

  const isPdf = data?.render_mode === "pdf";
  const fileUrl = data?.file_url ? `${API_BASE_URL}${data.file_url}` : null;

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <div
        className={`preview-panel ${isPdf ? "preview-panel-pdf" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preview-header">
          <div className="preview-title-area">
            <div className="preview-title-icon">
              <i className={`fa-solid ${isPdf ? "fa-file-pdf" : "fa-file-lines"}`}></i>
            </div>
            <div>
              <div className="preview-filename" title={filename}>{filename}</div>
              {data && (
                <div className="preview-meta">
                  <span className="badge bg-light text-dark border me-1">{data.file_type}</span>
                  {!isPdf && data.total_pages && (
                    <span>• {data.total_pages} phần</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="preview-header-actions">
            {data && !isPdf && (
              <button
                className="preview-copy-btn"
                onClick={handleCopyAll}
                title="Sao chép toàn bộ nội dung"
              >
                <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
                <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
              </button>
            )}

            {isPdf && fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="preview-copy-btn"
                title="Mở tài liệu trong tab mới"
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Mở tab mới</span>
              </a>
            )}

            <button className="preview-close-btn" onClick={onClose} title="Đóng (Esc)">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {data && !isPdf && data.total_pages > 1 && (
          <div className="preview-tabs">
            <button
              className={`preview-tab ${activeTab === "full" ? "active" : ""}`}
              onClick={() => setActiveTab("full")}
            >
              <i className="fa-solid fa-align-left me-1"></i>
              Toàn bộ văn bản
            </button>
            <button
              className={`preview-tab ${activeTab === "pages" ? "active" : ""}`}
              onClick={() => setActiveTab("pages")}
            >
              <i className="fa-solid fa-layer-group me-1"></i>
              Theo từng phần ({data.total_pages})
            </button>
          </div>
        )}

        <div className="preview-body">
          {loading && (
            <div className="d-flex align-items-center justify-content-center p-5 text-secondary">
              <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
              Đang tải nội dung tài liệu...
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 m-3">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {data && !loading && isPdf && fileUrl && (
            <iframe
              src={fileUrl}
              className="preview-pdf-iframe"
              title={filename}
            />
          )}

          {data && !loading && !isPdf && activeTab === "full" && (
            <pre ref={contentRef} className="preview-text">
              {data.full_text || "(Không có nội dung)"}
            </pre>
          )}

          {data && !loading && !isPdf && activeTab === "pages" && (
            <div>
              {data.pages.map((page, idx) => (
                <div key={idx} className="preview-page-block">
                  <div className="preview-page-label">
                    <i className="fa-solid fa-bookmark me-1"></i>
                    {page.page ? `Phần ${page.page}` : `Phần ${idx + 1}`}
                  </div>
                  <pre className="preview-text border-0 rounded-0 m-0">{page.text}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Citations Box Component (QuanLyVanBan_TLBM) ─────────────────
function CitationsBox({ sources, onPreview }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="ai-citations-box">
      <div className="citations-title">
        <i className="fa-solid fa-link"></i>
        <span>Văn bản & liên kết liên quan trong hệ thống (Nhấp để mở):</span>
      </div>

      <div className="citations-list">
        {sources.map((src, idx) => {
          const fileName = src.file_name || `Tài liệu #${idx + 1}`;
          const code = src.page
            ? `Trang ${src.page}`
            : `Đoạn ${src.section || src.chunk_id || idx + 1}`;

          const isConfidential = fileName.toLowerCase().includes("mat") || fileName.toLowerCase().includes("tuyet_mat");
          const isBusinessSpec = src.source_type === "business_spec";

          return (
            <button
              key={idx}
              type="button"
              className={`citation-pill ${isConfidential ? "confidential" : ""} ${isBusinessSpec ? "business-spec" : ""}`}
              onClick={isBusinessSpec ? undefined : () => onPreview && onPreview(src.file_name)}
              disabled={isBusinessSpec}
              title={`Nhấp để mở tài liệu ${fileName}`}
            >
              <i
                className={`fa-solid ${
                  isConfidential
                    ? "fa-shield-halved"
                    : isBusinessSpec
                    ? "fa-diagram-project"
                    : fileName.toLowerCase().endsWith(".pdf")
                    ? "fa-file-pdf"
                    : "fa-file-lines"
                }`}
              />
              <span className="citation-name">{fileName}</span>
              {isBusinessSpec && <span className="citation-code">Spec</span>}
              <span className="citation-code">{code}</span>
              {!isBusinessSpec && <i className="fa-solid fa-arrow-up-right-from-square citation-ext-icon" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main App Component ──────────────────────────────────────────
export default function App() {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("sessions"); // "sessions" | "docs"
  const [sessionSearch, setSessionSearch] = useState("");
  const [docSearch, setDocSearch] = useState("");

  // Sessions state (Multi-session support)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem("tlbm_chat_sessions");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "session-default",
        title: "Tra cứu quy trình & văn bản",
        timeLabel: "Hôm nay",
        snippet: "Bắt đầu cuộc trò chuyện...",
        messages: [
          {
            id: "msg-welcome",
            sender: "ai",
            text: `**Xin chào!**\n\nTôi là **Trợ Lý AI TLBM**. Tôi ưu tiên tra cứu tài liệu đã tải lên, và cũng có thể giải đáp kiến thức chung về tài liệu, quy trình số hóa, OCR hoặc RAG. Khi trả lời theo kiến thức chung thay vì quy định nội bộ, tôi sẽ nói rõ.\n\nBạn có thể chọn thẻ gợi ý hoặc hỏi điều mình cần.`,
            time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
            quickPrompts: [
              "Tóm tắt tài liệu liên quan đã tải lên.",
              "Tìm một khái niệm trong tài liệu.",
              "Trích xuất số liệu có trong tài liệu.",
              "Giải thích công thức trong tài liệu liên quan.",
            ],
          },
        ],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState("session-default");

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem("tlbm_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Current session & messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Knowledge base state
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [previewFilename, setPreviewFilename] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiConfig, setAiConfig] = useState(null);

  // Chat input state
  const [inputVal, setInputVal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Load initial settings & documents
  useEffect(() => {
    getAISettings().then(setAiConfig).catch(console.error);
    refreshDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Lỗi tải danh sách tài liệu:", err);
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshDocuments() {
    await loadDocuments();
    await loadCategories();
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Create new chat session
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Hội thoại mới #${sessions.length + 1}`,
      timeLabel: "Hôm nay",
      snippet: "Bắt đầu cuộc trò chuyện mới...",
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "ai",
          text: `**Phiên trò chuyện mới đã sẵn sàng!**\nBạn có thể hỏi về nội dung trong tài liệu đã tải lên. Nếu thông tin chưa có trong kho, tôi sẽ báo rõ.`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          quickPrompts: [
            "Tóm tắt tài liệu liên quan đã tải lên.",
            "Tìm một khái niệm trong tài liệu.",
            "Trích xuất số liệu có trong tài liệu.",
            "Giải thích công thức trong tài liệu liên quan.",
          ],
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
  };

  // Delete session
  const handleDeleteSession = (e, sId) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }
    const remaining = sessions.filter((s) => s.id !== sId);
    setSessions(remaining);
    if (activeSessionId === sId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Build history for backend API
  const buildHistoryForAPI = (msgList) => {
    return msgList
      .filter((m) => m.sender === "user" || m.sender === "ai")
      .slice(-8)
      .map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text,
      }));
  };

  // ── Send Message & Real API Execution ─────────────────────────
  const handleSend = async (overrideText) => {
    const text = (overrideText || inputVal).trim();
    if (!text && !attachedFile) return;

    // Check if user attached a file to upload & index
    let finalQuery = text;
    if (attachedFile && !text) {
      finalQuery = `Phân tích và tóm tắt tệp tài liệu đính kèm: ${attachedFile.name}`;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: attachedFile ? `[Đính kèm: ${attachedFile.name}]\n${finalQuery}` : finalQuery,
      time: timeStr,
    };

    // Update active session messages
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              snippet: finalQuery.slice(0, 45) + "...",
              messages: [...s.messages, userMsg],
            }
          : s
      )
    );

    setInputVal("");
    setIsGenerating(true);

    // If attached file, upload it first to the backend
    if (attachedFile) {
      try {
        const uploadResult = await uploadDocumentAsync(attachedFile);
        setAttachedFile(null);
        await refreshDocuments();
      } catch (err) {
        console.error("Lỗi upload file đính kèm:", err);
      }
    }

    try {
      const history = buildHistoryForAPI([...messages, userMsg]);
      const data = await askQuestion(finalQuery, history, selectedCategory || null);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer || "Không tìm thấy nội dung phù hợp trong kho tài liệu.",
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || [],
        quickPrompts: [
          "Các điều khoản hoặc lưu ý quan trọng là gì?",
          "Trích xuất các số liệu và bảng biểu liên quan",
          "Ai là người chịu trách nhiệm xử lý?",
        ],
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, aiMsg] }
            : s
        )
      );
    } catch (err) {
      console.error("Lỗi chat API:", err);
      const detail = err.response?.data?.detail || err.message || "Lỗi xử lý yêu cầu.";
      const errorMsg = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Không thể kết nối đến máy chủ:** ${JSON.stringify(detail)}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy message
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to Speech
  const handleSpeak = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt không hỗ trợ đọc giọng nói.");
      return;
    }
    const cleanText = text.replace(/[*#`_]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";
    window.speechSynthesis.speak(utterance);
  };

  // Voice Input (Speech Recognition)
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ Web Speech API. Vui lòng dùng Chrome hoặc Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputVal((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Export chat transcript to Markdown
  const handleExportChat = () => {
    const transcript = messages
      .map((m) => `[${m.time}] ${m.sender.toUpperCase()}:\n${m.text}\n`)
      .join("\n---\n\n");
    const blob = new Blob([transcript], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TLBM_AI_Chat_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // File Upload Handlers (Sidebar Drag & Drop)
  const handleDropFiles = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFileToServer(files[0]);
    }
  };

  const uploadFileToServer = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress({ status: "queued", message: "Đang tải file lên máy chủ..." });

    try {
      const { job_id, filename } = await uploadDocumentAsync(file);
      setUploadProgress({ status: "processing", message: "Đang trích xuất & vector hóa..." });

      pollTimerRef.current = setInterval(async () => {
        try {
          const job = await getUploadProgress(job_id);
          setUploadProgress({ status: job.status, message: job.message });

          if (job.status === "done") {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            setUploading(false);
            const cat = job.category || "Chưa phân loại";
            await refreshDocuments();

            // Notify in active chat
            setSessions((prev) =>
              prev.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      messages: [
                        ...s.messages,
                        {
                          id: `ai-up-${Date.now()}`,
                          sender: "ai",
                          text: `✅ **Đã nạp và tạo vector index cho tài liệu thành công:**\n- **Tên tệp:** ${filename}\n- **Chủ đề phân loại:** ${cat}\n\nBạn có thể hỏi ngay các câu hỏi liên quan đến tài liệu này!`,
                          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
                        },
                      ],
                    }
                  : s
              )
            );
            setTimeout(() => setUploadProgress(null), 3000);
          } else if (job.status === "error") {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            setUploading(false);
            setUploadProgress(null);
            alert(`Lỗi xử lý file: ${job.error || job.message}`);
          }
        } catch (pollErr) {
          console.error(pollErr);
        }
      }, 1800);
    } catch (err) {
      console.error(err);
      setUploading(false);
      setUploadProgress(null);
      alert(`Lỗi upload file: ${err.message}`);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (filename) => {
    if (!window.confirm(`Xác nhận xóa tài liệu "${filename}"?`)) return;
    try {
      await deleteDocument(filename);
      await refreshDocuments();
    } catch (err) {
      alert(`Lỗi xóa: ${err.message}`);
    }
  };

  // Reclassify Document
  const handleReclassifyDoc = async (filename) => {
    try {
      const res = await reclassifyDocument(filename);
      await refreshDocuments();
      alert(`Đã phân loại lại: ${res.category}`);
    } catch (err) {
      alert(`Lỗi phân loại: ${err.message}`);
    }
  };

  // Clear all documents
  const handleClearAllDocs = async () => {
    if (!window.confirm("CẢNH BÁO: Thao tác này sẽ xóa toàn bộ tài liệu và ChromaDB. Tiếp tục?")) return;
    try {
      await deleteDocuments();
      await refreshDocuments();
      alert("Đã xóa sạch kho tài liệu.");
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.snippet.toLowerCase().includes(sessionSearch.toLowerCase())
  );

  // Grouped documents
  const filteredDocs = documents.filter((d) => {
    if (!docSearch.trim()) return true;
    const q = docSearch.toLowerCase();
    return (
      (d.filename && d.filename.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q))
    );
  });

  const groupedDocs = {};
  for (const doc of filteredDocs) {
    const cat = doc.category || "Chưa phân loại";
    if (!groupedDocs[cat]) groupedDocs[cat] = [];
    groupedDocs[cat].push(doc);
  }

  return (
    <div className="ai-chat-page-root">
      {/* ====================================================================
         1. SIDEBAR (LỊCH SỬ CHAT & KHO TÀI LIỆU)
         ==================================================================== */}
      <aside className={`ai-chat-sidebar ${isSidebarOpen ? "is-open" : "is-collapsed"}`}>
        {/* Nút Tạo đoạn chat mới & Thu gọn */}
        <div className="ai-sidebar-top">
          <button type="button" className="new-chat-btn" onClick={handleNewChat}>
            <i className="fa-solid fa-plus"></i>
            <span>Đoạn chat mới</span>
          </button>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
          >
            <i className={`fa-solid ${isSidebarOpen ? "fa-angles-left" : "fa-angles-right"}`} />
          </button>
        </div>

        {/* Tab Switcher: Hội thoại vs Kho tài liệu */}
        {isSidebarOpen && (
          <div className="sidebar-tab-switcher">
            <button
              className={`sidebar-tab-pill ${sidebarTab === "sessions" ? "active" : ""}`}
              onClick={() => setSidebarTab("sessions")}
            >
              <i className="fa-regular fa-message"></i>
              <span>Hội thoại</span>
            </button>
            <button
              className={`sidebar-tab-pill ${sidebarTab === "docs" ? "active" : ""}`}
              onClick={() => setSidebarTab("docs")}
            >
              <i className="fa-solid fa-folder-open"></i>
              <span>Kho tài liệu ({documents.length})</span>
            </button>
          </div>
        )}

        {/* Tab 1: Danh sách các phiên trò chuyện */}
        {isSidebarOpen && sidebarTab === "sessions" && (
          <>
            <div className="ai-sidebar-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Tìm kiếm phiên chat..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
              />
            </div>

            <div className="ai-sidebar-sessions-list">
              <div className="session-group">
                <div className="session-group-title">Lịch sử trò chuyện</div>
                <div className="session-items">
                  {filteredSessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`session-item-btn ${s.id === activeSessionId ? "active" : ""}`}
                      onClick={() => setActiveSessionId(s.id)}
                    >
                      <i className="fa-regular fa-message session-item-icon" />
                      <div className="session-item-text">
                        <div className="session-item-title">{s.title}</div>
                        <div className="session-item-snippet">{s.snippet}</div>
                      </div>
                      <button
                        type="button"
                        className="session-item-delete"
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        title="Xóa phiên chat"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Quản lý kho tài liệu */}
        {isSidebarOpen && sidebarTab === "docs" && (
          <div className="ai-sidebar-sessions-list p-2">
            <div className="ai-sidebar-search p-0 mb-2">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Tìm file tài liệu..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
              />
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              ref={dropZoneRef}
              className={`sidebar-dropzone mb-3 ${isDragging ? "is-dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropFiles}
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fa-solid fa-cloud-arrow-up sidebar-dropzone-icon d-block"></i>
              <div className="sidebar-dropzone-text">Kéo thả hoặc Nhấp để nạp file</div>
              <div className="sidebar-dropzone-subtext">Hỗ trợ PDF, DOCX, TXT</div>
            </div>

            {/* Progress indicator */}
            {uploadProgress && (
              <div className="p-2 mb-2 bg-light border rounded small">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="spinner-border spinner-border-sm text-primary"></span>
                  <span className="fw-semibold text-primary">{uploadProgress.message}</span>
                </div>
              </div>
            )}

            {/* Danh mục tài liệu theo chủ đề */}
            {Object.keys(groupedDocs).length === 0 ? (
              <div className="text-center text-muted small py-3">
                {documents.length === 0 ? "Chưa có tài liệu nào." : "Không có kết quả tìm kiếm."}
              </div>
            ) : (
              Object.entries(groupedDocs).map(([cat, docs]) => (
                <div key={cat} className="sidebar-doc-category">
                  <div className="sidebar-category-header">
                    <i className="fa-solid fa-folder text-warning"></i>
                    <span className="text-truncate">{cat}</span>
                    <span className="sidebar-category-count">{docs.length}</span>
                  </div>

                  <div>
                    {docs.map((d) => (
                      <div key={d.filename} className="sidebar-doc-row">
                        <i
                          className={`fa-solid ${
                            d.filename.toLowerCase().endsWith(".pdf")
                              ? "fa-file-pdf text-danger"
                              : "fa-file-lines text-primary"
                          }`}
                        />
                        <span className="sidebar-doc-name" title={d.filename}>
                          {d.filename}
                        </span>
                        <div className="sidebar-doc-actions">
                          <button
                            type="button"
                            className="sidebar-doc-btn"
                            onClick={() => setPreviewFilename(d.filename)}
                            title="Xem trước"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          {d.category === "Chưa phân loại" && (
                            <button
                              type="button"
                              className="sidebar-doc-btn"
                              onClick={() => handleReclassifyDoc(d.filename)}
                              title="Phân loại lại AI"
                            >
                              <i className="fa-solid fa-wand-magic-sparkles"></i>
                            </button>
                          )}
                          <button
                            type="button"
                            className="sidebar-doc-btn delete-btn"
                            onClick={() => handleDeleteDoc(d.filename)}
                            title="Xóa tài liệu"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {documents.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm w-100 mt-2 rounded-2"
                onClick={handleClearAllDocs}
              >
                <i className="fa-solid fa-trash-can me-1"></i>
                Xóa toàn bộ kho tài liệu
              </button>
            )}
          </div>
        )}

        {/* Sidebar Footer */}
        {isSidebarOpen && (
          <div className="ai-sidebar-footer">
            <div className="ai-stats-badge">
              <span className="live-pulse-dot" />
              <span>Đã đồng bộ {documents.length} tài liệu TLBM</span>
            </div>
            <div className="ai-partner-tag">Hệ thống Trợ lý số · SmartDoc RAG AI</div>
          </div>
        )}
      </aside>

      {/* ====================================================================
         2. MAIN CHAT STAGE (KHUNG TRÒ CHUYỆN CHÍNH)
         ==================================================================== */}
      <main className="ai-chat-main-stage">
        {/* Top Header */}
        <header className="ai-chat-top-header">
          <div className="top-header-left">
            {!isSidebarOpen && (
              <button
                type="button"
                className="open-sidebar-btn"
                onClick={() => setIsSidebarOpen(true)}
                title="Mở lịch sử chat"
              >
                <i className="fa-solid fa-bars" />
              </button>
            )}

            <div className="ai-brand-badge">
              <div className="ai-brand-icon">
                <i className="fa-solid fa-robot" />
              </div>
              <div>
                <div className="ai-brand-title">
                  <span>Trợ Lý AI Tra Cứu Quy Trình & Văn Bản</span>
                  <span className="team-badge">LlamaIndex · ChromaDB</span>
                </div>
                <div className="ai-brand-sub">
                  Mô hình AI chuyên biệt cho hệ thống QLVB & RAG Tri Thức
                </div>
              </div>
            </div>
          </div>

          <div className="top-header-actions">
            {/* Bộ lọc chủ đề */}
            {categories.length > 0 && (
              <div className="model-selector-wrapper">
                <i className="fa-solid fa-filter text-primary"></i>
                <select
                  className="model-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Tất cả chủ đề</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Model Badge */}
            {aiConfig && (
              <div className="model-selector-wrapper d-none d-md-flex">
                <span className="live-pulse-dot"></span>
                <span className="text-uppercase fw-bold">{aiConfig.provider}</span>
                <span className="opacity-50">|</span>
                <span>{aiConfig.llm_model}</span>
              </div>
            )}

            {/* Nút Cài đặt AI */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => setShowSettingsModal(true)}
              title="Cài đặt mô hình & API Key"
            >
              <i className="fa-solid fa-gear" />
              <span className="d-none d-sm-inline">Cài đặt AI</span>
            </button>

            {/* Nút Xuất file */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={handleExportChat}
              title="Xuất nội dung chat ra tệp Markdown"
            >
              <i className="fa-solid fa-download" />
              <span className="d-none d-sm-inline">Xuất</span>
            </button>

            {/* Nút Làm mới */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => {
                if (window.confirm("Làm mới đoạn trò chuyện này?")) {
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? { ...s, messages: [s.messages[0]] }
                        : s
                    )
                  );
                }
              }}
              title="Xóa lịch sử tin nhắn của phiên hiện tại"
            >
              <i className="fa-solid fa-rotate-left" />
            </button>
          </div>
        </header>

        {/* Viewport Tin Nhắn */}
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
            {messages.map((msg) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={msg.id}
                  className={`ai-chat-message-row ${isUser ? "is-user" : "is-ai"}`}
                >
                  <div className="message-avatar">
                    {isUser ? (
                      <span className="user-avatar-text">U</span>
                    ) : (
                      <i className="fa-solid fa-brain" />
                    )}
                  </div>

                  <div className="message-content-wrapper">
                    <div className="message-header-meta">
                      <span className="sender-name">
                        {isUser ? "Bạn" : `Trợ Lý AI TLBM (${aiConfig?.provider?.toUpperCase() || "GEMINI"})`}
                      </span>
                      <span className="message-time">{msg.time}</span>
                    </div>

                    <div className="message-bubble-body">
                      {isUser ? (
                        msg.text
                      ) : (
                        <>
                          <FormattedContent content={msg.text} />
                          {/* Trích dẫn Citations */}
                          <CitationsBox
                            sources={msg.sources}
                            onPreview={(fn) => setPreviewFilename(fn)}
                          />
                        </>
                      )}

                      {/* Gợi ý câu hỏi tiếp theo */}
                      {!isUser && msg.quickPrompts && msg.quickPrompts.length > 0 && (
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

                    {/* Toolbar dưới câu trả lời của AI */}
                    {!isUser && (
                      <div className="message-toolbar">
                        <button
                          type="button"
                          className="msg-tool-btn"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          title="Sao chép nội dung"
                        >
                          <i className={`fa-solid ${copiedId === msg.id ? "fa-check" : "fa-copy"}`} />
                          <span>{copiedId === msg.id ? "Đã sao chép" : "Sao chép"}</span>
                        </button>

                        <button
                          type="button"
                          className="msg-tool-btn"
                          onClick={() => alert("Cảm ơn bạn đã đánh giá câu trả lời hữu ích!")}
                          title="Hữu ích"
                        >
                          <i className="fa-regular fa-thumbs-up" />
                        </button>

                        <button
                          type="button"
                          className="msg-tool-btn"
                          onClick={() => alert("Hệ thống đã ghi nhận phản hồi để tối ưu mô hình RAG!")}
                          title="Cần cải thiện"
                        >
                          <i className="fa-regular fa-thumbs-down" />
                        </button>

                        <button
                          type="button"
                          className="msg-tool-btn"
                          onClick={() => handleSpeak(msg.text)}
                          title="Đọc bằng giọng nói tiếng Việt"
                        >
                          <i className="fa-solid fa-volume-high" />
                          <span>Đọc</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Trạng thái đang suy nghĩ */}
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

        {/* Thanh Nhập Liệu Ở Đáy */}
        <footer className="ai-chat-bottom-input">
          {/* Tệp đính kèm xem trước */}
          {attachedFile && (
            <div className="attached-file-preview">
              <i className="fa-solid fa-paperclip" />
              <span className="attached-name">{attachedFile.name}</span>
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
            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setAttachedFile(e.target.files[0]);
                }
              }}
              accept=".pdf,.doc,.docx,.txt"
            />

            {/* Nút Đính kèm file */}
            <button
              type="button"
              className="input-tool-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Đính kèm tài liệu (PDF, Word, TXT) để AI đọc & phân tích"
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
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isGenerating}
            />

            {/* Nút Nhập giọng nói */}
            <button
              type="button"
              className={`input-tool-btn voice-btn ${isListening ? "listening" : ""}`}
              onClick={handleToggleVoice}
              title={isListening ? "Đang lắng nghe... (Nhấp để dừng)" : "Nhập bằng giọng nói tiếng Việt"}
            >
              <i className="fa-solid fa-microphone" />
            </button>

            {/* Nút Gửi */}
            <button
              type="button"
              className="send-message-btn"
              disabled={(!inputVal.trim() && !attachedFile) || isGenerating}
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

      {/* ── Document Preview Modal ────────────────────────────── */}
      {previewFilename && (
        <DocumentPreviewModal
          filename={previewFilename}
          onClose={() => setPreviewFilename(null)}
        />
      )}

      {/* ── AI Settings Modal ─────────────────────────────────── */}
      {showSettingsModal && (
        <AISettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSaved={(newConfig) => {
            setAiConfig(newConfig);
          }}
        />
      )}
    </div>
  );
}
