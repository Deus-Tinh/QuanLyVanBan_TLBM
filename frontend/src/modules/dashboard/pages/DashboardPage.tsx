import React from 'react';
import DashboardStats from '../components/DashboardStats';
import IncomingDocumentsWidget from '../components/IncomingDocumentsWidget';
import RecentOutgoingWidget from '../components/RecentOutgoingWidget';
import RecentTasksWidget from '../components/RecentTasksWidget';
import MeetingsWidget from '../components/MeetingsWidget';
import BirthdaysWidget from '../components/BirthdaysWidget';
import NewTasksWidget from '../components/NewTasksWidget';

const ALL_INCOMING = [
  { code: '4234/SCB-TGĐ.25.00', title: 'Công văn về việc đăng ký mua 17 xe chở tiền cũ hiệu Mitsubishi Pajero bán thanh lý của SCB', date: '15/12/2025' },
  { code: '2955/SCB-TGĐ.25.00', title: 'Công văn về việc thanh lý tài sản của SCB tại Hà Nội', date: '29/09/2025' },
  { code: '4919/SCB-TGĐ.24.00', title: 'Công văn về việc đăng ký mua 17 xe ô tô chuyên dùng cũ bán thanh lý lần 3/2024 của SCB', date: '07/10/2024' },
  { code: '4190/SCB-TGĐ.24.00', title: 'Công văn về việc đăng ký mua 17 xe ô tô chuyên dùng cũ bán thanh lý lần 2/2024 của SCB', date: '22/08/2024' },
  { code: '2736/SCB-TGĐ.24.00', title: 'Công văn về việc đăng ký mua 23 xe ô tô chuyên dùng bán thanh lý lần 1/2024 của SCB', date: '10/06/2024' },
];

const ALL_OUTGOING = [
  { code: '10438/368/2026/QĐ-TGĐ', title: 'Quyết định về việc chấm dứt Hợp đồng lao động theo nguyện vọng cá nhân đối với Ông Nguyễn Đình Đăng...', date: '02/03/2026' },
  { code: '10434/367/2026/QĐ-TGĐ', title: 'Quyết định về việc Tiếp nhận thử việc Bà Lê Huỳnh Yến Phương làm Nhân viên Chăm sóc Khách hàng...', date: '26/02/2026' },
  { code: '10433/357/2026/QĐ-TGĐ', title: 'Quyết định về việc Tái bổ nhiệm Bà Võ Thị Thời giữ chức danh Phó Giám đốc kiêm Trưởng phòng kinh doanh...', date: '26/02/2026' },
  { code: '10440/13/2026/TB-HĐQT', title: 'Thông báo về việc thăm viếng tang Lễ', date: '20/02/2026' },
  { code: '10439/12/2026/TB-HĐQT', title: 'Thông báo về việc thăm viếng tang Lễ', date: '20/02/2026' },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-3">
      {/* 1. 4 KHỐI THỐNG KÊ XANH NAVY ĐẬM */}
      <DashboardStats />

      {/* 2. BỐ CỤC CHÍNH 2 CỘT (Trái ~72% / Phải ~28%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Cột trái: 2 bảng song song + Danh sách nhiệm vụ */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-3">
          {/* Song song 2 bảng: Văn bản đến & Văn bản đi (luôn hiển thị song song) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <IncomingDocumentsWidget documents={ALL_INCOMING} />
            <RecentOutgoingWidget documents={ALL_OUTGOING} />
          </div>

          {/* Danh sách nhiệm vụ với radio filter */}
          <RecentTasksWidget />
        </div>

        {/* Cột phải: Lịch họp + Sinh nhật + Nhiệm vụ mới */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
          {/* Lịch họp mới nhất */}
          <MeetingsWidget />

          {/* Thông báo sinh nhật */}
          <BirthdaysWidget />

          {/* Nhiệm vụ mới (công việc) */}
          <NewTasksWidget />
        </div>
      </div>
    </div>
  );
}


