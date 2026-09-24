import React from 'react';
import { Button } from './Button';

interface Props {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, title = 'Xác nhận', message = '', confirmText = 'OK', cancelText = 'Hủy', onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="bg-white rounded-lg shadow-lg w-[420px] max-w-full p-6 z-10">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-gray-700 mb-4">{message}</div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
