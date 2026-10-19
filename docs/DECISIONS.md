# Quyết định kỹ thuật

Ngày cập nhật: 07/10/2026.

| Mã | Quyết định | Lý do |
|---|---|---|
| D-001 | App thật nằm ở root workspace, không nằm trong `VUON_CHU_VIBECODE_REACT_MONGODB/vuon-chu-vibecode`. | Theo yêu cầu người dùng; thư mục kia là nguồn prompt/tài liệu. |
| D-002 | Monorepo dùng npm workspaces với `apps/web`, `apps/api`, `packages/contracts`. | Khớp kiến trúc bước 00. |
| D-003 | FE dùng ReactJS + Vite + JavaScript/JSX, Tailwind qua `@tailwindcss/vite`. | Đúng stack cố định, không dùng Tailwind CDN. |
| D-004 | BE dùng Express ESM + Mongoose + `express-session`/`connect-mongo`. | Server là authority cho auth/session/PIN/progress/rewards. |
| D-005 | Password/PIN hash dùng `bcryptjs` ở bước scaffold. | Tránh native build trong lúc khởi tạo, vẫn dùng bcrypt-compatible hashing. |
| D-006 | API có thể start khi DB mất để trả liveness 200 và readiness 503, nhưng không báo ready giả. | Phù hợp health check và local development. |
| D-007 | Script chưa tới phạm vi sẽ fail có thông báo rõ. | Không echo PASS giả. |
| D-008 | API `dev` dùng `node src/server.js` thay vì `node --watch`. | `node --watch` bị `spawn EPERM` trong sandbox Windows hiện tại. |
| D-009 | Khi DB chưa ready, API không tạo `connect-mongo` session store. | Tránh process chết khi DB mất; readiness vẫn trả 503. |
| D-010 | `db:indexes` dùng `createIndexes()` theo registry explicit, không dùng `syncIndexes()` tự động. | Tránh drop index production ngoài ý muốn. |
| D-011 | Docker Mongo local dùng URI `mongodb://localhost:27017/...?...replicaSet=rs0`. | Replica set healthcheck cấu hình member host là `localhost:27017`. |
| D-012 | `recordings` schema được tạo trước nhưng feature vẫn disabled ở env. | Chuẩn bị model/index cho bước 15 mà không bật upload khi chưa có consent/storage. |
| D-013 | Bước 03 mở rộng seed exercises trong importer/service thay vì sửa trực tiếp JSON nguồn. | Giữ manifest/seed gốc kiểm toán được, vẫn đạt 58 identify-letter và ít nhất 5 câu mỗi game type. |
| D-014 | Seed demo `needs_review` cần `ALLOW_UNREVIEWED_DEMO_CONTENT=true` ở nonproduction. | Tránh vô tình publish nội dung kỹ thuật chưa duyệt; production bị chặn nếu còn `needs_review`. |
| D-015 | Auth integration tests yêu cầu `RUN_MONGO_TESTS=true` để chạy với Mongo replica set thật. | Giữ `npm run test` chạy được ở môi trường chưa có DB. |
| D-016 | Parent gate dùng session regeneration sau register/login/enter-child/open-gate và `authVersion` để revoke session. | Chống session fixation và vô hiệu hóa session cũ khi đổi mật khẩu/PIN. |
| D-017 | Public content DTO tách khỏi admin DTO; public không bao giờ select `Exercise.answer`. | Tránh leak đáp án qua story/public content; admin exercise mới thấy answer. |
| D-018 | Admin published edit tăng `version` và chuyển về draft trên cùng ObjectId. | Giữ reference hiện có không gãy trong lúc chưa có content-version collection riêng; session snapshot riêng sẽ xử lý ở bước 06. |
| D-019 | Admin asset upload lưu file vào `apps/api/var/private-media/public-assets` và ghi metadata asset, không tạo URL public giả. | Có kiểm tra MIME/size/SVG script mà vẫn tránh publish file khi chưa có media serving/storage hoàn chỉnh. |
| D-020 | Learning session lưu `questionSnapshots` private và attempt lưu `requestHash` canonical. | Server tự chấm đúng/sai, chống retry khác payload với cùng idempotency key và tránh leak đáp án ra public DTO. |
| D-021 | Header `X-Test-Now` chỉ được đọc khi `NODE_ENV=test`. | Cho phép kiểm thử heartbeat/mốc ngày VN mà không trao quyền client production chỉnh thời gian server. |
| D-022 | Parent xem progress/wallet/reports vẫn phải có parent gate; child chỉ xem đúng `currentChildId`. | Giữ ownership/backend authority nhất quán với auth step 04. |
| D-023 | Mongo integration suites dùng DB test riêng theo suite (`vuon_chu_test_auth/content/learning`). | Tránh test admin sửa content làm nhiễu learning/content suite khi Vitest chạy song song. |
| D-024 | FE copy asset local vào `apps/web/public/assets` và tham chiếu qua `assetRegistry`. | Giữ logo/mascot/background đúng file supplied, không dùng screenshot hoặc remote URL chưa kiểm quyền. |
| D-025 | Route học, phụ huynh và admin dùng lazy loading nhưng page nghiệp vụ sâu vẫn là placeholder có trạng thái empty. | Bước 07 chỉ dựng design system/layout; auth/gameplay/report thật thuộc các prompt sau. |
| D-026 | Thêm `lucide-react` cho icon UI. | Đáp ứng yêu cầu dùng Lucide thay vì phụ thuộc CDN icon bên ngoài. |
| D-027 | FE auth giữ CSRF token trong memory và tự refetch sau các thao tác regenerate session. | Tránh lưu token/PIN ở `localStorage` và khớp hợp đồng CSRF của backend. |
| D-028 | Login MVP chỉ có email/password; Google/Zalo/QR/SĐT không hiển thị khi backend chưa hỗ trợ. | Tránh tạo UX giả hoặc đường đăng nhập không hoạt động. |
| D-029 | Auth route guards dùng `/auth/me` làm nguồn mode/currentChildId và xóa private query cache khi logout/chuyển child. | Backend vẫn là authority cho ownership; tránh lộ dữ liệu private giữa các hồ sơ trẻ. |
| D-030 | Progress overview trả thêm `letters[]` gồm `letterId/state/evidenceCount` để FE lọc chữ mastered. | Filter completed phải dựa DB/backend, không suy đoán từ click hoặc state cục bộ. |
| D-031 | Alphabet page pause phiên sau khi câu hỏi kết thúc hoặc đóng card. | Backend chỉ cho một active session/child; pause giải phóng phiên để bé chọn chữ khác mà không reset lịch sử. |
| D-032 | Guest `/hoc-thu` dùng cùng AlphabetPage nhưng tắt progress/session/reward mutations. | Cho xem published letters mà không tạo dữ liệu cá nhân hay ví thưởng. |
| D-033 | Parent dashboard dùng report endpoints child-scoped và query key chứa `childId`; các tab mới cùng render một dashboard thay vì tạo page giả. | Tránh flash dữ liệu giữa hồ sơ trẻ và giữ mọi số liệu dựa MongoDB/backend. |
| D-034 | Reward page giữ idempotency key theo vòng đời mutation cho từng reward và chỉ cập nhật ví sau response backend. | Chống double click/retry làm trừ ví hai lần, đồng thời không hiển thị sở hữu giả khi request pending/error. |
| D-035 | Prompt 15 giữ server recording upload disabled khi `ENABLE_SERVER_RECORDINGS=false`. | Không nhận file khi chưa có private storage, authorized streaming và media validator/ffprobe an toàn. |
| D-036 | FE audio fallback chỉ dùng device vi-VN TTS sau user click và ghi rõ là giọng thiết bị. | Seed hiện chưa có audio biên tập 3 miền; không gán TTS thành giọng Bắc/Trung/Nam giả. |
| D-037 | Roleplay recorder là local preview trước, giới hạn 15 giây và cleanup mic/object URL khi rời trang. | Consent/upload là backend authority; không tự mở mic, không gửi email/Zalo/link public. |
| D-038 | Không bật SpeechRecognition trong bước 15. | Recording consent không đồng nghĩa consent gửi voice đến provider cloud hay chấm phát âm từ transcript. |
| D-039 | Admin UI bước 16 dùng registry tỏ tường và editor theo field cho từng loại học liệu. | Tránh biến admin thành một textarea JSON duy nhất; JSON chỉ dùng phụ trợ cho mảng scene/options/coordinates cần cấu trúc. |
| D-040 | `content_audits` chỉ lưu actorId/action/resource/version/status/reviewStatus/time. | Admin cần vết kiểm toán publish/archive/upload nhưng không ghi email, password, PIN hay PII trẻ. |
| D-041 | `/api/v1/admin/summary` chỉ tổng hợp content namespace và recent audit. | Admin prompt 16 không mở toàn bộ hồ sơ trẻ; parent/child data vẫn qua parent gate/ownership riêng. |
| D-042 | Admin upload vẫn dùng file local allowlist do server kiểm tra, không nhận remote URL tùy ý. | Worksheet/PDF/audio/asset thiếu phải bấm upload file thật; UI không tạo nút download/publish giả. |
| D-043 | Prompt 17 chọn module Speech capability vì nối trực tiếp với recorder bước 15 và không cần credential để dựng interface OFF. | Người dùng chưa yêu cầu OAuth/QR/wheel cụ thể; bật nhiều dịch vụ cùng lúc sẽ tạo UI/provider giả. |
| D-044 | Speech provider mặc định OFF; `pronunciationScore` luôn `null` cho đến khi có provider đánh giá tiếng Việt được kiểm chứng. | Không lấy confidence/transcript/browser ASR làm điểm phát âm, không thưởng và không tính mastery từ speech. |
| D-045 | Browser SpeechRecognition chỉ được detect để báo khả năng thiết bị, không tự bật hay gửi giọng nói. | Một số implementation có thể gửi voice tới provider cloud; cần consent riêng và cấu hình server trước. |

