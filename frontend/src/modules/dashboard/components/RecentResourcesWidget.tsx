import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../shared/components/ui';

export interface ResourceItem {
  code: string;
  title: string;
  ext: string;
  variant: 'info' | 'success' | 'danger' | 'warning' | 'primary';
}

interface RecentResourcesWidgetProps {
  resources?: ResourceItem[];
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  { code: 'BM-01/NS', title: 'Phiếu đề xuất tiếp nhận cán bộ nhân viên mới', ext: 'DOCX', variant: 'info' },
  { code: 'BM-02/TC', title: 'Mẫu thanh toán tạm ứng công tác phí nội bộ', ext: 'XLSX', variant: 'success' },
  { code: 'TL-03/BM', title: 'Quy trình xử lý văn bản đến và văn bản đi', ext: 'PDF', variant: 'danger' },
  { code: 'BM-04/HC', title: 'Mẫu đăng ký phòng họp và trang thiết bị', ext: 'DOCX', variant: 'info' },
  { code: 'TL-05/IT', title: 'Hướng dẫn cài đặt ứng dụng bảo mật TLBM', ext: 'PDF', variant: 'danger' },
];

export default function RecentResourcesWidget({
  resources = DEFAULT_RESOURCES,
}: RecentResourcesWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
        <div className="font-bold text-sm text-main flex items-center gap-1.5">
          <i className="fa-solid fa-file-lines text-info" />
          <span>{t('dashboardDetails.recentResourcesTitle')}</span>
        </div>
        <Badge variant="success" size="sm">
          {t('dashboardDetails.completedGroup1')}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">{t('dashboardDetails.resourceCode')}</TableHead>
            <TableHead>{t('dashboardDetails.resourceName')}</TableHead>
            <TableHead className="w-24 text-center">{t('dashboardDetails.resourceFormat')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-semibold text-info">{row.code}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell className="text-center">
                <Badge variant={row.variant} size="sm">
                  {row.ext}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3.5 text-right">
        <button
          type="button"
          onClick={() => navigate('/resources')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-info hover:opacity-80 transition-colors duration-fast cursor-pointer"
        >
          <span>{t('dashboardDetails.viewMoreResources')}</span>
          <i className="fa-solid fa-arrow-right text-[0.7rem]" />
        </button>
      </div>
    </Card>
  );
}
