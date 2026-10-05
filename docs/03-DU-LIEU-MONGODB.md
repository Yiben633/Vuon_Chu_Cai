# 03 — Thiết kế MongoDB

Đây là đặc tả model để AI tạo Mongoose schemas, không phải database đã được tạo. Mọi collection dùng ObjectId `_id` và timestamps UTC. Khóa `key` trong seed là khóa import bền vững, không phải ObjectId. Các reference `...Key` phải được importer resolve sang `...Id`.

## Collections tài khoản và phiên

| Collection | Fields chính | Index/quy tắc |
|---|---|---|
| users | emailNormalized, displayName, passwordHash, parentPinHash, role `parent|admin`, status `active|deleting|disabled`, consent `{termsVersion,acceptedAt}`, authVersion | unique emailNormalized; hash select:false; phone optional, chưa dùng đăng nhập SĐT MVP |
| childProfiles | parentId→users, nickname, ageBand, dialect `north|central|south`, mascotKey, symbolPinHash optional, settings `{dailyLimitMinutes,breakEveryMinutes,breakSeconds,ambienceEnabled,volume}`, voiceConsent `{recordingEnabled,cloudProcessingEnabled,version,acceptedAt}`, deletedAt | parentId+createdAt; nickname 1–30; không cần họ tên thật/ngày sinh chính xác; max 5 con/parent |
| sessions | sessionId + session JSON do connect-mongo quản lý, expires | TTL theo store; không tự ghi collection này bằng controller |
| pinAttempts | userId, purpose, failures, blockedUntil, expiresAt | unique userId+purpose; TTL expiresAt; lockout lưu BE |

MVP không có collection tài khoản trẻ độc lập. Parent session vẫn phải kiểm tra PIN gate trước báo cáo. Sessions cần gắn authVersion để logout-all/password change có hiệu lực ngay, không chờ TTL.

## Collections nội dung

Nội dung có `key`, `version>=1`, `status=draft|published|archived`, `reviewStatus=needs_review|approved`, `title`, `ageBands`. Chỉ admin quản lý; learner chỉ thấy published phù hợp tuổi. Trong demo local có thể publish needs_review qua opt-in có nhãn demo; production yêu cầu approved.

| Collection | Fields chính | Index/quy tắc |
|---|---|---|
| letters | key, symbol, lowerSymbol, order, group, letterName, example `{text,targetOffset,targetLength,baseSymbol,note}`, imageAssetKey nullable, audioAssetKeys `{north,central,south}` nullable, teachingNote | unique symbol, unique key, group+order; 29 chữ đúng, NFC |
| tones | key, code, name, marker, order, example | unique code/key; ngang marker rỗng; 6 bản ghi |
| vocabulary | key, word, meaning, category, syllables[], imageAssetKey, audioAssetKeys, letterKeys[], ageBands | unique key; word không unique vì có thể nhiều nghĩa |
| spellingEntries | key, onset, rime, toneCode, word, vocabularyId, audioAssetKeys, explanation | unique onset+rime+toneCode; allowed-combination lookup; onset có thể rỗng |
| lessons | key, module `alphabet|spelling|story|quiz`, contentKey, title, letterIds[], exerciseIds[], order, durationHintMinutes, ageBands | unique key; module+status+order |
| exercises | key, type, prompt, options `[{id,label,assetKey}]`, answer private, targetLetterId nullable, vocabularyId nullable, spellingEntryId nullable, difficulty, maxAttempts, ageBands, audioAssetKeys | unique key; type+status; answer select:false + explicit DTO; option id unique bên trong document |
| stories | key, slug, category, scenes `[{id,text,imageAssetKey,audioAssetKeys,hotspots:[{id,label,vocabularyId,x,y}]}]`, endingExerciseId, vocabularyIds[], moral, durationHintMinutes | unique slug/key; category+status; scene/hotspot IDs unique nội bộ; x/y 0..1 |
| resources | key, title, type `worksheet|flashcard|guide`, assetKey nullable, pageCount nullable, letterIds[], availability `missing|ready` | unique key; published bắt buộc ready và file hợp lệ |
| assets | key, kind `image|svg|audio|pdf`, localPath/objectKey, mimeType, sizeBytes, checksum, status `ready|missing|quarantined`, source, licenseStatus `unknown|verified` | unique key; URL build ở server từ đường dẫn cho phép; không nhận URL tùy ý của client |

Exercises MVP: `identify-letter`, `match-rime`, `listen-word`, `select-tone`, `listen-animal`. GameType FE ánh xạ các type này theo docs/04. Với nghe, thiếu audio không giả đang phát; dùng TTS thiết bị khi có hoặc hiện prompt chữ và ghi rõ dạng bài nhận diện hỗ trợ text, không đưa vào metric nghe.

Nội dung đã published không sửa answer tại chỗ khi có kết quả học: tăng version; snapshot phiên giữ phiên bản và câu hỏi/answer cần thiết ở server. Admin archive được, không xóa vật lý reference đang có kết quả. Snapshot private không trả ra client.

## Collections hành vi học

