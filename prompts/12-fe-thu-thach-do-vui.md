# 12 — Cây táo và4 minigame cùng quiz engine

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

Bước06 và bước03 đủ câu hỏi/game.

## Công việc

Tạo GameEngine hook state idle/loading/question/submitting/feedback/completed/error.
Mỗi vòng5 exerciseId khác nhau server cấp; options sanitized, answer không tồn tại
FE bundle/API learner. Không browser randomCorrect hoặc hardcoded data-correct.
Điểm/hạt chỉ response BE. Sai động viên, retrymax3, first-try reward policy giữ nguyên.

5 renderer: apple-quiz(identify-letter): chọn quả chữ; butterfly-rime(match-rime):
chọn bướm vần; frog-word(listen-word): lá sen từ; tone-maze(select-tone): chọn dấu
trên đường; forest-sounds(listen-animal): nghe âm và chọn tên/chữ. Maze MVP dạng node
choices, không cần game engine physics. Touch/keyboard đều dùng buttons.

Chỉ đánh dấu responseMode audio khi audio thật đã phát; thiếu audio/TTS dùng text
assisted prompt có nhãn, không đưa vào metric nghe. Chuyển route/đóng tab pause
session, pending request double click disabled+idempotency; refresh có resume state.
Nhiệm vụ ngày và rương dùng missions endpoint, không claim all bằng local flag.
Bỏ countdown áp lực/điểm trừ. LuckyWheel hidden đến bước17.

## Tiêu chí đạt

5 game CTA mở game thật với5 câu/vòng, không lặp ID. Error retry/duplicate click
không cấp thêm. Feedback đúng/sai dựa BE, sau vòng report cập nhật. Missing audio
không pretending listen; options mobile đủ56px và reduce motion được hỗ trợ.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
