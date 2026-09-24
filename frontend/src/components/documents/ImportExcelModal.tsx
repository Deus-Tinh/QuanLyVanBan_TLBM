import React, { useRef, useState } from 'react';
import apiClient from '@lib/apiClient';
import { Button } from '@components/common';
import AlertModal from '@components/common/AlertModal';

interface Props { open: boolean; onClose: ()=>void; onImported?: ()=>void }

export default function ImportExcelModal({ open, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  if (!open) return null;

  async function downloadTemplate() {
    try {
      if (import.meta.env.DEV && !localStorage.getItem('tlbm_access_token')) {
        setAlertMsg('Tính năng tải dữ liệu mẫu cần kết nối máy chủ Backend. Hiện tại hệ thống đang chạy ở chế độ offline.');
        setAlertOpen(true);
        return;
      }
      const res = await fetch('/api/documents/template/?loai=DEN');
      if (!res.ok) throw new Error('Không thể tải file mẫu từ máy chủ. Vui lòng kiểm tra lại kết nối!');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'template.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch (e:any) { setAlertMsg(e.message||String(e)); setAlertOpen(true); }
  }

  async function handleImport() {
    const input = fileRef.current;
    if (!input || !input.files || input.files.length===0) { setAlertMsg('Chọn file'); setAlertOpen(true); return; }
    const f = input.files[0];
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('loai', 'DEN');
      const res = await fetch('/api/documents/import/', { method: 'POST', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('tlbm_access_token')||''}` } });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg(data.message||'Import xong'); setAlertOpen(true);
        onImported && onImported();
        onClose();
      } else {
        setAlertMsg('Lỗi: '+(data.error||data.message||JSON.stringify(data))); setAlertOpen(true);
      }
    } catch (e:any) { setAlertMsg('Lỗi: '+e.message); setAlertOpen(true); }
    finally { setLoading(false); }
  }

  async function exportExcel() {
    try {
      if (import.meta.env.DEV && !localStorage.getItem('tlbm_access_token')) {
        setAlertMsg('Tính năng xuất Excel cần kết nối máy chủ Backend để xử lý dữ liệu. Hiện tại hệ thống đang chạy ở chế độ offline.');
        setAlertOpen(true);
        return;
      }
      const res = await fetch('/api/documents/export/?loai=DEN');
      if (!res.ok) throw new Error('Quá trình xuất Excel thất bại. Vui lòng thử lại sau!');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'export.xlsx'; a.click(); URL.revokeObjectURL(url);
    } catch (e:any) { setAlertMsg(e.message||String(e)); setAlertOpen(true); }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-lg p-4 z-10 w-[480px] max-w-full">
        <h3 className="text-md font-semibold mb-3">Import Excel Văn bản</h3>
        <div className="mb-2">
          <Button variant="primary" onClick={downloadTemplate}>Tải mẫu</Button>
        </div>
        <div className="mb-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="w-full" />
        </div>
        <div className="flex justify-between items-center gap-2">
          <div>
            <Button variant="secondary" onClick={exportExcel}>Xuất Excel</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Đóng</Button>
            <Button variant="primary" onClick={handleImport} disabled={loading}>{loading? 'Đang import...':'Import'}</Button>
          </div>
        </div>
      </div>
      <AlertModal open={alertOpen} onClose={()=>setAlertOpen(false)} message={alertMsg} />
    </div>
  );
}
