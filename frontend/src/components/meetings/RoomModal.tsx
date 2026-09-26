import React, { useState } from 'react';
import { MeetingRoom, CreateMeetingRoomDTO } from '@app-types/meeting';
import { apiClient, ApiError } from '@lib/apiClient';
import { Button } from '@components/common/Button';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomToEdit: MeetingRoom | null;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  roomToEdit,
}) => {
  const [tenPhong, setTenPhong] = useState(roomToEdit?.ten_phong || '');
  const [viTri, setViTri] = useState(roomToEdit?.vi_tri || '');
  const [sucChua, setSucChua] = useState<number>(roomToEdit?.suc_chua ?? 10);
  const [thietBi, setThietBi] = useState(roomToEdit?.thiet_bi || '');
  const [isPublic, setIsPublic] = useState(roomToEdit?.is_public ?? true);
  const [ghiChu, setGhiChu] = useState(roomToEdit?.ghi_chu || '');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!tenPhong.trim()) {
      newErrors.ten_phong = 'Vui lòng nhập tên phòng họp.';
    }
    if (!sucChua || sucChua < 1) {
      newErrors.suc_chua = 'Sức chứa phòng phải là số nguyên dương từ 1 trở lên.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    const payload: CreateMeetingRoomDTO = {
      ten_phong: tenPhong.trim(),
      vi_tri: viTri.trim(),
      suc_chua: Number(sucChua),
      thiet_bi: thietBi.trim(),
      is_public: isPublic,
      ghi_chu: ghiChu.trim(),
    };

    try {
      if (roomToEdit) {
        await apiClient.put(`/api/meeting-rooms/${roomToEdit.id}/`, payload);
      } else {
        await apiClient.post('/api/meeting-rooms/', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(err.data)) {
          if (Array.isArray(value)) {
            fieldErrors[key] = value.join(' ');
          } else if (typeof value === 'string') {
            fieldErrors[key] = value;
          }
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Có lỗi xảy ra khi lưu phòng họp. Vui lòng thử lại.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {roomToEdit ? 'Chỉnh sửa phòng họp' : 'Thêm phòng họp mới'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {roomToEdit
                ? `Cập nhật thông tin chi tiết cho ${roomToEdit.ten_phong}`
                : 'Khai báo thông số phòng họp vào hệ thống'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errors.general && (
            <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900/50">
              {errors.general}
            </div>
          )}

          {/* Tên phòng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Tên phòng họp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tenPhong}
              onChange={(e) => setTenPhong(e.target.value)}
              placeholder="VD: Phòng Hội thảo A, Phòng Họp Ban Giám Đốc"
              className={`w-full px-3.5 py-2 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/80 dark:text-white ${
                errors.ten_phong
                  ? 'border-red-400 focus:ring-red-400/30'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500'
              }`}
            />
            {errors.ten_phong && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.ten_phong}</p>
            )}
          </div>

          {/* Vị trí & Sức chứa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Vị trí phòng
              </label>
              <input
                type="text"
                value={viTri}
                onChange={(e) => setViTri(e.target.value)}
                placeholder="VD: Tầng 2, Tòa Nhà A"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              {errors.vi_tri && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.vi_tri}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Sức chứa (người) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={sucChua}
                onChange={(e) => setSucChua(parseInt(e.target.value, 10) || 0)}
                placeholder="10"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/80 dark:text-white ${
                  errors.suc_chua
                    ? 'border-red-400 focus:ring-red-400/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500'
                }`}
              />
              {errors.suc_chua && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.suc_chua}</p>
              )}
            </div>
          </div>

          {/* Thiết bị */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Trang thiết bị có sẵn
            </label>
            <textarea
              rows={2}
              value={thietBi}
              onChange={(e) => setThietBi(e.target.value)}
              placeholder="VD: Máy chiếu Sony 4K, 2 Micro không dây, Tivi 75 inch, Hệ thống camera trực tuyến..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
            {errors.thiet_bi && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.thiet_bi}</p>
            )}
          </div>

          {/* Trạng thái công khai */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Trạng thái hoạt động
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cho phép hiển thị khả dụng trong danh mục
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Ghi chú
            </label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: Lưu ý tắt thiết bị sau khi dùng hoặc liên hệ kỹ thuật khi cần hỗ trợ..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center space-x-1.5">
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Đang lưu...</span>
                </span>
              ) : roomToEdit ? (
                'Lưu thay đổi'
              ) : (
                'Thêm phòng'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
