import {
  Check,
  Droplets,
  Gamepad2,
  Headphones,
  Heart,
  Lock,
  Music2,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assets } from "../../assets/assetRegistry.js";
import { useMe } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";
import { AcornCounter } from "../../components/domain/AcornCounter.jsx";
import {
  useChildProgress,
  useChildWallet,
  useLetter,
  useLetters,
  usePauseLearningSession,
  useStartAlphabetSession,
  useSubmitAlphabetAnswer
} from "../../learning/useAlphabet.js";
import { useUiStore } from "../../state/useUiStore.js";

const filters = [
  { id: "all", label: "Tất cả" },
  { id: "vowel", label: "Nguyên âm" },
  { id: "consonant", label: "Phụ âm" },
  { id: "completed", label: "Đã hoàn thành" }
];

const letterEmoji = {
  A: "🐝",
  Ă: "🌙",
  Â: "🍄",
  B: "🦋",
  C: "🐠",
  D: "🍈",
  Đ: "✨",
  E: "🐣",
  Ê: "🐸",
  G: "🐔",
  H: "🌹",
  I: "🦔",
  K: "🔍",
  L: "🍁",
  M: "🐱",
  N: "🦌",
  O: "💧",
  Ô: "☂️",
  Ơ: "🌶️",
  P: "🌌",
  Q: "🌂",
  R: "🌳",
  S: "🐿️",
  T: "🐇",
  U: "🌷",
  Ư: "🌱",
  V: "🐘",
  X: "🥭",
  Y: "🕊️"
};

const gameCards = [
  {
    title: "Vỗ cánh cùng Bướm bắt chữ",
    text: "Bướm vàng lượn quanh các đóa hoa. Bé chọn chữ vừa được hỏi để luyện phản xạ nhận diện.",
    reward: "Thưởng do backend tính",
    icon: Gamepad2
  },
  {
    title: "Nghe tiếng đoán muôn loài",
    text: "Bài nghe chỉ mở khi có audio thật trong học liệu. Hiện tại UI báo rõ trạng thái chưa có file.",
    reward: "Không phát file giả",
    icon: Headphones
  }
];

