/** Thông báo trình ký của tôi (kênh trong ứng dụng; email gửi song song khi tài khoản có email). */
import { Link } from 'react-router-dom';
import { Card } from '@components/common';
import { DangTai, LoiTai, Rong, TrangThaiBadge } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { dinhDangNgay } from '@lib/signing/dinhDang';
import { useTai } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';
import type { LoaiThongBao } from '@lib/signing/types';

const BIEU_TUONG: Record<LoaiThongBao, string> = {
  CAN_KY: 'fa-pen-nib text-primary',
  HOAN_THANH: 'fa-circle-check text-success',
  TU_CHOI: 'fa-circle-xmark text-danger',
  YEU_CAU_SUA: 'fa-rotate-left text-warning',
  HUY: 'fa-ban text-secondary',
};

export default function ThongBaoPage() {
  const { t, loi, lang } = useSigningT();
  const ds = useTai(() => signingApi.thongBao(), []);
  return (
    <Card className="p-4 space-y-3">
      {ds.dangTai && <DangTai />}
      {ds.loi && <LoiTai thongBao={loi(ds.loi)} onThuLai={ds.tai} />}
      {!ds.dangTai && !ds.loi && ds.duLieu?.length === 0 && <Rong icon="fa-bell">{t('thongBao.rong')}</Rong>}
      <ul className="divide-y divide-border-subtle">
        {ds.duLieu?.map((tb) => (
          <li key={tb.id}>
            <Link to={`/approvals/${tb.trinh_ky}`} className="flex items-start gap-3 px-2 py-3 hover:bg-surface-hover">
              <i className={`fa-solid ${BIEU_TUONG[tb.loai_thong_bao] ?? 'fa-bell text-secondary'} mt-1`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-main">{t(`thongBao.loai.${tb.loai_thong_bao}`)}</span>
                  <TrangThaiBadge trangThai={tb.trang_thai_ho_so} />
                </div>
                <div className="truncate text-sm text-main" title={tb.van_ban}>#{tb.trinh_ky} · {tb.van_ban}</div>
                <div className="text-xs text-secondary">{tb.ten_quy_trinh} · {dinhDangNgay(tb.created_at, lang)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
