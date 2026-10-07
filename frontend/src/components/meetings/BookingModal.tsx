import React, { useState, useEffect, useMemo } from 'react';
import {
  MeetingRoom,
  MeetingBooking,
  BookingUser,
  CreateBookingDTO,
  UpdateBookingDTO,
} from '@app-types/meeting';
import { apiClient, ApiError } from '@lib/apiClient';
import { Button } from '@components/common/Button';
import { useTranslation } from '@i18n/translate';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms: MeetingRoom[];
  bookingToEdit?: MeetingBooking | null;
  initialDate?: string;
  currentUser?: BookingUser | null;
}

interface BookingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  rooms: MeetingRoom[];
  bookingToEdit?: MeetingBooking | null;
  initialDate?: string;
  currentUser?: BookingUser | null;
}

const padZero = (n: number): string => n.toString().padStart(2, '0');

const parseLocalIso = (isoStr: string) => {
  try {
    const d = new Date(isoStr);
    if (!isNaN(d.getTime())) {
      const date = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
      const time = `${padZero(d.getHours())}:${padZero(d.getMinutes())}`;
      return { date, time };
    }
  } catch {
    // fallback
  }
  return null;
};

interface FormInitialValues {
  roomId: number | '';
  title: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  note: string;
}

const BookingForm: React.FC<BookingFormProps> = ({
  onClose,
  onSuccess,
  rooms,
  bookingToEdit,
  initialDate,
  currentUser,
}) => {
  const { t } = useTranslation();
  // Tính toán giá trị mặc định ban đầu
  const initialValues = useMemo<FormInitialValues>(() => {
    if (bookingToEdit) {
      const startParsed = parseLocalIso(bookingToEdit.thoi_gian_bat_dau);
      const endParsed = parseLocalIso(bookingToEdit.thoi_gian_ket_thuc);
      return {
        roomId: bookingToEdit.phong_hop,
        title: bookingToEdit.tieu_de || '',
        department: bookingToEdit.don_vi_to_chuc || '',
        date: startParsed?.date || initialDate || (() => {
          const now = new Date();
          return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
        })(),
        startTime: startParsed?.time || '09:00',
        endTime: endParsed?.time || '10:00',
        attendees: bookingToEdit.so_nguoi_tham_gia || 5,
        note: bookingToEdit.ghi_chu || '',
      };
    }

    const todayStr = initialDate || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
    })();

    // Mặc định chọn phòng đầu tiên có trạng thái sẵn sàng (AVAILABLE)
    const defaultRoom = rooms.find((r) => (r.status || 'AVAILABLE') === 'AVAILABLE') || rooms[0];

    return {
      roomId: defaultRoom ? defaultRoom.id : '',
      title: '',
      department: currentUser?.department || '',
      date: todayStr,
      startTime: '09:00',
      endTime: '10:00',
      attendees: 5,
      note: '',
    };
  }, [bookingToEdit, rooms, initialDate, currentUser]);

  const [roomId, setRoomId] = useState<number | ''>(initialValues.roomId);
  const [title, setTitle] = useState(initialValues.title);
  const [department, setDepartment] = useState(initialValues.department);
  const [date, setDate] = useState(initialValues.date);
  const [startTime, setStartTime] = useState(initialValues.startTime);
  const [endTime, setEndTime] = useState(initialValues.endTime);
  const [attendees, setAttendees] = useState(initialValues.attendees);
  const [note, setNote] = useState(initialValues.note);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === Number(roomId));
  }, [rooms, roomId]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!roomId) {
      errors.phong_hop = t('meetings.messages.roomRequired');
    }
    if (!title.trim()) {
      errors.tieu_de = t('meetings.messages.titleRequired');
    }
    if (!date) {
      errors.date = t('meetings.messages.dateRequired');
    }

    if (!startTime) {
      errors.thoi_gian_bat_dau = t('meetings.messages.startTimeRequired');
    }
    if (!endTime) {
      errors.thoi_gian_ket_thuc = t('meetings.messages.endTimeRequired');
    } else if (startTime && startTime >= endTime) {
      errors.thoi_gian_ket_thuc = t('meetings.messages.invalidTimeRange');
    }

    if (!attendees || attendees <= 0) {
      errors.so_nguoi_tham_gia = t('meetings.messages.attendeesRequired');
    } else if (selectedRoom && attendees > selectedRoom.suc_chua) {
      errors.so_nguoi_tham_gia = t('meetings.messages.capacityExceeded', {
        room: selectedRoom.ten_phong,
        max: selectedRoom.suc_chua,
      });
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setErrorMsg(firstError);
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setErrorMsg(null);
    setFieldErrors({});

    const startIso = `${date}T${startTime}:00`;
    const endIso = `${date}T${endTime}:00`;

    setLoading(true);
    try {
      if (bookingToEdit) {
        const updatePayload: UpdateBookingDTO = {
          phong_hop: Number(roomId),
          tieu_de: title.trim(),
          don_vi_to_chuc: department.trim(),
          thoi_gian_bat_dau: startIso,
          thoi_gian_ket_thuc: endIso,
          so_nguoi_tham_gia: Number(attendees),
          ghi_chu: note.trim(),
        };
        await apiClient.put(`/api/meeting-bookings/${bookingToEdit.id}/`, updatePayload);
      } else {
        const createPayload: CreateBookingDTO = {
          phong_hop: Number(roomId),
          tieu_de: title.trim(),
          don_vi_to_chuc: department.trim(),
          thoi_gian_bat_dau: startIso,
          thoi_gian_ket_thuc: endIso,
          so_nguoi_tham_gia: Number(attendees),
          ghi_chu: note.trim(),
        };
        await apiClient.post('/api/meeting-bookings/', createPayload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const errorData = err.data as Record<string, unknown> | undefined;
        if (errorData) {
          const errKey = String(errorData.error || errorData.detail || '');
          if (errKey && errKey.startsWith('meetings.messages.')) {
            setErrorMsg(t(errKey));
          } else if (Array.isArray(errorData.non_field_errors)) {
            setErrorMsg(errorData.non_field_errors.map((e) => typeof e === 'string' && e.startsWith('meetings.messages.') ? t(e) : e).join(' '));
          } else if (typeof errorData.non_field_errors === 'string') {
            const nfe = errorData.non_field_errors;
            setErrorMsg(nfe.startsWith('meetings.messages.') ? t(nfe) : nfe);
          } else if (errorData.error) {
            const errStr = String(errorData.error);
            setErrorMsg(errStr.startsWith('meetings.messages.') ? t(errStr) : errStr);
          } else if (errorData.detail) {
            const dtStr = String(errorData.detail);
            setErrorMsg(dtStr.startsWith('meetings.messages.') ? t(dtStr) : dtStr);
          } else {
            // Map individual field errors
            const fErrors: Record<string, string> = {};
            for (const [key, value] of Object.entries(errorData)) {
              if (Array.isArray(value)) {
                fErrors[key] = value.map((v) => typeof v === 'string' && v.startsWith('meetings.messages.') ? t(v) : v).join(' ');
              } else if (typeof value === 'string') {
                fErrors[key] = value.startsWith('meetings.messages.') ? t(value) : value;
              }
            }
            setFieldErrors(fErrors);
            const firstKey = Object.keys(fErrors)[0];
            if (firstKey) {
              setErrorMsg(fErrors[firstKey]);
            } else {
              setErrorMsg(err.message || t('meetings.messages.saveBookingError'));
            }
          }
        } else {
          setErrorMsg(err.message || t('meetings.messages.saveBookingError'));
        }
      } else {
        setErrorMsg(t('meetings.messages.unexpectedError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header Modal */}
      <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-elevated">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center font-bold">
            <i className="fa-solid fa-calendar-plus text-lg" />
          </div>
          <div>
            <h2 id="booking-modal-title" className="text-lg font-bold text-main">
              {bookingToEdit ? t('meetings.modalBooking.editTitle') : t('meetings.modalBooking.createTitle')}
            </h2>
            <p className="text-xs text-muted">
              {t('meetings.modalBooking.subtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main hover:bg-surface-elevated transition-colors"
          aria-label={t('meetings.modalBooking.cancelBtn')}
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
        {/* Banner cảnh báo lỗi / trùng lịch */}
        {errorMsg && (
          <div
            className="p-3.5 rounded-xl bg-danger-subtle border border-danger-border text-danger text-sm flex items-start gap-2.5 animate-fadeIn"
            role="alert"
          >
            <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Chọn phòng họp */}
        <div>
          <label
            htmlFor="booking-room-select"
            className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5"
          >
            {t('meetings.modalBooking.roomLabel')} <span className="text-danger">*</span>
          </label>
          <select
            id="booking-room-select"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value ? Number(e.target.value) : '');
              if (fieldErrors.phong_hop) {
                setFieldErrors((prev) => ({ ...prev, phong_hop: '' }));
              }
            }}
            required
            className={`w-full px-3.5 py-2.5 rounded-xl bg-surface border text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium transition-all ${
              fieldErrors.phong_hop ? 'border-danger' : 'border-border-subtle'
            }`}
          >
            <option value="" disabled>{t('meetings.modalBooking.roomPlaceholder')}</option>
            {rooms.map((r) => {
              const isAvailable = (r.status || 'AVAILABLE') === 'AVAILABLE';
              const isDisabled = !isAvailable && r.id !== bookingToEdit?.phong_hop;

              let statusLabel = '';
              if (r.status === 'MAINTENANCE') {
                statusLabel = ` [${t('meetings.status.maintenance')}]`;
              } else if (r.status === 'UNAVAILABLE') {
                statusLabel = ` [${t('meetings.status.unavailable')}]`;
              }

              const visibilityLabel = !r.is_public ? ` [${t('meetings.status.private')}]` : '';

              return (
                <option key={r.id} value={r.id} disabled={isDisabled}>
                  {r.ten_phong} ({t('meetings.fields.capacity')}: {r.suc_chua} {t('meetings.fields.people')}) {r.vi_tri ? `- ${r.vi_tri}` : ''}{statusLabel}{visibilityLabel}
                </option>
              );
            })}
          </select>
          {fieldErrors.phong_hop && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.phong_hop}</p>
          )}

          {/* Room quick details preview */}
          {selectedRoom && (
            <div className="mt-2 p-2.5 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-secondary flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                <i className="fa-solid fa-users text-primary mr-1" /> {t('meetings.fields.capacity')}:{' '}
                <strong className="text-main">{selectedRoom.suc_chua} {t('meetings.fields.people')}</strong>
              </span>
              {selectedRoom.vi_tri && (
                <span>
                  <i className="fa-solid fa-location-dot text-primary mr-1" /> {t('meetings.fields.location')}:{' '}
                  <strong className="text-main">{selectedRoom.vi_tri}</strong>
                </span>
              )}
              {selectedRoom.thiet_bi && (
                <span className="truncate max-w-full">
                  <i className="fa-solid fa-tv text-primary mr-1" /> {t('meetings.fields.amenities')}:{' '}
                  <span className="text-main">{selectedRoom.thiet_bi}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tiêu đề cuộc họp */}
        <div>
          <label
            htmlFor="booking-title-input"
            className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5"
          >
            {t('meetings.modalBooking.titleLabel')} <span className="text-danger">*</span>
          </label>
          <input
            id="booking-title-input"
            type="text"
            placeholder={t('meetings.modalBooking.titlePlaceholder')}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (fieldErrors.tieu_de) {
                setFieldErrors((prev) => ({ ...prev, tieu_de: '' }));
              }
            }}
            required
            className={`w-full px-3.5 py-2.5 rounded-xl bg-surface border text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium transition-all ${
              fieldErrors.tieu_de ? 'border-danger' : 'border-border-subtle'
            }`}
          />
          {fieldErrors.tieu_de && (
            <p className="mt-1 text-xs text-danger">{fieldErrors.tieu_de}</p>
          )}
        </div>

        {/* Đơn vị tổ chức & Số người tham gia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="booking-department-input"
              className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5"
            >
              {t('meetings.modalBooking.departmentLabel')}
            </label>
            <input
              id="booking-department-input"
              type="text"
              placeholder={t('meetings.modalBooking.departmentPlaceholder')}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="booking-attendees-input"
              className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5"
            >
              {t('meetings.modalBooking.attendeesLabel')} <span className="text-danger">*</span>
            </label>
            <input
              id="booking-attendees-input"
              type="number"
              min="1"
              value={attendees}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                setAttendees(val);
                if (fieldErrors.so_nguoi_tham_gia) {
                  setFieldErrors((prev) => ({ ...prev, so_nguoi_tham_gia: '' }));
                }
              }}
              required
              className={`w-full px-3.5 py-2.5 rounded-xl bg-surface border text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium transition-all ${
                fieldErrors.so_nguoi_tham_gia ? 'border-danger' : 'border-border-subtle'
              }`}
            />
            {fieldErrors.so_nguoi_tham_gia && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.so_nguoi_tham_gia}</p>
            )}
          </div>
        </div>

        {/* Ngày họp & Khung giờ */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-3">
          <div className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
            <i className="fa-regular fa-clock text-primary" /> {t('meetings.modalBooking.timeSlotLabel')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="booking-date-input"
                className="block text-xs font-semibold text-secondary mb-1"
              >
                {t('meetings.modalBooking.dateLabel')} <span className="text-danger">*</span>
              </label>
              <input
                id="booking-date-input"
                type="date"
                min={initialDate && initialDate < new Date().toLocaleDateString('en-CA') ? undefined : new Date().toLocaleDateString('en-CA')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="booking-start-time-input"
                className="block text-xs font-semibold text-secondary mb-1"
              >
                {t('meetings.modalBooking.startTimeLabel')} <span className="text-danger">*</span>
              </label>
              <input
                id="booking-start-time-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg bg-surface border text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium ${
                  fieldErrors.thoi_gian_bat_dau ? 'border-danger' : 'border-border-subtle'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="booking-end-time-input"
                className="block text-xs font-semibold text-secondary mb-1"
              >
                {t('meetings.modalBooking.endTimeLabel')} <span className="text-danger">*</span>
              </label>
              <input
                id="booking-end-time-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-lg bg-surface border text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium ${
                  fieldErrors.thoi_gian_ket_thuc ? 'border-danger' : 'border-border-subtle'
                }`}
              />
            </div>
          </div>
          {fieldErrors.thoi_gian_ket_thuc && (
            <p className="text-xs text-danger font-medium">{fieldErrors.thoi_gian_ket_thuc}</p>
          )}
        </div>

        {/* Ghi chú */}
        <div>
          <label
            htmlFor="booking-note-textarea"
            className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5"
          >
            {t('meetings.modalBooking.purposeLabel')}
          </label>
          <textarea
            id="booking-note-textarea"
            rows={2}
            placeholder={t('meetings.modalBooking.purposePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-subtle text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium transition-all resize-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('meetings.modalBooking.cancelBtn')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            icon="fa-check"
          >
            {bookingToEdit ? t('meetings.modalBooking.updateBtn') : t('meetings.modalBooking.saveBtn')}
          </Button>
        </div>
      </form>
    </>
  );
};

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, ...props }) => {
  // Lắng nghe phím Escape để đóng modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, props]);

  if (!isOpen) return null;

  // Sử dụng key để reset state hoàn toàn khi mở lại modal hoặc chuyển đổi booking
  const formKey = props.bookingToEdit
    ? `edit-${props.bookingToEdit.id}`
    : `new-${props.initialDate || 'default'}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-backdrop backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="bg-surface border border-border-subtle rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <BookingForm key={formKey} {...props} />
      </div>
    </div>
  );
};

export default BookingModal;
