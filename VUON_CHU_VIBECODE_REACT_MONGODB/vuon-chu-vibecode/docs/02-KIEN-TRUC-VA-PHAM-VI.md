# 02 — Kiến trúc và phạm vi

## Kiến trúc

Một npm-workspaces monorepo: `apps/web` (ReactJS), `apps/api` (Express), `packages/contracts` (JS/Zod, không kéo Mongoose vào FE). FE → `/api/v1` → controller → service → repository/model → MongoDB. Mỗi module BE có routes, schemas, controller, service và model khi cần. Không dùng microservices cho MVP.

Development: web `http://localhost:5173`, API `http://localhost:4000`. Vite proxy `/api` đến API; browser gọi URL tương đối, tránh cấu hình cookie cross-site từ đầu. Production ưu tiên cùng origin thông qua reverse proxy. MongoDB dùng Atlas hoặc replica set đã được cấu hình, kiểm tra khả năng transaction khi khởi động.

## Vai trò

| Vai trò/trạng thái | Quyền |
|---|---|
| Guest | Giới thiệu, xem mẫu chữ/truyện công khai và học thử không lưu |
| Parent chưa mở PIN gate | Chọn hồ sơ tối giản, vào chế độ bé, mở gate |
| Child mode | Đọc học liệu published, học đúng currentChildId, xem ví bé và đổi quà ảo |
| Parent đã mở PIN gate | Quản lý con của mình, báo cáo, settings, inbox ghi âm, tải/xóa dữ liệu |
| Admin | Quản lý học liệu và tài nguyên; không mặc định đọc mọi hồ sơ trẻ |

Vai trò server là `parent|admin`. `child` là chế độ phiên hạn chế của một childProfile, không đăng ký tài khoản email/password riêng cho trẻ. Session chứa userId, mode, currentChildId, parentGateUntil, csrfToken và expiry. Không nhận role hoặc parentId từ client để phân quyền.

PIN 4 số phải hash, thử sai có rate limit và lockout. Biểu tượng 4 bước là mã lựa chọn vui cho trẻ; không thay thế mật khẩu phụ huynh. MVP vào học nhanh trên phiên gia đình đã đăng nhập. Thiết bị tin cậy độc lập là tùy chọn bước 17.

Mọi endpoint riêng kiểm tra session, ownership, mode và gate. FE route guard chỉ giúp UX. Parent gate TTL 10 phút; server kiểm tra ngay cả khi UI còn đang mở. Đăng xuất, đổi mật khẩu hoặc hết hạn vô hiệu hóa quyền. Xóa hồ sơ xóa/ẩn cả dữ liệu học, wallet, bản ghi và file liên quan theo docs/03.

## Nội dung học

- 29 chữ: A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y.
- 12 nguyên âm: A Ă Â E Ê I O Ô Ơ U Ư Y; 17 phụ âm còn lại.
- 6 thanh: ngang, sắc, huyền, hỏi, ngã, nặng.
- Phân biệt tên chữ, âm đọc và chữ dùng trong từ. `letterName` là nhãn tên chữ; audio đã biên tập mới xác định cách đọc mẫu. q đi cùng u trong nội dung ghép âm; không ghép tùy ý tất cả phụ âm với tất cả vần.
- MVP ghép vần dùng bảng tổ hợp đã duyệt (onset+rime+tone→word), không cộng chuỗi dấu vào cuối từ. Chuẩn hóa NFC; không bỏ dấu khi chấm đáp án tiếng Việt. Kéo thả có cách bấm chọn thay thế.
- Các nội dung seed được phép dùng trong DEMO kỹ thuật với nhãn `reviewStatus=needs_review`; deployment public chỉ xuất bản nội dung đã được kiểm tra.

## Học, tiến độ và thưởng

Một learningSession gắn childId, loại hoạt động, contentId, version nội dung và thời gian. Mỗi bài tập có attemptNo, serverIssued questionId/exerciseId, response và result do server tính. Không nhận score, accuracy, completed hoặc rewardAmount của FE làm kết quả.

Chữ được `seen` khi mở; `practicing` khi có luyện tập; `mastered` khi đúng lần đầu ở ít nhất 2 exerciseId nhận diện khác nhau cho chữ đó. Mọi chữ chưa có đủ bài tập giữ practicing. “Đã xem” không đồng nghĩa “đã thuộc”. Không dùng speech để xác định mastery trong MVP.

