# Kế hoạch triển khai

Ngày lập: 06/10/2026. Phạm vi: bước 00 khảo sát và lập kế hoạch, chưa triển khai ứng dụng FE/BE.

## Nguồn đã kiểm kê

- `README.md`, `docs/01` đến `docs/07`, `docs/08`, `data/seed-manifest.json`, `assets/manifest.json`, PRD và DESIGN trong `reference/` đã được đọc.
- Workspace hiện có bộ đặc tả, prompt theo bước, seed JSON, tài nguyên cục bộ và HTML/screenshot tham chiếu. Chưa có `package.json`, monorepo, React app, Express API hoặc database thật.
- Không có `AGENTS.md` trong thư mục dự án này.
- `reference/` có 13 file `code.html`: 8 màn hình chính, 1 biến thể bảng chữ cái và 4 icon SVG nội tuyến.
- `assets/manifest.json` có 8 asset sẵn sàng: logo, mascot, 2 background và 4 icon SVG.
- `data/seed-manifest.json` có 11 dataset nghiệp vụ: 29 letters, 6 tones, 24 vocabulary, 24 spellingEntries, 12 exercises, 5 lessons, 2 stories, 4 rewards, 4 badges, 3 missions, 2 resources.

## Phạm vi sản phẩm

MVP giữ đúng stack ReactJS + Vite + JavaScript/JSX, Node.js + Express ESM, MongoDB + Mongoose. Không chuyển sang Next.js, SQL, Firebase hoặc dịch vụ triển khai tự động.

8 màn hình từ nguồn:

| Màn hình | Route dự kiến | Ghi chú |
|---|---|---|
| Giới thiệu | `/`, `/gioi-thieu` | Bỏ số liệu marketing chưa chứng minh |
| Khu vườn bảng chữ cái | `/vuon-chu` | 29 chữ, filter nguyên âm/phụ âm |
| Rừng ghép vần | `/rung-ghep-van` | Chỉ dùng tổ hợp đã duyệt |
| Đầm kể chuyện | `/dam-ke-chuyen`, `/dam-ke-chuyen/:slug` | Ack cảnh theo thứ tự |
| Thử thách đố vui | `/thu-thach`, `/thu-thach/:gameType` | 5 loại bài từ backend |
| Góc phụ huynh | `/phu-huynh` | Báo cáo thật, PIN gate |
| Đăng ký | `/dang-ky` | Tạo parent + child đầu tiên |
| Đăng nhập | `/dang-nhap` | Email/password MVP |

Trang bổ sung cần có: `/vuon-chu/:symbol`, `/chon-ho-so`, `/qua-tang`, `/phu-huynh/hoc-lieu`, `/admin/*`, trang 404.

## Kiến trúc mục tiêu

Monorepo npm workspaces:

```text
apps/web/             ReactJS/Vite, JavaScript/JSX
apps/api/             Express ESM, Mongoose
packages/contracts/   Zod schema, enum, DTO dùng chung
docs/                 Đặc tả, kế hoạch, tiến độ
data/                 Seed nguồn và validator
assets/               Asset cục bộ
reference/            PRD, DESIGN, HTML, screenshot
starter/              env example nguồn
```

Frontend gọi `/api/v1` bằng URL tương đối qua Vite proxy. Backend theo luồng route -> validation -> controller -> service -> repository/model -> MongoDB. Không dùng microservices cho MVP.

## Backend modules

- `health`: live/ready, kiểm tra DB/index/topology.
- `auth`: CSRF, register, login, logout, me, enter-child, parent-gate, password/PIN.
- `children`: hồ sơ con, settings, export/delete, voice consent.
- `content`: letters, tones, vocabulary, spelling entries, lessons, stories, resources, media public.
- `learning`: sessions, heartbeat, pause/resume, answers, story scene ack, complete.
- `rewards`: wallet, ledger, catalog, redeem, inventory, badges, missions.
- `reports`: overview, daily, attempts, recommendations không chẩn đoán.
- `recordings`: bật ở bước 15 khi có consent và storage phù hợp.
- `admin`: CRUD học liệu bằng registry allowlist, không expose collection tùy ý.
- `seed`: validate/import content, indexes, demo/admin provisioning riêng.

## Models và dữ liệu

Nhóm tài khoản và phiên: `users`, `childProfiles`, connect-mongo `sessions`, `pinAttempts`.

Nhóm nội dung: `assets`, `letters`, `tones`, `vocabulary`, `spellingEntries`, `lessons`, `exercises`, `stories`, `resources`.

Nhóm học tập: `learningSessions`, `attempts`, `childProgress`, `dailyStats`.

Nhóm thưởng và media riêng tư: `wallets`, `rewardLedger`, `rewardCatalog`, `inventory`, `badges`, `childBadges`, `missions`, `missionClaims`, `recordings`. `speechAttempts` chỉ thêm ở bước 17 nếu bật provider thật.

Mọi text tiếng Việt chuẩn hóa NFC. Seed dùng `key` bền vững và importer resolve sang ObjectId. Không dùng `dropDatabase` hoặc reset collection người dùng khi seed.

## Auth, ownership và PIN gate

- Server role chỉ có `parent|admin`; `child` là mode của session gia đình với `currentChildId`.
- Session dùng `express-session` + `connect-mongo`, cookie HttpOnly, SameSite và Secure theo môi trường.
- Mọi mutation cần CSRF token và Origin hợp lệ.
- Backend kiểm tra session, ownership, mode, parent gate và authVersion; FE route guard chỉ hỗ trợ UX.
- PIN 4 số phải hash, có rate limit và lockout bền vững. Parent gate TTL 10 phút.
- Không nhận `role`, `parentId`, `score`, `completed`, `rewardAmount` từ client làm authority.

