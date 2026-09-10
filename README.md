# QuanLyVanBan_TLBM

Hướng dẫn sử dụng Git và mô hình quản lý mã nguồn cho tổ chức `QuanLyVanBanTLBM`.

## Mô hình repository

Đây là repository private Đây là repository private của `QuanLyVanBanTLBM`. `QuanLyVanBanTLBM`.

- `main` là branch tích hợp cuối cùng và ổn định.
- `staging` là branch tích hợp chung cho các nhóm.
- Mỗi nhóm có một branch tích hợp và một GitHub team tương ứng.
- Thành viên thường làm việc trên fork cá nhân và tạo Pull Request.
- Nhóm trưởng review và merge thay đổi vào branch của nhóm.
- Chủ repo hoặc administrator được ủy quyền thực hiện merge cuối từ `staging` vào `main`.

### Mapping branch và team

| Nhóm | Branch tích hợp | GitHub team |
| --- | --- | --- |
| 1 | `1_layout_home` | `team_1` |
| 2 | `2_documents` | `team_2` |
| 3 | `3_dossiers_documents` | `team_3` |
| 4 | `4_documents_templates` | `team_4` |
| 5 | `5_signing_workflow` | `team_5` |
| 6 | `6_tasks` | `team_6` |
| 7 | `7_meeting_rooms_birthdays_system` | `team_7` |
| 8 | `8_ai_chatbox` | `team_8` |

## Quyền truy cập

| Cách được cấp quyền | Quyền trên repository | Mục đích |
| --- | --- | --- |
| Quyền mặc định của organization | `Read` | Thành viên organization được xem repository |
| `team_1` đến `team_8` | `Read` | Clone, fetch, pull, fork, review và mở Pull Request từ fork |
| `team_leads` | `Write` | Quyền ghi cho nhóm trưởng |
| Chủ repo hoặc administrator | `Admin` | Quản lý repository  |

Quyền `Read` không cho phép push trực tiếp vào repository của organization. Quyền `Write` là quyền ở cấp repository, không tự giới hạn theo branch. Nếu cần ngăn nhóm trưởng push hoặc merge ngoài branch được giao, phải cấu hình branch protection hoặc repository rulesets.

Thành viên phải chấp nhận lời mời vào organization và được thêm vào đúng team trước khi sử dụng quyền qua team hoặc cơ chế review tự động. Fork của repository private phải được bật nếu thành viên làm việc theo fork workflow.

## Quy trình làm việc

### 1. Thiết lập fork

Clone fork cá nhân và thêm repository của organization với tên remote `upstream`:

~~~bash
git clone https://github.com/<your-username>/QuanLyVanBan_TLBM.git
cd QuanLyVanBan_TLBM
git remote rename origin fork
git remote add upstream https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git
git fetch upstream
git remote -v
~~~

`fork` là repository cá nhân để thành viên thường push code. `upstream` là repository của organization và là nguồn code chính.

### 2. Tạo feature branch

Bắt đầu từ branch tích hợp của nhóm:

~~~bash
git switch -c feat/<short-description> upstream/<group-branch>
~~~

Ví dụ:

~~~bash
git switch -c feat/document-list upstream/2_documents
git switch -c fix/signing-validation upstream/5_signing_workflow
~~~

Không code trực tiếp trên `staging`, `main` hoặc branch tích hợp của nhóm.

### 3. Cập nhật branch

~~~bash
git fetch upstream
git rebase upstream/<group-branch>
~~~

Tự xử lý conflict ở local, chạy các kiểm tra cần thiết và xem lại diff trước khi push.

### 4. Commit và push lên fork

~~~bash
git status
git diff
git add <specific-file-or-directory>
git commit -m "feat: describe the change"
git push -u fork feat/<short-description>
~~~

Khi dùng `git add`, chỉ chỉ định file hoặc thư mục liên quan; không stage các file không thuộc task.

### 5. Quy trình Pull Request

1. Thành viên mở Pull Request từ feature branch trên fork vào branch tích hợp tương ứng của nhóm.
2. Nhóm trưởng review và merge thay đổi vào branch của nhóm.
3. Nhóm trưởng mở Pull Request từ branch nhóm vào `staging`.
4. Team tương ứng của nhóm được request review cho Pull Request từ branch nhóm vào `staging`.
5. Có thể mời thầy hoặc reviewer khác thủ công khi cần.
6. Chủ repo hoặc administrator được ủy quyền merge `staging` vào `main` sau khi kiểm tra cuối.

Phải kiểm tra đúng source branch và target branch trước khi tạo Pull Request. Pull Request vào sai branch có thể bỏ qua quy trình phân công của nhóm.

## Tự động request review theo team

Workflow `.github/workflows/team-pr-review.yml` ánh xạ chính xác branch nhóm với team:

~~~text
1_layout_home                    -> team_1
2_documents                      -> team_2
3_dossiers_documents             -> team_3
4_documents_templates            -> team_4
5_signing_workflow               -> team_5
6_tasks                          -> team_6
7_meeting_rooms_birthdays_system -> team_7
8_ai_chatbox                     -> team_8
~~~

Workflow chỉ request team tương ứng khi target branch của Pull Request là `staging`. Workflow không tự merge Pull Request, không cấp quyền repository, không chặn target branch sai và không tự động mời thầy. File workflow phải tồn tại trên branch đang hoạt động thì GitHub Actions mới có thể chạy.

## Quy ước commit message

Dùng message ngắn và mô tả đúng thay đổi:

~~~text
feat: add document search filter
fix: validate signing request status
docs: update git workflow
refactor: simplify task service
chore: update development configuration
~~~

## Checklist trước khi tạo Pull Request

- Kiểm tra source branch và target branch.
- Chỉ thay đổi phần thuộc module được giao.
- Rebase trên branch nhóm mới nhất trước khi request review.
- Chạy test, lint và build phù hợp.
- Không commit password, token, file `.env` hoặc private key.
- Mô tả thay đổi, các bước đã kiểm tra và giới hạn còn lại.
- Không merge vào `staging` hoặc `main` nếu chưa có review và quyền cho phép.

## Các lệnh thường dùng

~~~bash
git status
git branch -a
git log --oneline --decorate -10
git diff upstream/<group-branch>...HEAD
git fetch --prune upstream
git switch <branch>
git pull --ff-only upstream <branch>
~~~