| Collection | Fields chính | Index/quy tắc |
|---|---|---|
| learningSessions | childId, type, contentId, contentVersion, status `active|paused|completed|expired`, startedAt, lastHeartbeatAt, lastHeartbeatSeq, activeSeconds, dayKey, questionSnapshots private, sceneAcks[], completedAt, expiresAt | partial unique childId khi status=active; childId+startedAt desc; không TTL xóa lịch sử báo cáo; job expire phiên idle >5 phút |
| attempts | childId, sessionId, exerciseId, contentVersion, attemptNo, idempotencyKey, response, isCorrect, responseMode `text|audio|image`, submittedAt, dayKey | unique sessionId+exerciseId+attemptNo; unique childId+idempotencyKey; childId+submittedAt; BE cấp attemptNo tiếp theo |
| childProgress | childId, contentType `letter|spelling|story|lesson`, contentId, contentVersion, state `seen|practicing|mastered|completed`, correctFirstTryExerciseIds[], lastPracticedAt, completedAt | unique childId+contentType+contentId+contentVersion; targetLetter riêng cập nhật từ attempt hợp lệ |
| dailyStats | childId, dayKey, activeSeconds, correctCount, attemptCount, completedStories, earnedQuizAcorns, lastActiveAt | unique childId+dayKey; tổng activeSeconds cập nhật atomically theo heartbeat; không lưu metric phát âm giả |

Attempts là bằng chứng chính. DailyStats và childProgress là dữ liệu tổng hợp, có script rebuild từ attempts/sessions khi cần. CorrectCount là số lần đúng **lần đầu**, denominator là số exercise đã thử lần đầu, nhằm tránh méo metric do retry. Retry lưu để xem lịch sử nhưng không cộng denominator mới.

## Collections gamification và ghi âm

| Collection | Fields chính | Index/quy tắc |
|---|---|---|
| wallets | childId, balance, earnedTotal, spentTotal | unique childId; integer >=0 |
| rewardLedger | childId, eventKey, kind `welcome|quiz|story|mission|redeem|spin`, delta, rewardId nullable, sourceId, sourceVersion, dayKey, requestHash optional, createdAt | unique childId+eventKey; append-only; ledger không bị seed reset |
| rewardCatalog | key, title, cost, cosmeticType, assetKey, active | unique key; integer cost>=0; chỉ vật phẩm ảo |
| inventory | childId, rewardId, acquiredAt, equipped | unique childId+rewardId; tối đa 1 equipped/type bằng service transaction |
| badges | key, title, rule `{metric,threshold}`, assetKey | unique key; rule metric enum được server hỗ trợ, không eval code từ data |
| childBadges | childId, badgeId, awardedAt, sourceKey | unique childId+badgeId |
| missions | key, title, rule `{metric,threshold}`, rewardAcorns, active | unique key; 3 mission mẫu; BE tính theo ngày |
| missionClaims | childId, missionId, dayKey, claimedAt | unique childId+missionId+dayKey |
| recordings (bước 15) | childId, storyId, roleKey, objectKey, mimeType, sizeBytes, durationSeconds, consentVersion, expiresAt, inboxState `new|listened`, status `ready|deleting` | childId+createdAt; không public; job cleanup file trước khi xóa metadata; max15s/5MiB |
| speechAttempts (bước 17) | childId, targetId, provider, status, transcript nullable, transcriptMatch nullable, pronunciationScore nullable, modelVersion nullable, consentVersion, recordedAt | score chỉ có khi provider thực sự hỗ trợ assessment; không lấy confidence làm điểm phát âm |

MVP đầy đủ có 25 collection nghiệp vụ + collection session store; `speechAttempts` chỉ thêm khi bước 17 bật. Có thể gộp pinAttempts vào cơ chế rate-limit store nếu vẫn giữ được lockout bền vững.

## Transactions và idempotency

- Registration: user + con đầu tiên + wallet + ledger welcome phải cùng transaction. Nếu trùng email rollback, không để user mồ côi.
- Submit answer: claim idempotencyKey → validate snapshot/attemptNo → insert attempt → update progress/dailyStats → grant reward nếu eligible → ledger + wallet → response. Tất cả cùng transaction. Retry duplicateKey trả kết quả đã commit; khác payload cùng key trả 409. Lưu request hash từ payload canonical.
- Redeem: kiểm tra item active/chưa sở hữu; insert event ledger; conditional update wallet `{balance:{$gte:cost}}`; insert inventory trong transaction. Hai request song song không được âm tiền hoặc cấp 2 item.
- Quiz eventKey gồm childId ngầm trong index, exerciseId/version/dayKey; story eventKey gồm storyId/version; welcome luôn một event. Request key chỉ chống lặp HTTP, business event key chống làm lại nội dung để farm thưởng.
- Heartbeat: seq tăng đơn điệu; transaction cập nhật session và dailyStats cùng delta server. Seq cũ trả số giây cũ, không cộng thêm.
- Không gửi email, upload file hoặc gọi AI ở bên trong transaction. Không Promise.all cho operations chung một Mongo session.

Môi trường cần Atlas/replica set hỗ trợ transaction. MongoDB standalone không phù hợp với workflow này. API startup kiểm tra topology/capability, fail với hướng dẫn cấu hình thay vì bỏ transaction âm thầm. Tạo unique indexes trước khi seed hoặc chạy integration test. Xử lý E11000 theo từng business case.

## Xóa và xuất dữ liệu

Parent mở gate có thể export JSON dữ liệu con; loại hash/session token, chỉ xuất dữ liệu thuộc mình. Delete child: mark deleting, khóa session, xóa private files/recordings trước metadata, xóa attempts/progress/stats/wallet/ledger/inventory/badges/claims; xóa profile sau cùng. Quy trình lặp lại an toàn, report pending khi file storage lỗi, không báo đã xóa hết sớm.

Nội dung published có thể public; voice recording luôn private. Không lưu audio binary/base64 trong document MongoDB; dùng storage file private ở development và object storage private ở production. Tắt ghi âm mặc định; việc không bật không cản học bằng nghe/nhìn.
