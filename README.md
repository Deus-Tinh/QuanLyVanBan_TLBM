# QuanLyVanBan_TLBM

<<<<<<< HEAD
Tài liệu hướng dẫn sử dụng Git và quy trình quản lý mã nguồn của repository `QuanLyVanBan_TLBM` thuộc organization `QuanLyVanBanTLBM`.

Các giá trị đặt trong dấu `<...>` là placeholder. Trước khi chạy lệnh, thay chúng bằng giá trị thật của tài khoản, task hoặc branch.

## 1. Mô hình repository

Repository là private và được tổ chức theo mô hình một repository chung:

- `main`: phiên bản tích hợp cuối cùng.
- `staging`: branch tích hợp chung trước khi đưa vào `main`.
- `1_layout_home` đến `8_ai_chatbox`: branch tích hợp riêng của 8 nhóm.
- `feat/...`: branch làm task, thường nằm trên fork cá nhân.
- `team_1` đến `team_8`: team thành viên theo nhóm.
- `team_leads`: team chứa nhóm trưởng của các nhóm 1–8.

### Branch và team tương ứng

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

Thành viên vẫn xem được toàn bộ repository ở quyền `Read`. Team chỉ dùng để phân nhóm người và request review; quyền `Read` không che riêng code của branch khác.

## 2. Vai trò và quyền hạn

### Bảng tóm tắt

| Vai trò | Quyền trên repository | Nơi push theo quy trình | Trách nhiệm chính |
| --- | --- | --- | --- |
| Thành viên `team_X` | `Read` | Fork cá nhân | Code task và mở PR vào branch nhóm |
| Nhóm trưởng | `Write` qua `team_leads` | Feature branch; merge PR vào branch nhóm | Review và tích hợp code của nhóm |
| Administrator/owner | `Admin` | Theo chính sách repository | Quản lý quyền, workflow và merge `staging`/`main` |
| Reviewer thủ công | Quyền được mời | Không push | Review hoặc comment khi được request |

### 2.1 Thành viên nhóm

Thành viên thuộc một trong các team `team_1`–`team_8` và nhận quyền `Read` trên repository.

Được phép:

- Clone, fetch và pull code từ repository organization.
- Fork repository private nếu organization đã bật cho phép fork.
- Tạo branch và push code lên fork cá nhân.
- Mở Pull Request từ fork vào branch tích hợp của nhóm.
- Review hoặc comment trên Pull Request theo quyền được cấp.

Không được phép push trực tiếp vào repository organization vì quyền `Read` không có quyền ghi.

Thành viên phải làm việc trên fork cá nhân và feature branch; không code trực tiếp trên `main`, `staging` hoặc branch tích hợp của nhóm.

### 2.2 Nhóm trưởng

Nhóm trưởng thuộc `team_leads`, nhận quyền `Write` trên repository organization.

Quy trình được giao cho nhóm trưởng:

- Review Pull Request từ fork của thành viên.
- Merge Pull Request vào branch tích hợp của nhóm mình.
- Mở Pull Request từ branch nhóm vào `staging`.
- Theo dõi review tự động của team tương ứng và xử lý comment.

Lưu ý kỹ thuật: `Write` là quyền ở cấp repository, không tự giới hạn theo branch. Nếu repository chưa có branch protection hoặc ruleset phù hợp, nhóm trưởng về mặt kỹ thuật có thể push hoặc merge vào branch khác. Việc “mỗi nhóm chỉ thao tác branch của mình” cần được giữ bằng ruleset/branch protection nếu gói GitHub hiện tại hỗ trợ, kết hợp với quy ước vận hành.

Theo quy trình hiện tại, nhóm trưởng không tự merge vào `staging` hoặc `main`; nhóm trưởng mở Pull Request, còn tài khoản administrator/owner thực hiện merge cuối.

### 2.3 Administrator hoặc owner

Administrator/owner có quyền `Admin` và chịu trách nhiệm:

- Quản lý member, team, quyền repository và thiết lập fork.
- Cấu hình branch protection, ruleset và GitHub Actions.
- Kiểm tra Pull Request từ branch nhóm vào `staging`.
- Merge `staging` vào `main` sau khi hoàn tất kiểm tra.
- Xử lý các thay đổi về quyền hoặc workflow của toàn organization.

### 2.4 Reviewer thủ công

