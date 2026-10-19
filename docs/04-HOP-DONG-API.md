# 04 — Hợp đồng REST API

Base `/api/v1`. Body JSON UTF-8, mọi text Việt NFC. `_id` serialize thành `id` string; không trộn `_id` ở FE. Timestamp ISO8601 UTC. DayKey `YYYY-MM-DD` theo Asia/Ho_Chi_Minh do BE tính. Queries phải encode symbol (Ă, Đ, Ơ...). API không tự giả có dữ liệu khi MongoDB offline.

## Envelope và bảo mật

Success `{data: ..., meta?: {page,limit,total}, requestId}`. Error `{error:{code,message,details?},requestId}`. Danh sách dùng `data.items`. Pagination page>=1, limit 1..50. Error messages an toàn bằng tiếng Việt; stack chỉ ở log server đã redact.

Cookie session HttpOnly, credentials được bật ở Axios. `GET /auth/csrf` tạo anonymous session nếu cần, trả token; mọi POST/PATCH/PUT/DELETE có `X-CSRF-Token` và Origin hợp lệ. Sau regenerate/session mode change, FE refetch token. GET không mutation. Cookie Secure production, sameSite=Lax khi cùng site; nếu chọn cross-site phải thiết kế lại CORS/cookie/CSRF trong bước 19.

Quyền: PUB=công khai; AUTH=session gia đình/admin; CHILD=child mode currentChildId; PARENT=parent mode+PIN gate còn hạn+ownership; ADMIN=admin+gate. Các endpoint `/children/:childId/...` luôn scope parent ownership hoặc currentChildId, không chỉ kiểm tra id tồn tại.

## Auth và gia đình

| Method + path | Quyền | Request/response trọng tâm |
|---|---|---|
| GET `/health/live` | PUB | Liveness; không phụ thuộc MongoDB |
| GET `/health/ready` | PUB | Readiness; 503 khi DB/index/topology chưa sẵn sàng, không lộ URI |
| GET `/auth/csrf` | PUB | `data.csrfToken` |
| POST `/auth/register` | PUB+CSRF | `{parent:{displayName,email,password,pin},child:{nickname,ageBand,dialect,mascotKey},consent:{termsAccepted:true,termsVersion}}`; 201 parent DTO+child DTO; tạo session và welcome50 |
| POST `/auth/login` | PUB+CSRF | `{email,password,rememberMe}`; 200 user DTO, mode=parent, gate closed; TTL 12h hoặc 7 ngày |
| GET `/auth/me` | AUTH | `{user:{id,role,displayName},mode,currentChildId,parentGateExpiresAt}`; child mode không trả email/settings bí mật |
| GET `/auth/family-profiles` | AUTH | `{items:[{id,nickname,ageBand,mascotKey}]}` thuộc phiên; không public |
| POST `/auth/enter-child` | AUTH | `{childId,symbolPin?:['apple','leaf','star','bird']}`; verify nếu đã cài symbol PIN, regenerate thành child mode; bắt buộc child thuộc userId |
| POST `/auth/parent-gate` | AUTH | `{pin}`; 200 mode=parent, gateExpiresAt; lockout khi thử sai; child mode được gọi để trở về parent |
| POST `/auth/close-parent-gate` | AUTH | Đóng gate; mode parent chưa mở; không giữ route phụ huynh |
| POST `/auth/logout` | AUTH | 204 destroy session, clear cookie/cache và audio |
| PATCH `/auth/password` | PARENT/ADMIN | `{currentPassword,newPassword}`; bump authVersion, revoke sessions |
| PATCH `/auth/pin` | PARENT/ADMIN | `{currentPin,newPin,currentPassword}`; hash mới, revoke gate |
| GET/POST `/children` | PARENT | List đầy đủ/create child; tối đa5; tạo thêm không nhận welcome50 |
| GET/PATCH/DELETE `/children/:childId` | PARENT | DTO/create fields allowed; DELETE 202 khi cleanup đang chạy hoặc 204 khi hoàn tất |
| PATCH `/children/:childId/settings` | PARENT | `{dailyLimitMinutes,breakEveryMinutes,breakSeconds,ambienceEnabled,volume,dialect}`; ranges theo docs/02 |
| PUT `/children/:childId/voice-consent` | PARENT | `{recordingEnabled,cloudProcessingEnabled,consentVersion}`; explicit consent, không bật qua register mặc định |
| GET `/children/:childId/export` | PARENT | JSON export không chứa secret |

MVP login bằng email. Ô phone trong mẫu chuyển thành tùy chọn contact chưa có gửi tin; không hiển thị “đăng nhập SĐT” nếu chưa làm xác minh. Quên mật khẩu để bước17, MVP có hướng dẫn liên hệ phụ huynh/quản trị và không toast reset thành công giả.

