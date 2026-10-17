# Hướng dẫn làm việc và quy tắc an toàn Git của Nhóm 3

## 1. Thông tin tài liệu

| Nội dung | Giá trị |
|---|---|
| Dự án | Website Quản lý văn bản và tài liệu |
| Nhóm | Nhóm 3 |
| Nhóm trưởng | Đặng Trường Thịnh |
| Nhánh tích hợp của nhóm | `3_dossiers_documents` |
| Nhánh tích hợp chung | `staging` |
| Repository | `https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git` |
| Vị trí tài liệu của nhóm | `docs/module/team_3/` |
| Đối tượng sử dụng | Tất cả thành viên Nhóm 3 |

Tài liệu này là hướng dẫn bắt buộc khi thành viên Nhóm 3 tải mã nguồn, thiết lập môi trường, tạo nhánh, viết code, kiểm tra, commit, push và mở Pull Request. Mục tiêu là tránh sửa nhầm nhánh, mất code, ghi đè công việc của người khác, đưa thông tin bí mật lên GitHub hoặc tạo Pull Request sai nơi.

Nếu nội dung tài liệu này khác với `README.md`, `AGENTS.md`, tài liệu kiến trúc hoặc quyết định mới nhất của giảng viên và nhóm trưởng, phải dừng thao tác và hỏi lại nhóm trưởng. Không tự chọn quy trình thuận tiện hơn.

## 2. Phạm vi hiện tại của Nhóm 3

Theo phạm vi làm việc đã được điều chỉnh, Nhóm 3 phụ trách:

- Backend của module Hồ sơ và Loại văn bản tại khu vực `backend/apps/records/` hoặc đường dẫn tương ứng trong cấu trúc thực tế của nhánh `staging`.
- Frontend của các màn hình, component, route và luồng nghiệp vụ thuộc phạm vi Nhóm 3.
- Model, migration, Django Admin, API, permission, test và tài liệu contract của module.
- Tài liệu riêng của nhóm trong `docs/module/team_3/`.
- Đồng bộ contract giữa backend và frontend của Nhóm 3, gồm field, endpoint, quyền, validation, loading, empty, forbidden và server error.
- Feature branch, Pull Request nội bộ và kiểm tra chất lượng trước khi đề nghị tích hợp vào `staging`.

### 2.1. Phạm vi frontend của Nhóm 3

Theo điều chỉnh mới nhất của nhóm trưởng, Nhóm 3 có trách nhiệm triển khai frontend cho chính module và chức năng của Nhóm 3. Thành viên được sửa các file frontend đã được phân công rõ ràng và có liên quan trực tiếp đến Hồ sơ, Loại văn bản hoặc phạm vi nghiệp vụ của nhóm.

Nhóm 3 không được tự ý sửa giao diện, component, route hoặc luồng nghiệp vụ thuộc nhóm khác. Nếu cần thay đổi component dùng chung hoặc file có nhiều nhóm cùng sử dụng, thành viên phải báo nhóm trưởng và thống nhất với người phụ trách trước khi sửa.

Trước khi giao đầu việc frontend, nhóm trưởng cần xác định:

- Màn hình hoặc luồng nghiệp vụ thuộc Nhóm 3.
- Route, component, service, type và stylesheet được phép sửa.
- Component dùng chung nào cần phối hợp với nhóm khác.
- API contract và trạng thái giao diện phải hỗ trợ.
- Người thực hiện và người review để tránh hai thành viên sửa cùng file.

## 3. Cấu trúc thư mục tài liệu

```text
docs/
├── common/                 # Tài liệu dùng chung, không tự ý sửa
└── module/
    ├── team_1/             # Tài liệu của Nhóm 1
    ├── team_2/             # Tài liệu của Nhóm 2
    ├── team_3/             # Tài liệu riêng của Nhóm 3
    └── ...
```

Quy tắc:

