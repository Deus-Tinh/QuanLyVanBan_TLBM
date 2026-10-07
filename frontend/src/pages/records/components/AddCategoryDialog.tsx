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
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import TagIcon from '@mui/icons-material/Tag';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PersonIcon from '@mui/icons-material/Person';
import type { RecordItem, StatusKey } from '../types';

interface AddCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (record: RecordItem) => void;
  nextId?: number;
  nextOrder?: number;
  existingOrders?: number[];
  currentUser?: string;
}

interface FormData {
  id: number;
  order: number | '';
  code: string;
  title: string;
  owner: string;
  created_at: string;
  description: string;
  category: string;
  status: StatusKey;
}

interface FormErrors {
  order?: string;
  title?: string;
  category?: string;
  owner?: string;
  created_at?: string;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

function AddCategoryForm({
  onClose,
  onSubmit,
  nextId = 1,
  nextOrder = 1,
  existingOrders = [],
  currentUser = 'Quản trị viên Hệ thống',
}: Omit<AddCategoryDialogProps, 'open'>) {
  const [form, setForm] = useState<FormData>(() => ({
    id: nextId,
    order: nextOrder,
    code: '',
    title: '',
    owner: currentUser,
    created_at: getTodayString(),
    description: '',
    category: 'Quy trình',
    status: 'active',
  }));

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (data: FormData): FormErrors => {
    const errs: FormErrors = {};
    if (!data.title.trim()) {
      errs.title = 'Tên tài liệu là bắt buộc (*).';
    }
    if (!data.owner.trim()) {
      errs.owner = 'Người lập tài liệu là bắt buộc (*).';
    }
    if (data.order === '' || Number(data.order) < 1) {
      errs.order = 'STT ưu tiên hiển thị phải lớn hơn 0 (*).';
    } else if (existingOrders.includes(Number(data.order))) {
      errs.order = `STT ưu tiên ${data.order} đã tồn tại trong hệ thống. Vui lòng chọn số khác.`;
    }
    if (!data.created_at.trim()) {
      errs.created_at = 'Ngày lập là bắt buộc.';
    }
    return errs;
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'order'
      ? (e.target.value === '' ? '' : Number(e.target.value))
      : e.target.value;

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
      return;
    }

    const orderNum = form.order === '' ? nextOrder : Number(form.order);
    const newRecord: RecordItem = {
      id: form.id || nextId || Number(new Date()),
      order: orderNum,
      code: form.code.trim().toUpperCase() || `TL-${form.id || nextId}`,
      title: form.title.trim(),
      category: form.category || 'Quy trình',
      owner: form.owner.trim() || currentUser,
      created_at: form.created_at,
      updated_at: form.created_at,
      status: form.status || 'active',
      description: form.description.trim() || undefined,
    };

    onSubmit(newRecord);
    onClose();
  };

  return (
    <>
      {/* ── Header ── */}
      <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
              }}
            >
              <AddIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>
                Thêm Mới Danh Mục Tài Liệu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Nhập đầy đủ thông tin danh mục tài liệu theo quy định
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Form Content ── */}
      <DialogContent sx={{ pt: '32px !important', pb: 2.5 }}>
        <Box
          sx={{
            mt: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.5,
          }}
        >
          {/* 1. ID (Mã hệ thống tự sinh) */}
          <Box>
            <TextField
              label="ID"
              value={form.id || nextId}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  sx: { borderRadius: 2, bgcolor: 'action.hover', fontWeight: 600 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {/* 2. STT ưu tiên hiển thị(*) - Kiểm tra trùng, lấy tự động số lớn nhất + 1 */}
          <Box>
            <TextField
              label="STT ưu tiên hiển thị (*)"
              type="number"
              placeholder={`Tự động: ${nextOrder}`}
              value={form.order}
              onChange={handleChange('order')}
              error={!!errors.order}
              helperText={errors.order || `Lấy tự động: số lớn nhất + 1 (mặc định: ${nextOrder})`}
              size="small"
              fullWidth
              required
              slotProps={{
                input: {
                  sx: { borderRadius: 2 },
                  inputProps: { min: 1 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <FormatListNumberedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {/* 3. Tên tài liệu(*) (Bắt buộc, nhập text) */}
          <Box sx={{ gridColumn: '1 / -1', pt: 0.5 }}>
            <TextField
              label="Tên tài liệu (*)"
              placeholder="Nhập tên tài liệu / danh mục..."
              value={form.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              size="small"
              fullWidth
              required
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
            />
          </Box>

          {/* 4. Số Ký hiệu tài liệu (Nhập text) */}
          <Box>
            <TextField
              label="Số Ký hiệu tài liệu"
              placeholder="VD: HS-2026-024 hoặc TL-BM-01"
              value={form.code}
              onChange={handleChange('code')}
              size="small"
              fullWidth
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
            />
          </Box>

          {/* 5. Ngày lập (Định dạng ngày) */}
          <Box>
            <TextField
              label="Ngày lập"
              type="date"
              value={form.created_at}
              onChange={handleChange('created_at')}
              error={!!errors.created_at}
              helperText={errors.created_at}
              size="small"
              fullWidth
              slotProps={{
                input: { sx: { borderRadius: 2 } },
                inputLabel: { shrink: true },
              }}
            />
          </Box>

          {/* 6. Người lập tài liệu(*) (Lấy tên người tạo hồ sơ) */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              label="Người lập tài liệu (*)"
              placeholder="Tên người tạo hồ sơ..."
              value={form.owner}
              onChange={handleChange('owner')}
              error={!!errors.owner}
              helperText={errors.owner}
              size="small"
              fullWidth
              required
              slotProps={{
                input: {
                  sx: { borderRadius: 2 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {/* 7. Ghi chú (Nhập text) */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              label="Ghi chú"
              placeholder="Nhập ghi chú hoặc mô tả vắn tắt..."
              value={form.description}
              onChange={handleChange('description')}
              size="small"
              fullWidth
              multiline
              minRows={3}
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, fontWeight: 600, px: 2.5 }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 3,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
            '&:hover': { boxShadow: '0 6px 18px rgba(37,99,235,0.45)' },
          }}
        >
          Thêm Danh Mục
        </Button>
      </DialogActions>
    </>
  );
}

export default function AddCategoryDialog({
  open,
  onClose,
  onSubmit,
  nextId,
  nextOrder,
  existingOrders,
  currentUser,
}: AddCategoryDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <AddCategoryForm
        onClose={onClose}
        onSubmit={onSubmit}
        nextId={nextId}
        nextOrder={nextOrder}
        existingOrders={existingOrders}
        currentUser={currentUser}
      />
    </Dialog>
  );
}
