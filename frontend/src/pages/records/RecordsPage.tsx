import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RecordsTabs from './components/RecordsTabs';
import AddCategoryDialog from './components/AddCategoryDialog';
import EditCategoryDialog from './components/EditCategoryDialog';
import ViewCategoryDialog from './components/ViewCategoryDialog';
import type { RecordItem, DocumentType } from './types';
import { MOCK_RECORDS, MOCK_DOC_TYPES } from './mockData';

const ROWS_PER_PAGE = 6;

export default function RecordsPage() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [tabIndex, setTabIndex]         = useState(0);
  const [searchText, setSearchText]     = useState('');
  const [yearFilter, setYearFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]                 = useState(1);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen]   = useState(false);
  const [editingRecord, setEditingRecord]   = useState<RecordItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingRecord, setViewingRecord]   = useState<RecordItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<RecordItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Notifications
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: 'success' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ── Data ──────────────────────────────────────────────────────────────────
  const [records, setRecords]    = useState<RecordItem[]>(MOCK_RECORDS);
  const docTypes: DocumentType[] = MOCK_DOC_TYPES;

  // Lấy danh sách các năm có trong dữ liệu
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    records.forEach((r) => {
      if (r.created_at) {
        const yr = r.created_at.split('-')[0];
        if (yr) yearsSet.add(yr);
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [records]);

  // Xử lý đổi tab
  const handleTabChange = (newTabIndex: number) => {
    setTabIndex(newTabIndex);
    setPage(1);
    setSearchText('');
    setYearFilter('all');
    setStatusFilter('all');
  };

  // ── Filter & Sort ─────────────────────────────────────────────────────────

  // Lọc và sắp xếp theo Số thứ tự ưu tiên (order) tăng dần (mục "Tài liệu, BM chung" hoặc order 1 lên đầu)
  const filteredRecords = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    const filtered = records.filter((r) => {
      // Tìm kiếm theo Tên tài liệu hoặc Số ký hiệu hồ sơ
      const matchSearch = !q
        || r.title.toLowerCase().includes(q)
        || r.code.toLowerCase().includes(q)
        || (r.owner ?? '').toLowerCase().includes(q);

      // Lọc theo Năm
      const recordYear = r.created_at ? r.created_at.split('-')[0] : '';
      const matchYear = yearFilter === 'all' || recordYear === yearFilter;

      // Lọc theo Trạng thái
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;

      return matchSearch && matchYear && matchStatus;
    });

    // Sắp xếp theo Số TT ưu tiên tăng dần
    return filtered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [records, searchText, yearFilter, statusFilter]);

  const filteredDocTypes = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return docTypes.filter((d) => {
      const matchSearch = !q
        || d.code.toLowerCase().includes(q)
        || d.name.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'active'   && d.is_active)
        || (statusFilter === 'archived' && !d.is_active);
      return matchSearch && matchStatus;
    });
  }, [docTypes, searchText, statusFilter]);

  const totalItems    = tabIndex === 0 ? filteredRecords.length : filteredDocTypes.length;
  const totalPages    = Math.ceil(totalItems / ROWS_PER_PAGE);
  const pagedRecords  = filteredRecords.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const pagedDocTypes = filteredDocTypes.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Tính ID tiếp theo, STT tiếp theo và danh sách STT hiện có để kiểm tra trùng
  const nextId = useMemo(() => {
    if (records.length === 0) return 1;
    return Math.max(...records.map((r) => r.id)) + 1;
  }, [records]);

  const existingOrders = useMemo(() => {
    return records.map((r) => r.order ?? 0);
  }, [records]);

  const nextOrder = useMemo(() => {
    if (records.length === 0) return 1;
    const maxOrder = Math.max(0, ...records.map((r) => r.order ?? 0));
    return maxOrder + 1;
  }, [records]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleResetFilters = () => {
    setSearchText('');
    setYearFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleAddRecord = (newRecord: RecordItem) => {
    setRecords((prev) => {
      const updated = [...prev, newRecord];
      return updated.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    });
    setAddDialogOpen(false);
    setSnackbar({ open: true, message: 'Thêm mới danh mục tài liệu thành công', severity: 'success' });
    setPage(1);
  };

  const handleEdit = (record: RecordItem) => {
    setEditingRecord(record);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (updatedRecord: RecordItem) => {
    setRecords((prev) => {
      const updated = prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
      return updated.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    });

    setEditDialogOpen(false);
    setEditingRecord(null);
    setSnackbar({ open: true, message: 'Cập nhật danh mục tài liệu thành công', severity: 'success' });
  };

  const handleView = (record: RecordItem) => {
    setViewingRecord(record);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (record: RecordItem) => {
    setDeletingRecord(record);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    const targetTitle = deletingRecord.title;
    setRecords((prev) => prev.filter((r) => r.id !== deletingRecord.id));
    setDeleteConfirmOpen(false);
    setDeletingRecord(null);
    setSnackbar({ open: true, message: `Đã xóa danh mục "${targetTitle}" thành công`, severity: 'success' });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Page Header ── */}
      <Box sx={{
        mb: 3,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 3, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
          }}>
            <FolderOpenIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
              Danh Mục Tài Liệu &amp; Loại Văn Bản
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Quản lý danh mục tài liệu theo số thứ tự ưu tiên, tra cứu theo năm và ký hiệu hồ sơ
            </Typography>
          </Box>
        </Box>

        {/* Nút Thêm danh mục tài liệu mới */}
        {tabIndex === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{
              borderRadius: 2.5, fontWeight: 700, px: 2.5, py: 1,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(37,99,235,0.45)' },
            }}
          >
            Thêm danh mục
          </Button>
        )}
      </Box>

      {/* ── Main Card ── */}
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <RecordsTabs
          tabIndex={tabIndex}
          onTabChange={handleTabChange}
          searchText={searchText}
          onSearchChange={(v) => { setSearchText(v); setPage(1); }}
          yearFilter={yearFilter}
          onYearFilterChange={(v) => { setYearFilter(v); setPage(1); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
          availableYears={availableYears}
          page={page}
          onPageChange={setPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pagedRecords={pagedRecords}
          pagedDocTypes={pagedDocTypes}
          onEditRecord={handleEdit}
          onViewRecord={handleView}
          onDeleteRecord={handleDeleteClick}
          onResetFilters={handleResetFilters}
        />
      </Paper>

      {/* ── Add Category Dialog ── */}
      <AddCategoryDialog
        open={addDialogOpen}
        nextId={nextId}
        nextOrder={nextOrder}
        existingOrders={existingOrders}
        currentUser="Quản trị viên Hệ thống"
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddRecord}
      />

      {/* ── Edit Category Dialog ── */}
      <EditCategoryDialog
        open={editDialogOpen}
        record={editingRecord}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleEditSubmit}
      />

      {/* ── View Category Dialog ── */}
      <ViewCategoryDialog
        open={viewDialogOpen}
        record={viewingRecord}
        onClose={() => {
          setViewDialogOpen(false);
          setViewingRecord(null);
        }}
        onEdit={(record) => {
          handleEdit(record);
        }}
      />

      {/* ── Confirm Delete Dialog ── */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, color: 'error.main' }}>
          <DeleteForeverIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Xác nhận xóa
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', fontSize: '0.92rem' }}>
            Bạn có chắc chắn muốn xóa danh mục tài liệu{' '}
            <b>&quot;{deletingRecord?.title}&quot;</b> (Mã: {deletingRecord?.code}) không?
          </DialogContentText>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Lưu ý: Thao tác này sẽ xóa danh mục khỏi danh sách hệ thống.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteForeverIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Xóa vĩnh viễn
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Success/Status Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity || 'success'}
          variant="filled"
          sx={{ borderRadius: 2.5, fontWeight: 600, minWidth: 280 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