Thầy hoặc reviewer khác chỉ được mời thủ công vào những Pull Request cần họ xem. Workflow không tự động mời reviewer này cho mọi Pull Request.

## 3. Luồng branch và Pull Request

| Chặng | Source | Target | Người/team review | Người merge theo quy trình |
| --- | --- | --- | --- | --- |
| 1 | `fork cá nhân:feat/...` | branch nhóm | Nhóm trưởng và người được chỉ định | Nhóm trưởng |
| 2 | branch nhóm | `staging` | Team tương ứng tự động; reviewer khác tùy trường hợp | Administrator/owner |
| 3 | `staging` | `main` | Kiểm tra cuối | Administrator/owner |

Luồng đầy đủ:

~~~text
thành viên code trong worktree local
  -> push feature branch lên fork cá nhân
  -> mở PR từ fork vào branch nhóm
  -> nhóm trưởng review và merge vào branch nhóm
  -> nhóm trưởng mở PR từ branch nhóm vào staging
  -> team tương ứng review tự động
  -> mời thầy/reviewer khác thủ công nếu cần
  -> administrator/owner merge staging vào main
~~~

Không mở Pull Request sai target branch. PR của thành viên phải vào đúng branch nhóm; PR của branch nhóm mới được mở vào `staging`.

## 4. Setup Git local dùng chung cho mọi role

### 4.1 Điều kiện trước khi clone

- Đã chấp nhận lời mời vào organization và được thêm vào đúng team.
- Đã cài Git:

~~~bash
git --version
~~~

- Đã cấu hình tên và email commit nếu máy chưa có:

~~~bash
git config --global user.name "<your-name>"
git config --global user.email "<your-email>"
~~~

- Đã đăng nhập GitHub bằng SSH hoặc HTTPS Credential Manager. Không ghi token trực tiếp vào URL remote và không commit token vào repository.

### 4.2 Clone fork cá nhân và cấu hình remote

Đây là setup khuyến nghị cho thành viên và cũng phù hợp cho nhóm trưởng. `fork` là repository cá nhân để push feature branch; `upstream` là repository chính của organization để lấy code mới nhất.

~~~bash
git clone https://github.com/<your-username>/QuanLyVanBan_TLBM.git
cd QuanLyVanBan_TLBM
git remote rename origin fork
git remote add upstream https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git
git fetch upstream --prune
git remote -v
~~~

Kết quả mong muốn:

- `fork` trỏ tới `https://github.com/<your-username>/QuanLyVanBan_TLBM.git`.
- `upstream` trỏ tới `https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git`.

Nếu dùng SSH, thay URL HTTPS bằng URL SSH tương ứng của hai repository.

### 4.3 Chọn branch đúng với nhóm

Thành viên phải dùng branch nhóm được phân công:

~~~bash
git fetch upstream --prune
git branch -r
~~~

Ví dụ nhóm 5 bắt đầu từ `upstream/5_signing_workflow`; nhóm 2 bắt đầu từ `upstream/2_documents`.

## 5. Thành viên: từ setup local đến Pull Request

### Bước 1: Tạo worktree cho task

Mỗi task tạo một worktree và một feature branch riêng. Worktree giúp nhiều task có thư mục riêng nhưng vẫn dùng chung một repository local.

~~~bash
git worktree add -b feat/<short-description> ../qlvb-<short-description> upstream/<group-branch>
cd ../qlvb-<short-description>
git branch --show-current
git worktree list
~~~

Ví dụ task của nhóm 5:

~~~bash
git worktree add -b feat/signing-status ../qlvb-signing-status upstream/5_signing_workflow
cd ../qlvb-signing-status
~~~

Quy tắc:

- Mỗi task dùng một feature branch riêng.
- Không checkout cùng một branch ở hai worktree cùng lúc.
- Luôn chạy `git branch --show-current` để xác nhận đang đứng đúng branch.
- Không dùng branch nhóm để code trực tiếp.

### Bước 2: Code và kiểm tra local

Trong worktree của task:

~~~bash
git status
git diff
~~~

Code đúng phạm vi module được giao. Trước khi commit, chạy test, lint, build hoặc compile theo cấu hình thực tế của project và xử lý các lỗi phát sinh.

### Bước 3: Cập nhật theo branch nhóm

Trước khi push hoặc trước khi mở PR, đồng bộ feature branch với branch nhóm:

~~~bash
git status
git fetch upstream --prune
git rebase upstream/<group-branch>
~~~

