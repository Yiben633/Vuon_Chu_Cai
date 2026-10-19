import { ArrowRight, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assetRegistry.js";
import { getApiReadiness } from "../../api/client.js";
import { queryKeys } from "../../api/queryKeys.js";
import { Button } from "../../components/common/Button.jsx";
import { Card } from "../../components/common/Card.jsx";
import { AudioButton } from "../../components/domain/AudioButton.jsx";
import { LetterCard } from "../../components/domain/LetterCard.jsx";
import { MascotGuide } from "../../components/domain/MascotGuide.jsx";
import { learningCards, pillars, sampleLetters } from "../../content/landingContent.js";

export function HomePage() {
  const readiness = useQuery({
    queryKey: queryKeys.readiness(),
    queryFn: getApiReadiness,
    retry: false
  });

  return (
    <>
      <section className="hero-forest">
        <div className="container-page grid min-h-[calc(100vh-5rem)] items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="max-w-3xl">
            <p className="font-display text-sm font-black uppercase text-[var(--vc-primary)] sm:text-base">
              Học chữ tiếng Việt trong khu vườn dịu mắt
            </p>
            <h1 className="mt-4 font-display text-[34px] font-black leading-[1.12] text-[var(--vc-text)] sm:text-5xl">
              Vườn Chữ Diệu Kỳ
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--vc-muted)]">
              Bé làm quen 29 chữ cái, ghép vần và đọc truyện bằng trải nghiệm thiên nhiên. Mọi tiến độ,
              điểm thưởng và quyền truy cập riêng tư đều do backend xác thực.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button icon={PlayCircle} to="/hoc-thu" variant="reward">Học thử</Button>
              <Button icon={ArrowRight} to="/dang-ky">Tạo tài khoản</Button>
            </div>
            <div className="mt-6">
              <AudioButton />
            </div>
          </div>

          <MascotGuide title="Sóc nhỏ dẫn đường">
            <p>
              Linh vật được đặt trong card riêng vì ảnh PNG có nền vuông. Khi có audio thật, nút nghe sẽ
              được nối ở bước âm thanh.
            </p>
          </MascotGuide>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <div className="target-56 inline-flex rounded-2xl bg-[var(--vc-mint)] p-4 text-[var(--vc-primary)]">
                <pillar.icon aria-hidden="true" className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-black">{pillar.title}</h2>
              <p className="mt-3 leading-7 text-[var(--vc-muted)]">{pillar.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page grid gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="font-display text-sm font-black uppercase text-[var(--vc-primary)]">Mẫu chữ</p>
          <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">Dấu tiếng Việt được chừa đủ khoảng thở</h2>
          <p className="mt-4 leading-8 text-[var(--vc-muted)]">
            Thẻ chữ dùng line-height rộng để không cắt Ă, Â, Ê, Ô, Ơ, Ư hoặc dấu thanh trên màn hình nhỏ.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sampleLetters.map((letter) => (
            <LetterCard key={letter.symbol} {...letter} />
          ))}
        </div>
      </section>

      <section className="treehouse-band mt-8">
        <div className="container-page py-12 text-white">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-black uppercase text-[#bbf7d0]">Lối vào học liệu</p>
            <h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">Bốn khu học chính đã có route</h2>
          </div>
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-6 sm:gap-8">
            {learningCards.map((card) => (
              <Link
                aria-label={card.title}
                className="group target-56 inline-flex w-16 items-center overflow-hidden rounded-full bg-white px-4 text-[var(--vc-primary)] shadow-[0_4px_0_#00543a] transition-[width,background-color,transform] duration-300 ease-out hover:w-56 hover:bg-[var(--vc-mint)] focus-visible:w-56 focus-visible:bg-[var(--vc-mint)] active:translate-y-[3px]"
                key={card.to}
                to={card.to}
              >
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 shrink-0 translate-x-0 transition-transform duration-300 group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                  src={card.icon}
                />
                <span className="ml-3 max-w-0 whitespace-nowrap font-display font-extrabold opacity-0 transition-[max-width,opacity,transform] duration-300 group-hover:max-w-40 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:translate-x-1 group-focus-visible:opacity-100">
                  {card.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-3xl font-black">Sẵn sàng nối API thật</h2>
              <p className="mt-2 leading-7 text-[var(--vc-muted)]">
                Trạng thái hiện tại: {readiness.data?.ready ? "API đã sẵn sàng" : "API chưa ready hoặc chưa có Mongo"}.
              </p>
            </div>
            <Button to="/dang-nhap">Vào tài khoản</Button>
          </div>
        </div>
      </section>
    </>
  );
}
