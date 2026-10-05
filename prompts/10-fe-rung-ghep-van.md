# 10 — Bàn ghép vần bằng React state

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

Bước09 và spelling content API sẵn.

## Công việc

Build SpellingBoard với onset/rime/tone slots, token cards, pronunciation button,
quick quiz và vocabulary cards theo screenshot. Kéo thả pointer/touch có bấm chọn
và keyboard alternative; state React, không window functions/querySelector HTML.
Reset từng slot/cả bàn, selected states, route data deep-link nếu phù hợp.

Lookup data API cho allowed combination: C+A+sac→CÁ, B+A+huyen→BÀ, M+E+nang→MẸ.
Ngang=không dấu; spelling word lấy data canonical NFC. Không ghép bằng append marker;
invalid combination lời nhắc nhẹ và không bịa word. Onset/rime choices lọc để phù
hợp từ dataset, q dùng qu, gh/ngh chỉ trong tổ hợp đã có.

Vocab meaning/word xuất từ Mongo; thơ4chữ trong HTML chỉ copy khi đã rà nội dung,
nếu chưa có thì không giả kho thơ lớn. Quick quiz mở learning session spelling,
submit options tới server; ghép đúng ở client không tự cộng hạt/mở tree milestone.
Dialect selector đổi profile qua parent settings hoặc lựa chọn nghe tạm thời hợp
lệ; thiếu audio miền đó hiện unavailable/fallback device rõ.

## Tiêu chí đạt

Unit Unicode+lookup tests đúng CÁ/BÀ/MẸ, invalid combination, ngang. Mouse/touch/
keyboard chơi được. Reward/progress theo API; offline không báo ghép task đã lưu.
Không kéo token gây scroll ngang hoặc cắt thanh dấu; thiếu audio xử lý minh bạch.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