Chỉ rebase khi working tree sạch. Nếu có conflict, sửa file, kiểm tra lại rồi chạy:

~~~bash
git add <resolved-file>
git rebase --continue
~~~

Nếu muốn hủy rebase đang dở:

~~~bash
git rebase --abort
~~~

### Bước 4: Commit và push lên fork

Chỉ stage file thuộc task; không dùng `git add .` bừa bãi:

~~~bash
git branch --show-current
git status
git diff
git add <specific-file-or-directory>
git diff --cached
git diff --cached --check
git commit -m "feat: describe the change"
git push -u fork HEAD
~~~

Sau lần push đầu, các lần sửa tiếp theo chỉ cần:

~~~bash
git push fork HEAD
~~~

Nếu đã rebase feature branch sau khi branch đó được push, dùng:

~~~bash
git push --force-with-lease fork HEAD
~~~

Chỉ dùng `--force-with-lease` trên feature branch cá nhân sau khi kiểm tra đúng remote và branch. Không dùng `git push --force` cho branch dùng chung.

### Bước 5: Mở Pull Request

Trên GitHub, tạo PR với:

- **Head/source**: `fork cá nhân:feat/<short-description>`.
- **Base/target**: `QuanLyVanBanTLBM/QuanLyVanBan_TLBM:<group-branch>`.
- Mô tả task, file chính đã đổi, cách kiểm tra và giới hạn còn lại.
- Request nhóm trưởng review nếu repository chưa tự gán reviewer cho chặng này.

Khi có comment cần sửa, tiếp tục commit và push vào đúng feature branch. Pull Request sẽ tự cập nhật; không tạo PR mới cho cùng task nếu không cần đổi target.

### Bước 6: Dọn worktree

Sau khi thay đổi đã push và không còn file local cần giữ, quay về thư mục repository chính rồi xóa worktree:

~~~bash
cd <main-repository-folder>
git worktree remove ../qlvb-<short-description>
git worktree prune
~~~

Không dùng `--force` nếu chưa kiểm tra các thay đổi chưa commit. Xóa worktree không tự xóa feature branch trên fork.

## 6. Nhóm trưởng: merge PR từ fork vào branch nhóm

Nhóm trưởng có thể dùng đúng setup fork/worktree ở mục 4–5 để code task riêng. Phần bổ sung dưới đây là quy trình tích hợp code của thành viên.

### Bước 1: Kiểm tra PR

PR phải có source là feature branch trên fork của thành viên và target là branch nhóm tương ứng. Ví dụ nhóm 5:

~~~text
source: <member-username>:feat/signing-status
target: QuanLyVanBanTLBM/QuanLyVanBan_TLBM:5_signing_workflow
~~~

Nhóm trưởng kiểm tra:

- Đúng nhóm và đúng branch target.
- Thay đổi chỉ thuộc phạm vi task/module được giao.
- Không có secret, token, file `.env` hoặc private key.
- Test, lint, build/compile và các check của project đã đạt.
- Không có conflict với branch nhóm mới nhất.

### Bước 2: Review và yêu cầu chỉnh sửa

- Nếu chưa đạt, chọn **Request changes** và ghi rõ file hoặc vấn đề cần sửa.
- Nếu đạt, chọn **Approve** hoặc thực hiện review theo quy ước của repository.
- Thành viên sửa trên chính feature branch rồi push lại; nhóm trưởng kiểm tra lại PR.

### Bước 3: Merge vào branch nhóm

Khi PR đạt yêu cầu, nhóm trưởng chọn **Merge pull request** trên GitHub để merge vào branch nhóm. Chọn merge strategy theo quy ước chung của repository và kiểm tra lại target trước khi xác nhận.

Không merge PR này trực tiếp vào `staging` hoặc `main`. Sau khi merge, nhóm trưởng có thể đồng bộ local:

~~~bash
git fetch upstream --prune
git log --oneline -10 upstream/<group-branch>
~~~

### Bước 4: Mở PR branch nhóm vào staging

Sau khi branch nhóm có đủ thay đổi của nhóm:

- Source: `QuanLyVanBanTLBM/QuanLyVanBan_TLBM:<group-branch>`.
- Target: `QuanLyVanBanTLBM/QuanLyVanBan_TLBM:staging`.
- Team tương ứng sẽ được request review tự động nếu workflow đang có hiệu lực.
- Mời thầy hoặc reviewer khác thủ công khi PR cụ thể cần thêm người xem.
- Chờ administrator/owner kiểm tra và merge vào `staging` theo quy trình hiện tại.

