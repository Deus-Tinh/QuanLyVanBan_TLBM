import React from 'react';

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span>&copy; 2026 <strong>ITC</strong> · <strong>QLVB</strong></span>
        <span style={{ color: 'var(--text-subtle)', margin: '0 4px' }}>|</span>
        <span>GVHD: <strong>NCS.ThS. Trần Phương Duy</strong></span>
        <span style={{ color: 'var(--text-subtle)', margin: '0 4px' }}>|</span>
        <span>Nhóm 1: <strong>Châu Tuấn Kiệt (PM)</strong></span>
        <span className="footer-badge">
          <i className="fa-solid fa-code-branch" style={{ fontSize: '0.68rem' }} /> v2.5
        </span>
      </div>
      <div className="footer-right">
        <span>
          <i className="fa-solid fa-envelope" style={{ marginRight: '4px', color: '#2563eb' }} />
          <a href="mailto:hotro@itc.edu.vn" className="footer-link">hotro@itc.edu.vn</a>
        </span>
        <span>
          <i className="fa-solid fa-phone" style={{ marginRight: '4px', color: '#10b981' }} />
          Hotline: <strong>(028) 38.354.409</strong>
        </span>
      </div>
    </footer>
  );
}
