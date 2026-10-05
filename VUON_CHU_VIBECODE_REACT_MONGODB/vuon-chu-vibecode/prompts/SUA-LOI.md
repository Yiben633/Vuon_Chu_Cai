# Prompt sửa lỗi có mục tiêu

Lỗi cần sửa: [dán message/stack và thao tác tái hiện; loại secret/password/PIN].
Bước đang thực hiện: [số bước]. Màn hình/API liên quan: [route].

Đọc docs/PROGRESS.md và file implementation liên quan; lần theo FE request,
Express validation/auth/service và Mongo model/index nếu lỗi đi xuyên hệ thống.
Tái hiện lỗi, xác định nguyên nhân và sửa ở nơi phát sinh; không thay API thật bằng
mock, không nới ownership/CSRF/PIN, không bỏ transaction hoặc unique index cho hết lỗi.
Không đổi ReactJS/MongoDB, không rewrite toàn app. Bổ sung test regression cho lỗi
logic/quyền/concurrency nếu có giá trị, kiểm tra bước bị ảnh hưởng và build/lint.
Báo nguyên nhân, file thay đổi, test thực tế và blocker còn lại; cập nhật PROGRESS.
