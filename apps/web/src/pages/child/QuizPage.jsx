import {
  BadgeCheck,
  Bird,
  Bug,
  Check,
  ChevronRight,
  CircleDot,
  CloudRain,
  Gift,
  Headphones,
  Leaf,
  Lock,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trophy,
  Turtle,
  Volume2
} from "lucide-react";
import { useMemo, useState } from "react";
import { assets } from "../../assets/assetRegistry.js";
import { useMe } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";
import { useGameEngine, useQuizMissions, useQuizProgress, useQuizWallet } from "../../quiz/useGameEngine.js";

const games = [
  {
    id: "apple-quiz",
    gameType: "identify-letter",
    title: "Cây Táo Đố Chữ Kỳ Diệu",
    short: "Cây táo chữ",
    eyebrow: "Phản xạ với chữ",
    description: "Bé quan sát câu hỏi và chọn quả mang chữ đúng.",
    cta: "Cùng hái quả ngay",
    icon: Gift,
    accent: "#f59e0b",
    image: assets.forest
  },
  {
    id: "butterfly-rime",
    gameType: "match-rime",
    title: "Bắt Bướm Nối Vần",
    short: "Bướm nối vần",
    eyebrow: "Phản xạ nối vần",
    description: "Tìm cánh bướm có vần khớp với câu hỏi backend cấp.",
    cta: "Vào bắt bướm ngay",
    icon: Bug,
    accent: "#2563eb",
    image: assets.treehouse
  },
  {
    id: "frog-word",
    gameType: "listen-word",
    title: "Ếch Nhảy Qua Lá Sen",
    short: "Lá sen từ",
    eyebrow: "Đồng dao & thính giác",
    description: "Khi chưa có audio thật, bé đọc gợi ý chữ và chọn lá sen đúng.",
    cta: "Giúp ếch vượt suối",
    icon: CloudRain,
    accent: "#059669",
    image: assets.mascotDeer
  },
  {
    id: "tone-maze",
    gameType: "select-tone",
    title: "Mê Cung Tìm Dấu Thanh",
    short: "Mê cung dấu",
    eyebrow: "Dấu thanh tiếng Việt",
    description: "Chọn dấu thanh phù hợp, không có đếm ngược hay phạt điểm.",
    cta: "Dẫn đường nào con",
    icon: CircleDot,
    accent: "#ea580c",
    image: assets.mascotSprout
  },
  {
    id: "forest-sounds",
    gameType: "listen-animal",
    title: "Lắng Tai Nghe Tiếng Rừng",
    short: "Âm rừng",
    eyebrow: "Nhận diện âm",
    description: "Chỉ đánh dấu nghe khi có audio thật; hiện tại dùng prompt chữ có nhãn.",
    cta: "Bật loa nghe tiếng",
    icon: Bird,
    accent: "#0284c7",
    image: assets.mascotOwl
  }
];

const encouragement = [
  "Bé thử lại nhẹ nhàng nhé, mỗi lần thử là một mầm cây lớn thêm.",
  "Chưa đúng rồi, mình nhìn kỹ đáp án và chọn lại nào.",
  "Không sao cả, Sóc vẫn đang cổ vũ bé từng bước."
];

export function QuizPage() {
  const me = useMe();
  const childId = me.data?.currentChildId;
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const wallet = useQuizWallet(childId);
  const progress = useQuizProgress(childId);
  const { missions, claim } = useQuizMissions(childId);
  const engine = useGameEngine({ childId, gameType: selectedGame.gameType });

  const mastered = progress.data?.masteredLetters ?? 0;
  const missionItems = missions.data?.items ?? [];
  const completedMissions = missionItems.filter((mission) => mission.claimed || mission.progress?.complete).length;

  const onSelectGame = (game) => {
    if (engine.session?.id && engine.state !== "completed") engine.pause();
    setSelectedGame(game);
  };

  if (me.isLoading) return <LoadingState label="Đang mở đấu trường đố vui..." />;
  if (!childId) {
    return <ErrorState title="Chưa chọn hồ sơ bé" message="Ba mẹ hãy chọn hồ sơ bé trước khi vào thử thách." />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#d9fff1_0%,#ecfff6_45%,#d6ffef_100%)] text-[var(--vc-text)]">
      <section className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-0">
        <HeroArena
          completedMissions={completedMissions}
          mastered={mastered}
          missionCount={missionItems.length}
          onStart={engine.start}
          pending={engine.pending}
          wallet={wallet.data}
        />

        <ActiveGamePanel game={selectedGame} engine={engine} />
        <GameCollection selectedGame={selectedGame} onSelect={onSelectGame} />
        <RewardChest claim={claim} missions={missionItems} wallet={wallet.data} />
      </section>
    </div>
  );
}

