# 17 — Mở rộng AI/OAuth/QR/thiết bị khi đủ điều kiện

Bạn là AI coding thực thi dự án Vườn Chữ Diệu Kỳ trong workspace VS Code.
Đọc README.md, docs/02-KIEN-TRUC-VA-PHAM-VI.md, docs/03-DU-LIEU-MONGODB.md,
docs/04-HOP-DONG-API.md, docs/05-THIET-KE-VA-TAI-NGUYEN.md và docs/PROGRESS.md.
Khi liên quan nội dung/seed/test, đọc thêm docs/01,06,07. Nếu repo có AGENTS.md,
đọc và áp dụng. Đọc file hiện tại trước khi sửa, không xóa công việc đã có.

Stack cố định: ReactJS + Vite + JavaScript/JSX; Node.js/Express ESM; MongoDB/Mongoose.
Viết mã trực tiếp, đầy đủ imports/config/routes, không chỉ trả pseudocode hay hướng dẫn.
Giữ phong cách thiên nhiên theo screenshot, không tạo số liệu/URL/audio/PDF/AI giả.
Backend là authority cho auth/ownership/PIN/score/progress/rewards/time limits.
Không lưu secret ở frontend; không seed reset dữ liệu cá nhân; không tự publish.
Nếu phải chọn chi tiết nhỏ, quyết định hợp lý và ghi docs/DECISIONS.md; thiếu quyền/
credential/môi trường thật thì báo blocker cụ thể, tiếp tục phần độc lập còn làm được.

## Điều kiện trước

Tùy chọn; không cần để nghiệm thu MVP. Core đã đạt18.

## Công việc

Đọc docs/DECISIONS và chọn module mở rộng đang được người dùng yêu cầu, không bật
đồng thời mọi dịch vụ. Module nào thiếu provider/credential/data thì để OFF, ghi
BLOCKED và hoàn thành phần interface/config có thể làm. Giữ API core và MongoDB.

Speech: provider interface, timeout/backoff/rate-limit, parent explicit cloud consent,
private audio storage retention; browser capability detection. Transcript matcher
NFC giữ dấu chỉ feedback lời nhận diện, không gọi pronunciationScore. Điểm phát âm
chỉ khi provider có đánh giá ngữ âm Việt và đã kiểm chứng trẻ/3miền; score null nếu
chưa có, không mặc định mọi dialect là chuẩn Bắc. Không reward speech theo fake score.

Trusted device: opaque random token hash BE, scopes child học-only, expiry30days,
parent revoke và symbol PIN rate-limit. No public profiles, không localStorage
parent creds. QR: expiring nonce one-use, approved bằng parent authenticated/gate,
không mã QR chứa password/session. OAuth Google/Zalo: official current docs,
redirect allowlist/state/PKCE nơi phù hợp, provider config server và liên kết account
không tạo admin; không activate button trước callback tested.

Password reset/email reports: token hash/TTL/single-use, generic response tránh
email enumeration, no secrets logs; email/Zalo opt-in server và provider thật.
Lucky wheel optional: chỉ lượtfree, không purchase/paid gambling; outcome/server
weighted catalog, daily cap unique, transaction ledger+wallet+inventory, FE wheel
quay tới outcome server, không browser random reward. Hướng dẫn từ chối/lỗi rõ.

## Tiêu chí đạt

Feature flags OFF không leak UI active. Module thực sự bật phải có independent
test/security check và provider configuration; không có credential thì báo BLOCKED.
Browser ASR không hiện pronunciation percent; QR/trust tokens scope+expiry tested;
wheel retry/concurrency không thưởng2. Bước18 chạy lại theo module đã thay.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
