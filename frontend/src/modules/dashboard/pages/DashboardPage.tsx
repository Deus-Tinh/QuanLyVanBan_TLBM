import React from 'react';
import DashboardStats from '../components/DashboardStats';
import IncomingDocumentsWidget from '../components/IncomingDocumentsWidget';
import RecentOutgoingWidget from '../components/RecentOutgoingWidget';
import RecentTasksWidget from '../components/RecentTasksWidget';
import MeetingsWidget from '../components/MeetingsWidget';
import BirthdaysWidget from '../components/BirthdaysWidget';
import NewTasksWidget from '../components/NewTasksWidget';

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
            <IncomingDocumentsWidget />
            <RecentOutgoingWidget />
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