## Transactions, idempotency và giới hạn

- Register tạo user + child đầu tiên + wallet + welcome ledger trong một transaction.
- Submit answer kiểm tra snapshot/question, attemptNo, idempotencyKey, chấm đáp án, progress, dailyStats, reward ledger và wallet trong một transaction.
- Redeem dùng conditional wallet update để không âm ví khi request song song.
- Heartbeat dùng seq tăng đơn điệu; không cộng thời gian khi tab hidden/pause/offline.
- DayKey do backend tính theo `Asia/Ho_Chi_Minh`.
- MongoDB phải là Atlas hoặc replica set có transaction. Standalone là blocker cho workflow chính.

## Unicode, nội dung học và thưởng

- Alphabet: 29 chữ, 12 nguyên âm, 17 phụ âm.
- Thanh: 6 thanh gồm ngang, sắc, huyền, hỏi, ngã, nặng.
- Ghép vần: chỉ tổ hợp có trong data, không tự ghép chuỗi dấu.
- Mastery chữ: đúng lần đầu ở ít nhất 2 exercise nhận diện khác nhau cho chữ đó.
- Reward: welcome 50 một lần/account, quiz đúng lần đầu 5 với giới hạn ngày, story 15 một lần/version, mission 10 một lần/ngày. Sai không trừ điểm.
- Level tính theo số chữ mastered, không theo balance vì balance giảm khi đổi quà.

## Thiết kế và tài nguyên

Giữ palette xanh mint/emerald, vàng hạt dẻ, hồng sen; typography Quicksand/Nunito Sans; touch target tối thiểu 56px. Screenshot dùng để đối chiếu bố cục, không dùng làm background trang React. HTML tham chiếu không nhúng iframe và không copy DOM script trực tiếp.

Asset còn thiếu hoặc chưa được xác minh:

- Audio Bắc/Trung/Nam.
- Ảnh minh họa từng từ và từng cảnh truyện.
- PDF học liệu.
- Tài khoản email/Zalo/Google/QR.
- Provider AI speech/pronunciation.
- License thương mại/công khai của asset nguồn.

Khi thiếu audio, UI chỉ dùng TTS thiết bị nếu có và phải ghi rõ là giọng thiết bị; không tạo URL audio giả. Resources thiếu file trả `RESOURCE_NOT_READY`.

## P0 - MVP bắt buộc

1. Khởi tạo monorepo, FE/BE/contracts, env examples, scripts root.
2. Tạo Mongoose schemas, indexes, readiness check transaction.
3. Seed importer an toàn, mở rộng bài identify-letter tối thiểu 2 bài/chữ.
4. Auth parent/session/CSRF/PIN gate/child mode.
5. Public content API và admin content CRUD cơ bản.
6. Learning sessions, attempt scoring, progress, rewards, wallet, daily limits.
7. Design system FE, layout chung, auth/profile, 8 màn hình nguồn và trang chi tiết.
8. Parent reports thật, settings nghỉ, rewards/inventory, admin vận hành.
9. Audio fallback minh bạch và recording chỉ khi consent/storage cho phép.
10. Lint/build/unit/integration/e2e/visual QA theo docs/06.

## P1 - Sau MVP

- Audio biên tập 3 miền và registry media đầy đủ.
- PDF học liệu thật, download có kiểm quyền.
- Thiết bị tin cậy.
- Inbox ghi âm server với private storage production và cleanup job.
- Báo cáo tự động khi có provider email hợp lệ.

## P2 - Tùy chọn

- Provider AI speech/pronunciation có consent và đánh giá thật.
- Google/Zalo/QR auth.
- Vòng quay may mắn miễn phí.
- Handwriting AI, mobile app, lớp học giáo viên, thanh toán.

## Kế hoạch theo prompt

| Bước | Trạng thái mục tiêu |
|---|---|
| 00 | Khảo sát, quyết định, kế hoạch, tiến độ |
| 01 | Khởi tạo workspace FE/BE/contracts và scripts root |
| 02 | Models MongoDB, indexes, migration/index runner |
| 03 | Seed importer, validate seed, mở rộng bài tập |
| 04 | Auth, phân quyền, session, CSRF, PIN gate |
| 05 | API học liệu và admin CRUD |
| 06 | Learning, progress, rewards, time limits |
| 07 | FE design system và layout |
| 08 | FE auth và chọn hồ sơ |
| 09 | FE vườn chữ cái và chi tiết chữ |
| 10 | FE rừng ghép vần |
| 11 | FE đầm kể chuyện |
| 12 | FE thử thách đố vui |
| 13 | FE góc phụ huynh |
| 14 | FE phần thưởng và cây phát triển |
| 15 | Âm thanh, TTS fallback, ghi âm có consent |
| 16 | FE admin và học liệu |
| 17 | Mở rộng tùy chọn, có thể SKIPPED cho MVP |
| 18 | Kiểm thử và hoàn thiện |
| 19 | Chuẩn bị triển khai, không tự deploy |

## Rủi ro và blocker

- Chưa có MongoDB replica set/Atlas được xác nhận.
- Node.js đã kiểm tra ở bước 00: `v24.18.0`; npm: `11.16.0`.
- Chưa có ứng dụng để chạy lint/build/test.
- Chưa có audio/PDF/AI provider/OAuth credentials/private object storage.
- Nội dung seed cần rà sư phạm trước production.
- Root hiện không phải git repository, nên bước này chưa có diff/commit bằng git.
