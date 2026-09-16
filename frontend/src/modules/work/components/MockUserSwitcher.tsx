// =============================================================================
// XÓA TOÀN BỘ FILE NÀY KHI NHÓM 7 CÓ ĐĂNG NHẬP JWT
//
// Cách gỡ:
//   1. Xóa file này.
//   2. Xóa dòng import và dòng <MockUserSwitcher ... /> trong pages/TasksPage.tsx.
//   3. Trong api/client.ts, xóa MOCK_USER_STORAGE_KEY, getMockUserId, setMockUserId
//      và đoạn gắn header X-Mock-User-Id trong hàm request().
//   4. Bên backend, xóa lớp MockHeaderAuthentication trong apps/work/views.py.
//
// Component chỉ hiện khi chạy `npm run dev`; bản build production tự động ẩn.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { getMockUserId, setMockUserId, toMessage } from '../api/client';
import { listEmployees } from '../api/employees';
import { Employee } from '../types/employee';

interface MockUserSwitcherProps {
  /** Gọi sau khi đổi người dùng để trang tải lại dữ liệu theo quyền mới. */
  onUserChange?: (employeeId: number | null) => void;
}

export default function MockUserSwitcher({ onUserChange }: MockUserSwitcherProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentId, setCurrentId] = useState<string>(() => getMockUserId());
  const [error, setError] = useState('');

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!isDev) return undefined;
    const controller = new AbortController();
    listEmployees('', controller.signal)
      .then(setEmployees)
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(toMessage(cause));
      });
    return () => controller.abort();
  }, [isDev]);

  if (!isDev) return null;

  const handleChange = (rawValue: string) => {
    setCurrentId(rawValue);
    setMockUserId(rawValue || null);
    onUserChange?.(rawValue ? Number(rawValue) : null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--color-warning-border)',
        background: 'var(--color-warning-subtle)',
      }}
    >
      <span
        style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          padding: '2px 6px',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--color-warning-text)',
          color: '#1f2937',
        }}
      >
        DEV
      </span>

      <label htmlFor="mock-user-select" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Đang giả lập user:
      </label>

      <select
        id="mock-user-select"
        value={currentId}
        onChange={(event) => handleChange(event.target.value)}
        style={{
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          color: 'var(--text-main)',
          fontSize: '0.82rem',
          fontFamily: 'inherit',
        }}
      >
        <option value="">(Mặc định: tài khoản quản trị)</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.fullName} - {employee.position}
          </option>
        ))}
      </select>

      {error ? (
        <span style={{ fontSize: '0.76rem', color: 'var(--color-danger)' }}>{error}</span>
      ) : (
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          Dùng để thử quyền của từng vai trò. Chỉ hiện khi chạy dev.
        </span>
      )}
    </div>
  );
}
