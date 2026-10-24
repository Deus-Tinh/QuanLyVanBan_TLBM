/** Sửa hồ sơ nháp (người tạo, trước khi gửi): hạn chót, ghi chú, số hiệu/trích yếu khi văn bản nhập tay, thay tệp PDF. */
import { useState } from 'react';
import { Button } from '@components/common';
import { HopThoai, OChonTep, ThongBao, TruongNhap } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { LOP_O_NHAP } from '@lib/signing/dinhDang';
import { useSigningT } from '@lib/signing/i18n';
import type { HoSoChiTiet } from '@lib/signing/types';

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
  const [hanChot, setHanChot] = useState(sangGioDiaPhuong(hoSo.han_chot));
  const [ghiChu, setGhiChu] = useState(hoSo.ghi_chu ?? '');
  // Văn bản trình ký nhập tay (không gắn văn bản đi) thì sửa được số hiệu, trích yếu
  const nhapTay = hoSo.van_ban_id == null;
  const [soHieu, setSoHieu] = useState(hoSo.so_hieu_van_ban ?? '');
  const [trichYeu, setTrichYeu] = useState(hoSo.trich_yeu_van_ban ?? '');
  const [tep, setTep] = useState<File | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBao, setThongBao] = useState('');

  const luu = async () => {
    const form = new FormData();
    form.append('han_chot', hanChot ? new Date(hanChot).toISOString() : '');
    form.append('ghi_chu', ghiChu);
    if (nhapTay) {
      form.append('so_hieu_van_ban', soHieu.trim());
      form.append('trich_yeu_van_ban', trichYeu.trim());
    }
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
        <Button icon="fa-floppy-disk" isLoading={dangLuu} disabled={nhapTay && !trichYeu.trim()} onClick={luu}>{t('chung.luu')}</Button>
      </>}>
      {nhapTay && (
        <>
          <TruongNhap nhan={t('tao.soHieu')}>
            <input className={LOP_O_NHAP} maxLength={100} value={soHieu} onChange={(e) => setSoHieu(e.target.value)} />
          </TruongNhap>
          <TruongNhap nhan={t('tao.trichYeu')}>
            <input className={LOP_O_NHAP} value={trichYeu} onChange={(e) => setTrichYeu(e.target.value)} />
          </TruongNhap>
        </>
      )}
      <TruongNhap nhan={t('danhSach.hanChot')}>
        <input className={LOP_O_NHAP} type="datetime-local" value={hanChot} onChange={(e) => setHanChot(e.target.value)} />
      </TruongNhap>
      <TruongNhap nhan={t('chiTiet.ghiChu')}>
        <textarea className={LOP_O_NHAP} rows={3} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
      </TruongNhap>
      <TruongNhap nhan={t('chiTiet.thayTep')} ghiChu={t('chiTiet.goiYThayTep')}>
        <OChonTep accept="application/pdf,.pdf" onChon={(f) => setTep(f ?? null)} />
      </TruongNhap>
      {thongBao && <ThongBao>{thongBao}</ThongBao>}
    </HopThoai>
  );
}
