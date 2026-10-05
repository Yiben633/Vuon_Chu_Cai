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
