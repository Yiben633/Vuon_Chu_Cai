# 13 — Báo cáo MongoDB và nhắc nghỉ

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

Bước06+08; parent gate test đạt.

## Công việc

Build ParentLayout/sidebar tabs overview/recognition/lessons/time/safety/resources/
inbox. Child picker theo parent ownership. KPI letters mastered/seen, distinct
vocab practiced, active today/daily limit, streak, recognition accuracy; no speech
percentage. Accuracy null→Chưa có dữ liệu. Date range UTC API +dayKey VN, labels dễ đọc.
Chart nếu dùng Recharts chỉ parent; table alternative có số thực, không random.

GrowthTree theo mastery docs/02, recommendations lỗi nhận diện/âm thanh có bằng
chứng; không “bé ngọng” hoặc “chuẩn92%”. Attempt history pagination và same child
query key; đổi child không flash báo cáo con khác. Loading/error/empty/request403 xử
lý đúng, gate expired xóa private caches.

Settings daily limit/break block/volume/dialect parent-only qua API; validation và
confirm lưu. BreakOverlay toàn child area tính active visibility+interaction,
heartbeat seq15s; hidden/pause/offline không đếm tiếp. Server enforcement dù child
ẩn overlay. Đến break pause audio/learning, nghỉ20s tối thiểu, full daily limit cần
parent thay cấu hình. Dùng fake timers tests, không sleep20phút để test.

Resources missing disabled; export JSON/xóa profile đúng API. Delete pending hiển
thị trạng thái thật. “Chia sẻ kết quả” MVP export local/print nếu có, không tạo
public child link hoặc gửi tin ngoài khi chưa có triển khai.

## Tiêu chí đạt

Parent reports đổi theo attempts/time Mongo; no data null; gate expiry+ownership
đạt. Time hidden/gap/seq repeat không cộng; break/day limit enforce API. Settings
persist refresh; child can't edit; delete/export không lộ password/PIN/token.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
