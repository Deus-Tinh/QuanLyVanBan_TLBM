/* ==========================================================================
   TLBM - MAIN LAYOUT WRAPPER (Architecture Standard)
   QuanLyVanBan_TLBM — Nhóm 1: Layout & Core Foundation
   Trưởng nhóm / PM: Châu Tuấn Kiệt
   ========================================================================== */

import React, { useState } from 'react';
import AppSidebar from '../components/Layout/AppSidebar';
import AppHeader from '../components/Layout/AppHeader';
import AppFooter from '../components/Layout/AppFooter';
import MobileOverlay from '../components/Layout/MobileOverlay';
import { useTheme } from '../hooks/useTheme';

export default function MainLayout({
  children,
  activePage = 'birthday',
  onNavigate = () => {},
}) {
  const { theme, changeTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile Backdrop Overlay */}
      <MobileOverlay
        isOpen={isMobileSidebarOpen}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* 1. Main Sidebar Navigation (Menu trái) */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      {/* 2. Main App Content Viewport (Khu vực chính bên phải) */}
      <div className={`main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        gap: '16px',
      }}>
        {/* Top Header (Thanh đỉnh) */}
        <AppHeader
          currentTheme={theme}
          onSelectTheme={changeTheme}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          activePage={activePage}
        />

        {/* Dynamic Page Content (Vùng nội dung trang) */}
        <main className="page-content-area" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '460px',
        }}>
          {/* Canvas trình diễn chuẩn bộ khung Layout */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '24px 0',
          }}>
            <div style={{
              maxWidth: '860px',
              width: '100%',
              padding: '48px 40px',
              textAlign: 'center',
              borderRadius: '28px',
              background: 'var(--deck-bg)',
              border: '1.5px solid var(--deck-border)',
              boxShadow: 'var(--deck-shadow)',
              backdropFilter: 'blur(20px)',
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '68px',
                height: '68px',
                borderRadius: '22px',
                background: 'var(--inset-well-bg)',
                boxShadow: 'var(--inset-well-shadow)',
                fontSize: '2rem',
                color: '#2563eb',
                marginBottom: '18px',
              }}>
                <i className="fa-solid fa-layer-group" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'var(--blue-pill-bg, #1e40af)',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '5px 16px',
                  borderRadius: '20px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
                }}>
                  Nhóm 1 · Châu Tuấn Kiệt (PM)
                </span>
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: '0 0 10px 0',
              }}>
                Khung Giao Diện Điều Hành Chuẩn (Base Layout)
              </h2>

              <p style={{
                fontSize: '0.92rem',
                color: 'var(--text-muted)',
                maxWidth: '620px',
                margin: '0 auto 28px auto',
                lineHeight: 1.6,
              }}>
                Tập trung hoàn thiện toàn diện kiến trúc <strong>Header điều hướng</strong>, <strong>Sidebar phân hệ</strong> và <strong>Footer cố định</strong> cho toàn bộ 8 nhóm.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                textAlign: 'left',
              }}>
                <div style={{
                  padding: '16px 18px',
                  borderRadius: '16px',
                  background: 'var(--inset-well-bg)',
                  border: '1px solid var(--liquid-glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <i className="fa-solid fa-compass" style={{ color: '#2563eb', fontSize: '1.1rem' }} />
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Header Điều Hành</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Tích hợp Live Clock, 3 luồng thông báo (Đến, Đi, Mật), bộ chọn 4 Theme và chọn Ngôn ngữ (VI/EN).
                  </p>
                </div>

                <div style={{
                  padding: '16px 18px',
                  borderRadius: '16px',
                  background: 'var(--inset-well-bg)',
                  border: '1px solid var(--liquid-glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <i className="fa-solid fa-bars-staggered" style={{ color: '#059669', fontSize: '1.1rem' }} />
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Sidebar Đa Phân Hệ</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Menu phân cấp thu gọn/mở rộng, 3D Liquid Blue Pill active và trạng thái máy chủ Production 2026.
                  </p>
                </div>

                <div style={{
                  padding: '16px 18px',
                  borderRadius: '16px',
                  background: 'var(--inset-well-bg)',
                  border: '1px solid var(--liquid-glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <i className="fa-solid fa-window-minimize" style={{ color: '#d97706', fontSize: '1.1rem' }} />
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Footer Cố Định</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Dải thông tin chân trang đồng bộ, hiển thị bản quyền ITC, số tổng đài hỗ trợ và phiên bản hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 3. System Footer (Chân trang) */}
        <AppFooter />
      </div>
    </div>
  );
}
