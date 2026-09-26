import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import type { RecordItem } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  code: string;
  title: string;
  owner: string;
  created_at: string;
  description: string;
}

interface FormErrors {
  code?: string;
  title?: string;
  owner?: string;
  created_at?: string;
}

interface EditCategoryDialogProps {
  open: boolean;
  record: RecordItem | null;
  onClose: () => void;
  onSubmit: (record: RecordItem) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormData = {
  code: '',
  title: '',
  owner: '',
  created_at: '',
  description: '',
};

const EMPTY_ERRORS: FormErrors = {};

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.code.trim())       errors.code       = 'Số ký hiệu là bắt buộc.';
  if (!data.title.trim())      errors.title      = 'Tên tài liệu là bắt buộc.';
  if (!data.owner.trim())      errors.owner      = 'Người lập là bắt buộc.';
  if (!data.created_at.trim()) errors.created_at = 'Ngày lập là bắt buộc.';
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditCategoryDialog({
  open,
  record,
  onClose,
  onSubmit,
}: EditCategoryDialogProps) {
  const [form, setForm]     = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  useEffect(() => {
    if (record) {
      setForm({
        code: record.code || '',
        title: record.title || '',
        owner: record.owner || '',
        created_at: record.created_at || '',
        description: record.description || '',
      });
      setErrors(EMPTY_ERRORS);
    } else {
      setForm(EMPTY_FORM);
      setErrors(EMPTY_ERRORS);
    }
  }, [record, open]);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear lỗi ngay khi user bắt đầu nhập
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    const newErrors = validate(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Không đóng dialog
    }

    if (!record) return;

    const today = new Date().toISOString().split('T')[0];

    const updatedRecord: RecordItem = {
      ...record,
      code:        form.code.trim(),
      title:       form.title.trim(),
      owner:       form.owner.trim(),
      created_at:  form.created_at,
      updated_at:  today,
      description: form.description.trim() || undefined,
    };

    onSubmit(updatedRecord);
    handleClose();
  };

  const handleClose = () => {
    setErrors(EMPTY_ERRORS);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
              <EditIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
                Chỉnh Sửa Danh Mục Hồ Sơ
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cập nhật thông tin danh mục hồ sơ
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Form ── */}
      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Số ký hiệu */}
          <TextField
            label="Số ký hiệu"
            placeholder="VD: HS-2026-009"
            value={form.code}
            onChange={handleChange('code')}
            error={!!errors.code}
            helperText={errors.code}
            size="small"
            fullWidth
            required
            slotProps={{ input: { sx: { borderRadius: 2 } } }}
          />

          {/* Tên tài liệu */}
          <TextField
            label="Tên tài liệu"
            placeholder="VD: Hồ sơ hợp đồng lao động Q4/2026"
            value={form.title}
            onChange={handleChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            size="small"
            fullWidth
            required
            slotProps={{ input: { sx: { borderRadius: 2 } } }}
          />

          {/* Người lập */}
          <TextField
            label="Người lập"
            placeholder="VD: Nguyễn Văn A"
            value={form.owner}
            onChange={handleChange('owner')}
            error={!!errors.owner}
            helperText={errors.owner}
            size="small"
            fullWidth
            required
            slotProps={{ input: { sx: { borderRadius: 2 } } }}
          />

          {/* Ngày lập */}
          <TextField
            label="Ngày lập"
            type="date"
            value={form.created_at}
            onChange={handleChange('created_at')}
            error={!!errors.created_at}
            helperText={errors.created_at}
            size="small"
            fullWidth
            required
            slotProps={{
              input:      { sx: { borderRadius: 2 } },
              inputLabel: { shrink: true },
            }}
          />

          {/* Ghi chú */}
          <TextField
            label="Ghi chú"
            placeholder="Không bắt buộc"
            value={form.description}
            onChange={handleChange('description')}
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{ input: { sx: { borderRadius: 2 } } }}
          />
        </Box>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{
            borderRadius: 2, fontWeight: 700,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            '&:hover': { boxShadow: '0 4px 14px rgba(37,99,235,0.4)' },
          }}
        >
          Lưu thay đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
}
