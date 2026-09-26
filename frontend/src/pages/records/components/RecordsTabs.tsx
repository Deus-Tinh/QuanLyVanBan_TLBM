import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Typography,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
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
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  totalItems: number;
  pagedRecords: RecordItem[];
  pagedDocTypes: DocumentType[];
  onEditRecord?: (record: RecordItem) => void;
  onViewRecord?: (record: RecordItem) => void;
}

export default function RecordsTabs({
  tabIndex,
  onTabChange,
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  onPageChange,
  totalPages,
  totalItems,
  pagedRecords,
  pagedDocTypes,
  onEditRecord,
  onViewRecord,
}: RecordsTabsProps) {
  return (
    <>
      {/* Tabs header */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v: number) => onTabChange(v)}
          sx={{ '& .MuiTab-root': { fontWeight: 600, fontSize: '0.875rem', minHeight: 48 } }}
        >
          <Tab icon={<FolderOpenIcon fontSize="small" />} iconPosition="start" label="Hồ Sơ" />
          <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="Loại Văn Bản" />
        </Tabs>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2.5, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={
              tabIndex === 0
                ? 'Tìm theo mã, tên hồ sơ, người phụ trách...'
                : 'Tìm theo mã hoặc tên loại...'
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
            sx={{ flex: '1 1 260px', '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FilterListIcon fontSize="small" />
                Trạng thái
              </Box>
            </InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => onStatusFilterChange(e.target.value)}
              sx={{ borderRadius: 2.5 }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="archived">Đã lưu trữ</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Làm mới bộ lọc">
            <IconButton
              onClick={() => { onSearchChange(''); onStatusFilterChange('all'); }}
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
            {totalItems} kết quả
          </Typography>
        </Box>

        {/* Tab 0: Hồ Sơ */}
        {tabIndex === 0 && <CategoryDataGrid rows={pagedRecords} onEdit={onEditRecord} onView={onViewRecord} />}

        {/* Tab 1: Loại Văn Bản */}
        {tabIndex === 1 && <DocumentTypeDataGrid rows={pagedDocTypes} />}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => onPageChange(v)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Box>
    </>
  );
}
