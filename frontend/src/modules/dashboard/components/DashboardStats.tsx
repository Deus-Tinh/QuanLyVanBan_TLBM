import React from 'react';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge } from '../../../shared/components/ui';

interface DashboardStatsProps {
  incomingCount?: number;
  outgoingCount?: number;
  confidentialCount?: number;
  tasksCount?: number;
}

export default function DashboardStats({
  incomingCount = 1248,
  outgoingCount = 856,
  confidentialCount = 24,
  tasksCount = 18,
}: DashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="font-bold text-sm text-main flex items-center gap-2">
          <span>📊 {t('dashboardDetails.kpiTitle')}</span>
          <Badge variant="primary" size="sm">
            Mock Data (Prototype)
          </Badge>
        </div>
        <Badge variant="success" size="sm">
          {t('dashboardDetails.kpiVerifiedTag')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: VB Đến */}
        <Card hoverable className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-subtle text-primary border border-primary-border flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-inbox" />
          </div>
          <div>
            <div className="text-xs text-muted font-semibold">
              {t('dashboardDetails.incomingCard')}
            </div>
            <div className="text-2xl font-extrabold text-main">
              {incomingCount.toLocaleString()}
            </div>
            <div className="text-xs text-success font-semibold">
              {t('dashboardDetails.incomingToday')}
            </div>
          </div>
        </Card>

        {/* Card 2: VB Đi */}
        <Card hoverable className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-success-subtle text-success border border-success-border flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-paper-plane" />
          </div>
          <div>
            <div className="text-xs text-muted font-semibold">
              {t('dashboardDetails.outgoingCard')}
            </div>
            <div className="text-2xl font-extrabold text-main">
              {outgoingCount.toLocaleString()}
            </div>
            <div className="text-xs text-success font-semibold">
              {t('dashboardDetails.outgoingStatus')}
            </div>
          </div>
        </Card>

        {/* Card 3: VB Mật */}
        <Card hoverable className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-danger-subtle text-danger border border-danger-border flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <div>
            <div className="text-xs text-muted font-semibold">
              {t('dashboardDetails.confidentialCard')}
            </div>
            <div className="text-2xl font-extrabold text-main">
              {confidentialCount.toLocaleString()}
            </div>
            <div className="text-xs text-danger font-semibold">
              {t('dashboardDetails.confidentialStatus')}
            </div>
          </div>
        </Card>

        {/* Card 4: Công Việc */}
        <Card hoverable className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-subtle text-purple border border-purple-border flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-list-check" />
          </div>
          <div>
            <div className="text-xs text-muted font-semibold">
              {t('dashboardDetails.tasksCard')}
            </div>
            <div className="text-2xl font-extrabold text-main">
              {tasksCount.toLocaleString()}
            </div>
            <div className="text-xs text-warning-text font-semibold">
              {t('dashboardDetails.tasksNearDeadline')}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