function HeroArena({ completedMissions, mastered, missionCount, onStart, pending, wallet }) {
  const missionTotal = Math.max(1, missionCount);
  const percent = Math.min(100, Math.round((completedMissions / missionTotal) * 100));

  return (
    <section className="grid gap-5 rounded-[34px] bg-transparent px-0 py-3 md:grid-cols-[minmax(0,1fr)_320px] md:items-start lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#ffe3ad] px-4 py-2 text-sm font-extrabold text-[#8a4b00]">
          <Trophy className="h-4 w-4" /> Đấu Trường Trí Tuệ Rừng Xanh
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-[30px] font-extrabold leading-[1.12] text-[var(--vc-primary)] sm:text-[36px] md:text-[38px] lg:text-[42px]">
          Thử Thách Đố Vui Cùng Muôn Loài 🎯
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--vc-muted)]">
          Bé giải câu đố chữ cái, bảo vệ mầm non và thu hoạch hạt dẻ thần kỳ để khu rừng lớn lên cùng từng câu trả lời.
        </p>
        <div className="mt-5 max-w-lg rounded-[22px] bg-white p-4 shadow-soft">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0d0] text-[#a85500]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold sm:text-base">Sóc Nâu bé mơm đồng hành vui nhộn</p>
              <p className="mt-1 text-sm leading-6 text-[var(--vc-muted)]">
                Chạm vào chữ bé nghe được và để backend kiểm tra phần thưởng sau mỗi câu.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button className="px-5 py-3 text-sm" disabled={pending} icon={Play} onClick={onStart}>
            Chơi ngay trận này
          </Button>
          <Button className="px-5 py-3 text-sm" disabled icon={Lock} variant="reward">
            Vòng quay bước 17
          </Button>
        </div>
      </div>

      <aside className="flex w-full flex-col rounded-[30px] border border-white/80 bg-white p-4 shadow-[0_18px_0_rgba(0,117,83,0.08),0_18px_38px_rgba(0,117,83,0.16)] md:min-h-[250px] md:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--vc-primary)]">
            <BadgeCheck className="h-4 w-4" /> Nhiệm Vụ Hôm Nay
          </h2>
          <span className="rounded-full bg-[#b9f8de] px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)]">
            {completedMissions}/{missionCount || 0} hoàn tất
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[18px] bg-[#e9fff5] p-3">
            <p className="text-[11px] font-bold text-[var(--vc-muted)]">Hạt dẻ gom</p>
            <p className="mt-1 font-display text-lg font-extrabold">{wallet?.balance ?? 0} hạt</p>
          </div>
          <div className="rounded-[18px] bg-[#e9fff5] p-3">
            <p className="text-[11px] font-bold text-[var(--vc-muted)]">Chữ đã thuộc</p>
            <p className="mt-1 font-display text-lg font-extrabold">{mastered}/29</p>
          </div>
        </div>
        <div className="mt-4 rounded-[22px] bg-[#ffd7a3] p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f59e0b] text-white">
              <Gift className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-extrabold">Rương Thần Kỳ!</p>
              <p className="text-xs leading-5 text-[#7c3f00]">Sẵn sàng mở nhận huy hiệu mới</p>
            </div>
            <button className="rounded-full bg-[#f59e0b] px-4 py-3 text-sm font-extrabold text-[#2a1700] shadow-[0_3px_0_#b45309]" type="button">
              Mở ngay
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 text-[10px] font-bold text-[var(--vc-muted)]">
          <span>Đường mòn đến Rừng Lớn</span>
          <span className="shrink-0 text-right">Cột mốc {completedMissions}/{missionCount || 0}</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-[#d9ffed]">
          <div className="h-full rounded-full bg-[var(--vc-primary)]" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-3 items-center gap-2 text-[10px] font-bold">
          <span className="text-left text-[#ef5da8]">🌸 Đố âm</span>
          <span className="text-center text-[#2f9d61]">🌿 Ghép vần</span>
          <span className="text-right text-[#c27803]">🍯 Tia đố chữ</span>
        </div>
      </aside>
    </section>
  );
}

function ActiveGamePanel({ game, engine }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#d6fff0] px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)]">
            <Leaf className="h-4 w-4" /> Trò chơi nổi bật tuần này
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--vc-primary)]">{game.title} 🍎</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/80 bg-[#c1f8e2] px-4 py-2 text-sm font-bold text-[var(--vc-primary)] shadow-[0_7px_16px_rgba(0,117,83,0.14)]">
            Nghe giọng cô giáo
          </span>
          <span className="rounded-full border border-white/80 bg-[#ffe0a3] px-4 py-2 text-sm font-bold text-[#9a5b00] shadow-[0_7px_16px_rgba(180,83,9,0.14)]">
            Thưởng do server tính
          </span>
        </div>
      </div>

      <div className="rounded-[34px] bg-[#b9f8de] p-5 shadow-soft md:p-7">
        <div className="mb-5 flex justify-center">
          <QuestionPrompt engine={engine} />
        </div>
        <div
          className="overflow-hidden rounded-[28px] bg-cover bg-center p-4 shadow-inner md:p-6"
          style={{ backgroundImage: `linear-gradient(180deg,rgba(255,255,255,.18),rgba(4,82,60,.38)),url(${assets.forest})` }}
        >
          <StageContent game={game} engine={engine} />
        </div>
      </div>
    </section>
  );
}

