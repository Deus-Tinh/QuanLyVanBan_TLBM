import React, { useState } from 'react';
import { TASK_STATUS_LABELS, TaskFilters, TaskStatus } from '../types/task';
import DateInput, { isoToDisplay } from './DateInput';

/**
 * Thanh lọc phía trên bảng. Người dùng chỉnh xong rồi bấm "Tìm kiếm" (hoặc Enter ở ô tìm)
 * thì mới áp dụng, để không gọi API sau mỗi thao tác nhỏ.
 */

export type FilterDraft = Required<Pick<TaskFilters, 'search' | 'status' | 'createdFrom' | 'createdTo'>>;

interface TaskFilterBarProps {
  value: FilterDraft;
  busy?: boolean;
  onSearch: (filters: FilterDraft) => void;
  onCreate: () => void;
}

const STATUS_OPTIONS = Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][];

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-surface)',
  color: 'var(--text-main)',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  outline: 'none',
};

export default function TaskFilterBar({ value, busy = false, onSearch, onCreate }: TaskFilterBarProps) {
  const [draft, setDraft] = useState<FilterDraft>(value);
  const [error, setError] = useState('');

  const hasFilter = Boolean(value.search || value.status || value.createdFrom || value.createdTo);

  const submit = () => {
    if (draft.createdFrom && draft.createdTo && draft.createdFrom > draft.createdTo) {
      setError(
        `"Từ ngày tạo" (${isoToDisplay(draft.createdFrom)}) đang sau "Đến ngày tạo" (${isoToDisplay(draft.createdTo)}). Hãy chọn lại khoảng ngày.`,
      );
      return;
    }
    setError('');
    onSearch({ ...draft, search: draft.search.trim() });
  };

  const reset = () => {
    const empty: FilterDraft = { search: '', status: '', createdFrom: '', createdTo: '' };
    setError('');
    setDraft(empty);
    onSearch(empty);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'end',
        }}
      >
        <div>
          <label htmlFor="work-filter-status" style={fieldLabelStyle}>
            Tình trạng
          </label>
          <select
            id="work-filter-status"
            value={draft.status}
            onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus | '' })}
            style={inputStyle}
          >
            <option value="">Tất cả</option>
            {STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span style={fieldLabelStyle}>Từ ngày tạo</span>
          <DateInput
            value={draft.createdFrom}
            onChange={(createdFrom) => setDraft({ ...draft, createdFrom })}
            max={draft.createdTo || undefined}
            ariaLabel="Từ ngày tạo"
          />
        </div>

        <div>
          <span style={fieldLabelStyle}>Đến ngày tạo</span>
          <DateInput
            value={draft.createdTo}
            onChange={(createdTo) => setDraft({ ...draft, createdTo })}
            min={draft.createdFrom || undefined}
            ariaLabel="Đến ngày tạo"
          />
        </div>

        <div style={{ minWidth: 0 }}>
          <label htmlFor="work-filter-search" style={fieldLabelStyle}>
            Nội dung công việc
          </label>
          <input
            id="work-filter-search"
            type="search"
            value={draft.search}
            placeholder="Nhập từ khóa trong nội dung công việc"
            onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
            style={inputStyle}
          />
        </div>
      </div>

      {error && <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px var(--color-primary-glow)',
          }}
        >
          <i className="fa-solid fa-plus" />
          Thêm công việc mới
        </button>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {hasFilter && (
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              Xóa bộ lọc
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-primary-border)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            <i className="fa-solid fa-magnifying-glass" />
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
}
