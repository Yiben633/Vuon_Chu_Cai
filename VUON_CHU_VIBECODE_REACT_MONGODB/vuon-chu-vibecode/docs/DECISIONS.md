# Quyết định kỹ thuật

Ngày lập: 06/10/2026. Các quyết định này áp dụng từ bước 00 cho đến khi có thay đổi được ghi rõ.

## Quyết định nền tảng

| Mã | Quyết định | Lý do |
|---|---|---|
| D-001 | Dùng npm workspaces với `apps/web`, `apps/api`, `packages/contracts`. | Phù hợp bộ prompt, tách FE/BE/contracts mà vẫn đơn giản cho MVP. |
| D-002 | FE dùng ReactJS + Vite + JavaScript/JSX. | Yêu cầu cố định, không dùng Create React App hoặc Next.js. |
| D-003 | BE dùng Node.js + Express ESM + Mongoose. | Yêu cầu cố định, REST API rõ ràng. |
| D-004 | Database là MongoDB replica set hoặc Atlas có transaction. | Workflows register, answer, redeem cần transaction thật. |
| D-005 | Session dùng `express-session` + `connect-mongo`; không thêm JWT song song cho MVP. | Cookie HttpOnly và server-side session hợp yêu cầu parent/child mode. |
| D-006 | Shared contracts dùng JavaScript + Zod, không kéo Mongoose vào FE. | Validate thống nhất, tránh leak tầng database sang frontend. |

## Quyết định bảo mật và quyền

| Mã | Quyết định | Lý do |
|---|---|---|
| D-007 | Backend là authority cho auth, ownership, mode, PIN gate, score, progress, rewards và time limits. | Chống sửa dữ liệu từ client. |
| D-008 | Mọi mutation dùng CSRF token và Origin check. | Cookie session cần bảo vệ CSRF. |
| D-009 | Parent gate TTL 10 phút, server kiểm tra ở từng endpoint PARENT/ADMIN. | FE route guard không đủ an toàn. |
| D-010 | PIN và password luôn hash; PIN attempts có lockout bền vững. | Không lưu secret dạng rõ, hạn chế brute force. |
| D-011 | Child không là user riêng; child là mode session với `currentChildId`. | Đúng docs/02 và giảm rủi ro tài khoản trẻ. |
| D-012 | Admin content CRUD dùng registry allowlist, không expose collection name tùy ý. | Tránh mass assignment và truy cập DB ngoài phạm vi. |

## Quyết định nội dung và dữ liệu

| Mã | Quyết định | Lý do |
|---|---|---|
| D-013 | Lấy PRD làm nguồn tuổi chính: 3-6, ageBand `3-4`, `4-5`, `5-6`. | Giải quyết xung đột DESIGN 4-8 và thẻ demo 5-8. |
| D-014 | Giữ 29 chữ, 12 nguyên âm, 17 phụ âm, 6 thanh gồm thanh ngang. | Theo docs/02 và seed validator. |
| D-015 | Ghép vần chỉ dựa trên `spellingEntries`, không ghép tùy ý ngoài data. | Bảo toàn tiếng Việt và tránh từ bịa. |
| D-016 | Unicode text chuẩn hóa NFC; không bỏ dấu khi chấm đáp án. | Cần đúng tiếng Việt. |
| D-017 | Nội dung seed `needs_review` chỉ dùng demo local khi bật `ALLOW_UNREVIEWED_DEMO_CONTENT=true` và không ở production. | Không xuất bản nội dung chưa duyệt. |
| D-018 | Import seed upsert theo `key`, không reset users/progress/wallet/recordings. | Seed phải lặp lại an toàn. |
| D-019 | Published content không sửa answer tại chỗ khi đã có kết quả học; tăng version. | Giữ snapshot học tập nhất quán. |

## Quyết định học tập và thưởng

| Mã | Quyết định | Lý do |
|---|---|---|
| D-020 | `seen` khi mở chữ, `practicing` khi luyện, `mastered` khi đúng lần đầu ở ít nhất 2 exercise nhận diện khác nhau. | Tránh coi bấm nghe là đã thuộc. |
| D-021 | Accuracy là first-try correct / first-try attempted; không có dữ liệu thì `null`. | Không bịa phần trăm. |
| D-022 | Reward ledger append-only, wallet balance = earnedTotal - spentTotal. | Dễ audit và chống âm tiền. |
| D-023 | Level tính theo số chữ mastered, không theo balance. | Đổi quà không làm tụt cấp. |
| D-024 | Idempotency dùng cả request key và business event key. | Chống retry HTTP và farm thưởng. |
| D-025 | Heartbeat dùng thời gian server và sequence number. | Không tin thời gian client. |

## Quyết định giao diện và tài nguyên

| Mã | Quyết định | Lý do |
|---|---|---|
| D-026 | Dùng screenshot/HTML làm tham chiếu layout, không nhúng iframe hoặc copy DOM script. | Chuyển thành React thật, dễ bảo trì. |
| D-027 | Không dùng screenshot toàn trang làm UI/background. | Tài nguyên reference chỉ để đối chiếu. |
| D-028 | Logo/mascot dùng `contain`; mascot PNG có nền vuông nên đặt trong khung phù hợp. | Không giả định cutout trong suốt. |
| D-029 | Bỏ hoặc ẩn số liệu marketing, compliance và AI accuracy chưa chứng minh. | Tránh tuyên bố sai. |
| D-030 | OAuth/QR/email/Zalo/lucky wheel để bước 17 hoặc P1/P2; MVP không toast thành công giả. | Chưa có dịch vụ/credential thật. |
| D-031 | Khi thiếu audio, dùng availability rõ ràng; TTS thiết bị chỉ là fallback nếu browser hỗ trợ. | Không tạo audio URL giả. |
| D-032 | PDF missing trả `RESOURCE_NOT_READY`, không 404 mơ hồ hoặc báo tải thành công. | Minh bạch trạng thái tài nguyên. |

## Mâu thuẫn nguồn đã chốt

- Tuổi: PRD 3-6 thắng DESIGN 4-8.
- Ví dụ chữ/từ sai trong demo HTML được thay bằng seed đã validate target letter.
- 5 dấu viết + thanh ngang được biểu diễn thành 6 thanh.
- Level, cây và ví tách riêng: level theo mastered, ví theo ledger, cây theo mốc progress.
- `128 hạt dẻ`, `24/29`, `92%`, `96.8%`, `120.000 bé`, `45.000 phụ huynh` là số demo, không dùng làm dữ liệu thật.
- Không tuyên bố chuẩn Bộ GD, COPPA/GDPR-K, an toàn 100% hoặc chẩn đoán phát âm chỉ vì code chạy.

## Vấn đề còn mở

- Node.js hiện có `v24.18.0`, npm `11.16.0`; bước 01 cần chọn dependency tương thích và commit lockfile.
- Cần MongoDB replica set/Atlas cho integration và transaction.
- Cần quyết định provider private storage trước khi bật server recordings production.
- Cần rà sư phạm và license trước khi publish public.
