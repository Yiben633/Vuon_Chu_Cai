# Kiểm tra bộ tài liệu và prompt

Ngày: 06/10/2026.

Kết quả kiểm tra file nguồn: **PASS**, 1865 kiểm tra tự động,
không lỗi. Phạm vi: parse JSON, counts, khóa duy nhất, 29 chữ/12–17/6 thanh,
NFC và vị trí chữ trong ví dụ, tổ hợp ghép vần cơ sở, references seed,
đáp án thuộc options, scene/hotspot IDs, tọa độ, assets tồn tại/checksum,
SVG parse, không URL audio giả,20 prompt có tiêu chí và báo cáo cuối bước.

Đã đọc PRD, DESIGN và13 HTML; xem contact sheet của12 ảnh màn hình/tài nguyên
lớn và kiểm tra chi tiết vùng trên của bảng chữ/phụ huynh. Các số liệu demo và
ví dụ chữ–từ chưa khớp được ghi thành yêu cầu sửa trong docs/01.

Kiểm tra này **không xác nhận ứng dụng đã chạy**. Chưa triển khai FE/BE,
chưa tạo database MongoDB thực, chưa chạy integration/E2E của sản phẩm.
Nội dung seed cần rà sư phạm; audio/PDF/ảnh từng từ và AI provider còn thiếu.

Để chạy lại kiểm tra file: `python data/validate_seed.py`.
Nghiệm thu ứng dụng sau khi code: thực hiện prompt18 và docs/06.
