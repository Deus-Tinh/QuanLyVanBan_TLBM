import React from 'react';
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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { DocumentType } from '../types';

interface DocumentTypeDataGridProps {
  rows: DocumentType[];
}

const TABLE_HEAD_SX = {
  bgcolor: 'action.hover',
  '& th': { fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' },
};

export default function DocumentTypeDataGrid({ rows }: DocumentTypeDataGridProps) {
  return (
    <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Table size="small">
        <TableHead sx={TABLE_HEAD_SX}>
          <TableRow>
            <TableCell>Mã Loại</TableCell>
            <TableCell>Tên Loại Văn Bản</TableCell>
            <TableCell>Mô Tả</TableCell>
            <TableCell>Ngày Tạo</TableCell>
            <TableCell align="center">Trạng Thái</TableCell>
            <TableCell align="center">Thao Tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                Không tìm thấy loại văn bản phù hợp
              </TableCell>
            </TableRow>
          ) : rows.map((row, idx) => (
            <TableRow
              key={row.id}
              sx={{
                bgcolor: idx % 2 === 0 ? 'background.paper' : 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
                transition: 'background-color 0.15s',
              }}
            >
              <TableCell>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {row.code}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary"
                  sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={row.description}
                >
                  {row.description ?? '—'}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2" color="text.secondary"
                  sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                >
                  {row.created_at}
                </Typography>
              </TableCell>

              <TableCell align="center">
                <Chip
                  label={row.is_active ? 'Đang dùng' : 'Ngừng dùng'}
                  color={row.is_active ? 'success' : 'default'}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5 }}
                />
              </TableCell>

              <TableCell align="center">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  <Tooltip title="Xem chi tiết">
                    <IconButton size="small" color="default">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
