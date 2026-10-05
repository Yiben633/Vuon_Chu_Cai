# 06 — Kiểm thử và định nghĩa hoàn thành

Các mục dưới đây là **yêu cầu cho dự án sau khi AI triển khai**, không phải các kiểm thử đã chạy trong lúc biên soạn bộ prompt.

## Luồng bắt buộc

1. Guest xem giới thiệu/bảng chữ, vào học thử, không tạo dữ liệu cá nhân server.
2. Register parent+child, database lưu hash, nhận đúng50 acorns một lần; duplicate email không tạo thêm con/ví.
3. Login sai hiển thị lỗi thật, login đúng tạo session; child picker chỉ con trong gia đình đã đăng nhập.
4. Vào child mode, luyện chữ, đúng/sai có phản hồi, refresh giữ kết quả MongoDB; child gọi API parent bị403.
5. Mastery đạt khi có ít nhất2 exercise nhận diện khác nhau đúng lần đầu; chỉ bấm nghe không mastered.
6. Ghép C+A+sắc=CÁ, B+A+huyền=BÀ, không dấu=BA; sai tổ hợp không hiển thị từ bịa, Unicode NFC giữ dấu.
7. Đọc từng scene truyện, ack đúng thứ tự và trả lời câu kết thúc; complete sớm bị từ chối; làm lại không nhận story reward lần2.
8. Cây táo+4 game phụ sử dụng question thật từ backend; mạng lỗi không tự trả đúng hoặc tăng hạt.
9. Retry request answer bằng cùng key chỉ tạo1 attempt/ledger; cùng key khác payload409. Song song2 request cũng không cấp2 thưởng.
10. Redeem thiếu tiền409; đổi thành công ví/ledger/inventory khớp; 2 request song song không âm ví.
11. Parent nhập PIN, xem báo cáo đúng con; gate hết hạn bị403 cả FE và API. User A đổi childId sang user B không đọc được.
12. Heartbeat hidden/pause không cộng; seq lặp không cộng; một con không có2 active session; ngày VN qua0h thống kê đúng dayKey.
13. Đến break threshold hiện overlay; dailyLimit ngăn start/answer; child không sửa giới hạn.
14. Không có attempt thì accuracy=null; không có speech provider thì phát âm “chưa có dữ liệu”, không hiện92%.
15. Mic denied/unavailable/consent absent không crash. Stop/logout/unmount phải dừng tất cả track và revoke blob URL.
16. Recording mặc định disabled. Parent bật consent, child preview rồi gửi nội bộ; user khác không lấy audio bằng URL đoán. File giả/ext sai/dài>15s/lớn>5MiB bị reject trước lưu.
17. Missing audio/PDF không404 ẩn rồi toast thành công; UI giải thích và fallback rõ. Resource draft không publish khi không có file.
18. Admin CRUD có validation, version và archive; child/parent thường không gọi được admin; answer không xuất trong learner DTO.
19. Export không có hash/token; delete child cleanup cả file và metadata, lỗi storage để pending không báo complete.
20. Seed lần2 giữ nguyên số bản ghi/content key, không reset wallet/progress/recordings.

## Unit test có giá trị

Normalization tiếng Việt/NFC; lookup spelling; validate alphabet29 và nhóm12/17; score optionId theo answer server; mastery2 bài khác nhau; reward eventKey/dayKey; level theo mastered, không theo balance; báo cáo first-try accuracy; streak hôm nay/hôm qua/mất1 ngày; delta heartbeat; idempotency payload hash.

Không tạo hàng chục snapshot test chỉ chụp implementation. Ưu tiên rule có rủi ro dữ liệu/thưởng/quyền.

## Integration API/DB

Supertest+MongoDB replica set test riêng. Nếu dùng memory server, cấu hình replica set, không standalone. Test DB không dùng database production. Tạo indexes trước chạy case concurrency. Cases: registration rollback, cookie+CSRF, parent ownership, PIN lockout, duplicate submit, concurrent rewards, daily limit và query projection.

## E2E FE/BE

Playwright từ UI thật với database test: register → child mode → quiz → parent PIN → report → reward → logout. Network errors và session expired cần case riêng. Mock chỉ cho fault injection hoặc external service; luồng chính phải đi API+MongoDB thật.

## Visual QA

Chụp từng màn hình ở 390×844, 768×1024, 1440×1000; đối chiếu screenshot gốc theo khu vực vì PNG gốc là trang dài với kích thước khác nhau. Xem header/hero/grid/forms/parent sidebar; không ép pixel match khi cần sửa dữ liệu sai. Không cuộn ngang, không cắt dấu Việt, không logo méo, thẻ/touch target đủ lớn. Keyboard focus, contrast, reduced-motion và text+icon feedback đạt.

## Lệnh kiểm tra cuối

Sau khi bước01 tạo scripts: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`, `npm run db:indexes`, `npm run db:seed`. Seed kiểm tra2 lượt trên DB demo có user progress thử. Rà secret bằng script không in giá trị ra log. npm audit để review actual findings, không auto audit fix --force phá phiên bản.

## Báo cáo bàn giao

Liệt kê tính năng đã làm, lệnh đã chạy+exit/result, DB topology, phiên bản package đã chọn, URL local, thiếu audio/PDF/credentials, screenshot QA, lỗi còn mở. Phân biệt PASS, FAIL, BLOCKED và NOT RUN. Không viết “test pass” nếu không chạy được; không công bố AI accuracy/compliance từ các test kỹ thuật.
