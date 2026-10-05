# 08 — Form React kết nối auth backend

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

Bước04+07 hoạt động.

## Công việc

Tạo LoginPage/SignupPage/ChildProfilePicker/PinGate/Settings. Form RHF+Zod có label,
show password, field-level Vietnamese errors, pending/disabled và server errors.
Signup theo screenshot: info parent, nickname, age3-4/4-5/5-6, dialect3miền,
mascot4choice, terms consent. Không bật voice cloud consent mặc định.

Login email only MVP; ẩn Google/Zalo/QR và SĐT chưa triển khai. Child tab chỉ
profiles từ AUTH family-profiles, không dùng tên Bắp/Miu/Tít hardcoded. Nếu guest,
child tab hướng phụ huynh đăng nhập. Enter-child gửi đúng ID/symbol PIN và BE xác minh.
Đăng ký thành công chỉ sau201; wallet50 lấy response/query thật.

Axios withCredentials+CSRF token, regenerate session thì fetch lại csrf/me.
Route guards hiển thị trạng thái unknown/loading không flash private page. PinGate
gọi server; hết hạn/gate403 invalidate cache report, đóng page private, hướng mở lại.
Logout dừng audio, clear private query cache/store, redirect login. Chuyển child
reset private cache key và learning session appropriately. Không lưu PIN/token ở localStorage.

## Tiêu chí đạt

E2E register→pick child→quiz route→PIN→parent. Sai password/PIN không toast thành
công. Refresh đúng mode từ /auth/me; user chưa đăng nhập không xem danh sách trẻ.
Gate expired/logout clears report; child không truy cập admin qua URL trực tiếp.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
