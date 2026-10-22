import React, { useState } from 'react';
import { Attachment, FROZEN_STATUSES, TaskComment, TaskDetail } from '../types/task';
import { isoDateTimeToDisplay } from './DateInput';
import FilePicker from './FilePicker';
import TaskAttachmentList from './TaskAttachmentList';
import WorkAlert from './WorkAlert';

/**
 * Khu vực ý kiến xử lý. Nộp kết quả chính là ghi ý kiến kèm file (file không bắt buộc):
 * ý kiến có file đầu tiên chuyển công việc sang Chờ duyệt.
 */

interface TaskCommentPanelProps {
  task: TaskDetail;
  comments: TaskComment[];
  loading: boolean;
  onBack: () => void;
  /** Trả về null khi gửi thành công, hoặc câu báo lỗi để hiện ngay dưới ô nhập. */
  onSubmit: (content: string, files: File[]) => Promise<string | null>;
  onDeleteFile: (file: Attachment) => void;
  onError: (message: string) => void;
}

function lockedReason(task: TaskDetail): string {
  if (FROZEN_STATUSES.includes(task.status)) {
    return 'Công việc đã bị khóa nên không ghi thêm ý kiến được.';
  }
  if (!task.myRoles.length) {
    return 'Bạn không phải người liên quan đến công việc này nên chỉ được xem, không ghi ý kiến được.';
  }
  return 'Bạn không ghi ý kiến được ở thời điểm này. Hãy tải lại trang để xem trạng thái mới nhất.';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] || '?').charAt(0).toUpperCase();
}

export default function TaskCommentPanel({
  task,
  comments,
  loading,
  onBack,
  onSubmit,
  onDeleteFile,
  onError,
}: TaskCommentPanelProps) {
  const canComment = Boolean(task.permissions.canComment);
  const canAttach = Boolean(task.permissions.canSubmitEvidence);
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  const resetForm = () => {
    setContent('');
    setFiles([]);
    setFormError('');
  };

  const handleSend = async () => {
    if (!content.trim() && !files.length) {
      setFormError(
        canAttach
          ? 'Ý kiến đang trống. Hãy nhập nội dung hoặc đính kèm file kết quả trước khi gửi.'
          : 'Ý kiến đang trống. Hãy nhập nội dung trước khi gửi.',
      );
      return;
    }
    setSending(true);
    setFormError('');
    const error = await onSubmit(content.trim(), files);
    setSending(false);
    if (error) {
      setFormError(error);
      return;
    }
    resetForm();
    setComposing(false);
  };

  const topButton = (primary: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-md)',
    border: primary ? 'none' : '1px solid var(--border-subtle)',
    background: primary ? 'var(--color-primary)' : 'var(--bg-surface)',
    color: primary ? '#ffffff' : 'var(--text-main)',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
  });

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '18px 20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
          <i className="fa-solid fa-comments" style={{ color: 'var(--color-primary)', marginRight: '8px' }} />
          Ý kiến xử lý ({comments.length})
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canComment && (
            <button
              type="button"
              onClick={() => setComposing((previous) => !previous)}
              style={topButton(!composing)}
              aria-expanded={composing}
            >
              <i className={composing ? 'fa-solid fa-chevron-up' : 'fa-solid fa-pen-to-square'} />
              Ý kiến xử lý
            </button>
          )}
          <button type="button" onClick={onBack} style={topButton(false)}>
            <i className="fa-solid fa-arrow-left" />
            Quay lại
          </button>
        </div>
      </div>

      {!canComment && <WorkAlert variant="warning" message={lockedReason(task)} />}

      {canComment && composing && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-primary-border)',
            background: 'var(--color-primary-subtle)',
          }}
        >
          <label htmlFor="work-comment-content" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Nội dung ý kiến
          </label>
          <textarea
            id="work-comment-content"
            value={content}
            disabled={sending}
            onChange={(event) => {
              setContent(event.target.value);
              setFormError('');
            }}
            placeholder={
              canAttach
                ? 'Báo cáo tiến độ, hoặc mô tả kết quả rồi đính kèm file kết quả bên dưới...'
                : 'Nhập ý kiến chỉ đạo, góp ý...'
            }
            style={{
              width: '100%',
              minHeight: '90px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${formError ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
            }}
          />

          {canAttach ? (
            <FilePicker
              files={files}
              onChange={(next) => {
                setFiles(next);
                setFormError('');
              }}
              disabled={sending}
              label="Đính kèm file kết quả (không bắt buộc)"
              buttonLabel="Chọn file kết quả"
            />
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {task.status === 'HOAN_THANH' && task.myRoles.some((role) => role === 'CHU_TRI' || role === 'THAM_GIA')
                ? 'Công việc đã được duyệt hoàn thành nên không đính kèm thêm file kết quả được. Nếu cần bổ sung, hãy đề nghị người có quyền duyệt hủy duyệt trước.'
                : 'Chỉ người chủ trì và cán bộ tham gia mới đính kèm được file kết quả.'}
            </div>
          )}

          {canAttach && files.length > 0 && task.status !== 'CHO_DUYET' && (
            <WorkAlert
              variant="info"
              message="Gửi ý kiến kèm file kết quả sẽ chuyển công việc sang trạng thái Chờ duyệt."
            />
          )}

          {formError && <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{formError}</div>}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-lock" /> Ý kiến đã gửi không thể sửa hoặc xóa.
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  resetForm();
                  setComposing(false);
                }}
                style={topButton(false)}
              >
                Hủy
              </button>
              <button type="button" disabled={sending} onClick={handleSend} style={{ ...topButton(true), opacity: sending ? 0.7 : 1 }}>
                <i className={sending ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-paper-plane'} />
                {sending ? 'Đang gửi...' : 'Gửi ý kiến'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !comments.length ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
          <i className="fa-solid fa-circle-notch fa-spin" /> Đang tải ý kiến...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          Chưa có ý kiến nào.
          {canAttach && ' Khi làm xong, bấm "Ý kiến xử lý" để gửi kết quả kèm file.'}
        </div>
      ) : (
        <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {comments.map((comment) => (
            <li
              key={comment.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-hover)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  fontWeight: 800,
                }}
              >
                {initials(comment.author.fullName)}
              </span>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                    {comment.author.fullName}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Gửi lúc: {isoDateTimeToDisplay(comment.createdAt)}
                  </span>
                  {comment.attachments.length > 0 && (
                    <span
                      style={{
                        padding: '0 8px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-success-border)',
                        background: 'var(--color-success-subtle)',
                        color: 'var(--color-success)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      Kèm file kết quả
                    </span>
                  )}
                </div>
                {comment.content && (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                    {comment.content}
                  </div>
                )}
                {comment.attachments.length > 0 && (
                  <TaskAttachmentList files={comment.attachments} onDelete={onDeleteFile} onError={onError} compact />
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
