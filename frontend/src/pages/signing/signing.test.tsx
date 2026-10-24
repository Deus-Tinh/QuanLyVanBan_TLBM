/**
 * Giao diện Trình ký (#80 mục E): tab theo quyền, danh sách (rỗng/lỗi/thử lại), hành động theo quyền và trạng thái,
 * hộp thoại ký hiển thị mã băm và chặn ký khi tệp đang xem khác mã băm đã khóa; quy trình chọn đơn vị từ danh sách;
 * bộ lọc danh sách, thông báo, xem chi tiết/xóa quy trình nháp, danh sách tệp của hồ sơ.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}
if (typeof globalThis.DOMMatrix === 'undefined') {
  class MockDOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    is2D = true; isIdentity = true;
  }
  globalThis.DOMMatrix = MockDOMMatrix as unknown as typeof DOMMatrix;
}

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HanhDong from '@components/signing/HanhDong';
import TaiLieuPanel from '@components/signing/TaiLieuPanel';
import TienTrinh from '@components/signing/TienTrinh';
import { signingApi } from '@lib/signing/api';
import { SigningContext } from '@lib/signing/hooks';
import type { HoSoChiTiet, LuotTrinh, NguoiKyLuot, NguoiDungHienTai, QuyTrinh } from '@lib/signing/types';
import DanhSachPage from './DanhSachPage';
import QuyTrinhPage from './QuyTrinhPage';
import SigningModule from './SigningModule';
import TaiLieuPage from './TaiLieuPage';
import ThongBaoPage from './ThongBaoPage';

vi.mock('@lib/signing/api', async () => {
  const actual = await vi.importActual<typeof import('@lib/signing/api')>('@lib/signing/api');
  return { ...actual, signingApi: {
    toi: vi.fn(), danhSach: vi.fn(), thongKe: vi.fn(), taiLieu: vi.fn(), quyTrinh: vi.fn(), donVi: vi.fn(), thongBao: vi.fn(), chiTietQuyTrinh: vi.fn(),
    xoaQuyTrinh: vi.fn(), tepCuaLuot: vi.fn(), tepGoc: vi.fn(), tepHoanTat: vi.fn(), bangChung: vi.fn(),
    uyQuyen: vi.fn(), timNguoiNhanUyQuyen: vi.fn(),
  } };
});
// pdfjs-dist cần DOMMatrix/canvas của trình duyệt; jsdom không có, nên chỉ thay lớp vẽ PDF.
vi.mock('@lib/signing/pdf', () => ({
  moPdf: vi.fn().mockResolvedValue({ numPages: 1, getPage: vi.fn().mockResolvedValue({ getViewport: () => ({ width: 600, height: 800 }), render: () => ({ promise: Promise.resolve() }) }) }),
  veTrang: vi.fn(() => ({ xong: Promise.resolve(undefined), huy: vi.fn() })),
  laLoiHuyVe: vi.fn(() => false),
}));
const api = vi.mocked(signingApi);

const TOI: NguoiDungHienTai = {
  id: 7, ten: 'Trưởng phòng', don_vi_id: 1, la_quan_tri: false, la_lanh_dao_don_vi: false,
  quyen: { view_trinhky: true, add_trinhky: false, sign_trinhky: true, send_trinhky: false },
};

function hoSo(sua: Partial<HoSoChiTiet> = {}): HoSoChiTiet {
  return {
    id: 12, document_type: 'vanbandi', van_ban_id: 3, van_ban: { so_hieu: '15/TTr', trich_yeu: 'Mua sắm' },
    quy_trinh: 1, ma_quy_trinh: 'QT', ten_quy_trinh: 'Duyệt mua sắm', phien_ban_quy_trinh: 1,
    trang_thai: 'CHO_KY', han_chot: null, ngay_gui: null, ngay_hoan_thanh: null, ly_do_tu_choi: '', ly_do_huy: '',
    ghi_chu: '', ho_so_goc: null, phien_ban_van_ban: '1', ma_bam_tai_lieu: 'a'.repeat(64), create_by: 3,
    ten_nguoi_tao: 'Văn thư', created_at: '2026-10-07T01:00:00Z', dang_cho: [{ id: 1, nguoi_ky: 7, ten_nguoi_ky: 'Trưởng phòng', vai_tro_ky: 'KY_CHINH' }],
    luot_trinh: [{
      id: 5, so_luot: 1, luot_truoc: null, phien_ban_van_ban: '1', ma_bam_tai_lieu: 'a'.repeat(64), trang_thai: 'CHO_KY',
      ly_do: '', thoi_diem_gui: null, thoi_diem_hoan_thanh: null, trang_thai_tep_hoan_tat: null, loi_tep_hoan_tat: '',
      ma_bam_tep_hoan_tat: '', ma_bam_bang_chung: null, cap_ky: [], yeu_cau_sua: [],
    }],
    lich_su: [], trang_thai_luot: 'CHO_KY', qua_han: false,
    ...sua,
  };
}

/** Một trang danh sách hồ sơ (phân trang DRF). */
function trang<T>(results: T[], count = results.length) {
  return { count, next: null, previous: null, results };
}

