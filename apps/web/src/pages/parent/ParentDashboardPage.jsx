import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Download,
  FileText,
  Leaf,
  Lock,
  Mic,
  Printer,
  Settings2,
  Share2,
  ShoppingBag,
  Sparkles,
  Sprout,
  TreePine
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assetRegistry.js";
import { detectBrowserSpeechCapability } from "../../audio/speechCapabilities.js";
import { authErrorMessage } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";
import {
  exportChildData,
  getChild,
  getChildRecordings,
  getChildren,
  getParentAttemptsReport,
  getParentDailyReport,
  getParentOverviewReport,
  getSpeechCapability,
  updateChildSettings
} from "../../api/childDataApi.js";
import { queryKeys } from "../../api/queryKeys.js";

const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "recognition", label: "Nhận diện" },
  { id: "lessons", label: "Bài học" },
  { id: "time", label: "Thời gian" },
  { id: "safety", label: "An toàn" },
  { id: "resources", label: "Tài nguyên" },
  { id: "inbox", label: "Hộp thư" }
];

const mascotImages = {
  "mascot-squirrel": assets.mascotSquirrel,
  "mascot-sprout": assets.mascotSprout,
  "mascot-owl": assets.mascotOwl,
  "mascot-deer": assets.mascotDeer
};

export function ParentDashboardPage({ initialTab = "overview" }) {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const childrenQuery = useQuery({ queryKey: ["parent", "children"], queryFn: getChildren, retry: false });
  const children = useMemo(() => childrenQuery.data?.items ?? [], [childrenQuery.data?.items]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].id);
  }, [children, selectedChildId]);
  useEffect(() => setActiveTab(initialTab), [initialTab]);

  const childQuery = useQuery({
    queryKey: queryKeys.child(selectedChildId),
    queryFn: () => getChild(selectedChildId),
    enabled: Boolean(selectedChildId),
    retry: false
  });
  const overview = useQuery({
    queryKey: queryKeys.parentReport(selectedChildId, "overview"),
    queryFn: () => getParentOverviewReport(selectedChildId),
    enabled: Boolean(selectedChildId),
    retry: false
  });
  const daily = useQuery({
    queryKey: queryKeys.parentReport(selectedChildId, "daily"),
    queryFn: () => getParentDailyReport({ childId: selectedChildId }),
    enabled: Boolean(selectedChildId),
    retry: false
  });
  const attempts = useQuery({
    queryKey: queryKeys.parentReport(selectedChildId, "attempts-1"),
    queryFn: () => getParentAttemptsReport({ childId: selectedChildId, page: 1, limit: 8 }),
    enabled: Boolean(selectedChildId),
    retry: false
  });
  const recordings = useQuery({
    queryKey: queryKeys.childRecordings(selectedChildId),
    queryFn: () => getChildRecordings(selectedChildId),
    enabled: Boolean(selectedChildId) && activeTab === "inbox",
    retry: false
  });
  const speechCapability = useQuery({
    queryKey: queryKeys.speechCapability(selectedChildId),
    queryFn: () => getSpeechCapability(selectedChildId),
    enabled: Boolean(selectedChildId) && activeTab === "safety",
    retry: false
  });

  if (childrenQuery.isLoading) return <LoadingState label="Đang mở góc phụ huynh..." />;
  if (childrenQuery.isError) return <ErrorState title="Không mở được báo cáo" message={authErrorMessage(childrenQuery.error)} />;
  if (!children.length) return <ErrorState title="Chưa có hồ sơ bé" message="Tạo hồ sơ bé trong Góc phụ huynh để xem báo cáo học tập." />;

  const loading = childQuery.isLoading || overview.isLoading;
  const error = childQuery.error || overview.error;

  return (
    <div className="grid gap-8 pb-10">
      <TopBar />
      <ChildHero
        child={childQuery.data}
        children={children}
        onSelectChild={setSelectedChildId}
        overview={overview.data}
        selectedChildId={selectedChildId}
      />
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
      {loading ? <LoadingState label="Đang tải báo cáo MongoDB..." /> : null}
      {error ? <ErrorState title="Không tải được dữ liệu" message={authErrorMessage(error)} /> : null}
      {!loading && !error ? (
        <>
          <KpiGrid child={childQuery.data} overview={overview.data} />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
            <GrowthTree overview={overview.data} />
            <RecognitionPanel attempts={attempts.data} overview={overview.data} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <SafetySettings child={childQuery.data} childId={selectedChildId} speechCapability={speechCapability} />
            <ResourcesPanel childId={selectedChildId} />
          </div>
          <DailyAndHistory activeTab={activeTab} attempts={attempts.data} daily={daily.data} recordings={recordings} />
          <TeacherAdvice overview={overview.data} />
        </>
      ) : null}
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button className="px-5 py-2 text-sm" icon={ArrowLeft} to="/be" variant="secondary">
        Quay lại Vườn Học
      </Button>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-[#fff4cf] px-4 py-2 text-sm font-bold text-[#9a5b00]">Báo cáo theo dữ liệu MongoDB</span>
        <img alt="" className="h-10 w-10 rounded-full object-cover ring-4 ring-[#b9f8de]" src={assets.mascotSquirrel} />
      </div>
    </div>
  );
}

