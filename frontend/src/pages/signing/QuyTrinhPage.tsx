/**
 * Cấu hình quy trình ký (#80 mục A, E): quy trình CONG_TY do quản trị, PHONG_BAN do lãnh đạo đơn vị áp dụng.
 * Người ký cấu hình theo tài khoản. Đơn vị áp dụng chọn từ Đơn vị của Nhóm 7 (quản trị: mọi đơn vị, lãnh đạo đơn vị:
 * đơn vị mình). Xem chi tiết mọi quy trình; sửa, xóa quy trình nháp (đã kích hoạt thì nhân bản thành phiên bản mới).
 */
import { useState } from 'react';
import { Badge, Button, Card } from '@components/common';
import { DangTai, HopThoai, LoiTai, Rong, ThongBao, TrangThaiBadge, TruongNhap } from '@components/signing/ChungUI';
import { signingApi } from '@lib/signing/api';
import { boDau, LOP_O_NHAP } from '@lib/signing/dinhDang';
import { coQuyen, useTai, useToi } from '@lib/signing/hooks';
import { useSigningT } from '@lib/signing/i18n';
import type { NguoiDungTim, PhamViQuyTrinh, QuyTrinh, VaiTroKy } from '@lib/signing/types';

/** Người ký trong form: theo tài khoản (`nguoi_ky`) hoặc theo chức vụ (giữ nguyên khi sửa quy trình nháp). */
interface NguoiKyNhap {
  khoa: string; ten: string; chuc_danh?: string; nguoi_ky: number | null; chuc_vu_id: number | null;
  pham_vi_chuc_vu: string | null; vai_tro_ky: VaiTroKy; chan_ky_chinh: boolean;
}
interface CapNhap { ten_cap_ky: string; so_gio_xu_ly: string; don_vi_id: number | null; nguoi_ky: NguoiKyNhap[] }

const CAP_TRONG: CapNhap = { ten_cap_ky: '', so_gio_xu_ly: '', don_vi_id: null, nguoi_ky: [] };

function capTuQuyTrinh(q: QuyTrinh, theoChucVu: string): CapNhap[] {
  return q.cap_ky.map((c) => ({
    ten_cap_ky: c.ten_cap_ky, so_gio_xu_ly: c.so_gio_xu_ly ? String(c.so_gio_xu_ly) : '', don_vi_id: c.don_vi_id,
    nguoi_ky: c.nguoi_ky.map((n) => ({
      khoa: `c${n.id}`, ten: n.ten_nguoi_ky || theoChucVu, nguoi_ky: n.nguoi_ky, chuc_vu_id: n.chuc_vu_id,
      pham_vi_chuc_vu: n.pham_vi_chuc_vu, vai_tro_ky: n.vai_tro_ky, chan_ky_chinh: n.chan_ky_chinh,
    })),
  }));
}

/** Chức danh đầy đủ của tài khoản: chức vụ · đơn vị (Nhóm 7). */
function chucDanh(u: NguoiDungTim, khongCo: string): string {
  return [u.chuc_vu, u.don_vi].filter(Boolean).join(' · ') || khongCo;
}

