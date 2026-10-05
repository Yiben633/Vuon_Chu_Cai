# 19 — Build và chuẩn bị production

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

Bước18 core đạt; chưa tự publish.

## Công việc

Chuẩn bị build React static, Express runtime có Mongo Atlas/replica set, same-origin
reverse proxy /api để cookie+CSRF nhất quán. Chọn topology từ environment thực tế;
không ép backend Express upload vào hosting static. Nếu deployment serverless cần
adapter/connection/session/storage workflow phù hợp và test, không chỉ thêm file
config rồi tuyên bố chạy. Không triển khai public khi chưa có yêu cầu cụ thể.

Tạo Dockerfile hoặc deployment config theo target đã chốt, multi-stage FE build
nếu cần, health/live/ready, graceful shutdown, env secret runtime, HTTPS cookies,
trusted proxy đúng hop, origin allowlist, route fallback SPA không nuốt /api404.
Production ALLOW_UNREVIEWED_DEMO_CONTENT=false; chưa có approved content thì ghi
chưa đủ điều kiện public educational launch, có thể demo local/private có nhãn.

Private recordings cần object storage bền vững và cleanup job; disk tạm thời thì
flag off. Session store Mongo indexes, backup+restore test, migration index/seed
explicit không auto destructive lúc startup. Monitor latency/errors, redact logs,
readiness báo actual DB; upload/request body limit. Public assets local/file registry.

Viết docs/DEPLOYMENT.md với build/run commands, env required (không giá trị secret),
DB network access/user privileges, checks after start, rollback code+data migrations,
known blockers. Cung cấp bản bàn giao cuối: done core, optional skipped, test result,
thiếu media/provider/content review. Nếu sau này user yêu cầu publish, làm đúng quy
trình hosting được chọn và kiểm tra production trước báo thành công.

## Tiêu chí đạt

Production build pass, local production smoke / /vuon-chu /api/v1/health/live và
ready với DB thật; refresh SPA route đúng, API404 JSON. Secure cookie/CSRF flags,
secrets không vào dist; storage unavailable không enable recordings. Có rollback
và handover, không công bố đã deploy khi mới chuẩn bị config.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
