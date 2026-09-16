import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivePageId } from '../../types/navigation';
import { useTranslation } from '../../locales/i18n';
import { Button, Badge, Card, CardContent } from '../ui';

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
  onNavigate?: (page: ActivePageId) => void;
}

export default function SyllabusPreview({ activePage, onNavigate }: SyllabusPreviewProps) {
  const navigate = useNavigate();
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
    <div className="max-w-3xl mx-auto my-8 flex flex-col gap-5">
      {/* 1. Banner Thông Báo Chính Thức Của Nhóm 1 */}
      <Card
        className={`relative overflow-hidden border ${
          meta.isGroup1 ? 'border-warning/30' : 'border-primary/30'
        }`}
      >
        <CardContent className="p-7 sm:p-8">
          {/* Nhãn trạng thái Nhóm 1 */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge variant={meta.isGroup1 ? 'warning' : 'primary'} size="md">
                <i
                  className={`mr-1.5 ${
                    meta.isGroup1 ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-info'
                  }`}
                />
                {meta.isGroup1 ? t('common.group1Developing') : t('common.group1Layout')}
              </Badge>

              <Badge variant="secondary" size="md">
                {meta.codeRef}
              </Badge>
            </div>

            <span className="text-xs text-text-muted">
              {t('common.outline')}: <strong className="text-text-main">{meta.module}</strong>
            </span>
          </div>

          {/* Tiêu đề chức năng */}
          <h1 className="text-2xl font-extrabold text-text-main mt-1 tracking-tight">
            {meta.title}
          </h1>

          {/* Mô tả nghiệp vụ */}
          <p className="text-text-secondary mt-2.5 text-sm leading-relaxed">
            {meta.desc}
          </p>

          {/* Thông báo chi tiết phụ trách */}
          <div className="mt-5 p-4 rounded-xl bg-surface border border-subtle flex flex-col gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <strong className="text-text-main shrink-0">📌 {t('common.assignedUnit')}:</strong>
              <span className="text-primary font-semibold">{meta.assignedTeam}</span>
            </div>

            <div className="flex items-center gap-2">
              <strong className="text-text-main shrink-0">⚠️ {t('common.currentStatus')}:</strong>
              <span className="text-warning font-semibold">
                {meta.isGroup1
                  ? t('common.group1DescSelf')
                  : t('common.group1DescOther', { team: meta.assignedTeam })}
              </span>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="mt-6 flex gap-3 flex-wrap">
            <Button
              variant="primary"
              icon="fa-solid fa-arrow-left"
              onClick={() => {
                if (onNavigate) onNavigate('dashboard');
                navigate('/dashboard');
              }}
            >
              {t('common.backToDashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
