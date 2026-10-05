# 07 — Seed, dữ liệu và vận hành

## Nội dung seed

JSON trong `data/seed` là payload nguồn, importer bước03 chuyển thành Mongoose docs. Mỗi mục có key/version/status/reviewStatus; nhiều mục published trong DEMO, nhưng reviewStatus needs_review. Cần cờ `ALLOW_UNREVIEWED_DEMO_CONTENT=true` và `NODE_ENV!=production` để sử dụng. Khi production importer phải giữ chúng draft trừ khi đã review approved.

29 letters,6 tones,24 vocabulary,24 spellingEntries,12 exercises,5 lessons,2 stories,4 rewards,4 badges,3 missions,2 resources. Asset manifest8 mục có file thực; 4 PNG preview icon có sẵn trong folder nhưng không là media registry riêng. Không có file audio/PDF hoặc ảnh từng từ/truyện được đảm bảo local.

Tất cả audioAssetKeys null; thiếu audio thể hiện availability chứ không tạo `/audio/a.mp3` giả. Resources draft/missing với assetKey=null; gọi download trả RESOURCE_NOT_READY. Hai truyện seed tự viết ngắn, có3 scene và câu kết thúc, không sao chép nguyên nội dung sách thương mại. Nội dung vẫn cần rà sư phạm và độ tuổi trước xuất bản.

## Importer cần thực hiện

1. Validate toàn bộ JSON và manifest, duplicate key, cấu trúc, NFC, counts, alphabet order, nhóm12/17,6 thanh, options answer, references.
2. Bảo đảm topology/indexes sẵn sàng; DB seed riêng xác định rõ trong env.
3. Upsert theo key với content source, không dùng dropDatabase/deleteMany toàn DB. Khi source version thấp hơn DB thì không ghi đè. Version bằng nhưng draft chỉnh tay đã thay đổi: report conflict thay vì ghi đè âm thầm; force-content phải opt-in.
4. Import order: assets→letters/tones→vocabulary→spellingEntries→exercises→lessons/stories→rewards/badges/missions/resources.
5. Resolve `letterKeys`, `vocabularyKey`, `spellingEntryKey`, `exerciseKeys`, `endingExerciseKey` sang ObjectId ở BE; ghi mapping summary. Chỉ collection content trong manifest được seed sửa. Không reset user/session/progress/wallet.
6. Preview `--dry-run` và report inserted/updated/unchanged/conflicted/skipped/missing-assets. Các mục missing có thể import draft; không export một pretend URL.

Các bài tập seed chỉ bao phủ một số chữ, không giả mastery29 chữ. Bước03 phải mở rộng exercises thành tối thiểu2 identify-letter khác nhau cho từng chữ (58), rà đáp án/target letter. Với chữ có dấu kết hợp, bài nhận diện dùng glyph base rõ ràng, không hỏi nhập chữ tự do ở MVP.

## Tài khoản demo

Seed nội dung không có user thật. Script riêng `db:demo` yêu cầu DEMO_PARENT_PASSWORD và DEMO_PARENT_PIN qua env, tạo demo@example.test có thể đổi email; hash trước ghi. Script `admin:create` yêu cầu ADMIN_EMAIL/PASSWORD/PIN, role do server đặt; không cấp quyền admin qua register. Không commit password cố định hoặc PIN “1234” làm production fallback.

## DB môi trường

MONGODB_URI nằm ở `apps/api/.env`; `vuon_chu_dev`, `vuon_chu_test`, `vuon_chu_prod` tách nhau. Local dùng replica set đã init hoặc Atlas thích hợp; kiểm tra transaction thực tế. Test không chạy khi database name giống production. Migration indexes có dry-run, không drop unique index vì phát hiện dữ liệu trùng.

## Local file và production storage

Public images đi cùng FE build, public audio/PDF có asset registry. Private recordings nằm ngoài public folder, chỉ stream qua authorized route. Production bắt buộc storage private bền vững; nếu hosting disk tạm thời, không bật upload local. Set recording flag false đến khi có storage/cleanup configuration. Không dùng MongoDB làm bucket file audio.

## Biến môi trường

Mẫu ở `starter/api.env.example` và `starter/web.env.example`; copy sau bước01 thành `.env.example` đúng app và `.env` local. Dùng secret ngẫu nhiên riêng; placeholder không phải giá trị hợp lệ. `SESSION_SECRET` được kiểm tra đủ mạnh khi startup. `TRUST_PROXY` cấu hình theo topology hosting, không bật số hop vô điều kiện.

## Logs, backup và cleanup

Log requestId/status/latency, không log raw credentials/audio/PII. Job expire idle sessions mỗi phút; cleanup recording mặc định7 ngày, xóa file trước metadata và retry failures; timezone cho report VN. Backup database với công cụ/provider đã chọn, kiểm tra restore vào DB test. Quy trình backup lưu private files đồng bộ với metadata. Không bật sending email/Zalo nếu chưa có opt-in và provider hợp lệ.
