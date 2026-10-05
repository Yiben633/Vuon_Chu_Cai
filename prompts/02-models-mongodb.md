# 02 — Tạo models, indexes và migrations

Bạn là AI coding thực thi dự án Vườn Chữ Diệu Kỳ trong workspace VS Code.
Đọc README.md, docs/02-KIEN-TRUC-VA-PHAM-VI.md, docs/03-DU-LIEU-MONGODB.md,
docs/04-HOP-DONG-API.md, docs/05-THIET-KE-VA-TAI-NGUYEN.md và docs/PROGRESS.md.
Khi liên quan nội dung/seed/test, đọc thêm docs/01,06,07. Nếu repo có AGENTS.md,
đọc và áp dụng. Đọc file hiện tại trước khi sửa, không xóa công việc đã có.

Stack cố định: ReactJS + Vite + JavaScript/JSX; Node.js/Express ESM; MongoDB/Mongoose.
Viết mã trực tiếp, đầy đủ imports/config/routes, không chỉ trả pseudocode hay hướng dẫn.
Giữ phong cách thiên nhiên theo screenshot, không tạo số liệu/URL/audio/PDF/AI giả.
Backend là authority cho auth/ownership/PIN/score/progress/rewards/time limits.
Không lưu secret ở frontend; không seed reset dữ liệu cá nhân; không tự publish.
Nếu phải chọn chi tiết nhỏ, quyết định hợp lý và ghi docs/DECISIONS.md; thiếu quyền/
credential/môi trường thật thì báo blocker cụ thể, tiếp tục phần độc lập còn làm được.

## Điều kiện trước

Bước01 hoàn thành; có MONGODB_URI test/dev hợp lệ.

## Công việc

Triển khai schemas theo docs/03. Tạo model tài khoản, học liệu, phiên học, attempts,
progress, dailyStats, wallet, rewardLedger, inventory, missions/badges/claims;
recordings schema có thể tạo trước nhưng feature disabled. speechAttempts optional17.
Viết registry model explicit, repository/service conventions, schema strict,
timestamps, enum/ranges, validators nested và select:false cho hashes/answer.

Keys seed có unique key; relation runtime ObjectId; content version tăng khi sửa
published, snapshot private bảo vệ câu hỏi đang học. Viết helper NFC và email
normalization giữ dấu tiếng Việt. Phân biệt12 nguyên âm17 phụ âm, không thêm F/J/W/Z.
Mongoose unique là index: cần migration tạo actual unique indexes và mapping E11000.

Tạo db:indexes có dry-run/report; không drop/reset database hay auto syncIndexes
làm mất index production. Kiểm tra topology và transaction bằng transaction probe
trên DB test. Thiết kế partial unique active session/child và job expire idle.
Recordings objectKey private; không lưu binary/base64 trong Mongo. Không dùng TTL
xóa session học/statistics cần cho báo cáo; TTL chỉ session auth/lockout phù hợp.

## Tiêu chí đạt

Trên DB test, duplicate email, duplicate ledger child+event, duplicate active
session và duplicate inventory đều bị chặn bằng actual indexes. Model validation
reject ageBand/dialect/ranges sai; projection không trả hash. Migration rerun an toàn.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
