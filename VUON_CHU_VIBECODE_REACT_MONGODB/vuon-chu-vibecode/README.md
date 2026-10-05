# Vườn Chữ Diệu Kỳ — Bộ vibecode ReactJS + Express + MongoDB

Ngày biên soạn: 06/10/2026. Nguồn: file `stitch_ti_ng_vi_t_t_nhi_n_nh.zip` do bạn cung cấp.

Bộ này là tài liệu và prompt yêu cầu AI trong VS Code triển khai dự án; **chưa phải ứng dụng FE/BE đã được lập trình hoặc chạy kiểm thử**. Có dữ liệu JSON khởi đầu, tài nguyên gốc, mẫu biến môi trường và các tiêu chí nghiệm thu cụ thể.

## Cách bắt đầu trong VS Code

1. Tạo thư mục dự án `vuon-chu-dieu-ky` và mở bằng VS Code.
2. Giải nén bộ này, chép toàn bộ nội dung vào thư mục dự án. Giữ nguyên `docs/`, `prompts/`, `data/`, `assets/`, `reference/` và `starter/`.
3. Mở AI coding đang sử dụng (Codex, Claude hoặc công cụ tương đương). Đưa nội dung `prompts/00-khao-sat-va-ke-hoach.md` vào chat ở chế độ có quyền đọc và sửa workspace.
4. Khi bước 00 hoàn thành, chạy từng prompt 01 → 16. Chạy 18 để kiểm thử; chạy 19 để chuẩn bị triển khai. Bước 17 là mở rộng tùy chọn, có thể làm sau MVP.
5. Ở mỗi bước, chỉ chuyển bước khi AI đã báo kết quả kiểm tra và cập nhật `docs/PROGRESS.md`. Nếu thiếu Node/MongoDB hoặc không cài được package, yêu cầu ghi rõ phần chưa kiểm tra; đừng coi báo cáo đó là đã đạt.
6. Mỗi bước xong nên xem diff, chạy thử màn hình và commit riêng. Không dán cả bộ prompt để AI làm một lần.

Prompt mở đầu để sao chép:

```text
Đây là workspace dự án Vườn Chữ Diệu Kỳ. Hãy đọc README.md,
docs/01-PHAN-TICH-NGUON.md, docs/02-KIEN-TRUC-VA-PHAM-VI.md,
docs/03-DU-LIEU-MONGODB.md, docs/04-HOP-DONG-API.md,
docs/05-THIET-KE-VA-TAI-NGUYEN.md và docs/06-NGHIEM-THU.md.
Sau đó thực hiện đúng prompts/00-khao-sat-va-ke-hoach.md.
Viết mã trực tiếp vào workspace ở những bước yêu cầu triển khai.
Giữ ReactJS với JavaScript/JSX, Node.js/Express và MongoDB/Mongoose.
Không thay MongoDB bằng SQL/Firebase và không tự triển khai lên mạng.
```

## Công nghệ đã chọn

| Phần | Lựa chọn | Mục đích |
|---|---|---|
| FE | ReactJS + Vite, JavaScript/JSX | Giao diện tương tác, ưu tiên React như yêu cầu |
| UI | Tailwind CSS qua Vite plugin; CSS cho design tokens | Giữ giao diện thiên nhiên của mẫu |
| Router | React Router | Điều hướng public, bé, phụ huynh, admin |
| API FE | Axios + TanStack Query | Gọi API và quản lý cache dữ liệu server |
| State nhỏ | Zustand | Âm thanh, hồ sơ đang học, trạng thái giao diện |
| Form | React Hook Form + Zod | Validate đăng ký, đăng nhập, cài đặt |
| BE | Node.js + Express, ESM | REST API theo module |
| Data | MongoDB + Mongoose | Lưu gia đình, học liệu, kết quả, phần thưởng |
| Đăng nhập | express-session + connect-mongo | Cookie HttpOnly; phiên và PIN được kiểm tra ở BE |
| Kiểm thử | Vitest/RTL; Supertest; Playwright | Logic, API, hành trình hoàn chỉnh |

Dùng Node.js 22.12+ làm mức tối thiểu của bộ prompt; khi thực thi kiểm tra lại yêu cầu phiên bản của các dependency đã chọn. Cài bản ổn định tương thích và commit lockfile, không tự chép phiên bản cũ từ HTML mẫu. Không dùng Create React App.

## Thứ tự prompt