## Học liệu và học tập

| Method + path | Quyền | Nội dung |
|---|---|---|
| GET `/letters?group=all|vowel|consonant` | PUB | Published items, progress không ghép ở public DTO |
| GET `/letters/:symbol` | PUB | Chi tiết chữ, ví dụ, audio availability và teachingNote |
| GET `/tones` | PUB | 6 thanh |
| GET `/vocabulary?category=&q=&page=&limit=` | PUB | Published list; q bounded, escape regex hoặc text search |
| GET `/spelling-entries?onset=&rime=&tone=` | PUB | Tổ hợp cho phép; không ghép tùy ý ngoài data |
| GET `/lessons?module=&ageBand=` | AUTH | Published lessons; ageBand lấy profile khi CHILD |
| GET `/stories?category=&ageBand=&page=&limit=` | PUB | Metadata published |
| GET `/stories/:slug` | PUB | Scenes, hotspots, từ mới; không trả answer kết thúc |
| GET `/resources` | PARENT | Ready/published resources |
| GET `/resources/:id/download` | PARENT | Stream file PDF tồn tại; 404 RESOURCE_NOT_READY khi missing |
| GET `/children/:childId/progress` | CHILD/PARENT | Progress thật; childId đúng scope |
| POST `/learning/sessions` | CHILD | `{type,contentId,gameType?}`; type `alphabet|spelling|story|quiz`; trả `{id,question?,sceneIds?,policy}`; server cấp câu hỏi/snapshot |
| POST `/learning/sessions/:id/heartbeat` | CHILD | `{seq}`; trả `{activeSeconds,dailySeconds,remainingSeconds,breakRequired}`; timestamp BE |
| POST `/learning/sessions/:id/pause` | CHILD | 200 session paused; không cộng thời gian |
| POST `/learning/sessions/:id/resume` | CHILD | Check limits/no other active; reset lastHeartbeatAt |
| POST `/learning/sessions/:id/answers` | CHILD | `{exerciseId,attemptNo,response:{optionId},idempotencyKey}`; server xác minh câu thuộc snapshot; trả `{attemptId,isCorrect,feedback,nextAttemptNo,rewardGranted,wallet,nextQuestion?}` |
| POST `/learning/sessions/:id/scenes/:sceneId/ack` | CHILD | `{idempotencyKey}`; scene thuộc truyện+đúng thứ tự |
| POST `/learning/sessions/:id/complete` | CHILD | `{idempotencyKey}`; check evidence; 200 state/progress/reward; không nhận completed=true |

Không có GET public `/exercises` trả answer. Admin endpoint có answer; learner chỉ nhận sanitized question DTO qua session. Không nhận `childId` trong answer để chuyển sang con khác. Không client chọn exercise ngoài snapshot. GameType: `apple-quiz→identify-letter`, `butterfly-rime→match-rime`, `frog-word→listen-word`, `tone-maze→select-tone`, `forest-sounds→listen-animal`.

## Reward và báo cáo

| Method + path | Quyền | Nội dung |
|---|---|---|
| GET `/children/:childId/wallet` | CHILD/PARENT | `{balance,earnedTotal,spentTotal}` |
| GET `/children/:childId/reward-ledger?page=&limit=` | CHILD/PARENT | Ledger thuộc con, eventKey không lộ secret |
| GET `/rewards` | AUTH | Active catalog |
| GET `/children/:childId/inventory` | CHILD/PARENT | Items và equipped |
| POST `/children/:childId/redeem` | CHILD | `{rewardId,idempotencyKey}`; wallet transaction; 409 already owned/insufficient |
| PATCH `/children/:childId/inventory/:itemId/equip` | CHILD | `{equipped:true}`; type exclusivity |
| GET `/children/:childId/badges` | CHILD/PARENT | Awarded + available definitions |
| GET `/children/:childId/missions` | CHILD/PARENT | Ngày BE, progress/elegibility/claimed |
| POST `/children/:childId/missions/:missionId/claim` | CHILD | `{idempotencyKey}`; BE check evidence và chống claim lặp |
| GET `/children/:childId/reports/overview?from=&to=` | PARENT | letters mastered/seen, vocab practiced distinct, activeSecondsToday, streak, recognitionAccuracy, growthStage, recommendations[] |
| GET `/children/:childId/reports/daily?from=&to=` | PARENT | Daily time và số exercise lần đầu; range max90 ngày |
| GET `/children/:childId/reports/attempts?page=&limit=` | PARENT | History sanitized; tên bài và đúng/sai |

