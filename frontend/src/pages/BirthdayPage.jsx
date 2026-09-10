import React, { useState } from 'react';
import StatsDeck from '../components/Birthday/StatsDeck';
import CalendarWidget from '../components/Birthday/CalendarWidget';
import SelectedDayStaff from '../components/Birthday/SelectedDayStaff';
import TodayBirthdayCards from '../components/Birthday/TodayBirthdayCards';
import EmailCardPreview from '../components/Birthday/EmailCardPreview';
import WishModal from '../components/Birthday/WishModal';
import ConfigModal from '../components/Birthday/ConfigModal';
import ToastNotification from '../components/Common/ToastNotification';
import { useCalendar } from '../hooks/useCalendar';
import { birthdayService } from '../services/birthdayService';

export default function BirthdayPage() {
  const [staffList, setStaffList] = useState(() => birthdayService.getAllStaff());
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [searchKey, setSearchKey] = useState('');
  const [selectedStaffForPreview, setSelectedStaffForPreview] = useState(null);
  const [selectedStaffForWish, setSelectedStaffForWish] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    currentYear,
    currentMonth,
    selectedDay,
    setSelectedDay,
    prevMonth,
    nextMonth,
    goToday,
    calendarCells,
  } = useCalendar(2026, 9, 10);

  const todayStaff = birthdayService.getTodayBirthdays(10, 9);
  const tomorrowStaff = birthdayService.getTomorrowBirthdays(11, 9);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSendWish = async (staffId, customWish, sender) => {
    try {
      const result = await birthdayService.sendWishCard(staffId, customWish, sender);
      setStaffList(birthdayService.getAllStaff());
      setSelectedStaffForWish(null);
      showToast(result.message, 'success');
    } catch (err) {
      showToast('Có lỗi xảy ra khi gửi thiệp!', 'danger');
    }
  };

  const handleSaveConfig = async (newConfig) => {
    try {
      const result = await birthdayService.updateCronConfig(newConfig);
      setIsConfigModalOpen(false);
      showToast(`Đã lưu cấu hình lịch phát tự động vào lúc ${newConfig.time} mỗi ngày!`, 'success');
    } catch (err) {
      showToast('Có lỗi xảy ra khi lưu cấu hình!', 'danger');
    }
  };

  return (
    <div className="birthday-page-wrapper">
      {/* 4 Thẻ KPI Thống Kê */}
      <StatsDeck staffList={staffList} />

      {/* Main Grid Layout: Calendar & Selected Staff on Left, Today/Tomorrow on Right */}
      <div className="birthday-main-grid">
        {/* Left Column (Primary Focus) */}
        <div className="grid-left-col">
          <CalendarWidget
            currentYear={currentYear}
            currentMonth={currentMonth}
            selectedDay={selectedDay}
            calendarCells={calendarCells}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onGoToday={goToday}
            onSelectDay={setSelectedDay}
            deptFilter={deptFilter}
            onChangeDeptFilter={setDeptFilter}
            searchKey={searchKey}
            onChangeSearchKey={setSearchKey}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
            staffList={staffList}
          />

          <SelectedDayStaff
            selectedDay={selectedDay}
            selectedMonth={currentMonth}
            selectedYear={currentYear}
            staffList={staffList}
            onOpenWishModal={(staff) => setSelectedStaffForWish(staff)}
            onPreviewCard={(staff) => setSelectedStaffForPreview(staff)}
          />
        </div>

        {/* Right Column (Highlights: Today & Tomorrow) */}
        <div className="grid-right-col">
          <TodayBirthdayCards
            todayStaff={todayStaff}
            tomorrowStaff={tomorrowStaff}
            onOpenWishModal={(staff) => setSelectedStaffForWish(staff)}
            onPreviewCard={(staff) => setSelectedStaffForPreview(staff)}
          />
        </div>
      </div>

      {/* Preview Email Template Modal */}
      {selectedStaffForPreview && (
        <EmailCardPreview
          staff={selectedStaffForPreview}
          onClose={() => setSelectedStaffForPreview(null)}
        />
      )}

      {/* Custom Wish Modal */}
      {selectedStaffForWish && (
        <WishModal
          staff={selectedStaffForWish}
          isOpen={!!selectedStaffForWish}
          onClose={() => setSelectedStaffForWish(null)}
          onSend={handleSendWish}
        />
      )}

      {/* Automated Schedule Modal */}
      {isConfigModalOpen && (
        <ConfigModal
          isOpen={isConfigModalOpen}
          initialConfig={birthdayService.getCronConfig()}
          onClose={() => setIsConfigModalOpen(false)}
          onSave={handleSaveConfig}
        />
      )}

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
