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
  onEdit?: (record: RecordItem) => void;
}

export default function ViewCategoryDialog({
  open,
  record,
  onClose,
  onEdit,
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
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 2.5, flexShrink: 0,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
            }}>
              <VisibilityIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>
                Chi Tiết Danh Mục Tài Liệu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Xem toàn bộ thông tin chi tiết của danh mục tài liệu
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Content ── */}
      <DialogContent sx={{ pt: '32px !important', pb: 2.5 }}>
        <Box sx={{
          mt: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2.5,
        }}>

          {/* Tên tài liệu */}
          <Box sx={{ gridColumn: '1 / -1', pt: 0.5 }}>
            <TextField
              label="Tên Tài Liệu / Danh Mục"
              value={record.title || ''}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { borderRadius: 2, bgcolor: 'action.hover', fontWeight: 600 },
                },
              }}
            />
          </Box>

          {/* Số ký hiệu */}
          <Box>
            <TextField
              label="Số Ký Hiệu Hồ Sơ"
              value={record.code || ''}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { borderRadius: 2, bgcolor: 'action.hover', fontWeight: 600 },
                },
              }}
            />
          </Box>

          {/* Số TT */}
          <Box>
            <TextField
              label="Số TT (Ưu tiên hiển thị)"
              value={record.order ?? 1}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { borderRadius: 2, bgcolor: 'action.hover' },
                },
              }}
            />
          </Box>

          {/* Ngày lập */}
          <Box>
            <TextField
              label="Ngày Lập"
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
          </Box>

          {/* Trạng thái */}
          <Box>
            <Box sx={{
              p: 1.2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 40,
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Trạng thái lưu trữ:
              </Typography>
              <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
                sx={{ fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5, px: 0.5 }}
              />
            </Box>
          </Box>

          {/* Danh mục */}
          <Box>
            <TextField
              label="Phân Nhóm / Danh Mục"
              value={record.category || '—'}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { borderRadius: 2, bgcolor: 'action.hover' },
                },
              }}
            />
          </Box>

          {/* Người lập */}
          <Box>
            <TextField
              label="Người Lập / Phụ Trách"
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
          </Box>

          {/* Ghi chú */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              label="Ghi Chú / Mô Tả"
              value={record.description || 'Không có ghi chú.'}
              size="small"
              fullWidth
              multiline
              minRows={3}
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { borderRadius: 2, bgcolor: 'action.hover' },
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 600, minWidth: 90 }}
        >
          Đóng
        </Button>
        {onEdit && (
          <Button
            onClick={() => {
              onClose();
              onEdit(record);
            }}
            variant="contained"
            sx={{
              borderRadius: 2, fontWeight: 700, px: 2.5,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            }}
          >
            Chỉnh Sửa
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
