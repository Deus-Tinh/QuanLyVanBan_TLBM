# TỔNG HỢP NỘI DUNG TRAO ĐỔI DEVOPS, QUY CHUẨN DỰ ÁN VÀ BỘ DỮ LIỆU DÙNG CHUNG STAGING

> **Tài liệu tổng hợp từ các kênh trao đổi nội bộ dự án**  
> **Nguồn tư liệu gốc**: Nhóm Zalo *dojangi* (11 thành viên nòng cốt kỹ thuật / DevOps) & nhóm *ITC - Django - QLVB&TL* (28 thành viên toàn bộ dự án).  
> **Thời gian ghi nhận**: 22/10/2026 – 27/10/2026  
> **Biên soạn & chuẩn hóa**: Ban Quản trị Dự án / Nhóm 1 (Dashboard & Hệ thống)

---

## MỤC LỤC
1. [Bối cảnh & Các Mốc Trao Đổi Quan Trọng](#1-bối-cảnh--các-mốc-trao-đổi-quan-trọng)
2. [Quy Chuẩn DevOps & Quy Tắc Pull Request (PR)](#2-quy-chuẩn-devops--quy-tắc-pull-request-pr)
3. [Chính Sách Dữ Liệu Staging vs Môi Trường Local](#3-chính-sách-dữ-liệu-staging-vs-môi-trường-local)
4. [Quy Chuẩn Lưu Trữ File Mẫu & Storage](#4-quy-chuẩn-lưu-trữ-file-mẫu--storage)
5. [Đặc Tả Bộ Dữ Liệu Dùng Chung v3 (Nhóm 7)](#5-đặc-tả-bộ-dữ-liệu-dùng-chung-v3-nhóm-7)
   - [5.1. Danh mục 16 Khối](#51-danh-mục-16-khối)
   - [5.2. Danh mục 82 Đơn vị](#52-danh-mục-82-đơn-vị)
   - [5.3. Danh mục 25 Chức vụ & Ánh xạ Nhóm quyền](#53-danh-mục-25-chức-vụ--ánh-xạ-nhóm-quyền)
   - [5.4. Danh mục 26 Tài khoản Demo Chuẩn](#54-danh-mục-26-tài-khoản-demo-chuẩn)
   - [5.5. Phòng họp & Dữ liệu Lịch họp Mẫu](#55-phòng-họp--dữ-liệu-lịch-họp-mẫu)
   - [5.6. Lời chúc Sinh nhật & Nhân sự](#56-lời-chúc-sinh-nhật--nhân-sự)
6. [Hướng Dẫn Dành Cho Nhóm Phát Triển & Checklist PR](#6-hướng-dẫn-dành-cho-nhóm-phát-triển--checklist-pr)

---

## 1. BỐI CẢNH & CÁC MỐC TRAO ĐỔI QUAN TRỌNG

Trong giai đoạn hoàn thiện đồ án và tích hợp toàn diện hệ thống quản lý văn bản & tài liệu (QLVB&TL), các trao đổi quan trọng giữa DevOps Lead (Lê Thanh Hậu), Reviewer (Đỗ Mạnh Quang) và đại diện các nhóm phát triển (Nhóm 1, Nhóm 2 - Trí Kiệt, Nhóm 7,...) đã diễn ra nhằm chuẩn hóa quy trình và hạ tầng:

| Mốc thời gian | Người phát ngôn | Kênh | Nội dung chính |
| :--- | :--- | :--- | :--- |
| **22/10/2026** | Lê Thanh Hậu | Nhóm DevOps | Nhắc nhở toàn bộ các nhóm thường xuyên merge nhánh `staging` vào nhánh làm việc để tránh conflict phiên bản code. |
| **25/10/2026** | Lê Thanh Hậu | Nhóm DevOps | Đôn đốc các nhóm kiểm tra nhu cầu dữ liệu trên Staging, tổng hợp danh mục cần tạo và gửi ID để DevOps xử lý. |
| **26/10/2026** | Trí Kiệt (Nhóm 2) & Đỗ Mạnh Quang | Nhóm Toàn thể | Nhóm 2 tạo PR #282 bổ sung dữ liệu mẫu và nhờ DevOps review, kiểm tra tích hợp trên Staging. |
| **26/10/2026** | Nhóm 7 / DevOps | Nhóm Toàn thể | Chia sẻ file dữ liệu dùng chung phiên bản chuẩn hóa v3: `Nhom7_BoDuLieuDungChung_v3.xlsx` dùng chung cho toàn hệ thống. |
| **26/10/2026** | Đỗ Mạnh Quang & Lê Thanh Hậu | Nhóm DevOps | Trao đổi về cơ chế nạp DB trên Staging. Thống nhất nguyên tắc: **Không nạp tự do data vào DB Staging**, ưu tiên làm ở Local, file mẫu đặt vào `/srv/shared/storage/`. |
| **27/10/2026 (Tối)** | Lê Thanh Hậu | Nhóm DevOps | **Ban hành quy tắc PR nghiêm ngặt**: Mỗi PR chỉ phục vụ đúng 1 mục tiêu duy nhất. |
| **27/10/2026 (Tối)** | Đỗ Mạnh Quang & Tô Thanh Tân | Nhóm Toàn thể | Rà soát tình trạng cập nhật code của các nhóm lên bản staging mới nhất. |

---

## 2. QUY CHUẨN DEVOPS & QUY TẮC PULL REQUEST (PR)

### 2.1. Quy tắc cốt lõi: Đơn mục tiêu (Single Responsibility PR)
> **Chỉ đạo của Lê Thanh Hậu:**  
> *"Mỗi PR chỉ tồn tại vì 1 mục tiêu, không được vừa fix vừa feat chung 1 chỗ."*

- **Quy định bắt buộc:**
  1. **Tách biệt Feature và Bugfix:** Nhánh `feat/<tên-tính-năng>` chỉ chứa các commit triển khai tính năng đó. Nếu phát hiện bug ở tính năng khác hoặc phần dùng chung, **phải tạo nhánh riêng** `fix/<mô-tả-lỗi>` để tạo PR độc lập.
  2. **Không commit "tiện tay":** Tuyệt đối không format lại code của nhóm khác, không sửa file cấu hình chung trừ khi PR đó chuyên trách việc cập nhật cấu hình.
  3. **Quy mô PR nhỏ gọn:** PR càng nhỏ, DevOps review càng nhanh, nguy cơ conflict càng thấp và dễ dàng rollback khi xảy ra lỗi ngoài ý muốn.

### 2.2. Quy trình làm việc với Git & Staging
1. Trước khi bắt đầu code tính năng mới:
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feat/<ma-issue>-<ten-ngan-gon>
   ```
2. Thường xuyên cập nhật thay đổi từ `staging` vào nhánh làm việc để giải quyết xung đột sớm:
   ```bash
   git fetch origin
   git merge origin/staging
   ```
3. Khi gặp conflict phức tạp về cấu trúc thư mục, migration hoặc logic dùng chung:
   - **Liên hệ ngay với DevOps** (Lê Thanh Hậu / Đỗ Mạnh Quang) để được phân xử và hỗ trợ.
   - Tuyệt đối không dùng `git push --force` lên các nhánh dùng chung (`staging`, `main`).

---

## 3. CHÍNH SÁCH DỮ LIỆU STAGING VS MÔI TRƯỜNG LOCAL

### 3.1. Nguyên tắc hạn chế nạp dữ liệu trực tiếp vào DB Staging
Máy chủ Staging (`118.69.109.155:8088`) là môi trường tích hợp chung của cả 7 phân hệ. Do đó:

1. **Hạn chế tối đa việc nạp Data thủ công hoặc Dump DB đè lên Staging:**
   - Việc các nhóm tự ý dump dữ liệu cá nhân lên DB chung sẽ phá vỡ toàn vẹn tham chiếu (Foreign Keys), làm hỏng luồng liên kết giữa các bảng: Người dùng $\rightarrow$ Văn bản $\rightarrow$ Hồ sơ $\rightarrow$ Ký số $\rightarrow$ Công việc.
2. **Chỉ nạp các bộ dữ liệu được phê duyệt:**
   - Chỉ nạp các bộ dữ liệu danh mục cốt lõi (Khối, Đơn vị, Chức vụ, Tài khoản Demo) theo yêu cầu chuẩn hóa của Giảng viên hướng dẫn (Thầy Duy).
3. **Môi trường Test dữ liệu nghiệp vụ:**
   - **Môi trường Local**: Mỗi thành viên tự dựng DB riêng (dựa trên runbook hướng dẫn có sẵn trong thư mục `docs/common/database/`), tự do tạo seed data, mock dữ liệu để test tính năng và fix bug.
   - **Môi trường Staging**: Nếu cần test luồng trên Staging, thành viên sử dụng các tài khoản demo đã cung cấp và **thao tác nghiệp vụ trực tiếp qua giao diện Web (UI)** để dữ liệu sinh ra tự nhiên và đúng logic hệ thống.

---

## 4. QUY CHUẨN LƯU TRỮ FILE MẪU & STORAGE

- Đối với các tài liệu đính kèm, văn bản mẫu, phôi văn bản hoặc biểu mẫu ký số:
  - Đường dẫn lưu trữ chia sẻ trên máy chủ được thống nhất tại:
    ```bash
    /srv/shared/storage/
    ```
  - Các nhóm xử lý chức năng tải file lên/xuống phải tuân thủ đúng cấu hình `MEDIA_ROOT` và storage backend dùng chung được cấu hình trong `settings.py` của dự án, không lưu cứng đường dẫn tuyệt đối theo máy cá nhân (`C:\...` hay `/home/...`).

---

## 5. ĐẶC TẢ BỘ DỮ LIỆU DÙNG CHUNG V3 (NHÓM 7)

File nguồn chuẩn: `Nhom7_BoDuLieuDungChung_v3.xlsx`  
Bộ dữ liệu gồm 12 sheet cung cấp nền tảng danh mục, tổ chức và nhân sự mẫu cho hệ sinh thái phần mềm.

### 5.1. Danh mục 16 Khối
| STT | Tên Khối |
| :---: | :--- |
| 1 | HỘI ĐỒNG QUẢN TRỊ |
| 2 | VĂN PHÒNG HỘI ĐỒNG QUẢN TRỊ |
| 3 | BAN TỔNG GIÁM ĐỐC |
| 4 | VĂN PHÒNG BAN ĐIỀU HÀNH TẠI TP.HCM & HÀ NỘI |
| 5 | KHỐI KINH DOANH |
| 6 | KHỐI NGHIỆP VỤ |
| 7 | KHỐI HỖ TRỢ |
| 8 | KHỐI QUẢN LÝ RỦI RO |
| 9 | KHỐI TÀI CHÍNH |
| 10 | KHỐI KẾ TOÁN |
| 11 | VĂN PHÒNG 2 |
| 12 | KHU VỰC THÀNH PHỐ HỒ CHÍ MINH |
| 13 | KHU VỰC MIỀN BẮC |
| 14 | KHU VỰC MIỀN TRUNG TÂY NGUYÊN |
| 15 | KHU VỰC ĐÔNG NAM BỘ |
| 16 | GIÁM ĐỊNH VÙNG |

---

### 5.2. Danh mục 82 Đơn vị
Bao gồm các Ban Hội sở, Trung tâm và 40+ Công ty thành viên / Chi nhánh trải dài trên toàn quốc. Tất cả đều gắn với địa chỉ trụ sở/chi nhánh, hotline và email chuẩn (`QLTLBM@gmail.com`).  
*Một số đơn vị tiêu biểu thường dùng trong luồng ký & dashboard:*
- Hội đồng quản trị, Ban kiểm toán nội bộ
- Ban Tổng Giám đốc, Ban Thư ký & Quan hệ cổ đông
- Ban Công nghệ Thông tin, Ban Kế hoạch & Marketing, Ban Nhân sự
- Ban Pháp chế & Tuân thủ, Ban Tái bảo hiểm, Ban Giám định Bồi thường
- Các công ty khu vực: Bảo Long Bến Thành, Bảo Long Chợ Lớn, Bảo Long Thăng Long, Bảo Long Đà Nẵng, Bảo Long Cần Thơ,...

---

### 5.3. Danh mục 25 Chức vụ & Ánh xạ Nhóm quyền
Mỗi chức vụ trong hệ thống được cấu hình sẵn nhóm quyền mặc định tương ứng:

| STT | Tên Chức Vụ | Nhóm Quyền Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :---: | :--- | :---: | :--- |
| 1 | Quản trị viên | `ADMIN` | Quản trị hệ thống, toàn quyền cấu hình |
| 2 | Chủ tịch HĐQT | `BGD` | Lãnh đạo cấp cao, phê duyệt toàn diện |
| 3 | Phó Chủ tịch HĐQT | `BGD` | Lãnh đạo cấp cao |
| 4 | Thành viên HĐQT | `CV` | Tham gia biểu quyết, xem tài liệu |
| 5 | Tổng Giám đốc | `BGD` | Đại diện pháp luật, duyệt ký toàn công ty |
| 6 | Lãnh đạo cơ quan | `BGD` | Lãnh đạo cơ quan |
| 7 | Phó Tổng Giám đốc điều hành | `BGD` | Ký phê duyệt văn bản, hồ sơ trình ký |
| 8 | Phó Tổng Giám đốc kinh doanh | `BGD` | Ký phê duyệt văn bản nghiệp vụ |
| 9 | Giám đốc Khối | `TP` | Quản lý khối, duyệt ký đơn vị cấp khối |
| 10 | Phó Giám đốc Khối | `TP` | Phó thủ trưởng khối |
| 11 | Giám đốc Vùng | `TP` | Quản lý khu vực địa lý |
| 12 | Trợ lý TGĐ | `CV, TLBGD` | Rà soát văn bản trước khi trình BGD ký |
| 13 | Giám đốc | `TP` | Giám đốc chi nhánh / đơn vị |
| 14 | Phó Giám đốc | `TP` | Phó giám đốc chi nhánh / đơn vị |
| 15 | Trưởng Ban | `TP` | Trưởng ban hội sở |
| 16 | Phó Ban | `TP` | Phó ban hội sở |
| 17 | Trưởng Bộ phận | `TP` | Quản lý cấp phòng/bộ phận |
| 18 | Trưởng nhóm | `CV` | Quản lý vi mô |
| 19 | Trưởng phòng | `TP` | Trưởng phòng chuyên môn |
| 20 | Phó phòng | `TP` | Phó phòng chuyên môn |
| 21 | Chuyên viên | `CV` | Soạn thảo văn bản, xử lý nghiệp vụ, thực hiện task |
| 22 | Văn thư | `VT` | Tiếp nhận văn bản đến, phát hành văn bản đi, đóng dấu |
| 23 | Kiểm toán viên | `CV, KT` | Kiểm soát tuân thủ và đối soát hồ sơ |
| 24 | Nhân viên | `CV` | Nhân sự thừa hành |
| 25 | Thành viên | `CV` | Thành viên nghiệp vụ |

---

### 5.4. Danh mục 26 Tài khoản Demo Chuẩn
Mật khẩu của tất cả các tài khoản demo được thiết lập đồng nhất lúc nạp command (thông qua flag `--mat-khau-demo` của Django management command).

| Tên Đăng Nhập | Nhóm Quyền | Họ và Tên | Đơn Vị | Chức Vụ | Ghi Chú Demo |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`demo_admin`** | `ADMIN` | Hồ Thu Giang | Ban Công nghệ thông tin | Quản trị viên | Superuser |
| **`demo_bgd_1`** | `BGD` | Hoàng Minh Bình | Ban Tổng Giám đốc | Phó TGĐ điều hành | Test luồng ký sếp |
| **`demo_bgd_2`** | `BGD` | Đặng Đức Cường | Ban Tổng Giám đốc | Phó TGĐ điều hành | Test luồng ký sếp |
| **`demo_bgd_3`** | `BGD` | Bùi Minh Cường | Ban Tổng Giám đốc | Phó TGĐ điều hành | Test luồng ký sếp |
| **`demo_bgd_4`** | `BGD` | Lê Kim Thảo | Ban Tổng Giám đốc | Phó TGĐ điều hành | Test luồng ký sếp |
| **`demo_tp_1`** | `TP` | Vũ Mai Hạnh | Ban Công nghệ thông tin | Trưởng phòng | Duyệt sơ bộ cấp phòng |
| **`demo_tp_2`** | `TP` | Đặng Ngọc Hương | Ban Công nghệ thông tin | Trưởng phòng | Duyệt sơ bộ cấp phòng |
| **`demo_tp_3`** | `TP` | Vũ Phương Dung | Ban Công nghệ thông tin | Trưởng phòng | Duyệt sơ bộ cấp phòng |
| **`demo_tp_4`** | `TP` | Nguyễn Thu Châu | Ban Công nghệ thông tin | Trưởng phòng | Duyệt sơ bộ cấp phòng |
| **`demo_cv_1`** | `CV` | Đặng Mai Hạnh | Ban Công nghệ thông tin | Chuyên viên | Tạo văn bản, nhận task |
| **`demo_cv_2`** | `CV` | Lê Gia Tài | Ban Công nghệ thông tin | Chuyên viên | Tạo văn bản, nhận task |
| **`demo_cv_3`** | `CV` | Trần Kim Thảo | Ban Công nghệ thông tin | Chuyên viên | Tạo văn bản, nhận task |
| **`demo_cv_4`** | `CV` | Vũ Tuấn Tài | Ban Công nghệ thông tin | Chuyên viên | Tạo văn bản, nhận task |
| **`demo_vt_1`** | `VT` | Huỳnh Văn Vinh | Ban Hành chính quản trị | Văn thư | Vào sổ, phát hành |
| **`demo_vt_2`** | `VT` | Lý Khánh Anh | Ban Hành chính quản trị | Văn thư | Vào sổ, phát hành |
| **`demo_vt_3`** | `VT` | Huỳnh Thu Hương | Ban Hành chính quản trị | Văn thư | Vào sổ, phát hành |
| **`demo_vt_4`** | `VT` | Lê Đức An | Ban Hành chính quản trị | Văn thư | Vào sổ, phát hành |
| **`demo_tlbgd_1`** | `TLBGD` | Phạm Hữu Dũng | Ban Tổng Giám đốc | Trợ lý TGĐ | Soát xét văn bản |
| **`demo_tlbgd_2`** | `TLBGD` | Đỗ Đức Hiếu | Ban Tổng Giám đốc | Trợ lý TGĐ | Soát xét văn bản |
| **`demo_tlbgd_3`** | `TLBGD` | Đỗ Đức Hùng | Ban Tổng Giám đốc | Trợ lý TGĐ | Soát xét văn bản |
| **`demo_tlbgd_4`** | `TLBGD` | Vũ Bảo Hương | Ban Tổng Giám đốc | Trợ lý TGĐ | Soát xét văn bản |
| **`demo_kt_1`** | `KT` | Dương Mai Linh | Ban Kiểm toán nội bộ | Kiểm toán viên | Kiểm tra hồ sơ |
| **`demo_kt_2`** | `KT` | Hồ Văn Vinh | Ban Kiểm toán nội bộ | Kiểm toán viên | Kiểm tra hồ sơ |
| **`demo_kt_3`** | `KT` | Phạm Thanh Dung | Ban Kiểm toán nội bộ | Kiểm toán viên | Kiểm tra hồ sơ |
| **`demo_kt_4`** | `KT` | Lê Quốc Quân | Ban Kiểm toán nội bộ | Kiểm toán viên | Kiểm tra hồ sơ |
| **`demo_nghiviec`**| *(Khóa)* | Nguyễn Đức Thắng | Ban Nhân sự | Nhân viên | **Bị chặn login** |

---

### 5.5. Phòng Họp & Dữ Liệu Lịch Họp Mẫu
- **Hệ thống 8 Phòng họp mẫu**:
  1. *Phòng họp lớn tầng 10*: Sức chứa 40 người (Máy chiếu, Micro, Video conference).
  2. *Phòng họp HĐQT tầng 12*: Sức chứa 16 người (Màn hình 85", Micro hội nghị, Ghi âm).
  3. *Phòng họp Ban điều hành tầng 11*: Sức chứa 20 người (Màn hình, Video conference).
  4. *Phòng họp nhỏ A tầng 8*: Sức chứa 8 người (TV, Bảng trắng).
  5. *Phòng họp nhỏ B tầng 8*: Sức chứa 6 người (Bảo trì).
  6. Các phòng họp chi nhánh khu vực miền Bắc, Trung, Nam.
- **Dữ liệu lịch họp mẫu (36 lượt đặt)**:
  - Phục vụ kiểm thử giao diện Lịch công tác / Đặt phòng họp trên Dashboard và module Nhóm 7, bao gồm các sự kiện họp tuần, họp ban dự án chuyển đổi số, họp hội đồng thẩm định,...

---

### 5.6. Lời Chúc Sinh Nhật & Nhân Sự
- **Sinh nhật**: 16 lời chúc mẫu (gồm thiệp `GOLDEN`, có lời chúc công khai và lời chúc ẩn danh) phục vụ widget thông báo sinh nhật trên Dashboard.
- **Quy mô nhân sự**: 491 cán bộ nhân viên trong sheet `CBNV` phủ đều 82 đơn vị, bảo đảm mỗi đơn vị đều có đủ cơ cấu Trưởng phòng, Chuyên viên và Văn thư liên kết.
- **Kiêm nhiệm**: 11 trường hợp nhân sự kiêm nhiệm nhiều đơn vị/khối khác nhau để kiểm thử tính năng chuyển đổi vai trò và phân quyền động.

---

## 6. HƯỚNG DẪN DÀNH CHO NHÓM PHÁT TRIỂN & CHECKLIST PR

### 6.1. Đối với Nhóm 1 (Dashboard & Signing Integration)
1. **Liên kết Widget "Nhiệm vụ cần xử lý"**:
   - Sử dụng các tài khoản `demo_cv_*`, `demo_tp_*`, `demo_bgd_*` để kiểm thử danh sách công việc hiển thị theo quyền.
2. **Liên kết Ký số & Văn bản**:
   - Các tài liệu trình ký phải gán đúng người ký là các tài khoản `demo_bgd_*` hoặc `demo_tp_*`.
3. **Widget Lịch họp & Sinh nhật**:
   - Sử dụng dữ liệu mẫu từ sheet `DatPhongHop` và `LoiChucSinhNhat` để kiểm thử widget trên Dashboard.

### 6.2. Checklist Trước Khi Tạo Pull Request
- [ ] Nhánh code xuất phát từ `staging` mới nhất (`git pull origin staging`).
- [ ] PR chỉ giải quyết **duy nhất 1 mục tiêu** (Không gộp `fix` vào `feat` hoặc ngược lại).
- [ ] Đã chạy kiểm tra local thành công, không phát sinh lỗi syntax/lỗi linter.
- [ ] Không có file cấu hình bí mật (`.env`), không có dump database hoặc file nháp cá nhân.
- [ ] Mô tả PR rõ ràng: Nêu rõ mục tiêu, danh sách file thay đổi và kịch bản kiểm thử.
