# 11 — Truyện tương tác và từ mới

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

Bước06+07 và story seed/API đạt.

## Công việc

Build library filters category/age, featured story, StoryPlayer scene-based,
subtitles, hotspots, vocabulary panel, moral và roleplay UI. Dùng2 truyện seed tự
viết, không fake16 truyện/lượt nghe/duration cụ thể không có file. Scene image thiếu
thì fallback card/illustration có nhãn, no broken remote assets.

Next scene gửi ack server, parent/child scope correct; chỉ complete sau all scene
acks+ending question. Pause/resume learning session và player cùng nhau. Âm thanh
thực hiện step15; trước đó read-text mode hoạt động đầy đủ và không playback timer
chạy giả. Hotspot dùng buttons positioned x/y và list alternative accessible.

Progress/order từ BE, reward15 once version; làm lại không farm. Guest sample
không ghi kết quả. Vai kể truyện cho preview lời thoại, recording component bước15
chưa xong thì disabled với lý do, không animation tự báo đã ghi. Fullscreen optional
qua browser API, fallback khi unavailable. Browser back/unmount stop player.

## Tiêu chí đạt

Filter/story routes/data thật; ack ngoài story/skip scene server reject.
Complete sớm không thưởng, retry complete không thưởng2 lần. Subtitles/hotspot
keyboard hoạt động; read-only không giả âm thanh. Word meanings phù hợp scene.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
