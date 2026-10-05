# 05 — Design system và tài nguyên

## Thứ tự tham chiếu

PRD quyết định nghiệp vụ; screenshot quyết định bố cục/tỷ lệ; DESIGN.md cung cấp tokens; docs/01–04 giải quyết xung đột. Mã HTML là nguồn tham khảo layout, không nhúng qua iframe và không copy JavaScript DOM vào React.

Chốt palette FE: background `#e7fff3`, surface `#ffffff`, mint `#cbffe8`, primary `#006948`, primaryContainer `#00855d`, text `#002117`, mutedText `#3d4a42`, reward `#f59e0b`, lotus `#f472b6`, outline `#bccac0`. Primary dùng bảng YAML của DESIGN để nhất quán; emerald `#059669/#047857` dùng accent/shadow trong component. Kiểm tra contrast thực tế từng cặp màu, không mặc định tin tuyên bố AAA trong design.

Font: Quicksand heading, Nunito Sans body. Dùng font có subset tiếng Việt cục bộ khi đóng gói được; fallback sans-serif đủ dấu. Heading desktop 32px, hero48px, mobile hero34px; body17px/26px; glyph dạy chữ 48–80px và line-height đủ không cắt Ă/Â/Ê/Ô/Ơ/Ư hoặc dấu thanh.

Radius card24–32px, button pill, input16–24px. Touch target tối thiểu56×56px, nút âm thanh64–68px. Button ridge4px, active translateY3px; respect prefers-reduced-motion. Focus ring rõ, semantic buttons, label inputs và aria-label cho icon. Không chỉ dùng màu để báo đúng/sai.

Desktop content max1200px; tablet 640–1024px 2–3 cột; mobile <640px stack1 cột, 16px gutter. Alphabet grid có thể2–3 cột mobile, 4 tablet, 5–6 desktop tùy chiều rộng; thẻ vẫn đủ56px hit target. Sidebar parent collapse drawer mobile; child nav rút gọn có nhãn, không thu chữ bé quá nhỏ.

## Components

`Button`, `IconButton`, `Card`, `Badge`, `Chip`, `Dialog`, `Tabs`, `TextField`, `Select`, `ProgressBar`, `EmptyState`, `ErrorState`, `Skeleton`, `Toast`, `ConfirmDialog` và `PinGate`.

Domain: `MascotGuide`, `LetterCard`, `AudioButton`, `AmbienceControl`, `ForestPath`, `SpellingBoard`, `ToneChip`, `StoryPlayer`, `VocabularyCard`, `QuizQuestion`, `AcornCounter`, `GrowthTree`, `RewardCard`, `BreakOverlay`, `ChildProfilePicker`.

Mỗi page dùng components chung và service hooks, không copy header/footer 8 lần. Server data qua TanStack Query; Zustand chỉ UI/audio/current profile. Khi switch child, query key chứa childId; clear private cache lúc logout/gate đóng. Audio dừng khi logout/chuyển hồ sơ/route rời player.

## Asset mapping

File `assets/manifest.json` chứa key, localPath, MIME, size, checksum, sourceOriginalPath và licenseStatus. Asset được **chép nguyên byte**, không chỉnh sửa/tách nền giả.

| Key | File cục bộ | Sử dụng |
|---|---|---|
| brand-logo | `assets/images/brand-logo.png` | Header, auth; logo hiện có chữ/nền |
| mascot-squirrel | `assets/images/mascot-squirrel.png` | Portrait Sóc trong guide; PNG nền vuông |
| background-forest | `assets/images/background-forest.png` | Hero/learning intro |
| background-treehouse | `assets/images/background-treehouse.png` | Story section/banner |
| icon-acorn | `assets/icons/acorn.svg` | Hạt dẻ vàng |
| icon-sprout | `assets/icons/sprout.svg` | Mầm/level |
| icon-lotus | `assets/icons/lotus.svg` | Đầm truyện |
| icon-apple | `assets/icons/apple.svg` | Quiz |

`assets/icons/*.png` giữ ảnh icon preview từ nguồn nếu cần. `assets/inventory.json` ghi danh sách ảnh remote tham chiếu trong HTML. Không tự tải tất cả link remote không rõ quyền; thumbnail từng từ/truyện chưa có local asset thì fallback illustration nhẹ có nhãn (CSS/icon/emoji nhất quán). Muốn giữ chính xác remote illustration cần kiểm tra quyền và tải thành local trong bước riêng.

Screenshot màn hình giữ trong reference chỉ để đối chiếu. Không cắt các screenshot làm thành UI toàn trang. Copy assets tới `apps/web/public/assets/`; BE public media registry phục vụ audio/PDF theo assetKey nếu sau này bổ sung. Không trả link private recording từ public registry.

Nền trang chỉ dùng mảng trang trí ở header/hero, độ tương phản mềm. Linh vật 3D rất chi tiết nên đặt trong card riêng với nền cream và viền đồng bộ; không kéo lớn thành background hoặc blur mọi ảnh làm khó đọc. Không dùng object-cover cắt mất mặt Sóc hoặc logo; dùng contain cho logo/mascot, cover chỉ background/thumbnail phù hợp.

## Từng màn hình

- Giới thiệu: hero2 cột, mascot, 3 trụ cột, 4 sample chữ, khối học liệu và CTA. Không giữ tên chuyên gia, số người dùng hay độ chính xác chưa có bằng chứng.
- Alphabet: audio ambience opt-in, lời chào Sóc, chữ gợi ý, đường tiến độ, grid29, filter12/17 và card game. Số liệu lấy progress thật; guest có nhãn học thử.
- Spelling: bảng chọn onset/rime/tone → kết quả, hướng dẫn, quick quiz, card từ. Invalid combination hiện lời nhắc nhẹ; không cộng reward khi chỉ chọn word.
- Story: filter categories, player cảnh, từ mới, moral, thư viện, roleplay. Play chỉ chạy khi có audio/TTS thật; timeline không chạy giả.
- Quiz: guide/nhiệm vụ, cây táo, 4 game phụ, rewards. Mỗi CTA mở game thật; lucky wheel hidden MVP.
- Parent: sidebar, picker child, KPI thật, growth tree, bảng nhận diện và bài cần ôn, settings, resource/inbox. Không dùng bảng “98% phát âm” nếu chưa assessment.
- Auth: form parent/child/profile, thao tác chọn ageBand/dialect/mascot như thiết kế; no success trước response201/200; submit pending/disabled.
- Admin: style cùng palette nhưng ưu tiên thao tác nhanh, table/form/preview/version/publish state; thêm layout vì nguồn chưa có admin.

## Trạng thái bắt buộc

Loading, empty, error+retry, offline, session expired, PIN gate closed, daily limit, reward insufficient, already owned, media unavailable, mic denied, consent absent. Không toast “đã lưu” khi mutation thất bại. Dialog keyboard trap/restore focus; drag/drop có bấm chọn và keyboard alternative.