RecognitionAccuracy=correct first tries / all first tries ×100; 0 denominator→null, FE “Chưa có dữ liệu”. Vocab count chỉ từ bài tập hoàn tất có vocabularyId, không bịa 86 từ. Streak=ngày liên tiếp có attempt hợp lệ; ngày hôm nay chưa học vẫn tính chuỗi kết thúc hôm qua. Recommendations dựa lỗi nhận diện, không chẩn đoán phát âm. Report schema không dùng `pronunciationAccuracy` ở MVP.

## Audio/recordings — bước15

| Method + path | Quyền | Nội dung |
|---|---|---|
| GET `/media/:assetKey` | PUB khi public lesson asset | Stream audio/image/pdf public đúng allowlist; không dùng cho recording |
| POST `/children/:childId/recordings` | CHILD+consent | Multipart `file,storyId,roleKey,idempotencyKey`; max15s/5MiB; verify real codec/duration; 201 metadata private inbox |
| GET `/children/:childId/recordings` | PARENT | Inbox con của mình |
| GET `/children/:childId/recordings/:id/audio` | PARENT | Stream sau ownership/gate; child chỉ nghe preview local chưa gửi |
| DELETE `/children/:childId/recordings/:id` | PARENT | Xóa file và metadata; cleanup retry nếu lỗi |

Không public path cho recordings. Chưa có object storage production thì feature server-recording=false, preview cục bộ có thể chạy khi consent; “Gửi ba mẹ” disabled và giải thích rõ.

## Speech optional — bước17

| Method + path | Quyền | Nội dung |
|---|---|---|
| GET `/children/:childId/speech/capability` | CHILD/PARENT | Trả feature flag/provider/consent/timeout/backoff; `pronunciationScore=null` khi chưa có provider kiểm chứng |
| POST `/children/:childId/speech/assess` | CHILD+consent | Stub có rate limit; trả `CONSENT_REQUIRED` hoặc `PROVIDER_UNAVAILABLE` khi provider OFF/chưa cấu hình |

Browser SpeechRecognition không tự bật. Transcript matcher giữ NFC/dấu tiếng Việt và chỉ dùng cho feedback lời nhận diện, không tạo điểm phát âm hay reward.

## Admin — content only

`/admin/:resourceType` resourceType allowlist: letters, tones, vocabulary, spelling-entries, lessons, exercises, stories, rewards, badges, missions, resources, assets.

| Method + path | Quyền | Nội dung |
|---|---|---|
| GET `/admin/:resourceType` | ADMIN | Filter status/search/pagination |
| POST `/admin/:resourceType` | ADMIN | Validated create draft; schema theo resourceType |
| GET `/admin/:resourceType/:id` | ADMIN | Full content DTO; answer chỉ ở exercise DTO |
| PATCH `/admin/:resourceType/:id` | ADMIN | Update draft/versioned; whitelist không mass assign |
| POST `/admin/:resourceType/:id/publish` | ADMIN | Review approved+references/assets ready nếu là audio/PDF bắt buộc |
| POST `/admin/:resourceType/:id/archive` | ADMIN | Soft archive, không phá snapshot |
| POST `/admin/assets/upload` | ADMIN | Multipart ảnh/audio/PDF; giới hạn type/size; SVG chỉ allowlisted sanitized, không chấp nhận script |

UI không dùng một endpoint chung để gọi tên collection MongoDB tùy ý. Backend có registry module explicit và validation tách riêng. Không quản trị tài khoản trẻ toàn hệ thống trong scope MVP.

## Mã lỗi tối thiểu

400 VALIDATION_ERROR / INVALID_COMBINATION; 401 UNAUTHENTICATED; 403 FORBIDDEN / PARENT_GATE_REQUIRED / CONSENT_REQUIRED / CSRF_INVALID; 404 NOT_FOUND / RESOURCE_NOT_READY; 409 EMAIL_EXISTS / IDEMPOTENCY_CONFLICT / REWARD_ALREADY_OWNED / INSUFFICIENT_ACORNS / SESSION_CONFLICT / INVALID_SESSION_STATE; 413 FILE_TOO_LARGE; 422 AUDIO_INVALID; 429 RATE_LIMITED / PIN_LOCKED / DAILY_LIMIT_REACHED; 503 DB_NOT_READY / PROVIDER_UNAVAILABLE.

## Ví dụ trả lời quiz

```json
{
  "data": {
    "attemptId": "<ObjectId>",
    "isCorrect": true,
    "feedback": "Bé tìm đúng chữ rồi!",
    "nextAttemptNo": null,
    "rewardGranted": 5,
    "wallet": {"balance": 55, "earnedTotal": 55, "spentTotal": 0},
    "nextQuestion": null
  },
  "requestId": "<request-id>"
}
```

HTTP retry cùng idempotencyKey phải trả cùng kết quả và số tiền thực đã cấp; không cấp thêm. Cùng business event nhưng requestKey mới có thể trả rewardGranted=0 vì thưởng đã nhận.
