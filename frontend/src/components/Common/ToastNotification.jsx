import React from 'react';

export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: 'fa-circle-check',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
    danger: 'fa-circle-xmark',
  };

  const iconClass = icons[toast.type] || icons.info;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: 'var(--deck-bg)',
        border: '1px solid var(--deck-border)',
        boxShadow: 'var(--deck-shadow)',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '320px',
        maxWidth: '450px',
        backdropFilter: 'blur(16px)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <i
        className={`fa-solid ${iconClass}`}
        style={{
          fontSize: '1.25rem',
          color:
            toast.type === 'success'
              ? 'var(--status-success, #16a34a)'
              : toast.type === 'danger'
              ? 'var(--status-danger, #dc2626)'
              : toast.type === 'warning'
              ? 'var(--status-warning, #d97706)'
              : 'var(--blue-pill-bg, #1e40af)',
        }}
      />
      <div style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
        {toast.message}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '1rem',
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      )}
    </div>
  );
}
