# Vườn Chữ Diệu Kỳ

Workspace chính cho ứng dụng ReactJS + Express + MongoDB/Mongoose. Bộ prompt và tài liệu nguồn nằm trong `VUON_CHU_VIBECODE_REACT_MONGODB/vuon-chu-vibecode`; app thật được khởi tạo ở root này.

## Yêu cầu runtime

- Node.js `>=22.12.0`; môi trường hiện tại đã kiểm tra: `v24.18.0`.
- npm `>=10`; môi trường hiện tại đã kiểm tra: `11.16.0`.
- MongoDB Atlas hoặc MongoDB replica set local. MongoDB standalone không đủ cho transaction.

## Cài đặt

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Điền `MONGODB_URI` trong `apps/api/.env` bằng replica set local hoặc Atlas. Không đưa secret thật vào file `.env.example`.
Với `docker-compose.yml` trong repo này, dùng `mongodb://localhost:27017/vuon_chu_dev?replicaSet=rs0`.

## Chạy local

Terminal 1:

```powershell
npm run dev:api
```

Terminal 2:

```powershell
npm run dev:web
```

Hoặc chạy cả hai:

```powershell
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000`
- Liveness: `http://localhost:4000/api/v1/health/live`
- Readiness: `http://localhost:4000/api/v1/health/ready`

Khi chưa có MongoDB hợp lệ, liveness vẫn trả 200 còn readiness trả 503 với mã `DB_NOT_READY`.

## Kiểm tra bước 01

```powershell
npm run lint
npm run build
npm run test
```

Các script `db:indexes`, `db:seed` và `test:e2e` đã có route root nhưng cố ý báo chưa triển khai cho đến các bước sau, thay vì báo pass giả.

## MongoDB local tùy chọn

Nếu dùng Docker, có thể chạy replica set local:

```powershell
docker compose up -d mongo
```

Atlas vẫn được hỗ trợ và là lựa chọn hợp lệ nếu không dùng Docker.

## Seed dữ liệu học

Seed bước 03 chạy trên MongoDB replica set/Atlas, không drop database và không xóa dữ liệu cá nhân như users, attempts, wallets, progress.

```powershell
$env:MONGODB_URI="mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0"
$env:ALLOW_UNREVIEWED_DEMO_CONTENT="true"
npm run db:validate-seed
npm run db:seed:dry-run
npm run db:seed
npm run db:verify-seed-idempotency
```

`ALLOW_UNREVIEWED_DEMO_CONTENT=true` chỉ dùng cho nonproduction vì seed hiện là nội dung kỹ thuật `needs_review`. Production phải được duyệt trước khi publish. Media còn thiếu được giữ `null`/draft và được report, không tạo path/audio/PDF giả.

Tạo tài khoản demo/admin là script riêng và bắt buộc truyền credential qua env, không commit mật khẩu/PIN rõ:

```powershell
$env:DEMO_PARENT_EMAIL="demo@example.test"
$env:DEMO_PARENT_PASSWORD="..."
$env:DEMO_PARENT_PIN="1234"
npm run db:demo

$env:ADMIN_EMAIL="admin@example.test"
$env:ADMIN_PASSWORD="..."
$env:ADMIN_PIN="1234"
npm run admin:create
```

## Auth API local

Các mutation auth/family cần lấy CSRF trước rồi gửi `X-CSRF-Token` kèm `Origin` đúng `APP_ORIGIN`.

```powershell
$env:MONGODB_URI="mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0"
$env:SESSION_SECRET="local_dev_secret_at_least_32_bytes_long"
npm run dev:api
```

Các endpoint bước 04 nằm dưới `/api/v1/auth` và `/api/v1/children`. Integration test Mongo chạy bằng:

```powershell
$env:RUN_MONGO_TESTS="true"
$env:MONGODB_URI="mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0"
$env:SESSION_SECRET="auth_test_session_secret_at_least_32_bytes"
npm run test --workspace @vuon-chu/api
```

## Learning/Reward API local

Prompt 06 adds backend-authoritative learning sessions, answer submission, heartbeat timing, rewards, wallet, inventory, missions and child reports.

- Learning: `/api/v1/learning/sessions`, `/api/v1/learning/sessions/:id/answers`, `/api/v1/learning/sessions/:id/heartbeat`.
- Child data: `/api/v1/children/:childId/progress`, `/wallet`, `/reward-ledger`, `/inventory`, `/badges`, `/missions`, `/reports/*`.
- Rewards catalog: `/api/v1/rewards`.

Rebuild child aggregates when operating on repaired data:

```powershell
npm run db:rebuild-aggregates -- --childId=<ObjectId>
```

## FE design/layout local

Prompt 07 adds reusable React layouts and design-system components. Main routes:

