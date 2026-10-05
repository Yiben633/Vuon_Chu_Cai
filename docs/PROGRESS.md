# Tiến độ triển khai

Trạng thái ban đầu: root workspace mới được khởi tạo từ bộ prompt nguồn; chưa có feature nghiệp vụ đầy đủ.

| Bước | Trạng thái | File thay đổi | Kiểm tra đã chạy | Blocker |
|---|---|---|---|---|
| 00 - Khảo sát và kế hoạch | DONE | Tài liệu bước 00 trong bộ prompt nguồn | `python data/validate_seed.py` - PASS, 1865 checks; `node -v` - v24.18.0; `npm -v` - 11.16.0 | MongoDB replica set/Atlas chưa kiểm tra |
| 01 - Khởi tạo workspace | DONE | `package.json`, `package-lock.json`, `.gitignore`, `README.md`, `docker-compose.yml`, `scripts/*`, `docs/*`, `apps/web/*`, `apps/api/*`, `packages/contracts/*`, `data/*`, `assets/*`, `prompts/*` | `npm install` - DONE; `npm run lint` - PASS; `npm run build` - PASS; `npm run test` - PASS, chưa có test files; `python data/validate_seed.py` - PASS, 1865 checks; `npm run check:env` - PASS; API live 200, ready 503 khi DB mất; `npm audit --json` - 0 vulnerabilities; `db:indexes`, `db:seed`, `test:e2e` - EXPECTED FAIL có thông báo bước sau | MongoDB replica set/Atlas chưa chạy nên readiness 503 là kết quả đúng; indexes/seed/e2e chờ bước 02/03/18 |
| 02 - Models MongoDB | DONE | `apps/api/src/models/*`, `apps/api/src/repositories/baseRepository.js`, `apps/api/src/services/indexMaintenanceService.js`, `apps/api/scripts/create-indexes.mjs`, `apps/api/scripts/verify-indexes.mjs`, `apps/api/package.json`, `package.json`, `README.md`, `apps/api/.env.example`, `docs/*` | `npm run lint` - PASS; `npm run build` - PASS; `npm run test` - PASS, API model tests 6 passed; `python data/validate_seed.py` - PASS, 1865 checks; `npm run db:indexes:dry-run --workspace @vuon-chu/api` - PASS; `npm run db:indexes` with `mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0` - DONE, transactionProbe ok; rerun `npm run db:indexes` - DONE with before/after unchanged; `npm run db:verify-indexes --workspace @vuon-chu/api` - PASS duplicate email/ledger/active session/inventory and hash projection | MongoDB local Docker container was started for test DB; step 03 seed importer not implemented yet |
| 03 - Seed và kiểm tra dữ liệu | DONE | `apps/api/src/services/seed/*`, `apps/api/scripts/validate-seed.mjs`, `apps/api/scripts/seed-database.mjs`, `apps/api/scripts/verify-seed-idempotency.mjs`, `apps/api/scripts/create-demo.mjs`, `apps/api/scripts/create-admin.mjs`, `apps/api/src/models/contentModels.js`, `apps/api/src/models/rewardModels.js`, `apps/api/package.json`, `package.json`, `README.md`, `docs/*` | `npm run db:validate-seed` - PASS, 29 letters, 6 tones, 78 exercises, 58 identify-letter, 5/game type; `npm run db:seed:dry-run` with local Mongo - PASS, refs resolved; `npm run db:seed` - DONE; rerun `npm run db:seed` - DONE, all unchanged and counts stable; `npm run db:verify-seed-idempotency` - PASS, marker attempt/wallet/redemption preserved; `npm run lint` - PASS; `npm run test` - PASS, 7 tests; `npm run build` - PASS | Seed content is still `needs_review`; missing narration/illustrations/story art/PDF are reported and kept null/draft. Production seed requires reviewed content/approval. |
| 04 - Auth và phân quyền | DONE | `apps/api/src/app.js`, `apps/api/src/lib/*`, `apps/api/src/middleware/*`, `apps/api/src/routes/authRoutes.js`, `apps/api/src/routes/childrenRoutes.js`, `apps/api/src/routes/auth.integration.test.js`, `apps/api/src/services/auth/*`, `apps/api/src/models/utils/errors.js`, `docs/*` | `npm run lint` - PASS; `npm run test` - PASS, non-Mongo tests 7 passed and auth integration skipped by default; `RUN_MONGO_TESTS=true` + `npm run test --workspace @vuon-chu/api` with local replica set - PASS, 13 tests including register transaction, duplicate rollback, CSRF, bad login, ownership, child mode blocking, PIN lockout, expired gate, session fixation/logout/password revocation; `npm run build` - PASS | Reset password/SĐT/OAuth deliberately not implemented in MVP. Admin content routes still wait for step 16; only auth middleware exists. |
| 05 - API học liệu và admin | NOT STARTED | — | — | — |
| 06 - Học tập, kết quả và thưởng | NOT STARTED | — | — | — |
| 07 - FE design system và layout | NOT STARTED | — | — | — |
| 08 - FE auth và hồ sơ | NOT STARTED | — | — | — |
| 09 - FE vườn chữ cái | NOT STARTED | — | — | — |
| 10 - FE rừng ghép vần | NOT STARTED | — | — | — |
| 11 - FE đầm kể chuyện | NOT STARTED | — | — | — |
| 12 - FE thử thách đố vui | NOT STARTED | — | — | — |
| 13 - FE góc phụ huynh | NOT STARTED | — | — | — |
| 14 - FE phần thưởng và cây | NOT STARTED | — | — | — |
| 15 - Âm thanh và ghi âm | NOT STARTED | — | — | — |
| 16 - FE quản trị và học liệu | NOT STARTED | — | — | — |
| 17 - Mở rộng tùy chọn | NOT STARTED | — | — | Optional cho MVP |
| 18 - Kiểm thử và hoàn thiện | NOT STARTED | — | — | Chờ app được triển khai |
| 19 - Chuẩn bị triển khai | NOT STARTED | — | — | Không tự deploy |
