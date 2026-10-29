import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import AlertModal from '@components/common/AlertModal';
import { ActivePageId } from '@app-types/navigation';
import {
  uploadDocumentAsync,
  getUploadProgress,
  askQuestion,
  getDocuments,
  getCategories,
  getDocumentFile,
  deleteDocuments,
  deleteDocument,
  previewDocument,
  getAISettings,
} from '../../api';
import AISettingsModal from '../../components/AISettingsModal';
import { t as translate, useTranslation, type SupportedLanguage } from '@i18n/translate';
import '@styles/ai-chat.css';

interface AiAssistantPageProps {
  onNavigate?: (page: ActivePageId) => void;
}

interface CitationSource {
  file_name?: string;
  page?: number | string;
  section?: string | number;
  chunk_id?: string | number;
  source_type?: string;
  score?: number;
  label?: string;
  code?: string;
  targetPage?: ActivePageId;
  type?: 'incoming' | 'outgoing' | 'confidential' | 'approval';
}

interface TargetDocInfo {
  filename: string;
  label?: string;
  category?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  citations?: CitationSource[];
  quickPrompts?: string[];
  targetDoc?: TargetDocInfo;
}

interface ChatSession {
  id: string;
  title: string;
  timeLabel: 'Hôm nay' | 'Hôm qua' | '7 ngày trước';
  snippet: string;
  messages: ChatMessage[];
}

interface DocItem {
  filename: string;
  category?: string;
  uploaded_at?: string;
  size?: number;
  file_type?: string;
}

interface CategoryItem {
  name: string;
  count: number;
}

export interface SubFolderGroup {
  name: string;
  docs: DocItem[];
}

export interface RootFolderGroup {
  name: string;
  subFolders: Record<string, SubFolderGroup>;
  directDocs: DocItem[];
  totalCount: number;
}

const EMPTY_MESSAGES: ChatMessage[] = [];

function createMessageTimestamp(): number {
  return Date.now();
}

interface AIConfig {
  provider?: string;
  llm_model?: string;
  api_key?: string;
  [key: string]: unknown;
}

interface UploadProgress {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

interface ApiError {
  message?: unknown;
  response?: { data?: { detail?: unknown } };
}

interface SpeechRecognitionResultEvent extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;

  const apiError = error as ApiError;
  const detail = apiError.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  return typeof apiError.message === 'string' ? apiError.message : fallback;
}

function parseChatSessions(raw: string | null): ChatSession[] | null {
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return null;

    // Tự động kiểm tra và chuẩn hóa tiêu đề cho các phiên:
    // Nếu tiêu đề là tiêu đề chung/mặc định mà phiên đã có câu hỏi user đầu tiên,
    // tự động lấy câu hỏi đầu tiên đó làm tiêu đề!
    return list.map((s: ChatSession) => {
      const isDefaultTitle =
        !s.title ||
        s.title === 'Tra cứu quy trình & văn bản' ||
        s.title.startsWith('Hội thoại mới') ||
        s.title === 'Cuộc trò chuyện mới';

      if (isDefaultTitle && Array.isArray(s.messages)) {
        const firstUserMsg = s.messages.find((m) => m.sender === 'user');
        if (firstUserMsg && firstUserMsg.text && firstUserMsg.text.trim()) {
          return {
            ...s,
            title: firstUserMsg.text.trim(),
          };
        }
      }
      return s;
    });
  } catch {
    return null;
  }
}

function createDefaultSession(id: string = 'session-default', lang: SupportedLanguage = 'vi'): ChatSession {
  const tr = (key: string) => translate(key, undefined, lang);
  return {
    id,
    title: tr('aiAssistant.defaultSession.title'),
    timeLabel: 'Hôm nay',
    snippet: tr('aiAssistant.defaultSession.snippet'),
    messages: [
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'ai',
        text: tr('aiAssistant.defaultSession.welcome'),
        time: new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }),
        quickPrompts: [1, 2, 3, 4].map((i) => tr(`aiAssistant.defaultSession.quickPrompt${i}`)),
      },
    ],
  };
}

// 4 Thẻ gợi ý chuẩn nhận diện thương hiệu TLBM; nội dung dịch nằm ở aiAssistant.templates.<key>
const PROMPT_TEMPLATES = [
  {
    key: 'incoming',
    icon: 'fa-inbox',
    iconClass: 'text-primary bg-primary-subtle border-primary/30',
  },
  {
    key: 'confidential',
    icon: 'fa-shield-halved',
    iconClass: 'text-danger bg-danger-subtle border-danger/30',
  },
  {
    key: 'signing',
    icon: 'fa-file-signature',
    iconClass: 'text-warning-text bg-warning-subtle border-warning/30',
  },
  {
    key: 'organization',
    icon: 'fa-sitemap',
    iconClass: 'text-success bg-success-subtle border-success/30',
  },
];

function getSessionUser() {
  try {
    const raw = localStorage.getItem('tlbm_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        username: parsed.username || 'admin',
        fullName: parsed.fullName || parsed.full_name || 'Huỳnh Vương Thanh Nhã',
        role: parsed.roleTitle || translate('aiAssistant.msg.defaultRole'),
        isAdmin: parsed.role === 'admin' || parsed.username === 'admin',
      };
    }
  } catch {
    // fallback
  }
  return {
    username: 'admin',
    fullName: 'Huỳnh Vương Thanh Nhã',
    role: translate('aiAssistant.msg.defaultRole'),
    isAdmin: false,
  };
}

// Formatter Markdown Inline
function formatInline(str: string = '') {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index}>{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts.length > 0 ? parts : str;
}

