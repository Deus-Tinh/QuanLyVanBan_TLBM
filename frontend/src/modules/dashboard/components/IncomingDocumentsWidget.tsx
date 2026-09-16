import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../shared/components/ui';

export interface DocumentItem {
  code: string;
  title: string;
  date: string;
}

interface IncomingDocumentsWidgetProps {
  documents?: DocumentItem[];
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  { code: '128/QĐ-BGDĐT', title: 'Hướng dẫn công tác năm học mới 2026', date: '11/09/2026' },
  { code: '45/CV-UBND', title: 'Tăng cường an toàn thông tin CSDL nhà nước', date: '10/09/2026' },
  { code: '09/TB-ITC', title: 'Thông báo lịch bảo vệ đồ án chuyên ngành', date: '09/09/2026' },
  { code: '77/HD-TCHQ', title: 'Quy trình kiểm tra hồ sơ điện tử liên ngành', date: '08/09/2026' },
  { code: '14/KH-ITC', title: 'Kế hoạch triển khai hệ thống quản lý văn bản', date: '07/09/2026' },
];

export default function IncomingDocumentsWidget({
  documents = DEFAULT_DOCUMENTS,
}: IncomingDocumentsWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
        <div className="font-bold text-sm text-main flex items-center gap-1.5">
          <i className="fa-solid fa-inbox text-info" />
          <span>{t('dashboardDetails.recentIncomingTitle')}</span>
        </div>
        <Badge variant="success" size="sm">
          {t('dashboardDetails.completedGroup1')}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">{t('dashboardDetails.docNumber')}</TableHead>
            <TableHead>{t('dashboardDetails.docSummary')}</TableHead>
            <TableHead className="w-24">{t('dashboardDetails.docDate')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-semibold text-primary">{row.code}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell className="text-muted">{row.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3.5 text-right">
        <button
          type="button"
          onClick={() => navigate('/documents/incoming')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-fast cursor-pointer"
        >
          <span>{t('dashboardDetails.viewMoreIncoming')}</span>
          <i className="fa-solid fa-arrow-right text-[0.7rem]" />
        </button>
      </div>
    </Card>
  );
}