## 7. Administrator/owner: kiểm soát staging và main

Administrator/owner kiểm tra các PR có target `staging` hoặc `main`, xác nhận đúng source/target, review và trạng thái kiểm tra, sau đó thực hiện merge theo chính sách repository.

Luồng phát hành được dùng trong repository:

~~~text
branch nhóm -> staging -> main
~~~

Nếu muốn chỉ administrator/owner được merge `staging` và `main`, phải cấu hình branch protection hoặc ruleset tương ứng. Chỉ thêm administrator vào team hoặc đặt base permission không đủ để giới hạn quyền merge theo branch.

## 8. Request review tự động theo team

Workflow `.github/workflows/team-pr-review.yml` được thiết kế để request đúng team khi PR có target là `staging`:

| Source branch | Team được request |
| --- | --- |
| `1_layout_home` | `team_1` |
| `2_documents` | `team_2` |
| `3_dossiers_documents` | `team_3` |
| `4_documents_templates` | `team_4` |
| `5_signing_workflow` | `team_5` |
| `6_tasks` | `team_6` |
| `7_meeting_rooms_birthdays_system` | `team_7` |
| `8_ai_chatbox` | `team_8` |

Workflow chỉ request team; workflow không cấp quyền, không giới hạn branch, không tự merge PR và không tự động mời thầy. File workflow phải tồn tại trên branch mà GitHub Actions sử dụng thì cơ chế này mới chạy.

## 9. Quy ước commit và Pull Request

### Commit message

Dùng message ngắn, mô tả đúng loại thay đổi:

~~~text
feat: add document search filter
fix: validate signing request status
docs: update git workflow
refactor: simplify task service
chore: update development configuration
~~~

### Checklist trước khi mở PR

- Đúng team và đúng branch nhóm.
- Đúng source branch và target branch.
- `git status` không còn thay đổi ngoài phạm vi task.
- Chỉ stage file cần thiết.
- Đã xem `git diff --cached` và chạy `git diff --cached --check`.
- Đã chạy test, lint, build/compile phù hợp với project.
- Không commit password, token, `.env` hoặc private key.
- Đã rebase theo branch nhóm mới nhất nếu cần.
- Mô tả rõ thay đổi, cách kiểm tra và giới hạn còn lại.

## 10. Các lệnh Git thường dùng

Mục này giải thích các lệnh dùng trong quy trình của repository. Các giá trị đặt trong dấu `<...>` cần được thay bằng giá trị thật.

### 10.1 Kiểm tra Git và mở trợ giúp

| Lệnh | Tác dụng |
| --- | --- |
| `git --version` | Kiểm tra Git đã được cài và phiên bản đang dùng. |
| `git help` | Mở trang hướng dẫn tổng quan của Git. |
| `git help <command>` | Mở tài liệu chi tiết của một lệnh, ví dụ `git help rebase`. |
| `git <command> -h` | Hiển thị trợ giúp ngắn trong terminal, ví dụ `git push -h`. |
| `git help -a` | Liệt kê các lệnh Git có sẵn. |
| `git help -g` | Liệt kê các hướng dẫn khái niệm của Git. |
| `git help everyday` | Mở tài liệu các thao tác Git thường ngày. |

`git help <command>` có thể mở manual hoặc trang trợ giúp tùy cấu hình Git trên máy. Nếu chỉ cần xem nhanh cú pháp, dùng `git <command> -h`.

### 10.2 Cấu hình danh tính commit

| Lệnh | Tác dụng |
| --- | --- |
| `git config --global user.name "<your-name>"` | Đặt tên tác giả commit cho toàn máy. |
| `git config --global user.email "<your-email>"` | Đặt email tác giả commit cho toàn máy. |
| `git config --get user.name` | Xem tên đang được dùng trong repository hiện tại. |
| `git config --get user.email` | Xem email đang được dùng trong repository hiện tại. |
| `git config --list --show-origin` | Xem các cấu hình và file sinh ra cấu hình đó. |

Email commit nên là email GitHub phù hợp với tài khoản muốn ghi nhận contribution. Không đặt token hoặc thông tin bí mật trong file cấu hình của project.

### 10.3 Clone và quản lý remote