function QuestionPrompt({ engine }) {
  if (engine.state === "idle") {
    return (
      <div className="w-full max-w-2xl rounded-[26px] bg-white p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#f59e0b] text-white">
            <Volume2 className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#a85500]">Sẵn sàng vào vòng 5 câu</p>
            <p className="mt-1 text-lg font-bold leading-7">Bấm “Chơi ngay trận này” để máy chủ cấp câu hỏi mới.</p>
          </div>
        </div>
      </div>
    );
  }

  if (engine.state === "loading") {
    return (
      <div className="w-full max-w-2xl rounded-[26px] bg-white p-5 shadow-soft">
        <LoadingState label="Đang xin câu hỏi từ máy chủ..." />
      </div>
    );
  }

  if (engine.state === "error") {
    return (
      <div className="w-full max-w-2xl rounded-[26px] bg-white p-5 shadow-soft">
        <ErrorState title="Chưa chơi được vòng này" message={engine.error?.message} onRetry={engine.start} />
      </div>
    );
  }

  if (engine.state === "completed") {
    return (
      <div className="w-full max-w-2xl rounded-[26px] bg-white p-5 shadow-soft">
        <CompletedPanel engine={engine} compact />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded-[26px] bg-white p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#f59e0b] text-white">
          <Volume2 className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#a85500]">
            Câu đố số {engine.questionIndex + 1}/{engine.totalCount || 5}
          </p>
          <p className="mt-1 text-lg font-bold leading-7">{engine.currentQuestion?.prompt}</p>
        </div>
      </div>
    </div>
  );
}

function StageContent({ game, engine }) {
  if (engine.state === "idle") {
    return (
      <div className="grid min-h-[270px] place-items-center text-center">
        <Button disabled={engine.pending} icon={Play} onClick={engine.start}>
          Bắt đầu vòng đố vui
        </Button>
      </div>
    );
  }
  if (engine.state === "loading" || engine.state === "error" || engine.state === "completed") {
    return <div className="min-h-[270px]" />;
  }
  if (!engine.currentQuestion) {
    return (
      <div className="rounded-[24px] bg-white p-5">
        <ErrorState title="Thiếu câu hỏi" message="Máy chủ chưa trả câu hỏi cho vòng này." />
      </div>
    );
  }

  const Renderer = rendererByType[game.gameType] ?? GenericRenderer;
  return (
    <>
      <Renderer engine={engine} />
      <div className="mt-5 rounded-[18px] bg-white/90 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--vc-muted)]">
            <ShoppingBag className="h-4 w-4 text-[#a85500]" /> Giỏ thu hoạch của bé
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              className="min-h-0 px-4 py-2 text-sm"
              disabled={!engine.selectedOptionId || engine.pending || engine.state === "feedback"}
              onClick={engine.submit}
            >
              Kết quả
            </Button>
            {engine.state === "feedback" && !engine.feedback?.isCorrect && engine.feedback?.nextAttemptNo ? (
              <Button className="min-h-0 px-4 py-2 text-sm" onClick={engine.retryQuestion} variant="secondary">
                Thử lại
              </Button>
            ) : null}
            {engine.state === "feedback" && (engine.feedback?.isCorrect || !engine.feedback?.nextAttemptNo) ? (
              <Button className="min-h-0 px-4 py-2 text-sm" icon={ChevronRight} onClick={engine.nextQuestion}>
                {engine.questionIndex + 1 >= engine.totalCount ? "Xem kết quả" : "Câu tiếp"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {engine.feedback ? <FeedbackPanel engine={engine} /> : null}
    </>
  );
}

function GameCollection({ selectedGame, onSelect }) {
  const cards = games.filter((game) => game.id !== selectedGame.id).slice(0, 4);
  return (
    <section className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#d6fff0] px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)]">
            <BadgeCheck className="h-4 w-4" /> Thao trường vốn ngôn ngữ
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--vc-primary)]">4 Trò Chơi Luyện Phản Xạ Ngôn Ngữ</h2>
          <p className="mt-1 text-sm text-[var(--vc-muted)]">Đa dạng hình thức nghe, quan sát, phân đoạn dấu thanh và ghép vần cùng bạn muôn loài.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-full bg-[var(--vc-primary)] px-4 py-2 font-bold text-white">Tất cả</span>
          <span className="rounded-full bg-[#d6fff0] px-4 py-2 font-bold text-[var(--vc-primary)]">Dấu thanh</span>
          <span className="rounded-full bg-[#d6fff0] px-4 py-2 font-bold text-[var(--vc-primary)]">Vần điệu</span>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((game) => (
          <GameCard game={game} key={game.id} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function GameCard({ game, onSelect }) {
  const Icon = game.icon;
  return (
    <article className="rounded-[26px] bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef8ff]" style={{ color: game.accent }}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="inline-flex rounded-full bg-[#fff1c7] px-3 py-1 text-xs font-bold text-[#9a5b00]">{game.eyebrow}</p>
          <h3 className="mt-2 font-display text-xl font-extrabold">{game.title}</h3>
        </div>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--vc-muted)]">{game.description}</p>
      <div className="mt-4 overflow-hidden rounded-[22px] bg-[#e4fff3]">
        <img alt="" className="h-40 w-full object-cover" src={game.image} />
      </div>
      <button
        className="target-56 mt-4 w-full rounded-full bg-[var(--vc-primary)] px-5 py-3 font-display font-extrabold text-white shadow-button transition active:translate-y-[3px] motion-reduce:transition-none"
        onClick={() => onSelect(game)}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <Play className="h-5 w-5" /> {game.cta}
        </span>
      </button>
    </article>
  );
}

function RewardChest({ claim, missions, wallet }) {
  return (
    <section className="mt-12 grid gap-6 rounded-[34px] bg-[#bdf8dd] p-6 shadow-soft lg:grid-cols-[380px_1fr] lg:items-center">
      <div className="text-center">
        <div className="relative mx-auto aspect-square w-64 max-w-full rounded-full bg-[conic-gradient(#f59e0b_0_25%,#fde68a_25%_50%,#86efac_50%_75%,#bae6fd_75%_100%)] shadow-soft">
          <div className="absolute inset-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[var(--vc-primary)]">
            <Sparkles className="h-8 w-8" />
          </div>
          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-[#b91c1c] px-3 py-1 text-xs font-bold text-white">Khóa</span>
        </div>
        <Button className="mt-5" disabled icon={Lock} variant="reward">
          Vòng quay mở ở bước 17
        </Button>
        <p className="mt-2 text-sm text-[var(--vc-muted)]">Bé có {wallet?.balance ?? 0} hạt dẻ sẵn sàng trong ví.</p>
      </div>
      <div>
        <span className="inline-flex rounded-full bg-[#fff1c7] px-4 py-2 text-sm font-bold text-[#9a5b00]">Đổi quà đọc quyền</span>
        <h2 className="mt-3 font-display text-3xl font-extrabold text-[var(--vc-primary)]">Rương Quà Rừng Xanh Thần Kỳ</h2>
        <p className="mt-2 max-w-2xl text-[var(--vc-muted)]">
          Rương chỉ mở qua nhiệm vụ backend; trang không tự claim thưởng hay quay may mắn bằng cờ local.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {missions.slice(0, 3).map((mission) => (
            <article className="rounded-[22px] bg-white p-4 text-center" key={mission.id}>
              <Gift className="mx-auto h-7 w-7 text-[var(--vc-primary)]" />
              <h3 className="mt-2 font-display text-base font-extrabold">{mission.title}</h3>
              <p className="mt-1 text-sm text-[var(--vc-muted)]">+{mission.rewardAcorns} hạt dẻ</p>
              {mission.claimable ? (
                <button
                  className="mt-3 rounded-full bg-[#f59e0b] px-4 py-2 text-sm font-bold text-[#2a1700] disabled:opacity-60"
                  disabled={claim.isPending}
                  onClick={() => claim.mutate(mission.id)}
                  type="button"
                >
                  Nhận
                </button>
              ) : (
                <span className="mt-3 inline-flex rounded-full bg-[var(--vc-mint)] px-3 py-1 text-xs font-bold text-[var(--vc-primary)]">
                  {mission.claimed ? "Đã nhận" : "Đang làm"}
                </span>
              )}
            </article>
          ))}
          {!missions.length ? (
            <article className="rounded-[22px] bg-white p-4 text-center sm:col-span-3">
              <Lock className="mx-auto h-7 w-7 text-[var(--vc-primary)]" />
              <p className="mt-2 font-bold">Chưa có nhiệm vụ từ máy chủ.</p>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AppleRenderer({ engine }) {
  return (
    <OptionGrid engine={engine} className="grid-cols-2 lg:grid-cols-4">
      {(option, active) => (
        <span className={`grid min-h-[132px] place-items-center rounded-[28px] ${active ? "bg-[#fff1c7]" : "bg-white"}`}>
          <span className={`grid h-20 w-20 place-items-center rounded-full text-4xl font-extrabold text-white shadow-sm ${active ? "bg-[#f59e0b]" : "bg-[var(--vc-primary)]"}`}>
            {option.label}
          </span>
          <span className="mt-2 text-xs font-bold text-[var(--vc-muted)]">Quả chữ {option.label}</span>
        </span>
      )}
    </OptionGrid>
  );
}

function ButterflyRenderer({ engine }) {
  return (
    <OptionGrid engine={engine} className="grid-cols-2 lg:grid-cols-4">
      {(option, active) => (
        <span className={`grid min-h-[132px] place-items-center rounded-[30px] ${active ? "bg-[#dbeafe]" : "bg-white"}`}>
          <Bug className="h-9 w-9 text-[#2563eb]" />
          <span className="font-display text-2xl font-extrabold">{option.label}</span>
        </span>
      )}
    </OptionGrid>
  );
}

function FrogWordRenderer({ engine }) {
  return (
    <OptionGrid engine={engine} className="grid-cols-1 sm:grid-cols-2">
      {(option, active) => (
        <span className={`grid min-h-[112px] place-items-center rounded-[40px] ${active ? "bg-[#bbf7d0]" : "bg-white"}`}>
          <Turtle className="h-8 w-8 text-[var(--vc-primary)]" />
          <span className="font-display text-2xl font-extrabold">{option.label}</span>
        </span>
      )}
    </OptionGrid>
  );
}

function ToneMazeRenderer({ engine }) {
  return (
    <OptionGrid engine={engine} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {(option, active, index) => (
        <span className={`relative grid min-h-[140px] place-items-center rounded-[26px] ${active ? "bg-[#fed7aa]" : "bg-white"}`}>
          <span className="absolute left-4 top-3 text-xs font-bold text-[var(--vc-muted)]">Nút {index + 1}</span>
          <span className="font-display text-xl font-extrabold">{option.label}</span>
        </span>
      )}
    </OptionGrid>
  );
}

function ForestSoundsRenderer({ engine }) {
  return (
    <OptionGrid engine={engine} className="grid-cols-1 sm:grid-cols-2">
      {(option, active) => (
        <span className={`grid min-h-[112px] place-items-center rounded-[26px] ${active ? "bg-[#dbeafe]" : "bg-white"}`}>
          <Headphones className="h-8 w-8 text-[#0284c7]" />
          <span className="font-display text-2xl font-extrabold">{option.label}</span>
        </span>
      )}
    </OptionGrid>
  );
}

function GenericRenderer({ engine }) {
  return <OptionGrid engine={engine}>{(option) => <span className="font-display text-xl font-extrabold">{option.label}</span>}</OptionGrid>;
}

const rendererByType = {
  "identify-letter": AppleRenderer,
  "match-rime": ButterflyRenderer,
  "listen-word": FrogWordRenderer,
  "select-tone": ToneMazeRenderer,
  "listen-animal": ForestSoundsRenderer
};

function OptionGrid({ engine, children, className = "grid-cols-1 sm:grid-cols-2" }) {
  return (
    <div className={`grid auto-rows-fr gap-4 ${className}`}>
      {engine.currentQuestion.options.map((option, index) => {
        const active = engine.selectedOptionId === option.id;
        return (
          <button
            className={`target-56 h-full rounded-[30px] border-2 p-2 text-center shadow-soft transition motion-reduce:transition-none ${
              active ? "border-[var(--vc-primary)] bg-white" : "border-transparent bg-white/88 hover:border-[var(--vc-outline)]"
            }`}
            disabled={engine.pending || engine.state === "feedback"}
            key={option.id}
            onClick={() => engine.setSelectedOptionId(option.id)}
            type="button"
          >
            {children(option, active, index)}
          </button>
        );
      })}
    </div>
  );
}

function FeedbackPanel({ engine }) {
  const message = useMemo(() => encouragement[engine.questionIndex % encouragement.length], [engine.questionIndex]);
  const correct = engine.feedback?.isCorrect;
  return (
    <div className={`mt-4 rounded-[24px] p-4 font-bold ${correct ? "bg-[var(--vc-mint)] text-[var(--vc-primary)]" : "bg-[#fff7ed] text-[#9a3412]"}`}>
      <div className="flex items-center gap-2">
        {correct ? <Check className="h-5 w-5" /> : <Leaf className="h-5 w-5" />}
        <span>{correct ? "Đúng rồi, bé giỏi quá!" : message}</span>
      </div>
      {engine.feedback?.rewardGranted?.delta ? <p className="mt-2">Backend thưởng +{engine.feedback.rewardGranted.delta} hạt dẻ.</p> : null}
      {engine.feedback?.duplicate ? <p className="mt-2 text-sm">Câu trả lời trùng đã được nhận trước đó, không cộng thêm thưởng.</p> : null}
    </div>
  );
}

function CompletedPanel({ engine, compact = false }) {
  return (
    <div className={`${compact ? "" : "mt-5"} text-center`}>
      <Sparkles className="mx-auto h-10 w-10 text-[var(--vc-primary)]" />
      <h3 className="mt-3 font-display text-2xl font-extrabold">Hoàn thành một vòng đố vui!</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--vc-muted)]">
        Báo cáo, ví hạt dẻ và nhiệm vụ ngày đã được cập nhật từ backend theo từng câu trả lời.
      </p>
      <Button className="mt-4" icon={RotateCcw} onClick={engine.start}>
        Chơi vòng mới
      </Button>
    </div>
  );
}
