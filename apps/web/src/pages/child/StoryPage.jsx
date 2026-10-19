import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Expand,
  Headphones,
  Leaf,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sprout,
  Subtitles,
  Volume2,
  VolumeX
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAudioController } from "../../audio/audioContext.js";
import { RecordingPanel } from "../../audio/RecordingPanel.jsx";
import { assets } from "../../assets/assetRegistry.js";
import { useMe } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";
import {
  useAcknowledgeStoryScene,
  useCompleteStorySession,
  usePauseStorySession,
  useResumeStorySession,
  useStartStorySession,
  useStories,
  useStory,
  useStoryProgress,
  useStoryWallet,
  useSubmitStoryAnswer
} from "../../stories/useStories.js";

const categoryLabels = {
  all: "Tất cả truyện",
  "nature-story": "Ngụ ngôn muôn loài",
  "folk-story": "Cổ tích Việt Nam",
  poem: "Đồng dao & thơ bé"
};

const voiceOptions = [
  { id: "north", label: "Bắc" },
  { id: "central", label: "Trung" },
  { id: "south", label: "Nam" }
];

const fallbackScenes = [assets.forest, assets.treehouse];
const shelfVisuals = [assets.forest, assets.treehouse, assets.mascotSquirrel, assets.mascotOwl, assets.mascotDeer];

export function StoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const me = useMe();
  const currentChildId = me.data?.currentChildId;
  const [category, setCategory] = useState("all");
  const [voice, setVoice] = useState("north");

  const storiesQuery = useStories(category === "all" ? { limit: 20 } : { category, limit: 20 });
  const stories = useMemo(() => storiesQuery.data?.items ?? [], [storiesQuery.data]);
  const selectedSlug = slug ?? stories[0]?.slug ?? "";
  const storyQuery = useStory(selectedSlug, Boolean(selectedSlug));
  const walletQuery = useStoryWallet(currentChildId, Boolean(currentChildId));
  const progressQuery = useStoryProgress(currentChildId, Boolean(currentChildId));

  const categories = useMemo(() => {
    const found = new Set(stories.map((story) => story.category).filter(Boolean));
    return ["all", ...found];
  }, [stories]);
  const progressByStory = useMemo(() => {
    const rows = progressQuery.data?.items ?? [];
    return new Map(rows.filter((item) => item.contentType === "story").map((item) => [item.contentId, item]));
  }, [progressQuery.data]);

  if (storiesQuery.isLoading || (selectedSlug && storyQuery.isLoading)) {
    return <LoadingState label="Đang mở đầm kể chuyện..." />;
  }

  if (storiesQuery.isError) {
    return <ErrorState title="Chưa tải được thư viện truyện" message={storiesQuery.error.message} onRetry={() => storiesQuery.refetch()} />;
  }

  if (!stories.length) {
    return <EmptyState title="Chưa có truyện xuất bản" message="Khi admin xuất bản truyện, bé sẽ thấy thư viện tại đây." />;
  }

  const story = storyQuery.data;

  return (
    <section className="relative -mx-4 -my-6 bg-[linear-gradient(180deg,#dcfff1_0%,#eefdf5_48%,#d5ffef_100%)] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto grid max-w-[1180px] gap-7">
        <Hero wallet={walletQuery.data?.balance} />
        <StoryFilters categories={categories} category={category} setCategory={setCategory} setVoice={setVoice} voice={voice} />

        {storyQuery.isError ? (
          <ErrorState title="Chưa mở được truyện" message={storyQuery.error.message} onRetry={() => storyQuery.refetch()} />
        ) : story ? (
          <FeaturedTheater
            currentChildId={currentChildId}
            onBack={() => navigate("/be/truyen")}
            progress={progressByStory.get(story.id)}
            story={story}
            voice={voice}
          />
        ) : (
          <LoadingState label="Đang chọn truyện..." />
        )}

        <StoryShelf progressByStory={progressByStory} selectedSlug={selectedSlug} stories={stories} />
        <RoleplayChallenge childId={currentChildId} storyId={story?.id} />
      </div>
    </section>
  );
}

