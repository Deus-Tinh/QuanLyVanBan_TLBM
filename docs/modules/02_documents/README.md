# Tài Liệu Đặc Tả Kỹ Thuật — Module 02: Quản Lý Văn Bản (Nhóm 2)

> **Đơn vị phụ trách**: Nhóm 2 — Module Văn Bản (Đến, Đi, Mật)  
> **Trưởng nhóm**: Lê Trí Kiệt  
> **Thành viên**: Nguyễn Anh Đô, Nguyễn Tấn Lộc Khiêm, Trần Nhật Tân  
> **Thư mục module**: `docs/modules/02_documents/`  
> **Căn cứ tham chiếu**: `docs/common/ITC - Django - QLVB&TL.md` & `docs/common/FRONTEND_BASELINE_GUIDE.md`

---

## 🏛️ 1. Kiến Trúc Dữ Liệu Cốt Lõi (Database Architecture)

Cả 3 phân hệ Văn bản (Đến, Đi, Mật) **dùng chung duy nhất một bảng thực thể chính `Document`** (`documents_document`), phân biệt bằng trường `loai = 'DEN' | 'DI' | 'MAT'`:

1. **`Document` (Bảng chính):**
   - Định danh: `id` (BigAutoField).
   - Phân loại: `loai` (`DEN`, `DI`, `MAT`).
   - Chuỗi số ký hiệu: `so_hieu` (VD: `01/QĐ-TLBM`, `12/CV-UBND`).
   - Số thứ tự tự tăng: `so_thu_tu` (Số đến tự tăng theo từng năm `nam`).
   - Mốc thời gian: `ngay_den` (đầy đủ ngày giờ phút giây), `ngay_van_ban`, `ngay_het_hieu_luc`.
   - Nội dung: `trich_yeu`, `noi_ban_hanh` (Text cho VB Đến, liên kết Đơn vị cho VB Đi), `ghi_chu`.
   - Hiệu lực: `hieu_luc` (`CON_HIEU_LUC`, `HET_HIEU_LUC`, `THAY_THE`), `link_thay_the`.
   - Liên kết nghiệp vụ: `ho_so` (ManyToMany `records_hoso`), `loai_van_ban` (ManyToMany `records_loaivanban`), `don_vi_nhan` (ManyToMany `organizations_donvi`), `nguoi_nhan` (ManyToMany `auth_user`).
   - Cán bộ ký: `nguoi_ky`, `chuc_vu_nguoi_ky`.
   - Cán bộ tạo: `nguoi_tao` (ForeignKey `auth_user`).

2. **`DocumentAttachment` (Tệp đính kèm):**
   - File đính kèm lưu động theo loại văn bản:
     * Văn bản Đến: `media/02_documents/den/%Y/%m/<filename>`
     * Văn bản Đi: `media/02_documents/di/%Y/%m/<filename>`
     * Văn bản Mật: `media/02_documents/mat/%Y/%m/<filename>`
   - Hỗ trợ định dạng: PDF, DOC, DOCX, JPG, JPEG, PNG (tối đa 20MB).

3. **`DocumentViewLog` (Bảng phụ theo dõi lịch sử người xem):**
   - Quan hệ: `document_id` và `user_id`.
   - Ràng buộc: `unique_together = ('document', 'user')` — ghi nhận mốc thời gian xem gần nhất (`viewed_at`).
   - Phục vụ API tra cứu lịch sử đọc văn bản, lọc theo họ tên và phòng ban.

---

## 📡 2. Danh Sách API Endpoints (`/api/documents/`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :---: | :--- | :---: | :--- |
| `GET` | `/api/documents/?loai=DEN` | Đăng nhập | Lấy danh sách văn bản (phân trang, lọc theo năm, từ ngày - đến ngày, hiệu lực, tìm kiếm từ khóa `q`) |
| `POST` | `/api/documents/` | Đăng nhập | Tạo mới văn bản (tự sinh Số đến an toàn đa luồng) |
| `GET` | `/api/documents/{id}/` | Đăng nhập / Phân quyền Mật | Xem chi tiết văn bản (tự động ghi log vào `DocumentViewLog`) |
| `PUT/PATCH` | `/api/documents/{id}/` | Người tạo / Admin | Cập nhật văn bản (khóa không cho sửa trường Số đến) |
| `DELETE` | `/api/documents/{id}/` | Người tạo / Admin | Xóa văn bản |
| `GET` | `/api/documents/{id}/viewers/` | Đăng nhập | Xem danh sách cán bộ đã đọc văn bản (hỗ trợ lọc `search`, `don_vi`) |
| `GET` | `/api/documents/template/?loai=DEN` | Đăng nhập | Sinh file Excel mẫu trực tiếp từ DB |
| `POST` | `/api/documents/import/` | Đăng nhập | Import danh sách văn bản từ file Excel |
| `GET` | `/api/documents/export/?loai=DEN` | Đăng nhập | Export danh sách văn bản ra Excel theo bộ lọc tìm kiếm |

---

## 💻 3. Tích Hợp Frontend (Chuẩn App Shell & Layout Staging)

Tuân thủ cấu trúc phẳng theo `docs/common/FRONTEND_BASELINE_GUIDE.md`:

### 3.1. Định tuyến Route (`frontend/src/app/router.tsx`)
```tsx
<Route element={<MainLayout />}>
  {/* Phân hệ Văn bản Nhóm 2 */}
  <Route path="/documents/incoming" element={<DocumentsIncomingPage />} />
  <Route path="/documents/outgoing" element={<DocumentsOutgoingPage />} />
  <Route path="/documents/confidential" element={<DocumentsConfidentialPage />} />
</Route>
```

### 3.2. Thành phần Giao diện & Component
1. **`DocumentTable.tsx`**: Bảng danh sách văn bản, phân trang, tự động đổi màu dòng tối cho văn bản hết hiệu lực, menu 3 chấm `⋮` chứa các tác vụ (Xem chi tiết, Sửa, Xóa, Người đã đọc).
2. **`FilterBar.tsx`**: Thanh tìm kiếm từ khóa, lọc theo khoảng thời gian (`ngay_den`), năm, trạng thái hiệu lực.
3. **`DocumentDetailModal.tsx`**: Popup hiển thị chi tiết toàn bộ trường văn bản + nút tải file scan.
4. **`DocumentViewersModal.tsx`**: Popup hiển thị danh sách người đã đọc kèm thanh tìm kiếm tên CBNV và lọc theo phòng ban.
5. **`DocumentFormModal.tsx`**: Popup thêm mới và cập nhật văn bản:
   - Tự động hiển thị Số đến tăng dần.
   - Gợi ý chuỗi số ký hiệu tự động.
   - Cascading dropdown: Chọn Đơn vị nhận ➔ Tự động tải danh sách Cán bộ nhận.
   - Kéo thả upload file đính kèm.

---

## 🧪 4. Trạng Thái Kiểm Thử (Quality Gate)

- **Backend Django Check**: `python manage.py check` ➔ **0 issues**
- **Unit Tests Module Văn Bản**: `python manage.py test documents` ➔ **23/23 tests PASS (100%)**
- **Test File Upload Phân Vùng Động**: Đạt chuẩn `02_documents/den/`, `di/`, `mat/`.