export function AlphabetPage({ guest = false }) {
  const route = useParams();
  const me = useMe(!guest);
  const currentChildId = guest ? null : me.data?.currentChildId;
  const [filter, setFilter] = useState("all");
  const [activeSession, setActiveSession] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [attemptNo, setAttemptNo] = useState(1);
  const [sessionError, setSessionError] = useState(null);
  const ambienceEnabled = useUiStore((state) => state.ambienceEnabled);
  const setAmbienceEnabled = useUiStore((state) => state.setAmbienceEnabled);

  const groupForQuery = filter === "completed" ? "all" : filter;
  const allLettersQuery = useLetters("all");
  const lettersQuery = useLetters(groupForQuery);
  const progressQuery = useChildProgress(currentChildId, Boolean(currentChildId) && !guest);
  const walletQuery = useChildWallet(currentChildId, Boolean(currentChildId) && !guest);
  const startSession = useStartAlphabetSession();
  const submitAnswer = useSubmitAlphabetAnswer(currentChildId);
  const pauseSession = usePauseLearningSession();

  const progressByLetter = useMemo(() => {
    const rows = progressQuery.data?.letters ?? [];
    return new Map(rows.map((item) => [item.letterId, item]));
  }, [progressQuery.data]);

  const letters = lettersQuery.data?.items ?? [];
  const allLetters = allLettersQuery.data?.items ?? letters;
  const filteredLetters =
    filter === "completed" ? letters.filter((letter) => progressByLetter.get(letter.id)?.state === "mastered") : letters;
  const totalLetters = allLetters.length;
  const masteredCount = progressQuery.data?.masteredLetters ?? 0;
  const seenCount = progressQuery.data?.seenLetters ?? 0;
  const suggestedLetter =
    allLetters.find((letter) => letter.symbol === progressQuery.data?.recommendations?.[0]?.symbol) ??
    letters.find((letter) => progressByLetter.get(letter.id)?.state !== "mastered") ??
    letters[0];
  const suggestedSymbol = suggestedLetter?.symbol;
  const detailSymbol = route.symbol ? decodeURIComponent(route.symbol).normalize("NFC") : suggestedSymbol;
  const detailQuery = useLetter(detailSymbol, Boolean(detailSymbol));

  async function handleStart(letter) {
    if (guest) return;
    setSessionError(null);
    setAnswerResult(null);
    setSelectedOptionId(null);
    setAttemptNo(1);
    try {
      const session = await startSession.mutateAsync({ letterId: letter.id });
      setActiveSession({ ...session, letter });
    } catch (error) {
      setSessionError(error);
    }
  }

  async function handleSubmitAnswer() {
    if (!activeSession?.question || !selectedOptionId) return;
    setSessionError(null);
    try {
      const result = await submitAnswer.mutateAsync({
        sessionId: activeSession.id,
        exerciseId: activeSession.question.id,
        attemptNo,
        response: { optionId: selectedOptionId },
        idempotencyKey: `alphabet-${activeSession.id}-${activeSession.question.id}-${attemptNo}-${Date.now()}`
      });
      setAnswerResult(result);
      if (result.nextAttemptNo) {
        setAttemptNo(result.nextAttemptNo);
      } else {
        await pauseSession.mutateAsync(activeSession.id).catch(() => null);
      }
    } catch (error) {
      setSessionError(error);
    }
  }

  if (lettersQuery.isLoading || allLettersQuery.isLoading || (!guest && me.isLoading)) {
    return <LoadingState label="Đang mở khu vườn chữ..." />;
  }

  if (lettersQuery.isError || allLettersQuery.isError) {
    return (
      <ErrorState
        title="Chưa tải được bảng chữ"
        message={lettersQuery.error?.message ?? allLettersQuery.error?.message}
        onRetry={() => {
          lettersQuery.refetch();
          allLettersQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="grid gap-8">
      <SoundscapeBar ambienceEnabled={ambienceEnabled} setAmbienceEnabled={setAmbienceEnabled} />

      <HeroGarden
        guest={guest}
        letter={suggestedLetter}
        masteredCount={masteredCount}
        onStart={handleStart}
        totalLetters={totalLetters}
      />

      <ProgressMeadow
        guest={guest}
        masteredCount={masteredCount}
        seenCount={seenCount}
        totalLetters={totalLetters}
        wallet={walletQuery.data}
      />

      <section className="grid gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#d8fff0] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--vc-primary)]">
              Bách thảo bảng âm tiếng Việt
            </p>
            <h1 className="mt-3 font-display text-2xl font-black text-[#062f29]">Vườn 29 cánh hoa tri thức</h1>
          </div>
          <div className="flex flex-wrap gap-2 rounded-full bg-white/70 p-1.5 shadow-sm">
            {filters.map((item) => (
              <button
                className={`rounded-full px-4 py-2 text-xs font-black transition ${
                  filter === item.id ? "bg-[var(--vc-primary)] text-white shadow-button" : "text-[var(--vc-primary)] hover:bg-[#d8fff0]"
                }`}
                key={item.id}
                onClick={() => setFilter(item.id)}
                type="button"
              >
                {item.label}
                {item.id === "all" ? ` (${totalLetters})` : ""}
              </button>
            ))}
          </div>
        </div>

        {filter === "completed" && !guest && filteredLetters.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--vc-outline)] bg-white p-8 text-center text-[var(--vc-muted)]">
            Chưa có chữ mastered. Bé cần đúng lần đầu ở 2 bài nhận diện khác nhau cho cùng một chữ.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredLetters.map((letter, index) => (
            <LetterTile
              guest={guest}
              index={allLetters.findIndex((item) => item.id === letter.id) >= 0 ? allLetters.findIndex((item) => item.id === letter.id) + 1 : index + 1}
              key={letter.id}
              letter={letter}
              onStart={handleStart}
              progress={progressByLetter.get(letter.id)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-5 md:grid-cols-2">
          {gameCards.map((card) => (
            <GameCard card={card} key={card.title} />
          ))}
        </div>
        <div className="grid gap-5">
          <LetterDetailCard letter={detailQuery.data} loading={detailQuery.isLoading} symbol={detailSymbol} />
          <LearningSessionCard
            activeSession={activeSession}
            answerResult={answerResult}
            error={sessionError}
            guest={guest}
            onReset={() => {
              if (activeSession?.id) pauseSession.mutate(activeSession.id);
              setActiveSession(null);
              setAnswerResult(null);
              setSelectedOptionId(null);
              setAttemptNo(1);
              setSessionError(null);
            }}
            onSelect={setSelectedOptionId}
            onSubmit={handleSubmitAnswer}
            pending={startSession.isPending || submitAnswer.isPending}
            selectedOptionId={selectedOptionId}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] bg-[#c8ffe6] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--vc-primary)] text-white">
            <Heart aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-lg font-black text-[var(--vc-primary)]">Mẹo nhỏ cùng bé hôm nay</h2>
            <p className="text-sm font-medium text-[#536079]">
              Cho bé nhắc lại âm thanh sau mỗi tiếng chuông mẫu để hình thành phản xạ vòm họng tự nhiên.
            </p>
          </div>
        </div>
        <Button className="px-5 py-2.5 text-sm" to="/phu-huynh" variant="secondary">
          Xem cẩm nang phát âm
        </Button>
      </section>
    </section>
  );
}

function SoundscapeBar({ ambienceEnabled, setAmbienceEnabled }) {
  const chips = ["Tiếng chim hót", "Suối róc rách", "Gió thổi lá xào xạc"];
  return (
    <section className="rounded-[28px] bg-[#c8ffe6] p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--vc-primary)] text-white">
            <Music2 aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-black text-[var(--vc-primary)]">Giai điệu rừng xanh</h2>
            <p className="text-sm font-medium text-[#536079]">Âm thanh thiên nhiên êm dịu đồng hành cùng bé.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, index) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                ambienceEnabled && index === 0 ? "bg-[var(--vc-primary)] text-white shadow-button" : "bg-white/75 text-[var(--vc-primary)] hover:bg-white"
              }`}
              key={chip}
              onClick={() => setAmbienceEnabled(!ambienceEnabled)}
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroGarden({ guest, letter, masteredCount, onStart, totalLetters }) {
  const example = letter?.example?.text ?? "Cá vàng";
  const symbol = letter?.symbol ?? "C";
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#c8ffe6] via-[#bff7db] to-[#eafff4] p-5 shadow-soft md:p-8">
      <span className="pointer-events-none absolute left-10 top-8 h-3 w-3 rounded-full bg-[#fbbf24]" />
      <span className="pointer-events-none absolute bottom-8 left-1/3 h-4 w-4 rounded-full bg-[#10b981]" />
      <div className="grid gap-7 lg:grid-cols-[360px_1fr] lg:items-center">
        <div className="relative mx-auto w-full max-w-[330px]">
          <span className="absolute -right-3 -top-3 z-10 rounded-full bg-[#8b5a22] px-4 py-2 text-sm font-black text-white shadow-soft">
            Đội trưởng Hạt Dẻ
          </span>
          <img
            alt="Sóc nhỏ dẫn đường"
            className="aspect-square w-full rounded-[28px] object-cover shadow-[0_18px_35px_rgba(6,95,70,0.22)]"
            src={assets.mascotSquirrel}
          />
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-[#8b5a22]">Sóc Bông tíu tít nhắn bé:</p>
            <p className="mt-2 text-lg font-bold leading-8 text-[#334155]">
              “Chào bạn nhỏ dũng cảm! Hôm nay trong khu vườn thơm ngát, mầm cây chữ{" "}
              <span className="text-[var(--vc-primary)]">{symbol}</span> đang chờ bé khám phá.”
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-[28px] bg-white/85 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-20 w-20 place-items-center rounded-3xl bg-[#ffe3ad] font-display text-5xl font-black text-[#9a5a00] shadow-[0_4px_0_#f59e0b]">
                {symbol}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--vc-primary)]">Chữ cái của ngày</p>
                <h1 className="mt-1 font-display text-2xl font-black text-[#062f29]">{example}</h1>
                <p className="text-sm font-bold text-[#536079]">
                  {letter?.pronunciationHint ?? "Phát âm mẫu sẽ hiển thị khi học liệu có đủ dữ liệu."}
                </p>
              </div>
            </div>
            <button
              aria-label="Nghe phát âm"
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#f59e0b] text-white shadow-[0_5px_0_#9a3412]"
              type="button"
            >
              <Volume2 aria-hidden="true" className="h-8 w-8" />
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {guest ? (
              <Button to="/dang-ky">Tạo hồ sơ để học thật</Button>
            ) : (
              <Button disabled={!letter} onClick={() => letter && onStart(letter)}>
                Khám phá chữ {symbol}
              </Button>
            )}
            <Button to={guest ? "/hoc-thu" : `/be/bang-chu-cai/${encodeURIComponent(symbol)}`} variant="secondary">
              Đọc mẫu toàn vườn
            </Button>
          </div>
          <p className="text-sm font-bold text-[var(--vc-primary)]">
            {guest ? "Chế độ học thử không lưu server." : `Bé đã mastered ${masteredCount}/${totalLetters || 0} chữ.`}
          </p>
        </div>
      </div>
    </section>
  );
}

function ProgressMeadow({ guest, masteredCount, seenCount, totalLetters, wallet }) {
  const percent = totalLetters > 0 ? Math.round((masteredCount / totalLetters) * 100) : 0;
  const milestones = ["A", "B", "C", "D", "M", "Y"];
  return (
    <section className="rounded-[30px] bg-white p-5 shadow-soft md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-lg font-black text-[var(--vc-primary)]">Con đường sỏi hoa thần tiên</h2>
          <p className="mt-1 text-sm font-medium text-[#536079]">
            {guest ? "Bé đang xem thử, chưa lưu tiến độ." : `Bé đã đánh thức ${seenCount} chữ và mastered ${masteredCount}/${totalLetters || 0} chữ.`}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-[#d8fff0] px-4 py-2">
          <Droplets aria-hidden="true" className="h-5 w-5 text-[#007bb9]" />
          <span className="text-sm font-black text-[#007bb9]">Giọt sương năng lượng</span>
          <div className="h-3 w-28 overflow-hidden rounded-full bg-[#a7f3d0]">
            <div className="h-full rounded-full bg-[#007bb9]" style={{ width: `${guest ? 0 : percent}%` }} />
          </div>
          <span className="text-xs font-black text-[#334155]">{guest ? "--" : `${percent}/100`}</span>
        </div>
      </div>

      <div className="relative mt-6">
        <div className="h-3 rounded-full bg-[#c8ffe6]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#f59e0b]" style={{ width: `${guest ? 0 : percent}%` }} />
        </div>
        <div className="-mt-6 flex items-start justify-between">
          {milestones.map((item, index) => {
            const reached = !guest && percent >= (index / (milestones.length - 1)) * 100;
            return (
              <div className="grid justify-items-center gap-1" key={item}>
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black shadow-sm ring-4 ring-white ${
                    reached ? "bg-[var(--vc-primary)] text-white" : "bg-[#d8fff0] text-[var(--vc-primary)]"
                  }`}
                >
                  {reached ? <Check aria-hidden="true" className="h-4 w-4" /> : item}
                </span>
                <span className="text-xs font-bold text-[#536079]">{item}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-[#536079]">
        {guest ? <span>Không có thưởng trong chế độ thử</span> : <AcornCounter value={wallet?.balance ?? null} />}
        <span>{guest ? "Không lưu server" : "Mastery do backend xác nhận"}</span>
      </div>
    </section>
  );
}

function LetterTile({ letter, progress, onStart, guest, index }) {
  const state = progress?.state ?? "new";
  const stateLabel = state === "mastered" ? "Đã nở hoa" : state === "practicing" ? "Đang luyện" : state === "seen" ? "Đã ghé thăm" : "Trạm mới";
  const isMastered = state === "mastered";
  return (
    <article
      className={`group relative grid min-h-[178px] rounded-[24px] border bg-white p-4 text-center shadow-soft transition hover:-translate-y-1 ${
        isMastered ? "border-[#f59e0b] ring-2 ring-[#fbbf24]" : "border-[var(--vc-outline)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#f59e0b]">☆</span>
        <span className="rounded-full bg-[#d8fff0] px-2 py-1 text-[10px] font-black text-[var(--vc-primary)]">Trạm {index}</span>
      </div>
      <Link className="mt-1 grid justify-items-center" to={guest ? "/hoc-thu" : `/be/bang-chu-cai/${encodeURIComponent(letter.symbol)}`}>
        <span className="font-display text-4xl font-black leading-none text-[var(--vc-primary)]">{letter.symbol}</span>
        <span className="mt-2 grid h-12 w-12 place-items-center rounded-full bg-[#fef3c7] text-2xl">
          {letterEmoji[letter.symbol] ?? "🌿"}
        </span>
        <span className="mt-2 line-clamp-1 font-display text-base font-black text-[#062f29]">{letter.example?.text ?? letter.letterName}</span>
      </Link>
      <button
        className="mt-3 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[#d8fff0] px-3 text-xs font-black text-[var(--vc-primary)] transition hover:bg-[var(--vc-primary)] hover:text-white"
        onClick={() => (guest ? null : onStart(letter))}
        type="button"
      >
        <Volume2 aria-hidden="true" className="h-3.5 w-3.5" />
        {guest ? "Xem thử" : stateLabel}
      </button>
    </article>
  );
}

function GameCard({ card }) {
  return (
    <article className="relative overflow-hidden rounded-[30px] bg-white p-6 shadow-soft">
      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-[#c8ffe6]" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#d8fff0] px-3 py-1 text-xs font-black text-[var(--vc-primary)]">
          <card.icon aria-hidden="true" className="h-4 w-4" />
          {card.reward}
        </span>
        <h2 className="mt-4 font-display text-xl font-black text-[#062f29]">{card.title}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-[#536079]">{card.text}</p>
        <Button className="mt-5 w-full py-3 text-sm" variant={card.icon === Headphones ? "reward" : "primary"}>
          {card.icon === Headphones ? "Tham gia nghe đố" : "Bắt đầu vỗ cánh"}
        </Button>
      </div>
    </article>
  );
}

function LetterDetailCard({ letter, loading, symbol }) {
  if (loading) return <LoadingState label="Đang mở thẻ chữ..." />;
  if (!letter) {
    return (
      <div className="rounded-[28px] bg-white p-6 shadow-soft">
        <p className="font-bold text-[var(--vc-muted)]">Chọn một chữ để xem chi tiết.</p>
      </div>
    );
  }
  const audioReady = Object.values(letter.audio ?? {}).some((item) => item.available);
  return (
    <article className="rounded-[28px] bg-white p-6 shadow-soft">
      <p className="font-display text-sm font-black uppercase text-[var(--vc-primary)]">Chữ đang xem</p>
      <div className="mt-4 rounded-[24px] bg-[var(--vc-mint)] p-6 text-center">
        <div className="font-display text-7xl font-black leading-[1.15] text-[var(--vc-primary)]">{letter.symbol ?? symbol}</div>
        <p className="mt-2 font-display text-xl font-black">{letter.letterName}</p>
      </div>
      <div className="mt-5 rounded-2xl border border-[var(--vc-outline)] p-4">
        <p className="text-sm font-black uppercase text-[var(--vc-muted)]">Ví dụ</p>
        <p className="mt-2 text-2xl font-black">{highlightExample(letter.example)}</p>
        {letter.example?.note ? <p className="mt-2 leading-7 text-[var(--vc-muted)]">{letter.example.note}</p> : null}
      </div>
      {letter.teachingNote ? <p className="mt-4 leading-7 text-[var(--vc-muted)]">{letter.teachingNote}</p> : null}
      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--vc-mint)] px-4 font-display font-black text-[var(--vc-primary)]"
        type="button"
      >
        <Volume2 aria-hidden="true" className="h-5 w-5" />
        {audioReady ? "Nghe mẫu" : "Audio chưa có"}
      </button>
    </article>
  );
}

function LearningSessionCard({ activeSession, answerResult, error, guest, onReset, onSelect, onSubmit, pending, selectedOptionId }) {
  if (guest) {
    return (
      <article className="rounded-[28px] bg-white p-6 shadow-soft">
        <p className="font-display text-xl font-black text-[var(--vc-primary)]">Học thử</p>
        <p className="mt-2 leading-7 text-[var(--vc-muted)]">
          Guest chỉ xem học liệu published. Đăng ký để lưu progress, ví hạt dẻ và câu trả lời thật.
        </p>
        <Button className="mt-5" to="/dang-ky">
          Tạo hồ sơ cho bé
        </Button>
      </article>
    );
  }

  if (!activeSession?.question) {
    return (
      <article className="rounded-[28px] bg-white p-6 shadow-soft">
        <p className="font-display text-xl font-black text-[var(--vc-primary)]">Phiên học chữ</p>
        <p className="mt-2 leading-7 text-[var(--vc-muted)]">
          Bấm vào thẻ chữ để backend cấp câu hỏi nhận diện riêng cho bé.
        </p>
        {error ? <p className="mt-4 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{error.message}</p> : null}
      </article>
    );
  }

  const question = activeSession.question;
  return (
    <article className="rounded-[28px] bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-black uppercase text-[var(--vc-primary)]">Câu hỏi backend cấp</p>
          <h2 className="mt-2 font-display text-xl font-black">{question.prompt}</h2>
        </div>
        <button aria-label="Đóng phiên hiện tại trong giao diện" className="rounded-full bg-[var(--vc-mint)] p-3 text-[var(--vc-primary)]" onClick={onReset} type="button">
          <RotateCcw aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {question.options.map((option) => (
          <button
            className={`min-h-14 rounded-2xl border px-4 text-left font-display font-black ${
              selectedOptionId === option.id ? "border-[var(--vc-primary)] bg-[var(--vc-mint)] text-[var(--vc-primary)]" : "border-[var(--vc-outline)] bg-white"
            }`}
            key={option.id}
            onClick={() => onSelect(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {answerResult ? (
        <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ${answerResult.isCorrect ? "bg-[var(--vc-mint)] text-[var(--vc-primary)]" : "bg-[#fff7ed] text-[#9a3412]"}`}>
          {answerResult.isCorrect ? "Bé tìm đúng chữ rồi!" : "Chưa đúng, bé thử lại nhé."}
          {answerResult.rewardGranted?.delta ? ` +${answerResult.rewardGranted.delta} hạt dẻ.` : ""}
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{error.message}</p> : null}
      <Button className="mt-5 w-full" disabled={!selectedOptionId || pending || answerResult?.nextAttemptNo === null} onClick={onSubmit}>
        {pending ? "Đang gửi..." : "Gửi câu trả lời"}
      </Button>
    </article>
  );
}

function highlightExample(example) {
  if (!example?.text) return "Chưa có ví dụ";
  const chars = Array.from(example.text.normalize("NFC"));
  const start = Number.isInteger(example.targetOffset) ? example.targetOffset : -1;
  const length = Number.isInteger(example.targetLength) ? example.targetLength : 0;
  if (start < 0 || length <= 0) return example.text;
  return (
    <>
      {chars.slice(0, start).join("")}
      <mark className="rounded-lg bg-[#fef3c7] px-1 text-[var(--vc-primary)]">{chars.slice(start, start + length).join("")}</mark>
      {chars.slice(start + length).join("")}
    </>
  );
}
