# 03 — Seed MongoDB và mở rộng dữ liệu học

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

Bước02 đạt, đọc docs/07 trước import.

## Công việc

Đọc từng JSON seed và manifest. Viết validate-seed chạy offline để xác minh29 chữ,
order,12/17,6 thanh, NFC, keys unique, option IDs, answer thuộc options, references.
Kiểm tra example targetOffset/baseSymbol theo grapheme normalized, không coi A/Ă/Â
hoặc O/Ô/Ơ là một. Seed kỹ thuật needs_review, không tự tuyên bố chuẩn sư phạm.

Viết importer upsert theo key, thứ tự assets→letters/tones→vocabulary→spelling→
exercises→lessons/stories→catalog. Resolve Key fields sang ObjectId; không dropDB,
không deleteMany collections cá nhân, không reset wallet/progress. Có dry-run,
version conflict detection và summary. Production bắt buộc approved trước publish;
unreviewed demo chỉ khi cờ allow và nonproduction.

Mở rộng12 exercise mẫu thành tối thiểu58 identify-letter exercises (2 khác nhau
cho mỗi chữ), lựa chọn ngẫu nhiên có seed deterministic, đáp án duy nhất và target
letter chính xác. Đừng sửa q thành ghép q+a; q ví dụ quạt và teachingNote q+u.
Bổ sung bộ câu hỏi mỗi game type đủ một vòng5 câu, không lặp cùng exercise trong vòng.

Tạo db:demo và admin:create riêng; credentials qua env, hash trước ghi, chặn dùng
production mặc định. Không commit tài khoản/PIN rõ. Data thiếu audio/PDF→null/draft;
không tạo file path ảo. Tạo report DB collections counts và refs resolved.

## Tiêu chí đạt

Validator không lỗi, importer chạy2 lần không tăng record count và không giảm
version. Có58 exercises nhận diện và ít nhất5 mỗi game type. Seed lại sau một
attempt/wallet redemption giữ dữ liệu cá nhân; thiếu media được report rõ.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
