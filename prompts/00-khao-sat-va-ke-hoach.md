# 00 — Đọc nguồn và lập kế hoạch

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

Không cần bước trước.

## Công việc

Đọc toàn bộ docs/01–07, README.md, data/seed-manifest.json, assets/manifest.json,
PRD và DESIGN trong reference. Kiểm kê các HTML/screenshot đúng mapping. Nếu có
code trong workspace, đọc package.json và cấu trúc hiện có trước khi quyết định
scaffold; không xóa hoặc ghi đè dự án của người dùng.

Chốt 8 màn hình theo nguồn, các trang chi tiết và admin bổ sung. Dùng JavaScript/JSX
cho ReactJS và JavaScript ESM cho Express; MongoDB/Mongoose làm dữ liệu. Không chuyển
Next.js/SQL/Firebase. Viết docs/IMPLEMENTATION-PLAN.md theo P0/P1/P2 và docs/DECISIONS.md.
Liệt kê API modules, models, ownership, PIN gate, transaction, Unicode, assets còn thiếu.
Chốt phiên server bằng express-session/connect-mongo, không thêm JWT song song.

Ghi rõ AI phát âm, audio 3 miền, PDF, OAuth/QR chưa có dữ liệu/dịch vụ; không coi nút
demo là tính năng hoạt động. Chọn DB có transaction, kiểm tra Node version yêu cầu.
Bước này chỉ khảo sát/lập kế hoạch, chưa xây toàn bộ app. Tạo dòng tiến độ từng bước.

## Tiêu chí đạt

Kế hoạch có frontend/backend/data và mọi bước 01–19; 17 optional. Có danh sách
mâu thuẫn PRD/design và quyết định giải quyết. Không thiếu child ownership, CSRF,
chống duplicate rewards. Tài liệu không tuyên bố đã chạy ứng dụng.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