- Public: `/`, `/gioi-thieu`, `/hoc-thu`, `/dang-nhap`, `/dang-ky`
- Child: `/be`, `/be/bang-chu-cai`, `/be/ghep-van`, `/be/truyen`, `/be/do-vui`, `/be/phan-thuong`
- Parent: `/phu-huynh`, `/phu-huynh/nhan-dien`, `/phu-huynh/bai-hoc`, `/phu-huynh/thoi-gian`, `/phu-huynh/cai-dat`, `/phu-huynh/tai-nguyen`, `/phu-huynh/hop-thu`, `/phu-huynh/ho-so`
- Admin: `/admin`, `/admin/hoc-lieu`, `/admin/bien-tap`, `/admin/tai-len`

Assets used by the web app are copied from local `assets/` into `apps/web/public/assets/`; no remote media, audio, PDF or AI metric is faked.

## FE auth/profile local

Prompt 08 connects the React auth screens to the Express session backend.

1. Start MongoDB replica set if needed:

```powershell
docker compose up -d mongo
```

2. Start API and web in separate terminals:

```powershell
npm run dev:api
npm run dev:web
```

3. Open the browser at:

- Register: `http://localhost:5173/dang-ky`
- Login: `http://localhost:5173/dang-nhap`
- Child profile picker/dashboard: `http://localhost:5173/be`
- Parent area behind PIN gate: `http://localhost:5173/phu-huynh`

The web client uses HttpOnly session cookies, in-memory CSRF handling and `withCredentials`. It does not store password, PIN, CSRF token or Mongo/session secrets in browser storage. Google/Zalo/QR/phone login remain hidden until backend support exists.

## FE alphabet local

Prompt 09 connects the 29-letter garden to real content/progress/session APIs.

- Guest preview: `http://localhost:5173/hoc-thu`
- Child alphabet garden: `http://localhost:5173/be/bang-chu-cai`
- Letter detail route example: `http://localhost:5173/be/bang-chu-cai/%C4%82`

Child mode requires login/register and selecting a child profile first. The page reads published letters from `/api/v1/letters`, progress/wallet from child-scoped APIs, starts alphabet sessions with `/api/v1/learning/sessions`, and submits only `optionId` answers. Missing audio remains labelled unavailable; no mic or fake playback is started.

## FE spelling local

Prompt 10 connects the spelling forest to real spelling/vocabulary/session APIs.

- Child spelling board: `http://localhost:5173/be/ghep-van`
- Public data used: `/api/v1/spelling-entries`, `/api/v1/tones`, `/api/v1/vocabulary`
- Quiz flow: `POST /api/v1/learning/sessions` with `type=spelling`, then submit `optionId` answers.

The board supports click, keyboard and drag/drop token selection for onset/rime/tone. Lookup only uses allowed combinations from MongoDB, so invalid combinations show a gentle message instead of composing fake Vietnamese words. Missing audio remains labelled unavailable.

## FE story local

Prompt 11 connects the interactive story area to real story/session APIs.

- Story library/player: `http://localhost:5173/be/truyen`
- Direct story route example: `http://localhost:5173/be/truyen/mam-nho-trong-vuon`
- Public story data: `/api/v1/stories`, `/api/v1/stories/:slug`
- Story flow: `POST /api/v1/learning/sessions` with `type=story`, then scene ack via `/learning/sessions/:id/scenes/:sceneId/ack`, ending answer via `/answers`, and complete via `/complete`.

The story player reads text scenes, shows hotspot vocabulary, moral, scene order and a local roleplay recorder. Missing scene images use local fallback cards; missing audio is labelled unavailable and may fall back to device vi-VN TTS only after a user click. Story reward is granted only by the backend after all scenes are acknowledged in order and the ending question is answered correctly.

## FE quiz local

Prompt 12 connects the child quiz area to backend-issued exercise rounds.

- Quiz route: `http://localhost:5173/be/do-vui`
- Session flow: `POST /api/v1/learning/sessions` with `type=quiz` and one of `identify-letter`, `match-rime`, `listen-word`, `select-tone`, `listen-animal`.
- Each round returns 5 sanitized questions in `questions[]`; learner APIs never return `answer`.
- Answer flow: `POST /api/v1/learning/sessions/:id/answers` with only `optionId`, `attemptNo` and an idempotency key.
- Missions: `/api/v1/children/:childId/missions` and `/missions/:missionId/claim`.

The UI renders five button-based minigames: apple letters, butterfly rimes, lotus word choices, tone maze nodes and forest sounds. Missing audio is labelled as text-assisted mode and is submitted as text, not audio. Rewards, wallet, reports and mission progress are refreshed from backend responses only.

## FE rewards local

Prompt 14 connects the child reward area to the wallet, reward catalog, inventory, badges, missions and ledger APIs.

- Reward route: `http://localhost:5173/be/phan-thuong`
- Catalog: `GET /api/v1/rewards`
- Child-scoped data: `/api/v1/children/:childId/wallet`, `/inventory`, `/reward-ledger`, `/badges`, `/missions`
- Redeem: `POST /api/v1/children/:childId/redeem` with a stable lifecycle idempotency key.
- Equip cosmetic: `PATCH /api/v1/children/:childId/inventory/:itemId/equip`