function ChonNguoiDung({ onChon }: { onChon: (u: NguoiDungTim) => void }) {
  const { t } = useSigningT();
  const [q, setQ] = useState('');
  const [mo, setMo] = useState(false);
  const ds = useTai(() => (mo ? signingApi.timNguoiDung(q.trim()) : Promise.resolve([])), [q, mo]);
  return (
    <div className="space-y-1">
      <input className={LOP_O_NHAP} placeholder={t('quyTrinh.timNguoiDung')} value={q}
        onFocus={() => setMo(true)} onBlur={() => setMo(false)} onChange={(e) => setQ(e.target.value)} />
      {mo && !!ds.duLieu?.length && (
        <ul className="max-h-60 overflow-y-auto rounded-lg border border-border-subtle bg-surface shadow-sm" role="listbox">
          {ds.duLieu.map((u) => (
            <li key={u.id}>
              <button type="button" className="block w-full px-3 py-2 text-left hover:bg-surface-hover"
                onMouseDown={(e) => e.preventDefault()} onClick={() => { onChon(u); setQ(''); }}>
                <span className="block text-sm font-semibold text-main">{u.ten}</span>
                <span className="block text-xs text-secondary">{chucDanh(u, t('quyTrinh.chuaCoChucVu'))}</span>
                <span className="block text-xs text-muted">{u.ten_dang_nhap}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {mo && !ds.dangTai && ds.duLieu?.length === 0 && <p className="text-xs text-muted">{t('quyTrinh.khongThayNguoiDung')}</p>}
    </div>
  );
}

function FormTao({ mo, onDong, onXong, banDau }: { mo: boolean; onDong: () => void; onXong: () => void; banDau?: QuyTrinh }) {
  const { t, loi } = useSigningT();
  const { toi } = useToi();
  const [ma, setMa] = useState(banDau?.ma_quy_trinh ?? '');
  const [ten, setTen] = useState(banDau?.ten_quy_trinh ?? '');
  const [phamVi, setPhamVi] = useState<PhamViQuyTrinh>(banDau?.pham_vi ?? (toi?.la_quan_tri ? 'CONG_TY' : 'PHONG_BAN'));
  const donViBanDau = banDau ? banDau.don_vi_ap_dung_id : toi?.don_vi_id;
  const [donVi, setDonVi] = useState(donViBanDau ? String(donViBanDau) : '');
  const dsDonVi = useTai(() => signingApi.donVi(), []);
  const [cap, setCap] = useState<CapNhap[]>(banDau ? capTuQuyTrinh(banDau, t('tao.theoChucVu')) : [CAP_TRONG]);
  const [dangLuu, setDangLuu] = useState(false);
  const [thongBao, setThongBao] = useState('');

  const sua = (i: number, gia_tri: Partial<CapNhap>) => setCap((c) => c.map((x, j) => (j === i ? { ...x, ...gia_tri } : x)));
  const hopLe = ma.trim() && ten.trim() && (phamVi === 'CONG_TY' || donVi)
    && cap.every((c) => c.ten_cap_ky.trim() && c.nguoi_ky.length);

  const luu = async () => {
    setDangLuu(true);
    setThongBao('');
    try {
      const body = {
        ma_quy_trinh: ma.trim(), ten_quy_trinh: ten.trim(), pham_vi: phamVi, mo_ta: banDau?.mo_ta ?? '',
        don_vi_ap_dung_id: phamVi === 'PHONG_BAN' ? Number(donVi) : null,
        cap_ky: cap.map((c, i) => ({
          cap_ky: i + 1, thu_tu: i + 1, ten_cap_ky: c.ten_cap_ky.trim(), don_vi_id: c.don_vi_id,
          so_gio_xu_ly: c.so_gio_xu_ly ? Number(c.so_gio_xu_ly) : null,
          nguoi_ky: c.nguoi_ky.map((n, j) => ({
            ...(n.nguoi_ky ? { nguoi_ky: n.nguoi_ky } : { chuc_vu_id: n.chuc_vu_id, pham_vi_chuc_vu: n.pham_vi_chuc_vu }),
            thu_tu: j + 1, vai_tro_ky: n.vai_tro_ky, chan_ky_chinh: n.chan_ky_chinh,
          })),
        })),
      };
      await (banDau ? signingApi.suaQuyTrinh(banDau.id, body) : signingApi.taoQuyTrinh(body));
      onXong();
    } catch (err) {
      setThongBao(loi(err));
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <HopThoai moTieuDe={banDau ? t('quyTrinh.sua') : t('quyTrinh.tao')} mo={mo} onDong={onDong}
      chanDuoi={<>
        <Button variant="secondary" onClick={onDong}>{t('chung.huyBo')}</Button>
        <Button icon="fa-floppy-disk" isLoading={dangLuu} disabled={!hopLe} onClick={luu}>{t('chung.luu')}</Button>
      </>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TruongNhap nhan={t('quyTrinh.ma')}><input className={LOP_O_NHAP} maxLength={50} value={ma} disabled={!!banDau} onChange={(e) => setMa(e.target.value)} /></TruongNhap>
        <TruongNhap nhan={t('quyTrinh.ten')}><input className={LOP_O_NHAP} value={ten} onChange={(e) => setTen(e.target.value)} /></TruongNhap>
        <TruongNhap nhan={t('quyTrinh.phamVi')} className={phamVi === 'CONG_TY' ? 'sm:col-span-2' : ''}>
          <select className={LOP_O_NHAP} value={phamVi} onChange={(e) => setPhamVi(e.target.value as PhamViQuyTrinh)}>
            <option value="CONG_TY">{t('phamVi.CONG_TY')}</option>
            <option value="PHONG_BAN">{t('phamVi.PHONG_BAN')}</option>
          </select>
        </TruongNhap>
        {phamVi === 'PHONG_BAN' && (
          <TruongNhap nhan={t('quyTrinh.donVi')}>
            <select className={LOP_O_NHAP} value={donVi} onChange={(e) => setDonVi(e.target.value)}>
              <option value="">{t('quyTrinh.chonDonVi')}</option>
              {dsDonVi.duLieu?.map((d) => <option key={d.id} value={String(d.id)}>{d.ten}</option>)}
            </select>
          </TruongNhap>
        )}
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        <div className="text-sm font-bold text-main">{t('quyTrinh.capKy')}</div>
        {cap.map((c, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border-subtle p-2">
            <div className="flex gap-2">
              <span className="pt-2 text-sm font-bold text-main">{i + 1}.</span>
              <input className={LOP_O_NHAP} placeholder={t('quyTrinh.tenCap')} aria-label={`${t('quyTrinh.tenCap')} ${i + 1}`}
                value={c.ten_cap_ky} onChange={(e) => sua(i, { ten_cap_ky: e.target.value })} />
              <input className={`${LOP_O_NHAP} w-32`} inputMode="numeric" placeholder={t('quyTrinh.soGio')}
                aria-label={`${t('quyTrinh.soGio')} ${i + 1}`} value={c.so_gio_xu_ly}
                onChange={(e) => sua(i, { so_gio_xu_ly: e.target.value.replace(/\D/g, '') })} />
            </div>
            {c.nguoi_ky.map((n, j) => (
              <div key={n.khoa} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-main">
                  <span className="font-semibold">{n.ten}</span>
                  {n.chuc_danh && <span className="ml-1 text-xs text-secondary">({n.chuc_danh})</span>}
                </span>
                <select className={`${LOP_O_NHAP} w-auto`} value={n.vai_tro_ky}
                  onChange={(e) => sua(i, { nguoi_ky: c.nguoi_ky.map((x, k) => (k === j ? { ...x, vai_tro_ky: e.target.value as VaiTroKy } : x)) })}>
                  <option value="KY_CHINH">{t('vaiTro.KY_CHINH')}</option>
                  <option value="KY_NHAY">{t('vaiTro.KY_NHAY')}</option>
                </select>
                {n.vai_tro_ky === 'KY_NHAY' && (
                  <label className="flex items-center gap-1.5 text-sm text-secondary">
                    <input type="checkbox" checked={n.chan_ky_chinh}
                      onChange={(e) => sua(i, { nguoi_ky: c.nguoi_ky.map((x, k) => (k === j ? { ...x, chan_ky_chinh: e.target.checked } : x)) })} />
                    {t('quyTrinh.chanKyChinh')}
                  </label>
                )}
                <button type="button" className="text-danger" aria-label={t('quyTrinh.boNguoiKy')}
                  onClick={() => sua(i, { nguoi_ky: c.nguoi_ky.filter((_, k) => k !== j) })}>
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                </button>
              </div>
            ))}
            <ChonNguoiDung onChon={(u: NguoiDungTim) => !c.nguoi_ky.some((n) => n.nguoi_ky === u.id)
              && sua(i, { nguoi_ky: [...c.nguoi_ky, {
                khoa: `u${u.id}`, ten: u.ten, chuc_danh: chucDanh(u, ''), nguoi_ky: u.id, chuc_vu_id: null, pham_vi_chuc_vu: null,
                vai_tro_ky: 'KY_CHINH', chan_ky_chinh: true,
              }] })} />
          </div>
        ))}
        <Button size="sm" variant="ghost" icon="fa-plus"
          onClick={() => setCap((c) => [...c, CAP_TRONG])}>{t('quyTrinh.themCap')}</Button>
      </div>
      {thongBao && <ThongBao>{thongBao}</ThongBao>}
    </HopThoai>
  );
}

function ChiTietQuyTrinh({ id, onDong }: { id: number; onDong: () => void }) {
  const { t, loi } = useSigningT();
  const ct = useTai(() => signingApi.chiTietQuyTrinh(id), [id]);
  const q = ct.duLieu;
  return (
    <HopThoai moTieuDe={t('quyTrinh.chiTiet')} mo onDong={onDong}
      chanDuoi={<Button variant="secondary" onClick={onDong}>{t('chung.dong')}</Button>}>
      {ct.dangTai && <DangTai />}
      {ct.loi && <LoiTai thongBao={loi(ct.loi)} onThuLai={ct.tai} />}
      {q && (
        <div className="space-y-3 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-secondary">{t('quyTrinh.ma')}</dt><dd className="font-semibold text-main">{q.ma_quy_trinh}</dd>
            <dt className="text-secondary">{t('quyTrinh.ten')}</dt><dd className="text-main">{q.ten_quy_trinh}</dd>
            <dt className="text-secondary">{t('quyTrinh.phienBanNhan')}</dt><dd className="text-main">{q.phien_ban}</dd>
            <dt className="text-secondary">{t('danhSach.trangThai')}</dt><dd><TrangThaiBadge trangThai={q.trang_thai} /></dd>
            <dt className="text-secondary">{t('quyTrinh.phamVi')}</dt>
            <dd className="text-main">{t(`phamVi.${q.pham_vi}`)}{q.ten_don_vi_ap_dung ? ` · ${q.ten_don_vi_ap_dung}` : ''}</dd>
            {q.mo_ta && <><dt className="text-secondary">{t('quyTrinh.moTa')}</dt><dd className="text-main">{q.mo_ta}</dd></>}
          </dl>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-subtle text-xs font-bold uppercase tracking-wider text-muted">
                <th className="px-3 py-2">#</th><th className="px-3 py-2">{t('quyTrinh.capKy')}</th>
                <th className="px-3 py-2">{t('quyTrinh.nguoiKy')}</th><th className="px-3 py-2">{t('quyTrinh.soGioNhan')}</th>
              </tr>
            </thead>
            <tbody>
              {q.cap_ky.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle hover:bg-surface-hover align-top">
                  <td className="px-3 py-2.5 font-bold text-main">{c.thu_tu}</td>
                  <td className="px-3 py-2.5 text-main font-medium">{c.ten_cap_ky}</td>
                  <td className="px-3 py-2.5">
                    <ul className="space-y-0.5">
                      {c.nguoi_ky.map((n) => (
                        <li key={n.id} className="text-main">
                          {n.ten_nguoi_ky || t('tao.theoChucVu')}
                          <span className="ml-1 text-secondary">({t(`vaiTro.${n.vai_tro_ky}`)}
                            {n.vai_tro_ky === 'KY_NHAY' && n.chan_ky_chinh ? ` · ${t('quyTrinh.chanKyChinh')}` : ''})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-2.5 text-secondary">{c.so_gio_xu_ly ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HopThoai>
  );
}

export default function QuyTrinhPage() {
  const { t, loi } = useSigningT();
  const { toi } = useToi();
  const ds = useTai(() => signingApi.quyTrinh());
  const [tim, setTim] = useState('');
  const [locTrangThai, setLocTrangThai] = useState('');
  const [locPhamVi, setLocPhamVi] = useState('');
  const tuKhoa = boDau(tim.trim());
  const hienThi = (ds.duLieu ?? []).filter((q) => (!locTrangThai || q.trang_thai === locTrangThai)
    && (!locPhamVi || q.pham_vi === locPhamVi)
    && (!tuKhoa || [q.ma_quy_trinh, q.ten_quy_trinh, q.ten_don_vi_ap_dung ?? ''].some((x) => boDau(x).includes(tuKhoa))));
  const [taoMo, setTaoMo] = useState(false);
  const [dangSua, setDangSua] = useState<QuyTrinh | null>(null);
  const [xemId, setXemId] = useState<number | null>(null);
  const [canXoa, setCanXoa] = useState<QuyTrinh | null>(null);
  const [thongBao, setThongBao] = useState('');
  const quanLy = coQuyen(toi, 'manage_signing_process');

  const thaoTac = async (q: QuyTrinh, loai: 'kich-hoat' | 'ngung' | 'nhan-ban') => {
    setThongBao('');
    try {
      await signingApi.thaoTacQuyTrinh(q.id, loai);
      ds.tai();
    } catch (err) {
      setThongBao(loi(err));
    }
  };

  const xoa = async (q: QuyTrinh) => {
    setCanXoa(null);
    setThongBao('');
    try {
      await signingApi.xoaQuyTrinh(q.id);
      ds.tai();
    } catch (err) {
      setThongBao(loi(err));
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-48 flex-1 flex-col gap-1.5 text-xs font-semibold text-secondary">
            <span><i className="fa-solid fa-magnifying-glass text-primary text-xs mr-1" aria-hidden="true" />{t('danhSach.timKiem')}</span>
            <input className={LOP_O_NHAP} type="search" value={tim} placeholder={t('quyTrinh.goiYTim')} onChange={(e) => setTim(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-secondary">
            <span><i className="fa-solid fa-filter text-primary text-xs mr-1" aria-hidden="true" />{t('danhSach.trangThai')}</span>
            <select className={`${LOP_O_NHAP} w-auto`} value={locTrangThai} onChange={(e) => setLocTrangThai(e.target.value)}>
              <option value="">{t('danhSach.tatCa')}</option>
              {['NHAP', 'HOAT_DONG', 'NGUNG'].map((s) => <option key={s} value={s}>{t(`trangThai.${s}`)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-secondary">
            <span><i className="fa-solid fa-diagram-project text-primary text-xs mr-1" aria-hidden="true" />{t('quyTrinh.phamVi')}</span>
            <select className={`${LOP_O_NHAP} w-auto`} value={locPhamVi} onChange={(e) => setLocPhamVi(e.target.value)}>
              <option value="">{t('danhSach.tatCa')}</option>
              <option value="CONG_TY">{t('phamVi.CONG_TY')}</option>
              <option value="PHONG_BAN">{t('phamVi.PHONG_BAN')}</option>
            </select>
          </label>
          {quanLy && <Button className="ml-auto" icon="fa-plus" onClick={() => setTaoMo(true)}>{t('quyTrinh.tao')}</Button>}
        </div>
      </Card>
      {!quanLy && <ThongBao loai="thong_tin">{t('quyTrinh.chiQuanLy')}</ThongBao>}
      {thongBao && <ThongBao>{thongBao}</ThongBao>}
      {ds.dangTai && <DangTai />}
      {ds.loi && <LoiTai thongBao={loi(ds.loi)} onThuLai={ds.tai} />}
      {ds.duLieu && hienThi.length === 0 && (
        <Rong icon="fa-diagram-project">{t(ds.duLieu.length ? 'quyTrinh.khongKhopLoc' : 'quyTrinh.rong')}</Rong>
      )}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {hienThi.map((q) => (
          <Card key={q.id} className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xl font-bold text-main">{q.ten_quy_trinh}</span>
              <div className="flex items-center gap-1.5">
                <TrangThaiBadge trangThai={q.trang_thai} />
                <Badge variant="info" size="sm">{t(`phamVi.${q.pham_vi}`)}{q.don_vi_ap_dung_id ? ` · ${q.ten_don_vi_ap_dung ?? `#${q.don_vi_ap_dung_id}`}` : ''}</Badge>
              </div>
            </div>
            <div className="text-xs text-muted font-mono">{q.ma_quy_trinh} · {t('quyTrinh.phienBan', { so: q.phien_ban })}</div>
            <ol className="space-y-1 text-sm">
              {q.cap_ky.map((c) => (
                <li key={c.id} className="text-main">
                  {c.cap_ky}. {c.ten_cap_ky}:{' '}
                  <span className="text-secondary">
                    {c.nguoi_ky.map((n) => `${n.ten_nguoi_ky || t('tao.theoChucVu')} (${t(`vaiTro.${n.vai_tro_ky}`)})`).join(', ')}
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" icon="fa-eye" onClick={() => setXemId(q.id)}>{t('quyTrinh.xemChiTiet')}</Button>
              {quanLy && q.trang_thai === 'NHAP' && (
                <>
                  <Button size="sm" icon="fa-play" onClick={() => thaoTac(q, 'kich-hoat')}>{t('quyTrinh.kichHoat')}</Button>
                  <Button size="sm" variant="secondary" icon="fa-pen" onClick={() => setDangSua(q)}>{t('quyTrinh.sua')}</Button>
                  <Button size="sm" variant="ghost" icon="fa-trash" onClick={() => setCanXoa(q)}>{t('quyTrinh.xoa')}</Button>
                </>
              )}
              {quanLy && (
                <>
                {q.trang_thai === 'HOAT_DONG' && <Button size="sm" variant="secondary" icon="fa-stop" onClick={() => thaoTac(q, 'ngung')}>{t('quyTrinh.ngung')}</Button>}
                <Button size="sm" variant="ghost" icon="fa-copy" onClick={() => thaoTac(q, 'nhan-ban')}>{t('quyTrinh.nhanBan')}</Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
      {taoMo && <FormTao mo={taoMo} onDong={() => setTaoMo(false)} onXong={() => { setTaoMo(false); ds.tai(); }} />}
      {dangSua && (
        <FormTao key={dangSua.id} mo banDau={dangSua} onDong={() => setDangSua(null)} onXong={() => { setDangSua(null); ds.tai(); }} />
      )}
      {xemId !== null && <ChiTietQuyTrinh id={xemId} onDong={() => setXemId(null)} />}
      {canXoa && (
        <HopThoai moTieuDe={t('quyTrinh.xoa')} mo onDong={() => setCanXoa(null)}
          chanDuoi={<>
            <Button variant="secondary" onClick={() => setCanXoa(null)}>{t('chung.huyBo')}</Button>
            <Button icon="fa-trash" onClick={() => xoa(canXoa)}>{t('chung.xacNhan')}</Button>
          </>}>
          <p className="text-sm text-main">{t('quyTrinh.xacNhanXoa', { ten: canXoa.ten_quy_trinh })}</p>
        </HopThoai>
      )}
    </div>
  );
}
