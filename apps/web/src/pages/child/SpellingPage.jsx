import {
  CheckCircle2,
  Leaf,
  Mic,
  Mountain,
  Play,
  RotateCcw,
  Sparkles,
  Sprout,
  Trees,
  Trophy,
  Volume2,
  Wand2
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMe } from "../../auth/useAuth.js";
import { assets } from "../../assets/assetRegistry.js";
import { Button } from "../../components/common/Button.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";
import { AcornCounter } from "../../components/domain/AcornCounter.jsx";
import { choicesFor, findSpellingEntry, isCompleteSlots, nfc, toneChoicesFor } from "../../spelling/spellingLookup.js";
import {
  useChildWalletSnapshot,
  usePauseSpellingSession,
  useSpellingEntries,
  useStartSpellingSession,
  useSubmitSpellingAnswer,
  useTones,
  useVocabulary
} from "../../spelling/useSpelling.js";

const dialects = [
  { id: "north", label: "Giọng Bắc", region: "Hà Nội" },
  { id: "central", label: "Giọng Trung", region: "miền Trung" },
  { id: "south", label: "Giọng Nam", region: "miền Nam" }
];

const emptySlots = { onset: "", rime: "", toneCode: "ngang" };

const fallbackVocabulary = [
  { id: "fallback-ca", word: "Cá", spelling: "C - Á", meaning: "Con cá tung tăng trong làn nước xanh.", image: assets.mascotDeer },
  { id: "fallback-cay", word: "Cây", spelling: "C - Â - Y", meaning: "Cây xanh tỏa bóng mát trong khu rừng.", image: assets.forest },
  { id: "fallback-suoi", word: "Suối", spelling: "S - U - Ố - I", meaning: "Dòng suối trong veo chảy qua thung lũng.", image: assets.treehouse },
  { id: "fallback-mat-troi", word: "Mặt trời", spelling: "M - Ặ - T", meaning: "Mặt trời gọi những mầm cây thức dậy.", image: assets.mascotSprout }
];