The header acorn counter now reads the current child wallet by `childId`. Redeem confirmation waits for backend success before invalidating wallet/inventory/ledger; no optimistic spend is shown. Cosmetic items are virtual only and use simple UI accessories when seed assets are missing. Level/growth is based on mastered letters, not wallet balance.

## FE parent reports local

Prompt 13 connects the parent dashboard to MongoDB-backed child reports.

- Parent report route: `http://localhost:5173/phu-huynh`
- Supporting tabs: `/phu-huynh/nhan-dien`, `/phu-huynh/bai-hoc`, `/phu-huynh/thoi-gian`, `/phu-huynh/tai-nguyen`, `/phu-huynh/hop-thu`
- Report APIs: `/api/v1/children/:childId/reports/overview`, `/daily`, `/attempts`
- Settings API: `PATCH /api/v1/children/:childId/settings`

Reports require parent mode plus an open PIN gate. KPI values come from `childProgress`, `attempts`, `dailyStats` and child settings; recognition accuracy shows `Chưa có dữ liệu` when there are no first attempts. PDF resources remain disabled until real files exist; recording inbox reads server capability and stays empty/unavailable while `ENABLE_SERVER_RECORDINGS=false`.

## Audio/recording local

Prompt 15 adds a single frontend narration controller and a consent-aware local recorder.

- Story scene playback uses edited audio assets when an `assetKey` exists; current seed has null audio, so the UI labels the missing region and only tries device vi-VN TTS after a user button click.
- The child roleplay panel uses `getUserMedia` + `MediaRecorder` on HTTPS/localhost, shows a recording indicator, caps local clips at 15 seconds, and supports preview/discard without sending anything automatically.
- Parent inbox reads server capability from `GET /api/v1/children/:childId/recordings`; it stays empty/unavailable while `ENABLE_SERVER_RECORDINGS=false`.
- Upload endpoint exists at `POST /api/v1/children/:childId/recordings`, but the default feature flag returns `PROVIDER_UNAVAILABLE` instead of accepting files. Server storage, private streaming and codec/duration validation still require a real media tool/storage setup.

## Admin UI local

Prompt 16 adds the first admin content UI on top of the step 05 admin APIs.

- Admin dashboard: `http://localhost:5173/admin`
- Content editors: `http://localhost:5173/admin/hoc-lieu`
- Review/editing queue: `http://localhost:5173/admin/bien-tap`
- Asset upload: `http://localhost:5173/admin/tai-len`

Admin pages require an `admin` user and an open parent gate. Create or promote an admin through the existing server script instead of storing credentials in the frontend:

```powershell
$env:ADMIN_EMAIL="admin@example.test"
$env:ADMIN_PASSWORD="replace-with-local-password"
$env:ADMIN_PIN="1234"
npm run admin:create --workspace @vuon-chu/api
```

The dashboard reads `/api/v1/admin/summary` for real content counts and recent audit entries. Editors use resource-specific fields for letters, tones, vocabulary, spelling entries, exercises, stories, resources, rewards, badges and missions; exercise learner preview does not expose `answer`. Upload accepts only allowlisted local files verified by the server. Missing worksheet/PDF resources stay unavailable until a real PDF asset is uploaded, so no download or publish button pretends the file exists.

## Optional speech extension local

Prompt 17 currently implements only the speech capability interface and keeps the real provider OFF by default.

- Capability API: `GET /api/v1/children/:childId/speech/capability`
- Assessment stub: `POST /api/v1/children/:childId/speech/assess`
- Feature flags: `ENABLE_CLOUD_SPEECH=false`, `ENABLE_BROWSER_SPEECH=false`

Without `SPEECH_PROVIDER` and `SPEECH_PROVIDER_API_KEY`, the API returns `PROVIDER_UNAVAILABLE`; it does not create pronunciation percentages, rewards or mastery. Browser speech detection is shown in the parent safety panel only as capability information and the app does not start SpeechRecognition automatically.

## Content/Admin API local

Public content nằm dưới `/api/v1/letters`, `/api/v1/tones`, `/api/v1/vocabulary`, `/api/v1/spelling-entries`, `/api/v1/stories`. `/api/v1/lessons` cần đăng nhập; `/api/v1/resources` và download PDF cần parent gate.

Admin content nằm dưới `/api/v1/admin/:resourceType`, yêu cầu user role `admin` và parent gate. Exercise admin DTO có `answer`; public/story DTO không có answer. Integration test đầy đủ:

```powershell
$env:RUN_MONGO_TESTS="true"
$env:MONGODB_URI="mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0"
$env:SESSION_SECRET="content_test_session_secret_at_least_32_bytes"
$env:ALLOW_UNREVIEWED_DEMO_CONTENT="true"
npm run test --workspace @vuon-chu/api
```
