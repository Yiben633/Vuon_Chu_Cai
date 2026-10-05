# 05 — API chữ, vần, truyện và quản trị nội dung

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

Bước04 phân quyền hoạt động.

## Công việc

Triển khai content API docs/04, DTO serialization id, NFC, pagination, q bounded,
filters allowlist. Public/child chỉ nhận published content, áp ageBand theo profile.
Các assets thiếu trả availability rõ. Spelling lookup chỉ trả tổ hợp có trong data;
không nối dấu Unicode tùy tiện. Story DTO có scene/hotspot/vocab, không ending answer.

Exercises không GET public toàn answer. Question DTO được cấp qua học session ở
bước06; admin exercise API được thấy answer. Đảm bảo không leak qua lean/populate,
error details hoặc shared DTO. Query q escape regex và length limit, không nhận
Mongo operator từ input. Route params ObjectId/symbol có validation.

Tạo admin registry explicit13 resource types, Zod schema riêng, draft CRUD, publish
và archive. Nội dung needs_review production không được publish; PDF/audio bắt buộc
file ready+MIME đúng. Published content sửa tạo version mới, không phá snapshot cũ.
Admin upload giới hạn size/type, sanitize SVG hoặc chỉ nhận SVG có nguồn allowlist;
không phục vụ HTML/script upload. Resources missing không tải pretend file.

## Tiêu chí đạt

GET letters trả29/12/17 trong demo approved-mode phù hợp. Draft không lọt public;
public story/exercise response không chứa answer. Parent/child admin403, invalid
ObjectId400, missing PDF404, published version changes không phá references.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
