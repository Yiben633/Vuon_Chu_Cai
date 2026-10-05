# Quyết định kỹ thuật

Ngày cập nhật: 06/10/2026.

| Mã | Quyết định | Lý do |
|---|---|---|
| D-001 | App thật nằm ở root workspace, không nằm trong `VUON_CHU_VIBECODE_REACT_MONGODB/vuon-chu-vibecode`. | Theo yêu cầu người dùng; thư mục kia là nguồn prompt/tài liệu. |
| D-002 | Monorepo dùng npm workspaces với `apps/web`, `apps/api`, `packages/contracts`. | Khớp kiến trúc bước 00. |
| D-003 | FE dùng ReactJS + Vite + JavaScript/JSX, Tailwind qua `@tailwindcss/vite`. | Đúng stack cố định, không dùng Tailwind CDN. |
| D-004 | BE dùng Express ESM + Mongoose + `express-session`/`connect-mongo`. | Server là authority cho auth/session/PIN/progress/rewards. |
| D-005 | Password/PIN hash dùng `bcryptjs` ở bước scaffold. | Tránh native build trong lúc khởi tạo, vẫn dùng bcrypt-compatible hashing. |
| D-006 | API có thể start khi DB mất để trả liveness 200 và readiness 503, nhưng không báo ready giả. | Phù hợp health check và local development. |
| D-007 | `db:indexes`, `db:seed`, `test:e2e` hiện fail có thông báo rõ. | Các bước sau mới triển khai, không echo PASS giả. |
| D-008 | API `dev` dùng `node src/server.js` thay vì `node --watch`. | `node --watch` bị `spawn EPERM` trong sandbox Windows hiện tại; có thể thêm watch lại sau. |
| D-009 | Khi DB chưa ready, API không tạo `connect-mongo` session store. | Tránh process chết khi DB mất; readiness vẫn trả 503 và chưa có endpoint session nghiệp vụ. |
| D-010 | `db:indexes` dùng `createIndexes()` theo registry explicit, không dùng `syncIndexes()` tự động. | Tránh drop index production ngoài ý muốn. |
| D-011 | Docker Mongo local dùng URI `mongodb://localhost:27017/...?...replicaSet=rs0`. | Replica set healthcheck cấu hình member host là `localhost:27017`; `127.0.0.1` khiến driver không chọn được server. |
| D-012 | `recordings` schema được tạo trước nhưng feature vẫn disabled ở env. | Chuẩn bị model/index cho bước 15 mà không bật upload khi chưa có consent/storage. |
| D-013 | Bước 03 mở rộng seed exercises trong importer/service thay vì sửa trực tiếp JSON nguồn. | Giữ manifest/seed gốc làm dữ liệu nguồn kiểm toán được, vẫn đạt yêu cầu 58 identify-letter và ít nhất 5 câu mỗi game type bằng thuật toán deterministic. |
| D-014 | Seed demo `needs_review` cần `ALLOW_UNREVIEWED_DEMO_CONTENT=true` ở nonproduction. | Tránh vô tình publish nội dung kỹ thuật chưa duyệt; production bị chặn nếu còn `needs_review`. |
| D-015 | Auth integration tests yêu cầu `RUN_MONGO_TESTS=true` để chạy với Mongo replica set thật. | Giữ `npm run test` chạy được ở môi trường chưa có DB, nhưng vẫn có lệnh kiểm tra đầy đủ cho bước auth. |
| D-016 | Parent gate dùng session regeneration sau register/login/enter-child/open-gate và `authVersion` để revoke session. | Chống session fixation và vô hiệu hóa session cũ khi đổi mật khẩu/PIN. |

## Ghi chú bước 04

- Session cookie HttpOnly, SameSite Lax, Secure khi production; mutation `/api/v1` bắt `X-CSRF-Token` và Origin hợp lệ.
- Register tạo user + child đầu + wallet 50 + welcome ledger trong transaction; tạo thêm child không nhận welcome 50.
- Parent gate dùng PIN 4 số hash, tối đa 5 lần sai trong cửa sổ 15 phút rồi lock 15 phút; gate TTL lấy từ `PARENT_GATE_TTL_MINUTES`.
- Child mode chỉ giữ `currentChildId`; parent APIs yêu cầu parent mode + gate còn hạn.
- API không triển khai reset password, đăng nhập SĐT, OAuth hay QR ở bước này để tránh UX giả.

## Ghi chú bước 03

- Importer upsert theo `key`, dùng `seedHash` để phát hiện same-version conflict và không drop/reset database.
- Thứ tự import: assets -> letters/tones -> vocabulary -> spellingEntries -> exercises -> lessons/stories -> reward catalog/badges/missions/resources.
- Reference source keys được resolve sang ObjectId runtime; dry-run dùng ObjectId giả deterministic để kiểm tra refs trên DB trống.
- Script `db:demo` và `admin:create` tách khỏi seed, chỉ nhận credential qua env và bị chặn trong production.
- Media thiếu được report rõ; audio/PDF/ảnh không có thì giữ `null`, `missing` hoặc draft, không tạo đường dẫn giả.

## Runtime đã kiểm tra

- Node.js: `v24.18.0`
- npm: `11.16.0`

## Package chính đã cài

- FE: React `18.3.1`, React Router DOM `6.30.6`, Vite `5.4.21`, `@vitejs/plugin-react` `4.7.0`, Tailwind plugin `@tailwindcss/vite` `4.3.3`, Tailwind CSS `4.1.17`, Axios `1.20.0`, TanStack Query `5.104.1`, Zustand `5.0.15`, React Hook Form `7.89.0`, Zod `3.25.76`.
- BE: Express `4.22.3`, Mongoose `8.24.5`, express-session `1.19.0`, connect-mongo `5.1.0`, bcryptjs `2.4.3`, Helmet `8.3.0`, express-rate-limit `7.5.1`, dotenv `16.6.1`, Zod `3.25.76`.
- Tooling: ESLint `9.39.5`, Vitest `2.1.9`, Supertest `7.1.4`.

## Ghi chú bước 02

- Models dùng `strict: "throw"`, timestamps UTC mặc định của Mongoose và transform `_id` sang `id` khi JSON.
- Secret fields `passwordHash`, `parentPinHash`, `symbolPinHash`, `Exercise.answer`, `LearningSession.questionSnapshots`, `Recording.objectKey` đặt `select:false`.
- TTL chỉ áp dụng `PinAttempt.expiresAt`; không đặt TTL cho `learningSessions`, `attempts`, `dailyStats` hoặc progress vì cần lịch sử báo cáo.
