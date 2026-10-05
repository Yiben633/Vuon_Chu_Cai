# 18 — Kiểm tra toàn bộ FE–BE–MongoDB

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

Bước01–16;17 có thể SKIPPED.

## Công việc

Đọc docs/06 và PROGRESS, rà actual implementation không dựa báo cáo bước trước.
Chạy lint/build/unit/integration/e2e phù hợp. Mongo test replica set riêng; kiểm tra
DB name không production; indexes sẵn sàng trước concurrency tests. Luồng chính
phải FE→Express→Mongo thật, mocks chỉ fault injection/external service.

Kiểm tra register rollback, child ownership, CSRF/PIN expiry, published content,
Unicode/12-17/6thanh, question no answer leak, mastery evidence, retry/simultaneous
rewards, inventory race, heartbeat hidden/seq/midnight, parent reports null, cleanup.
Rà hardcoded số128/92/96.8/120000/45000; chỉ reference được giữ, product không dùng
chưa có bằng chứng. Rà fake success alert/demo JavaScript và buttons dead.

Visual QA screenshot8 main pages + admin/letter detail ở390/768/1440, so layout
reference region-by-region; sửa overflow/cắt dấu/logo/mascot/target56px/focus/modal.
Rà assets remote/broken link/voice privacy/secret exposure; không in secret values.
Seed validate offline và2 lần DB demo giữ progress user. npm audit review actual
finding, không auto --force. Sửa bugs tìm thấy và chạy lại test liên quan.

Tạo docs/QA-REPORT.md có PASS/FAIL/BLOCKED/NOT RUN, exact commands+result, screenshots,
known limitations/flags và docs/HANDOVER.md cách chạy. Không báo toàn bộ pass khi DB
hoặc browser không có. Không biến AI/compliance claims thành kiểm thử đã chứng nhận.

## Tiêu chí đạt

Không còn FAIL trong core acceptance hoặc ghi blocker thật đang ngăn bàn giao;
all routes/button data persisted, security/data concurrency rules đạt. QA-report
nêu rõ test nào chưa chạy và audio/PDF/AI/OAuth còn thiếu. Build output reviewable.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