| Lệnh | Tác dụng |
| --- | --- |
| `git clone <url>` | Tải repository về local và tạo thư mục làm việc. |
| `git remote -v` | Xem các remote và URL fetch/push. |
| `git remote rename origin fork` | Đổi tên remote sau khi clone fork cá nhân. |
| `git remote add upstream <url>` | Thêm repository organization làm nguồn chính. |
| `git remote get-url fork` | Kiểm tra URL của remote fork. |
| `git remote get-url upstream` | Kiểm tra URL của remote organization. |
| `git fetch upstream --prune` | Tải ref mới và xóa thông tin remote-tracking đã bị xóa. Không tự sửa file đang code. |
| `git ls-remote upstream` | Xem branch/tag đang có trên remote mà không cần checkout. |

`fetch` chỉ cập nhật thông tin remote-tracking. Nó không tự merge code vào branch hiện tại.

### 10.4 Branch, lịch sử và thay đổi

| Lệnh | Tác dụng |
| --- | --- |
| `git branch --show-current` | Xác nhận branch hiện tại trước khi code, commit hoặc push. |
| `git branch -a` | Liệt kê branch local và remote-tracking. |
| `git branch -vv` | Xem branch local đang track remote nào và trạng thái ahead/behind. |
| `git switch <branch>` | Chuyển sang branch đã tồn tại. |
| `git switch -c feat/<task> upstream/<group-branch>` | Tạo feature branch mới từ branch nhóm. |
| `git log --oneline --decorate --graph --all` | Xem lịch sử commit và quan hệ giữa các branch. |
| `git show <commit>` | Xem metadata và diff của một commit. |
| `git status` | Xem branch, file modified, staged và untracked. |
| `git status --short` | Xem trạng thái ngắn gọn, phù hợp để kiểm tra trước khi stage. |
| `git diff` | Xem thay đổi chưa stage. |
| `git diff --stat` | Xem thống kê số file và số dòng thay đổi. |
| `git diff --cached` | Xem thay đổi đã stage và sẽ đi vào commit. |
| `git diff upstream/<group-branch>...HEAD` | So sánh toàn bộ thay đổi của feature branch với branch nhóm. |

Trước mọi thao tác có khả năng ghi dữ liệu, nên chạy `git status` và `git branch --show-current` để tránh thao tác nhầm branch.

### 10.5 Worktree

| Lệnh | Tác dụng |
| --- | --- |
| `git worktree list` | Liệt kê các thư mục worktree và branch đang được checkout. |
| `git worktree add -b feat/<task> ../qlvb-<task> upstream/<group-branch>` | Tạo thư mục worktree và feature branch mới từ branch nhóm. |
| `git worktree add --detach ../qlvb-review upstream/<group-branch>` | Tạo worktree chỉ để đọc/review, không gắn với branch local. |
| `git worktree remove ../qlvb-<task>` | Xóa worktree đã hoàn tất. |
| `git worktree prune` | Dọn metadata của worktree không còn tồn tại. |

Không checkout cùng một branch ở hai worktree. Không dùng `git worktree remove --force` nếu chưa kiểm tra thay đổi chưa commit.

### 10.6 Stage và commit

| Lệnh | Tác dụng |
| --- | --- |
| `git add <file-or-directory>` | Stage đúng file hoặc thư mục thuộc task. |
| `git add -p <file>` | Chọn từng hunk thay đổi để stage. |
| `git restore --staged <file>` | Bỏ stage nhưng giữ nguyên thay đổi trong working tree. |
| `git diff --cached --check` | Kiểm tra whitespace error trong phần sắp commit. |
| `git commit -m "<message>"` | Tạo commit từ các thay đổi đã stage. |
| `git commit --amend` | Sửa commit cuối; chỉ dùng khi đã kiểm tra ảnh hưởng, đặc biệt nếu commit đã push. |

Không dùng `git add .` hoặc `git add -A` một cách mù quáng vì có thể đưa file ngoài phạm vi task, secret hoặc file tạm vào commit.

### 10.7 Đồng bộ, rebase và xử lý conflict

| Lệnh | Tác dụng |
| --- | --- |
| `git fetch upstream --prune` | Lấy trạng thái mới nhất từ repository organization. |
| `git rebase upstream/<group-branch>` | Đặt các commit của feature branch lên branch nhóm mới nhất. |
| `git rebase --continue` | Tiếp tục rebase sau khi đã xử lý conflict. |
| `git rebase --abort` | Hủy rebase đang dở và quay về trạng thái trước rebase. |
| `git pull --ff-only upstream <group-branch>` | Cập nhật branch local chỉ bằng fast-forward, không tự tạo merge commit. |
| `git merge --abort` | Hủy merge đang dở nếu merge phát sinh conflict. |

