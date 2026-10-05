# 04 — Đăng nhập thật, parent gate và ownership

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

Bước03 có data; models/indexes sẵn sàng.

## Công việc

Thực hiện Auth/Family API trong docs/04. Session cookie HttpOnly, SameSite phù hợp,
Secure production, Mongo store, session regeneration chống fixation. GET csrf tạo
token, mọi mutation kiểm tra X-CSRF-Token và Origin, cả register/login/logout.
Session authVersion kiểm tra server để revoke sessions khi đổi password/logout-all.

Register validate parent/email/password/PIN/child/consent. Hash password và PIN;
transaction user+child đầu+wallet50+welcome ledger; rollback khi trùng email.
Tạo child thêm không nhận50. Login email/password với rate-limit, TTL12h hoặc7days,
không fake reset password/SĐT/OAuth. Return DTO tối giản, không hash.

AUTH family-profiles chỉ trả nickname/mascot/age; enter-child xác nhận parent owner,
verify symbol PIN nếu đã setup, mode child giới hạn currentChildId. Không public
endpoint liệt kê trẻ. Parent gate PIN4 số hash, max5 sai/15phút lockout15phút và
rate-limit theo user+IP; TTL10phút. Khi gate mở trở parent mode; gate đóng/expired
API parent403. Password/PIN change xác thực current credentials, revoke gate.

Middleware requireAuth, requireChild, requireParentGate, requireAdmin, requireChild
Ownership theo query scoped. Child không tự set role/parentId/settings qua body.
Parent chỉ CRUD/export/delete con của mình. Xóa có cleanup state/pending theo docs/03.
Admin provisioning separate; admin quản trị nội dung không quyền đọc mọi trẻ.

## Tiêu chí đạt

Supertest với Mongo replica set: register transaction, duplicate email rollback,
CSRF thiếu/sai403, login sai401, userA đọc conB403/404, child parent API403, PIN
lockout, expired gate, session fixation và logout/password revocation đều được kiểm tra.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