function ChildHero({ child, children, onSelectChild, overview, selectedChildId }) {
  const mascot = mascotImages[child?.mascotKey] ?? assets.mascotSquirrel;
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <section className="rounded-[30px] bg-white/82 px-7 py-6 shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img alt="" className="h-20 w-20 rounded-[22px] border-4 border-white object-cover shadow-soft" src={mascot} />
            <span className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-[#f59e0b] text-white shadow-sm">
              <BadgeCheck className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold text-[var(--vc-primary)]">{child?.nickname ?? "Bé"}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#b9f8de] px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--vc-primary)]" /> Đang hoạt động
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-[var(--vc-muted)]">
              Cấp độ: {levelName(overview?.level)} • {ageLabel(child?.ageBand)}
            </p>
          </div>
        </div>
        <div className="relative flex flex-col items-stretch gap-3 sm:items-end">
          <Button className="px-6 py-2 text-sm" icon={Share2} onClick={() => window.print()} variant="secondary">
            Chia sẻ kết quả
          </Button>
          <button
            className="target-56 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--vc-primary)] px-6 font-display text-sm font-extrabold text-white shadow-button transition active:translate-y-[3px] motion-reduce:transition-none"
            onClick={() => setPickerOpen((open) => !open)}
            type="button"
          >
            <Sparkles className="h-4 w-4" /> Đổi hồ sơ bé
          </button>
          {pickerOpen ? (
            <div className="absolute right-0 top-[calc(100%+10px)] z-10 grid min-w-56 gap-2 rounded-[24px] bg-white p-3 shadow-soft ring-1 ring-[#d9f3e8]">
              {children.map((item) => {
                const active = selectedChildId === item.id;
                return (
                  <button
                    className={`target-56 rounded-2xl px-4 text-left text-sm font-extrabold ${
                      active ? "bg-[var(--vc-primary)] text-white" : "bg-[#e9fff5] text-[var(--vc-primary)] hover:bg-[#d6fff0]"
                    }`}
                    key={item.id}
                    onClick={() => {
                      onSelectChild(item.id);
                      setPickerOpen(false);
                    }}
                    type="button"
                  >
                    {item.nickname}
                  </button>
                );
              })}
            </div>
          ) : null}
          </div>
        </div>
    </section>
  );
}

