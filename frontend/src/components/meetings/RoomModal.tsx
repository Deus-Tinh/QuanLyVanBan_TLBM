import React, { useState } from 'react';
import { MeetingRoom, CreateMeetingRoomDTO } from '@app-types/meeting';
import { apiClient, ApiError } from '@lib/apiClient';
import { Button } from '@components/common/Button';
import { useTranslation } from '@i18n/translate';

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
  const { t } = useTranslation();
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
      newErrors.ten_phong = t('meetings.messages.roomNameRequired');
    }
    if (!sucChua || sucChua < 1) {
      newErrors.suc_chua = t('meetings.messages.capacityMustBePositive');
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
            fieldErrors[key] = value.map((v) => typeof v === 'string' && v.startsWith('meetings.messages.') ? t(v) : v).join(' ');
          } else if (typeof value === 'string') {
            fieldErrors[key] = value.startsWith('meetings.messages.') ? t(value) : value;
          }
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: t('meetings.messages.saveRoomError') });
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
              {roomToEdit ? t('meetings.modalRoom.editTitle') : t('meetings.modalRoom.createTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {roomToEdit
                ? t('meetings.modalRoom.editSubtitle', { name: roomToEdit.ten_phong })
                : t('meetings.modalRoom.createSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label={t('meetings.modalRoom.cancelBtn')}
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
              {t('meetings.modalRoom.nameLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tenPhong}
              onChange={(e) => setTenPhong(e.target.value)}
              placeholder={t('meetings.modalRoom.namePlaceholder')}
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
                {t('meetings.modalRoom.locationLabel')}
              </label>
              <input
                type="text"
                value={viTri}
                onChange={(e) => setViTri(e.target.value)}
                placeholder={t('meetings.modalRoom.locationPlaceholder')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              {errors.vi_tri && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.vi_tri}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {t('meetings.modalRoom.capacityLabel')} <span className="text-red-500">*</span>
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
              {t('meetings.modalRoom.amenitiesLabel')}
            </label>
            <textarea
              rows={2}
              value={thietBi}
              onChange={(e) => setThietBi(e.target.value)}
              placeholder={t('meetings.modalRoom.amenitiesPlaceholder')}
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
                {t('meetings.modalRoom.statusLabel')}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('meetings.modalRoom.statusDesc')}
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
              {t('meetings.modalRoom.notesLabel')}
            </label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder={t('meetings.modalRoom.notesPlaceholder')}
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
              {t('meetings.modalRoom.cancelBtn')}
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
                  <span>{t('meetings.modalRoom.savingBtn')}</span>
                </span>
              ) : roomToEdit ? (
                t('meetings.modalRoom.updateBtn')
              ) : (
                t('meetings.modalRoom.saveBtn')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
