### 1. Mục tiêu thay đổi (Objective)
<!-- Tóm tắt mục đích của PR: giải quyết issue nào, hoàn thành task nào -->

### 2. Chi tiết thay đổi kỹ thuật (Changes)
<!-- Liệt kê các file thay đổi và lý do kỹ thuật ngắn gọn -->
- `path/to/file`: 

### 3. Kiểm thử & Bằng chứng xác thực (Verification & Technical Gates)
> CI tự động chạy các lệnh dưới đây (job `backend` và `frontend`). Chạy local trước khi push để tránh CI đỏ.

- [ ] Frontend Lint: `pnpm --dir frontend run lint` (Pass)
- [ ] Frontend Test: `pnpm --dir frontend run test` (Pass)
- [ ] Frontend Build: `pnpm --dir frontend run build` (Pass 100%, 0 error/warning)
- [ ] Backend Check: `python backend/manage.py check` (Pass)
- [ ] Backend Migrations: `python backend/manage.py makemigrations --check --dry-run` (No changes detected)
- [ ] Backend Test: `python backend/manage.py test` (Pass)
- [ ] i18n Key Parity: `pnpm --dir frontend run check:i18n` (Pass)
- [ ] CSS Design Tokens: `pnpm --dir frontend run check:tokens` (Pass)
- [ ] Tuân thủ i18n (kiểm tra thủ công): 100% text UI dùng `t('namespace.key')`, không hardcode chuỗi trong component
- [ ] Tuân thủ Design Tokens (kiểm tra thủ công): 100% sử dụng biến CSS từ `frontend/src/styles/global.css`
