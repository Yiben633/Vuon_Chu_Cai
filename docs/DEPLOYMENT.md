# Chuẩn bị production

Bước 19 chỉ chuẩn bị artefact và quy trình chạy private/local production. Chưa có
public deployment nào được thực hiện.

## Topology đã chọn

Mục tiêu hiện tại là Docker Compose trên một máy/server có Docker:

`Nginx (web:8080/443) -> Express API:4000 -> MongoDB replica set`

Nginx phục vụ React static dưới `/vuon-chu/`, proxy nguyên trạng `/api/` tới Express,
và trả SPA fallback chỉ cho frontend. Vì vậy API 404 vẫn là JSON của Express, không
bị trang SPA nuốt mất. Production API không dùng MemoryStore khi Mongo chưa ready.

Atlas có thể thay Mongo Compose bằng cách đổi `MONGODB_URI` theo môi trường thật;
Atlas user chỉ cần quyền kết nối và quyền ứng dụng cần thiết, không dùng user admin
toàn quyền. Không ép Express upload vào hosting static.

## Build và chạy local production

Yêu cầu Docker Desktop đang chạy. Tạo `.env.production` ngoài git, chỉ chứa secret
runtime do người vận hành cấp:

```text
APP_ORIGIN=https://example.invalid
SESSION_SECRET=<random-secret-at-least-32-bytes>
WEB_PORT=8080
TRUST_PROXY=1
```

`APP_ORIGIN` phải là origin HTTPS thật khi triển khai; không dùng giá trị mẫu.

Kiểm tra cấu hình trước khi start:

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml config
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

Trước khi seed hoặc publish, tạo indexes explicit:

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml run --rm api npm run db:indexes
```

Không chạy seed unreviewed trên production. Nội dung hiện tại còn `needs_review` và
media audio/PDF thật còn thiếu, nên chưa đủ điều kiện educational public launch.
Nếu có bộ content đã duyệt, chạy seed bằng một job operator riêng, review output,
không drop database và không tự publish.

## Smoke sau khi start

```powershell
Invoke-WebRequest http://localhost:8080/vuon-chu/ -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/v1/health/live -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/v1/health/ready -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/v1/route-does-not-exist -UseBasicParsing
```

Kỳ vọng: frontend `200`, live `200`, ready `200` khi replica set thật sẵn sàng,
API không tồn tại trả HTTP `404` với JSON `{ error: ... }`. Khi Mongo hỏng, ready
phải phản ánh lỗi DB; không coi liveness là readiness.

## Security và secrets

- `SESSION_SECRET`, Mongo URI và provider keys chỉ đi qua runtime environment/secret
  manager, không commit `.env`, không copy vào React `dist`.
- `NODE_ENV=production`, `ALLOW_UNREVIEWED_DEMO_CONTENT=false`, recordings/speech/
  OAuth/QR/lucky wheel vẫn OFF nếu chưa có provider và kiểm thử riêng.
- Cookie session là HttpOnly, SameSite Lax, Secure trong production. `TRUST_PROXY`
  phải đúng số hop proxy thực tế, không đặt tùy tiện thành `true`.
- `APP_ORIGIN` là allowlist CSRF/origin duy nhất đã cấu hình; HTTPS termination nằm
  ở reverse proxy/load balancer thật.
- Nginx giới hạn body API ở 1 MiB. Recording upload chưa bật; khi bật phải dùng
  object storage bền vững, private authorization, validator codec/duration và cleanup.
- Logger đã redact password/PIN/cookie/authorization/Mongo URI/secret; không ghi giá
  trị secret vào health hoặc startup log.

## Storage, backup và migration

Mongo volume phải nằm trên storage bền vững có backup. Trước thay đổi dữ liệu:

1. Chụp backup Mongo theo policy của Atlas/host và kiểm tra restore vào DB staging.
2. Chạy `db:indexes` như migration explicit và lưu output.
3. Chạy seed reviewed bằng operator job, kiểm tra counts/conflicts, không drop/reset.
4. Smoke health, login, child ownership, API 404 và một luồng học trên staging.

Rollback code: quay image về tag trước, giữ schema tương thích. Rollback data chỉ
thực hiện từ backup đã restore/test; không chạy script destructive tự động khi startup.

## Graceful shutdown và vận hành

Express dừng nhận kết nối mới, chờ server close, đóng Mongo và có timeout 10 giây.
Docker healthchecks kiểm tra liveness API, readiness API và Nginx. Cần gắn log/metric
ngoài ứng dụng cho latency, 4xx/5xx, restart, Mongo readiness và disk/storage; không
đưa request body hoặc credential vào log.

## Blockers hiện tại

Chưa triển khai public. Browser E2E/visual QA chưa có, content seed chưa được duyệt
để launch giáo dục, audio/PDF/recording storage/provider thật còn thiếu. Prompt sau
chỉ nên xử lý publish khi có hosting cụ thể, domain/origin, Atlas/backup policy và
asset/provider thật.

## Kiểm chứng bước 19

- `docker compose -f docker-compose.production.yml config`: PASS với runtime env mẫu
  không chứa secret thật.
- `docker compose ... build`: PASS cho `vuon_chu_cai-api` và `vuon_chu_cai-web`.
  Build stage web báo 8 audit findings của dev toolchain; image runtime chỉ là Nginx
  static, cần review dependency riêng trước CI production.
- `docker compose ... up -d`: PASS; Mongo healthy, API healthy, Nginx started.
- Smoke qua Nginx: `/vuon-chu/` 200 HTML, `/vuon-chu/be/do-vui` 200 HTML,
  `/api/v1/health/live` 200 JSON, `/api/v1/health/ready` 200 JSON,
  `/api/v1/not-found` 404 JSON.
- Stack đã được dừng sau smoke bằng `docker compose ... down`; volume local không bị xóa.
