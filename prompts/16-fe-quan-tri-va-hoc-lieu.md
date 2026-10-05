# 16 — Admin UI và vòng duyệt nội dung

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

Bước05 APIs admin + layout07 và gate04.

## Công việc

Tạo AdminDashboard content counts thật, navigation registry, list/search/status/
pagination, editor riêng cho letters/vocab/spelling/exercises/stories/resources và
catalog rewards/badges/missions. Không chung một textarea JSON duy nhất cho mọi thứ;
advanced JSON import chỉ phụ trợ có schema validation+preview.

Exercise editor type/options/correctAnswer/targetLetter, preview learner không answer.
Story editor scenes/word refs/hotspot coordinates/ending question, index uniqueness.
Spelling editor valid onset/rime/tone word mapping, NFC. Assets upload verification
server và file availability, không tin remote URL tùy ý. Worksheet missing không
button download/publish giả.

Review needs_review→approved có người admin xác nhận nội dung, update published tạo
version mới, archive có confirm. Hiển thị review/assets/version errors bằng tiếng
Việt. Lưu audit content actor/time có thể collection riêng nếu cần, không ghi PII.
Học liệu PDF: cần file thật sẵn sàng tải; chưa có PDF trong ZIP nên form hỗ trợ bổ
sung upload, không pretend đã có29/60/150 pages. Nếu yêu cầu tạo PDF riêng sau này,
đó là deliverable mới cần generator/font/visual QA, không sao chép nền screenshot.

Admin không mở toàn bộ hồ sơ trẻ. Export/import seed chỉ content namespace có
preview/conflicts; không xóa user/progress. Docs hướng dẫn provisioning admin qua env.

## Tiêu chí đạt

Admin CRUD→review→publish→learner thấy đúng→archive không phá active snapshot.
Parent thường/child API+UI admin denied. Answer private không leak preview.
Missing resource không publish. Import rerun không reset cá nhân, version conflict rõ.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