Trước khi rebase hoặc pull, kiểm tra working tree bằng `git status`. Sau khi xử lý conflict, xem lại `git diff`, chạy check của project rồi mới commit hoặc push.

### 10.8 Push lên fork

| Lệnh | Tác dụng |
| --- | --- |
| `git push -u fork HEAD` | Push feature branch hiện tại lên fork và thiết lập tracking. |
| `git push fork HEAD` | Push các commit mới lên đúng feature branch trên fork. |
| `git push --force-with-lease fork HEAD` | Cập nhật fork sau rebase, có kiểm tra trạng thái remote trước khi ghi đè lịch sử. |
| `git push --dry-run fork HEAD` | Kiểm tra push có thể thực hiện mà chưa ghi lên remote. |
| `git push fork --delete feat/<task>` | Xóa feature branch đã hoàn tất trên fork cá nhân. |

Không push feature branch vào `upstream` khi đang làm theo fork workflow. Không dùng `git push --force` cho branch dùng chung.

### 10.9 Kiểm tra và khôi phục thay đổi

| Lệnh | Tác dụng |
| --- | --- |
| `git restore <file>` | Khôi phục file về commit hiện tại; thay đổi chưa commit trong file sẽ mất. Chỉ dùng sau khi đã kiểm tra. |
| `git restore --staged <file>` | Bỏ file khỏi staging mà không xóa thay đổi local. |
| `git revert <commit>` | Tạo commit mới để đảo ngược một commit, phù hợp với branch dùng chung. |
| `git reflog` | Xem lịch sử di chuyển của HEAD để hỗ trợ tìm lại commit/branch sau thao tác nhầm. |
| `git clean -n` | Chỉ liệt kê untracked file có thể bị xóa; không thực hiện xóa. |

Các lệnh khôi phục hoặc dọn file có thể làm mất dữ liệu. Nếu chưa chắc thay đổi nào cần giữ, hãy commit/sao lưu trước hoặc hỏi người phụ trách. Không dùng `git reset --hard` tùy tiện.

### 10.10 Luồng lệnh chuẩn cho một task

~~~bash
git clone https://github.com/<your-username>/QuanLyVanBan_TLBM.git
cd QuanLyVanBan_TLBM
git remote rename origin fork
git remote add upstream https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git
git fetch upstream --prune
git worktree add -b feat/<task> ../qlvb-<task> upstream/<group-branch>
cd ../qlvb-<task>
git branch --show-current
git status
# code và chạy test/build/compile phù hợp
git add <specific-file-or-directory>
git diff --cached
git diff --cached --check
git commit -m "feat: describe the change"
git push -u fork HEAD
~~~

Git chỉ thực hiện clone, branch, commit, fetch, rebase và push. Việc mở Pull Request, chọn reviewer và merge được thực hiện trên GitHub theo luồng ở các mục 3, 5 và 6.

### Cheat sheet

~~~bash
git status
git branch --show-current
git branch -a
git branch -vv
git log --oneline --decorate --graph --all
git diff
git diff --cached
git diff --cached --check
git fetch --prune upstream
git worktree list
git worktree add -b feat/<task> ../qlvb-<task> upstream/<group-branch>
git worktree remove ../qlvb-<task>
git pull --ff-only upstream <group-branch>
git push -u fork HEAD
git push --force-with-lease fork HEAD
git help <command>
git <command> -h
~~~
=======
## Cấu trúc dự án

- Cấu trúc thư mục, domain và quy chuẩn lưu trữ được mô tả tại [`docs/common/architecture/structure.md`](docs/common/architecture/structure.md).
- Thư mục tài liệu `docs/` được tổ chức thành 2 vùng chính:
  - `docs/common/`: Tài liệu đề bài môn học, kiến trúc tổng thể, quy trình Git và quy chuẩn lập trình dùng chung.
  - `docs/modules/`: Phân chia thư mục đặc tả chi tiết cho 8 nhóm chuyên trách độc lập.
- Hướng dẫn xử lý theo cấu trúc dự án dành cho agent nằm tại [`.agents/project-structure.md`](.agents/project-structure.md).
>>>>>>> upstream/staging