## Ghi chú bước 17

- Thêm `SpeechAttempt` model để chuẩn bị lưu bằng chứng speech sau này, nhưng chưa ghi attempt khi provider chưa sẵn sàng.
- API `/children/:childId/speech/capability` trả trạng thái feature flag, provider, consent, timeout/backoff và `pronunciationScore: null`.
- API `/children/:childId/speech/assess` có rate limit và trả `CONSENT_REQUIRED`/`PROVIDER_UNAVAILABLE`; không gọi provider giả, không cấp reward.
- Parent safety panel hiển thị trạng thái speech OFF và browser capability detection; không hiện phần trăm phát âm.
- OAuth, QR trusted device, password reset/email và lucky wheel vẫn chưa bật vì chưa có yêu cầu/provider/credential/test độc lập.

## Ghi chú bước 16

- `/admin` hiển thị dashboard thật từ `/api/v1/admin/summary`: số lượng content theo registry, trạng thái draft/published/missing và audit gần nhất.
- `/admin/hoc-lieu`, `/admin/bien-tap`, `/admin/tai-len` dùng cùng `AdminSectionPage` nhưng registry riêng cho content, editor, catalog và upload.
- Editor có form field riêng cho letters, tones, vocabulary, spelling, exercises, stories, resources, rewards, badges, missions; exercise preview không hiển thị answer.
- Publish/archive có confirm UI, backend ghi audit và phân biệt content `status` với catalog `active`; resource PDF missing bị chặn publish bằng `RESOURCE_NOT_READY`.
- Import seed JSON có preview/conflicts nâng cao và browser E2E CRUD->learner snapshot chưa xong trong bước này nên trạng thái để PARTIAL.