export function SpellingPage() {
  const me = useMe();
  const currentChildId = me.data?.currentChildId;
  const entriesQuery = useSpellingEntries();
  const tonesQuery = useTones();
  const vocabQuery = useVocabulary({ limit: 50 });
  const walletQuery = useChildWalletSnapshot(currentChildId, Boolean(currentChildId));
  const startSession = useStartSpellingSession();
  const submitAnswer = useSubmitSpellingAnswer(currentChildId);
  const pauseSession = usePauseSpellingSession();

  const [slots, setSlots] = useState({ onset: "c", rime: "a", toneCode: "sac" });
  const [dragToken, setDragToken] = useState(null);
  const [dialect, setDialect] = useState("north");
  const [activeSession, setActiveSession] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [attemptNo, setAttemptNo] = useState(1);
  const [answerResult, setAnswerResult] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  const entries = useMemo(() => entriesQuery.data?.items ?? [], [entriesQuery.data]);
  const tones = useMemo(() => tonesQuery.data?.items ?? [], [tonesQuery.data]);
  const vocabulary = useMemo(() => vocabQuery.data?.items ?? [], [vocabQuery.data]);
  const result = useMemo(() => findSpellingEntry(entries, slots), [entries, slots]);
  const isComplete = isCompleteSlots(slots);
  const invalidCombination = isComplete && !result;

  const onsetChoices = useMemo(() => choicesFor(entries, "onset").slice(0, 6), [entries]);
  const rimeChoices = useMemo(() => choicesFor(entries, "rime").slice(0, 6), [entries]);
  const toneChoices = useMemo(() => toneChoicesFor(entries, tones), [entries, tones]);
  const vocabularyById = useMemo(() => new Map(vocabulary.map((item) => [item.id, item])), [vocabulary]);
  const matchingVocabulary = result?.vocabularyId ? vocabularyById.get(result.vocabularyId) : null;
  const vocabularyCards = useMemo(() => {
    const fromData = entries
      .slice(0, 4)
      .map((entry) => {
        const vocab = vocabularyById.get(entry.vocabularyId);
        if (!vocab) return null;
        return {
          id: vocab.id,
          word: vocab.word,
          spelling: `${entry.onset.toLocaleUpperCase("vi-VN")} - ${entry.rime.toLocaleUpperCase("vi-VN")}`,
          meaning: vocab.meaning,
          image: assets.forest
        };
      })
      .filter(Boolean);
    return fromData.length ? fromData : fallbackVocabulary;
  }, [entries, vocabularyById]);

  const plantedEntries = useMemo(() => entries.slice(0, 4), [entries]);
  const selectedDialect = dialects.find((item) => item.id === dialect) ?? dialects[0];

  function setSlot(slot, value) {
    setSlots((current) => ({ ...current, [slot]: nfc(value) }));
    setAnswerResult(null);
    setSessionError(null);
  }

  function resetBoard() {
    setSlots(emptySlots);
    setActiveSession(null);
    setAnswerResult(null);
    setSelectedOptionId(null);
    setAttemptNo(1);
    setSessionError(null);
  }

  function handleDrop(slot) {
    if (!dragToken) return;
    if (dragToken.type === slot) setSlot(slot, dragToken.value);
    setDragToken(null);
  }

  async function startQuickQuiz() {
    if (!result) return;
    setSessionError(null);
    setAnswerResult(null);
    setSelectedOptionId(null);
    setAttemptNo(1);
    try {
      const session = await startSession.mutateAsync({ spellingEntryId: result.id });
      setActiveSession({ ...session, spelling: result });
    } catch (error) {
      setSessionError(error);
    }
  }

  async function submitQuickQuiz() {
    if (!activeSession?.question || !selectedOptionId) return;
    setSessionError(null);
    try {
      const answer = await submitAnswer.mutateAsync({
        sessionId: activeSession.id,
        exerciseId: activeSession.question.id,
        attemptNo,
        response: { optionId: selectedOptionId },
        idempotencyKey: `spelling-${activeSession.id}-${activeSession.question.id}-${attemptNo}-${Date.now()}`
      });
      setAnswerResult(answer);
      if (answer.nextAttemptNo) {
        setAttemptNo(answer.nextAttemptNo);
      } else {
        await pauseSession.mutateAsync(activeSession.id).catch(() => null);
      }
    } catch (error) {
      setSessionError(error);
    }
  }

  if (entriesQuery.isLoading || tonesQuery.isLoading || vocabQuery.isLoading || me.isLoading) {
    return <LoadingState label="Đang mở rừng ghép vần..." />;
  }

  if (entriesQuery.isError || tonesQuery.isError || vocabQuery.isError) {
    return (
      <ErrorState
        title="Chưa tải được dữ liệu ghép vần"
        message={entriesQuery.error?.message ?? tonesQuery.error?.message ?? vocabQuery.error?.message}
        onRetry={() => {
          entriesQuery.refetch();
          tonesQuery.refetch();
          vocabQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="grid gap-8">
      <HeroPanel selectedDialect={selectedDialect} wallet={walletQuery.data?.balance ?? null} />

      <div className="grid gap-7 xl:grid-cols-[1fr_360px]">
        <section className="rounded-[34px] bg-white p-4 shadow-soft md:p-7">
          <div className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d8fff0] text-[var(--vc-primary)]">
                <Sprout aria-hidden="true" className="h-5 w-5" />
              </span>
              <h2 className="font-display text-lg font-black leading-tight text-[#06382e] sm:text-xl">Bàn Ghép Vần Rừng Xanh</h2>
            </div>
            <div className="flex w-full max-w-md rounded-full bg-[#d8fff0] p-1 shadow-inner lg:w-[390px]">
              {dialects.map((item) => (
                <button
                  className={`min-h-10 flex-1 rounded-full px-3 text-xs font-black transition ${
                    dialect === item.id ? "bg-[var(--vc-primary)] text-white shadow-[0_3px_0_#004d36]" : "text-[#31554b] hover:bg-white/70"
                  }`}
                  key={item.id}
                  onClick={() => setDialect(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <SpellingWorkbench
            dialect={selectedDialect}
            invalidCombination={invalidCombination}
            isComplete={isComplete}
            matchingVocabulary={matchingVocabulary}
            onDrop={handleDrop}
            result={result}
            slots={slots}
          />

          <AudioPractice dialect={selectedDialect} result={result} />

          <TokenTray
            onChoose={setSlot}
            onDrag={setDragToken}
            onsetChoices={onsetChoices}
            rimeChoices={rimeChoices}
            toneChoices={toneChoices}
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={!result || startSession.isPending} icon={Wand2} onClick={startQuickQuiz}>
              Khám Phá Chữ {result?.word ? `- ${result.word}` : ""}
            </Button>
            <button
              className="target-56 inline-flex items-center justify-center gap-2 rounded-full bg-[#eafff5] px-5 font-display text-sm font-black text-[var(--vc-primary)] ring-1 ring-[#b8efd4]"
              onClick={resetBoard}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Xóa bàn
            </button>
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <QuickQuizCard
            activeSession={activeSession}
            answerResult={answerResult}
            error={sessionError}
            onReset={() => {
              if (activeSession?.id) pauseSession.mutate(activeSession.id);
              setActiveSession(null);
              setAnswerResult(null);
              setSelectedOptionId(null);
              setAttemptNo(1);
              setSessionError(null);
            }}
            onSelect={setSelectedOptionId}
            onStart={startQuickQuiz}
            onSubmit={submitQuickQuiz}
            pending={startSession.isPending || submitAnswer.isPending}
            result={result}
            selectedOptionId={selectedOptionId}
          />
          <ForestProgress entries={plantedEntries} total={entries.length} />
        </aside>
      </div>

      <section className="grid gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#d6ffeb] px-3 py-1 text-xs font-black text-[var(--vc-primary)]">
              <Leaf aria-hidden="true" className="h-4 w-4" />
              Học Từ Vựng Thiên Nhiên Rực Rỡ
            </p>
            <h2 className="mt-3 font-display text-2xl font-black text-[var(--vc-primary)] md:text-3xl">Bộ Thẻ Thơ Thiên Nhiên 4 Chữ</h2>
            <p className="mt-1 text-sm font-semibold text-[#3d4a42]">Chạm vào từng thẻ để nghe đọc từ và phát âm từng âm tiết khi audio sẵn sàng.</p>
          </div>
          <button
            className="target-56 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--vc-primary)] px-5 font-display text-sm font-black text-white shadow-button"
            type="button"
          >
            <Play aria-hidden="true" className="h-4 w-4" />
            Đọc Cả Vườn Thơ
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {vocabularyCards.map((item) => (
            <VocabularyCard key={item.id} vocabulary={item} />
          ))}
        </div>
      </section>

      <footer className="rounded-[28px] bg-[#d4ffea] px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--vc-primary)] text-white">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-black text-[var(--vc-primary)]">Mẹo nhỏ cùng bé hôm nay</p>
              <p className="text-sm font-semibold text-[#3d4a42]">Bàn ghép chỉ ghi nhận tiến độ khi câu hỏi backend trả kết quả đúng.</p>
            </div>
          </div>
          <span className="rounded-full bg-white/70 px-4 py-2 text-xs font-black text-[var(--vc-primary)]">Xem Cẩm Nang Phát Âm</span>
        </div>
      </footer>
    </section>
  );
}

function HeroPanel({ selectedDialect, wallet }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-[#c9ffe8] p-5 shadow-soft md:p-8">
      <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
      <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-[#fff1b7]/50 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_330px] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#afffde] px-4 py-2 text-xs font-black text-[var(--vc-primary)]">
            <Trees aria-hidden="true" className="h-4 w-4" />
            Bài 04: Thung Lũng Ghép Vần Kỳ Diệu
          </p>
          <h1 className="mt-5 font-display text-4xl font-black leading-tight text-[var(--vc-primary)] md:text-5xl">
            Rừng Ghép Vần Thần Tiên <img alt="" className="ml-2 inline h-9 w-9 align-[-0.25rem]" src={assets.acorn} />
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#31554b]">
            Bé hãy nhặt các hạt mầm quả sồi, gắn cánh lá dấu thanh để tạo nên muôn loài cây cỏ rộn ràng.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-black text-[#31554b]">
            <span className="rounded-full bg-white/70 px-4 py-2">Chặng 1: Ghép Chữ & Cây</span>
            <span aria-hidden="true">→</span>
            <span className="rounded-full bg-white/70 px-4 py-2">Chặng 2: Thơ Muôn Loài</span>
            <span aria-hidden="true">→</span>
            <span className="rounded-full bg-white/70 px-4 py-2">Hái Quả Vàng</span>
          </div>
        </div>
        <article className="rounded-[28px] bg-white/45 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <img alt="Sóc nâu nhắc bé học ghép vần" className="h-20 w-20 rounded-full object-cover ring-4 ring-[#ffe8b3]" src={assets.mascotSquirrel} />
            <div>
              <p className="text-xs font-black uppercase text-[#9a5a00]">Sóc Nâu nhờ nhắn</p>
              <p className="mt-1 text-sm font-bold leading-6 text-[#31423c]">
                Bé ơi! Kéo hạt quả sồi và gắn dấu thanh để gọi những từ mới trong khu rừng nhé.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-[var(--vc-primary)] px-3 py-2 text-white">{selectedDialect.label}</span>
            <span className="rounded-full bg-[#eafff5] px-3 py-2 text-[var(--vc-primary)]">
              {wallet === null ? "Ví đang tải" : `${wallet} hạt dẻ`}
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}

function SpellingWorkbench({ slots, result, matchingVocabulary, invalidCombination, isComplete, dialect, onDrop }) {
  const audio = result?.audio?.[dialect.id];
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-[#e0fff2] px-4 pb-5 pt-6 shadow-inner ring-1 ring-[#bdf5da] md:px-7 md:pb-6">
      <Leaf aria-hidden="true" className="pointer-events-none absolute left-6 top-6 h-14 w-14 text-[var(--vc-primary)] opacity-[0.09]" />
      <Leaf aria-hidden="true" className="pointer-events-none absolute right-7 top-7 h-14 w-14 rotate-90 text-[var(--vc-primary)] opacity-[0.09]" />
      <div className="relative z-10 grid gap-4">
        <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-white shadow-md ring-8 ring-[#c8ffe8] md:h-28 md:w-28">
          <img alt="" className="h-full w-full object-cover" src={matchingVocabulary ? assets.forest : assets.mascotDeer} />
        </div>

        <div className="flex flex-wrap items-end justify-center gap-2 sm:gap-5">
          <LetterSlot label="Âm Đầu" slot="onset" value={slots.onset?.toLocaleUpperCase("vi-VN")} onDrop={onDrop} />
          <Operator>+</Operator>
          <LetterSlot label="Vần Chính" slot="rime" value={slots.rime?.toLocaleUpperCase("vi-VN")} onDrop={onDrop} />
          <Operator>+</Operator>
          <LetterSlot label="Dấu Thanh" slot="toneCode" value={toneMark(slots.toneCode)} onDrop={onDrop} tone />
          <Operator>=</Operator>
          <div className="grid gap-1 text-center">
            <span className="text-xs font-black text-[var(--vc-primary)]">Từ Hoàn Chỉnh</span>
            <div className="grid h-20 w-20 place-items-center rounded-[20px] bg-[var(--vc-primary)] text-white shadow-[0_5px_0_#004d36] sm:h-[5.5rem] sm:w-[5.5rem]">
              <span className="font-display text-2xl font-black uppercase sm:text-3xl">{result?.word ?? "..."}</span>
            </div>
          </div>
        </div>

        <div
          className={`mx-auto w-full max-w-3xl rounded-full px-4 py-2 text-center text-sm font-black ${
            result ? "bg-white/80 text-[var(--vc-primary)]" : invalidCombination ? "bg-[#fff2df] text-[#9a3412]" : "bg-white/70 text-[#3d4a42]"
          }`}
        >
          {result
            ? `${result.explanation ?? "Tổ hợp đã có trong dữ liệu."} ${audio?.available ? "" : "Audio hiện chưa sẵn sàng."}`
            : invalidCombination
              ? "Tổ hợp này chưa có trong dữ liệu học. Bé thử đổi một mảnh khác nhé."
              : isComplete
                ? "Đang kiểm tra tổ hợp trong dữ liệu..."
                : "Bấm hoặc kéo đủ ba mảnh để ghép từ."}
        </div>
      </div>
    </div>
  );
}

function LetterSlot({ label, slot, value, onDrop }) {
  return (
    <div
      className="grid gap-1 text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(slot);
      }}
      onPointerUp={() => onDrop(slot)}
    >
      <span className="text-xs font-black text-[#06382e]">{label}</span>
      <div className="grid h-20 w-20 place-items-center rounded-[18px] bg-[#adf3d2] shadow-[0_5px_0_#80d1ad] sm:h-[5.5rem] sm:w-[5.5rem]">
        <span className="font-display text-3xl font-black text-[var(--vc-primary)]">{value || "-"}</span>
      </div>
    </div>
  );
}

function Operator({ children }) {
  return <span className="pb-7 font-display text-xl font-black text-[#06382e]">{children}</span>;
}

function AudioPractice({ dialect, result }) {
  return (
    <div className="mt-4 flex flex-col gap-4 rounded-[28px] bg-[#c9ffe8] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <button className="grid h-14 w-14 place-items-center rounded-full bg-[#fea619] text-white shadow-[0_4px_0_#a75d00]" type="button">
          <Volume2 aria-hidden="true" className="h-7 w-7" />
        </button>
        <div>
          <p className="font-display text-base font-black text-[#06382e]">Nghe phát âm chuẩn</p>
          <p className="text-sm font-semibold text-[#31554b]">
            {result ? `${dialect.region}: ${result.word}` : "Chọn tổ hợp để nghe phát âm khi audio có sẵn."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-full bg-white/80 px-4 py-2">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--vc-primary)] text-white">
          <Mic aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-black text-[#06382e]">Bé tập nói theo Sóc</p>
          <p className="text-xs font-bold text-[var(--vc-primary)]">Chức năng thu âm sẽ mở ở bước âm thanh.</p>
        </div>
      </div>
    </div>
  );
}

function TokenTray({ onsetChoices, rimeChoices, toneChoices, onChoose, onDrag }) {
  return (
    <div className="mt-6 grid gap-5">
      <TokenRow label="Quả Thông Âm Đầu" choices={onsetChoices} type="onset" onChoose={(value) => onChoose("onset", value)} onDrag={onDrag} />
      <TokenRow label="Hạt Sồi Vần" choices={rimeChoices} type="rime" onChoose={(value) => onChoose("rime", value)} onDrag={onDrag} />
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-black text-[#6d3c00]">
          <Leaf aria-hidden="true" className="h-4 w-4" />
          Cánh Lá Dấu Thanh Bay Bổng
        </p>
        <div className="flex flex-wrap gap-3">
          {toneChoices.map((tone) => (
            <TokenButton
              key={tone.code}
              label={`${tone.name}${tone.code === "ngang" ? "" : ` (${tone.marker})`}`}
              onChoose={(value) => onChoose("toneCode", value)}
              onDrag={onDrag}
              type="toneCode"
              value={tone.code}
              wide
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TokenRow({ label, choices, type, onChoose, onDrag }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-black text-[#31554b]">
        <Sprout aria-hidden="true" className="h-4 w-4 text-[var(--vc-primary)]" />
        {label}
      </p>
      <div className="flex flex-wrap gap-3">
        {choices.map((choice) => (
          <TokenButton key={choice} label={choice.toLocaleUpperCase("vi-VN")} onChoose={onChoose} onDrag={onDrag} type={type} value={choice} />
        ))}
      </div>
    </div>
  );
}

function TokenButton({ type, value, label, onChoose, onDrag, wide = false }) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#bff7dd] px-5 font-display text-sm font-black text-[var(--vc-primary)] shadow-sm ring-1 ring-[#a5efd0] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#fbbf24] ${
        wide ? "min-w-32" : "min-w-14"
      }`}
      draggable
      onClick={() => onChoose(value)}
      onDragEnd={() => onDrag(null)}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", value);
        onDrag({ type, value });
      }}
      onPointerDown={() => onDrag({ type, value })}
      type="button"
    >
      {type === "onset" || type === "rime" ? <span className="h-2 w-2 rounded-full bg-[#a83b14]" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

function QuickQuizCard({ result, activeSession, selectedOptionId, answerResult, error, pending, onStart, onSelect, onSubmit, onReset }) {
  if (!activeSession?.question) {
    return (
      <article className="rounded-[30px] bg-[#ffe1b8] p-5 shadow-soft">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-[#8a4b00]">
          <Trophy aria-hidden="true" className="h-4 w-4" />
          Thử Thách Nhanh
        </p>
        <h2 className="mt-2 font-display text-xl font-black text-[#4a2c00]">Tìm Hạt Dẻ Chữ Cá</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#5d4630]">
          Bé hãy lắng nghe và chạm vào chiếc hạt dẻ có chứa chữ đúng. Câu hỏi sẽ do backend cấp.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {["CÒ", "CÁ", "BA", "LÁ"].map((item) => (
            <button className="grid min-h-24 place-items-center rounded-[22px] bg-white text-center shadow-sm" key={item} type="button">
              <img alt="" className="h-7 w-7" src={assets.acorn} />
              <span className="font-display text-xl font-black text-[var(--vc-primary)]">{item}</span>
            </button>
          ))}
        </div>
        <Button className="mt-5 w-full text-sm" disabled={!result || pending} icon={Play} onClick={onStart}>
          Bắt đầu bằng dữ liệu thật
        </Button>
        {error ? <p className="mt-4 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{error.message}</p> : null}
      </article>
    );
  }

  const question = activeSession.question;
  return (
    <article className="rounded-[30px] bg-[#ffe1b8] p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-[#8a4b00]">Câu hỏi từ backend</p>
          <h2 className="mt-2 font-display text-lg font-black text-[#4a2c00]">{question.prompt}</h2>
        </div>
        <button className="rounded-full bg-white/80 p-3 text-[var(--vc-primary)]" onClick={onReset} type="button">
          <RotateCcw aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {question.options.map((option) => (
          <button
            className={`min-h-20 rounded-[22px] border bg-white px-3 text-center font-display text-sm font-black ${
              selectedOptionId === option.id ? "border-[var(--vc-primary)] ring-4 ring-[#bff7dd]" : "border-transparent"
            }`}
            key={option.id}
            onClick={() => onSelect(option.id)}
            type="button"
          >
            <img alt="" className="mx-auto mb-1 h-7 w-7" src={assets.acorn} />
            {option.label}
          </button>
        ))}
      </div>
      {answerResult ? (
        <p className={`mt-4 rounded-2xl p-3 text-sm font-bold ${answerResult.isCorrect ? "bg-white text-[var(--vc-primary)]" : "bg-[#fff7ed] text-[#9a3412]"}`}>
          {answerResult.isCorrect ? "Bé ghép đúng rồi!" : "Chưa đúng, bé thử lại nhé."}
          {answerResult.rewardGranted?.delta ? ` +${answerResult.rewardGranted.delta} hạt dẻ.` : ""}
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{error.message}</p> : null}
      <Button className="mt-5 w-full text-sm" disabled={!selectedOptionId || pending || answerResult?.nextAttemptNo === null} onClick={onSubmit}>
        {pending ? "Đang gửi..." : "Gửi đáp án"}
      </Button>
    </article>
  );
}

function ForestProgress({ entries, total }) {
  return (
    <article className="rounded-[30px] bg-[#c9ffe8] p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-black text-[var(--vc-primary)]">Khu Rừng Đã Nảy Mầm</h2>
        <span className="rounded-full bg-[#eafff5] px-3 py-1 text-xs font-black text-[var(--vc-primary)]">
          {entries.length} / {total || 0} cây
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {entries.map((entry) => (
          <div className="grid min-h-16 place-items-center rounded-2xl bg-white/70 text-center" key={entry.id}>
            <Mountain aria-hidden="true" className="h-5 w-5 text-[var(--vc-primary)]" />
            <span className="text-xs font-black uppercase text-[#31554b]">{entry.word}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-[#31554b]">Cứ mỗi 3 từ đúng, cây sẽ vươn cao trong vườn của bé.</p>
    </article>
  );
}

function VocabularyCard({ vocabulary }) {
  return (
    <article className="rounded-[30px] bg-white p-4 shadow-soft">
      <div className="relative h-40 overflow-hidden rounded-[24px] bg-[#eafff5]">
        <img alt={vocabulary.word} className="h-full w-full object-cover" src={vocabulary.image ?? assets.forest} />
        <button className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-[#fea619] text-white shadow-md" type="button">
          <Volume2 aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#d8fff0] px-3 py-1 text-xs font-black text-[var(--vc-primary)]">{vocabulary.spelling}</span>
        <h3 className="font-display text-lg font-black text-[var(--vc-primary)]">{vocabulary.word}</h3>
      </div>
      <p className="mt-3 rounded-[20px] bg-[#eafff5] p-3 text-sm font-semibold leading-6 text-[#31554b]">{vocabulary.meaning}</p>
      <button className="mt-4 min-h-11 w-full rounded-full bg-[#bff7dd] px-4 font-display text-sm font-black text-[var(--vc-primary)]" type="button">
        Tập ghép từ này
      </button>
    </article>
  );
}

function toneMark(code) {
  const labels = {
    ngang: "o",
    sac: "´",
    huyen: "`",
    hoi: "̉",
    nga: "~",
    nang: "."
  };
  return labels[code] ?? code;
}