function TabBar({ activeTab, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-full bg-white/70 p-2 shadow-sm">
      {tabs.map((tab) => (
        <button
          className={`target-56 shrink-0 rounded-full px-4 text-sm font-extrabold ${
            activeTab === tab.id ? "bg-[var(--vc-primary)] text-white shadow-button" : "bg-white text-[var(--vc-primary)]"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function KpiGrid({ child, overview }) {
  const activeMinutes = Math.round((overview?.activeSecondsToday ?? 0) / 60);
  const limitMinutes = Math.round((overview?.dailyLimitSeconds ?? (child?.settings?.dailyLimitMinutes ?? 30) * 60) / 60);
  const accuracy = overview?.recognitionAccuracy;
  const cards = [
    ["Bảng Chữ Cái Tiếng Việt", `${overview?.masteredLetters ?? 0}`, "/ 29", `${overview?.seenLetters ?? 0} chữ đã xem`, "A"],
    ["Vốn Từ Thiên Nhiên", `${overview?.vocabPracticed ?? 0}`, " từ", "Đếm từ bài tập có vocabulary thật", "☘"],
    ["Thời Lượng Hôm Nay", `${activeMinutes}`, ` / ${limitMinutes} phút`, `Còn ${Math.max(0, limitMinutes - activeMinutes)} phút trước giới hạn`, "👁"],
    ["Chuỗi Học Chăm Chỉ", `${overview?.streakDays ?? 0}`, " ngày", accuracy == null ? "Chưa có dữ liệu nhận diện" : `Nhận diện đúng ${Math.round(accuracy * 100)}%`, "🏅"]
  ];
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(([title, value, suffix, note, icon]) => (
        <article className="rounded-[30px] bg-white p-6 shadow-soft" key={title}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-[var(--vc-muted)]">{title}</p>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#c9ffe9] font-display font-extrabold text-[var(--vc-primary)]">{icon}</span>
          </div>
          <p className="mt-5 font-display text-4xl font-extrabold text-[var(--vc-primary)]">
            {value} <span className="text-xl text-[var(--vc-muted)]">{suffix}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--vc-muted)]">{note}</p>
        </article>
      ))}
    </section>
  );
}

function GrowthTree({ overview }) {
  const stage = overview?.growthStage ?? { label: "Hạt mầm", range: "0-10" };
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-soft">
      <p className="text-sm font-extrabold uppercase text-[var(--vc-primary)]">Cây sinh trưởng kỳ diệu</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Khu Rừng Chồi Non</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--vc-muted)]">Mỗi bài luyện chủ và âm điệu bé hoàn thành chính là giọt nước ngọt nuôi dưỡng mầm cây lớn lên mỗi ngày.</p>
        </div>
        <span className="rounded-full bg-[#a8f3d2] px-4 py-3 text-sm font-extrabold text-[var(--vc-primary)]">Cấp độ {overview?.level ?? 1}: {stage.label}</span>
      </div>
      <div className="mt-6 grid min-h-72 place-items-center rounded-[28px] bg-[#f2fff8]">
        <div className="relative h-56 w-48">
          <div className="absolute bottom-2 left-1/2 h-28 w-6 -translate-x-1/2 rounded-full bg-[#8a4b00]" />
          <div className="absolute left-1/2 top-4 grid h-32 w-32 -translate-x-1/2 place-items-center rounded-full bg-[var(--vc-primary)] text-white shadow-soft">
            <TreePine className="h-16 w-16" />
          </div>
          {["A", "Ă", "B", "D"].map((letter, index) => (
            <span
              className="absolute grid h-8 w-8 place-items-center rounded-full bg-[#f59e0b] text-xs font-extrabold text-white"
              key={letter}
              style={{ left: `${38 + (index % 2) * 42}%`, top: `${34 + index * 12}%` }}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm font-extrabold">
        {["Hạt mầm 0-10", "Chồi non 11-20", "Đơm hoa kết trái 21-29"].map((item) => (
          <span className={`rounded-full px-3 py-3 ${stage.range && item.includes(stage.range) ? "bg-[var(--vc-primary)] text-white" : "bg-[#c9ffe9] text-[var(--vc-primary)]"}`} key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function RecognitionPanel({ attempts, overview }) {
  const accuracy = overview?.recognitionAccuracy;
  const recommendations = overview?.recommendations ?? [];
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Phân Tích Nhận Diện & Dấu Thanh</h2>
          <p className="mt-1 text-sm text-[var(--vc-muted)]">Tính từ attempts lần đầu do backend ghi nhận, không dùng điểm phát âm giả.</p>
        </div>
        <span className="rounded-full bg-[#c9ffe9] px-4 py-2 text-sm font-extrabold text-[var(--vc-primary)]">
          {accuracy == null ? "Chưa có dữ liệu" : `Độ chính xác ${Math.round(accuracy * 100)}%`}
        </span>
      </div>
      <div className="mt-6 rounded-[24px] bg-[#e9fff5] p-4">
        <p className="font-display font-extrabold text-[var(--vc-primary)]">Bé nhớ tốt các chữ đã luyện</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(overview?.letters ?? []).slice(0, 8).map((letter) => (
            <span className="rounded-2xl bg-[#a8f3d2] px-4 py-3 text-center text-sm font-extrabold text-[var(--vc-primary)]" key={letter.letterId}>
              {letter.state}
            </span>
          ))}
          {!(overview?.letters ?? []).length ? <span className="text-sm font-bold text-[var(--vc-muted)]">Chưa có chữ nào trong báo cáo.</span> : null}
        </div>
      </div>
      <h3 className="mt-6 font-display text-lg font-extrabold text-[#9a5b00]">Bài cần ôn dựa trên bằng chứng</h3>
      <div className="mt-3 grid gap-3">
        {recommendations.map((item) => (
          <article className="flex items-center justify-between gap-4 rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#e6f4ec]" key={item.letterId}>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffe2bd] font-display text-xl font-extrabold text-[#9a5b00]">{item.symbol}</span>
              <div>
                <p className="font-bold">Ôn chữ {item.symbol}</p>
                <p className="text-sm text-[var(--vc-muted)]">Chưa đủ bằng chứng mastered 2 bài nhận diện.</p>
              </div>
            </div>
            <Link className="rounded-full bg-[#f59e0b] px-4 py-2 text-sm font-extrabold text-[#2a1700]" to="/be/bang-chu-cai">
              Tập cùng bé
            </Link>
          </article>
        ))}
        {!recommendations.length ? <p className="rounded-2xl bg-[#e9fff5] p-4 font-bold text-[var(--vc-primary)]">Chưa có khuyến nghị mới.</p> : null}
      </div>
      <AttemptTable attempts={attempts} />
    </section>
  );
}

function AttemptTable({ attempts }) {
  const items = attempts?.items ?? [];
  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-extrabold">Lịch sử bài gần đây</h3>
      <div className="mt-3 overflow-hidden rounded-[22px] border border-[#d9f3e8]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#e9fff5] text-[var(--vc-primary)]">
            <tr>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Bài</th>
              <th className="px-4 py-3">Lần</th>
              <th className="px-4 py-3">Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {items.map((attempt) => (
              <tr className="border-t border-[#e6f4ec]" key={attempt.id}>
                <td className="px-4 py-3">{attempt.dayKey}</td>
                <td className="px-4 py-3">{attempt.exerciseType ?? "Bài tập"}</td>
                <td className="px-4 py-3">{attempt.attemptNo}</td>
                <td className="px-4 py-3">{attempt.isCorrect ? "Đúng" : "Cần ôn"}</td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td className="px-4 py-5 text-[var(--vc-muted)]" colSpan={4}>Chưa có attempt trong MongoDB.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SafetySettings({ child, childId, speechCapability }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(child?.settings ?? {});
  const browserSpeech = useMemo(() => detectBrowserSpeechCapability(), []);
  useEffect(() => setSettings(child?.settings ?? {}), [child?.id, child?.settings]);
  const mutation = useMutation({
    mutationFn: updateChildSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.child(childId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.parentReport(childId, "overview") });
    }
  });
  const save = () => {
    if (!window.confirm("Lưu cài đặt học tập cho hồ sơ bé này?")) return;
    mutation.mutate({
      childId,
      settings: {
        dailyLimitMinutes: Number(settings.dailyLimitMinutes ?? 30),
        breakEveryMinutes: Number(settings.breakEveryMinutes ?? 20),
        breakSeconds: Number(settings.breakSeconds ?? 20),
        ambienceEnabled: Boolean(settings.ambienceEnabled),
        volume: Number(settings.volume ?? 0.7),
        dialect: settings.dialect ?? child?.dialect ?? "north"
      }
    });
  };
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-soft">
      <h2 className="font-display text-2xl font-extrabold">Thiết Lập Bảo Vệ & Thói Quen Học Lành Mạnh</h2>
      <div className="mt-5 grid gap-4">
        <SettingInput label="Giới hạn học mỗi ngày" max={60} min={15} suffix="phút" value={settings.dailyLimitMinutes ?? 30} onChange={(value) => setSettings((old) => ({ ...old, dailyLimitMinutes: value }))} />
        <SettingInput label="Nhắc nghỉ sau" max={20} min={10} suffix="phút" value={settings.breakEveryMinutes ?? 20} onChange={(value) => setSettings((old) => ({ ...old, breakEveryMinutes: value }))} />
        <SettingInput label="Thời gian nghỉ tối thiểu" max={300} min={20} suffix="giây" value={settings.breakSeconds ?? 20} onChange={(value) => setSettings((old) => ({ ...old, breakSeconds: value }))} />
        <div className="rounded-[22px] bg-[#e9fff5] p-4">
          <p className="font-bold">Giọng đọc cô giáo hướng dẫn</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["north", "Miền Bắc"],
              ["central", "Miền Trung"],
              ["south", "Miền Nam"]
            ].map(([value, label]) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-extrabold ${settings.dialect === value || (!settings.dialect && child?.dialect === value) ? "bg-[var(--vc-primary)] text-white" : "bg-white text-[var(--vc-primary)]"}`}
                key={value}
                onClick={() => setSettings((old) => ({ ...old, dialect: value }))}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <SpeechStatusPanel browserSpeech={browserSpeech} capability={speechCapability} />
        <SettingInput label="Âm lượng nền" max={1} min={0} step={0.1} suffix="" value={settings.volume ?? 0.7} onChange={(value) => setSettings((old) => ({ ...old, volume: value }))} />
      </div>
      {mutation.isError ? <p className="mt-3 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{authErrorMessage(mutation.error)}</p> : null}
      {mutation.isSuccess ? <p className="mt-3 rounded-2xl bg-[#e9fff5] p-3 text-sm font-bold text-[var(--vc-primary)]">Đã lưu cài đặt từ backend.</p> : null}
      <Button className="mt-5" disabled={mutation.isPending} icon={Settings2} onClick={save}>Lưu cài đặt</Button>
      <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--vc-muted)]"><Lock className="h-4 w-4" /> Chỉ phụ huynh qua PIN gate mới chỉnh được.</p>
    </section>
  );
}

function SpeechStatusPanel({ browserSpeech, capability }) {
  const data = capability?.data;
  const label = data?.featureEnabled ? "Speech provider san sang" : "Speech provider dang tat";
  return (
    <div className="rounded-[22px] bg-[#fff8e6] p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#9a5b00]">
          <Mic className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--vc-muted)]">
            {data?.message ?? "Dang doc trang thai speech tu server."}
          </p>
          <p className="mt-2 text-xs font-bold text-[var(--vc-muted)]">{browserSpeech.label}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold">
            <span className="rounded-full bg-white px-3 py-2 text-[var(--vc-primary)]">
              Provider: {data?.provider ?? "chua cau hinh"}
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-[var(--vc-primary)]">
              Diem phat am: chua co du lieu
            </span>
            <span className="rounded-full bg-white px-3 py-2 text-[var(--vc-primary)]">
              Browser ASR: {browserSpeech.available ? "co ho tro" : "khong ho tro"}
            </span>
          </div>
        </div>
      </div>
      {capability?.isError ? (
        <p className="mt-3 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">{authErrorMessage(capability.error)}</p>
      ) : null}
    </div>
  );
}

