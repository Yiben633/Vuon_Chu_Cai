# 01 — Khởi tạo ReactJS và Express

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

Bước00 đã chốt kiến trúc.

## Công việc

Tạo npm-workspaces với apps/web, apps/api, packages/contracts. Nếu có skeleton,
bổ sung thay vì tạo đè. FE dùng Vite React JavaScript, React Router, Tailwind bằng
@tailwindcss/vite, Axios, TanStack Query, Zustand, React Hook Form và Zod. BE dùng
Express, Mongoose, express-session/connect-mongo, bcrypt hoặc thư viện hash phù hợp,
Helmet, rate limiter, validation Zod, logging redact và dotenv/env validation.
Dùng ESM nhất quán; chọn bản package ổn định tương thích runtime, commit lockfile.
Không chép cấu hình Tailwind CDN hoặc class strings động khó build từ HTML.

Thiết lập Vite proxy /api đến localhost4000, web5173. Tạo health/live và health/ready;
readiness phân biệt DB lỗi/topology không transaction. Error middleware, requestId,
404 API, graceful shutdown, không startup thành công giả khi DB chưa kết nối.
Tạo env templates theo starter; .gitignore chứa .env, node_modules, private-media,
coverage và build output. Không ghi secret thật vào .env.example.

Root scripts dev/build/lint/test/db:indexes/db:seed/test:e2e có workspace routing rõ;
chưa có implementation script thì trả lỗi giải thích, không echo PASS giả. Tạo
packages/contracts enums/validators/errorCodes và README cách chạy Windows PowerShell.
Nếu dùng Docker cho DB, cấu hình replica set init+healthcheck, không standalone;
Docker là tùy chọn, Atlas vẫn được hỗ trợ. Ghi exact package/runtime đã chọn.

## Tiêu chí đạt

npm install và web build/lint chạy được; API liveness200, readiness503 khi DB mất.
Web không lộ Mongo URI/session secret. README có terminal chạy FE/BE và setup DB.
Kiểm tra tồn tại lockfile, env allowlist và scripts dùng đúng workspace.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
