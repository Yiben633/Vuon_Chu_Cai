# 14 — Đổi quà, huy hiệu và cấp độ

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

Bước06 wallet/mission APIs + bước13 cây hoạt động.

## Công việc

Build AcornCounter ở ChildLayout query wallet đúng child. Rewards page/catalog,
owned/insufficient/available states, redeem confirmation và mutation có key bền
trong lifecycle retry. Không optimistic cộng/trừ ví trước success. Sau success
invalidate wallet/inventory/ledger; hiển thị equipped cosmetic không thay chức năng.

Quà ảo không thanh toán, không dẫn link ngoài. Level/growth theo mastered count,
không money balance. Badges/missions BE definitions và eligibility; button claim
chỉ sau đủ điều kiện, repeated request phải same result. Welcome50 chỉ child đầu
khi register, UI tạo child mới hiển thị wallet0 đúng.

Nếu chưa có asset mỗi costume, dùng CSS accessory đơn giản trên portrait và nhãn
item, không remote art giả. Crown/hat icon dùng registry hoặc UI SVG hợp lệ. Lời
khen nhẹ, reduced-motion, không roulette trong MVP. Ledger/history ở parent/child
cho minh bạch; pagination. Race hai tab cập nhật lại wallet server sau conflict.

## Tiêu chí đạt

Redeem success/insufficient/already-owned/race đúng. Balance=earned-spent và không
âm. Spend không tụt cấp. Claim2 lần không thưởng2. Switch child counter/cosmetics
đổi đúng; pending/error không trình bày vật phẩm đã sở hữu.
## Báo cáo cuối bước

- Nêu file đã tạo/sửa và chức năng thực sự chạy.
- Chạy kiểm tra phù hợp; ghi command và kết quả, không gọi NOT RUN là PASS.
- Cập nhật docs/PROGRESS.md (DONE/BLOCKED/PARTIAL), quyết định mới và lỗi còn mở.
- Nêu cách người dùng chạy/xem bước này và tên prompt kế tiếp.
- Dừng ở phạm vi bước; không tự làm toàn bộ những bước sau.
