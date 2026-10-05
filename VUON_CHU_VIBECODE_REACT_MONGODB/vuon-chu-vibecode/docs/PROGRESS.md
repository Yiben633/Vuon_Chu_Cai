# Tiến độ triển khai

Trạng thái ban đầu: mới có bộ đặc tả, seed và reference; chưa tạo ứng dụng.

| Bước | Trạng thái | File thay đổi | Kiểm tra đã chạy | Blocker |
|---|---|---|---|---|
| 00 - Khảo sát và kế hoạch | DONE | `docs/IMPLEMENTATION-PLAN.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md` | `python data/validate_seed.py` - PASS, 1865 checks; `node -v` - v24.18.0; `npm -v` - 11.16.0 | Chưa có app để chạy lint/build/test; chưa kiểm tra MongoDB replica set/Atlas |
| 01 - Khởi tạo workspace | NOT STARTED | — | — | — |
| 02 - Models MongoDB | NOT STARTED | — | — | — |
| 03 - Seed và kiểm tra dữ liệu | NOT STARTED | — | — | — |
| 04 - Auth và phân quyền | NOT STARTED | — | — | — |
| 05 - API học liệu và admin | NOT STARTED | — | — | — |
| 06 - Học tập, kết quả và thưởng | NOT STARTED | — | — | — |
| 07 - FE design system và layout | NOT STARTED | — | — | — |
| 08 - FE auth và hồ sơ | NOT STARTED | — | — | — |
| 09 - FE vườn chữ cái | NOT STARTED | — | — | — |
| 10 - FE rừng ghép vần | NOT STARTED | — | — | — |
| 11 - FE đầm kể chuyện | NOT STARTED | — | — | — |
| 12 - FE thử thách đố vui | NOT STARTED | — | — | — |
| 13 - FE góc phụ huynh | NOT STARTED | — | — | — |
| 14 - FE phần thưởng và cây | NOT STARTED | — | — | — |
| 15 - Âm thanh và ghi âm | NOT STARTED | — | — | — |
| 16 - FE quản trị và học liệu | NOT STARTED | — | — | — |
| 17 - Mở rộng tùy chọn | NOT STARTED | — | — | Optional cho MVP |
| 18 - Kiểm thử và hoàn thiện | NOT STARTED | — | — | Chờ app được triển khai |
| 19 - Chuẩn bị triển khai | NOT STARTED | — | — | Không tự deploy |

## Ghi chú bước 00

- Đã đọc tài liệu yêu cầu, PRD, DESIGN, seed manifest, asset manifest và mapping HTML/screenshot.
- Chốt 8 màn hình nguồn, các trang bổ sung, modules API, models, ownership, PIN gate, transaction, Unicode và tài nguyên còn thiếu.
- Xác nhận bước này không tuyên bố ứng dụng đã chạy; hiện chưa có FE/BE/DB được triển khai.
- Prompt kế tiếp: `prompts/01-khoi-tao-workspace.md`.

AI cập nhật từng bước thành dòng riêng; chỉ ghi DONE khi tiêu chí bước đó đạt. Bước 17 có thể SKIPPED. Khi thiếu môi trường ghi BLOCKED/NOT RUN. Cuối mỗi bước ghi next step, quyết định đã chốt và command để người dùng chạy.
