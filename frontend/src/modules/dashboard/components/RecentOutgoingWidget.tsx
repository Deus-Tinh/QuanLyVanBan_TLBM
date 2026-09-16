import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../shared/locales/i18n';
import { DocumentItem } from './IncomingDocumentsWidget';
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../shared/components/ui';

interface RecentOutgoingWidgetProps {
  documents?: DocumentItem[];
}

const DEFAULT_OUTGOING: DocumentItem[] = [
  { code: '210/TB-BL', title: 'Thông báo kết luận cuộc họp giao ban quý 3', date: '11/09/2026' },
  { code: '89/QĐ-BL', title: 'Quyết định ban hành khung an ninh thông tin', date: '10/09/2026' },
  { code: '62/TTr-ITC', title: 'Tờ trình phê duyệt kinh phí trang bị máy chủ', date: '09/09/2026' },
  { code: '55/CV-BL', title: 'Công văn gửi các đơn vị phòng ban cấp 2', date: '08/09/2026' },
  { code: '31/QĐ-BL', title: 'Quyết định phân công nhiệm vụ đồ án Django', date: '06/09/2026' },
];

export default function RecentOutgoingWidget({
  documents = DEFAULT_OUTGOING,
}: RecentOutgoingWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2">
        <div className="font-bold text-sm text-main flex items-center gap-1.5">
          <i className="fa-solid fa-paper-plane text-success" />
          <span>{t('dashboardDetails.recentOutgoingTitle')}</span>
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
              <TableCell className="font-semibold text-success">{row.code}</TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell className="text-muted">{row.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3.5 text-right">
        <button
          type="button"
          onClick={() => navigate('/documents/outgoing')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-success hover:text-success-hover transition-colors duration-fast cursor-pointer"
        >
          <span>{t('dashboardDetails.viewMoreOutgoing')}</span>
          <i className="fa-solid fa-arrow-right text-[0.7rem]" />
        </button>
      </div>
    </Card>
  );
}
