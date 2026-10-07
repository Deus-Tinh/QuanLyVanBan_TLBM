import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { RecordItem, StatusKey } from '../types';
import { STATUS_META } from '../types';

interface CategoryDataGridProps {
  rows: RecordItem[];
  onEdit?: (record: RecordItem) => void;
  onView?: (record: RecordItem) => void;
  onDelete?: (record: RecordItem) => void;
}

const TABLE_HEAD_SX = {
  bgcolor: 'action.hover',
  '& th': { fontWeight: 700, fontSize: '0.82rem', color: 'text.secondary', whiteSpace: 'nowrap' },
};

export default function CategoryDataGrid({ rows, onEdit, onView, onDelete }: CategoryDataGridProps) {
  // State quản lý Menu Popup thao tác
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRecord, setActiveRecord] = useState<RecordItem | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, record: RecordItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveRecord(record);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setActiveRecord(null);
  };

  const handleAction = (action: 'view' | 'edit' | 'delete') => {
    if (!activeRecord) return;
    const target = activeRecord;
    handleCloseMenu();

    if (action === 'view') onView?.(target);
    if (action === 'edit') onEdit?.(target);
    if (action === 'delete') onDelete?.(target);
  };

  return (
    <>
      <TableContainer sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead sx={TABLE_HEAD_SX}>
            <TableRow>
              <TableCell sx={{ width: 80, textAlign: 'center' }}>Số TT</TableCell>
              <TableCell>Tên Tài Liệu</TableCell>
              <TableCell sx={{ width: 140 }}>Số Ký Hiệu</TableCell>
              <TableCell sx={{ width: 130 }}>Ngày Lập</TableCell>
              <TableCell sx={{ width: 140 }} align="center">Trạng Thái</TableCell>
              <TableCell sx={{ width: 90 }} align="center">Thao Tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Không tìm thấy danh mục tài liệu phù hợp
                </TableCell>
              </TableRow>
            ) : rows.map((row, idx) => {
              const st = STATUS_META[row.status as StatusKey] ?? { label: row.status, color: 'default' as const };

              return (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => onView?.(row)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    '&:hover, &.MuiTableRow-hover:hover': {
                      bgcolor: 'rgba(37, 99, 235, 0.06) !important',
                    },
                    transition: 'background-color 0.08s ease',
                  }}
                >
                  {/* Cột 1: Số TT (Ưu tiên hiển thị) */}
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 28,
                        height: 28,
                        borderRadius: 1.5,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        bgcolor: 'action.selected',
                        color: 'text.primary',
                      }}
                    >
                      {row.order ?? idx + 1}
                    </Box>
                  </TableCell>

                  {/* Cột 2: Tên Tài liệu */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                        }}
                        onClick={() => onView?.(row)}
                      >
                        {row.title}
                      </Typography>
                      {row.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            maxWidth: 480,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Cột 3: Số Ký Hiệu */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}>
                      {row.code || '—'}
                    </Typography>
                  </TableCell>

                  {/* Cột 4: Ngày Lập */}
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                      {row.created_at || '—'}
                    </Typography>
                  </TableCell>

                  {/* Cột 5: Trạng Thái */}
                  <TableCell align="center">
                    <Chip
                      label={st.label}
                      color={st.color}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5 }}
                    />
                  </TableCell>

                  {/* Cột 6: Thao Tác (Popup Menu) */}
                  <TableCell align="center">
                    <Tooltip title="Thao tác">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, row)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' },
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menu Popup Thao Tác */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2.5,
              minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: '1px solid',
              borderColor: 'divider',
              py: 0.5,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleAction('view')} sx={{ py: 1, gap: 1 }}>
          <ListItemIcon sx={{ minWidth: 28, color: 'info.main' }}>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: 500 } } }}>
            Xem chi tiết
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction('edit')} sx={{ py: 1, gap: 1 }}>
          <ListItemIcon sx={{ minWidth: 28, color: 'primary.main' }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: 500 } } }}>
            Chỉnh sửa
          </ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction('delete')} sx={{ py: 1, gap: 1, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 28, color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: '0.85rem', fontWeight: 600, color: 'error.main' } } }}>
            Xóa danh mục
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
