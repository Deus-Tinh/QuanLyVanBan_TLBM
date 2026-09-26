import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { RecordItem, StatusKey } from '../types';
import { STATUS_META } from '../types';

interface ViewCategoryDialogProps {
  open: boolean;
  record: RecordItem | null;
  onClose: () => void;
}

export default function ViewCategoryDialog({
  open,
  record,
  onClose,
}: ViewCategoryDialogProps) {
  if (!record) return null;

  const statusInfo = STATUS_META[record.status as StatusKey] ?? {
    label: record.status,
    color: 'default' as const,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VisibilityIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
                Chi tiết danh mục hồ sơ
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Xem thông tin chi tiết hồ sơ lưu trữ
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Content ── */}
      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Số ký hiệu */}
          <TextField
            label="Số ký hiệu"
            value={record.code || ''}
            size="small"
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                sx: { borderRadius: 2, bgcolor: 'action.hover' },
              },
            }}
          />

          {/* Tên tài liệu */}
          <TextField
            label="Tên tài liệu"
            value={record.title || ''}
            size="small"
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                sx: { borderRadius: 2, bgcolor: 'action.hover' },
              },
            }}
          />

          {/* Người lập */}
          <TextField
            label="Người lập"
            value={record.owner || '—'}
            size="small"
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                sx: { borderRadius: 2, bgcolor: 'action.hover' },
              },
            }}
          />

          {/* Ngày lập */}
          <TextField
            label="Ngày lập"
            value={record.created_at || '—'}
            size="small"
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                sx: { borderRadius: 2, bgcolor: 'action.hover' },
              },
            }}
          />

          {/* Trạng thái */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 500 }}>
              Trạng thái
            </Typography>
            <Chip
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5, px: 0.5 }}
            />
          </Box>

          {/* Ghi chú */}
          <TextField
            label="Ghi chú"
            value={record.description || 'Không có ghi chú'}
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{
              input: {
                readOnly: true,
                sx: { borderRadius: 2, bgcolor: 'action.hover' },
              },
            }}
          />
        </Box>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 600, minWidth: 90 }}
        >
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
