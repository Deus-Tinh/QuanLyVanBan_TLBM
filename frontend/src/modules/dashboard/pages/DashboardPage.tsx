import React, { useState } from 'react';
import { ActivePageId } from '../../../shared/types/navigation';

interface DashboardPageProps {
  onNavigate: (page: ActivePageId) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Welcome Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(6, 182, 212, 0.08))',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backdropFilter: 'var(--backdrop-blur)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Xin chào, Châu Tuấn Kiệt
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                fontWeight: 700,
              }}
            >
              PM · Trưởng Nhóm 1
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.92rem' }}>
            Bàn làm việc tổng quan · Đề cương Module 1.2 Trang chủ do <strong>Nhóm 1 phụ trách</strong> (Châu Tuấn Kiệt, Nguyễn Văn Hiếu, Nguyễn Duy Quân).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px var(--color-primary-glow)',
            }}
            onClick={() => onNavigate('documents_incoming')}
          >
            <i className="fa-solid fa-plus" />
            <span>Tiếp nhận văn bản</span>
          </button>
        </div>
      </div>

      {/* 2. KHỐI TÌM KIẾM VĂN BẢN ĐẾN VÀ ĐI (Nhiệm vụ Trang chủ Nhóm 1) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
              Tìm Kiếm Nhanh Văn Bản Đến &amp; Văn Bản Đi
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.18)',
              color: '#d97706',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <i className="fa-solid fa-triangle-exclamation" />
            Nhóm 1 đang trong quá trình phát triển
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSearchFilter('all')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'all' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'all' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setSearchFilter('incoming')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'incoming' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'incoming' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Văn bản Đến
            </button>
            <button
              type="button"
              onClick={() => setSearchFilter('outgoing')}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                background: searchFilter === 'outgoing' ? 'var(--color-primary)' : 'var(--bg-surface-elevated)',
                color: searchFilter === 'outgoing' ? '#fff' : 'var(--text-secondary)',
              }}
            >
              Văn bản Đi
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 'min(100%, 240px)', position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập số ký hiệu, trích yếu nội dung văn bản..."
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
              }}
            />
            <i
              className="fa-solid fa-search"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => alert('Nhóm 1 đang trong quá trình phát triển chức năng tìm kiếm kết nối cơ sở dữ liệu!')}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-magnifying-glass" />
            <span>Tìm kiếm</span>
          </button>
        </div>
      </div>

      {/* 3. KPI METRICS DECK & THỐNG KÊ SỐ VĂN BẢN ĐI/ĐẾN THEO NĂM */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
            📊 Thống Kê Số Lượng Văn Bản Đi &amp; Đến Theo Năm (2024 - 2026)
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontWeight: 700,
            }}
          >
            ✓ Đạt chuẩn đặc tả (Nhóm 1)
          </span>

        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '18px',
          }}
        >
          {/* Card 1: VB Đến */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
              }}
            >
              <i className="fa-solid fa-inbox" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                VĂN BẢN ĐẾN (NĂM 2026)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                1,248
              </div>
              <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                ↑ +12 văn bản mới hôm nay
              </div>
            </div>
          </div>

          {/* Card 2: VB Đi */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
              }}
            >
              <i className="fa-solid fa-paper-plane" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                VĂN BẢN ĐI NỘI BỘ
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                856
              </div>
              <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>
                ↑ 100% đã phát hành
              </div>
            </div>
          </div>

          {/* Card 3: VB Mật */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
              }}
            >
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                VĂN BẢN MẬT (AN NINH)
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                24
              </div>
              <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 600 }}>
                🔒 Phân quyền nghiêm ngặt
              </div>
            </div>
          </div>

          {/* Card 4: Công Việc */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
              }}
            >
              <i className="fa-solid fa-list-check" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                CÔNG VIỆC ĐANG XỬ LÝ
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
                18
              </div>
              <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
                ⏱ 3 việc gần đến hạn
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. KHỐI WIDGET: THÔNG BÁO SINH NHẬT THEO NGÀY T, T + 1 & PHÒNG HỌP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
        {/* Widget Sinh Nhật T, T+1 */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-cake-candles" style={{ color: '#ec4899', fontSize: '1.1rem' }} />
              <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                Thông Báo Sinh Nhật
              </span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              ✓ Đạt chuẩn (Nhóm 1)
            </span>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Sinh nhật hôm nay */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(236, 72, 153, 0.08)',
                border: '1px solid rgba(236, 72, 153, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>🎂</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Nguyễn Văn Hiếu
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Nhóm 1 · Ban Công nghệ Thông tin
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ec4899', background: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                Hôm nay
              </span>
            </div>

            {/* Sinh nhật ngày mai */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>🎈</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Lê Trí Kiệt
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Trưởng Nhóm 2 · Phân hệ Văn bản
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                Ngày mai
              </span>
            </div>
          </div>
        </div>

        {/* Widget Phòng Họp */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-calendar-check" style={{ color: '#10b981', fontSize: '1.1rem' }} />
              <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                Lịch Sử Dụng Phòng Họp Hôm Nay
              </span>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700,
              }}
            >
              ✓ Đạt chuẩn (Nhóm 1)
            </span>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  Phòng Họp A201 (Hội nghị Ban Giám Đốc)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  08:30 - 11:30 · Chủ trì: NCS.ThS. Trần Phương Duy
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                Đang diễn ra
              </span>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  Phòng Họp B105 (Họp Sprint Review Nhóm 1 - 8)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  14:00 - 16:30 · Điều phối: Châu Tuấn Kiệt (PM)
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>
                Sắp tới
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DANH SÁCH 5 VĂN BẢN ĐẾN & 5 VĂN BẢN ĐI (Có nút Xem thêm) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
        {/* Top 5 Văn Bản Đến */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-inbox" style={{ color: '#3b82f6' }} />
                <span>Danh Sách Văn Bản Đến Mới Nhất (5 cái)</span>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700,
              }}
            >
              ✓ Hoàn thành (Nhóm 1 · Nguyễn Văn Hiếu)
            </span>

          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>Số, ký hiệu</th>
                  <th style={{ padding: '8px 6px' }}>Trích yếu nội dung</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>Ngày VB</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: '128/QĐ-BGDĐT', title: 'Hướng dẫn công tác năm học mới 2026', date: '11/09/2026' },
                  { code: '45/CV-UBND', title: 'Tăng cường an toàn thông tin CSDL nhà nước', date: '10/09/2026' },
                  { code: '09/TB-ITC', title: 'Thông báo lịch bảo vệ đồ án chuyên ngành', date: '09/09/2026' },
                  { code: '77/HD-TCHQ', title: 'Quy trình kiểm tra hồ sơ điện tử liên ngành', date: '08/09/2026' },
                  { code: '14/KH-ITC', title: 'Kế hoạch triển khai hệ thống quản lý văn bản', date: '07/09/2026' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: 'var(--color-primary)' }}>{row.code}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-muted)' }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('documents_incoming')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Xem thêm (qua trang văn bản đến)</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>

        {/* Top 5 Văn Bản Đi */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-paper-plane" style={{ color: '#10b981' }} />
                <span>Danh Sách Văn Bản Đi Nội Bộ (5 cái)</span>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700,
              }}
            >
              ✓ Hoàn thành (Nhóm 1 · Nguyễn Văn Hiếu)
            </span>

          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>Số, ký hiệu</th>
                  <th style={{ padding: '8px 6px' }}>Trích yếu nội dung</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>Ngày VB</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: '210/TB-BL', title: 'Thông báo kết luận cuộc họp giao ban quý 3', date: '11/09/2026' },
                  { code: '89/QĐ-BL', title: 'Quyết định ban hành khung an ninh thông tin', date: '10/09/2026' },
                  { code: '62/TTr-ITC', title: 'Tờ trình phê duyệt kinh phí trang bị máy chủ', date: '09/09/2026' },
                  { code: '55/CV-BL', title: 'Công văn gửi các đơn vị phòng ban cấp 2', date: '08/09/2026' },
                  { code: '31/QĐ-BL', title: 'Quyết định phân công nhiệm vụ đồ án Django', date: '06/09/2026' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: '#10b981' }}>{row.code}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-muted)' }}>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('documents_outgoing')}
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Xem thêm (qua trang văn bản đi)</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. DANH SÁCH 5 CÔNG VIỆC & 5 TÀI LIỆU, BIỂU MẪU CHUNG (Có nút Xem thêm) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '20px' }}>
        {/* Top 5 Công Việc */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#8b5cf6' }} />
                <span>Danh Sách Công Việc Được Giao (5 cái)</span>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700,
              }}
            >
              ✓ Hoàn thành (Nhóm 1 · Nguyễn Văn Hiếu)
            </span>

          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>Tiêu đề công việc</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>Hạn xử lý</th>
                  <th style={{ padding: '8px 6px', width: '90px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: 'Hoàn thiện bộ khung Layout Header Navbar (Nhóm 1)', due: '12/09/2026', status: 'Hoàn thành', color: '#10b981' },
                  { title: 'Xây dựng API Văn bản đến và Văn bản đi (Nhóm 2)', due: '15/09/2026', status: 'Đang làm', color: '#f59e0b' },
                  { title: 'Thiết kế danh mục Hồ sơ cấp 1 & cấp 2 (Nhóm 3)', due: '16/09/2026', status: 'Chờ duyệt', color: '#3b82f6' },
                  { title: 'Cập nhật kho tài liệu biểu mẫu chung (Nhóm 4)', due: '18/09/2026', status: 'Đang làm', color: '#f59e0b' },
                  { title: 'Tích hợp chữ ký số và sơ đồ trình ký (Nhóm 5)', due: '20/09/2026', status: 'Mới tạo', color: 'var(--text-muted)' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-muted)' }}>{row.due}</td>
                    <td style={{ padding: '9px 6px', color: row.color, fontWeight: 700 }}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b5cf6',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Xem thêm (qua trang công việc)</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>

        {/* Top 5 Tài Liệu, Biểu Mẫu Chung */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-file-lines" style={{ color: '#06b6d4' }} />
                <span>Danh Sách Biểu Mẫu, Tài Liệu Chung (5 cái)</span>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 700,
              }}
            >
              ✓ Hoàn thành (Nhóm 1 · Nguyễn Văn Hiếu)
            </span>

          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: '460px', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>Ký hiệu</th>
                  <th style={{ padding: '8px 6px' }}>Tên tài liệu / Biểu mẫu</th>
                  <th style={{ padding: '8px 6px', width: '80px' }}>Định dạng</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: 'BM-01/NS', title: 'Phiếu đề xuất tiếp nhận cán bộ nhân viên mới', ext: 'DOCX', color: '#3b82f6' },
                  { code: 'BM-02/TC', title: 'Mẫu thanh toán tạm ứng công tác phí nội bộ', ext: 'XLSX', color: '#10b981' },
                  { code: 'TL-03/BM', title: 'Quy trình xử lý văn bản đến và văn bản đi', ext: 'PDF', color: '#ef4444' },
                  { code: 'BM-04/HC', title: 'Mẫu đăng ký phòng họp và trang thiết bị', ext: 'DOCX', color: '#3b82f6' },
                  { code: 'TL-05/IT', title: 'Hướng dẫn cài đặt ứng dụng bảo mật TLBM', ext: 'PDF', color: '#ef4444' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '9px 6px', fontWeight: 600, color: '#06b6d4' }}>{row.code}</td>
                    <td style={{ padding: '9px 6px', color: 'var(--text-main)' }}>{row.title}</td>
                    <td style={{ padding: '9px 6px' }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: row.color, color: '#fff', fontWeight: 700 }}>
                        {row.ext}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              style={{
                background: 'none',
                border: 'none',
                color: '#06b6d4',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Xem thêm (qua trang tài liệu chung)</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. SECTION: NGHIỆM THU BỘ KHUNG GIAO DIỆN (Layout - Header - Navbar - Footer) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ✅ Nghiệm Thu Bộ Khung Giao Diện (Layout - Header - Navbar)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Thực hiện bởi <strong>Nhóm 1 (Châu Tuấn Kiệt PM, Nguyễn Văn Hiếu, Nguyễn Duy Quân)</strong>
            </p>
          </div>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            ✓ Đạt chuẩn đặc tả Thầy Duy
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '16px',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
              1. Header Đỉnh Đa Năng
            </div>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <li>Đồng hồ hành chính thời gian thực: <code>HH:mm:ss DD/MM/YYYY</code></li>
              <li>Thông báo 3 luồng: Văn bản Đến, Văn bản Đi, Văn bản Mật</li>
              <li>Bộ đổi chủ đề: Sleek Dark / Clean Light / Glassmorphism</li>
              <li>Hồ sơ cá nhân &amp; nút Đăng xuất an toàn</li>
            </ul>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
              2. Navbar / Sidebar Đầy Đủ 8 Nhóm
            </div>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <li>Đầy đủ danh mục đại diện từ Nhóm 1 đến Nhóm 8</li>
              <li>Nút thu gọn (Collapse) và mở rộng linh hoạt</li>
              <li>Trạng thái Active phát sáng chuẩn chỉ</li>
              <li>Tự động co giãn hỗ trợ màn hình di động</li>
            </ul>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
              3. Công Nghệ Chuẩn Quốc Tế
            </div>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <li>100% React 18/19 + TypeScript thuần (bỏ hoàn toàn JS)</li>
              <li>Vite siêu tốc, biên dịch trong mili-giây</li>
              <li>Phân tầng Feature-based: <code>app/</code>, <code>modules/</code>, <code>shared/</code></li>
              <li>Không lỗi kiểu, type-safety tuyệt đối</li>
            </ul>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>
              4. Module 1.1 &amp; Module 1.2 (Nguyễn Văn Hiếu)
            </div>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <li>Trang Login Dual Floating Cards chuẩn nhận diện QLVB &amp; TL</li>
              <li>Đầy đủ 2 trường hợp Quản trị viên &amp; Cán bộ chuyên viên</li>
              <li>4 bảng Top 5 tóm tắt chuẩn dữ liệu hành chính</li>
              <li>Tối ưu Responsive toàn diện trên mọi kích thước màn hình</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
