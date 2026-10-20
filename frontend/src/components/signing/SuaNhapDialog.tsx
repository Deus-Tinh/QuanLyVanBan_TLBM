/** Sửa hồ sơ nháp (người tạo, trước khi gửi): mức độ, hạn chót, ghi chú, thay tệp PDF dự thảo. */
import { useState } from 'react';
import { Button } from '@components/common';
import { HopThoai, ThongBao, TruongNhap } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { LOP_O_NHAP } from '@lib/signing/dinhDang';
import { useSigningT } from '@lib/signing/i18n';
import type { HoSoChiTiet } from '@lib/signing/types';

const MUC_DO = ['THUONG', 'KHAN', 'HOA_TOC'];

/** ISO → giá trị ô datetime-local theo giờ máy người dùng. */
function sangGioDiaPhuong(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function SuaNhapDialog({ hoSo, onDong, onXong }: {
  hoSo: HoSoChiTiet; onDong: () => void; onXong: (moi: HoSoChiTiet) => void;
}) {
  const { t, loi } = useSigningT();
  const [mucDo, setMucDo] = useState(hoSo.muc_do);
  const [hanChot, setHanChot] = useState(sangGioDiaPhuong(hoSo.han_chot));
  const [ghiChu, setGhiChu] = useState(hoSo.ghi_chu ?? '');
  const [tep, setTep] = useState<File | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBao, setThongBao] = useState('');

  const luu = async () => {
    const form = new FormData();
    form.append('muc_do', mucDo);
    form.append('han_chot', hanChot ? new Date(hanChot).toISOString() : '');
    form.append('ghi_chu', ghiChu);
    if (tep) form.append('tep', tep);
    setDangLuu(true);
    setThongBao('');
    try {
      onXong(await signingApi.suaNhap(hoSo.id, form));
    } catch (err) {
      setThongBao(loi(err));
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <HopThoai moTieuDe={t('chiTiet.suaHoSo')} mo onDong={onDong}
      chanDuoi={<>
        <Button variant="secondary" onClick={onDong}>{t('chung.huyBo')}</Button>
        <Button icon="fa-floppy-disk" isLoading={dangLuu} onClick={luu}>{t('chung.luu')}</Button>
      </>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TruongNhap nhan={t('danhSach.mucDo')}>
          <select className={LOP_O_NHAP} value={mucDo} onChange={(e) => setMucDo(e.target.value as HoSoChiTiet['muc_do'])}>
            {MUC_DO.map((m) => <option key={m} value={m}>{t(`mucDo.${m}`)}</option>)}
          </select>
        </TruongNhap>
        <TruongNhap nhan={t('danhSach.hanChot')}>
          <input className={LOP_O_NHAP} type="datetime-local" value={hanChot} onChange={(e) => setHanChot(e.target.value)} />
        </TruongNhap>
      </div>
      <TruongNhap nhan={t('chiTiet.ghiChu')}>
        <textarea className={LOP_O_NHAP} rows={3} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
      </TruongNhap>
      <TruongNhap nhan={t('chiTiet.thayTep')} ghiChu={t('chiTiet.goiYThayTep')}>
        <input className={LOP_O_NHAP} type="file" accept="application/pdf,.pdf" onChange={(e) => setTep(e.target.files?.[0] ?? null)} />
      </TruongNhap>
      {thongBao && <ThongBao>{thongBao}</ThongBao>}
    </HopThoai>
  );
}