## Ghi chú bước 15

- `AudioProvider` quản lý một narration stream, dừng khi tab ẩn/pagehide và khi child layout đổi route/child.
- Story player có nút đọc cảnh: ưu tiên audio asset nếu DTO báo available, còn seed hiện null thì chỉ fallback TTS thiết bị nếu browser có voice `vi-VN`.
- `RecordingPanel` dùng `getUserMedia` + `MediaRecorder` trên HTTPS/localhost, hiển thị trạng thái đang thu, tự dừng sau 15 giây, preview/discard local và không tự gửi.
- API `/children/:childId/recordings/capability` và `/children/:childId/recordings` trả capability/inbox thật; upload trả `PROVIDER_UNAVAILABLE` khi server recording chưa bật.
- Upload file thật, streaming riêng tư, xác minh codec/duration và cleanup file vẫn là blocker vì chưa có storage/ffprobe trong workspace.

## Ghi chú bước 14

- `/be/phan-thuong` dùng `RewardsPage` để đọc catalog, wallet, inventory, badges, missions và reward ledger từ API thật.
- `ChildLayout` query wallet theo `currentChildId` và truyền vào `AcornCounter`; đổi child làm đổi query key ví.
- Redeem hiển thị confirm, gửi `rewardId` + `idempotencyKey`, không optimistic trừ ví; success/error đều refetch wallet/inventory/ledger để xử lý race hai tab.
- Equipped cosmetic chỉ là phụ kiện hiển thị trên portrait, không thay đổi chức năng học; item thiếu asset dùng icon/CSS nội bộ thay vì remote art.
- Level/growth trên hero lấy `masteredLetters/growthStage` từ progress backend, không dùng số dư hạt dẻ.

