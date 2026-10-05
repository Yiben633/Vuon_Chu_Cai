# 07 — Chuyển design thành component React

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

Bước01 FE chạy; step05 APIs đủ cho landing.

## Công việc

Đọc DESIGN và screenshot từng trang; áp docs/05 tokens/color/typography. Tạo CSS
variables và Tailwind integration hiện hành; component common + domain; PublicLayout,
ChildLayout, ParentLayout(sidebar responsive), AdminLayout. React Router routes đầy đủ
và lazy load page nặng. Không iframe HTML, không render screenshot thành UI.

Copy assets local vào web public registry, logo/mascot contain, nền forest/treehouse
cover chỉ đúng section. Sóc PNG có nền vuông: đặt portrait card cream thay vì giả
cutout. Icon SVG giữ viewBox; Lucide cho icons UI, không phụ thuộc material-symbol
CDN nếu tránh được. Fonts Vietnamese nếu chưa có file thì fallback, không fake load.

Trang giới thiệu giữ hero/3 trụ cột/sample chữ/CTA, bỏ social proof/team/compliance
và AI percentages chưa xác thực. CTA routes hoạt động; học thử guest không persist
server. Sample audio controller placeholder chỉ ghi unavailable đến bước15.

Target56px, focus rings, labels, dialog keyboard, animation reduced-motion. Tạo
Axios client/envelope/error handler, QueryClient và queryKey helpers child-scoped.
Không đưa tất cả state server vào Zustand hoặc data hardcoded vào page components.

## Tiêu chí đạt

Build/lint đạt; xem390/768/1440 không cuộn ngang/cắt dấu; logo không méo. Header/
footer/components tái sử dụng; mọi nav/CTA đúng route. Có loading/error/empty state;
không có fake KPI phát âm/số khách hàng trong UI production.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
