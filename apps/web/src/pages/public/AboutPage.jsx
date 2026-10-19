import { BookOpen, Brain, CheckCircle2, Eye, Gamepad2, Leaf, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assetRegistry.js";
import { Button } from "../../components/common/Button.jsx";

const pillars = [
  {
    icon: Gamepad2,
    badge: "Trụ cột 01",
    title: "Học Như Chơi Giữa Rừng Xanh",
    text: "Mỗi bài học được thiết kế như một chuyến du hành sinh thái. Bé tương tác với tiếng chim ríu rít, tiếng gió thổi qua vòm tre, học âm O tròn như trăng rừng, chữ A mở ra như lá non."
  },
  {
    icon: Brain,
    badge: "Trụ cột 02",
    title: "Cá Nhân Hóa Bằng AI Bản Ngữ",
    text: "Công nghệ nhận diện giọng nói trẻ em được huấn luyện riêng biệt với bé ngữ âm Việt Nam. Hệ thống lắng nghe giọng nói trong trò chơi, phân hồi dịu dàng, uốn nắn khuôn hình và độ cong của một cách tự nhiên."
  },
  {
    icon: Eye,
    badge: "Trụ cột 03",
    title: "Bảo Vệ Mắt & An Toàn 100%",
    text: "Áp dụng tiêu chuẩn công thái học nhận thức: gam màu thảo mộc dịu mắt, độ tương phản vừa đủ. Chế độ Nghỉ Cú Mèo nhắc nhỏ bé nghỉ ngơi sau đúng 20 phút học."
  }
];

const soundLetters = [
  { letter: "A", label: "Con Gà", color: "bg-[#c8ffe8]" },
  { letter: "B", label: "Quả Bơ", color: "bg-[#ffe5bd]" },
  { letter: "C", label: "Cá Chép", color: "bg-[#cfe9ff]" },
  { letter: "D", label: "Dưa Hấu", color: "bg-[#c8ffe8]" }
];

const resources = [
  "Túi Quà Tặng Ba Mẹ",
  "Vở Tô Chữ 29 Chữ Cái",
  "Flashcard Các Ghép Rừng Đông Vui",
  "Sổ Tay 15 Phút Đồng Hành Cùng Ba Mẹ"
];

export function AboutPage() {
  return (
    <section className="about-page">
      <div className="container-page py-5">
        <div className="rounded-2xl bg-[var(--vc-mint)] p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-[var(--vc-primary)]">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fbbf24] text-white">⌂</span>
              Sóc Nhí và Mầm Lá gửi lời chào bé!
            </span>
            <span className="rounded-full bg-[var(--vc-primary)] px-4 py-2 text-white">Nghe giọng rừng xanh</span>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--vc-mint)] px-4 py-2 text-xs font-black uppercase text-[var(--vc-primary)]">
            <Leaf aria-hidden="true" className="h-4 w-4" /> Về dự án Vườn Chữ Diệu Kỳ
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-tight text-[var(--vc-text)]">
            Nuôi Dưỡng Tình Yêu Tiếng Việt Giữa Thiên Nhiên Diệu Kỳ
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[var(--vc-muted)]">
            Chúng tôi tin rằng học chữ không phải là những trang sách khô khan hay những giờ ngồi gò lưng một mình. Với Vườn Chữ Diệu Kỳ, mỗi nguyên âm, phụ âm và dấu thanh là một mầm xanh reo vui trong gió.
          </p>
          <blockquote className="mt-8 rounded-[28px] border border-[#b9f1dd] bg-white p-7 shadow-soft">
            <p className="text-lg italic leading-8 text-[var(--vc-muted)]">
              “Đứa trẻ nào cũng mang trong mình hạt mầm thay đổi. Chúng tôi muốn biến mỗi chữ cái thành một cây tiếng mẹ đẻ để bé tự nhiên chăm sóc, xanh mượt và vững vàng.”
            </p>
            <footer className="mt-4 text-sm font-black text-[var(--vc-primary)]">TS. Nguyễn Hoàng Lan Anh · Chuyên gia ngôn ngữ trẻ em</footer>
          </blockquote>
          <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            <Fact value="29" label="Chữ cái Tiếng Việt" />
            <Fact value="100%" label="Không quảng cáo" />
            <Fact value="3 Miền" label="Ngữ âm Bắc/Nam/Trung" />
          </div>
        </div>

        <div className="auth-card mx-auto max-w-sm p-8 text-center">
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full bg-[var(--vc-mint)] p-4">
            <img alt="Linh vật Vườn Chữ" className="h-full w-full rounded-full bg-[#fff8dc] object-cover" src={assets.mascotSquirrel} />
          </div>
          <h2 className="mt-6 font-display text-2xl font-black text-[var(--vc-primary)]">Bé ơi, cùng bạn Mầm khám phá nhé!</h2>
          <p className="mt-3 leading-7 text-[var(--vc-muted)]">Tăng chất mầm ngữ chữ qua những trò chơi tự nhiên và nội dung được kiểm soát kỹ.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button className="!min-h-12 text-sm" to="/hoc-thu">Xem thiết kế học</Button>
            <Button className="!min-h-12 text-sm" to="/dang-ky" variant="secondary">Gặp Thầy Cô</Button>
          </div>
        </div>
      </div>

      <div className="bg-white/70 py-16">
        <div className="container-page">
          <div className="grid gap-8">
            <div>
              <span className="inline-flex rounded-full bg-[var(--vc-mint)] px-4 py-2 text-xs font-black uppercase text-[var(--vc-primary)]">
                Phương pháp giáo dục tự nhiên
              </span>
              <h2 className="mt-4 font-display text-3xl font-black">3 Trụ Cột Nuôi Dưỡng Trí Tuệ Bé</h2>
            </div>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {pillars.map((item) => (
              <article className="rounded-[28px] bg-[var(--vc-mint)] p-7 shadow-soft" key={item.title}>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--vc-primary)] text-white">
                  <item.icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <p className="mt-6 text-xs font-black uppercase text-[var(--vc-muted)]">{item.badge}</p>
                <h3 className="mt-3 font-display text-xl font-black">{item.title}</h3>
                <p className="mt-4 leading-7 text-[var(--vc-muted)]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page py-16">
        <div className="rounded-[30px] bg-[var(--vc-mint)] p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-[var(--vc-primary)]">
                Bé hoạt động để học phát âm
              </span>
              <h2 className="mt-4 font-display text-3xl font-black">Khu Vườn Âm Vần Tương Tác</h2>
              <p className="mt-3 leading-7 text-[var(--vc-muted)]">Mỗi chữ cái mang giai điệu riêng. Bé hãy và bé có thể ấn vào từng hạt mầm để nghe tiếng gọi âm thanh trong rừng dung.</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-[var(--vc-primary)]">
                <span>Giọng Bắc</span>
                <span>Giọng Trung</span>
                <span>Giọng Nam</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {soundLetters.map((item) => (
                <div className="rounded-2xl bg-white p-4 text-center shadow-soft" key={item.letter}>
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${item.color} font-display text-2xl font-black text-[var(--vc-primary)]`}>
                    {item.letter}
                  </div>
                  <p className="mt-3 text-sm font-black">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[var(--vc-muted)]">
            Hiển thị đang lắng nghe: nhập vào một chữ cái bất kỳ để trích xuất thanh âm trong trẻo.
          </div>
        </div>
      </div>

      <div className="container-page py-16">
        <div className="rounded-[30px] bg-[var(--vc-mint)] p-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-[var(--vc-primary)]">
                Cam kết vàng cho phụ huynh
              </span>
              <h2 className="mt-5 font-display text-3xl font-black">Không Gian Kỹ Nguyên Số Lành Mạnh Như Khí Trời</h2>
              <p className="mt-4 leading-8 text-[var(--vc-muted)]">Chúng tôi hiểu trẻ nhỏ cần sự cân bằng giữa thế giới con chữ, âm thanh tự nhiên và khoảng nghỉ. Vườn Chữ Diệu Kỳ đặt ưu tiên an toàn lên trước mọi tính năng.</p>
              <ul className="mt-6 grid gap-3 text-[var(--vc-muted)]">
                {["Không quảng cáo, không pop-up khó chịu.", "Bảo mật dữ liệu tuyệt đối.", "Có sẵn học liệu tập tô cho ba mẹ đồng hành."].map((item) => (
                  <li className="flex gap-3" key={item}>
                    <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--vc-primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-soft">
              {resources.map((item) => (
                <div className="flex items-center justify-between gap-4 border-b border-[#d6f5e8] py-4 last:border-b-0" key={item}>
                  <span className="inline-flex items-center gap-3 font-bold">
                    <BookOpen aria-hidden="true" className="h-5 w-5 text-[var(--vc-primary)]" /> {item}
                  </span>
                  <span className="rounded-full bg-[var(--vc-primary)] px-3 py-1 text-xs font-black text-white">Tài liệu</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container-page pb-20">
        <div className="rounded-[30px] bg-[var(--vc-primary)] px-8 py-16 text-center text-white shadow-soft">
          <Leaf aria-hidden="true" className="mx-auto h-10 w-10" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-black leading-tight">
            Cùng Bé Gieo Hạt Mầm Đầu Tiên Ngay Hôm Nay!
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-[#d7fff0]">Tạo tài khoản miễn phí trong 30 giây để cùng con khám phá bảng chữ cái thần tiên, nhận báo cáo tiến trình phát âm mỗi tuần và bộ bài tập in kèm theo.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/dang-ky" variant="reward">Đăng ký tài khoản miễn phí</Button>
            <Button to="/hoc-thu" variant="secondary">Học thử không cần cài đặt</Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm font-bold text-[#d7fff0]">
            <span>Không cần thẻ tín dụng</span>
            <span>Không quảng cáo</span>
            <span>Trung thành ngôn ngữ Việt</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ value, label }) {
  return (
    <div className="rounded-full bg-[var(--vc-mint)] px-6 py-4 text-center shadow-soft">
      <p className="font-display text-2xl font-black text-[var(--vc-primary)]">{value}</p>
      <p className="text-xs font-bold text-[var(--vc-muted)]">{label}</p>
    </div>
  );
}