function Hero({ wallet }) {
  return (
    <header className="overflow-hidden rounded-[32px] bg-white/85 p-5 shadow-[0_18px_42px_rgba(0,105,72,0.12)] md:p-9">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#d8fff0] px-4 py-2 text-xs font-extrabold text-[var(--vc-primary)] shadow-[0_3px_0_#68dba9]">
            <Leaf className="h-4 w-4" /> Trạm Dừng Chân: Đầm Sen Kể Chuyện Thần Tiên
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-[34px] font-black leading-[1.12] text-[var(--vc-primary)] md:text-[46px]">
            Đầm Kể Chuyện & Bài Học Yêu Thương
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] font-semibold leading-8 text-[#3d4a42]">
            Bé cùng lắng nghe truyện tranh tương tác sống động, chạm vào nhân vật để học những từ ngữ ngọt ngào và ươm mầm đức tính nhân ái tuổi thơ.
          </p>
          <div className="mt-5 max-w-[640px] rounded-[22px] bg-[#fff2da] p-4 shadow-sm">
            <div className="flex gap-3">
              <BookOpen className="mt-1 h-6 w-6 shrink-0 text-[#855300]" />
              <div>
                <p className="font-display text-sm font-black text-[#855300]">Lời nhắn từ Sóc Thám Hiểm:</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#3d4a42]">
                  Bé ơi, chọn một câu chuyện rồi đọc chậm từng cảnh. Khi chạm vào từ mới, bé sẽ thấy nghĩa và bài học nhỏ trong truyện.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-center lg:w-72 lg:justify-end">
          <div className="relative h-56 w-56 shrink-0 rounded-full bg-gradient-to-tr from-[#a7f3d0] via-[#fef3c7] to-[#c7f9e8] p-3 shadow-soft md:h-64 md:w-64">
            <img alt="Sóc thám hiểm trong khu rừng kể chuyện" className="h-full w-full rounded-full object-cover shadow-inner" src={assets.mascotSquirrel} />
            <span className="absolute -bottom-2 left-1/2 inline-flex min-w-max -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#855300] shadow-soft">
              <Sparkles className="h-4 w-4 text-[#fea619]" /> {typeof wallet === "number" ? `${wallet} hạt dẻ sẵn sàng` : "Đang tải ví hạt dẻ"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function StoryFilters({ categories, category, setCategory, voice, setVoice }) {
  return (
    <section className="flex flex-col gap-4 rounded-[26px] bg-[#c9ffe8]/70 p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
        {categories.map((item) => (
          <button
            className={`min-h-10 shrink-0 rounded-full px-5 font-display text-xs font-extrabold transition ${
              category === item ? "bg-[var(--vc-primary)] text-white shadow-button" : "bg-white text-[#3d4a42] hover:text-[var(--vc-primary)]"
            }`}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >
            {categoryLabels[item] ?? item}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 shadow-sm md:self-auto">
        <Headphones className="h-4 w-4 text-[var(--vc-primary)]" />
        <span className="text-xs font-bold text-[#3d4a42]">Giọng đọc:</span>
        <div className="flex rounded-full bg-[#e5fff4] p-1">
          {voiceOptions.map((item) => (
            <button
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${voice === item.id ? "bg-white text-[var(--vc-primary)] shadow-sm" : "text-[#3d4a42]"}`}
              key={item.id}
              onClick={() => setVoice(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedTheater({ story, currentChildId, voice, progress, onBack }) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="h-8 w-2 rounded-full bg-[var(--vc-primary)]" />
          <h2 className="font-display text-[28px] font-black text-[var(--vc-primary)]">Rạp Chiếu Truyện Tương Tác Sôi Động</h2>
        </div>
        {progress?.state === "completed" ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff2da] px-4 py-2 text-sm font-extrabold text-[#855300]">
            <CheckCircle2 className="h-4 w-4" /> Đã hoàn thành
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff2da] px-4 py-2 text-sm font-extrabold text-[#855300]">
            <Sparkles className="h-4 w-4" /> Truyện đang mở
          </span>
        )}
      </div>
      <StoryPlayer currentChildId={currentChildId} onBack={onBack} story={story} voice={voice} />
    </section>
  );
}

function StoryPlayer({ story, currentChildId, voice, onBack }) {
  const startSession = useStartStorySession();
  const ackScene = useAcknowledgeStoryScene();
  const submitAnswer = useSubmitStoryAnswer(currentChildId);
  const completeStory = useCompleteStorySession(currentChildId);
  const pauseStory = usePauseStorySession();
  const resumeStory = useResumeStorySession();
  const pauseStoryRef = useRef(null);
  const stageRef = useRef(null);
  const sessionRef = useRef(null);
  const completedRef = useRef(false);
  const [session, setSession] = useState(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [ackedScenes, setAckedScenes] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [completeResult, setCompleteResult] = useState(null);
  const [attemptNo, setAttemptNo] = useState(1);
  const [playerState, setPlayerState] = useState("idle");

  const scene = story.scenes[sceneIndex];
  const endingQuestion = session?.question;
  const allScenesAcked = ackedScenes.length >= story.scenes.length;
  const endingCorrect = answerResult?.isCorrect;
  const busy = startSession.isPending || ackScene.isPending || submitAnswer.isPending || completeStory.isPending || pauseStory.isPending || resumeStory.isPending;
  const currentError = startSession.error ?? ackScene.error ?? submitAnswer.error ?? completeStory.error ?? pauseStory.error ?? resumeStory.error;
  const voiceLabel = voiceOptions.find((item) => item.id === voice)?.label ?? "Bắc";

  useEffect(() => {
    pauseStoryRef.current = pauseStory;
  }, [pauseStory]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    return () => {
      const active = sessionRef.current;
      if (active?.id && active.status === "active" && !completedRef.current) {
        pauseStoryRef.current?.mutate(active.id);
      }
    };
  }, []);

  useEffect(() => {
    setSession(null);
    setSceneIndex(0);
    setAckedScenes([]);
    setSelectedHotspot(null);
    setSelectedOptionId(null);
    setAnswerResult(null);
    setCompleteResult(null);
    setAttemptNo(1);
    setPlayerState("idle");
    completedRef.current = false;
  }, [story.id]);

  async function handleStart() {
    const data = await startSession.mutateAsync({ storyId: story.id });
    setSession(data);
    setPlayerState("reading");
  }

  async function handlePause() {
    if (!session?.id) return;
    await pauseStory.mutateAsync(session.id);
    setSession((current) => (current ? { ...current, status: "paused" } : current));
    setPlayerState("paused");
  }

  async function handleResume() {
    if (!session?.id) return;
    await resumeStory.mutateAsync(session.id);
    setSession((current) => (current ? { ...current, status: "active" } : current));
    setPlayerState("reading");
  }

  async function handleNextScene() {
    if (!session?.id || !scene) return;
    if (!ackedScenes.includes(scene.id)) {
      const ack = await ackScene.mutateAsync({
        sessionId: session.id,
        sceneId: scene.id,
        idempotencyKey: `story-${session.id}-${scene.id}`
      });
      setAckedScenes((current) => (current.includes(ack.sceneId) ? current : [...current, ack.sceneId]));
    }
    setSelectedHotspot(null);
    if (sceneIndex < story.scenes.length - 1) setSceneIndex((current) => current + 1);
  }

  async function handleSubmitEnding() {
    if (!session?.id || !endingQuestion || !selectedOptionId) return;
    const answer = await submitAnswer.mutateAsync({
      sessionId: session.id,
      exerciseId: endingQuestion.id,
      attemptNo,
      response: { optionId: selectedOptionId },
      idempotencyKey: `story-ending-${session.id}-${endingQuestion.id}-${attemptNo}`
    });
    setAnswerResult(answer);
    if (answer.nextAttemptNo) setAttemptNo(answer.nextAttemptNo);
  }

  async function handleComplete() {
    if (!session?.id) return;
    const result = await completeStory.mutateAsync({
      sessionId: session.id,
      idempotencyKey: `story-complete-${session.id}`
    });
    setCompleteResult(result);
    completedRef.current = true;
    setSession((current) => (current ? { ...current, status: "completed" } : current));
    setPlayerState("completed");
  }

  async function handleFullscreen() {
    if (!document.fullscreenEnabled || !stageRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await stageRef.current.requestFullscreen();
  }

  return (
    <div className="grid gap-5 rounded-[34px] bg-white p-5 shadow-[0_18px_42px_rgba(0,105,72,0.12)] md:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="grid gap-4">
          <TheaterStage
            onHotspot={setSelectedHotspot}
            scene={scene}
            sceneIndex={sceneIndex}
            stageRef={stageRef}
            story={story}
          />
          <PlayerControls
            ackedScenes={ackedScenes}
            busy={busy}
            onBack={onBack}
            onFullscreen={handleFullscreen}
            onNextScene={handleNextScene}
            onPause={handlePause}
            onPrevious={() => {
              setSelectedHotspot(null);
              setSceneIndex((current) => Math.max(0, current - 1));
            }}
            onResume={handleResume}
            onStart={handleStart}
            playerState={playerState}
            scene={scene}
            sceneIndex={sceneIndex}
            session={session}
            story={story}
            voice={voice}
            voiceLabel={voiceLabel}
          />
          {currentError ? <p className="rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{currentError.message}</p> : null}
        </div>
        <aside className="grid content-start gap-4">
          <VocabularyPanel hotspot={selectedHotspot} onSelect={setSelectedHotspot} scene={scene} story={story} />
        </aside>
      </div>
      {(session || completeResult) ? (
        <EndingQuestion
          allScenesAcked={allScenesAcked}
          answerResult={answerResult}
          busy={busy}
          completeResult={completeResult}
          endingCorrect={endingCorrect}
          onComplete={handleComplete}
          onResetAnswer={() => {
            setAnswerResult(null);
            setSelectedOptionId(null);
          }}
          onSelect={setSelectedOptionId}
          onSubmit={handleSubmitEnding}
          question={endingQuestion}
          selectedOptionId={selectedOptionId}
          session={session}
        />
      ) : null}
    </div>
  );
}

function TheaterStage({ story, scene, sceneIndex, stageRef, onHotspot }) {
  return (
    <div ref={stageRef} className="relative isolate h-[320px] overflow-hidden rounded-[24px] bg-[#e5fff4] shadow-md sm:h-[390px] lg:h-[420px]">
      <div className="absolute inset-0 overflow-hidden">
        {scene?.image?.available ? (
          <img alt="" className="absolute inset-0 h-full w-full object-cover" src={`/api/v1/media/${scene.image.assetKey}`} />
        ) : (
          <FallbackSceneImage index={sceneIndex} />
        )}
      </div>
      <div className="absolute inset-0 z-10">
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)] shadow-sm">
            Tập {sceneIndex + 1}: {story.title}
          </span>
          {story.ageBands?.length ? (
            <span className="rounded-full bg-[#cce5ff] px-3 py-1 text-xs font-extrabold text-[#006194] shadow-sm">
              Cấp độ: {story.ageBands.join(", ")} tuổi
            </span>
          ) : null}
        </div>
        {(scene?.hotspots ?? []).map((hotspot) => (
          <button
            aria-label={`Từ mới: ${hotspot.label}`}
            className="absolute inline-flex min-h-10 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white/95 px-3 text-xs font-extrabold text-[var(--vc-primary)] shadow-lg transition hover:scale-105 motion-reduce:transition-none"
            key={hotspot.id}
            onClick={() => onHotspot(hotspot)}
            style={{ left: `${Math.round(hotspot.x * 100)}%`, top: `${Math.round(hotspot.y * 100)}%` }}
            type="button"
          >
            <span className="h-3 w-3 rounded-full bg-[var(--vc-primary)] motion-safe:animate-ping" />
            {hotspot.label}
          </button>
        ))}
        <div className="absolute bottom-3 left-4 right-4 rounded-[14px] bg-[#002117]/85 p-3 text-center shadow-lg backdrop-blur">
          <p className="font-display text-sm font-extrabold leading-6 text-[#85f8c4] md:text-base">{scene?.text}</p>
        </div>
      </div>
    </div>
  );
}

function FallbackSceneImage({ index }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#c9ffe8] via-[#fff8dc] to-[#e7fff3]">
      <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" src={fallbackScenes[index % fallbackScenes.length]} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(0,33,23,0.04))]" />
      <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)]">
        Ảnh minh họa fallback
      </div>
    </div>
  );
}

function PlayerControls({
  story,
  scene,
  sceneIndex,
  session,
  playerState,
  busy,
  ackedScenes,
  voice,
  voiceLabel,
  onStart,
  onPause,
  onResume,
  onPrevious,
  onNextScene,
  onFullscreen,
  onBack
}) {
  const { playNarration, state: audioState, stopNarration } = useAudioController();
  const progressPercent = Math.round(((sceneIndex + 1) / Math.max(1, story.scenes.length)) * 100);
  const sceneAcked = ackedScenes.includes(scene?.id);
  const sceneAudio = scene?.audio?.[voice];
  const audioPlaying = audioState.status === "playing";
  return (
    <div className="rounded-[22px] bg-[#c9ffe8] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-extrabold text-[#3d4a42]">
        {story.scenes.map((item, index) => (
          <span className={index === sceneIndex ? "text-[var(--vc-primary)]" : ""} key={item.id}>
            {index + 1}. Cảnh {index + 1}
          </span>
        ))}
      </div>
      <div className="h-3 rounded-full bg-white/70">
        <div className="h-full rounded-full bg-gradient-to-r from-[#68dba9] to-[var(--vc-primary)]" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {!session ? (
            <button
              className="grid h-12 w-12 place-items-center rounded-full bg-[#fea619] text-[#2a1700] shadow-[0_4px_0_#684000] disabled:opacity-60"
              disabled={busy}
              onClick={onStart}
              type="button"
            >
              <Play className="h-7 w-7 fill-current" />
            </button>
          ) : playerState === "paused" ? (
            <button className="grid h-12 w-12 place-items-center rounded-full bg-[#fea619] text-[#2a1700] shadow-[0_4px_0_#684000]" disabled={busy} onClick={onResume} type="button">
              <Play className="h-7 w-7 fill-current" />
            </button>
          ) : session.status !== "completed" ? (
            <button className="grid h-12 w-12 place-items-center rounded-full bg-white text-[var(--vc-primary)] shadow-[0_3px_0_#68dba9]" disabled={busy} onClick={onPause} type="button">
              <Pause className="h-7 w-7 fill-current" />
            </button>
          ) : null}
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-[var(--vc-primary)] shadow-[0_3px_0_#68dba9]" disabled={sceneIndex === 0 || busy} onClick={onPrevious} type="button">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="font-display text-sm font-black text-[var(--vc-primary)]">Chế độ đọc chữ</p>
            <p className="text-xs font-semibold text-[#3d4a42]">Giọng {voiceLabel} chưa có audio thật</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="target-56 inline-flex items-center gap-2 rounded-full bg-white px-4 font-display text-xs font-extrabold text-[var(--vc-primary)] shadow-sm"
            onClick={() =>
              audioPlaying
                ? stopNarration()
                : playNarration({
                    audioUrl: sceneAudio?.available ? `/api/v1/media/${sceneAudio.assetKey}` : null,
                    text: scene?.text,
                    label: `Canh ${sceneIndex + 1}`
                  })
            }
            type="button"
          >
            {audioPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} {audioPlaying ? "Dung doc" : "Doc canh"}
          </button>
          <button className="target-56 inline-flex items-center gap-2 rounded-full bg-white px-4 font-display text-xs font-extrabold text-[var(--vc-primary)] shadow-sm" onClick={onBack} type="button">
            <ChevronLeft className="h-4 w-4" /> Tủ sách
          </button>
          <button className="target-56 inline-flex items-center gap-2 rounded-full bg-white px-4 font-display text-xs font-extrabold text-[var(--vc-primary)] shadow-sm" type="button">
            <Subtitles className="h-4 w-4" /> Phụ đề
          </button>
          <button className="target-56 inline-flex items-center gap-2 rounded-full bg-white px-4 font-display text-xs font-extrabold text-[var(--vc-primary)] shadow-sm" disabled={!document.fullscreenEnabled} onClick={onFullscreen} type="button">
            <Expand className="h-4 w-4" /> Toàn màn hình
          </button>
          <button
            className="target-56 inline-flex items-center gap-2 rounded-full bg-[var(--vc-primary)] px-5 font-display text-xs font-extrabold text-white shadow-button disabled:opacity-60"
            disabled={!session || busy || sceneAcked}
            onClick={onNextScene}
            type="button"
          >
            {sceneIndex >= story.scenes.length - 1 ? "Xác nhận cảnh cuối" : "Cảnh tiếp"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {sceneAcked ? <p className="mt-3 rounded-2xl bg-white/75 px-4 py-2 text-xs font-extrabold text-[var(--vc-primary)]">Cảnh này đã được backend xác nhận.</p> : null}
    </div>
  );
}

function VocabularyPanel({ story, scene, hotspot, onSelect }) {
  const sceneWords = scene?.hotspots ?? [];
  const selected = hotspot ?? sceneWords[0] ?? null;
  const vocabList = sceneWords.length ? sceneWords : story.vocabulary?.map((word) => ({ id: word.id, label: word.word, vocabulary: word })) ?? [];
  return (
    <section className="rounded-[26px] bg-[#dfffee] p-4">
      <div className="flex items-center gap-2 text-[var(--vc-primary)]">
        <BookOpen className="h-5 w-5" />
        <h3 className="font-display text-xl font-black">Từ Mới Bé Học Được</h3>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#3d4a42]">Chạm vào từng từ để xem nghĩa. Audio từ vựng hiện chưa có file thật.</p>
      <div className="mt-4 grid gap-3">
        {vocabList.map((item, index) => {
          const active = selected?.id === item.id;
          return (
            <button
              className={`flex min-h-16 items-center justify-between gap-3 rounded-[18px] p-3 text-left shadow-sm ${active ? "bg-white ring-2 ring-[var(--vc-primary)]" : "bg-white"}`}
              key={item.id ?? index}
              onClick={() => onSelect(item)}
              type="button"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#85f8c4] text-[var(--vc-primary)]">
                  <Sprout className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-base font-black text-[var(--vc-primary)]">{item.vocabulary?.word ?? item.label}</span>
                  <span className="block text-xs font-semibold leading-5 text-[#3d4a42]">{item.vocabulary?.meaning ?? "Đang chờ bổ sung nghĩa."}</span>
                </span>
              </span>
              <VolumeX className="h-5 w-5 text-[#6d7a72]" />
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[20px] bg-white/75 p-4">
        <p className="font-display text-sm font-black text-[var(--vc-primary)]">Hạt mầm đạo đức:</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#3d4a42]">{story.moral}</p>
      </div>
    </section>
  );
}

function EndingQuestion({
  session,
  question,
  selectedOptionId,
  answerResult,
  completeResult,
  allScenesAcked,
  endingCorrect,
  busy,
  onSelect,
  onSubmit,
  onResetAnswer,
  onComplete
}) {
  return (
    <section className="rounded-[26px] bg-[#fff2da] p-4">
      <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#855300]">
        <Sparkles className="h-4 w-4" /> Thử thách cuối truyện
      </p>
      <h3 className="mt-3 font-display text-xl font-black text-[#2a1700]">Nhận huy hiệu bài học</h3>
      {!session ? (
        <p className="mt-3 text-sm font-semibold leading-6 text-[#5f4b30]">Bé bắt đầu đọc truyện để mở câu hỏi kết thúc.</p>
      ) : question ? (
        <div className="mt-4 grid gap-3">
          <p className="font-bold leading-6 text-[#2a1700]">{question.prompt}</p>
          <div className="grid gap-2">
            {question.options.map((option) => (
              <button
                className={`min-h-12 rounded-2xl px-3 text-left font-display text-sm font-black ${selectedOptionId === option.id ? "bg-[var(--vc-primary)] text-white" : "bg-white text-[#2a1700]"}`}
                key={option.id}
                onClick={() => onSelect(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          {answerResult ? (
            <p className={`rounded-2xl p-3 text-sm font-bold ${answerResult.isCorrect ? "bg-[#d8fff0] text-[var(--vc-primary)]" : "bg-white text-[#9a3412]"}`}>
              {answerResult.isCorrect ? "Đúng rồi, bé đã hiểu câu chuyện." : "Chưa đúng, bé thử đọc lại cảnh và chọn lại nhé."}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button className="text-sm" disabled={!selectedOptionId || busy || answerResult?.nextAttemptNo === null} onClick={onSubmit}>
              Gửi trả lời
            </Button>
            {answerResult && !answerResult.isCorrect && answerResult.nextAttemptNo ? (
              <Button icon={RotateCcw} onClick={onResetAnswer} variant="secondary">
                Thử lại
              </Button>
            ) : null}
            <Button disabled={!allScenesAcked || !endingCorrect || busy || session.status === "completed"} icon={Sparkles} onClick={onComplete} variant="reward">
              Hoàn thành
            </Button>
          </div>
          {!allScenesAcked ? <p className="text-xs font-bold text-[#9a3412]">Cần xác nhận đủ các cảnh trước khi nhận hoàn thành.</p> : null}
          {completeResult ? (
            <p className="rounded-2xl bg-white p-3 text-sm font-bold text-[var(--vc-primary)]">
              {completeResult.rewardGranted?.delta ? `Backend thưởng +${completeResult.rewardGranted.delta} hạt dẻ.` : "Truyện đã hoàn thành trước đó."}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold leading-6 text-[#5f4b30]">Phiên truyện chưa có câu hỏi kết thúc.</p>
      )}
    </section>
  );
}

function StoryShelf({ stories, selectedSlug, progressByStory }) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-black text-[var(--vc-primary)]">Tủ Sách Đầm Sen Diệu Kỳ</h2>
          <p className="mt-1 text-sm font-semibold text-[#3d4a42]">Khám phá các câu chuyện có thật trong seed, không hiển thị lượt nghe hay thời lượng giả.</p>
        </div>
        <span className="self-start rounded-full bg-[#fff2da] px-4 py-2 text-sm font-extrabold text-[#855300]">{stories.length} truyện đã xuất bản</span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {stories.map((story, index) => (
          <StoryCard key={story.id} progress={progressByStory.get(story.id)} selected={story.slug === selectedSlug} story={story} visual={shelfVisuals[index % shelfVisuals.length]} />
        ))}
      </div>
    </section>
  );
}

function StoryCard({ story, selected, progress, visual }) {
  return (
    <Link className={`overflow-hidden rounded-[28px] bg-white shadow-soft transition hover:-translate-y-1 motion-reduce:transition-none ${selected ? "ring-2 ring-[var(--vc-primary)]" : ""}`} to={`/be/truyen/${encodeURIComponent(story.slug)}`}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <img alt="" className="h-full w-full object-cover" src={visual} />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)]">
          {categoryLabels[story.category] ?? story.category}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-[#fff2da] px-3 py-1 text-xs font-extrabold text-[#855300]">
          {progress?.state === "completed" ? "Đã đọc" : "+15 hạt khi hoàn thành"}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold text-[var(--vc-primary)]">{story.ageBands?.length ? story.ageBands.join(" • ") : "Mọi độ tuổi"}</p>
        <h3 className="mt-2 font-display text-xl font-black text-[#06382e]">{story.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-[#3d4a42]">{story.moral}</p>
        <span className="mt-4 inline-flex min-h-10 items-center rounded-full bg-[var(--vc-primary)] px-4 font-display text-sm font-black text-white">
          Nghe ngay
        </span>
      </div>
    </Link>
  );
}

function RoleplayChallenge({ childId, storyId }) {
  return (
    <section className="grid gap-6 rounded-[34px] bg-gradient-to-r from-[#b9ffdf] to-[#dff4ff] p-6 shadow-soft lg:grid-cols-[1fr_340px] lg:items-center md:p-8">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-extrabold text-[#855300]">
          <Mic className="h-4 w-4" /> Góc Sân Khấu Nhí
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-black text-[var(--vc-primary)]">Thử Thách Giọng Kể: Nhận Huy Hiệu “Họa Mi Rừng Xanh”</h2>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#3d4a42]">
          Recording thuộc bước 15 nên hiện chỉ hiển thị lời thoại mẫu và trạng thái chưa bật. Không có animation tự báo đã ghi âm.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--vc-primary)]">Vai Rùa Con</span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--vc-primary)]">Vai Thỏ Trắng</span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--vc-primary)]">Vai Sóc Nhí</span>
        </div>
      </div>
      {childId && storyId ? <RecordingPanel childId={childId} roleKey="storyteller" storyId={storyId} /> : null}
      <div className="hidden rounded-[28px] bg-white p-6 text-center shadow-soft">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#dc2626] text-white">
          <Mic className="h-9 w-9" />
        </div>
        <h3 className="mt-4 font-display text-xl font-black text-[#06382e]">Thu âm chưa bật</h3>
        <p className="mt-2 text-sm font-semibold text-[#3d4a42]">Chức năng ghi âm sẽ mở ở bước âm thanh.</p>
        <button className="mt-4 min-h-11 rounded-full bg-[#fff2da] px-5 font-display text-sm font-black text-[#855300]" disabled type="button">
          Chờ bước 15
        </button>
      </div>
    </section>
  );
}