- Tài liệu mới của Nhóm 3 phải nằm trong `docs/module/team_3/`.
- Không tự ý sửa `docs/common/` vì đây là khu vực dùng chung.
- Không sửa, đổi tên hoặc di chuyển thư mục tài liệu của nhóm khác.
- Không tạo thêm một cấu trúc tài liệu tương tự ở vị trí khác nếu chưa được duyệt.
- Không di chuyển tài liệu kỹ thuật đang tồn tại chỉ để khớp tài liệu này. Nếu repository đang dùng thêm một đường dẫn module khác, phải hỏi nhóm trưởng trước khi thay đổi.
- Mã nguồn backend vẫn nằm trong `backend/`; mã nguồn frontend vẫn nằm trong `frontend/`. Không đặt mã nguồn ứng dụng vào `docs/`.

## 4. Các quy tắc bắt buộc

### 4.1. Nhánh được phép làm việc

- `3_dossiers_documents` là nhánh tích hợp của Nhóm 3.
- Mỗi đầu việc phải được thực hiện trên một feature branch riêng, tạo từ `3_dossiers_documents` mới nhất.
- Pull Request nội bộ phải có base là `3_dossiers_documents`.
- Chỉ nhóm trưởng hoặc người được ủy quyền mới tạo Pull Request từ `3_dossiers_documents` vào `staging`.
- Không thành viên nào được push trực tiếp vào `main`.
- Không sửa hoặc push vào nhánh của nhóm khác.

### 4.2. Quy tắc bảo mật

Tuyệt đối không commit hoặc gửi lên GitHub:

- File `.env` chứa cấu hình thật.
- Mật khẩu database.
- API key, access token, refresh token hoặc secret key.
- Personal Access Token của GitHub.
- Thông tin đăng nhập cá nhân.
- Dữ liệu thật của người dùng.
- File log chứa token hoặc dữ liệu nhạy cảm.
- Ảnh chụp màn hình có thông tin bí mật.

