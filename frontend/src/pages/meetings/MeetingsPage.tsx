import React, { useState, useEffect, useMemo } from 'react';
import { MeetingRoom, PaginatedResponse } from '@app-types/meeting';
import { apiClient, ApiError } from '@lib/apiClient';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import { Card } from '@components/common/Card';
import { RoomModal } from '@components/meetings/RoomModal';

export const MeetingsPage: React.FC = () => {
  // Dữ liệu danh sách phòng họp
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'hidden'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Trigger reload dữ liệu
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Modals & Dialogs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<MeetingRoom | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<MeetingRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Thông báo Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Tải danh sách phòng họp từ backend API
  useEffect(() => {
    let ignore = false;

    apiClient.get<PaginatedResponse<MeetingRoom> | MeetingRoom[]>('/api/meeting-rooms/?all=true')
      .then((response) => {
        if (ignore) return;
        if (Array.isArray(response)) {
          setRooms(response);
        } else if (response && response.results) {
          setRooms(response.results);
        } else {
          setRooms([]);
        }
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        if (err instanceof ApiError) {
          setError(err.message || 'Không thể tải danh sách phòng họp.');
        } else {
          setError('Có lỗi xảy ra khi kết nối máy chủ.');
        }
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadTrigger]);

  // Lọc dữ liệu client-side sau khi tải
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Tìm kiếm theo tên phòng, vị trí, thiết bị
      const matchesSearch =
        !searchTerm.trim() ||
        room.ten_phong.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.vi_tri.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.thiet_bi.toLowerCase().includes(searchTerm.toLowerCase());

      // Lọc theo trạng thái
      let matchesStatus = true;
      if (statusFilter === 'public') {
        matchesStatus = room.is_public === true;
      } else if (statusFilter === 'hidden') {
        matchesStatus = room.is_public === false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchTerm, statusFilter]);

  // Mở modal thêm phòng
  const handleOpenCreateModal = () => {
    setRoomToEdit(null);
    setIsModalOpen(true);
  };

  // Mở modal sửa phòng
  const handleOpenEditModal = (room: MeetingRoom) => {
    setRoomToEdit(room);
    setIsModalOpen(true);
  };

  // Xác nhận xóa phòng
  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/meeting-rooms/${roomToDelete.id}/`);
      showToast('success', `Đã xóa phòng họp "${roomToDelete.ten_phong}" thành công.`);
      setRoomToDelete(null);
      setLoading(true);
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      let msg = 'Không thể xóa phòng họp.';
      if (err instanceof ApiError && err.data) {
        msg = (err.data.error as string) || (err.data.detail as string) || err.message;
      }
      showToast('error', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all transform animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/90 dark:border-red-800 dark:text-red-200'
          }`}
        >
          <span className="mr-2">
            {toastMessage.type === 'success' ? '✓' : '✕'}
          </span>
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-3 text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tiêu đề & Nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quản lý Phòng họp
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh mục phòng họp & cơ sở vật chất đơn vị (Issue #22 - Đợt 1)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm phòng họp</span>
          </Button>
        </div>
      </div>

      {/* Banner thông tin lộ trình Đợt 1 & Đợt 3 */}
      <div className="flex items-start p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm leading-relaxed">
          <p className="font-semibold">Phân hệ Danh mục Phòng họp (Đợt 1) đã sẵn sàng</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
            Tính năng Đặt lịch phòng họp & Khóa khung giờ (Đợt 3) sẽ được tích hợp tiếp sau khi phân hệ Cán bộ Nhân viên (Issue #24 - Khánh) hoàn tất.
          </p>
        </div>
      </div>

      {/* Thanh tìm kiếm & Bộ lọc */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Ô tìm kiếm */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên phòng, vị trí, thiết bị..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Lọc trạng thái */}
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'public' | 'hidden')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="public">Khả dụng (Công khai)</option>
                <option value="hidden">Đang ẩn</option>
              </select>
            </div>
          </div>

          {/* Toggle kiểu hiển thị (Lưới / Bảng) */}
          <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-700 p-1 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Dạng thẻ lưới"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Lưới</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Dạng bảng chi tiết"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Bảng</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Hiển thị lỗi tải dữ liệu */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-center justify-between">
          <p className="text-sm font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setReloadTrigger((prev) => prev + 1);
            }}
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRooms.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {searchTerm || statusFilter !== 'all'
              ? 'Không tìm thấy phòng họp phù hợp'
              : 'Chưa có phòng họp nào trong hệ thống'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchTerm || statusFilter !== 'all'
              ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc trạng thái.'
              : 'Hãy thêm phòng họp đầu tiên để bắt đầu quản lý danh mục phòng họp của cơ quan.'}
          </p>
          {searchTerm || statusFilter !== 'all' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Xóa bộ lọc
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal}>
              + Thêm phòng họp
            </Button>
          )}
        </Card>
      )}

      {/* Danh sách phòng họp dạng Lưới (Grid) */}
      {!loading && !error && filteredRooms.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-400/50 dark:hover:border-blue-500/40"
            >
              <div>
                {/* Header card: Tên & Badge trạng thái */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {room.ten_phong}
                  </h3>
                  {room.is_public ? (
                    <Badge variant="success" className="shrink-0">
                      Khả dụng
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Đang ẩn
                    </Badge>
                  )}
                </div>

                {/* Vị trí & Sức chứa */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3.5">
                  {room.vi_tri && (
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{room.vi_tri}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-200">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Sức chứa: <strong>{room.suc_chua} người</strong></span>
                  </div>
                </div>

                {/* Thiết bị */}
                {room.thiet_bi && (
                  <div className="p-3 mb-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                      Thiết bị có sẵn:
                    </span>
                    <p className="line-clamp-2 leading-relaxed">{room.thiet_bi}</p>
                  </div>
                )}

                {/* Ghi chú */}
                {room.ghi_chu && (
                  <p className="text-xs text-slate-400 italic mb-3 line-clamp-1">
                    Ghi chú: {room.ghi_chu}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(room)}
                  className="text-xs"
                >
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoomToDelete(room)}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danh sách phòng họp dạng Bảng (Table) */}
      {!loading && !error && filteredRooms.length > 0 && viewMode === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tên phòng họp</th>
                  <th className="px-5 py-3.5">Vị trí</th>
                  <th className="px-5 py-3.5">Sức chứa</th>
                  <th className="px-5 py-3.5">Thiết bị có sẵn</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {room.ten_phong}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {room.vi_tri || '—'}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-200">
                      {room.suc_chua} người
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {room.thiet_bi || '—'}
                    </td>
                    <td className="px-5 py-4">
                      {room.is_public ? (
                        <Badge variant="success">Khả dụng</Badge>
                      ) : (
                        <Badge variant="secondary">Đang ẩn</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(room)}
                        className="text-xs"
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoomToDelete(room)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Thêm / Sửa phòng họp */}
      {isModalOpen && (
        <RoomModal
          key={roomToEdit ? `edit-${roomToEdit.id}` : 'create'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            showToast(
              'success',
              roomToEdit
                ? `Cập nhật phòng họp "${roomToEdit.ten_phong}" thành công.`
                : 'Thêm phòng họp mới thành công.'
            );
            setLoading(true);
            setReloadTrigger((prev) => prev + 1);
          }}
          roomToEdit={roomToEdit}
        />
      )}

      {/* Modal xác nhận xóa phòng */}
      {roomToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Xác nhận xóa phòng họp?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Bạn có chắc chắn muốn xóa phòng họp{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {roomToDelete.ten_phong}
                </strong>
                ? Hành động này sẽ loại bỏ phòng họp khỏi danh mục hệ thống.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setRoomToDelete(null)}
                disabled={isDeleting}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
