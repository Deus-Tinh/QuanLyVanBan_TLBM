import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { CATEGORY_OPTIONS } from '../types';
import type { RecordItem, StatusKey } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  order: number;
  code: string;
  title: string;
  category: string;
  owner: string;
  created_at: string;
  status: StatusKey;
  description: string;
}

interface FormErrors {
  order?: string;
  code?: string;
  title?: string;
  created_at?: string;
}

interface EditCategoryDialogProps {
  open: boolean;
  record: RecordItem | null;
  onClose: () => void;
  onSubmit: (record: RecordItem) => void;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim())       errors.title      = 'Tên tài liệu là bắt buộc.';
  if (!data.code.trim())        errors.code       = 'Số ký hiệu là bắt buộc.';
  if (!data.created_at.trim())  errors.created_at = 'Ngày lập là bắt buộc.';
  if (data.order < 1)           errors.order      = 'Số thứ tự ưu tiên phải lớn hơn 0.';
  return errors;
}

// ─── Form Content Component ───────────────────────────────────────────────────

function EditCategoryFormContent({
  record,
  onClose,
  onSubmit,
}: {
  record: RecordItem;
  onClose: () => void;
  onSubmit: (record: RecordItem) => void;
}) {
  const [form, setForm] = useState<FormData>(() => ({
    order: record.order ?? 1,
    code: record.code || '',
    title: record.title || '',
    category: record.category || 'Quy trình',
    owner: record.owner || '',
    created_at: record.created_at || '',
    status: record.status || 'active',
    description: record.description || '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'order' ? Number(e.target.value) || 1 : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
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

    const today = new Date().toISOString().split('T')[0];

    const updatedRecord: RecordItem = {
      ...record,
      order:       form.order,
      code:        form.code.trim().toUpperCase(),
      title:       form.title.trim(),
      category:    form.category.trim(),
      owner:       form.owner.trim(),
      created_at:  form.created_at,
      updated_at:  today,
      status:      form.status,
      description: form.description.trim() || undefined,
    };

    onSubmit(updatedRecord);
  };

  return (
    <Dialog
      open={true}
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
              <EditIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>
                Chỉnh Sửa Danh Mục Tài Liệu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cập nhật toàn bộ các trường thông tin danh mục tài liệu
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Form ── */}
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
              placeholder="VD: Quy trình tuyển dụng & tiếp nhận nhân sự"
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

          {/* Số ký hiệu */}
          <Box>
            <TextField
              label="Số Ký Hiệu Hồ Sơ / Mã Tài Liệu"
              placeholder="VD: HS-2026-009 hoặc TL-01"
              value={form.code}
              onChange={handleChange('code')}
              error={!!errors.code}
              helperText={errors.code}
              size="small"
              fullWidth
              required
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
            />
          </Box>

          {/* Số TT ưu tiên */}
          <Box>
            <TextField
              label="Số TT (Thứ tự ưu tiên hiển thị)"
              type="number"
              placeholder="VD: 1, 2, 3..."
              value={form.order}
              onChange={handleChange('order')}
              error={!!errors.order}
              helperText={errors.order}
              size="small"
              fullWidth
              required
              slotProps={{ input: { sx: { borderRadius: 2 }, inputProps: { min: 1 } } }}
            />
          </Box>

          {/* Ngày lập */}
          <Box>
            <TextField
              label="Ngày Lập"
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
          </Box>

          {/* Trạng thái */}
          <Box>
            <TextField
              select
              label="Trạng Thái"
              value={form.status}
              onChange={handleChange('status')}
              size="small"
              fullWidth
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
            >
              <MenuItem value="active">Đang lưu hành</MenuItem>
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="archived">Đã lưu trữ</MenuItem>
            </TextField>
          </Box>

          {/* Phân nhóm / Danh mục */}
          <Box>
            <TextField
              select
              label="Phân Nhóm / Danh Mục"
              value={form.category}
              onChange={handleChange('category')}
              size="small"
              fullWidth
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Người lập */}
          <Box>
            <TextField
              label="Người Lập"
              placeholder="VD: Nguyễn Văn A"
              value={form.owner}
              onChange={handleChange('owner')}
              size="small"
              fullWidth
              slotProps={{ input: { sx: { borderRadius: 2 } } }}
            />
          </Box>

          {/* Ghi chú */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <TextField
              label="Ghi Chú / Mô Tả Nội Dung"
              placeholder="Nhập ghi chú..."
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
          startIcon={<SaveIcon />}
          sx={{
            borderRadius: 2, fontWeight: 700, px: 3,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
            '&:hover': { boxShadow: '0 6px 18px rgba(37,99,235,0.45)' },
          }}
        >
          Lưu Thay Đổi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function EditCategoryDialog({
  open,
  record,
  onClose,
  onSubmit,
}: EditCategoryDialogProps) {
  if (!open || !record) return null;

  return (
    <EditCategoryFormContent
      key={record.id}
      record={record}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