## Ghi chú bước 13

- `/phu-huynh` dùng `ParentDashboardPage` mới với child picker, KPI, cây tăng trưởng, bảng nhận diện, lịch sử attempt, cài đặt giới hạn/nghỉ và khu tài nguyên/export.
- Backend report overview trả thêm `vocabPracticed`, `activeSecondsToday`, `dailyLimitSeconds`, `growthStage` theo mốc docs/02 và `recognitionAccuracy: null` khi chưa có attempt.
- Report `/children/:childId/reports/*` yêu cầu parent gate; child mode vẫn chỉ xem progress/wallet/missions đúng `currentChildId`.
- Settings daily limit/break/volume/dialect gọi `PATCH /children/:childId/settings`; UI xác nhận trước khi lưu và invalidate report/child cache theo childId.
- PDF tài nguyên và inbox ghi âm vẫn disabled với lý do rõ vì seed/resource/audio tương ứng chưa ready; export JSON dùng API parent gate và không xuất secret.

## Ghi chú bước 09

- `/be/bang-chu-cai` và `/be/bang-chu-cai/:symbol` dùng `AlphabetPage` để hiển thị grid 29 chữ, filter all/vowel/consonant/mastered, detail chữ và phiên học nhận diện.
- `/hoc-thu` dùng cùng UI ở chế độ guest; chỉ gọi content public và không gọi progress, wallet, session hoặc answer mutation.
- FE tách query content letters/detail khỏi query child progress/wallet; query key private chứa `childId`.
- Câu hỏi nhận diện được cấp qua `POST /learning/sessions`; câu trả lời chỉ gửi `optionId`, sau response invalidate progress/wallet.
- Audio button chỉ báo availability; seed hiện thiếu audio nên không phát âm thanh và không mở mic.

## Ghi chú bước 10

- `/be/ghep-van` dùng `SpellingPage` với React state cho 3 slot âm đầu/vần/thanh; token hỗ trợ kéo thả, bấm chọn và phím Enter/Space.
- FE lookup chỉ dùng các tổ hợp published từ `/spelling-entries`; không tự ghép dấu Unicode hay tạo từ ngoài dataset.
- Quick quiz mở session `type=spelling` qua backend, submit `optionId` và chỉ hiển thị reward/wallet từ response API.
- Backend cập nhật `childProgress` cho spelling entry khi submit answer, cùng transaction với attempt/reward.
- Audio theo giọng Bắc/Trung/Nam chỉ hiển thị availability; seed hiện thiếu audio nên UI báo chưa có file thay vì phát giả.

## Ghi chú bước 11

- `/be/truyen` và `/be/truyen/:slug` dùng `StoryPage` để đọc 2 truyện published từ `/stories`, filter theo category/age, mở player cảnh, hotspot và panel từ mới.
- Story player mở session `type=story`, ack từng scene đúng thứ tự qua backend, submit câu hỏi kết thúc bằng `optionId`, rồi gọi complete để backend cấp thưởng story một lần.
- Scene thiếu ảnh dùng fallback card có nhãn; audio seed đang thiếu nên UI dùng chế độ đọc chữ và không chạy timer hoặc âm thanh giả.
- Hotspot vừa là button đặt theo tọa độ x/y trên khung cảnh, vừa có danh sách từ mới để dùng keyboard/accessibility.
- Roleplay/recording hiển thị preview disabled với lý do rõ vì bước 15 chưa bật audio/recording.

## Ghi chú bước 12

