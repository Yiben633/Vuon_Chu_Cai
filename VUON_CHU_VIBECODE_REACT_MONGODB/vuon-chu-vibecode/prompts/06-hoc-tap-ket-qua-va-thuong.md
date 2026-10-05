# 06 — Engine học, tiến độ và ví hạt dẻ

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

Bước05 content API và step03 exercises đủ.

## Công việc

Triển khai Learning/Progress/Reward/Reports API docs/04, rules docs/02–03. Session
cấp question snapshots private/versioned; currentChildId lấy từ server. Start
kiểm tra tuổi/limits và one-active-session index; idle expiry >5min. Answer chỉ
optionId do learner gửi, server validate question/attemptNo (max3), compute correct.

Submit transaction attempts+progress+dailyStats+rewardLedger+wallet. Request key
hash canonical, duplicate retry cùng payload trả previous result, khác payload409.
Business eventKey chống farm khi đổi request key. Quiz+5 đúng first try, once per
exercise/version/day, cap50/day; welcome50 once; story15 once/story/version;
mission10 khi server đủ điều kiện. Sai không trừ, retry không thưởng. Redeem
conditional balance update+ledger+inventory cùng transaction, never negative.

Mastery ít nhất2 identify exercises khác nhau đúng first try; nghe/xem không
mastered. Story ack scene đúng thứ tự và answer kết thúc; complete sớm409.
Reports first-try recognitionAccuracy/null khi no data, mastered/seen riêng,
streak dựa dayKey VN. Level dựa mastered count, không balance. Recommendations
nhận diện chữ, không diagnosis hoặc speech percent.

Heartbeat seq monotonic15s, server elapsed capped15, gap>30s không cộng offline,
pause/hidden không tính; local day split nếu delta qua0h, active session+dailyStats
transaction. Daily limit BE enforce start/answers; break overlay policy gửi FE.
Mission progress BE đo thực tế; childBadges unique. Xây chức năng rebuild aggregates.

## Tiêu chí đạt

Integration tests kiểm tra parallel answers/idempotency, concurrent redeems,
ledger invariant, welcome once, quiz cap, mastery evidence, story early complete,
heartbeat duplicate/offline/midnight, daily limit và reports không có data giả.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
