import React, { useState } from 'react';
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
  FormControlLabel,
  Switch,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import type { DocumentType } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  code: string;
  name: string;
  description: string;
  is_active: boolean;
}

interface FormErrors {
  code?: string;
  name?: string;
}

interface EditDocumentTypeDialogProps {
  open: boolean;
  documentType: DocumentType | null;
  onClose: () => void;
  onSubmit: (docType: DocumentType) => void;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.code.trim()) errors.code = 'Mã loại văn bản là bắt buộc.';
  if (!data.name.trim()) errors.name = 'Tên loại văn bản là bắt buộc.';
  return errors;
}

// ─── Form Content Component ───────────────────────────────────────────────────

function EditDocumentTypeFormContent({
  documentType,
  onClose,
  onSubmit,
}: {
  documentType: DocumentType;
  onClose: () => void;
  onSubmit: (docType: DocumentType) => void;
}) {
  const [form, setForm] = useState<FormData>(() => ({
    code: documentType.code || '',
    name: documentType.name || '',
    description: documentType.description || '',
    is_active: documentType.is_active ?? true,
  }));
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: 'code' | 'name' | 'description') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, is_active: e.target.checked }));
  };

  const handleSubmit = () => {
    const newErrors = validate(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedDocType: DocumentType = {
      ...documentType,
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      is_active: form.is_active,
    };

    onSubmit(updatedDocType);
  };

  return (
    <Dialog
      open={true}
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
              <EditIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
                Chỉnh Sửa Loại Văn Bản
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cập nhật thông tin loại văn bản
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Form ── */}
      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Mã loại văn bản */}
          <TextField
            label="Mã loại văn bản"
            placeholder="VD: VB-DEN"
            value={form.code}
            onChange={handleChange('code')}
            error={!!errors.code}
            helperText={errors.code}
            size="small"
            fullWidth
            required
            slotProps={{ input: { sx: { borderRadius: 2 } } }}
          />

          {/* Tên loại văn bản */}
          <TextField
            label="Tên loại văn bản"
            placeholder="VD: Văn bản đến"
            value={form.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            size="small"
            fullWidth
            required
            slotProps={{ input: { sx: { borderRadius: 2 } } }}
          />

          {/* Mô tả */}
          <TextField
            label="Mô tả"
            placeholder="Không bắt buộc"
            value={form.description}
            onChange={handleChange('description')}
            size="small"
            fullWidth
            multiline
            minRows={2}
            slotProps={{ input: { sx: { borderRadius: 2 } } }}
          />

          {/* Trạng thái hoạt động */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Trạng thái áp dụng
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cho phép sử dụng loại văn bản này trong hệ thống
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={handleSwitchChange}
                  color="primary"
                />
              }
              label={form.is_active ? 'Đang dùng' : 'Ngừng dùng'}
              sx={{ m: 0 }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
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

export default function EditDocumentTypeDialog({
  open,
  documentType,
  onClose,
  onSubmit,
}: EditDocumentTypeDialogProps) {
  if (!open || !documentType) return null;

  return (
    <EditDocumentTypeFormContent
      key={documentType.id}
      documentType={documentType}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
