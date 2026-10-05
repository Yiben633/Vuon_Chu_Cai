# 09 — Khu vườn29 chữ và học chi tiết

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

Bước06–08 đạt.

## Công việc

Dùng screenshot _1 làm bố cục chính, _2 tham khảo compact. Build lời chào Sóc,
suggested letter, đường progress, ambience opt-in, grid29, filter all/vowel/consonant/
completed và game cards. Data letters/progress query separate theo child. Guest
xem published letters ở chế độ thử; không dùng số18/29/128 hardcoded.

Letter card glyph lớn, tên chữ và ví dụ đúng; A có thể target trong cá nhưng highlight
base a+tone rõ. Chữ Ă/Â/Ơ/Ư hiển thị dấu đầy đủ, không xem tone là chữ riêng. Detail
route đọc symbol encoded, show image fallback nhất quán/teachingNote và sample audio
availability. Title examples lấy corrected seed, không lấy Con Ong cho A từ HTML.

Vào học child: start session alphabet/lesson, câu nhận diện do BE cấp, submit answer,
progress và wallet invalidate sau response. Mastered chỉ BE tính; nghe/view chỉ seen.
Audio click không mở mic. Đường mòn milestone dựa progress29, no fake energy78/100;
nếu muốn năng lượng chỉ dùng remaining study time có nhãn rõ.

## Tiêu chí đạt

29/12/17 lọc đúng, completed filter theo BE. Refresh giữ progress DB, guest không
có reward. Unicode routes/body hiển thị đúng; failed answer request không tăng ví.
Mastery có evidence2 bài, không đổi bằng click audio; mobile tiles đủ lớn.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
