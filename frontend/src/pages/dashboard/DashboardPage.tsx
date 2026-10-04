import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivePageId } from '@app-types/navigation';
import { pageIdToPath } from '@lib/routes';
import { apiClient, ApiError } from '@lib/apiClient';
import ModernDashboardView, { DocumentItem, TaskItem } from '@components/dashboard/ModernDashboardView';
import { BirthdayEmployee } from '@components/dashboard/BirthdaysWidget';

export interface DashboardMeetingItem {
  id: string;
  room_name: string;
  roomName?: string;
  meeting_title: string;
  topic?: string;
  start_time: string;
  end_time: string;
  time?: string;
  organizer: string;
  status: string;
}

export interface DashboardKpis {
  incomingCount: number;
  outgoingCount: number;
  confidentialCount: number;
  tasksCount: number;
}

export interface DashboardOverviewResponse {
  kpis?: DashboardKpis;
  recentIncoming?: DocumentItem[];
  recentOutgoing?: DocumentItem[];
  tasks?: TaskItem[];
  meetingRooms?: DashboardMeetingItem[];
  birthdays?: BirthdayEmployee[];
  error?: string;
  message?: string;
}

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const handleNavigate = (pageId: ActivePageId) => {
    if (onNavigate) {
      onNavigate(pageId);
    }
    navigate(pageIdToPath(pageId));
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    apiClient<DashboardOverviewResponse>('/api/dashboard/overview/')
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiError) {
            if (err.status === 401 || err.status === 403) {
              setError('Phiên đăng nhập không hợp lệ hoặc bạn không có quyền truy cập dữ liệu.');
            } else {
              setError(
                err.data?.error ||
                  err.data?.message ||
                  err.data?.detail ||
                  'Không thể tải dữ liệu Bảng điều khiển từ máy chủ.'
              );
            }
          } else {
            setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.');
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  const handleLoadDemoData = () => {
    setData({
      kpis: {
        incomingCount: 142,
        outgoingCount: 86,
        confidentialCount: 12,
        tasksCount: 5,
      },
      recentIncoming: [
        {
          code: '56/NQ-HĐND',
          title: 'Nghị quyết quy định chính sách hỗ trợ phát triển giáo dục mầm non và bồi dưỡng chuyên môn nghiệp vụ viên chức trên địa bàn.',
          date: '29/09/2026',
        },
        {
          code: '215/TB-STC',
          title: 'Thông báo hướng dẫn xây dựng dự toán ngân sách nhà nước năm 2027 và kế hoạch tài chính - ngân sách nhà nước 03 năm 2027 - 2029.',
          date: '28/09/2026',
        },
        {
          code: '102/KH-SGDĐT',
          title: 'Kế hoạch triển khai kiểm tra công tác cải cách hành chính và chuyển đổi số trong quản lý văn thư hồ sơ năm 2026.',
          date: '27/09/2026',
        },
        {
          code: '126',
          title: 'Thông báo lịch tiếp nhận và bàn giao hồ sơ lưu trữ điện tử khối phòng ban chuyên môn.',
          date: '01/10/2026',
        },
        {
          code: '78/QĐ-BTTTT',
          title: 'Quyết định ban hành tiêu chuẩn kỹ thuật an toàn thông tin và phân loại văn bản lưu trữ hồ sơ số.',
          date: '26/09/2026',
        },
      ],
      recentOutgoing: [
        {
          code: '125/TB-BL',
          title: 'Thông báo phát hành quy chuẩn biểu mẫu nghiệp vụ quý IV năm 2026.',
          date: '01/10/2026',
        },
        {
          code: '78/QĐ-BL',
          title: 'Quyết định kiện toàn tổ công tác số hóa tài liệu hồ sơ lưu trữ và bảo vệ bí mật công vụ.',
          date: '28/09/2026',
        },
      ],
      tasks: [],
      birthdays: [],
    });
    setError(null);
  };

  // 1. Trạng thái Đang tải (Loading Skeleton)
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-2xl border border-border-subtle/40" />
          ))}
        </div>
        <div className="h-12 bg-surface rounded-xl border border-border-subtle/40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-surface rounded-2xl border border-border-subtle/40" />
          <div className="h-64 bg-surface rounded-2xl border border-border-subtle/40" />
        </div>
      </div>
    );
  }

  // 2. Trạng thái Lỗi (Error State)
  if (error) {
    return (
      <div
        className="p-8 bg-surface rounded-2xl border border-border-subtle flex flex-col items-center justify-center text-center gap-4 my-8"
        data-testid="dashboard-error"
      >
        <div className="w-14 h-14 rounded-full bg-danger-subtle text-danger flex items-center justify-center text-2xl font-bold">
          !
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-bold text-main mb-1">Không thể tải dữ liệu Bảng điều khiển</h3>
          <p className="text-sm text-secondary">{error}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer"
            data-testid="dashboard-retry-btn"
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={handleLoadDemoData}
            className="px-5 py-2.5 bg-surface hover:bg-surface-hover border border-border-subtle text-main rounded-xl font-medium text-sm transition-all shadow-xs cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-primary text-xs" />
            <span>Xem giao diện Demo (Netlify Preview)</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Trạng thái Thành công hoặc Dữ liệu rỗng (Empty State tích hợp sẵn trong ModernDashboardView)
  return (
    <ModernDashboardView
      onNavigate={handleNavigate}
      incomingCount={data?.kpis?.incomingCount ?? 0}
      outgoingCount={data?.kpis?.outgoingCount ?? 0}
      tasksCount={data?.kpis?.tasksCount ?? 0}
      incomingDocuments={data?.recentIncoming ?? []}
      outgoingDocuments={data?.recentOutgoing ?? []}
      tasks={data?.tasks ?? []}
      birthdays={data?.birthdays}
    />
  );
}
