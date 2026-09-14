import React from 'react';
import { ActivePageId } from '../../types/navigation';
import { useTranslation } from '../../locales/i18n';

interface PageMeta {
  title: string;
  module: string;
  assignedTeam: string;
  codeRef: string;
  isGroup1: boolean;
  desc: string;
}

interface SyllabusPreviewProps {
  activePage: ActivePageId;
  onNavigate: (page: ActivePageId) => void;
}

export default function SyllabusPreview({ activePage, onNavigate }: SyllabusPreviewProps) {
  const { t, translations } = useTranslation();
  const pageMap = (translations.pages || {}) as Record<ActivePageId, PageMeta>;

  const meta = pageMap[activePage] || {
    title: activePage,
    module: 'Chức năng hệ thống',
    assignedTeam: 'Nhóm 1 (Trưởng nhóm: Châu Tuấn Kiệt)',
    codeRef: 'ITC Django MĐ501911',
    isGroup1: true,
    desc: 'Phân hệ quản lý văn bản & tài liệu mật TLBM.',
  };

  return (
    <div style={{ maxWidth: '820px', margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Banner Thông Báo Chính Thức Của Nhóm 1 */}
      <div
        style={{
          background: meta.isGroup1
            ? 'linear-gradient(135deg, var(--color-warning-subtle), transparent)'
            : 'linear-gradient(135deg, var(--color-primary-subtle), transparent)',
          border: meta.isGroup1
            ? '1px solid var(--color-warning-border)'
            : '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          boxShadow: 'var(--shadow-md)',
          backdropFilter: 'var(--backdrop-blur)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Nhãn trạng thái Nhóm 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: meta.isGroup1 ? 'var(--color-warning-subtle)' : 'var(--color-primary-subtle)',
                border: meta.isGroup1 ? '1px solid var(--color-warning-border)' : '1px solid var(--color-primary-border)',
                color: meta.isGroup1 ? 'var(--color-warning-text)' : 'var(--color-primary)',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className={meta.isGroup1 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'} />
              {meta.isGroup1 ? t('common.group1Developing') : t('common.group1Layout')}
            </span>

            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {meta.codeRef}
            </span>
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('common.outline')}: <strong>{meta.module}</strong>
          </span>
        </div>

        {/* Tiêu đề chức năng */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
          {meta.title}
        </h1>

        {/* Mô tả nghiệp vụ */}
        <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {meta.desc}
        </p>

        {/* Thông báo chi tiết phụ trách */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--text-main)' }}>📌 {t('common.assignedUnit')}:</strong>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{meta.assignedTeam}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: 'var(--text-main)' }}>⚠️ {t('common.currentStatus')}:</strong>
            <span style={{ color: 'var(--color-warning-text)', fontWeight: 700 }}>
              {meta.isGroup1
                ? t('common.group1DescSelf')
                : t('common.group1DescOther', { team: meta.assignedTeam })}
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 22px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={() => onNavigate('dashboard')}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>{t('common.backToDashboard')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
