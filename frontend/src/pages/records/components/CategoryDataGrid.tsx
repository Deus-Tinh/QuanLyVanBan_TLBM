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
import type { RecordItem, StatusKey } from '../types';
import { STATUS_META } from '../types';

interface CategoryDataGridProps {
  rows: RecordItem[];
  onEdit?: (record: RecordItem) => void;
  onView?: (record: RecordItem) => void;
}

const TABLE_HEAD_SX = {
  bgcolor: 'action.hover',
  '& th': { fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' },
};

export default function CategoryDataGrid({ rows, onEdit, onView }: CategoryDataGridProps) {
  return (
    <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Table size="small">
        <TableHead sx={TABLE_HEAD_SX}>
          <TableRow>
            <TableCell>Mã Hồ Sơ</TableCell>
            <TableCell>Tên Hồ Sơ</TableCell>
            <TableCell>Danh Mục</TableCell>
            <TableCell>Người Phụ Trách</TableCell>
            <TableCell>Cập Nhật</TableCell>
            <TableCell align="center">Trạng Thái</TableCell>
            <TableCell align="center">Thao Tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                Không tìm thấy hồ sơ phù hợp
              </TableCell>
            </TableRow>
          ) : rows.map((row, idx) => {
            const st = STATUS_META[row.status as StatusKey] ?? { label: row.status, color: 'default' as const };
            return (
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
                  <Typography variant="body2"
                    sx={{ fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={row.title}
                  >
                    {row.title}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Chip label={row.category} size="small" variant="outlined"
                    sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: '0.72rem' }}
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary">{row.owner ?? '—'}</Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" color="text.secondary"
                    sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                  >
                    {row.updated_at}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <Chip label={st.label} color={st.color} size="small"
                    sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5 }}
                  />
                </TableCell>

                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Xem chi tiết">
                      <IconButton size="small" color="default" onClick={() => onView?.(row)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton size="small" color="primary" onClick={() => onEdit?.(row)}>
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
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
