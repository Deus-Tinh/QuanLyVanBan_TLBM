import React from 'react';
import { Employee } from '../types/employee';

/** Ô "Người thực hiện" trong bảng danh sách: người chủ trì và các cán bộ tham gia. */

interface TaskAssigneeCellProps {
  host: Employee | null;
  participants: Employee[];
}

export default function TaskAssigneeCell({ host, participants }: TaskAssigneeCellProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.84rem', lineHeight: 1.5 }}>
      <div>
        <span style={{ color: 'var(--text-secondary)' }}>Chủ trì: </span>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{host ? host.fullName : '—'}</span>
      </div>
      {participants.length > 0 && (
        <>
          <div style={{ color: 'var(--text-secondary)' }}>Cán bộ thực hiện:</div>
          {participants.map((person) => (
            <div key={person.id} style={{ color: 'var(--text-main)' }}>
              - {person.fullName}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