// Gắn dưới route cha như ứng dụng thật (/approvals/*) để route con `:id` không khớp nhầm "/approvals".
const moModule = (duong_dan = '/approvals') => render(
  <MemoryRouter initialEntries={[duong_dan]}>
    <Routes><Route path="/approvals/*" element={<SigningModule />} /></Routes>
  </MemoryRouter>,
);

const boc = (ui: React.ReactNode, toi: NguoiDungHienTai = TOI) => render(
  <MemoryRouter><SigningContext.Provider value={{ toi, taiLaiToi: () => undefined }}>{ui}</SigningContext.Provider></MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  api.quyTrinh.mockResolvedValue([]);
  api.thongBao.mockResolvedValue([]);
  api.thongKe.mockResolvedValue({ tat_ca: 3, nhap: 0, cho_ky: 1, tra_lai: 1, qua_han: 1, hoan_thanh: 0, tu_choi: 0, huy: 0 });
  localStorage.setItem('tlbm_lang', 'vi');
});

describe('SigningModule', () => {
  it('chỉ hiện tab theo quyền (không có quyền tạo thì không có tab tạo hồ sơ)', async () => {
    api.toi.mockResolvedValue(TOI);
    api.danhSach.mockResolvedValue(trang([]));
    moModule();
    expect(await screen.findByRole('link', { name: /Cần tôi ký duyệt/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Khóa ký & PIN/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tạo hồ sơ trình ký/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Ký số & Phê duyệt điện tử/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Trình ký' })).toBeInTheDocument();
  });

  it('tab "Cần tôi ký duyệt" hiện số hồ sơ đang chờ; tab phụ nằm trong nhóm riêng', async () => {
    api.toi.mockResolvedValue(TOI);
    api.danhSach.mockResolvedValue(trang([]));
    moModule();
    const tabKy = await screen.findByRole('link', { name: /Cần tôi ký duyệt/ });
    await waitFor(() => expect(tabKy).toHaveTextContent('1'));
    expect(api.thongKe).toHaveBeenCalledWith('can_toi_ky');
    const nav = within(screen.getByRole('navigation'));
    for (const ten of [/Tôi đã gửi trình/, /Văn bản theo quyền/, /Văn bản công khai/, /Thông báo/, /Khóa ký & PIN/]) {
      expect(nav.getByRole('link', { name: ten })).toBeInTheDocument();
    }
    expect(nav.queryByRole('link', { name: /^Quy trình/ })).toBeInTheDocument();
  });

  it('có quyền tạo thì có nút riêng "Tạo hồ sơ trình ký" ở đầu trang, không nằm trong tab', async () => {
    api.toi.mockResolvedValue({ ...TOI, quyen: { ...TOI.quyen, add_trinhky: true } });
    api.danhSach.mockResolvedValue(trang([]));
    moModule();
    expect(await screen.findByRole('button', { name: /Tạo hồ sơ trình ký/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Tạo hồ sơ trình ký/ })).not.toBeInTheDocument();
  });
});

describe('DanhSachPage', () => {
  it('hiện trạng thái rỗng', async () => {
    api.danhSach.mockResolvedValue(trang([]));
    boc(<DanhSachPage hop="can_toi_ky" />);
    expect(await screen.findByText('Không có hồ sơ nào đang chờ bạn ký duyệt.')).toBeInTheDocument();
    expect(api.danhSach).toHaveBeenCalledWith('can_toi_ky', {}, 1);
  });

  it('hiện dòng hồ sơ với văn bản, mức độ, trạng thái, người đang chờ', async () => {
    api.danhSach.mockResolvedValue(trang([hoSo()]));
    boc(<DanhSachPage hop="toi_gui" />);
    const bang = within(await screen.findByRole('table'));
    expect(bang.getByRole('link', { name: /15\/TTr — Mua sắm/ })).toHaveAttribute('href', '/approvals/12');
    expect(bang.getByText('#12 · Duyệt mua sắm')).toBeInTheDocument();
    expect(bang.queryByRole('columnheader', { name: /Tác vụ/ })).not.toBeInTheDocument();
    expect(bang.getByText('Đang chờ ký')).toBeInTheDocument();
    expect(bang.getByText('Trưởng phòng')).toBeInTheDocument();
  });

  it('bộ lọc: từ khóa tự áp dụng, Lọc thêm thu gọn mặc định, mức độ áp dụng ngay, xóa lọc trả về rỗng', async () => {
    api.danhSach.mockResolvedValue(trang([]));
    boc(<DanhSachPage hop="toi_gui" />);
    await screen.findByText('Bạn chưa gửi trình hồ sơ nào.');
    expect(screen.queryByRole('button', { name: /^Lọc$/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Từ ngày')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Xóa lọc/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '15/TTr' } });
    await waitFor(() => expect(api.danhSach).toHaveBeenLastCalledWith('toi_gui', { q: '15/TTr' }, 1));
    fireEvent.click(screen.getByRole('button', { name: /Lọc thêm/ }));
    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-10-01' } });
    await waitFor(() => expect(api.danhSach).toHaveBeenLastCalledWith('toi_gui', { q: '15/TTr', tu_ngay: '2026-10-01' }, 1));
    expect(screen.getByRole('button', { name: /Lọc thêm \(1\)/ })).toBeInTheDocument();
    expect(await screen.findByText('Không có hồ sơ nào khớp bộ lọc.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Xóa lọc/ }));
    await waitFor(() => expect(api.danhSach).toHaveBeenLastCalledWith('toi_gui', {}, 1));
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('hộp rỗng và chưa lọc: không hiện khối lọc, chỉ hiện trạng thái rỗng; thống kê gọi một lần', async () => {
    api.thongKe.mockResolvedValue({ tat_ca: 0, nhap: 0, cho_ky: 0, tra_lai: 0, qua_han: 0, hoan_thanh: 0, tu_choi: 0, huy: 0 });
    api.danhSach.mockResolvedValue(trang([]));
    boc(<DanhSachPage hop="tat_ca" />);
    expect(await screen.findByText(/(Chưa có hồ sơ nào bạn được xem\.|Chưa có văn bản nào bạn được xem\.)/)).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Lọc nhanh' })).not.toBeInTheDocument();
    expect(api.thongKe).toHaveBeenCalledTimes(1);
  });

  it('thẻ lọc nhanh hiện số lượng, ẩn thẻ rỗng, bấm thẻ là lọc', async () => {
    api.danhSach.mockResolvedValue(trang([]));
    boc(<DanhSachPage hop="toi_gui" />);
    const quaHan = await screen.findByRole('button', { name: /Quá hạn/ });
    expect(quaHan).toHaveTextContent('1');
    expect(screen.queryByRole('button', { name: /Hoàn tất/ })).not.toBeInTheDocument();  // số lượng 0
    fireEvent.click(quaHan);
    await waitFor(() => expect(api.danhSach).toHaveBeenLastCalledWith('toi_gui', { nhanh: 'qua_han' }, 1));
    expect(screen.getByRole('button', { name: /Quá hạn/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('phân trang: hiện tổng số, sang trang sau gọi trang 2; đổi bộ lọc về trang 1', async () => {
    api.danhSach.mockResolvedValue(trang([hoSo()], 23));
    boc(<DanhSachPage hop="toi_gui" />);
    const thanh = await screen.findByRole('navigation', { name: 'Phân trang' });
    expect(within(thanh).getByText('Hiển thị 1–10 trên 23 hồ sơ')).toBeInTheDocument();
    expect(within(thanh).getByText('Trang 1/3')).toBeInTheDocument();
    expect(within(thanh).getByRole('button', { name: /Trước/ })).toBeDisabled();
    fireEvent.click(within(thanh).getByRole('button', { name: /Sau/ }));
    await waitFor(() => expect(api.danhSach).toHaveBeenLastCalledWith('toi_gui', {}, 2));
    expect(await screen.findByText('Trang 2/3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Quá hạn/ }));
    await waitFor(() => expect(api.danhSach).toHaveBeenLastCalledWith('toi_gui', { nhanh: 'qua_han' }, 1));
  });

  it('một trang thì không hiện thanh phân trang', async () => {
    api.danhSach.mockResolvedValue(trang([hoSo()]));
    boc(<DanhSachPage hop="toi_gui" />);
    await screen.findByRole('table');
    expect(screen.queryByRole('navigation', { name: 'Phân trang' })).not.toBeInTheDocument();
  });

  it('lỗi tải có nút thử lại', async () => {
    api.danhSach.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(trang([]));
    boc(<DanhSachPage hop="tat_ca" />);
    fireEvent.click(await screen.findByRole('button', { name: /Thử lại/ }));
    expect(await screen.findByText(/(Chưa có hồ sơ nào bạn được xem\.|Chưa có văn bản nào bạn được xem\.)/)).toBeInTheDocument();
  });
});

describe('HanhDong', () => {
  it('người ký đang được mở thấy Ký duyệt / Trả lại để sửa / Không đồng ý; không thấy Hủy', () => {
    boc(<HanhDong hoSo={hoSo()} luot={hoSo().luot_trinh[0]} maBamTepDangXem={'a'.repeat(64)} onXong={() => undefined} />);
    expect(screen.getByRole('button', { name: /Ký duyệt/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trả lại để sửa/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Không đồng ý ban hành/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hủy hồ sơ/ })).not.toBeInTheDocument();
  });

  it('người ngoài luồng không thấy hành động ký; người tạo thấy Hủy', () => {
    const nguoiTao = { ...TOI, id: 3 };
    boc(<HanhDong hoSo={hoSo()} luot={hoSo().luot_trinh[0]} maBamTepDangXem={null} onXong={() => undefined} />, nguoiTao);
    expect(screen.queryByRole('button', { name: /Ký duyệt/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hủy hồ sơ/ })).toBeInTheDocument();
  });

  it('hộp thoại ký chặn ký khi tệp đang xem khác mã băm đã khóa', async () => {
    boc(<HanhDong hoSo={hoSo()} luot={hoSo().luot_trinh[0]} maBamTepDangXem={'b'.repeat(64)} onXong={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Ký duyệt/ }));
    const hop = await screen.findByRole('dialog');
    expect(hop).toHaveTextContent('Tệp đã thay đổi so với lượt trình');
    fireEvent.change(screen.getByLabelText(/Nhập PIN ký/), { target: { value: '48273916' } });
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Ký duyệt/ }).at(-1)).toBeDisabled());
  });
});

function nguoiKy(sua: Partial<NguoiKyLuot>): NguoiKyLuot {
  return {
    id: 21, nguoi_ky: 9, ten_nguoi_ky: 'Giám đốc', ten_chuc_vu: null, vai_tro_ky: 'KY_CHINH', chan_ky_chinh: true,
    trang_thai: 'CHO_KY', thoi_diem_mo: '2026-10-07T01:00:00Z', ngay_ky: null, ngay_tu_choi: null, ly_do_tu_choi: '',
    uy_quyen_tu: null, ten_nguoi_uy_quyen: null, ly_do_uy_quyen: '', ngay_uy_quyen: null, trang_ky: null,
    toa_do_x: null, toa_do_y: null, chieu_rong_khung: null, chieu_cao_khung: null, chu_ky: null, ...sua,
  };
}

function luotCo(nguoi: NguoiKyLuot[]): LuotTrinh {
  return {
    ...hoSo().luot_trinh[0],
    cap_ky: [{ id: 2, cap_ky: 1, ten_cap_ky: 'Duyệt', thu_tu: 1, trang_thai: 'DANG_KY', han_xu_ly: null,
      thoi_diem_mo: null, thoi_diem_hoan_thanh: null, nguoi_ky: nguoi }],
  };
}

describe('Danh sách: trạng thái trả lại, quá hạn', () => {
  it('hồ sơ chỉ hiển thị duy nhất một trạng thái: trả sửa hiện "Đang trả lại để sửa", quá hạn hiện "Quá hạn"', async () => {
    api.danhSach.mockResolvedValue(trang([
      hoSo({ id: 1, trang_thai_luot: 'YEU_CAU_SUA', qua_han: false }),
      hoSo({ id: 2, trang_thai_luot: 'CHO_KY', qua_han: true }),
    ]));
    boc(<DanhSachPage hop="tat_ca" />);
    expect((await screen.findAllByText('Đang trả lại để sửa')).length).toBe(2);
    expect(screen.getAllByText('Quá hạn').length).toBe(3);
  });
});

describe('Ủy quyền ký', () => {
  const QUAN_TRI: NguoiDungHienTai = { ...TOI, id: 1, quyen: { ...TOI.quyen, delegate_trinhky: true } };

  it('không có delegate_trinhky thì không thấy nút ủy quyền', () => {
    const luot = luotCo([nguoiKy({})]);
    boc(<HanhDong hoSo={hoSo({ luot_trinh: [luot] })} luot={luot} maBamTepDangXem={null} onXong={() => undefined} />,
      { ...TOI, id: 1 });
    expect(screen.queryByRole('button', { name: /Ủy quyền ký/ })).not.toBeInTheDocument();
  });

  it('chọn người ký, tìm người nhận, nhập lý do rồi gửi đúng payload kèm Idempotency-Key', async () => {
    const luot = luotCo([nguoiKy({}), nguoiKy({ id: 22, nguoi_ky: 10, ten_nguoi_ky: 'Đã ký', trang_thai: 'DA_KY' })]);
    const ho_so = hoSo({ luot_trinh: [luot] });
    api.timNguoiNhanUyQuyen.mockResolvedValue([
      { id: 15, ten: 'Phó giám đốc', ten_dang_nhap: 'pgd', chuc_vu: 'Phó giám đốc', don_vi_id: 1, don_vi: 'Ban TGĐ' },
    ]);
    api.uyQuyen.mockResolvedValue(ho_so);
    const xong = vi.fn();
    boc(<HanhDong hoSo={ho_so} luot={luot} maBamTepDangXem={null} onXong={xong} />, QUAN_TRI);
    fireEvent.click(screen.getByRole('button', { name: /Ủy quyền ký/ }));
    const chonNguoiKy = await screen.findByRole('combobox', { name: /Người ký được thay/ });
    expect(within(chonNguoiKy).queryByRole('option', { name: /Đã ký/ })).not.toBeInTheDocument();
    fireEvent.change(chonNguoiKy, { target: { value: '21' } });
    const chonNhan = screen.getByRole('combobox', { name: /Người nhận ủy quyền/ });
    await waitFor(() => expect(within(chonNhan).getByRole('option', { name: /Phó giám đốc/ })).toBeInTheDocument());
    fireEvent.change(chonNhan, { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Lý do ủy quyền/), { target: { value: 'Đi công tác' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Ủy quyền ký/ }).at(-1)!);
    await waitFor(() => expect(api.uyQuyen).toHaveBeenCalledWith(12, expect.any(String),
      { dong_nguoi_ky: 21, nguoi_nhan: 15, ly_do_uy_quyen: 'Đi công tác' }));
    await waitFor(() => expect(xong).toHaveBeenCalledWith(ho_so));
  });

  it('tiến trình hiện người ký thay', () => {
    boc(<TienTrinh luot={luotCo([nguoiKy({ ten_nguoi_ky: 'Phó giám đốc', ten_nguoi_uy_quyen: 'Giám đốc' })])} />);
    expect(screen.getByText('Ký thay Giám đốc')).toBeInTheDocument();
  });
});

describe('Ký bằng file khóa', () => {
  it('hộp thoại ký có ô tải file khóa và báo lỗi khi file sai định dạng', async () => {
    boc(<HanhDong hoSo={hoSo()} luot={hoSo().luot_trinh[0]} maBamTepDangXem={'a'.repeat(64)} onXong={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Ký duyệt/ }));
    const o = await screen.findByLabelText(/File khóa ký/);
    fireEvent.change(o, { target: { files: [new File(['khong phai json'], 'sai.tlbmkey')] } });
    expect(await screen.findByText('File khóa không đúng định dạng.')).toBeInTheDocument();
  });
});

describe('QuyTrinhPage', () => {
  const TP: NguoiDungHienTai = { ...TOI, don_vi_id: 4, la_lanh_dao_don_vi: true, quyen: { ...TOI.quyen, manage_signing_process: true } };
  const QT: QuyTrinh = {
    id: 1, ma_quy_trinh: 'QT-KH', ten_quy_trinh: 'Duyệt kế hoạch', mo_ta: '', phien_ban: 1, trang_thai: 'HOAT_DONG',
    pham_vi: 'PHONG_BAN', don_vi_ap_dung_id: 4, ten_don_vi_ap_dung: 'Phòng Kế hoạch', cap_ky: [],
  };

  it('hiện tên đơn vị áp dụng và chọn đơn vị từ danh sách khi tạo quy trình phòng ban', async () => {
    api.quyTrinh.mockResolvedValue([QT]);
    api.donVi.mockResolvedValue([{ id: 4, ten: 'Phòng Kế hoạch' }]);
    boc(<QuyTrinhPage />, TP);
    expect(await screen.findByText(/Phòng ban · Phòng Kế hoạch/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tạo quy trình/ }));
    const chon = await screen.findByRole('combobox', { name: /Đơn vị áp dụng/ });
    await waitFor(() => expect(within(chon).getByRole('option', { name: 'Phòng Kế hoạch' })).toBeInTheDocument());
    expect((chon as HTMLSelectElement).value).toBe('4');
    expect(api.donVi).toHaveBeenCalledTimes(1);
  });

  it('form tạo quy trình: ô tên cấp ký có nhãn "Tên cấp ký", không dùng nhãn "Tên quy trình"', async () => {
    api.quyTrinh.mockResolvedValue([QT]);
    api.donVi.mockResolvedValue([{ id: 4, ten: 'Phòng Kế hoạch' }]);
    boc(<QuyTrinhPage />, TP);
    fireEvent.click(await screen.findByRole('button', { name: /Tạo quy trình/ }));
    const o = await screen.findByRole('textbox', { name: 'Tên cấp ký 1' });
    expect(o).toHaveAttribute('placeholder', 'Tên cấp ký');
    expect(screen.queryByPlaceholderText('Tên quy trình')).not.toBeInTheDocument();
  });

  it('xem chi tiết quy trình; quy trình nháp có Sửa và Xóa, xóa phải xác nhận', async () => {
    const nhap: QuyTrinh = {
      ...QT, id: 2, trang_thai: 'NHAP', ten_quy_trinh: 'Quy trình nháp', cap_ky: [{
        id: 9, cap_ky: 1, ten_cap_ky: 'Trưởng phòng', thu_tu: 1, don_vi_id: null, so_gio_xu_ly: 24, nguoi_ky: [{
          id: 3, nguoi_ky: 7, ten_nguoi_ky: 'Trần Trưởng', chuc_vu_id: null, pham_vi_chuc_vu: null,
          vai_tro_ky: 'KY_CHINH', chan_ky_chinh: true, thu_tu: 1,
        }],
      }],
    };
    api.quyTrinh.mockResolvedValue([QT, nhap]);
    api.chiTietQuyTrinh.mockResolvedValue(nhap);
    api.xoaQuyTrinh.mockResolvedValue({});
    boc(<QuyTrinhPage />, TP);
    await screen.findByText('Quy trình nháp');
    expect(screen.getAllByRole('button', { name: /Sửa quy trình/ })).toHaveLength(1);  // chỉ quy trình nháp
    fireEvent.click(screen.getAllByRole('button', { name: /Xem chi tiết/ })[1]);
    expect(await screen.findByText('Chi tiết quy trình')).toBeInTheDocument();
    expect(await screen.findByText('Trần Trưởng')).toBeInTheDocument();
    expect(api.chiTietQuyTrinh).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getAllByRole('button', { name: /Đóng/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Xóa quy trình/ }));
    expect(screen.getByText(/Xóa quy trình nháp “Quy trình nháp”/)).toBeInTheDocument();
    expect(api.xoaQuyTrinh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận/ }));
    await waitFor(() => expect(api.xoaQuyTrinh).toHaveBeenCalledWith(2));
  });
});

describe('QuyTrinhPage bộ lọc', () => {
  it('lọc quy trình theo từ khóa, trạng thái và phạm vi', async () => {
    const mau = (id: number, ten: string, trang_thai: 'NHAP' | 'HOAT_DONG', pham_vi: 'CONG_TY' | 'PHONG_BAN'): QuyTrinh => ({
      id, ma_quy_trinh: `QT-${id}`, ten_quy_trinh: ten, mo_ta: '', phien_ban: 1, trang_thai, pham_vi,
      don_vi_ap_dung_id: null, ten_don_vi_ap_dung: null, cap_ky: [],
    });
    api.quyTrinh.mockResolvedValue([mau(1, 'Duyệt tờ trình', 'HOAT_DONG', 'CONG_TY'), mau(2, 'Duyệt hợp đồng', 'NHAP', 'PHONG_BAN')]);
    boc(<QuyTrinhPage />);
    await screen.findByText('Duyệt tờ trình');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'hợp đồng' } });
    expect(screen.queryByText('Duyệt tờ trình')).not.toBeInTheDocument();
    expect(screen.getByText('Duyệt hợp đồng')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Trạng thái' }), { target: { value: 'HOAT_DONG' } });
    expect(screen.getByText('Không có quy trình nào khớp bộ lọc.')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Trạng thái' }), { target: { value: '' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'DUYET TO TRINH' } });  // không dấu
    expect(screen.getByText('Duyệt tờ trình')).toBeInTheDocument();
    expect(screen.queryByText('Duyệt hợp đồng')).not.toBeInTheDocument();
  });
});

describe('ThongBaoPage', () => {
  it('hiện thông báo của tôi với loại, văn bản và liên kết tới hồ sơ', async () => {
    api.thongBao.mockResolvedValue([{
      id: 1, loai_thong_bao: 'CAN_KY', trinh_ky: 12, van_ban: '15/TTr — Mua sắm', trang_thai_ho_so: 'CHO_KY',
      ten_quy_trinh: 'Duyệt mua sắm', created_at: '2026-10-07T01:00:00Z',
    }]);
    boc(<ThongBaoPage />);
    const lienKet = await screen.findByRole('link', { name: /Cần ký duyệt/ });
    expect(lienKet).toHaveAttribute('href', '/approvals/12');
    expect(within(lienKet).getByText('#12 · 15/TTr — Mua sắm')).toBeInTheDocument();
  });

  it('loại thông báo mới (ủy quyền, tin nhắn, nhắc hạn) có nhãn riêng; mở trang thì đánh dấu đã xem', async () => {
    localStorage.removeItem('tlbm_signing_thong_bao_xem_luc:7');
    api.thongBao.mockResolvedValue(['UY_QUYEN', 'TIN_NHAN', 'QUA_HAN'].map((loai, i) => ({
      id: i + 1, loai_thong_bao: loai as 'UY_QUYEN', trinh_ky: 12, van_ban: '15/TTr', trang_thai_ho_so: 'CHO_KY' as const,
      ten_quy_trinh: 'Duyệt', created_at: '2026-10-07T01:00:00Z',
    })));
    boc(<ThongBaoPage />);
    expect(await screen.findByText('Ủy quyền ký')).toBeInTheDocument();
    expect(screen.getByText('Tin nhắn trao đổi')).toBeInTheDocument();
    expect(screen.getByText('Quá hạn ký')).toBeInTheDocument();
    await waitFor(() => expect(Number(localStorage.getItem('tlbm_signing_thong_bao_xem_luc:7'))).toBeGreaterThan(0));
  });

  it('tab Thông báo hiện số thông báo mới kể từ lần xem trước', async () => {
    localStorage.setItem('tlbm_signing_thong_bao_xem_luc:7', String(Date.parse('2026-10-07T00:00:00Z')));
    api.toi.mockResolvedValue(TOI);
    api.danhSach.mockResolvedValue(trang([]));
    api.thongBao.mockResolvedValue([
      { id: 1, loai_thong_bao: 'CAN_KY', trinh_ky: 12, van_ban: 'a', trang_thai_ho_so: 'CHO_KY', ten_quy_trinh: 'Q', created_at: '2026-10-07T01:00:00Z' },
      { id: 2, loai_thong_bao: 'HUY', trinh_ky: 13, van_ban: 'b', trang_thai_ho_so: 'HUY', ten_quy_trinh: 'Q', created_at: '2026-10-06T01:00:00Z' },
    ]);
    moModule();
    const tab = await screen.findByRole('link', { name: /Thông báo/ });
    await waitFor(() => expect(tab).toHaveTextContent('Thông báo1'));
  });

  it('thông báo cần ký hiện hạn xử lý theo định dạng ngày Việt Nam', async () => {
    api.thongBao.mockResolvedValue([{
      id: 1, loai_thong_bao: 'CAN_KY', trinh_ky: 12, van_ban: '15/TTr', trang_thai_ho_so: 'CHO_KY',
      ten_quy_trinh: 'Duyệt', created_at: '2026-10-07T01:00:00Z', han_xu_ly: '2026-10-08T03:30:00Z',
    }]);
    boc(<ThongBaoPage />);
    const han = new Date('2026-10-08T03:30:00Z').toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    expect(await screen.findByText(han)).toBeInTheDocument();
    expect(screen.getByText(/Hạn xử lý/)).toBeInTheDocument();
  });

  it('chưa có thông báo', async () => {
    api.thongBao.mockResolvedValue([]);
    boc(<ThongBaoPage />);
    expect(await screen.findByText('Chưa có thông báo nào.')).toBeInTheDocument();
  });
});

describe('TaiLieuPage', () => {
  it('liệt kê tệp mọi hồ sơ, lọc theo loại và tải đúng lượt', async () => {
    api.taiLieu.mockResolvedValue([{
      trinh_ky: 12, trang_thai_ho_so: 'CHO_KY', ten_quy_trinh: 'Duyệt mua sắm', van_ban: { so_hieu: '15/TTr', trich_yeu: 'Mua sắm' },
      loai: 'LUOT', luot: 5, so_luot: 1, phien_ban: '1', ma_bam: 'a'.repeat(64), thoi_diem: '2026-10-07T01:00:00Z',
      ten_tep: 'trinh-ky-12-luot-1.pdf',
    }]);
    api.tepCuaLuot.mockResolvedValue(new Blob(['%PDF-']));
    URL.createObjectURL = vi.fn(() => 'blob:tep');
    URL.revokeObjectURL = vi.fn();
    boc(<TaiLieuPage />);
    // Trang render cả thẻ (màn hẹp) lẫn bảng (md trở lên) nên mỗi phần tử xuất hiện hai lần
    expect((await screen.findAllByText('trinh-ky-12-luot-1.pdf')).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: '#12' })[0]).toHaveAttribute('href', '/approvals/12');
    fireEvent.change(screen.getByRole('combobox', { name: /Loại tệp/ }), { target: { value: 'HOAN_TAT' } });
    await waitFor(() => expect(api.taiLieu).toHaveBeenLastCalledWith({ loai: 'HOAN_TAT' }));
    fireEvent.click(screen.getAllByText('trinh-ky-12-luot-1.pdf')[0]);
    await waitFor(() => expect(api.tepCuaLuot).toHaveBeenCalledWith(12, 5));
  });
});

describe('TaiLieuPanel', () => {
  it('liệt kê tệp từng lượt và tải đúng lượt', async () => {
    api.tepCuaLuot.mockResolvedValue(new Blob(['%PDF-'], { type: 'application/pdf' }));
    URL.createObjectURL = vi.fn(() => 'blob:tep');
    URL.revokeObjectURL = vi.fn();
    boc(<TaiLieuPanel hoSo={hoSo()} />);
    expect(screen.getByText('Bản trình ký')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tải về/ }));
    await waitFor(() => expect(api.tepCuaLuot).toHaveBeenCalledWith(12, 5));
  });
});
