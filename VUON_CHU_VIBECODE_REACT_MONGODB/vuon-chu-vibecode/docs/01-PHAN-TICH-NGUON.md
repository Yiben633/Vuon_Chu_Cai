# 01 — Những gì đã đọc và xem

## Kiểm kê ZIP

- 50 entry, trong đó 31 file thực: 13 HTML, 16 PNG, 2 Markdown.
- 9 HTML màn hình: 8 màn hình chính, 1 biến thể của bảng chữ cái.
- 4 HTML icon có SVG nội tuyến: hạt dẻ, mầm cây, hoa sen, táo.
- 8 screenshot màn hình; biến thể bảng chữ cái `_2` chỉ có HTML, không có screenshot riêng.
- 8 PNG tài nguyên: logo, linh vật, 2 background và 4 icon.
- PRD: `reference/prd_v_n_ch_di_u_k.md`.
- Design: `reference/v_n_ch_di_u_k/DESIGN.md`.

Các HTML dùng Tailwind CDN, font/icon ngoài, URL ảnh Googleusercontent và JavaScript thao tác DOM. Có demo speechSynthesis, chọn tab/giọng, kéo/chọn vần, toggle thu âm, vòng quay và thông báo đăng nhập giả. Chưa có React app, API backend, schema MongoDB, auth thật, file audio hay kết quả học thật.

## Màn hình và hướng chuyển thành React

| Màn hình | Thư mục gốc bên trong `reference/` | Route dự kiến |
|---|---|---|
| Giới thiệu | `gi_i_thi_u_v_n_ch_di_u_k/` | `/` và `/gioi-thieu` |
| Bảng chữ cái | `khu_v_n_b_ng_ch_c_i_v_n_ch_di_u_k_1/` | `/vuon-chu` |
| Bảng chữ cái biến thể | `khu_v_n_b_ng_ch_c_i_v_n_ch_di_u_k_2/` | Tham khảo mobile/component; không thêm trang trùng |
| Rừng ghép vần | `r_ng_gh_p_v_n_t_v_ng_v_n_ch_di_u_k/` | `/rung-ghep-van` |
| Đầm kể chuyện | `m_k_chuy_n_v_n_ch_di_u_k/` | `/dam-ke-chuyen`, `/dam-ke-chuyen/:slug` |
| Thử thách | `th_th_ch_vui_v_n_ch_di_u_k/` | `/thu-thach`, `/thu-thach/:gameType` |
| Phụ huynh | `g_c_ph_huynh_b_o_c_o_ti_n_v_n_ch_di_u_k/` | `/phu-huynh` và các tab con |
| Đăng nhập | `ng_nh_p_v_n_ch_di_u_k/` | `/dang-nhap` |
| Đăng ký | `ng_k_t_i_kho_n_cho_b_v_n_ch_di_u_k/` | `/dang-ky` |

Bổ sung theo nhu cầu hệ thống: `/vuon-chu/:symbol`, `/chon-ho-so`, `/qua-tang`, `/phu-huynh/hoc-lieu`, `/admin/*`, trang 404. Đây là đề xuất triển khai, không phải screenshot có sẵn.

## Điểm chưa nhất quán cần sửa

1. PRD lấy tuổi 3–6; DESIGN mô tả 4–8; vài thẻ truyện có 5–8. MVP lấy PRD 3–6, ageBand `3-4|4-5|5-6`, không tự mở rộng độ tuổi.
2. A–Con Ong, I–Ốc Sên, O–Quả Ổi, Ô–Cây Dù, A–Con Cá Vàng không thống nhất chữ và ví dụ. Seed mới dùng ví dụ chứa đúng chữ cơ sở, ghi rõ vị trí target. A là chữ trong `cá`, không gọi chữ A là chữ Á; O không dùng `ổi` thay thế âm o.
3. Các câu hỏi demo có câu không khớp, như tìm O trong CON GÀ. Thay bằng bài tập JSON có đáp án xác định và được BE chấm.
4. Có 5 dấu thanh được viết và thanh ngang không viết dấu: biểu diễn thành **6 thanh**, không nhầm 6 dấu.
5. Level có nơi ghi cấp 2 Sóc Nhí, có nơi cây cấp 4 nhưng 3 mốc. Chốt mapping trong docs/02; không tính level từ số tiền đang còn vì đổi quà sẽ làm giảm ví.
6. `128 hạt dẻ`, `24/29`, `92%`, `96.8%`, lượt nghe, 120.000 bé, 45.000 phụ huynh đều là thông tin demo, không phải dữ liệu được chứng minh. Loại các số quảng cáo, cố vấn/đội ngũ chưa xác thực khỏi bản chạy thật; có thể giữ ở bản reference.
7. Không tự công bố “chuẩn Bộ GD”, “COPPA/GDPR-K”, “an toàn 100%”, “chẩn đoán ngọng” từ việc hoàn thành code. Nội dung kỹ thuật cần consent, giới hạn quyền và xóa dữ liệu; xác nhận pháp lý/sư phạm là công việc riêng.
8. Các nút Google/Zalo/QR và “gửi ba mẹ” đang là giao diện/demo. MVP ẩn OAuth/QR; “gửi ba mẹ” là lưu inbox nội bộ, chưa gửi email/Zalo.
9. SVG icon có file gốc có thể tái sử dụng; screenshot toàn trang không được dùng làm background của trang React.
10. Linh vật 3D có nền vuông trong PNG, chưa là ảnh cutout trong suốt. Đặt trong khung portrait hợp lý; không giả định đã tách nền. Logo có chữ và có nền, giữ đúng tài nguyên.

## Quyết định thẩm mỹ

Giữ bố cục card, xanh mint, typography tròn, hạt dẻ vàng, bo góc và thiên nhiên Việt Nam. Dùng background rừng ở hero, background nhà cây ở khu truyện; content nằm trên surface sạch để đọc được. Ưu tiên bảng chữ cái `_1` vì có screenshot và đầy đủ khu vực; `_2` là nguồn tham khảo tinh gọn. Không đổi cả sản phẩm sang dashboard công việc hoặc phong cách doanh nghiệp.
