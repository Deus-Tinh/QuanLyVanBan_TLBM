import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import RecordsTabs from './components/RecordsTabs';
import AddCategoryDialog from './components/AddCategoryDialog';
import EditCategoryDialog from './components/EditCategoryDialog';
import ViewCategoryDialog from './components/ViewCategoryDialog';
import type { RecordItem, DocumentType } from './types';
import { MOCK_RECORDS, MOCK_DOC_TYPES } from './mockData';

const ROWS_PER_PAGE = 5;

export default function RecordsPage() {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [tabIndex, setTabIndex]         = useState(0);
  const [searchText, setSearchText]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]                 = useState(1);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<RecordItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [snackbar, setSnackbar]         = useState({ open: false, message: '' });

  // ── Data — bắt đầu từ mock, mutable qua useState ─────────────────────────
  const [records, setRecords]           = useState<RecordItem[]>(MOCK_RECORDS);
  const docTypes: DocumentType[]        = MOCK_DOC_TYPES;

  // Reset khi đổi tab
  useEffect(() => {
    setPage(1);
    setSearchText('');
    setStatusFilter('all');
  }, [tabIndex]);

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredRecords = records.filter((r) => {
    const q = searchText.toLowerCase();
    const matchSearch = !q
      || r.code.toLowerCase().includes(q)
      || r.title.toLowerCase().includes(q)
      || (r.owner ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredDocTypes = docTypes.filter((d) => {
    const q = searchText.toLowerCase();
    const matchSearch = !q
      || d.code.toLowerCase().includes(q)
      || d.name.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'active'   && d.is_active)
      || (statusFilter === 'archived' && !d.is_active);
    return matchSearch && matchStatus;
  });

  const totalItems    = tabIndex === 0 ? filteredRecords.length : filteredDocTypes.length;
  const totalPages    = Math.ceil(totalItems / ROWS_PER_PAGE);
  const pagedRecords  = filteredRecords.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const pagedDocTypes = filteredDocTypes.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddRecord = (newRecord: RecordItem) => {
    setRecords((prev) => [newRecord, ...prev]);
    setDialogOpen(false);
    setSnackbar({ open: true, message: 'Thêm danh mục hồ sơ thành công' });
    // Reset về trang 1 để thấy record mới
    setPage(1);
    setSearchText('');
    setStatusFilter('all');
  };

  const handleEdit = (record: RecordItem) => {
    setEditingRecord(record);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (updatedRecord: RecordItem) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === updatedRecord.id ? updatedRecord : record
      )
    );

    setEditDialogOpen(false);
    setEditingRecord(null);
    setSnackbar({ open: true, message: 'Cập nhật danh mục hồ sơ thành công' });
  };

  const handleView = (record: RecordItem) => {
    setViewingRecord(record);
    setViewDialogOpen(true);
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
              Quản Lý Hồ Sơ &amp; Loại Văn Bản
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tra cứu, quản lý hồ sơ và danh mục loại văn bản của hệ thống
            </Typography>
          </Box>
        </Box>

        {/* Chỉ hiển thị nút Thêm danh mục ở Tab 0 */}
        {tabIndex === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
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
          onTabChange={setTabIndex}
          searchText={searchText}
          onSearchChange={(v) => { setSearchText(v); setPage(1); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
          page={page}
          onPageChange={setPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pagedRecords={pagedRecords}
          pagedDocTypes={pagedDocTypes}
          onEditRecord={handleEdit}
          onViewRecord={handleView}
        />
      </Paper>

      {/* ── Add Category Dialog ── */}
      <AddCategoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
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
      />

      {/* ── Success Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ open: false, message: '' })}
          severity="success"
          variant="filled"
          sx={{ borderRadius: 2.5, fontWeight: 600, minWidth: 280 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