function SettingInput({ label, max, min, onChange, step = 1, suffix, value }) {
  return (
    <label className="rounded-[22px] bg-[#e9fff5] p-4">
      <span className="font-bold">{label}</span>
      <span className="mt-3 flex items-center gap-3">
        <input className="w-full accent-[var(--vc-primary)]" max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} step={step} type="range" value={value} />
        <span className="min-w-20 rounded-full bg-white px-3 py-2 text-center text-sm font-extrabold text-[var(--vc-primary)]">{value}{suffix ? ` ${suffix}` : ""}</span>
      </span>
    </label>
  );
}

function ResourcesPanel({ childId }) {
  const exportMutation = useMutation({ mutationFn: exportChildData });
  const download = async () => {
    const data = await exportMutation.mutateAsync(childId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `vuon-chu-export-${childId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-soft">
      <span className="rounded-full bg-[#fff4cf] px-3 py-1 text-xs font-extrabold text-[#9a5b00]">Tài Liệu Viết Tay</span>
      <h2 className="mt-3 font-display text-2xl font-extrabold text-[var(--vc-primary)]">Phiếu Tô Màu & Tập Viết Chữ Rừng Xanh</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--vc-muted)]">PDF học liệu chưa có asset ready trong seed nên nút tải PDF đang khóa, không tạo file giả.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ResourcePreview title="Chữ A: Con Cá Vàng" />
        <ResourcePreview title="Chữ B: Bạn Bướm Xinh" />
      </div>
      <button className="target-56 mt-5 w-full rounded-2xl bg-[#f59e0b] px-4 font-display font-extrabold text-[#2a1700] opacity-70" disabled type="button">
        Tải trọn bộ 29 chữ cái PDF
      </button>
      <Button className="mt-3 w-full" disabled={exportMutation.isPending} icon={Download} onClick={download} variant="secondary">
        Xuất JSON dữ liệu bé
      </Button>
      <Button className="mt-3 w-full" icon={Printer} onClick={() => window.print()} variant="secondary">
        In báo cáo
      </Button>
    </section>
  );
}

function ResourcePreview({ title }) {
  return (
    <div className="rounded-2xl border border-[#e6f4ec] bg-[#f8fffb] p-3 text-center">
      <FileText className="mx-auto h-10 w-10 text-[var(--vc-muted)]" />
      <p className="mt-2 text-xs font-bold">{title}</p>
      <p className="text-[10px] text-[var(--vc-muted)]">Resource missing</p>
    </div>
  );
}

function DailyAndHistory({ activeTab, attempts, daily, recordings }) {
  if (!["time", "lessons", "inbox"].includes(activeTab)) return null;
  const recordingItems = recordings?.data?.items ?? [];
  const recordingMessage = recordings?.data?.capability?.message;
  if (activeTab === "inbox") {
    return (
      <section className="rounded-[32px] bg-white p-7 shadow-soft">
        <h2 className="font-display text-2xl font-extrabold">Hop thu ghi am</h2>
        <div className="mt-4 grid gap-3">
          {recordings?.isLoading ? <p className="rounded-2xl bg-[#e9fff5] p-4 font-bold text-[var(--vc-primary)]">Dang tai hop thu ghi am...</p> : null}
          {recordings?.isError ? <p className="rounded-2xl bg-[#fef2f2] p-4 font-bold text-[var(--vc-error)]">{authErrorMessage(recordings.error)}</p> : null}
          {!recordings?.isLoading && !recordingItems.length ? (
            <p className="rounded-2xl bg-[#fff4cf] p-4 font-bold text-[#9a5b00]">
              {recordingMessage ?? "Chua co ban ghi am nao tu server."} Khong co email/Zalo hay link cong khai trong MVP.
            </p>
          ) : null}
          {recordingItems.map((item) => (
            <article className="rounded-2xl bg-[#e9fff5] p-4" key={item.id}>
              <p className="font-display font-extrabold text-[var(--vc-primary)]">{item.roleKey}</p>
              <p className="mt-1 text-sm text-[var(--vc-muted)]">
                {Math.round(item.durationSeconds)}s - {Math.round(item.sizeBytes / 1024)}KB - het han {new Date(item.expiresAt).toLocaleDateString("vi-VN")}
              </p>
            </article>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="rounded-[32px] bg-white p-7 shadow-soft">
      <h2 className="font-display text-2xl font-extrabold">{activeTab === "inbox" ? "Hộp thư ghi âm" : "Bảng thời lượng & bài học"}</h2>
      {activeTab === "inbox" ? (
        <p className="mt-3 rounded-2xl bg-[#fff4cf] p-4 font-bold text-[#9a5b00]">Ghi âm gửi ba mẹ thuộc bước 15, hiện chưa bật để tránh tạo inbox giả.</p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(daily?.items ?? []).slice(0, 8).map((item) => (
            <div className="rounded-2xl bg-[#e9fff5] p-4" key={item.dayKey}>
              <p className="font-bold">{item.dayKey}</p>
              <p className="text-sm text-[var(--vc-muted)]">{Math.round((item.activeSeconds ?? 0) / 60)} phút • {item.attemptCount ?? 0} bài lần đầu</p>
            </div>
          ))}
          {!(daily?.items ?? []).length ? <p className="text-[var(--vc-muted)]">Chưa có dailyStats trong MongoDB.</p> : null}
        </div>
      )}
      {activeTab === "lessons" ? <AttemptTable attempts={attempts} /> : null}
    </section>
  );
}

function TeacherAdvice({ overview }) {
  const firstRecommendation = overview?.recommendations?.[0];
  return (
    <section className="rounded-[32px] bg-[#a8f3d2] p-7 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--vc-primary)] text-white shadow-button">
            <Sprout className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-[var(--vc-primary)]">Lời Khuyên Sư Phạm Tuần Này</h2>
            <p className="mt-2 max-w-2xl leading-7">
              {firstRecommendation ? `Cùng bé ôn chữ ${firstRecommendation.symbol} bằng bài nhận diện để đủ bằng chứng mastered.` : "Bé chưa có lỗi nổi bật trong dữ liệu hiện tại. Hãy tiếp tục các bài ngắn, đều nhịp."}
            </p>
          </div>
        </div>
        <Link className="rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[var(--vc-primary)] shadow-sm" to="/be/bang-chu-cai">
          Xem giáo trình tháng này
        </Link>
      </div>
    </section>
  );
}

function ageLabel(ageBand) {
  return ageBand ? ageBand.replace("-", " - ") : "Chưa đặt độ tuổi";
}

function levelName(level) {
  if (level >= 4) return "Nhà Thám Hiểm Rừng Xanh";
  if (level === 3) return "Sóc Nhí";
  if (level === 2) return "Chồi Non";
  return "Hạt Mầm";
}
