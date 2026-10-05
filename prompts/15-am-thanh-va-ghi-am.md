# 15 — Audio thật và thu âm có consent

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

Bước11,13 và media backend/registry sẵn.

## Công việc

AudioController quản lý một narration stream, ambience volume riêng; user gesture
mới phát, pause/background/route/logout/child switch stop. Local assets audio hiện
không có: manifest availability null; TTS vi-VN chỉ khi device có voice, nói rõ
giọng thiết bị, không gán giả north/central/south. Ưu tiên audio biên tập nếu sau này
có3miền. Không synthesize animal sounds bằng đọc chữ “gầm” rồi gọi audio loài vật.

Mic dùng getUserMedia+MediaRecorder trên HTTPS/localhost, isTypeSupported fallback,
max15s, visible recording indicator, explicit start/stop/preview/discard/send.
Parent recording consent phải server enabled; cloudProcessing mặc địnhfalse riêng.
Dừng tracks/revoke object URLs/timeouts lúc unmount/logout/denied. Không tự mở mic.

MVP gửi ba mẹ=private in-app inbox, không email/Zalo. Backend feature flag false khi
chưa có storage; local preview vẫn rõ chưa gửi. Khi bật upload, multipart max5MiB,
verify actual codec/duration bằng công cụ media an toàn, filename random, outside
public webroot, private authorization streaming, cleanup mặc định7days. Không tin
client duration/mime/extension. Xóa file trước metadata, retry job khi storage lỗi.
Quyết định installer/tool ffprobe ghi rõ nếu cần, không claim đã validate khi không có.

Không auto bật SpeechRecognition: một số implementation gửi voice đến provider;
recording consent không đồng nghĩa cloud consent. Không chấm pronounce bằng volume,
transcript match hay random percentage. Giữ interface SpeechProvider cho bước17.

## Tiêu chí đạt

Audio playback state đúng thực tế, không simultaneous narration; missing region
fallback labeled. Mic denied/unavailable/unmount không leak tracks. Recording upload
private, other parent403, oversized/fake codec/duration>15s reject. Inbox/delete
và cleanup có test; chưa storage→feature off và explicit unavailable.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
