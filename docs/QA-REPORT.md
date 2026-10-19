# QA Report - Bước 18

Ngày kiểm tra: 2026-10-19 (Asia/Ho_Chi_Minh)

## Kết luận

Trạng thái bàn giao: **PARTIAL**.

Luồng backend Express -> MongoDB replica set QA, dữ liệu nội dung, auth/ownership,
CSRF/PIN, snapshot câu hỏi, mastery, story ack, quiz, reward race, heartbeat và
daily limit đã có kiểm thử thực tế. Lint, unit test, production build và npm audit
đạt. Chưa thể đánh dấu hoàn tất toàn bộ vì chưa có browser E2E/visual harness; audio
biên tập, PDF thật, speech provider, OAuth/QR và recording storage vẫn là feature
flags hoặc dữ liệu thiếu theo thiết kế.

## PASS

| Phạm vi | Lệnh chính | Kết quả |
|---|---|---|
| Lint | `npm run lint` | PASS, API/web/contracts |
| Unit | `npm run test` | PASS, API 9 tests, web 4 tests, contracts không có test |
| Build | `npm run build` | PASS, contracts/web/api build thành công |
| Security dependency | `npm audit --json` | PASS, 0 vulnerabilities |
| Auth integration | `RUN_MONGO_TESTS=true ... npx vitest run src/routes/auth.integration.test.js` | PASS, 6 tests |
| Content/admin integration | `RUN_MONGO_TESTS=true ... npx vitest run src/routes/content.integration.test.js` | PASS, 5 tests |
| Learning/reward integration | `RUN_MONGO_TESTS=true ... npx vitest run src/routes/learning.integration.test.js` | PASS, 5 tests |
| Full integration tuần tự | `npx vitest run ... --maxWorkers=1 --fileParallelism=false` | PASS, 16 tests |
| Indexes/transactions | `npm run db:indexes`, `npm run db:verify-indexes` | PASS trên `vuon_chu_test_qa` |
| Seed idempotency | `npm run db:indexes; npm run db:seed; npm run db:verify-seed-idempotency` | PASS trên DB QA riêng; marker wallet/ledger/progress được giữ |
| Seed validation | `npm run db:validate-seed` | PASS: 29 letters, 6 tones, 78 exercises, 2 stories; game types đủ dữ liệu |

Các integration test đã xác nhận: register transaction và rollback duplicate,
child ownership, CSRF, PIN lockout/expiry, logout/password revocation, admin denied,
published-vs-draft, answer không leak trong public snapshot, versioned content edit,
attempt idempotency/conflict, mastery evidence, report accuracy/null, redeem race,
ordered story scene ack, early-complete reject, reward once, quiz 5 câu distinct,
pause/resume, heartbeat duplicate sequence, offline gap, chia ngày VN và daily limit.

## BLOCKED

- `npm run test:e2e` hiện gọi `scripts/not-implemented.mjs`; chưa có Playwright/browser
  runtime để kiểm tra register -> child picker -> học -> PIN -> parent/admin.
- Visual QA tại viewport 390/768/1440 và screenshot region-by-region chưa chạy.
  Không có bằng chứng để khẳng định không còn overflow, focus/modal hoặc cắt mascot
  trên mọi màn hình.
- Audio asset thật của seed đang thiếu; narration/animal sound/region voice không
  được giả lập. UI giữ read-text/text-assisted có nhãn.
- Recording upload/private stream/cleanup chưa bật vì `ENABLE_SERVER_RECORDINGS=false`,
  chưa có storage và media validator/ffprobe được cấu hình.
- PDF worksheet chưa có file thật; API trả trạng thái chưa sẵn sàng, không có download giả.
- Speech provider, OAuth, QR trusted device, password reset/email report và lucky wheel
  mở rộng vẫn OFF hoặc chưa có provider/credential/test độc lập.

## NOT RUN

- Browser E2E và screenshot automation.
- Multipart recording codec/duration/5 MiB/private authorization test vì storage flag OFF.
- Cross-browser audio playback and real microphone permission test.
- Full admin CRUD -> publish -> learner browser snapshot flow.

## Rà soát rủi ro

- Các số quảng cáo không có bằng chứng trong signup UI đã được thay bằng dữ liệu sản
  phẩm thật hoặc mô tả có điều kiện. Các số `128` trong schema là giới hạn kỹ thuật,
  không phải claim sản phẩm.
- Không tìm thấy `window.alert`, `randomCorrect`, `data-correct` hay remote asset runtime
  trong product source. URL remote trong `assets/inventory.json` chỉ là tư liệu tham chiếu.
- Audio controller dừng khi route/unmount, `pagehide` hoặc tab hidden; recorder dừng
  tracks và revoke object URL. Browser thực tế chưa chạy nên các nhận định FE này chưa
  thay thế cho E2E.
- Production build có cảnh báo chunk chính khoảng 522 kB sau minify; không làm build fail.

## Thay đổi trong QA

- Fixture learning integration mở parent gate trước khi đọc report và quay lại child mode
  trước redeem, đúng với quyền backend.
- Bổ sung integration heartbeat cho seq lặp, offline gap, midnight VN và daily limit.
- Signup bỏ các claim marketing/AI/PDF/safety chưa có bằng chứng.

## Lỗi còn mở

Lỗi chặn bàn giao là thiếu browser E2E/visual harness và các media/provider nêu ở trên,
không phải lỗi core API đã kiểm thử. Bước 19 cần xử lý triển khai sau khi quyết định
provider/media thật và hoàn tất visual QA.
