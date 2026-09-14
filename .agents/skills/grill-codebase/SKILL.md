---
name: grill-codebase
description: Pre-push knowledge check. Asks practical, straightforward questions about what was just built, why it was done that way, and basic safety checks. Strictly avoids academic or over-complicated trivia, focusing on clear common-sense comprehension before pushing.
---

# Grill Codebase (Kiểm tra Hiểu Biết Trước Khi Push)

> ### ⚠️ NGUYÊN TẮC CỐT LÕI: VIỆC HIỂU QUAN TRỌNG HƠN VIỆC THỰC THI
> *(Hiểu những gì đã làm trước khi đưa vào đóng góp chung)*

Mục tiêu: Đảm bảo developer nắm rõ việc mình vừa làm, giải thích được lý do làm và kiểm soát được rủi ro cơ bản trước khi đưa code lên nhánh chung.

---

## 1. Phong cách Đặt câu hỏi: Thực tế, Gần gũi, Không Cao siêu

| ❌ CẤM (Đánh đố cao siêu, lý thuyết hàn lâm) | ✅ BẮT BUỘC (Thực tế, bám sát task vừa làm) |
| :--- | :--- |
| - Hỏi lý thuyết kiến trúc trừu tượng xa vời.<br>- Đố mẹo số câu truy vấn SQL hay thuật ngữ sách vở.<br>- Bắt nhớ tên biến, số dòng hay cú pháp vụn vặt.<br>- Ép người dùng giải thích những thứ ngoài phạm vi task. | - **Vừa làm gì**: Task này đã tạo/sửa những file nào và chức năng chính là gì?<br>- **Tại sao làm vậy**: Mục đích thực tế của thay đổi này là gì, luồng chạy cơ bản ra sao?<br>- **Kiểm tra an toàn**: Có ảnh hưởng gì tới các phần khác không? Đã kiểm tra các quy chuẩn cơ bản (i18n, CSS token, không xóa nhầm file) chưa? |

---

## 2. Quy trình 3 Bước Trước Khi Push / PR

### Bước 1: Quét `git diff` task vừa làm
Nắm rõ danh sách file thay đổi và mục đích của task.

### Bước 2: Hỏi 2 câu đơn giản, thực chiến
1. *Task này m vừa sửa/tạo những file nào, và tác dụng chính của nó là gì?*
2. *Mục đích của thay đổi này là gì, và m đã kiểm tra xem có ảnh hưởng gì tới các phần khác chưa?*

### Bước 3: Mở Cổng Bàn Giao
- Người prompt giải thích được rõ ràng việc mình vừa làm $\rightarrow$ Chạy kiểm tra build và tiến hành push an toàn.
