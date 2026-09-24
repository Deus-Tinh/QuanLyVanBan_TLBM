import React, { useEffect, useState, useRef } from 'react';
import apiClient from '@lib/apiClient';
import { Button } from '@components/common';
import AlertModal from '@components/common/AlertModal';

interface UserOption { id: number; full_name: string; username: string }

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: any;
  onSaved?: (doc: any) => void;
}

export default function DocumentFormModal({ open, onClose, initial, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ loai: 'DEN', nam: new Date().getFullYear() });
  const [units, setUnits] = useState<string[]>([]);
  const [staff, setStaff] = useState<UserOption[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [soHieuManual, setSoHieuManual] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const filePattern = /\.(pdf|docx?|png|jpe?g)$/i;
  const maxFiles = 10;

  function buildInitialForm() {
    const { co_quan_ban_hanh, ...restInitial } = initial || {};
    return {
      loai: 'DEN',
      nam: new Date().getFullYear(),
      ngay_den: new Date().toISOString(),
      ...restInitial,
      noi_ban_hanh: initial?.noi_ban_hanh ?? co_quan_ban_hanh ?? '',
    };
  }

  function pushFiles(list: File[]) {
    const invalidFiles = list.filter(file => !filePattern.test(file.name));
    const validFiles = list.filter(file => filePattern.test(file.name));
    const remainingSlots = Math.max(maxFiles - files.length, 0);
    const acceptedFiles = validFiles.slice(0, remainingSlots);
    const warnings: string[] = [];

    if (invalidFiles.length) {
      warnings.push(`${invalidFiles.map(file => file.name).join(', ')} không được hỗ trợ. Chỉ chấp nhận PDF, DOC, DOCX, PNG, JPG.`);
    }

    if (validFiles.length > acceptedFiles.length) {
      warnings.push(`Chỉ được tải tối đa ${maxFiles} tệp.`);
    }

    if (warnings.length) {
      setAlertMsg(warnings.join(' '));
      setAlertOpen(true);
    }

    if (!acceptedFiles.length) return;

    setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
  }

  useEffect(() => {
    if (open) {
      const initialUnit = initial?.don_vi_nhan || '';
      setForm(buildInitialForm());
      setSelectedUnit('');
      setStaff([]);
      setFiles([]);
      setSoHieuManual(false);
      fetchUnits();

      if (initialUnit) {
        setSelectedUnit(initialUnit);
        fetchStaffByUnit(initialUnit);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchUnits() {
    // Build units from backend users' departments (simple heuristic)
    try {
      const res = await apiClient.get('/api/auth/profile/');
      // no explicit units endpoint; attempt to list common departments via accounts list if exists
      // fallback: collect departments from a small users endpoint if available
      // Try /api/accounts/staffs/ (may not exist)
      const listRes = await fetch('/api/accounts/staffs/');
      if (listRes.ok) {
        const data = await listRes.json();
        const items = Array.isArray(data) ? data : data.results || [];
        const depts = Array.from(new Set(items.map((u:any)=>u.department).filter(Boolean)));
        setUnits(depts as string[]);
      } else {
        setUnits([]);
      }
    } catch (e) {
      setUnits([]);
    }
  }

  async function fetchStaffByUnit(unit: string) {
    try {
      // Try backend endpoint to search users by department
      const res = await fetch(`/api/accounts/staffs/?department=${encodeURIComponent(unit)}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.results || data);
      } else {
        setStaff([]);
      }
    } catch (e) {
      setStaff([]);
    }
  }

  function handleUnitChange(unit: string) {
    setSelectedUnit(unit);
    setStaff([]);
    setForm((prev: any) => ({
      ...prev,
      nguoi_nhan: [],
    }));

    if (unit) {
      fetchStaffByUnit(unit);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt) return;
    pushFiles(Array.from(dt.files));
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    pushFiles(list);
  }

  async function suggestSoHieu() {
    if (initial && initial.id) return; // Không gợi ý nếu đang sửa
    const year = form.nam || new Date().getFullYear();
    const prefix = form.noi_ban_hanh ? ` - ${form.noi_ban_hanh}` : '';
    setForm((s:any)=>({ ...s, so_hieu: `AUTO/${year}${prefix}` }));
  }

  // Tự động gọi hàm gợi ý mỗi khi form.nam hoặc form.co_quan_ban_hanh thay đổi
  useEffect(() => {
    if (!initial && !soHieuManual) {
      suggestSoHieu();
    }
  }, [form.nam, form.noi_ban_hanh, initial, soHieuManual]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      Object.keys(form).forEach(k => {
        if (form[k] !== undefined && form[k] !== null) payload.append(k, String(form[k]));
      });
      files.forEach(f=>payload.append('files', f));

      // --- MOCK ĐỂ TEST FRONTEND KHI KHÔNG CÓ BACKEND ---
      // Trong môi trường dev, nếu không có access token thật, ta giả lập thành công luôn
      if (import.meta.env.DEV && !localStorage.getItem('tlbm_access_token')) {
        setTimeout(() => {
          const fakeData = {
            id: initial?.id || Date.now(),
            ...form,
            ngay_den: form.ngay_den || new Date().toISOString(),
          };
          onSaved && onSaved(fakeData);
          onClose();
        }, 500);
        return;
      }
      // --- END MOCK ---

      let res;
      if (initial && initial.id) {
        res = await fetch(`/api/documents/${initial.id}/`, { method: 'PUT', body: payload, headers: { Authorization: `Bearer ${localStorage.getItem('tlbm_access_token') || ''}` } });
      } else {
        res = await fetch('/api/documents/', { method: 'POST', body: payload, headers: { Authorization: `Bearer ${localStorage.getItem('tlbm_access_token') || ''}` } });
      }

      if (res.ok) {
        const data = await res.json();
        onSaved && onSaved(data);
        onClose();
      } else {
        const err = await res.json().catch(()=>({ error: 'Unknown' }));
        setAlertMsg('Lỗi: '+(err.error||err.detail||JSON.stringify(err)));
        setAlertOpen(true);
      }
    } catch (err:any) {
      setAlertMsg('Lỗi kết nối: '+err.message);
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form className="bg-white rounded-lg shadow-lg w-[900px] max-w-full p-6 z-10 document-modal" onSubmit={handleSubmit} onDragOver={onDragOver} onDrop={onDrop}>
        <h3 className="text-lg font-semibold mb-4">{initial ? 'Sửa văn bản' : 'Thêm văn bản đến'}</h3>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6">
            <label className="text-sm block">Danh mục hồ sơ</label>
            <input value={form.danh_muc_ho_so||''} onChange={e=>setForm({...form, danh_muc_ho_so: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-1">
            <label className="text-sm block">Năm</label>
            <input type="number" value={form.nam} onChange={e=>setForm({...form, nam: Number(e.target.value)})} className="mt-1 p-2 border rounded w-full text-center text-sm box-border" />
          </div>

          <div className="col-span-1">
            <label className="text-sm block">Số đến</label>
            <input readOnly placeholder="Tự động tạo" value={form.so_thu_tu ?? ''} className="mt-1 p-2 border rounded w-full bg-slate-50 text-sm box-border" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block">Ngày đến</label>
            <input type="datetime-local" value={form.ngay_den ? new Date(form.ngay_den).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form, ngay_den: new Date(e.target.value).toISOString()})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block">Số, ký hiệu</label>
            <input
              value={form.so_hieu||''}
              onChange={e=>{
                setSoHieuManual(true);
                setForm({...form, so_hieu:e.target.value});
              }}
              className="mt-1 p-2 border rounded w-full text-sm box-border"
            />
          </div>

          <div className="col-span-3">
            <label className="text-sm block">Ngày tháng văn bản</label>
            <input type="date" value={form.ngay_thang_van_ban ? new Date(form.ngay_thang_van_ban).toISOString().slice(0,10) : ''} onChange={e=>setForm({...form, ngay_thang_van_ban: e.target.value ? new Date(e.target.value).toISOString() : ''})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-3">
            <label className="text-sm block">Tên loại văn bản</label>
            <input value={form.ten_loai_van_ban||''} onChange={e=>setForm({...form, ten_loai_van_ban: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-6">
            <label className="text-sm block">Cơ quan ban hành văn bản</label>
            <input value={form.noi_ban_hanh||''} onChange={e=>setForm({...form, noi_ban_hanh: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-12">
            <label className="text-sm block">Trích yếu nội dung</label>
            <textarea value={form.trich_yeu||''} onChange={e=>setForm({...form, trich_yeu:e.target.value})} className="mt-1 p-2 border rounded w-full h-28 text-sm box-border" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block">Độ mật</label>
            <select value={form.do_mat||''} onChange={e=>setForm({...form, do_mat: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border">
              <option value="">Thường</option>
              <option value="mat">Mật</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="text-sm block">Độ khẩn</label>
            <select value={form.do_khan||''} onChange={e=>setForm({...form, do_khan: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border">
              <option value="">Thường</option>
              <option value="khac">Khác</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="text-sm block">Số tờ</label>
            <input value={form.so_to||''} onChange={e=>setForm({...form, so_to: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block">Ngôn ngữ</label>
            <input value={form.ngon_ngu||''} onChange={e=>setForm({...form, ngon_ngu: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block">Người ký</label>
            <input value={form.nguoi_ky||''} onChange={e=>setForm({...form, nguoi_ky: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-2">
            <label className="text-sm block">Chức vụ</label>
            <input value={form.chuc_vu||''} onChange={e=>setForm({...form, chuc_vu: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-12">
            <label className="text-sm block">Ghi chú</label>
            <input value={form.ghi_chu||''} onChange={e=>setForm({...form, ghi_chu: e.target.value})} className="mt-1 p-2 border rounded w-full text-sm box-border" />
          </div>

          <div className="col-span-12">
            <label className="text-sm block">Tệp đính kèm</label>
            <div className="mt-1 p-4 border border-dashed rounded text-sm text-center bg-surface" onDrop={onDrop} onDragOver={onDragOver}>
              <div>Thả tệp vào đây (PDF/DOC/DOCX/PNG/JPG). Hoặc <button type="button" onClick={()=>fileInputRef.current?.click()} className="text-primary underline">chọn tệp</button></div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
              <div className="mt-2 text-xs text-muted">{files.length} tệp được chọn</div>
              <ul className="text-left mt-2 text-sm max-h-36 overflow-auto">
                {files.map((f,i)=> <li key={i}>{f.name} — {Math.round(f.size/1024)} KB</li>)}
              </ul>
            </div>
          </div>

          <div className="col-span-6">
            <label className="text-sm block">Đơn vị nhận</label>
            <select value={selectedUnit} onChange={e=>handleUnitChange(e.target.value)} className="mt-1 p-2 border rounded w-full text-sm box-border">
              <option value="">-- Chọn đơn vị --</option>
              {units.map(u=> <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="col-span-6">
            <label className="text-sm block">Người nhận (Cán bộ)</label>
            <select multiple value={form.nguoi_nhan||[]} onChange={e=>setForm({...form, nguoi_nhan: Array.from(e.target.selectedOptions).map(o=>o.value)})} className="mt-1 p-2 border rounded w-full h-24 text-sm box-border">
              {staff.map(s=> <option key={s.id} value={s.id}>{s.full_name || s.username}</option>)}
            </select>
          </div>

        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
          <Button variant="primary" type="submit" disabled={loading}>{loading? 'Đang lưu...':'Lưu'}</Button>
        </div>
        <AlertModal open={alertOpen} onClose={()=>setAlertOpen(false)} message={alertMsg} />
      </form>
    </div>
  );
}