Chỉ sử dụng `.env.example` với giá trị mẫu, ví dụ:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=example_database
DB_USER=example_user
DB_PASSWORD=change_me
```

Nếu phát hiện đã commit thông tin bí mật, không tiếp tục push và không chỉ xóa file rồi commit lại. Phải báo ngay cho nhóm trưởng để thu hồi thông tin bí mật và xử lý lịch sử Git đúng cách.

### 4.3. Các lệnh và thao tác bị cấm

Không được thực hiện khi chưa có chỉ định rõ ràng của nhóm trưởng:

```powershell
git push --force
git push -f
git reset --hard
git clean -fd
git rebase -i
git branch -D <ten-nhanh>
```

Ngoài ra, không được:

- Xóa repository rồi clone lại để né conflict mà chưa sao lưu thay đổi.
- Chọn `Accept All Current` hoặc `Accept All Incoming` khi chưa đọc từng conflict.
- Dùng `git add .` một cách máy móc khi chưa xem `git status` và `git diff`.
- Sửa commit của người khác hoặc đổi tác giả commit.
- Merge nhánh khi test chưa chạy hoặc Pull Request còn conflict.
- Bỏ qua review chỉ vì chương trình chạy được trên một máy.
- Bấm `Compare & pull request` mà chưa kiểm tra base branch và compare branch.

## 5. Chuẩn bị trước khi clone

Thành viên cần có:

- Tài khoản GitHub đã được cấp quyền vào repository private.
- Git được cài đặt và kiểm tra bằng `git --version`.
- VS Code hoặc IDE được nhóm thống nhất.
- Python và môi trường backend theo phiên bản được repository quy định.
- Node.js cho việc phát triển, chạy và kiểm tra frontend.
- Quyền đọc `README.md`, `AGENTS.md` và tài liệu kiến trúc hiện có.

Thiết lập tên và email Git cho riêng repository sau khi clone. Dùng username GitHub và email noreply chính xác của từng thành viên:

```powershell
git config --local user.name "<github-username>"
git config --local user.email "<github-noreply-email>"
```

Kiểm tra lại:

```powershell
git config --local --get user.name
git config --local --get user.email
```

Không sao chép username hoặc email của thành viên khác.

## 6. Clone repository lần đầu

Mở PowerShell tại thư mục cha nơi muốn lưu dự án, sau đó chạy từng lệnh:

```powershell
git clone https://github.com/QuanLyVanBanTLBM/QuanLyVanBan_TLBM.git
```

```powershell
cd QuanLyVanBan_TLBM
```

```powershell
git fetch origin
```

Kiểm tra nhánh remote:

```powershell
git branch -r --list origin/3_dossiers_documents
```

Nếu kết quả có `origin/3_dossiers_documents`, tạo nhánh local theo dõi nhánh Nhóm 3:

```powershell
git switch --track origin/3_dossiers_documents
```

Nếu Git thông báo nhánh local đã tồn tại, dùng:

```powershell
git switch 3_dossiers_documents
```

Kiểm tra bắt buộc:

```powershell
git branch --show-current
git status
git remote -v
```

Kết quả đúng phải thể hiện:

```text
3_dossiers_documents
Your branch is up to date with 'origin/3_dossiers_documents'.
nothing to commit, working tree clean
```

Nếu nhánh hiện tại là `staging`, `main` hoặc nhánh của nhóm khác, không chỉnh sửa file. Chuyển về đúng nhánh trước.

## 7. Cập nhật repository đã clone trước đó

Trước mỗi buổi làm việc, đứng tại thư mục gốc `QuanLyVanBan_TLBM` và chạy:

```powershell
git status
```

Nếu working tree sạch, tiếp tục:

```powershell
git switch 3_dossiers_documents
git fetch origin
git pull --ff-only origin 3_dossiers_documents
```

Nếu `git status` đang có file thay đổi, không pull ngay. Thành viên phải:

1. Xác định thay đổi thuộc đầu việc nào.
2. Commit hợp lệ trên feature branch hoặc báo nhóm trưởng.
3. Không dùng `git reset --hard` để làm sạch nhanh.
4. Không dùng `git stash` nếu chưa hiểu cách khôi phục.

## 8. Tạo feature branch cho từng đầu việc

Luôn cập nhật nhánh nhóm trước khi tạo feature branch:

```powershell
git switch 3_dossiers_documents
git fetch origin
git pull --ff-only origin 3_dossiers_documents
```

Tạo nhánh mới:

```powershell
git switch -c <loai>/<github-username>/<pham-vi-ngan-gon>
```

Trong đó:

- `<loai>` mô tả loại thay đổi, ví dụ `feat`, `fix`, `test`, `docs` hoặc `refactor`.
- `<github-username>` là username GitHub của người chịu trách nhiệm chính.
- `<pham-vi-ngan-gon>` mô tả đúng một đầu việc bằng chữ thường, không dấu và nối bằng dấu gạch ngang.

Quy ước chuẩn của Nhóm 3:

```text
feat/<github-username>/<scope>
fix/<github-username>/<scope>
test/<github-username>/<scope>
docs/<github-username>/<scope>
refactor/<github-username>/<scope>
```

Ví dụ của nhóm trưởng:

```powershell
git switch -c feat/thinhabc27-sys/records-models
git switch -c feat/thinhabc27-sys/dossier-frontend
git switch -c fix/thinhabc27-sys/records-permissions
```

Ví dụ cho các thành viên khác sau khi thay bằng username GitHub thực tế đã thống nhất:

```text
feat/tuyen/records-list-api
docs/tuyen/records-api-contract
feat/nhi/records-admin
test/nhi/records-permissions
fix/nhi/document-type-empty-state
```

`tuyen` và `nhi` trong ví dụ trên chỉ là tên viết tắt minh họa. Trước khi tạo nhánh, mỗi thành viên phải thay bằng username GitHub chính xác hoặc bí danh ngắn đã được cả nhóm thống nhất. Không sử dụng tên của thành viên khác.

Nếu đầu việc có mã Issue hoặc mã nhiệm vụ, có thể đưa mã vào phần scope:

```text
feat/thinhabc27-sys/issue-15-records-models
fix/tuyen/task-07-records-pagination
```

Không dùng tên mơ hồ như:

```text
my-branch
code-moi
test1
nhanh-thinh
fix-loi
```

Quy tắc quản lý tên nhánh:

- Một feature branch chỉ có một mục tiêu rõ ràng.
- Tên thành viên giúp xác định người phụ trách nhưng không thay thế phần mô tả công việc.
- Không tạo một nhánh cá nhân duy nhất để thực hiện tất cả nhiệm vụ.
- Không gộp model, frontend, tài liệu không liên quan và nhiều bug khác nhau vào cùng một nhánh.
- Nếu chuyển người phụ trách giữa chừng, không tự đổi tên nhánh đã được push; cập nhật người phụ trách trong Pull Request.
- Chỉ dùng chữ thường, số, dấu gạch ngang và dấu `/`; không dùng dấu tiếng Việt, khoảng trắng hoặc ký tự đặc biệt.
- Nếu `README.md`, `AGENTS.md` hoặc GitHub workflow quy định mẫu tên nhánh bắt buộc khác, phải tuân theo quy định của repository và báo nhóm trưởng cập nhật tài liệu này.

## 9. Thiết lập và chạy backend

Phải đọc hướng dẫn backend trong repository trước khi cài đặt vì tên file dependency, database và biến môi trường có thể thay đổi theo `staging`.

Sau khi môi trường Python đã được tạo, kích hoạt và cài đúng dependency của dự án, các lệnh kiểm tra cơ bản chạy từ thư mục gốc gồm:

```powershell
python backend/manage.py check
```

Chạy migration khi schema đã được duyệt:

```powershell
python backend/manage.py migrate
```

Kiểm tra migration ngoài dự kiến:

```powershell
python backend/manage.py makemigrations --check --dry-run
```

Chạy test:

```powershell
python backend/manage.py test
```

Chạy server nếu cấu hình môi trường đã đầy đủ:

```powershell
python backend/manage.py runserver
```

Không chạy `makemigrations` trước khi schema Hồ sơ và Loại văn bản được duyệt. Không commit migration phát sinh ngoài phạm vi đầu việc.

## 10. Thiết lập, phát triển và chạy frontend

Các lệnh trong phần này dùng để phát triển frontend thuộc phạm vi Nhóm 3 và kiểm tra tích hợp với backend. Không sử dụng quyền này để sửa phần giao diện của nhóm khác.

Từ thư mục gốc:

```powershell
cd frontend
```

Kiểm tra Node.js và npm:

```powershell
node --version
npm.cmd --version
```

Trên máy Windows bị Application Control chặn `pnpm.exe`, sử dụng pnpm thông qua npm thay vì tắt Windows Security:

```powershell
npm.cmd exec --yes --package=pnpm@10 -- pnpm --version
```

Cài dependency đúng theo lockfile:

```powershell
npm.cmd exec --yes --package=pnpm@10 -- pnpm install --frozen-lockfile
```

Chạy frontend:

```powershell
npm.cmd exec --yes --package=pnpm@10 -- pnpm dev
```

Mở địa chỉ Vite hiển thị trong terminal, thông thường là:

```text
http://localhost:5173/
```

Dừng server bằng `Ctrl+C`. Nếu PowerShell hỏi:

```text
Terminate batch job (Y/N)?
```

nhập `Y` rồi nhấn Enter.

Kiểm tra frontend:

```powershell
npm.cmd exec --yes --package=pnpm@10 -- pnpm test
npm.cmd exec --yes --package=pnpm@10 -- pnpm lint
npm.cmd exec --yes --package=pnpm@10 -- pnpm build
```

Mọi thay đổi frontend của Nhóm 3 phải đáp ứng:

- Chỉ sửa màn hình, route, component, service, type và style thuộc phạm vi đã giao.
- Không sao chép hoặc thay thế layout chung khi chưa được thống nhất.
- Không hardcode URL API, token, tài khoản hoặc dữ liệu thật.
- Dùng API client, design token, component dùng chung và quy ước i18n hiện có của dự án.
- Có đầy đủ trạng thái loading, empty, validation, forbidden và server error theo contract.
- Không tự ý đổi dependency hoặc lockfile chỉ để giải quyết lỗi cục bộ.
- Chạy `test`, `lint` và `build` trước khi yêu cầu review.

Sau khi cài hoặc chạy, kiểm tra repository không có file ngoài ý muốn:

```powershell
git status --short
```

Không commit `node_modules/` hoặc `dist/`. Không sửa `pnpm-lock.yaml` nếu đầu việc không thay đổi dependency.

## 11. Quy trình làm việc hằng ngày

Thành viên thực hiện theo thứ tự:

1. Xác nhận đang ở đúng repository.
2. Chạy `git status` và xác nhận trạng thái hiện tại.
3. Cập nhật `3_dossiers_documents` bằng `fetch` và `pull --ff-only`.
4. Chuyển sang feature branch của đầu việc.
5. Nếu feature branch cần cập nhật code mới từ nhánh nhóm, trao đổi với nhóm trưởng trước khi merge để tránh conflict.
6. Chỉ sửa file thuộc phạm vi được giao.
7. Chạy kiểm tra liên quan sau mỗi thay đổi quan trọng; nếu sửa frontend phải chạy `test`, `lint` và `build`.
8. Xem diff trước khi stage.
9. Stage đúng file, commit rõ nghĩa và push feature branch.
10. Mở Pull Request vào `3_dossiers_documents`.
11. Xử lý review và chạy lại kiểm tra trên commit cuối.

## 12. Kiểm tra thay đổi trước khi commit

Xem trạng thái:

```powershell
git status
```

Xem nội dung đã thay đổi nhưng chưa stage:

```powershell
git diff
```

Stage từng file cụ thể:

```powershell
git add backend/apps/records/<ten-file>
git add docs/module/team_3/<ten-file>
```

Xem nội dung chuẩn bị commit:

```powershell
git diff --staged
```

Nếu thấy `.env`, token, dữ liệu thật, file build, file cache hoặc file ngoài phạm vi, phải bỏ file đó khỏi stage trước khi commit:

```powershell
git restore --staged <duong-dan-file>
```

Lệnh trên chỉ bỏ file khỏi vùng stage, không xóa nội dung đang chỉnh sửa.

## 13. Quy ước commit

Sử dụng Conventional Commits:

```text
feat(records): add dossier list endpoint
fix(records): prevent deleting the system dossier
test(records): cover dossier permission errors
docs(records): document dossier API contract
refactor(records): extract reusable dossier queryset
```

Quy tắc commit:

- Mỗi commit giải quyết một thay đổi logic rõ ràng.
- Nội dung commit phải mô tả điều đã làm, không dùng `update`, `done`, `fix code` hoặc `code mới`.
- Không trộn format toàn dự án với thay đổi chức năng.
- Không commit code chưa chạy được chỉ để chuyển máy, trừ khi nhóm trưởng đồng ý và commit được đánh dấu rõ.
- Không sửa hoặc squash commit của người khác khi chưa được phép.

Tạo commit:

```powershell
git commit -m "feat(records): add dossier list endpoint"
```

## 14. Push feature branch

Kiểm tra nhánh hiện tại:

```powershell
git branch --show-current
```

Chỉ push feature branch của mình:

```powershell
git push -u origin <ten-feature-branch>
```

Ví dụ:

```powershell
git push -u origin feat/records-list-api
```

Không dùng lệnh push nếu nhánh hiện tại là `main`, `staging` hoặc nhánh nhóm khác.

## 15. Tạo Pull Request nội bộ

Khi tạo Pull Request, kiểm tra chính xác:

```text
base:    3_dossiers_documents
compare: <feature-branch-cua-thanh-vien>
```

Pull Request cần có:

### Objective

Mục tiêu cụ thể của thay đổi.

### Changes

- Những file hoặc khu vực đã thay đổi.
- Business rule đã triển khai.
- Migration hoặc dependency mới nếu có.

### Verification

- Lệnh đã chạy.
- Kết quả test, lint hoặc build.
- Bằng chứng kiểm tra API nếu có.
- Với frontend, nêu route hoặc luồng đã kiểm tra và các trạng thái loading, empty, validation, forbidden, server error có liên quan.

### Risks and notes

- Điểm còn chờ xác nhận.
- Ảnh hưởng đến nhóm khác.
- Migration, permission hoặc compatibility cần reviewer chú ý.

Không ghi chung chung `đã test` hoặc `chạy được`. Phải ghi rõ lệnh và kết quả.

## 16. Quy trình review và merge

- Tác giả tự review diff trước khi yêu cầu người khác review.
- Reviewer kiểm tra phạm vi, logic, quyền, test, migration, bảo mật và file ngoài ý muốn.
- Tác giả xử lý từng comment và thông báo phần đã sửa.
- Sau khi sửa, chạy lại kiểm tra trên commit mới nhất.
- Không merge khi Pull Request còn conflict hoặc check thất bại.
- Nhóm trưởng quyết định thứ tự merge để giảm conflict.
- Sau khi merge, tác giả cập nhật trạng thái đầu việc theo trạng thái thực tế trên GitHub.
- `Code complete` trên máy cá nhân không đồng nghĩa với `Done`; đầu việc chỉ hoàn thành khi đã được review, merge và kiểm tra trên nhánh nhóm.

## 17. Tích hợp vào staging

Chỉ nhóm trưởng hoặc người được ủy quyền thực hiện bước này.

Khi Nhóm 3 đã hoàn thành, nhóm trưởng mới tạo Pull Request:

```text
base:    staging
compare: 3_dossiers_documents
```

Không mở Pull Request vào `main`. Không tự merge vào `staging` nếu workflow yêu cầu PM, DevOps hoặc reviewer khác duyệt.

Trước khi đề nghị tích hợp:

- Nhánh nhóm đã cập nhật theo quy trình chung.
- Working tree sạch.
- Không còn conflict.
- Backend check pass.
- Test module và test bắt buộc pass.
- Nếu có thay đổi frontend: frontend test, lint và build đều pass.
- Tài liệu khớp code ở commit cuối.
- Pull Request có Objective, Changes và Verification.
- Không có file của nhóm khác bị sửa ngoài kế hoạch.

## 18. File không được commit

Danh sách điển hình:

```text
.env
.env.local
node_modules/
frontend/dist/
__pycache__/
*.pyc
.venv/
venv/
*.sqlite3
coverage/
*.log
```

Phải tuân theo `.gitignore` của repository. Không tự xóa file đã được dự án quản lý chỉ vì tên giống danh sách trên; nếu có khác biệt, hỏi nhóm trưởng.

## 19. Xử lý conflict an toàn

Khi Git báo conflict:

1. Dừng sửa các file khác.
2. Chạy `git status` để xác định file conflict.
3. Báo tác giả hoặc người phụ trách file.
4. Đọc cả hai phía của conflict.
5. Giữ đúng business rule và cấu trúc hiện tại, không chọn toàn bộ một phía theo thói quen.
6. Xóa đầy đủ marker conflict sau khi thống nhất:

```text
CONFLICT START: <<<<<<< Current Change
CONFLICT SEPARATOR: =======
CONFLICT END: >>>>>>> Incoming Change
```

7. Stage đúng file đã giải quyết.
8. Chạy lại check và test liên quan.
9. Hoàn tất merge theo hướng dẫn của Git.

Nếu không chắc chắn, không tiếp tục commit. Gửi `git status` và nội dung conflict cho nhóm trưởng.

## 20. Một số tình huống thường gặp

### 20.1. Terminal chỉ trở lại dòng `PS ...>`

Nhiều lệnh Git hoặc lint không in gì khi thành công. Việc terminal trở lại prompt mà không có lỗi thường có nghĩa là lệnh đã hoàn tất. Kiểm tra thêm bằng:

```powershell
$LASTEXITCODE
```

Giá trị `0` thường là thành công.

### 20.2. Git báo `Committer identity unknown`

Thiết lập identity riêng cho repository:

```powershell
git config --local user.name "<github-username>"
git config --local user.email "<github-noreply-email>"
```

Sau đó chạy lại lệnh commit. Không dùng danh tính của thành viên khác.

### 20.3. PowerShell hiển thị dấu `>>`

Dấu `>>` thường có nghĩa là câu lệnh chưa kết thúc, ví dụ thiếu dấu nháy. Nhấn `Ctrl+C`, kiểm tra lại câu lệnh rồi nhập lại từ đầu.

### 20.4. `pnpm.exe` bị Windows Application Control chặn

Không tắt Windows Security. Dùng:

```powershell
npm.cmd exec --yes --package=pnpm@10 -- pnpm <lenh>
```

Ví dụ:

```powershell
npm.cmd exec --yes --package=pnpm@10 -- pnpm lint
```

### 20.5. GitHub vẫn chưa hiển thị code mới

Kiểm tra:

```powershell
git branch --show-current
git status
git log -1 --oneline
```

Sau đó xác nhận đã push đúng feature branch. Trên GitHub, chọn đúng branch trong branch selector và tải lại trang.

### 20.6. Lỡ sửa code trên sai nhánh

Không commit, không push và không dùng `reset --hard`. Chạy:

```powershell
git status
git branch --show-current
```

Sau đó gửi kết quả cho nhóm trưởng để chọn cách chuyển thay đổi an toàn.

### 20.7. Pull Request đang nhắm vào `staging` hoặc `main`

Không bấm Create Pull Request hoặc Merge. Đổi base về `3_dossiers_documents` đối với PR nội bộ. Nếu không đổi được, đóng bản nháp và tạo lại đúng nhánh.

## 21. Checklist trước khi bắt đầu code

- [ ] Tôi có quyền truy cập repository.
- [ ] Tôi đã đọc `README.md`, `AGENTS.md` và tài liệu liên quan.
- [ ] Tôi đang ở đúng repository.
- [ ] Tôi đã fetch dữ liệu mới từ `origin`.
- [ ] Nhánh `3_dossiers_documents` đã được cập nhật.
- [ ] Tôi đã tạo feature branch riêng cho đầu việc.
- [ ] Đầu việc có phạm vi và người review rõ ràng.
- [ ] Tôi biết file nào được phép sửa.
- [ ] Nếu làm frontend, tôi đã xác nhận màn hình/component thuộc phạm vi Nhóm 3 và không chồng lấn nhóm khác.
- [ ] Tôi đã chốt dependency với thành viên hoặc nhóm liên quan.
- [ ] Tôi không đưa secret hoặc dữ liệu thật vào code.

## 22. Checklist trước khi commit

- [ ] Tôi đã chạy `git status`.
- [ ] Tôi đã đọc `git diff`.
- [ ] Tôi chỉ stage file thuộc đầu việc.
- [ ] Tôi đã đọc `git diff --staged`.
- [ ] Không có `.env`, token, secret hoặc dữ liệu thật.
- [ ] Không có `node_modules`, `dist`, cache hoặc file log.
- [ ] Không có thay đổi vô tình trong file của nhóm khác.
- [ ] Check và test liên quan đã chạy.
- [ ] Nếu sửa frontend, `test`, `lint` và `build` đều pass.
- [ ] Commit message đúng quy ước.

## 23. Checklist trước khi mở Pull Request

- [ ] Feature branch đã được push lên GitHub.
- [ ] Base là `3_dossiers_documents`.
- [ ] Compare là feature branch của tôi.
- [ ] Pull Request chỉ có một mục tiêu chính.
- [ ] Objective và Changes được mô tả rõ.
- [ ] Verification ghi đúng lệnh và kết quả.
- [ ] Không còn conflict.
- [ ] Tài liệu đã cập nhật nếu API, schema hoặc hành vi thay đổi.
- [ ] Reviewer phù hợp đã được gán.

## 24. Checklist của nhóm trưởng trước PR vào staging

- [ ] Các Pull Request nội bộ cần thiết đã được review và merge.
- [ ] Nhánh `3_dossiers_documents` đang sạch và đồng bộ.
- [ ] Không có thay đổi ngoài phạm vi Nhóm 3.
- [ ] Migration đã được đọc và kiểm tra.
- [ ] Backend check pass.
- [ ] Test bắt buộc pass trên commit cuối.
- [ ] Nếu có frontend, test, lint và build pass trên commit cuối.
- [ ] Frontend chỉ thay đổi khu vực thuộc Nhóm 3 hoặc file dùng chung đã được thống nhất.
- [ ] Tài liệu API và bàn giao khớp code.
- [ ] PR có bằng chứng kiểm tra cụ thể.
- [ ] Base là `staging`, không phải `main`.
- [ ] Reviewer theo workflow đã được gán.

## 25. Nguyên tắc liên hệ khi có sự cố

Phải báo nhóm trưởng trước khi tiếp tục nếu gặp một trong các trường hợp:

- Không chắc đang ở đúng nhánh.
- Có file thay đổi không phải do mình tạo.
- Pull hoặc merge xuất hiện conflict.
- Migration thay đổi ngoài dự kiến.
- Test chung thất bại nhưng test cá nhân vẫn pass.
- Cần sửa file của nhóm khác.
- Cần sửa `docs/common/`.
- Cần thay đổi dependency hoặc lockfile.
- Cần thay đổi schema, permission hoặc API contract đã thống nhất.
- Đã lỡ commit hoặc push thông tin bí mật.
- Git yêu cầu force push, reset hoặc thao tác có nguy cơ mất dữ liệu.

Khi báo lỗi, gửi kèm:

```powershell
git branch --show-current
git status
git log -3 --oneline --decorate
```

Không gửi token, mật khẩu hoặc toàn bộ nội dung `.env` trong ảnh chụp hoặc tin nhắn.

## 26. Nguyên tắc cuối cùng

1. Kiểm tra nhánh trước khi sửa.
2. Mỗi đầu việc dùng một feature branch.
3. Mỗi Pull Request nội bộ nhắm vào `3_dossiers_documents`.
4. Chỉ nhóm trưởng đề nghị tích hợp vào `staging`.
5. Không push vào `main`.
6. Không dùng lệnh phá hủy hoặc force push khi chưa được phép.
7. Không commit secret, dữ liệu thật hoặc file sinh tự động.
8. Chỉ sửa file trong phạm vi được giao; frontend của Nhóm 3 không được lấn sang phần của nhóm khác.
9. Chạy kiểm tra và ghi bằng chứng trước khi yêu cầu review.
10. Khi không chắc chắn, dừng lại và hỏi; không thử lệnh Git ngẫu nhiên.

---

Tài liệu này phải được cập nhật khi giảng viên, PM hoặc nhóm trưởng thay đổi phạm vi, cấu trúc thư mục, quy trình branch, công cụ hoặc yêu cầu kiểm tra chất lượng.
