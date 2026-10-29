import React from 'react';

/** Thanh phân trang cuối bảng. Không tự gọi API, chỉ báo lên trang cha trang/số dòng mới. */

const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface TaskPaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  count: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function TaskPagination({
  page,
  pageSize,
  totalPages,
  count,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: TaskPaginationProps) {
  const safeTotal = Math.max(totalPages, 1);
  const canPrevious = !disabled && page > 1;
  const canNext = !disabled && page < safeTotal;
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  const buttonStyle = (enabled: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    color: enabled ? 'var(--text-main)' : 'var(--text-muted)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.6,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        <span>
          Hiển thị {from}–{to} / {count} công việc
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>|</span>
        <label htmlFor="work-page-size">Số dòng mỗi trang</label>
        <select
          id="work-page-size"
          value={pageSize}
          disabled={disabled}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          style={{
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontFamily: 'inherit',
          }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          style={buttonStyle(canPrevious)}
        >
          <i className="fa-solid fa-angle-left" />
          Trang trước
        </button>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
          Trang {Math.min(page, safeTotal)} / {safeTotal}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          style={buttonStyle(canNext)}
        >
          Trang sau
          <i className="fa-solid fa-angle-right" />
        </button>
      </div>
    </div>
  );
}
