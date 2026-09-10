/**
 * birthday_system.js - Quản lý tương tác Lịch & Email Sinh nhật CBNV (Module 7.2)
 * - Tương tác Lịch tháng động (chuyển tháng, chọn ngày, hôm nay)
 * - Lọc theo Đơn vị / Phòng ban & Tìm kiếm CBNV theo tên
 * - Xem chi tiết danh sách CBNV sinh nhật trong ngày
 * - Mở modal soạn thiệp, xem trước thiệp HTML Email và gửi thiệp chúc mừng
 * - Cấu hình lịch phát tự động hằng ngày
 */

document.addEventListener('DOMContentLoaded', () => {
  // Dữ liệu mẫu CBNV gắn với các đơn vị phòng ban thực tế trong đề án
  const cbnvList = [
    { id: 1, name: "Châu Tuấn Kiệt", role: "Project Manager (PM) · Nhóm 1", dept: "HT", deptName: "Ban Công nghệ Thông tin", bdayMonth: 9, bdayDay: 10, email: "kiet.ct@itc.edu.vn", sent: true },
    { id: 2, name: "Trần Vũ Giang Anh", role: "Trưởng nhóm 8 (AI)", dept: "NV", deptName: "Khối Nghiệp vụ Bảo hiểm", bdayMonth: 9, bdayDay: 10, email: "anh.tvg@itc.edu.vn", sent: true },
    { id: 3, name: "Tô Thanh Tân", role: "Data Architect · Trưởng nhóm 7", dept: "HT", deptName: "Khối Hỗ trợ (CNTT & QTHệ Thống)", bdayMonth: 9, bdayDay: 11, email: "tan.tt@itc.edu.vn", sent: false },
    { id: 4, name: "Lê Thanh Hậu", role: "DevOps · Trưởng nhóm 5", dept: "HT", deptName: "Ban Pháp chế & Hệ thống", bdayMonth: 9, bdayDay: 15, email: "hau.lt@itc.edu.vn", sent: false },
    { id: 5, name: "Phan Thị Ánh Tuyền", role: "Trưởng nhóm 3 (Hồ sơ)", dept: "KD", deptName: "Khối Kinh doanh Bảo hiểm", bdayMonth: 9, bdayDay: 18, email: "tuyen.pta@itc.edu.vn", sent: false },
    { id: 6, name: "Lê Trí Kiệt", role: "Trưởng nhóm 2 (Văn bản)", dept: "BL_HCM", deptName: "Bảo Long Sài Gòn & Bến Thành", bdayMonth: 9, bdayDay: 22, email: "kiet.lt@itc.edu.vn", sent: false },
    { id: 7, name: "Thượng Mạnh Quỳnh", role: "Trưởng nhóm 4 (Tài liệu)", dept: "HĐQT", deptName: "Văn phòng Hội đồng Quản trị", bdayMonth: 9, bdayDay: 25, email: "quynh.tm@itc.edu.vn", sent: false },
    { id: 8, name: "Phan Tạ Hữu Đức", role: "Trưởng nhóm 6 (Giao việc)", dept: "BAN_TGD", deptName: "Văn phòng Ban Tổng Giám đốc", bdayMonth: 9, bdayDay: 28, email: "duc.pth@itc.edu.vn", sent: false }
  ];

  let currentYear = 2026;
  let currentMonth = 9; // Tháng 9
  let selectedDay = 10; // Mặc định ngày 10 (Hôm nay)

  const calendarGrid = document.getElementById('calendarGrid');
  const currentMonthLabel = document.getElementById('currentMonthLabel');
  const departmentFilter = document.getElementById('departmentFilter');
  const searchStaff = document.getElementById('searchStaff');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const btnGoToday = document.getElementById('btnGoToday');

  // Khởi tạo và vẽ lịch
  function renderCalendar() {
    if (!calendarGrid || !currentMonthLabel) return;

    currentMonthLabel.textContent = `Tháng ${String(currentMonth).padStart(2, '0')} - ${currentYear}`;
    
    // Xóa các ô ngày cũ (giữ lại 7 tiêu đề thứ)
    while (calendarGrid.children.length > 7) {
      calendarGrid.removeChild(calendarGrid.lastChild);
    }

    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    // Chuyển Chủ nhật (0) thành vị trí 7 để xếp sau thứ 7
    const offset = (firstDayOfMonth === 0 ? 7 : firstDayOfMonth) - 1;

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

    // Ô ngày tháng trước
    for (let i = offset - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell other-month';
      cell.innerHTML = `<div class="cal-date-number">${prevMonthDays - i}</div>`;
      calendarGrid.appendChild(cell);
    }

    // Ô ngày trong tháng hiện tại
    const deptFilter = departmentFilter ? departmentFilter.value : 'ALL';
    const searchKey = searchStaff ? searchStaff.value.toLowerCase().trim() : '';

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      
      // Kiểm tra hôm nay
      if (day === 10 && currentMonth === 9 && currentYear === 2026) {
        cell.classList.add('today');
      }
      if (day === selectedDay) {
        cell.classList.add('selected');
      }

      cell.onclick = () => selectDay(day);

      // Lọc CBNV sinh nhật trong ngày
      const bdays = cbnvList.filter(c => {
        const matchDate = c.bdayMonth === currentMonth && c.bdayDay === day;
        const matchDept = deptFilter === 'ALL' || c.dept === deptFilter;
        const matchSearch = !searchKey || c.name.toLowerCase().includes(searchKey);
        return matchDate && matchDept && matchSearch;
      });

      let dotsHtml = '';
      if (bdays.length > 0) {
        dotsHtml = '<div class="cal-bday-dots">';
        bdays.forEach((b, idx) => {
          if (idx < 2) {
            const shortName = b.name.split(' ').slice(-1)[0];
            const pillClass = b.dept === 'NV' ? 'coral' : '';
            dotsHtml += `<div class="bday-pill ${pillClass}"><i class="fa-solid fa-cake-candles"></i> ${shortName}</div>`;
          }
        });
        if (bdays.length > 2) {
          dotsHtml += `<div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 700;">+${bdays.length - 2} nữa</div>`;
        }
        dotsHtml += '</div>';
      }

      cell.innerHTML = `
        <div class="cal-date-number">${day}</div>
        ${dotsHtml}
      `;

      calendarGrid.appendChild(cell);
    }

    updateSelectedDayTable();
  }

  function selectDay(day) {
    selectedDay = day;
    // Cập nhật class selected trên các ô lịch
    const allCells = calendarGrid.querySelectorAll('.cal-cell:not(.other-month)');
    allCells.forEach((c, idx) => {
      if (idx + 1 === day) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });

    updateSelectedDayTable();
  }

  function updateSelectedDayTable() {
    const tableBody = document.getElementById('cbnvTableBody');
    const selectedDateLabel = document.getElementById('selectedDateLabel');
    const staffCountLabel = document.getElementById('staffCountLabel');

    if (selectedDateLabel) {
      selectedDateLabel.textContent = `${String(selectedDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}/${currentYear}`;
    }

    const deptFilter = departmentFilter ? departmentFilter.value : 'ALL';
    const searchKey = searchStaff ? searchStaff.value.toLowerCase().trim() : '';

    const matched = cbnvList.filter(c => {
      const matchDate = c.bdayMonth === currentMonth && c.bdayDay === selectedDay;
      const matchDept = deptFilter === 'ALL' || c.dept === deptFilter;
      const matchSearch = !searchKey || c.name.toLowerCase().includes(searchKey);
      return matchDate && matchDept && matchSearch;
    });

    if (staffCountLabel) {
      staffCountLabel.textContent = `Tìm thấy ${matched.length} cán bộ`;
    }

    if (!tableBody) return;

    if (matched.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
            <i class="fa-regular fa-calendar-xmark" style="font-size: 1.5rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
            Không có cán bộ nhân viên nào sinh nhật trong ngày ${String(selectedDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = matched.map(c => {
      const initials = c.name.split(' ').map(n => n[0]).slice(-2).join('');
      const avatarClass = c.dept === 'HT' ? 'amber' : '';
      const statusHtml = c.sent 
        ? `<span class="status-badge sent"><i class="fa-solid fa-check"></i> Đã gửi lúc 08:00</span>`
        : `<span class="status-badge pending"><i class="fa-regular fa-clock"></i> Chưa gửi</span>`;

      return `
        <tr>
          <td>
            <div class="staff-cell">
              <div class="staff-avatar ${avatarClass}">${initials}</div>
              <div>
                <div class="staff-name">${c.name}</div>
                <div class="staff-role">${c.role}</div>
              </div>
            </div>
          </td>
          <td>
            <strong style="color: var(--bday-amber);">${c.bdayDay} Tháng ${c.bdayMonth}</strong> 
            <span style="font-size: 0.75rem; color: var(--text-subtle);">(* * * *)</span>
          </td>
          <td><span class="badge-unit">${c.deptName}</span></td>
          <td>${statusHtml}</td>
          <td style="text-align: right;">
            <button type="button" class="btn-send-wish" onclick="openWishModal('${c.name}', '${c.deptName}')">
              <i class="fa-regular fa-paper-plane"></i> Gửi thiệp lại
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Chuyển tháng
  if (prevMonthBtn) {
    prevMonthBtn.onclick = () => {
      currentMonth--;
      if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
      }
      renderCalendar();
    };
  }

  if (nextMonthBtn) {
    nextMonthBtn.onclick = () => {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
      renderCalendar();
    };
  }

  if (btnGoToday) {
    btnGoToday.onclick = () => {
      currentYear = 2026;
      currentMonth = 9;
      selectedDay = 10;
      renderCalendar();
    };
  }

  if (departmentFilter) departmentFilter.onchange = renderCalendar;
  if (searchStaff) searchStaff.oninput = renderCalendar;

  // Render lịch lần đầu
  renderCalendar();
});

// Modal Logic (Global for inline onclick)
function openWishModal(name, dept) {
  const modal = document.getElementById('wishModal');
  const recipientInput = document.getElementById('modalRecipient');
  const deptInput = document.getElementById('modalDept');
  const previewRecipient = document.getElementById('previewRecipient');

  if (recipientInput) recipientInput.value = name || 'Châu Tuấn Kiệt';
  if (deptInput) deptInput.value = dept || 'Ban Công nghệ Thông tin';
  if (previewRecipient) previewRecipient.textContent = name || 'Châu Tuấn Kiệt';

  if (modal) modal.classList.add('active');
}

function closeWishModal() {
  const modal = document.getElementById('wishModal');
  if (modal) modal.classList.remove('active');
}

function submitSendWish() {
  const name = document.getElementById('modalRecipient').value || 'Châu Tuấn Kiệt';
  closeWishModal();
  showToast(`Đã gửi thành công email thiệp chúc mừng sinh nhật đến đồng chí ${name}!`);
}

function sendTestEmail() {
  showToast('Đang gửi email thiệp chúc mừng thử nghiệm đến hòm thư quản trị viên...');
  setTimeout(() => {
    showToast('Đã gửi thành công email thiệp thử nghiệm (Mã gửi: #EML-2026-0910)!');
  }, 1000);
}

function updateCardTheme(theme) {
  const card = document.getElementById('cardGraphicPreview');
  if (!card) return;
  if (theme === 'warm-amber') {
    card.style.background = 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)';
  } else if (theme === 'emerald-green') {
    card.style.background = 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)';
  } else {
    card.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)';
  }
}

// Config Modal Logic
function openConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) modal.classList.add('active');
}

function closeConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) modal.classList.remove('active');
}

function saveAutoConfig() {
  const time = document.getElementById('configTimeInput').value || '08:00';
  closeConfigModal();
  showToast(`Đã lưu cấu hình: Hệ thống sẽ tự động quét và gửi thiệp vào lúc ${time} hằng ngày!`);
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastText');
  if (toastText) toastText.textContent = msg;
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}