// Formatter Markdown đa dòng
function FormattedMessage({ text = '' }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="ps-3 mb-2 space-y-1 list-disc list-inside text-sm">
          {listItems.map((item, idx) => (
            <li key={idx} className="mb-0.5">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${lineIdx}`} className="bubble-h4 text-base font-bold my-2 text-primary">
          {trimmed.replace('### ', '')}
        </h4>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const textContent = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
      listItems.push(formatInline(textContent));
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<div key={`br-${lineIdx}`} className="h-2 my-1" />);
      } else {
        elements.push(
          <p key={`p-${lineIdx}`} className="bubble-p text-sm leading-relaxed mb-1.5">
            {formatInline(line)}
          </p>
        );
      }
    }
  });
  flushList();

  return <div className="message-content">{elements}</div>;
}

// Modal Xem Trước Tài Liệu
interface PreviewModalProps {
  filename: string;
  onClose: () => void;
}

interface PreviewData {
  full_text?: string;
  render_mode?: 'pdf' | 'text';
  file_url?: string;
  file_type?: string;
  total_pages?: number;
  pages?: Array<{ page?: number; text: string }>;
}

function DocumentPreviewModal({ filename, onClose }: PreviewModalProps) {
  const { t, currentLang } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<PreviewData | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'full' | 'pages'>('full');

  let displayTitle = filename;
  let breadcrumb = '';
  const match = filename.match(/^([A-Za-z0-9]+)_([A-Za-z0-9]+)_(.+)$/);
  if (match) {
    breadcrumb = `${match[1]} / ${match[2]}`;
    displayTitle = match[3];
  }

  const isDocx = filename.toLowerCase().endsWith('.docx');
  const isPdf = data?.render_mode === 'pdf' || filename.toLowerCase().endsWith('.pdf');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    previewDocument(filename)
      .then((res: PreviewData) => {
        if (!cancelled) {
          setData(res);
          setError('');
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const resErr = err as { response?: { data?: { detail?: string } }; message?: string };
          const msg = resErr.response?.data?.detail || resErr.message || translate('aiAssistant.inline.unableToLoadDocumentContent', undefined, currentLang);
          setError(msg);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filename, currentLang]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCopyAll = async () => {
    if (!data?.full_text) return;
    try {
      await navigator.clipboard.writeText(data.full_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await getDocumentFile(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = displayTitle;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t('aiAssistant.inline.unableToDownloadFile'));
    }
  };

  useEffect(() => {
    if (!isPdf) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    getDocumentFile(filename)
      .then((file) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const resErr = err as { message?: string };
          setError(resErr.message || translate('aiAssistant.inline.unableToLoadPdfFile', undefined, currentLang));
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filename, isPdf, currentLang]);

  const fileUrl = isPdf ? pdfUrl : null;
  const iconClass = isPdf ? 'icon-pdf' : isDocx ? 'icon-docx' : 'icon-txt';
  const iconFa = isPdf ? 'fa-file-pdf' : isDocx ? 'fa-file-word' : 'fa-file-lines';

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <div
        className={`preview-panel ${isPdf ? 'preview-panel-pdf' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Thanh Công Cụ */}
        <div className="preview-header">
          <div className="preview-title-area">
            <div className={`preview-title-icon ${iconClass}`}>
              <i className={`fa-solid ${iconFa}`} />
            </div>
            <div className="preview-title-text-group">
              {breadcrumb && (
                <div className="preview-breadcrumb">
                  <i className="fa-regular fa-folder me-1" />
                  <span>{breadcrumb}</span>
                </div>
              )}
              <div className="preview-filename" title={filename}>
                {displayTitle}
              </div>
              {data && (
                <div className="preview-meta">
                  <span className="preview-badge badge-type">{data.file_type || (isPdf ? 'PDF' : 'DOCX')}</span>
                  {!isPdf && data.total_pages ? (
                    <span className="preview-badge badge-pages">
                      <i className="fa-solid fa-layer-group me-1" />
                      {t('aiAssistant.previewModal.byParts', { count: data.total_pages })}
                    </span>
                  ) : null}
                  <span className="preview-badge badge-size" title={t('aiAssistant.previewModal.fileArchive')}>
                    <i className="fa-solid fa-file-code me-1" />
                    {filename}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="preview-header-actions">
            {data && !isPdf && (
              <button
                type="button"
                className="preview-action-btn copy-btn"
                onClick={handleCopyAll}
                title={t('aiAssistant.previewModal.copyAll')}
              >
                <i className={`fa-solid ${copied ? 'fa-check text-success' : 'fa-copy'}`} />
                <span>{copied ? t('aiAssistant.previewModal.copied') : t('aiAssistant.previewModal.copyAll')}</span>
              </button>
            )}

            <button
              type="button"
              className="preview-action-btn download-btn"
              onClick={handleDownload}
              title={t('aiAssistant.previewModal.download')}
            >
              <i className="fa-solid fa-download" />
              <span>{t('aiAssistant.previewModal.download')}</span>
            </button>

            {isPdf && fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="preview-action-btn open-tab-btn"
                title={t('aiAssistant.previewModal.openNewTab')}
              >
                <i className="fa-solid fa-arrow-up-right-from-square" />
                <span>{t('aiAssistant.previewModal.openNewTab')}</span>
              </a>
            )}

            <button
              type="button"
              className="preview-close-btn"
              onClick={onClose}
              title={t('aiAssistant.previewModal.close')}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        {/* Tab chuyển đổi toàn văn vs phân đoạn */}
        {data && !isPdf && (data.total_pages || 0) > 1 && (
          <div className="preview-tabs">
            <button
              type="button"
              className={`preview-tab ${activeTab === 'full' ? 'active' : ''}`}
              onClick={() => setActiveTab('full')}
            >
              <i className="fa-solid fa-align-left me-1" />
              {t('aiAssistant.previewModal.fullText')}
            </button>
            <button
              type="button"
              className={`preview-tab ${activeTab === 'pages' ? 'active' : ''}`}
              onClick={() => setActiveTab('pages')}
            >
              <i className="fa-solid fa-layer-group me-1" />
              {t('aiAssistant.previewModal.byParts', { count: data.total_pages })}
            </button>
          </div>
        )}

        {/* Khung nội dung tài liệu */}
        <div className="preview-body">
          {loading && (
            <div className="d-flex align-items-center justify-content-center p-5 text-secondary flex-1">
              <span className="spinner-border spinner-border-sm me-2 text-primary" />
              {t('aiAssistant.previewModal.loading')}
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 m-3">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          {data && !loading && isPdf && fileUrl && (
            <div className="preview-pdf-container">
              <iframe src={fileUrl} className="preview-pdf-iframe" title={displayTitle} />
            </div>
          )}

          {data && !loading && !isPdf && activeTab === 'full' && (
            <div className="preview-paper">
              <div className="preview-paper-content">
                {data.full_text || t('aiAssistant.previewModal.noContent')}
              </div>
            </div>
          )}

          {data && !loading && !isPdf && activeTab === 'pages' && data.pages && (
            <div className="preview-pages-container">
              {data.pages.map((page, idx) => (
                <div key={idx} className="preview-page-card">
                  <div className="preview-page-header">
                    <i className="fa-solid fa-bookmark me-1" />
                    {t('aiAssistant.previewModal.part', { num: page.page || idx + 1 })}
                  </div>
                  <div className="preview-paper-content">
                    {page.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component Hộp Trích Dẫn Văn Bản
function CitationsBox({
  sources,
  onPreview,
  onNavigate,
}: {
  sources?: CitationSource[];
  onPreview?: (filename: string) => void;
  onNavigate?: (page: ActivePageId) => void;
}) {
  const { t } = useTranslation();
  if (!sources || sources.length === 0) return null;

  return (
    <div className="ai-citations-box">
      <div className="citations-title">
        <i className="fa-solid fa-link" />
        <span>{t('aiAssistant.citations')}</span>
      </div>

      <div className="citations-list">
        {sources.map((src, idx) => {
          const defaultDocLabel = t('aiAssistant.inline.documentValue', { value: idx + 1 });
          const fileName = src.file_name || src.label || defaultDocLabel;
          const code = src.code || (src.page ? `${t('aiAssistant.inline.page')}${src.page}` : src.section ? `${t('aiAssistant.inline.section')}${src.section}` : `${t('aiAssistant.inline.part')}#${idx + 1}`);

          const isConfidential =
            src.type === 'confidential' ||
            fileName.toLowerCase().includes('mat') ||
            fileName.toLowerCase().includes('tuyet_mat');
          const isBusinessSpec = src.source_type === 'business_spec';

          const handleClick = () => {
            const sourcePage: Partial<Record<string, ActivePageId>> = {
              vanbanden: 'documents_incoming' as ActivePageId,
              vanbandi: 'documents_outgoing' as ActivePageId,
              tailieu: 'resources' as ActivePageId,
            };
            const targetPage = src.targetPage || sourcePage[src.source_type || ''];
            if (targetPage && onNavigate) {
              onNavigate(targetPage);
            } else if (!src.source_type && src.file_name && onPreview) {
              onPreview(src.file_name);
            }
          };

          return (
            <button
              key={idx}
              type="button"
              className={`citation-pill ${isConfidential ? 'confidential' : ''} ${isBusinessSpec ? 'business-spec' : ''} ${src.type || ''}`}
              onClick={handleClick}
              title={`${t('aiAssistant.viewDocument')}: ${fileName}`}
            >
              <i
                className={`fa-solid ${
                  isConfidential
                    ? 'fa-shield-halved'
                    : isBusinessSpec
                    ? 'fa-diagram-project'
                    : fileName.toLowerCase().endsWith('.pdf')
                    ? 'fa-file-pdf'
                    : 'fa-file-lines'
                }`}
              />
              <span className="citation-name">{fileName}</span>
              {isBusinessSpec && <span className="citation-code">Spec</span>}
              <span className="citation-code">{code}</span>
              <i className="fa-solid fa-arrow-up-right-from-square citation-ext-icon" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Component Chính AiAssistantPage
export default function AiAssistantPage({ onNavigate }: AiAssistantPageProps) {
  const { t, currentLang } = useTranslation();
  const currentUser = getSessionUser();
  // Sidebar & Responsive states (Tự động thu gọn trên thiết bị di động <= 860px)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 860;
    }
    return false;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 860;
    }
    return true;
  });

  // Tự động đóng mở sidebar và cập nhật isMobile khi chuyển đổi giữa Desktop và Mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 860px)');
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setIsSidebarOpen(!e.matches);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  const [sidebarTab, setSidebarTab] = useState<'sessions' | 'docs'>('sessions');
  const [sessionSearch, setSessionSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [collapsedRoots, setCollapsedRoots] = useState<Record<string, boolean>>({});
  const [collapsedSubs, setCollapsedSubs] = useState<Record<string, boolean>>({});

  const toggleRoot = (rootName: string) => {
    setCollapsedRoots((prev) => ({
      ...prev,
      [rootName]: !prev[rootName],
    }));
  };

  const toggleSub = (subKey: string) => {
    setCollapsedSubs((prev) => ({
      ...prev,
      [subKey]: !prev[subKey],
    }));
  };

  // Khóa lưu trữ cục bộ riêng biệt theo tài khoản để cách ly dữ liệu
  const storageKey = currentUser?.username
    ? `tlbm_chat_sessions_${currentUser.username}`
    : 'tlbm_chat_sessions_v2';

  // Sessions state (Đọc từ localStorage với fallback thông minh)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    // 1. Đọc sessions riêng của tài khoản hiện tại
    const savedForUser = parseChatSessions(localStorage.getItem(storageKey));
    if (savedForUser && savedForUser.length > 0) return savedForUser;

    // 2. Fallback đọc dữ liệu phiên bản trước (v2)
    const savedLegacy = parseChatSessions(localStorage.getItem('tlbm_chat_sessions_v2'));
    if (savedLegacy && savedLegacy.length > 0) return savedLegacy;

    // 3. Khởi tạo phiên mặc định ban đầu
    return [createDefaultSession('session-default', currentLang)];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedForUser = parseChatSessions(localStorage.getItem(storageKey));
    if (savedForUser && savedForUser.length > 0) return savedForUser[0].id;

    const savedLegacy = parseChatSessions(localStorage.getItem('tlbm_chat_sessions_v2'));
    if (savedLegacy && savedLegacy.length > 0) return savedLegacy[0].id;

    return 'session-default';
  });

  // Tự động đồng bộ và lưu sessions vào localStorage khi có thay đổi
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(sessions));
      localStorage.setItem('tlbm_chat_sessions_v2', JSON.stringify(sessions));
    }
  }, [sessions, storageKey]);

  // Luôn đảm bảo activeSession trỏ đúng tới phiên đang chọn (hoặc phiên đầu tiên)
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  const messages = activeSession?.messages || EMPTY_MESSAGES;

  // Knowledge base state
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [previewFilename, setPreviewFilename] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);

  // Chat input states
  const [inputVal, setInputVal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aiAlertOpen, setAiAlertOpen] = useState(false);
  const [aiAlertMsg, setAiAlertMsg] = useState('');
  const [targetDocument, setTargetDocument] = useState<TargetDocInfo | null>(null);
  const [isChatDragOver, setIsChatDragOver] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Giải phóng pollTimerRef khi unmount tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  // Tự động co giãn chiều cao textarea theo nội dung, loại bỏ thanh cuộn
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > 0) {
        textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
      }
    }
  }, [inputVal]);

  // Load tài liệu & cấu hình ban đầu
  const loadDocuments = useCallback(async () => {
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Lỗi tải danh sách tài liệu:', err);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    await loadDocuments();
    await loadCategories();
  }, [loadDocuments, loadCategories]);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data.categories || []);
      })
      .catch(console.error);

    getAISettings()
      .then((data) => {
        if (!cancelled) setAiConfig(data);
      })
      .catch(console.error);

    getDocuments()
      .then((data) => {
        if (!cancelled) setDocuments(data.documents || []);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Tạo phiên chat mới
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = createDefaultSession(newId, currentLang);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setInputVal('');
    if (typeof window !== 'undefined' && window.innerWidth <= 860) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('aiAssistant.deleteSessionConfirm'))) {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        if (updated.length === 0) {
          const freshId = `session-${Date.now()}`;
          const freshSession = createDefaultSession(freshId, currentLang);
          setActiveSessionId(freshId);
          return [freshSession];
        }
        if (activeSessionId === id) {
          setActiveSessionId(updated[0].id);
        }
        return updated;
      });
    }
  };

  // Upload file và theo dõi tiến độ
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Hủy bỏ polling timer cũ nếu đang chạy
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    try {
      setUploadProgress({
        status: 'uploading',
        message: t('aiAssistant.inline.uploadingFileName', { name: file.name }),
      });
      const res = await uploadDocumentAsync(file);

      if (res.job_id) {
        const jobId = res.job_id;
        pollTimerRef.current = setInterval(async () => {
          try {
            const prog = await getUploadProgress(jobId);
            setUploadProgress(prog);

            const isSuccess = prog.status === 'done' || prog.status === 'completed';
            const isFailed = prog.status === 'error' || prog.status === 'failed';

            if (isSuccess || isFailed) {
              if (pollTimerRef.current !== null) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }

              if (isSuccess) {
                // Tự động tải lại danh sách tài liệu NGAY LẬP TỨC
                await refreshDocuments();
                // Giữ badge báo thành công trong 2.5s rồi tự đóng
                setTimeout(() => {
                  setUploadProgress(null);
                }, 2500);
              } else {
                // Báo lỗi và tự đóng sau 4s
                setTimeout(() => {
                  setUploadProgress(null);
                }, 4000);
              }
            }
          } catch {
            if (pollTimerRef.current !== null) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            setUploadProgress(null);
          }
        }, 1200);
      } else {
        await refreshDocuments();
        setUploadProgress({
          status: 'done',
          message: t('aiAssistant.inline.uploadAndIndexingSuccessful'),
        });
        setTimeout(() => {
          setUploadProgress(null);
        }, 2500);
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, t('aiAssistant.inline.failedToUploadDocument')));
      setUploadProgress(null);
    }
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteDoc = async (filename: string) => {
    if (confirm(t('aiAssistant.deleteDocConfirm', { filename }))) {
      try {
        await deleteDocument(filename);
        await refreshDocuments();
      } catch (err: unknown) {
        alert(getErrorMessage(err, t('aiAssistant.inline.failedToDeleteDocument')));
      }
    }
  };

  const handleClearAllDocs = async () => {
    if (confirm(t('aiAssistant.clearAllDocsConfirm'))) {
      try {
        await deleteDocuments();
        await refreshDocuments();
      } catch (err: unknown) {
        alert(getErrorMessage(err, t('aiAssistant.inline.failedToClearDocuments')));
      }
    }
  };

  // Gửi câu hỏi đến AI
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputVal).trim();
    if (!text) return;

    const messageTimestamp = createMessageTimestamp();
    const userMsg: ChatMessage = {
      id: `user-${activeSessionId}-${messageTimestamp}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      targetDoc: targetDocument || undefined,
    };

    const currentMessages = activeSession?.messages || [];
    const newMessages = [...currentMessages, userMsg];

    // YÊU CẦU 1 & 2:
    // Kiểm tra xem trong phiên này người dùng đã gửi câu hỏi nào trước đó chưa
    const isFirstQuestion = !currentMessages.some((m) => m.sender === 'user');

    // Tiêu đề cuộc trò chuyện được tạo từ câu hỏi đầu tiên của người dùng.
    // Với những câu hỏi tiếp theo trong cùng cuộc trò chuyện, giữ nguyên tiêu đề ban đầu.
    const updatedTitle = isFirstQuestion ? text : (activeSession?.title || text);

    // Đoạn xem trước ngắn (snippet)
    const initialSnippet = text.length > 55 ? text.slice(0, 55) + '...' : text;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              snippet: initialSnippet,
              messages: newMessages,
            }
          : s
      )
    );

    setInputVal('');
    setIsGenerating(true);

    try {
      // Chuẩn bị lịch sử chat cho Backend (chỉ lấy các tin nhắn user và ai thực tế)
      const history = newMessages
        .filter((m) => !m.id.startsWith('msg-welcome'))
        .slice(-8)
        .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

      const res = await askQuestion(text, history, selectedCategory || null, targetDocument?.filename || null);

      const aiText = res.answer || res.text || t('aiAssistant.msg.noModelResponse');
      const aiMsg: ChatMessage = {
        id: `ai-${activeSessionId}-${messageTimestamp}`,
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        citations: res.sources || res.citations || [],
        quickPrompts: [
          t('aiAssistant.msg.followUpSummary'),
          t('aiAssistant.msg.followUpFigures'),
          t('aiAssistant.msg.followUpBasis'),
        ],
      };

      // Tạo snippet xem trước sạch đẹp từ câu trả lời của AI
      const cleanAiText = aiText.replace(/[*#`_\n]/g, ' ').replace(/\s+/g, ' ').trim();
      const updatedSnippet = cleanAiText
        ? (cleanAiText.length > 65 ? cleanAiText.slice(0, 65) + '...' : cleanAiText)
        : initialSnippet;

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                snippet: updatedSnippet,
                messages: [...newMessages, aiMsg],
              }
            : s
        )
      );
    } catch (err: unknown) {
      console.warn('Backend call failed:', err);
      const aiMsg: ChatMessage = {
        id: `ai-${activeSessionId}-${messageTimestamp}`,
        sender: 'ai',
        text: getErrorMessage(err, t('aiAssistant.msg.aiUnavailable')),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...newMessages, aiMsg] }
            : s
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Đọc to câu trả lời bằng giọng nói tiếng Việt
  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(t('aiAssistant.msg.ttsUnsupported'));
    }
  };

  // Nhận diện giọng nói tiếng Việt (Web Speech API)
  const handleToggleVoice = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('aiAssistant.msg.speechUnsupported'));
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputVal((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  // Xuất file Markdown
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

  // Lọc danh sách phiên hội thoại theo từ khóa (Tiêu đề, Câu hỏi user, Nội dung tin nhắn)
  const filteredSessions = sessions.filter((s) => {
    if (!sessionSearch.trim()) return true;
    const query = sessionSearch.trim().toLowerCase();

    // 1. Tìm theo tiêu đề cuộc trò chuyện
    if (s.title && s.title.toLowerCase().includes(query)) return true;

    // 2. Tìm theo đoạn trích xem trước (snippet)
    if (s.snippet && s.snippet.toLowerCase().includes(query)) return true;

    // 3. Tìm theo nội dung các tin nhắn (câu hỏi và câu trả lời) trong phiên
    if (s.messages && Array.isArray(s.messages)) {
      return s.messages.some((m) => m.text && m.text.toLowerCase().includes(query));
    }

    return false;
  });

  // Lọc và gom nhóm tài liệu theo thư mục
  const filteredDocs = documents.filter((d) => {
    if (!docSearch.trim()) return true;
    const q = docSearch.toLowerCase();
    return (
      (d.filename && d.filename.toLowerCase().includes(q)) ||
      (d.category && d.category.toLowerCase().includes(q))
    );
  });

  const hierarchicalDocs: Record<string, RootFolderGroup> = useMemo(() => {
    const groups: Record<string, RootFolderGroup> = {};

    for (const doc of filteredDocs) {
      let rootName: string;
      let subName: string;
      if (doc.category && (doc.category.includes('/') || doc.category.includes('>'))) {
        const parts = doc.category.split(/[/|>]/).map((s) => s.trim());
        rootName = parts[0] || 'Folder';
        subName = parts[1] || 'folder1';
      } else {
        const match = doc.filename.match(/^([A-Za-z0-9]+)_([A-Za-z0-9]+)_(.+)$/);
        if (match) {
          rootName = match[1];
          subName = match[2];
        } else if (doc.category && doc.category !== 'Chưa phân loại') {
          rootName = 'Folder';
          subName = doc.category;
        } else {
          rootName = 'Folder';
          subName = 'folder1';
        }
      }

      if (!groups[rootName]) {
        groups[rootName] = {
          name: rootName,
          subFolders: {},
          directDocs: [],
          totalCount: 0,
        };
      }

      groups[rootName].totalCount += 1;

      if (subName) {
        if (!groups[rootName].subFolders[subName]) {
          groups[rootName].subFolders[subName] = {
            name: subName,
            docs: [],
          };
        }
        groups[rootName].subFolders[subName].docs.push(doc);
      } else {
        groups[rootName].directDocs.push(doc);
      }
    }

    return groups;
  }, [filteredDocs]);

  return (
    <div className="ai-chat-page-root">
      {/* Backdrop overlay khi mở Sidebar trên điện thoại */}
      {isSidebarOpen && (
        <div
          className="ai-sidebar-mobile-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label={t('aiAssistant.msg.closeSidebar')}
        />
      )}

      {/* ====================================================================
         1. SIDEBAR (LỊCH SỬ CHAT & KHO TÀI LIỆU)
         ==================================================================== */}
      <aside className={`ai-chat-sidebar ${isSidebarOpen ? 'is-open' : 'is-collapsed'}`}>
        {/* Nút Tạo đoạn chat mới & Thu gọn */}
        <div className="ai-sidebar-top">
          <button type="button" className="new-chat-btn" onClick={handleNewChat}>
            <i className="fa-solid fa-plus" />
            <span>{t('aiAssistant.newChat')}</span>
          </button>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? t('aiAssistant.collapseSidebar') : t('aiAssistant.expandSidebar')}
          >
            <i className={`fa-solid ${isSidebarOpen ? 'fa-angles-left' : 'fa-angles-right'}`} />
          </button>
        </div>

        {/* Tab Switcher: Hội thoại vs Kho tài liệu */}
        {isSidebarOpen && (
          <div className="sidebar-tab-switcher">
            <button
              type="button"
              className={`sidebar-tab-pill ${sidebarTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setSidebarTab('sessions')}
            >
              <i className="fa-regular fa-message" />
              <span>{t('aiAssistant.tabSessions')}</span>
            </button>
            <button
              type="button"
              className={`sidebar-tab-pill ${sidebarTab === 'docs' ? 'active' : ''}`}
              onClick={() => setSidebarTab('docs')}
            >
              <i className="fa-solid fa-folder-open" />
              <span>{t('aiAssistant.tabDocs')}</span>
              {documents.length > 0 && <span className="sidebar-tab-badge">{documents.length}</span>}
            </button>
          </div>
        )}

        {/* Tab 1: Danh sách các phiên trò chuyện */}
        {isSidebarOpen && sidebarTab === 'sessions' && (
          <>
            <div className="ai-sidebar-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder={t('aiAssistant.searchSessionsPlaceholder')}
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
              />
              {sessionSearch && (
                <button
                  type="button"
                  className="sidebar-search-clear-btn"
                  onClick={() => setSessionSearch('')}
                  title={t('aiAssistant.clearSearch')}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            <div className="ai-sidebar-sessions-list">
              <div className="session-group">
                <div className="session-group-title">
                  <span>{t('aiAssistant.inline.chatHistory')}</span>
                  {sessions.length > 0 && (
                    <span className="session-count-badge">{sessions.length}</span>
                  )}
                </div>

                {filteredSessions.length === 0 ? (
                  <div className="sidebar-search-empty">
                    <i className="fa-regular fa-comments sidebar-search-empty-icon" />
                    <p className="sidebar-search-empty-text">
                      {sessionSearch.trim()
                        ? t('aiAssistant.emptySessionsSearch')
                        : t('aiAssistant.emptySessions')}
                    </p>
                  </div>
                ) : (
                  <div className="session-items">
                    {filteredSessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`session-item-btn ${s.id === activeSessionId ? 'active' : ''}`}
                        onClick={() => {
                          setActiveSessionId(s.id);
                          if (typeof window !== 'undefined' && window.innerWidth <= 860) {
                            setIsSidebarOpen(false);
                          }
                        }}
                        title={s.title}
                      >
                        <i className="fa-regular fa-message session-item-icon" />
                        <div className="session-item-text">
                          <div className="session-item-title" title={s.title}>
                            {s.title}
                          </div>
                          <div className="session-item-snippet" title={s.snippet}>
                            {s.snippet}
                          </div>
                        </div>
                        <span
                          className="session-item-delete"
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          title={t('aiAssistant.deleteSession')}
                        >
                          <i className="fa-solid fa-trash-can" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Quản lý kho tài liệu */}
        {isSidebarOpen && sidebarTab === 'docs' && (
          <>
            <div className="ai-sidebar-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder={t('aiAssistant.searchDocsPlaceholder')}
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
              />
              {docSearch && (
                <button
                  type="button"
                  className="sidebar-search-clear-btn"
                  onClick={() => setDocSearch('')}
                  title={t('aiAssistant.clearSearch')}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            <div className="ai-sidebar-docs-list">
              {/* Drag & Drop Upload Zone - Chỉ hiển thị cho Quản trị viên */}
              {currentUser.isAdmin && (
                <div
                  ref={dropZoneRef}
                  className={`sidebar-dropzone ${isDragging ? 'is-dragging' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDropFiles}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fa-solid fa-cloud-arrow-up sidebar-dropzone-icon" />
                  <div className="sidebar-dropzone-text">{t('aiAssistant.dropzoneText')}</div>
                  <div className="sidebar-dropzone-subtext">{t('aiAssistant.dropzoneSub')}</div>
                </div>
              )}

              {/* Progress indicator */}
              {uploadProgress && (
                <div
                  className={`sidebar-upload-progress ${
                    uploadProgress.status === 'done' || uploadProgress.status === 'completed'
                      ? 'is-success'
                      : uploadProgress.status === 'error' || uploadProgress.status === 'failed'
                      ? 'is-error'
                      : ''
                  }`}
                >
                  {uploadProgress.status === 'done' || uploadProgress.status === 'completed' ? (
                    <i className="fa-solid fa-circle-check text-success" />
                  ) : uploadProgress.status === 'error' || uploadProgress.status === 'failed' ? (
                    <i className="fa-solid fa-circle-exclamation text-danger" />
                  ) : (
                    <i className="fa-solid fa-circle-notch fa-spin text-primary" />
                  )}
                  <span>{uploadProgress.message}</span>
                </div>
              )}

              {/* Danh mục tài liệu theo cấu trúc Thư mục nhiều cấp */}
              {Object.keys(hierarchicalDocs).length === 0 ? (
                <div className="sidebar-empty-state">
                  <i className="fa-regular fa-folder-open sidebar-empty-icon" />
                  <div>{documents.length === 0 ? t('aiAssistant.emptyDocs') : t('aiAssistant.emptyDocsSearch')}</div>
                </div>
              ) : (
                Object.values(hierarchicalDocs).map((root: RootFolderGroup) => {
                  const isRootCollapsed = !!collapsedRoots[root.name];
                  return (
                    <div key={root.name} className={`sidebar-doc-category ${isRootCollapsed ? 'is-collapsed' : ''}`}>
                      {/* Thư mục gốc duy nhất (Level 1) */}
                      <div
                        className="sidebar-category-header"
                        onClick={() => toggleRoot(root.name)}
                        title={
                          isRootCollapsed
                            ? t('aiAssistant.inline.expandFolderName', { name: root.name })
                            : t('aiAssistant.inline.collapseFolderName', { name: root.name })
                        }
                      >
                        <div className="sidebar-category-title">
                          <i
                            className={`sidebar-chevron-icon fa-solid ${
                              isRootCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'
                            }`}
                          />
                          <i className="fa-solid fa-folder text-warning" />
                          <span className="sidebar-category-name" title={root.name}>
                            {root.name}
                          </span>
                        </div>
                        <span className="sidebar-category-count font-bold">
                          {root.totalCount}
                        </span>
                      </div>

                      {/* Danh sách các Folder nhỏ bên trong Thư mục gốc */}
                      {!isRootCollapsed && (
                        <div className="sidebar-root-content">
                          {Object.values(root.subFolders).map((sub: SubFolderGroup) => {
                            const subKey = `${root.name}_${sub.name}`;
                            const isSubCollapsed = !!collapsedSubs[subKey];
                            return (
                              <div
                                key={sub.name}
                                className={`sidebar-subfolder-card ${isSubCollapsed ? 'is-collapsed' : ''}`}
                              >
                                {/* Header của Folder nhỏ */}
                                <div
                                  className="sidebar-subfolder-header"
                                  onClick={() => toggleSub(subKey)}
                                  title={
                                    isSubCollapsed
                                      ? t('aiAssistant.inline.expandName', { name: sub.name })
                                      : t('aiAssistant.inline.collapseName', { name: sub.name })
                                  }
                                >
                                  <div className="sidebar-subfolder-title">
                                    <i
                                      className={`text-[10px] text-muted transition-transform fa-solid ${
                                        isSubCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'
                                      }`}
                                    />
                                    <i
                                      className={`fa-solid ${
                                        isSubCollapsed ? 'fa-folder text-warning' : 'fa-folder-open text-warning'
                                      } text-xs`}
                                    />
                                    <span className="sidebar-subfolder-name" title={sub.name}>
                                      {sub.name}
                                    </span>
                                  </div>
                                  <span className="sidebar-subfolder-count">
                                    {sub.docs.length}
                                  </span>
                                </div>

                                {/* Danh sách Item bên trong Folder nhỏ */}
                                {!isSubCollapsed && (
                                  <div className="sidebar-doc-list">
                                    {sub.docs.map((d) => {
                                      let itemLabel = d.filename;
                                      const match = d.filename.match(/^([A-Za-z0-9]+)_([A-Za-z0-9]+)_(.+)$/);
                                      if (match) itemLabel = match[3];

                                      return (
                                        <div
                                          key={d.filename}
                                          className={`sidebar-doc-row ${targetDocument?.filename === d.filename ? 'is-targeted' : ''}`}
                                          draggable={true}
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData(
                                              'application/x-tlbm-doc',
                                              JSON.stringify({ filename: d.filename, label: itemLabel, category: d.category })
                                            );
                                            e.dataTransfer.effectAllowed = 'copy';
                                          }}
                                          title={
                                            t('aiAssistant.inline.dragItemlabelToChatOr', { itemLabel })
                                          }
                                        >
                                          <div className="sidebar-doc-info" title={d.filename}>
                                            <i
                                              className={`sidebar-doc-icon fa-solid ${
                                                d.filename.toLowerCase().endsWith('.pdf')
                                                  ? 'fa-file-pdf text-danger'
                                                  : 'fa-file-lines text-primary'
                                              }`}
                                            />
                                            <span className="sidebar-doc-name">
                                              {itemLabel}
                                            </span>
                                          </div>
                                          <div className="sidebar-doc-actions">
                                            {/* Nút chỉ định nhanh */}
                                            <button
                                              type="button"
                                              className={`sidebar-doc-btn pin-btn ${targetDocument?.filename === d.filename ? 'is-active text-primary' : ''}`}
                                              onClick={() => setTargetDocument(
                                                targetDocument?.filename === d.filename ? null : { filename: d.filename, label: itemLabel, category: d.category }
                                              )}
                                              title={
                                                targetDocument?.filename === d.filename
                                                  ? (t('aiAssistant.inline.unpinTargetDocument'))
                                                  : (t('aiAssistant.inline.targetThisDocumentForQ'))
                                              }
                                            >
                                              <i className="fa-solid fa-crosshairs" />
                                            </button>
                                            <button
                                              type="button"
                                              className="sidebar-doc-btn"
                                              onClick={() => setPreviewFilename(d.filename)}
                                              title={t('aiAssistant.preview')}
                                            >
                                              <i className="fa-solid fa-eye" />
                                            </button>
                                            {currentUser.isAdmin && (
                                              <button
                                                type="button"
                                                className="sidebar-doc-btn delete-btn"
                                                onClick={() => handleDeleteDoc(d.filename)}
                                                title={t('aiAssistant.deleteDoc')}
                                              >
                                                <i className="fa-solid fa-trash" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Tài liệu cấp trực tiếp (nếu có) */}
                          {root.directDocs.length > 0 && (
                            <div className="sidebar-doc-list">
                              {root.directDocs.map((d) => (
                                <div
                                  key={d.filename}
                                  className={`sidebar-doc-row ${targetDocument?.filename === d.filename ? 'is-targeted' : ''}`}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData(
                                      'application/x-tlbm-doc',
                                      JSON.stringify({ filename: d.filename, label: d.filename, category: d.category })
                                    );
                                    e.dataTransfer.effectAllowed = 'copy';
                                  }}
                                  title={
                                    t('aiAssistant.inline.dragFilenameToChatOr', { filename: d.filename })
                                  }
                                >
                                  <div className="sidebar-doc-info" title={d.filename}>
                                    <i
                                      className={`sidebar-doc-icon fa-solid ${
                                        d.filename.toLowerCase().endsWith('.pdf')
                                          ? 'fa-file-pdf text-danger'
                                          : 'fa-file-lines text-primary'
                                      }`}
                                    />
                                    <span className="sidebar-doc-name">{d.filename}</span>
                                  </div>
                                  <div className="sidebar-doc-actions">
                                    <button
                                      type="button"
                                      className={`sidebar-doc-btn pin-btn ${targetDocument?.filename === d.filename ? 'is-active text-primary' : ''}`}
                                      onClick={() => setTargetDocument(
                                        targetDocument?.filename === d.filename ? null : { filename: d.filename, label: d.filename, category: d.category }
                                      )}
                                      title={
                                        targetDocument?.filename === d.filename
                                          ? (t('aiAssistant.inline.unpinTargetDocument'))
                                          : (t('aiAssistant.inline.targetThisDocumentForQ'))
                                      }
                                    >
                                      <i className="fa-solid fa-crosshairs" />
                                    </button>
                                    <button
                                      type="button"
                                      className="sidebar-doc-btn"
                                      onClick={() => setPreviewFilename(d.filename)}
                                      title={t('aiAssistant.preview')}
                                    >
                                      <i className="fa-solid fa-eye" />
                                    </button>
                                    <button
                                      type="button"
                                      className="sidebar-doc-btn delete-btn"
                                      onClick={() => handleDeleteDoc(d.filename)}
                                      title={t('aiAssistant.deleteDoc')}
                                    >
                                      <i className="fa-solid fa-trash" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {currentUser.isAdmin && documents.length > 0 && (
                <button
                  type="button"
                  className="sidebar-clear-all-btn"
                  onClick={handleClearAllDocs}
                >
                  <i className="fa-solid fa-trash-can" />
                  <span>{t('aiAssistant.clearAllDocs')}</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Sidebar Footer */}
        {isSidebarOpen && (
          <div className="ai-sidebar-footer">
            <div className="ai-stats-badge">
              <span className="live-pulse-dot" />
              <span>{t('aiAssistant.syncedDocs', { count: documents.length })}</span>
            </div>
            <div className="ai-partner-tag">{t('aiAssistant.smartDocSub')}</div>
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
                title={t('aiAssistant.expandSidebar')}
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
                  <span>{t('aiAssistant.pageTitle')}</span>
                  <span className="team-badge">LlamaIndex · ChromaDB</span>
                </div>
                <div className="ai-brand-sub">
                  {t('aiAssistant.pageSubtitle')}
                </div>
              </div>
            </div>
          </div>

          <div className="top-header-actions">
            {/* Bộ lọc chủ đề */}
            {categories.length > 0 && (
              <div className="model-selector-wrapper">
                <i className="fa-solid fa-filter text-primary" />
                <select
                  className="model-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">{t('aiAssistant.allCategories')} ({documents.length})</option>
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
              <div className="model-selector-wrapper hidden md:flex">
                <span className="live-pulse-dot" />
                <span className="text-uppercase font-bold">{aiConfig.provider || 'GEMINI'}</span>
                <span className="opacity-50">|</span>
                <span>{aiConfig.llm_model || 'gemini-3.8-flash'}</span>
              </div>
            )}

            {/* Nút Cài đặt AI */}
            {currentUser.isAdmin && (
              <button
                type="button"
                className="chat-action-btn"
                onClick={() => setShowSettingsModal(true)}
                title={t('aiAssistant.inline.aiModelApiKeySettings')}
              >
                <i className="fa-solid fa-gear" />
                <span className="hidden xl:inline">{t('aiAssistant.inline.aiSettings')}</span>
              </button>
            )}

            {/* Nút Xuất file */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={handleExportChat}
              title={t('aiAssistant.exportChat')}
            >
              <i className="fa-solid fa-download" />
              <span className="hidden xl:inline">{t('aiAssistant.inline.export')}</span>
            </button>

            {/* Nút Làm mới */}
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => {
                if (confirm(t('aiAssistant.inline.resetThisConversation'))) {
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId ? { ...s, messages: [s.messages[0]] } : s
                    )
                  );
                }
              }}
              title={t('aiAssistant.inline.resetConversation')}
            >
              <i className="fa-solid fa-rotate-left" />
            </button>
          </div>
        </header>

        {/* Vùng hiển thị tin nhắn (Scrollable) */}
        <div
          className={`ai-chat-viewport ${isChatDragOver ? 'is-chat-dragover-viewport' : ''}`}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('application/x-tlbm-doc')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              if (!isChatDragOver) setIsChatDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsChatDragOver(false);
            }
          }}
          onDrop={(e) => {
            const raw = e.dataTransfer.getData('application/x-tlbm-doc');
            if (raw) {
              e.preventDefault();
              e.stopPropagation();
              setIsChatDragOver(false);
              try {
                const doc = JSON.parse(raw);
                setTargetDocument(doc);
                textareaRef.current?.focus();
              } catch (err) {
                console.error(err);
              }
            }
          }}
        >
          {/* Lưới thẻ Prompt gợi ý ban đầu */}
          {messages.length <= 1 && (
            <div className="ai-prompt-grid-container">
              <div className="prompt-grid-header">
                <h3>{t('aiAssistant.inline.quickQASuggestionsFor')}</h3>
                <p>{t('aiAssistant.inline.clickAnyCardToAutomatically')}</p>
              </div>

              <div className="ai-prompt-cards-grid">
                {PROMPT_TEMPLATES.map((tmpl, idx) => (
                  <div
                    key={idx}
                    className="ai-prompt-card"
                    onClick={() => handleSend(t(`aiAssistant.templates.${tmpl.key}.query`))}
                  >
                    <div className={`prompt-card-icon border ${tmpl.iconClass}`}>
                      <i className={`fa-solid ${tmpl.icon}`} />
                    </div>
                    <div className="prompt-card-body">
                      <div className="prompt-card-title">{t(`aiAssistant.templates.${tmpl.key}.title`)}</div>
                      <div className="prompt-card-desc">{t(`aiAssistant.templates.${tmpl.key}.desc`)}</div>
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
                {/* Avatar */}
                <div className="message-avatar">
                  {msg.sender === 'user' ? (
                    <span className="user-avatar-text">{currentUser.fullName.charAt(0) || 'U'}</span>
                  ) : (
                    <i className="fa-solid fa-brain" />
                  )}
                </div>

                {/* Bong bóng tin nhắn */}
                <div className="message-content-wrapper">
                  <div className="message-header-meta">
                    <span className="sender-name">
                      {msg.sender === 'user'
                        ? currentUser.fullName
                        : t('aiAssistant.assistantSenderName', { provider: aiConfig?.provider ? aiConfig.provider.toUpperCase() : 'GPT-4o' })}
                    </span>
                    <span className="message-time">{msg.time}</span>
                  </div>

                  <div className="message-bubble-body">
                    {msg.sender === 'user' && msg.targetDoc && (
                      <div className="message-target-doc-tag">
                        <i className={`fa-solid ${msg.targetDoc.filename.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-lines'}`} />
                        <span>{msg.targetDoc.label || msg.targetDoc.filename}</span>
                      </div>
                    )}
                    <FormattedMessage text={msg.text} />

                    {/* Dẫn link web & văn bản trích dẫn */}
                    {msg.citations && msg.citations.length > 0 && (
                      <CitationsBox
                        sources={msg.citations}
                        onPreview={(fn) => setPreviewFilename(fn)}
                        onNavigate={onNavigate}
                      />
                    )}

                    {/* Câu hỏi gợi ý tiếp theo (Follow-up prompts) */}
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
                        title={t('aiAssistant.copy')}
                      >
                        <i className={`fa-solid ${copiedId === msg.id ? 'fa-check' : 'fa-copy'}`} />
                        <span>{copiedId === msg.id ? t('aiAssistant.copied') : t('aiAssistant.copy')}</span>
                      </button>

                      <button
                        type="button"
                        className="msg-tool-btn"
                        onClick={() => {
                          setAiAlertMsg(
                            t('aiAssistant.inline.thankYouForYourHelpful')
                          );
                          setAiAlertOpen(true);
                        }}
                        title={t('aiAssistant.inline.helpful')}
                      >
                        <i className="fa-regular fa-thumbs-up" />
                      </button>

                      <button
                        type="button"
                        className="msg-tool-btn"
                        onClick={() => {
                          setAiAlertMsg(
                            t('aiAssistant.inline.systemRecordedYourFeedbackTo')
                          );
                          setAiAlertOpen(true);
                        }}
                        title={t('aiAssistant.inline.needsImprovement')}
                      >
                        <i className="fa-regular fa-thumbs-down" />
                      </button>

                      <button
                        type="button"
                        className="msg-tool-btn"
                        onClick={() => handleSpeakText(msg.text)}
                        title={t('aiAssistant.readAloud')}
                      >
                        <i className="fa-solid fa-volume-high" />
                        <span>{t('aiAssistant.inline.read')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Trạng thái AI đang suy nghĩ / tra cứu */}
            {isGenerating && (
              <div className="ai-chat-message-row is-ai">
                <div className="message-avatar">
                  <i className="fa-solid fa-brain" />
                </div>
                <div className="message-content-wrapper">
                  <div className="ai-thinking-card">
                    <span className="thinking-spinner" />
                    <span>
                      {t('aiAssistant.inline.aiAssistantIsSearchingThe')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 3. THANH NHẬP LIỆU Ở ĐÁY */}
        <footer
          className={`ai-chat-bottom-input ${isChatDragOver ? 'is-chat-dragover' : ''}`}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('application/x-tlbm-doc')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              if (!isChatDragOver) setIsChatDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsChatDragOver(false);
            }
          }}
          onDrop={(e) => {
            const raw = e.dataTransfer.getData('application/x-tlbm-doc');
            if (raw) {
              e.preventDefault();
              e.stopPropagation();
              setIsChatDragOver(false);
              try {
                const doc = JSON.parse(raw);
                setTargetDocument(doc);
                textareaRef.current?.focus();
              } catch (err) {
                console.error(err);
              }
            }
          }}
        >
          {/* Huy hiệu chỉ định tài liệu tra cứu riêng (Target Document) */}
          {targetDocument && (
            <div className="target-doc-pinned-badge">
              <div className="target-doc-badge-left">
                <i
                  className={`fa-solid ${
                    targetDocument.filename.toLowerCase().endsWith('.pdf')
                      ? 'fa-file-pdf text-danger'
                      : 'fa-file-lines text-primary'
                  }`}
                />
                <span className="target-doc-label" title={targetDocument.filename}>
                  {targetDocument.label || targetDocument.filename}
                </span>
                <span className="target-doc-tag">
                  {t('aiAssistant.inline.targeted')}
                </span>
              </div>
              <button
                type="button"
                className="target-doc-remove-btn"
                onClick={() => setTargetDocument(null)}
                title={t('aiAssistant.inline.clearTargetedDocument')}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          )}

          {/* Gợi ý khi đang kéo tệp qua thanh chat */}
          {isChatDragOver && (
            <div className="chat-drag-cue">
              <i className="fa-solid fa-crosshairs text-primary fa-bounce" />
              <span>
                {t('aiAssistant.inline.dropToTargetThisDocument')}
              </span>
            </div>
          )}

          {/* Thông báo tiến độ khi upload tệp trực tiếp */}
          {uploadProgress && (
            <div
              className={`chat-upload-indicator ${
                uploadProgress.status === 'done' || uploadProgress.status === 'completed'
                  ? 'is-success'
                  : uploadProgress.status === 'error' || uploadProgress.status === 'failed'
                  ? 'is-error'
                  : ''
              }`}
            >
              {uploadProgress.status === 'done' || uploadProgress.status === 'completed' ? (
                <i className="fa-solid fa-circle-check text-success" />
              ) : uploadProgress.status === 'error' || uploadProgress.status === 'failed' ? (
                <i className="fa-solid fa-circle-exclamation text-danger" />
              ) : (
                <i className="fa-solid fa-circle-notch fa-spin text-primary" />
              )}
              <span>
                {uploadProgress.message ||
                  (t('aiAssistant.inline.processingDocument'))}
              </span>
            </div>
          )}

          <div
            className="input-box-container"
            onClick={(e) => {
              // Chạm vào bất kỳ khoảng trống nào trong thanh chat sẽ tự động focus vào textarea để bật bàn phím ảo
              if (!(e.target as HTMLElement).closest('button')) {
                textareaRef.current?.focus();
              }
            }}
          >
            {/* Input file ẩn: Tải lên ngay lập tức khi vừa chọn tệp */}
            {currentUser.isAdmin && (
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
                accept=".pdf,.doc,.docx,.txt"
              />
            )}

            {/* Nút Đính kèm file (icon kẹp giấy) - Giữ nguyên theo yêu cầu */}
            {currentUser.isAdmin && (
              <button
                type="button"
                className="input-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                title={t('aiAssistant.attachFile')}
              >
                <i className="fa-solid fa-paperclip" />
              </button>
            )}

            {/* Khung gõ câu hỏi */}
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder={
                targetDocument
                  ? (t('aiAssistant.inline.askAboutValue', { value: targetDocument.label || targetDocument.filename }))
                  : isMobile
                  ? (t('aiAssistant.inputPlaceholderMobile') || 'Hỏi trợ lý AI...')
                  : t('aiAssistant.inputPlaceholder')
              }
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => {
                // Trên điện thoại, tự động cuộn nhẹ để giữ thanh chat nằm ngay trên bàn phím ảo
                if (isMobile) {
                  setTimeout(() => {
                    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  }, 250);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isGenerating}
              enterKeyHint="send"
              autoCapitalize="sentences"
              autoComplete="on"
            />

            {/* Nút Nhập giọng nói */}
            <button
              type="button"
              className={`input-tool-btn voice-btn ${isListening ? 'listening' : ''}`}
              onClick={handleToggleVoice}
              title={isListening ? t('aiAssistant.voiceActive') : t('aiAssistant.voiceMode')}
            >
              <i className="fa-solid fa-microphone" />
            </button>

            {/* Nút Gửi */}
            <button
              type="button"
              className="send-message-btn"
              disabled={!inputVal.trim() || isGenerating}
              onClick={() => handleSend()}
              title={t('aiAssistant.send')}
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </footer>
      </main>

      {/* Modal Xem Trước Tài Liệu */}
      {previewFilename && (
        <DocumentPreviewModal
          filename={previewFilename}
          onClose={() => setPreviewFilename(null)}
        />
      )}

      {/* Modal Cài Đặt AI */}
      {showSettingsModal && (
        <AISettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSaved={(newConfig: AIConfig) => setAiConfig(newConfig)}
        />
      )}
      <AlertModal open={aiAlertOpen} onClose={()=>setAiAlertOpen(false)} message={aiAlertMsg} />
    </div>
  );
}
