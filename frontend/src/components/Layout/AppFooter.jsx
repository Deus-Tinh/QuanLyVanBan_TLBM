import React from 'react';

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <strong>HỆ THỐNG QUẢN LÝ VĂN BẢN VÀ ĐIỀU HÀNH TLBM</strong>
          <span className="footer-sep">·</span>
          <span>Bản quyền © 2026 TLBM Corporation</span>
        </div>
        <div className="footer-right">
          <span>Phát triển bởi <strong>Châu Tuấn Kiệt (PM · Nhóm 1)</strong></span>
          <span className="footer-sep">·</span>
          <span>Phiên bản v2.5.0 Enterprise</span>
        </div>
      </div>
    </footer>
  );
}