| Bước | File | Kết quả chính |
|---|---|---|
| 00 | `00-khao-sat-va-ke-hoach.md` | Chốt phạm vi, kế hoạch và báo cáo nguồn |
| 01 | `01-khoi-tao-workspace.md` | FE/BE khởi động được, cấu hình môi trường |
| 02 | `02-models-mongodb.md` | Models, indexes và migration |
| 03 | `03-seed-va-kiem-tra-du-lieu.md` | Import dữ liệu mẫu lặp lại an toàn |
| 04 | `04-auth-va-phan-quyen.md` | Đăng ký, phiên, hồ sơ bé, PIN phụ huynh |
| 05 | `05-api-hoc-lieu-va-admin.md` | API học liệu và CRUD quản trị |
| 06 | `06-hoc-tap-ket-qua-va-thuong.md` | Phiên học, chấm đáp án, tiến độ, ví |
| 07 | `07-fe-design-system-va-layout.md` | Components chung, layout, trang giới thiệu |
| 08 | `08-fe-auth-va-ho-so.md` | Form thật kết nối backend |
| 09 | `09-fe-vuon-chu-cai.md` | Bảng 29 chữ, chi tiết và luyện nhận diện |
| 10 | `10-fe-rung-ghep-van.md` | Ghép vần dùng dữ liệu tiếng Việt có kiểm soát |
| 11 | `11-fe-dam-ke-chuyen.md` | Truyện từng cảnh, từ mới, hotspot |
| 12 | `12-fe-thu-thach-do-vui.md` | 5 loại trò chơi với engine dùng chung |
| 13 | `13-fe-goc-phu-huynh.md` | Báo cáo thật, lịch sử, cài đặt nghỉ |
| 14 | `14-fe-phan-thuong-va-cay.md` | Ví, đổi quà, huy hiệu và cây lớn |
| 15 | `15-am-thanh-va-ghi-am.md` | Audio thật/fallback, thu âm có đồng ý |
| 16 | `16-fe-quan-tri-va-hoc-lieu.md` | Admin quản trị và quy trình duyệt nội dung |
| 17 | `17-mo-rong-tuy-chon.md` | Speech, QR/OAuth, thiết bị tin cậy, quay thưởng |
| 18 | `18-kiem-thu-va-hoan-thien.md` | Kiểm tra FE + BE + DB + đối chiếu giao diện |
| 19 | `19-chuan-bi-trien-khai.md` | Build, cấu hình production và hướng dẫn chạy |

Phụ trợ: `prompts/TIEP-TUC.md` để nối phiên AI; `prompts/SUA-LOI.md` để sửa một lỗi cụ thể.

## Cấu trúc sau khi AI triển khai

```text
vuon-chu-dieu-ky/
  apps/web/                    ReactJS/Vite
  apps/api/                    Express/Mongoose
  packages/contracts/          Enums, validation và DTO dùng chung
  docs/                        Đặc tả + tiến độ
  prompts/                     Prompt theo bước
  data/                        Seed nguồn; không chứa thông tin trẻ thật
  assets/                      Hình và SVG cục bộ
  reference/                   PRD, DESIGN, HTML và ảnh gốc từ ZIP
  starter/                     .env.example cho FE/BE
```

Sau bước 01, các lệnh root phải được AI thiết lập: `npm run dev`, `npm run lint`, `npm run build`, `npm run test`, `npm run db:indexes`, `npm run db:seed`, `npm run test:e2e`. Hiện tại bộ prompt chưa có các script npm này.

## Phạm vi cần phân biệt

MVP có 8 màn hình theo thiết kế + trang chi tiết học chữ + trang admin hỗ trợ vận hành; 29 chữ, 12 nguyên âm/17 phụ âm, 6 thanh, ghép vần giới hạn, truyện, 5 loại trò chơi, báo cáo phụ huynh, thưởng hạt dẻ và nhắc nghỉ.

Các audio Bắc/Trung/Nam, ảnh minh họa từng từ, PDF học liệu, tài khoản dịch vụ email và mô hình chấm phát âm **chưa có trong ZIP**. Data seed ghi trạng thái thiếu tài nguyên, không tạo URL hoặc phần trăm giả. Khi chưa có audio vùng miền, chỉ dùng đọc máy nếu thiết bị có giọng Việt và ghi rõ đó là giọng thiết bị. Bước 17 không phải điều kiện nghiệm thu MVP.

## Dữ liệu khởi đầu có sẵn

`data/seed/` gồm 29 chữ cái, 6 thanh, 24 mục ghép vần, 24 từ vựng, 5 bài học mẫu, 12 bài tập, 2 truyện ngắn tự viết, 4 quà, 4 huy hiệu, 3 nhiệm vụ ngày và 2 metadata học liệu ở trạng thái draft. Đây là nội dung kỹ thuật khởi đầu, chưa được cố vấn sư phạm duyệt.

`data/seed-manifest.json` xác định thứ tự import, khóa upsert và số lượng. `docs/07-SEED-VA-VAN-HANH.md` giải thích cách đổi khóa thành ObjectId, không reset tiến độ người dùng và không ghi password/PIN dạng rõ vào DB.

## Tài liệu kỹ thuật đã đối chiếu

Kiểm tra ngày 06/10/2026:

- [Vite — Getting Started](https://vite.dev/guide/)
- [Tailwind — Vite installation](https://tailwindcss.com/docs/installation/using-vite)
- [Express — Security](https://expressjs.com/en/advanced/best-practice-security/)
- [MongoDB — Unique indexes](https://www.mongodb.com/docs/manual/core/index-unique/)
- [MongoDB — Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [MongoDB — Transaction deployment considerations](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/)
- [MDN — SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [MDN — getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

Đây là nguồn tham chiếu setup/bảo mật/browser, không phải bằng chứng về hiệu quả học tập hay độ chính xác AI của sản phẩm.
