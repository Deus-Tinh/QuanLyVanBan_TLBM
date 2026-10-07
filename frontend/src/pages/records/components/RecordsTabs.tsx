import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Tooltip,
  Typography,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryDataGrid from './CategoryDataGrid';
import DocumentTypeDataGrid from './DocumentTypeDataGrid';
import type { RecordItem, DocumentType } from '../types';

interface RecordsTabsProps {
  tabIndex: number;
  onTabChange: (index: number) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  availableYears: string[];
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  totalItems: number;
  pagedRecords: RecordItem[];
  pagedDocTypes: DocumentType[];
  onEditRecord?: (record: RecordItem) => void;
  onViewRecord?: (record: RecordItem) => void;
  onDeleteRecord?: (record: RecordItem) => void;
  onResetFilters: () => void;
}

export default function RecordsTabs({
  tabIndex,
  onTabChange,
  searchText,
  onSearchChange,
  yearFilter,
  onYearFilterChange,
  statusFilter,
  onStatusFilterChange,
  availableYears,
  page,
  onPageChange,
  totalPages,
  totalItems,
  pagedRecords,
  pagedDocTypes,
  onEditRecord,
  onViewRecord,
  onDeleteRecord,
  onResetFilters,
}: RecordsTabsProps) {
  return (
    <>
      {/* Tabs header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v: number) => onTabChange(v)}
          sx={{ '& .MuiTab-root': { fontWeight: 600, fontSize: '0.875rem', minHeight: 48, textTransform: 'none' } }}
        >
          <Tab icon={<FolderOpenIcon fontSize="small" />} iconPosition="start" label="Danh Mục Tài Liệu" />
          <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="Loại Văn Bản" />
        </Tabs>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Toolbar & Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2.5, alignItems: 'center' }}>
          {/* Ô tìm kiếm theo Tên tài liệu hoặc Số ký hiệu */}
          <TextField
            size="small"
            placeholder={
              tabIndex === 0
                ? 'Tìm kiếm theo Tên tài liệu hoặc Số ký hiệu hồ sơ...'
                : 'Tìm theo mã hoặc tên loại văn bản...'
            }
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: '1 1 280px', '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />

          {/* Bộ lọc theo Năm (cho Danh mục tài liệu) */}
          {tabIndex === 0 && (
            <TextField
              select
              size="small"
              label="Năm"
              value={yearFilter}
              onChange={(e) => onYearFilterChange(e.target.value)}
              sx={{ minWidth: 135, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            >
              <MenuItem value="all">Tất cả năm</MenuItem>
              {availableYears.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  Năm {yr}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* Bộ lọc Trạng thái */}
          <TextField
            select
            size="small"
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          >
            <MenuItem value="all">Tất cả trạng thái</MenuItem>
            <MenuItem value="active">Đang lưu hành</MenuItem>
            <MenuItem value="pending">Chờ xử lý</MenuItem>
            <MenuItem value="archived">Đã lưu trữ</MenuItem>
          </TextField>

          {/* Nút Làm mới bộ lọc */}
          <Tooltip title="Làm mới tất cả bộ lọc">
            <IconButton
              onClick={onResetFilters}
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center', fontWeight: 500 }}>
            Tổng số: <b>{totalItems}</b> danh mục
          </Typography>
        </Box>

        {/* Tab 0: Danh mục tài liệu */}
        {tabIndex === 0 && (
          <CategoryDataGrid
            rows={pagedRecords}
            onEdit={onEditRecord}
            onView={onViewRecord}
            onDelete={onDeleteRecord}
          />
        )}

        {/* Tab 1: Loại Văn Bản */}
        {tabIndex === 1 && <DocumentTypeDataGrid rows={pagedDocTypes} />}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => onPageChange(v)}
              color="primary"
              shape="rounded"
              size="medium"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>
    </>
  );
}
