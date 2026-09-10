/**
 * base_layout.js - Quản lý tương tác Base Layout dùng chung
 * - Điều khiển thu gọn/mở rộng Sidebar (Desktop & Mobile)
 * - Quản lý 3 luồng thông báo: Văn bản đến, Văn bản đi, Văn bản mật
 * - Menu tài khoản người dùng & Đăng xuất
 * - Chế độ bảo vệ mắt Dark/Light Mode với LocalStorage
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Quản lý Bộ Chọn Phong Cách Giao Diện (Theme & Style Selector: Skeuomorphism, Dark, Light)
  const themeToggleBtn = document.getElementById('globalThemeToggleBtn');
  const themeOptionCards = document.querySelectorAll('.theme-option-card');
  const savedTheme = localStorage.getItem('itc_doc_theme') || 'skeuomorphism';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('itc_doc_theme', theme);
    
    // Đánh dấu thẻ phong cách đang chọn trong menu
    themeOptionCards.forEach(card => {
      if (card.getAttribute('data-theme-value') === theme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Cập nhật biểu tượng trên nút bấm Header tương ứng với phong cách
    if (themeToggleBtn) {
      if (theme === 'skeuomorphism') {
        themeToggleBtn.innerHTML = `<i class="fa-solid fa-shapes" style="color: #6366f1;"></i>`;
        themeToggleBtn.setAttribute('title', 'Đang chọn: Điêu khắc 3D (Skeuomorphism)');
      } else if (theme === 'dark') {
        themeToggleBtn.innerHTML = `<i class="fa-solid fa-moon" style="color: #60a5fa;"></i>`;
        themeToggleBtn.setAttribute('title', 'Đang chọn: Xám Đen Hình Học (Dark Mesh)');
      } else {
        themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>`;
        themeToggleBtn.setAttribute('title', 'Đang chọn: Kính Mờ Công Sở (Executive Light)');
      }
    }
  }

  // Lắng nghe sự kiện click trên từng tùy chọn phong cách
  themeOptionCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const selected = card.getAttribute('data-theme-value');
      if (selected) {
        applyTheme(selected);
      }
    });
  });

  // Áp dụng phong cách ban đầu
  applyTheme(savedTheme);

  // 2. Thu gọn / Mở rộng Sidebar qua Icon Thư mục (Laptop/iPad/Desktop)
  const sidebarFolderToggleBtn = document.getElementById('sidebarFolderToggleBtn');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');

  function toggleSidebar() {
    // Nếu đang mở drawer trên Mobile / Tablet thì đóng drawer
    if (window.innerWidth <= 1024 && document.body.classList.contains('mobile-sidebar-open')) {
      document.body.classList.remove('mobile-sidebar-open');
      return;
    }
    
    // Trên Laptop / iPad ngang / Desktop: Thu gọn hoặc Bung rộng
    document.body.classList.toggle('sidebar-collapsed');
    const isCollapsed = document.body.classList.contains('sidebar-collapsed');
    localStorage.setItem('itc_sidebar_collapsed', isCollapsed);

    if (sidebarFolderToggleBtn) {
      sidebarFolderToggleBtn.setAttribute(
        'title',
        isCollapsed ? 'Bấm vào để Mở rộng menu' : 'Bấm vào để Thu gọn menu'
      );
      sidebarFolderToggleBtn.setAttribute(
        'aria-label',
        isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'
      );
    }
  }

  // Khôi phục trạng thái thu gọn từ LocalStorage (chỉ áp dụng màn hình > 1024px)
  const savedSidebarState = localStorage.getItem('itc_sidebar_collapsed');
  if (savedSidebarState === 'true' && window.innerWidth > 1024) {
    document.body.classList.add('sidebar-collapsed');
  }

  if (sidebarFolderToggleBtn) {
    const isCurrentlyCollapsed = document.body.classList.contains('sidebar-collapsed');
    sidebarFolderToggleBtn.setAttribute(
      'title',
      isCurrentlyCollapsed ? 'Bấm vào để Mở rộng menu' : 'Bấm vào để Thu gọn menu'
    );
    sidebarFolderToggleBtn.setAttribute(
      'aria-label',
      isCurrentlyCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'
    );
    sidebarFolderToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // 3. Mobile Sidebar Drawer & Overlay (Điều khiển thanh điều hướng trên Di động & Tablet)
  const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
  const mobileSidebarCloseBtn = document.getElementById('mobileSidebarCloseBtn');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function closeMobileSidebar() {
    document.body.classList.remove('mobile-sidebar-open');
  }

  function openMobileSidebar() {
    document.body.classList.add('mobile-sidebar-open');
  }

  if (mobileSidebarBtn) {
    mobileSidebarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileSidebar();
    });
  }

  if (mobileSidebarCloseBtn) {
    mobileSidebarCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileSidebar();
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', closeMobileSidebar);
  }

  // Nhấn phím Escape để đóng nhanh Sidebar drawer hoặc Dropdown đang mở
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileSidebar();
      document.querySelectorAll('.dropdown-menu-pane').forEach(menu => menu.classList.remove('show'));
      document.querySelectorAll('[data-dropdown-target]').forEach(btn => btn.classList.remove('active'));
    }
  });

  // Tự động đóng Mobile Sidebar nếu người dùng xoay màn hình hoặc resize lớn hơn 1024px
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && document.body.classList.contains('mobile-sidebar-open')) {
      closeMobileSidebar();
    }
  });

  // 4. Quản lý Accordion Sub-menu Sidebar
  const parentNavLinks = document.querySelectorAll('.nav-item.has-sub > .nav-link');
  parentNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const parentItem = link.parentElement;
      // Đóng các menu con khác cùng cấp nếu muốn (tùy chọn)
      parentItem.classList.toggle('open');
    });
  });

  // 5. Quản lý Dropdown Menus (3 Luồng Thông Báo & User Menu)
  const dropdownTriggers = document.querySelectorAll('[data-dropdown-target]');
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = trigger.getAttribute('data-dropdown-target');
      const targetMenu = document.getElementById(targetId);

      // Đóng tất cả các menu khác và bỏ active trên các trigger khác
      document.querySelectorAll('.dropdown-menu-pane').forEach(menu => {
        if (menu !== targetMenu) menu.classList.remove('show');
      });
      document.querySelectorAll('[data-dropdown-target]').forEach(btn => {
        if (btn !== trigger) btn.classList.remove('active');
      });

      if (targetMenu) {
        const willOpen = !targetMenu.classList.contains('show');
        targetMenu.classList.toggle('show', willOpen);
        trigger.classList.toggle('active', willOpen);
      }
    });
  });

  // Đóng dropdown khi click ra ngoài màn hình
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-menu-pane') && !e.target.closest('[data-dropdown-target]')) {
      document.querySelectorAll('.dropdown-menu-pane').forEach(menu => {
        menu.classList.remove('show');
      });
      document.querySelectorAll('[data-dropdown-target]').forEach(btn => {
        btn.classList.remove('active');
      });
    }
  });

  // Đóng sidebar trên mobile khi click vào link điều hướng
  document.querySelectorAll('.app-sidebar .nav-link:not(.has-sub-trigger), .sub-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        document.body.classList.remove('mobile-sidebar-open');
      }
    });
  });

  // 6. Quản lý Widget Trợ lý AI hình tròn góc dưới bên phải
  const aiFloatingBtn = document.getElementById('aiFloatingBtn');
  const aiChatboxPopup = document.getElementById('aiChatboxPopup');
  const aiChatboxClose = document.getElementById('aiChatboxClose');
  const aiChatInput = document.getElementById('aiChatInput');
  const aiChatSendBtn = document.getElementById('aiChatSendBtn');
  const aiChatMessages = document.getElementById('aiChatMessages');
  const promptChips = document.querySelectorAll('.prompt-chip');

  if (aiFloatingBtn && aiChatboxPopup) {
    aiFloatingBtn.addEventListener('click', () => {
      aiChatboxPopup.classList.toggle('show');
      if (aiChatboxPopup.classList.contains('show') && aiChatInput) {
        setTimeout(() => aiChatInput.focus(), 150);
      }
    });
  }

  if (aiChatboxClose && aiChatboxPopup) {
    aiChatboxClose.addEventListener('click', () => {
      aiChatboxPopup.classList.remove('show');
    });
  }

  // Bấm vào gợi ý câu hỏi
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-prompt') || chip.textContent.trim();
      if (aiChatInput) {
        aiChatInput.value = text;
        sendMessageToAi();
      }
    });
  });

  // Gửi câu hỏi
  if (aiChatSendBtn) {
    aiChatSendBtn.addEventListener('click', sendMessageToAi);
  }

  if (aiChatInput) {
    aiChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessageToAi();
      }
    });
  }

  function sendMessageToAi() {
    if (!aiChatInput) return;
    const msg = aiChatInput.value.trim();
    if (!msg) return;

    // Append tin nhắn của người dùng
    appendChatBubble(msg, 'user');
    aiChatInput.value = '';

    // Mô phỏng phản hồi AI thông minh
    setTimeout(() => {
      let aiResponse = `Tôi đã nhận được yêu cầu: "<strong>${escapeHtml(msg)}</strong>". Tôi đang kết nối với cơ sở dữ liệu văn bản và quy trình để tra cứu dữ liệu chính xác cho bạn...`;
      
      const lower = msg.toLowerCase();
      if (lower.includes('142') || lower.includes('tài chính')) {
        aiResponse = `Đã tìm thấy văn bản liên quan: <strong>Quyết định 142/QĐ-BTC</strong> về kế hoạch tài chính quý 3/2026 ban hành bởi Bộ Tài chính. Trạng thái: <span style="color: #059669; font-weight: 600;">Còn hiệu lực</span>. Bạn có thể <a href="#" style="color: #2563eb; text-decoration: underline;">xem chi tiết văn bản tại đây</a>.`;
      } else if (lower.includes('nghỉ phép') || lower.includes('biểu mẫu') || lower.includes('đơn')) {
        aiResponse = `Hệ thống có sẵn <strong>Mẫu 04/BM-NS: Đơn xin nghỉ phép năm</strong> thuộc Ban Nhân sự. Tải file mẫu .docx hoặc điền trực tuyến <a href="#" style="color: #2563eb; text-decoration: underline;">tại phân hệ Biểu mẫu chung</a>.`;
      } else if (lower.includes('sinh nhật')) {
        aiResponse = `Hôm nay (10/09) có sinh nhật của <strong>Châu Tuấn Kiệt</strong> và <strong>Trần Vũ Giang Anh</strong>. Hệ thống đã gửi email thiệp chúc mừng tự động lúc 08:00 sáng.`;
      }

      appendChatBubble(aiResponse, 'ai');
    }, 600);
  }

  function appendChatBubble(htmlContent, type) {
    if (!aiChatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    bubble.innerHTML = htmlContent;
    aiChatMessages.appendChild(bubble);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // 9. Tự động cuộn menu đang kích hoạt (Active) vào giữa tầm nhìn Sidebar
  const activeSidebarLink = document.querySelector('.app-sidebar .sub-nav-link.active, .app-sidebar .nav-link.active');
  if (activeSidebarLink) {
    const parentNavItem = activeSidebarLink.closest('.nav-item.has-sub');
    if (parentNavItem) {
      parentNavItem.classList.add('open');
    }
    setTimeout(() => {
      activeSidebarLink.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 150);
  }
});

