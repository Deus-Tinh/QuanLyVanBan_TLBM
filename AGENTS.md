# Project Rules & Safety Invariants (QuanLyVanBan_TLBM)

## 1. CỔNG BẮT BUỘC: Pre-Push & Pre-PR Grill Gate

> ### ⚠️ NGUYÊN TẮC CỐT LÕI: VIỆC HIỂU QUAN TRỌNG HƠN VIỆC THỰC THI
> *(Hiểu thấu đáo những gì đã làm trước khi đưa vào đóng góp chung)*

Khi nhận được bất kỳ yêu cầu nào liên quan đến:
- `git push`, đẩy code lên remote repo;
- Tạo Pull Request (`PR`), mở PR, nộp bài, merge PR;
- Yêu cầu bàn giao hoặc release.

**AGENT BẮT BUỘC PHẢI THỰC HIỆN CÁC BƯỚC SAU (CẤM PUSH NGAY):**

1. **HIỂN THỊ NGUYÊN TẮC CỐT LÕI**:
   - Nhắc lại nguyên tắc: *"Việc hiểu quan trọng hơn việc thực thi. Phải hiểu những gì đã làm trước khi đưa vào đóng góp chung."*
2. **DỪNG LẠI & PHÂN TÍCH DIFF TỔNG THỂ**:
   - Quét `git diff HEAD` để nắm rõ danh sách file và nội dung vừa sửa.
3. **HỎI THỰC TẾ, DỄ HIỂU (KHÔNG ĐÁNH ĐỐ CAO SIÊU)**:
   - Đặt 2 đến 3 câu hỏi thực chiến, gần gũi, xoay quanh đúng những gì vừa làm:
     - **Vừa làm gì**: Task vừa rồi đã sửa/tạo những file nào và chức năng chính là gì?
     - **Mục đích & Cách làm**: Tại sao lại làm như thế, luồng hoạt động cơ bản thế nào?
     - **Kiểm tra an toàn**: Có ảnh hưởng gì tới các phần khác không? Đã đảm bảo các quy chuẩn cơ bản (i18n song ngữ, biến CSS tokens, không sót file rác) chưa?
   - **TUYỆT ĐỐI KHÔNG**: Hỏi hàn lâm, lý thuyết cao siêu, bẫy thuật ngữ phức tạp hay kiểm tra trí nhớ học thuộc lòng code.
4. **XÁC THỰC HIỂU VIỆC MÌNH LÀM**:
   - Chỉ cần người prompt nắm rõ mình vừa làm gì, lý do làm và kiểm soát được rủi ro cơ bản là đạt.
   - Khi đã thông suốt: Chạy Technical Gates (`pnpm --dir frontend run build`, `python backend/manage.py check`) và tiến hành thao tác `git push`.

---

## 2. QUY CHUẨN VĂN PHONG TRÊN GIT (COMMITS, ISSUES, PRS)

- **Văn phong Trung tính & Khách quan (Technical Report Style)**:
  - Tuyệt đối **KHÔNG dùng bất kỳ từ ngữ xưng hô cá nhân nào** (không "tôi", "em", "thầy", "bạn", không "t - m").
  - Trình bày dạng báo cáo kỹ thuật khách quan, câu cú súc tích, mạch lạc.
  - Tuyệt đối không dùng tên dữ liệu thử nghiệm, tài khoản cá nhân, mock/seed ID cụ thể; quy chuẩn hóa về danh từ chung (`tài khoản người dùng`, `văn bản đến`, `bản ghi sự kiện`, `/api/:endpoint`).
- **Commit Message**: Tuân thủ chuẩn Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `docs: ...`, `refactor: ...`), viết bằng tiếng Việt hành chính chuẩn mực hoặc tiếng Anh kỹ thuật.

---

## 3. QUY ƯỚC CẤU TRÚC ISSUE (BUG REPORT)

Mọi Issue báo cáo lỗi bắt buộc tuân theo đúng cấu trúc tiêu chuẩn:

```markdown
### 1. Tóm tắt Issue (Summary)
[Mô tả ngắn gọn, súc tích bản chất của sự cố trong 1 - 2 câu]

### 2. Các bước tái hiện (Steps to Reproduce)
1. Bước 1: ...
2. Bước 2: ...
3. Bước 3: ...

### 3. Trạng thái tái hiện & Bằng chứng (Reproduction & Evidence)
- [ ] Đã tái hiện thành công (BẮT BUỘC đính kèm bằng chứng bên dưới nếu tick chọn)
- [ ] Chưa tái hiện được / Lỗi không liên tục (Flaky)

> **Bằng chứng (Evidence):** *(Bắt buộc khi tick đã tái hiện: Log console, Error trace, Mã trạng thái HTTP, Response payload, hoặc Ảnh chụp/Video)*

### 4. Hậu quả về Kỹ thuật (Technical Impact)
[Ảnh hưởng đến database, rò rỉ bộ nhớ, race condition, crash server, tính toàn vẹn dữ liệu...]

### 5. Hậu quả đến Người dùng (User Impact)
[Người dùng bị chặn thao tác nào, dữ liệu hiển thị sai ra sao, trải nghiệm bị gián đoạn thế nào...]

### 6. Mô tả chi tiết Bug
- **Biểu hiện trên UI**: [Giao diện bị treo, vỡ layout, không phản hồi click, toast lỗi không hiện...]
- **Nguyên nhân trong Code**: [Phân tích logic bị sai, hàm nào, file nào, unhandled exception nào trong codebase]

### 7. Hướng khắc phục đề xuất (Proposed Fix)
[Giải pháp xử lý kỹ thuật tối giản theo KISS/YAGNI, không gây side-effect]
```

---

## 4. QUY ƯỚC CẤU TRÚC PULL REQUEST (PR)

Mọi Pull Request bắt buộc trình bày đầy đủ các phần:

```markdown
### 1. Mục tiêu thay đổi (Objective)
[Tóm tắt mục đích của PR: giải quyết issue nào, hoàn thành task nào]

### 2. Chi tiết thay đổi kỹ thuật (Changes)
- `path/to/file`: Mô tả ngắn gọn thay đổi và lý do kỹ thuật.

### 3. Kiểm thử & Bằng chứng xác thực (Verification & Technical Gates)
- [x] Frontend Build: `pnpm --dir frontend run build` (Pass, 0 warning/error)
- [x] Backend Check: `python backend/manage.py check` (Pass)
- [x] Tuân thủ i18n & CSS Tokens: Đã kiểm tra đầy đủ cả 2 nhánh `vi`/`en` và không hardcode mã màu/px.
```

---

## 5. Các Invariant Kỹ thuật Bắt buộc
- **i18n (Trụ cột 1)**: 100% text trên giao diện React phải dùng `t('namespace.key')`. Mọi key mới phải có đầy đủ cả 2 nhánh `vi` và `en` trong `frontend/src/i18n/translations.js`.
- **Design Tokens (Trụ cột 3)**: Không dùng mã màu Hex (`#...`) hay font-size pixel trong CSS. Bắt buộc dùng `var(--color-...)` và `var(--font-...)` từ `src/styles/global.css`.
- **Git Flow**: Không commit/push trực tiếp vào `main`. Kiểm tra `git status` trước khi commit, không dùng `git add .` bừa bãi.
