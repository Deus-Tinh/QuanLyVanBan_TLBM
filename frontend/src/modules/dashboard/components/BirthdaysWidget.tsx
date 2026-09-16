import React from 'react';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge } from '../../../shared/components/ui';

export default function BirthdaysWidget() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Widget Sinh Nhật T, T+1 */}
      <Card className="p-5 sm:p-6">
        <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-cake-candles text-pink text-lg" />
            <span className="font-bold text-sm text-main whitespace-nowrap">
              {t('dashboardDetails.birthdaysTitle')}
            </span>
          </div>
          <Badge variant="success" size="sm">
            {t('dashboardDetails.birthdaysVerified')}
          </Badge>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Sinh nhật hôm nay */}
          <div className="p-3 px-3.5 rounded-lg bg-pink-subtle border border-pink-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎂</span>
              <div>
                <div className="font-bold text-sm text-main">
                  Nguyễn Văn Hiếu
                </div>
                <div className="text-xs text-muted">
                  Nhóm 1 · Ban Công nghệ Thông tin
                </div>
              </div>
            </div>
            <Badge variant="pink" size="sm">
              {t('dashboardDetails.today')}
            </Badge>
          </div>

          {/* Sinh nhật ngày mai */}
          <div className="p-3 px-3.5 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎈</span>
              <div>
                <div className="font-bold text-sm text-main">
                  Lê Trí Kiệt
                </div>
                <div className="text-xs text-muted">
                  Trưởng Nhóm 2 · Phân hệ Văn bản
                </div>
              </div>
            </div>
            <Badge variant="info" size="sm">
              {t('dashboardDetails.tomorrow')}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Widget Phòng Họp */}
      <Card className="p-5 sm:p-6">
        <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-calendar-check text-success text-lg" />
            <span className="font-bold text-sm text-main whitespace-nowrap">
              {t('dashboardDetails.meetingRoomsToday')}
            </span>
          </div>
          <Badge variant="success" size="sm">
            {t('dashboardDetails.birthdaysVerified')}
          </Badge>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="p-3 px-3.5 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-main">
                Phòng Họp A201 (Hội nghị Ban Giám Đốc)
              </div>
              <div className="text-xs text-muted">
                08:30 - 11:30 · Chủ trì: NCS.ThS. Trần Phương Duy
              </div>
            </div>
            <Badge variant="success" size="sm">
              {t('dashboardDetails.inProgress')}
            </Badge>
          </div>

          <div className="p-3 px-3.5 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm text-main">
                Phòng Họp B105 (Họp Sprint Review Nhóm 1 - 8)
              </div>
              <div className="text-xs text-muted">
                14:00 - 16:30 · Điều phối: Châu Tuấn Kiệt (PM)
              </div>
            </div>
            <Badge variant="warning" size="sm">
              {t('dashboardDetails.upcoming')}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
