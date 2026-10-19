# Handover

## Chạy local

Yêu cầu Node 22+, npm 10+, Docker Desktop.

```powershell
docker compose up -d mongo
npm install
npm run db:indexes
npm run db:seed
npm run dev
```

Mở web tại `http://localhost:5173`. API mặc định ở `http://localhost:4000`.
Nếu cổng 4000 hoặc 5173 đã bị chiếm, dừng process cũ trước khi chạy lại; không
chạy hai API cùng lúc vì session/cookie sẽ trỏ nhầm tiến trình.

## Tài khoản demo

Không ghi password/PIN vào tài liệu. Dùng `npm run db:demo` hoặc
`npm run admin:create` với biến môi trường do người vận hành tự cung cấp; các script
này không chạy trong production và không seed/reset hồ sơ cá nhân.

## QA MongoDB

Integration test cần Mongo replica set riêng, ví dụ:

```powershell
$env:RUN_MONGO_TESTS='true'
$env:MONGODB_URI='mongodb://localhost:27017/vuon_chu_test_qa?replicaSet=rs0'
$env:SESSION_SECRET='local_test_secret_at_least_32_bytes'
npx vitest run src/routes/auth.integration.test.js src/routes/content.integration.test.js src/routes/learning.integration.test.js --maxWorkers=1 --fileParallelism=false
```

Chỉ dùng DB có tên `vuon_chu_test_*` cho test. Chạy `npm run db:indexes` trước
concurrency tests. Báo cáo chi tiết nằm ở [QA-REPORT.md](./QA-REPORT.md).

## Các giới hạn hiện tại

Audio/PDF/recording storage/speech provider/OAuth/QR/lucky wheel mở rộng chưa bật nếu
không có asset, provider và credential thật. UI phải giữ trạng thái unavailable hoặc
read-text; không thêm URL/media giả. `npm run test:e2e` hiện chưa triển khai và được
ghi là BLOCKED trong QA report.

## Tiếp nhận trước bước triển khai

1. Bổ sung Playwright và browser CI, chụp 390/768/1440 cho các route chính, admin và
   letter detail.
2. Cấp asset audio/PDF thật và kiểm tra quyền sử dụng; sau đó bật từng feature flag
   riêng lẻ.
3. Khi có recording storage, cấu hình codec validator và test private authorization,
   cleanup, giới hạn 5 MiB/15 giây.
4. Không triển khai production nếu `check:env`, readiness Mongo transaction và
   migration/index verification chưa đạt.