MVP thưởng:

| Nguồn | Giá trị | Giới hạn |
|---|---:|---|
| Tạo hồ sơ con đầu tiên khi đăng ký | 50 | Một lần cho welcome event của tài khoản; tạo thêm con không nhận 50 |
| Câu quiz đúng ngay lần đầu | 5 | Một lần/child/exercise/contentVersion/ngày, tối đa 50/ngày |
| Hoàn thành truyện | 15 | Một lần/child/story/contentVersion |
| Nhiệm vụ ngày đạt đủ | 10 | Một lần/child/mission/ngày |
| Ghi âm đóng vai | Huy hiệu | Không có hạt dẻ trong MVP để tránh thưởng khi chưa có chất lượng chấm |

Sai không trừ tiền và vẫn được luyện lại, tối đa 3 lần một exercise trong một session. Retry sau sai không nhận 5 hạt nhưng có động viên. Ngày tính theo Asia/Ho_Chi_Minh; BE tạo dayKey, không tin ngày từ FE. Điểm progress, rewards và completion phải cập nhật trong cùng transaction hoặc workflow có bằng chứng nhất quán.

Wallet gồm balance, earnedTotal, spentTotal. Quy tắc `balance=earnedTotal-spentTotal`; ledger append-only. Đổi quà không làm giảm level. Level theo số chữ mastered: 0–7 Hạt Mầm, 8–14 Chồi Non, 15–23 Sóc Nhí, 24–29 Nhà Thám Hiểm. Cây theo mốc 0–10, 11–20, 21–29; đây là 3 trạng thái minh họa, không gắn giá trị AI.

Truyện hoàn thành: server kiểm tra các sceneId đã được ack theo thứ tự và một câu hỏi kết thúc. Đây là **hoàn thành tương tác**, không chứng minh trẻ đã nghe hết hoặc hiểu sâu. Không hiển thị % hiểu truyện. Bản không có audio đọc bằng text/ảnh và acknowledgement.

## Phiên học và nhắc nghỉ

FE heartbeat 15 giây khi tab visible và hoạt động trong 60 giây gần nhất. Backend dùng thời gian server; mỗi delta tối đa 15 giây, chỉ tính một phiên học active/child. Pause, hidden, nghỉ và disconnect không tích lũy tiếp. Timestamp báo cáo UTC; dayKey VN. Nếu heartbeat cách quá 30 giây không cộng khoảng offline. Cộng thời gian trong transaction và chống gửi lặp qua sequence number.

Mặc định nhắc nghỉ sau 20 phút active liên tục, nghỉ tối thiểu 20 giây, có thể parent đặt block 10–20 và dailyLimit 15–60 phút. Đây là nhắc nghỉ phần mềm; không tuyên bố hiệu quả y tế. Đến dailyLimit BE từ chối start/answer mới (`DAILY_LIMIT_REACHED`), FE hiện lời nhắn cùng ba mẹ. Parent có thể đổi limit qua gate, child không thể.

## Ưu tiên

P0/MVP: tài khoản + hồ sơ, 29 chữ, ghép vần bảng nhỏ, 2 truyện, quiz engine 5 hình thức, báo cáo thật, cài đặt nghỉ, đổi quà, admin content, audio fallback minh bạch.

P1: audio biên tập 3 miền, học liệu PDF thật, thiết bị tin cậy, inbox ghi âm server có consent.

P2/tùy chọn: AI speech provider, Google/Zalo/QR auth, gửi báo cáo tự động, vòng quay miễn phí. AI handwriting, lớp học giáo viên, ứng dụng mobile và thanh toán nằm ngoài bộ MVP này.

## Quy tắc triển khai chung

Không lưu secret trong `VITE_*`; MONGODB_URI chỉ ở BE. Session dùng HttpOnly/SameSite/Secure đúng môi trường; mọi mutation bảo vệ CSRF và Origin. Validate body/query/params theo allowlist, không truyền req.body vào Mongo filter/update. Pagination max 50; query projection không lộ answer, passwordHash hoặc pinHash. HTTPS ở production, Helmet, rate limit, error envelope và log có requestId nhưng không chứa âm thanh, mật khẩu, PIN hay cookie.
