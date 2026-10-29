import { useEffect, useState } from 'react';
import { Button } from '@components/common';
import { signingApi } from '@lib/signing/api';
import { boDau, LOP_O_NHAP } from '@lib/signing/dinhDang';
import { useSigningT } from '@lib/signing/i18n';
import type { CanBo, ChucVu } from '@lib/signing/types';
import { HopThoai, ThongBao } from './ChungUI';

export default function CauHinhUyQuyen({ onDong }: { onDong: () => void }) {
  const { t, loi } = useSigningT();
  const [chucVu, setChucVu] = useState<ChucVu[]>([]);
  const [canBo, setCanBo] = useState<CanBo[]>([]);
  const [map, setMap] = useState<Array<{ chuc_vu_giao_id: number; chuc_vu_nhan_id: number }>>([]);
  const [giao, setGiao] = useState('');
  const [chon, setChon] = useState<number[]>([]);
  const [tim, setTim] = useState('');
  const [timGiao, setTimGiao] = useState('');
  const [moGiao, setMoGiao] = useState(false);
  const [tai, setTai] = useState(true);
  const [luu, setLuu] = useState(false);
  const [thongBao, setThongBao] = useState('');
  const [loiTai, setLoiTai] = useState<unknown>(null);
  const [daLuu, setDaLuu] = useState(false);

  useEffect(() => {
    let huy = false;
    Promise.all([signingApi.chucVuUyQuyen(), signingApi.danhBaCanBo(), signingApi.cauHinhUyQuyen()])
      .then(([cv, cb, cauHinh]) => { if (!huy) { setChucVu(cv.map((v) => ({ id: v.id, name: v.ten, display_order: v.stt }))); setCanBo(cb); setMap(cauHinh); } })
      .catch((err) => { if (!huy) setLoiTai(err); })
      .finally(() => { if (!huy) setTai(false); });
    return () => { huy = true; };
  }, []);

  const coThayDoi = () => {
    const daLuu = map.filter((v) => v.chuc_vu_giao_id === Number(giao)).map((v) => v.chuc_vu_nhan_id);
    return Boolean(giao) && (chon.length !== daLuu.length || chon.some((v) => !daLuu.includes(v)));
  };
  const dong = () => { if (!coThayDoi() || window.confirm(t('uyQuyenBoThayDoiDong'))) onDong(); };
  const doiGiao = (id: string) => {
    if (coThayDoi() && !window.confirm(t('uyQuyenBoThayDoi'))) return false;
    setGiao(id);
    setChon(map.filter((v) => v.chuc_vu_giao_id === Number(id)).map((v) => v.chuc_vu_nhan_id));
    setThongBao('');
    setDaLuu(false);
    return true;
  };
  const ghi = async () => {
    setLuu(true); setThongBao(''); setDaLuu(false);
    try {
      await signingApi.luuCauHinhUyQuyen(Number(giao), chon);
      setMap((cu) => [...cu.filter((v) => v.chuc_vu_giao_id !== Number(giao)),
        ...chon.map((id) => ({ chuc_vu_giao_id: Number(giao), chuc_vu_nhan_id: id }))]);
      setThongBao(t('uyQuyenDaLuu'));
      setDaLuu(true);
    } catch (err) { setThongBao(loi(err)); } finally { setLuu(false); }
  };
  const loc = boDau(tim.trim());
  const ds = chucVu.filter((cv) => !loc || boDau([cv.name, ...canBo.filter((u) => u.chuc_vu_id === cv.id).map((u) => u.ho_ten)].join(' ')).includes(loc));
  const dsGiao = chucVu.filter((cv) => !timGiao.trim() || boDau([cv.name, ...canBo.filter((u) => u.chuc_vu_id === cv.id).map((u) => u.ho_ten)].join(' ')).includes(boDau(timGiao.trim())));
  return <HopThoai mo moTieuDe={t('uyQuyenCauHinh')} onDong={dong} dangXuLy={luu}
    chanDuoi={<><Button variant="secondary" onClick={dong}>{t('chung.dong')}</Button>
      <Button onClick={ghi} disabled={!giao || tai} isLoading={luu}>{t('chung.luu')}</Button></>}>
    <p className="text-sm text-secondary">{t('uyQuyenHuongDan')}</p>
    <div className="mt-3 text-sm font-semibold">{t('uyQuyenChucDanhGiao')}
      <button type="button" className={`${LOP_O_NHAP} mt-1 text-left`} onClick={() => setMoGiao(!moGiao)} aria-expanded={moGiao}>
        {chucVu.find((cv) => cv.id === Number(giao))?.name || t('chung.chon')}
      </button>
      {moGiao && <div className="rounded-lg border border-border-subtle p-2">
        <input className={LOP_O_NHAP} value={timGiao} onChange={(e) => setTimGiao(e.target.value)} placeholder={t('uyQuyenTim')} aria-label={t('uyQuyenTim')} />
        <div className="max-h-48 overflow-y-auto">{dsGiao.map((cv) => <button type="button" key={cv.id}
          className="block w-full border-b border-border-subtle p-2 text-left hover:bg-surface-hover"
          onClick={() => { if (doiGiao(String(cv.id))) setMoGiao(false); }}>
          <span className="block text-sm">{cv.name}</span><span className="block text-xs font-normal text-secondary">
            {canBo.filter((u) => u.chuc_vu_id === cv.id).map((u) => [u.ho_ten, u.don_vi_ten].filter(Boolean).join(' · ')).join(', ') || t('uyQuyenKhongCoCanBo')}
          </span>
        </button>)}</div>
      </div>}
    </div>
    <label className="block mt-3 text-sm font-semibold">{t('uyQuyenChucDanhNhan')}
      <input className={`${LOP_O_NHAP} mt-1`} value={tim} onChange={(e) => setTim(e.target.value)} placeholder={t('uyQuyenTim')} />
    </label>
    <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-border-subtle">
      {ds.map((cv) => <label key={cv.id} className="flex gap-2 border-b border-border-subtle p-2">
        <input type="checkbox" disabled={!giao} checked={chon.includes(cv.id)} onChange={(e) => setChon((cu) => e.target.checked ? [...cu, cv.id] : cu.filter((id) => id !== cv.id))} />
        <span><span className="block text-sm font-semibold">{cv.name}</span><span className="block text-xs text-secondary">
          {canBo.filter((u) => u.chuc_vu_id === cv.id).map((u) => [u.ho_ten, u.don_vi_ten].filter(Boolean).join(' · ')).join(', ') || t('uyQuyenKhongCoCanBo')}
        </span></span>
      </label>)}
    </div>
    {tai && <p className="text-sm text-muted">{t('chung.dangTai')}</p>}
    {loiTai != null && <ThongBao>{loi(loiTai)}</ThongBao>}
    {thongBao && <ThongBao loai={daLuu ? 'thanh_cong' : 'loi'}>{thongBao}</ThongBao>}
  </HopThoai>;
}
