import React from 'react';

export default function MobileOverlay({ isOpen, onClick }) {
  if (!isOpen) return null;

  return (
    <div
      className="mobile-sidebar-overlay active"
      onClick={onClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1040,
        display: 'block',
      }}
    />
  );
}