- `/be/do-vui` dùng `QuizPage` và `useGameEngine` với state idle/loading/question/submitting/feedback/completed/error.
- Quiz session được mở bằng `type=quiz` + `gameType`; backend chọn 5 exercise published, gắn `contentId` nội bộ theo bài đầu tiên và trả `questions[]` sanitized.
- `question` cũ vẫn được giữ để không phá alphabet/spelling/story; `questions[]` dùng cho round 5 câu và resume.
- Frontend chỉ gửi `optionId`, `attemptNo`, `idempotencyKey`; feedback, ví hạt dẻ và thưởng lấy từ backend, không có `randomCorrect`/`data-correct`.
- Với game nghe, seed chưa có audio nên UI ghi rõ text-assisted mode và submit responseMode text; LuckyWheel vẫn ẩn đến bước 17.

## Ghi chú bước 08

- FE thêm `LoginPage`, `SignupPage`, `ChildProfilePicker`, `PinGate` và `SettingsPage` bằng React Hook Form + Zod.
- Axios bật `withCredentials`, tự gắn `X-CSRF-Token` cho mutation và chuyển server envelope/error thành thông báo tiếng Việt ở form.
- Signup gửi parent/child/consent thật tới backend; wallet chào mừng lấy từ response 201 thay vì hardcode.
- Child picker lấy `/auth/family-profiles`, không dùng tên trẻ mẫu hardcoded; enter-child gửi đúng `childId` và symbol PIN nếu người dùng nhập đủ.
- Route guards chặn private page ở trạng thái chưa biết phiên, yêu cầu child mode cho route học, yêu cầu parent gate cho route phụ huynh/admin, và clear cache khi logout.

## Ghi chú bước 06

- Learning API `/learning/sessions` cấp question snapshot riêng, heartbeat tính active seconds có cap 15s và bỏ gap offline >30s.
- Answer API chỉ nhận `optionId`, server kiểm tra attempt order tối đa 3 lần, tính đúng/sai và thưởng quiz trong transaction.
- Reward API đổi vật phẩm dùng conditional wallet update + ledger + inventory trong transaction; không để balance âm hoặc cấp trùng item.
- Reports trả `recognitionAccuracy: null` khi chưa có attempt, tách seen/mastered và recommendation chỉ là gợi ý luyện chữ, không chẩn đoán.
- Script `db:rebuild-aggregates` rebuild daily aggregate theo child khi cần vận hành/sửa dữ liệu.

## Ghi chú bước 05

- Public APIs: `/letters`, `/tones`, `/vocabulary`, `/spelling-entries`, `/lessons`, `/stories`, `/resources`.
- `/lessons` cần auth; child mode tự áp `ageBand` từ current child, parent có thể truyền query `ageBand`.
- `/resources/:id/download` yêu cầu parent gate và trả `RESOURCE_NOT_READY` khi PDF/file chưa ready.
- Admin registry explicit gồm letters, tones, vocabulary, spelling-entries, lessons, exercises, stories, rewards, reward-catalog, badges, missions, resources, assets.
- Admin upload raw chỉ nhận PNG/JPEG/SVG/audio/PDF allowlist, giới hạn 5MiB; SVG có script/event handler/javascript bị từ chối.

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

## Ghi chú bước 18

- QA integration dùng database có tên `vuon_chu_test_*`, tạo indexes trước concurrency test và chạy tuần tự khi cần để tránh module/env singleton giữa các suite; không dùng database production.
- Bước 18 chỉ đánh dấu PASS cho những lệnh đã có kết quả thực tế. Browser E2E/visual, audio thật, PDF, recording storage và provider mở rộng giữ BLOCKED/NOT RUN khi môi trường chưa có.
- Các claim marketing không có dữ liệu chứng minh bị loại khỏi UI; số trong schema chỉ còn ở vai trò giới hạn kỹ thuật.

## Ghi chú bước 19

- Chọn Docker Compose private/local production với Nginx static + `/api` reverse proxy + Express + Mongo replica set. Không public deploy hoặc ép Express upload vào static hosting.
- React production dùng basename `/vuon-chu/`; Nginx chỉ SPA-fallback dưới path này và để API 404 đi qua Express trả JSON.
- Production bắt buộc Mongo readiness trước khi tạo app/session store, `ALLOW_UNREVIEWED_DEMO_CONTENT=false` và recordings OFF cho đến khi có object storage/validator thật.
