import React from 'react';
import { Button } from './Button';

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

export default function AlertModal({ open, title = 'Thông báo', message = '', onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg w-[420px] max-w-full p-6 z-10">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-gray-700 mb-4">{message}</div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>OK</Button>
        </div>
      </div>
    </div>
  );
}
