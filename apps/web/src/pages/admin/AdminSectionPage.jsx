import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2, FileUp, Plus, RefreshCcw, Save, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  archiveAdminResource,
  createAdminResource,
  listAdminResources,
  publishAdminResource,
  updateAdminResource,
  uploadAdminAsset
} from "../../api/adminApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import { Button } from "../../components/common/Button.jsx";
import { Card } from "../../components/common/Card.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";

const groups = {
  "hoc-lieu": ["letters", "tones", "vocabulary", "spelling-entries", "lessons", "resources"],
  "bien-tap": ["exercises", "stories", "rewards", "badges", "missions", "assets"],
  "tai-len": ["assets", "resources"]
};

const labels = {
  letters: "Chu cai",
  tones: "Dau thanh",
  vocabulary: "Tu vung",
  "spelling-entries": "Ghep van",
  lessons: "Bai hoc",
  exercises: "Bai tap",
  stories: "Truyen",
  resources: "Tai nguyen",
  assets: "Asset",
  rewards: "Qua tang",
  badges: "Huy hieu",
  missions: "Nhiem vu"
};

const statusOptions = ["", "draft", "published", "archived", "ready", "missing", "quarantined", "active", "inactive"];

export function AdminSectionPage({ title }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const section = location.pathname.includes("tai-len") ? "tai-len" : location.pathname.includes("bien-tap") ? "bien-tap" : "hoc-lieu";
  const resourceTypes = groups[section];
  const [resourceType, setResourceType] = useState(resourceTypes[0]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => blankForm(resourceType));

  useEffect(() => {
    setResourceType(resourceTypes[0]);
    setSelected(null);
    setForm(blankForm(resourceTypes[0]));
    setPage(1);
  }, [resourceTypes, section]);

  useEffect(() => {
    setSelected(null);
    setForm(blankForm(resourceType));
    setPage(1);
  }, [resourceType]);

  const filters = useMemo(() => ({ page, limit: 10, status, q }), [page, q, status]);
  const list = useQuery({
    queryKey: queryKeys.adminResources(resourceType, filters),
    queryFn: () => listAdminResources({ resourceType, ...filters }),
    retry: false
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSummary() })
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      selected?.id ? updateAdminResource({ resourceType, id: selected.id, payload }) : createAdminResource({ resourceType, payload }),
    onSuccess: async (item) => {
      setSelected(item);
      setForm(formFromItem(resourceType, item));
      await invalidate();
    }
  });
  const publishMutation = useMutation({ mutationFn: publishAdminResource, onSuccess: invalidate });
  const archiveMutation = useMutation({ mutationFn: archiveAdminResource, onSuccess: invalidate });
  const uploadMutation = useMutation({ mutationFn: uploadAdminAsset, onSuccess: invalidate });

  const items = list.data?.items ?? [];
  const meta = list.data?.meta ?? { page: 1, total: 0, limit: 10 };

  function selectItem(item) {
    setSelected(item);
    setForm(formFromItem(resourceType, item));
  }

  function newItem() {
    setSelected(null);
    setForm(blankForm(resourceType));
  }

  function save() {
    const payload = payloadFromForm(resourceType, form);
    saveMutation.mutate(payload);
  }

  function publish() {
    if (!selected?.id) return;
    if (!window.confirm("Xac nhan noi dung da duoc admin ra soat va san sang publish?")) return;
    publishMutation.mutate({ resourceType, id: selected.id });
  }

  function archive() {
    if (!selected?.id) return;
    if (!window.confirm("Archive noi dung nay? Active snapshots van duoc giu, nhung learner se khong thay ban ghi moi.")) return;
    archiveMutation.mutate({ resourceType, id: selected.id });
  }

  return (
    <div className="grid gap-6">
      <header className="rounded-[30px] bg-white p-6 shadow-soft">
        <p className="font-display text-sm font-black uppercase text-[var(--vc-primary)]">Admin</p>
        <h1 className="mt-2 font-display text-3xl font-black text-[var(--vc-primary)]">{title}</h1>
        <p className="mt-2 max-w-3xl font-semibold leading-7 text-[var(--vc-muted)]">
          CRUD, review, publish va archive cho content namespace. Form tach truong theo tung loai; JSON chi dung cho mang phuc tap co preview/validation backend.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto rounded-[24px] bg-[#d8fff0] p-2">
        {resourceTypes.map((type) => (
          <button
            className={`target-56 shrink-0 rounded-2xl px-4 font-display text-sm font-black ${resourceType === type ? "bg-[var(--vc-primary)] text-white shadow-button" : "bg-white text-[var(--vc-primary)]"}`}
            key={type}
            onClick={() => setResourceType(type)}
            type="button"
          >
            {labels[type] ?? type}
          </button>
        ))}
      </div>

      {section === "tai-len" ? <UploadPanel mutation={uploadMutation} /> : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-black">{labels[resourceType] ?? resourceType}</h2>
              <p className="mt-1 text-sm font-bold text-[var(--vc-muted)]">Danh sach co search, status va pagination tu backend.</p>
            </div>
            <Button icon={Plus} onClick={newItem} variant="secondary">
              Tao moi
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <label className="flex min-h-12 items-center gap-2 rounded-2xl bg-[#f2fff8] px-4">
              <Search className="h-4 w-4 text-[var(--vc-primary)]" />
              <input className="w-full bg-transparent font-bold outline-none" onChange={(event) => setQ(event.target.value)} placeholder="Tim key/title/word/slug" value={q} />
            </label>
            <select className="min-h-12 rounded-2xl bg-[#f2fff8] px-4 font-bold outline-none" onChange={(event) => setStatus(event.target.value)} value={status}>
              {statusOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "tat ca trang thai"}
                </option>
              ))}
            </select>
            <Button icon={RefreshCcw} onClick={() => list.refetch()} variant="secondary">
              Tai lai
            </Button>
          </div>

          {list.isLoading ? <LoadingState label="Dang tai danh sach admin..." /> : null}
          {list.isError ? <ErrorState title="Khong tai duoc danh sach" message={list.error.message} onRetry={() => list.refetch()} /> : null}
          {!list.isLoading && !list.isError ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[var(--vc-muted)]">
                  <tr>
                    <th className="py-3">Key</th>
                    <th className="py-3">Tieu de</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Review</th>
                    <th className="py-3">Version</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className={`cursor-pointer border-t border-[#e0f2e9] ${selected?.id === item.id ? "bg-[#e9fff5]" : ""}`} key={item.id} onClick={() => selectItem(item)}>
                      <td className="py-3 font-black text-[var(--vc-primary)]">{item.key}</td>
                      <td>{item.title ?? item.word ?? item.slug ?? item.name ?? item.type ?? "-"}</td>
                      <td>{item.status ?? (item.active === false ? "inactive" : item.active === true ? "active" : "-")}</td>
                      <td>{item.reviewStatus ?? "-"}</td>
                      <td>{item.version ?? "-"}</td>
                    </tr>
                  ))}
                  {!items.length ? (
                    <tr>
                      <td className="py-5 text-[var(--vc-muted)]" colSpan={5}>
                        Khong co ban ghi phu hop.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--vc-muted)]">
                  Trang {meta.page} / {Math.max(1, Math.ceil((meta.total ?? 0) / (meta.limit ?? 10)))} - {meta.total ?? 0} ban ghi
                </p>
                <div className="flex gap-2">
                  <Button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} variant="secondary">
                    Truoc
                  </Button>
                  <Button disabled={page >= Math.ceil((meta.total ?? 0) / (meta.limit ?? 10))} onClick={() => setPage((value) => value + 1)} variant="secondary">
                    Sau
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-black">{selected ? "Sua noi dung" : "Tao noi dung"}</h2>
              <p className="text-sm font-bold text-[var(--vc-muted)]">Backend validate schema va version.</p>
            </div>
            {selected ? <span className="rounded-full bg-[#fff4cf] px-3 py-1 text-xs font-black text-[#9a5b00]">v{selected.version ?? "-"}</span> : null}
          </div>
          <AdminEditor form={form} resourceType={resourceType} setForm={setForm} />
          <Preview item={selected} resourceType={resourceType} draft={payloadFromForm(resourceType, form)} />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={saveMutation.isPending} icon={Save} onClick={save}>
              Luu
            </Button>
            <Button disabled={!selected?.id || publishMutation.isPending || resourceType === "assets"} icon={CheckCircle2} onClick={publish} variant="secondary">
              Publish
            </Button>
            <Button disabled={!selected?.id || archiveMutation.isPending} icon={Archive} onClick={archive} variant="reward">
              Archive
            </Button>
          </div>
          {[saveMutation, publishMutation, archiveMutation, uploadMutation].map((mutation, index) =>
            mutation.isError ? (
              <p className="mt-3 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]" key={index}>
                {mutation.error.message}
              </p>
            ) : null
          )}
        </Card>
      </section>
    </div>
  );
}

function UploadPanel({ mutation }) {
  const [file, setFile] = useState(null);
  const [key, setKey] = useState("");
  const [kind, setKind] = useState("image");
  const [licenseStatus, setLicenseStatus] = useState("unknown");
  const [source, setSource] = useState("admin-upload");
  return (
    <Card>
      <h2 className="font-display text-2xl font-black">Tai asset that</h2>
      <p className="mt-1 text-sm font-bold text-[var(--vc-muted)]">Chi chap nhan PNG/JPEG/SVG/audio/PDF qua server verification. Khong dung remote URL tuy y.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <Input label="Asset key" onChange={setKey} value={key} />
        <SelectField label="Kind" onChange={setKind} options={["image", "svg", "audio", "pdf"]} value={kind} />
        <SelectField label="License" onChange={setLicenseStatus} options={["unknown", "verified"]} value={licenseStatus} />
        <Input label="Source" onChange={setSource} value={source} />
        <label className="rounded-2xl bg-[#f2fff8] p-3">
          <span className="block text-xs font-black text-[var(--vc-muted)]">File</span>
          <input className="mt-2 w-full text-sm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" />
        </label>
      </div>
      <Button className="mt-4" disabled={!file || !key || mutation.isPending} icon={FileUp} onClick={() => mutation.mutate({ key, kind, source, licenseStatus, file })}>
        Upload asset
      </Button>
      {mutation.isSuccess ? <p className="mt-3 rounded-2xl bg-[#e9fff5] p-3 font-bold text-[var(--vc-primary)]">Da upload asset va ghi metadata ready.</p> : null}
    </Card>
  );
}

function AdminEditor({ resourceType, form, setForm }) {
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="mt-4 grid gap-3">
      <Input label="Key" onChange={(value) => set("key", value)} value={form.key} disabled={Boolean(form.id)} />
      {["letters", "tones", "vocabulary", "spelling-entries", "lessons", "exercises", "stories", "resources"].includes(resourceType) ? (
        <>
          <Input label="Title" onChange={(value) => set("title", value)} value={form.title} />
          <Input label="Age bands CSV" onChange={(value) => set("ageBands", value)} value={form.ageBands} placeholder="3-4,4-5" />
          <SelectField label="Review status" onChange={(value) => set("reviewStatus", value)} options={["needs_review", "approved"]} value={form.reviewStatus} />
        </>
      ) : null}
      {editorFields(resourceType).map((field) =>
        field.type === "select" ? (
          <SelectField key={field.key} label={field.label} onChange={(value) => set(field.key, value)} options={field.options} value={form[field.key]} />
        ) : field.type === "textarea" ? (
          <TextArea key={field.key} label={field.label} onChange={(value) => set(field.key, value)} value={form[field.key]} />
        ) : (
          <Input key={field.key} label={field.label} onChange={(value) => set(field.key, value)} type={field.type} value={form[field.key]} />
        )
      )}
    </div>
  );
}

function Preview({ resourceType, draft }) {
  if (resourceType === "exercises") {
    return (
      <div className="mt-5 rounded-[22px] bg-[#e9fff5] p-4">
        <p className="font-display font-black text-[var(--vc-primary)]">Learner preview khong co answer</p>
        <p className="mt-2 font-bold">{draft.prompt || "Chua co prompt."}</p>
        <div className="mt-3 grid gap-2">
          {(draft.options ?? []).map((option) => (
            <span className="rounded-2xl bg-white px-3 py-2 font-bold" key={option.id}>{option.label}</span>
          ))}
        </div>
      </div>
    );
  }
  if (resourceType === "resources" && draft.availability !== "ready") {
    return <p className="mt-5 rounded-2xl bg-[#fff4cf] p-3 font-bold text-[#9a5b00]">Resource missing: UI khong duoc hien nut download/publish gia.</p>;
  }
  if (resourceType === "stories") {
    return <p className="mt-5 rounded-2xl bg-[#e9fff5] p-3 font-bold text-[var(--vc-primary)]">Story scenes: {(draft.scenes ?? []).length}. Ending question id duoc giu rieng, preview khong lay answer.</p>;
  }
  return null;
}

function Input({ label, value = "", onChange, type = "text", placeholder, disabled = false }) {
  return (
    <label className="rounded-2xl bg-[#f2fff8] p-3">
      <span className="block text-xs font-black text-[var(--vc-muted)]">{label}</span>
      <input className="mt-1 w-full bg-transparent font-bold outline-none disabled:opacity-60" disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value ?? ""} />
    </label>
  );
}

function TextArea({ label, value = "", onChange }) {
  return (
    <label className="rounded-2xl bg-[#f2fff8] p-3">
      <span className="block text-xs font-black text-[var(--vc-muted)]">{label}</span>
      <textarea className="mt-1 min-h-28 w-full bg-transparent font-mono text-xs font-bold outline-none" onChange={(event) => onChange(event.target.value)} value={value ?? ""} />
    </label>
  );
}

function SelectField({ label, value = "", onChange, options }) {
  return (
    <label className="rounded-2xl bg-[#f2fff8] p-3">
      <span className="block text-xs font-black text-[var(--vc-muted)]">{label}</span>
      <select className="mt-1 w-full bg-transparent font-bold outline-none" onChange={(event) => onChange(event.target.value)} value={value ?? ""}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "-"}
          </option>
        ))}
      </select>
    </label>
  );
}

function editorFields(resourceType) {
  const fields = {
    letters: [
      { key: "symbol", label: "Symbol" },
      { key: "lowerSymbol", label: "Lower symbol" },
      { key: "order", label: "Order", type: "number" },
      { key: "group", label: "Group", type: "select", options: ["vowel", "consonant"] },
      { key: "letterName", label: "Letter name" },
      { key: "exampleText", label: "Example text" },
      { key: "targetOffset", label: "Target offset", type: "number" },
      { key: "targetLength", label: "Target length", type: "number" },
      { key: "baseSymbol", label: "Base symbol" },
      { key: "imageAssetKey", label: "Image asset key" },
      { key: "teachingNote", label: "Teaching note", type: "textarea" }
    ],
    tones: [
      { key: "code", label: "Code", type: "select", options: ["ngang", "sac", "huyen", "hoi", "nga", "nang"] },
      { key: "name", label: "Name" },
      { key: "marker", label: "Marker" },
      { key: "order", label: "Order", type: "number" },
      { key: "example", label: "Example" }
    ],
    vocabulary: [
      { key: "word", label: "Word" },
      { key: "meaning", label: "Meaning", type: "textarea" },
      { key: "category", label: "Category" },
      { key: "syllables", label: "Syllables CSV" },
      { key: "letterIds", label: "Letter ObjectIds CSV" },
      { key: "imageAssetKey", label: "Image asset key" }
    ],
    "spelling-entries": [
      { key: "onset", label: "Onset" },
      { key: "rime", label: "Rime" },
      { key: "toneCode", label: "Tone", type: "select", options: ["ngang", "sac", "huyen", "hoi", "nga", "nang"] },
      { key: "word", label: "Word NFC" },
      { key: "vocabularyId", label: "Vocabulary ObjectId" },
      { key: "explanation", label: "Explanation", type: "textarea" }
    ],
    lessons: [
      { key: "module", label: "Module", type: "select", options: ["alphabet", "spelling", "story", "quiz"] },
      { key: "contentKey", label: "Content key" },
      { key: "order", label: "Order", type: "number" },
      { key: "durationHintMinutes", label: "Duration hint", type: "number" },
      { key: "letterIds", label: "Letter ObjectIds CSV" },
      { key: "exerciseIds", label: "Exercise ObjectIds CSV" }
    ],
    exercises: [
      { key: "type", label: "Type", type: "select", options: ["identify-letter", "match-rime", "listen-word", "select-tone", "listen-animal"] },
      { key: "prompt", label: "Prompt", type: "textarea" },
      { key: "options", label: "Options lines: id|label|assetKey", type: "textarea" },
      { key: "answerOptionId", label: "Correct option id" },
      { key: "targetLetterId", label: "Target letter ObjectId" },
      { key: "vocabularyId", label: "Vocabulary ObjectId" },
      { key: "spellingEntryId", label: "Spelling entry ObjectId" },
      { key: "difficulty", label: "Difficulty", type: "number" },
      { key: "maxAttempts", label: "Max attempts", type: "number" }
    ],
    stories: [
      { key: "slug", label: "Slug" },
      { key: "category", label: "Category" },
      { key: "scenes", label: "Scenes JSON array: id,text,imageAssetKey,hotspots[]", type: "textarea" },
      { key: "endingExerciseId", label: "Ending exercise ObjectId" },
      { key: "vocabularyIds", label: "Vocabulary ObjectIds CSV" },
      { key: "moral", label: "Moral", type: "textarea" },
      { key: "durationHintMinutes", label: "Duration hint", type: "number" }
    ],
    resources: [
      { key: "type", label: "Type", type: "select", options: ["worksheet", "flashcard", "guide"] },
      { key: "assetKey", label: "PDF asset key" },
      { key: "pageCount", label: "Page count", type: "number" },
      { key: "availability", label: "Availability", type: "select", options: ["missing", "ready"] },
      { key: "letterIds", label: "Letter ObjectIds CSV" }
    ],
    rewards: [
      { key: "title", label: "Title" },
      { key: "cost", label: "Cost", type: "number" },
      { key: "cosmeticType", label: "Cosmetic type" },
      { key: "assetKey", label: "Asset key" },
      { key: "active", label: "Active true/false" }
    ],
    badges: [
      { key: "title", label: "Title" },
      { key: "ruleMetric", label: "Rule metric" },
      { key: "ruleThreshold", label: "Rule threshold", type: "number" },
      { key: "assetKey", label: "Asset key" }
    ],
    missions: [
      { key: "title", label: "Title" },
      { key: "ruleMetric", label: "Rule metric" },
      { key: "ruleThreshold", label: "Rule threshold", type: "number" },
      { key: "rewardAcorns", label: "Reward acorns", type: "number" },
      { key: "active", label: "Active true/false" }
    ],
    assets: [
      { key: "kind", label: "Kind", type: "select", options: ["image", "svg", "audio", "pdf"] },
      { key: "localPath", label: "Local path" },
      { key: "objectKey", label: "Object key" },
      { key: "mimeType", label: "MIME type" },
      { key: "sizeBytes", label: "Size bytes", type: "number" },
      { key: "checksum", label: "Checksum" },
      { key: "status", label: "Status", type: "select", options: ["ready", "missing", "quarantined"] },
      { key: "source", label: "Source" },
      { key: "licenseStatus", label: "License", type: "select", options: ["unknown", "verified"] }
    ]
  };
  return fields[resourceType] ?? [];
}

function blankForm(resourceType) {
  return {
    key: "",
    title: "",
    ageBands: "4-5",
    reviewStatus: "needs_review",
    status: "draft",
    group: "vowel",
    type: resourceType === "resources" ? "worksheet" : resourceType === "exercises" ? "identify-letter" : "",
    toneCode: "ngang",
    module: "alphabet",
    availability: "missing",
    active: "true",
    options: "a|Lua chon A|\nb|Lua chon B|",
    scenes: JSON.stringify([{ id: "scene-1", text: "", imageAssetKey: null, hotspots: [] }], null, 2)
  };
}

function formFromItem(resourceType, item) {
  const form = { ...blankForm(resourceType), ...item, id: item.id };
  form.ageBands = (item.ageBands ?? []).join(",");
  form.syllables = (item.syllables ?? []).join(",");
  form.letterIds = (item.letterIds ?? []).join(",");
  form.exerciseIds = (item.exerciseIds ?? []).join(",");
  form.vocabularyIds = (item.vocabularyIds ?? []).join(",");
  form.exampleText = item.example?.text ?? "";
  form.targetOffset = item.example?.targetOffset ?? 0;
  form.targetLength = item.example?.targetLength ?? 1;
  form.baseSymbol = item.example?.baseSymbol ?? "";
  form.answerOptionId = item.answer?.optionId ?? "";
  form.options = (item.options ?? []).map((option) => [option.id, option.label, option.assetKey ?? ""].join("|")).join("\n");
  form.scenes = JSON.stringify(item.scenes ?? JSON.parse(blankForm(resourceType).scenes), null, 2);
  form.ruleMetric = item.rule?.metric ?? "";
  form.ruleThreshold = item.rule?.threshold ?? 0;
  form.active = String(item.active ?? true);
  return form;
}

function payloadFromForm(resourceType, form) {
  const base = {
    key: form.key,
    title: form.title || null,
    ageBands: csv(form.ageBands),
    reviewStatus: form.reviewStatus || "needs_review"
  };
  const map = {
    letters: () => ({
      ...base,
      symbol: form.symbol,
      lowerSymbol: form.lowerSymbol,
      order: number(form.order, 1),
      group: form.group,
      letterName: form.letterName,
      example: { text: form.exampleText, targetOffset: number(form.targetOffset, 0), targetLength: number(form.targetLength, 1), baseSymbol: form.baseSymbol },
      imageAssetKey: nullish(form.imageAssetKey),
      teachingNote: nullish(form.teachingNote)
    }),
    tones: () => ({ ...base, code: form.code, name: form.name, marker: form.marker ?? "", order: number(form.order, 0), example: form.example }),
    vocabulary: () => ({ ...base, word: form.word, meaning: nullish(form.meaning), category: nullish(form.category), syllables: csv(form.syllables), letterIds: csv(form.letterIds), imageAssetKey: nullish(form.imageAssetKey) }),
    "spelling-entries": () => ({ ...base, onset: form.onset ?? "", rime: form.rime, toneCode: form.toneCode, word: (form.word ?? "").normalize("NFC"), vocabularyId: form.vocabularyId, explanation: nullish(form.explanation) }),
    lessons: () => ({ ...base, module: form.module, contentKey: form.contentKey, order: number(form.order, 1), durationHintMinutes: nullableNumber(form.durationHintMinutes), letterIds: csv(form.letterIds), exerciseIds: csv(form.exerciseIds) }),
    exercises: () => ({ ...base, type: form.type, prompt: form.prompt, options: optionLines(form.options), answer: { optionId: form.answerOptionId }, targetLetterId: nullish(form.targetLetterId), vocabularyId: nullish(form.vocabularyId), spellingEntryId: nullish(form.spellingEntryId), difficulty: number(form.difficulty, 1), maxAttempts: number(form.maxAttempts, 3) }),
    stories: () => ({ ...base, slug: form.slug, category: form.category, scenes: jsonArray(form.scenes), endingExerciseId: form.endingExerciseId, vocabularyIds: csv(form.vocabularyIds), moral: nullish(form.moral), durationHintMinutes: nullableNumber(form.durationHintMinutes) }),
    resources: () => ({ ...base, type: form.type, assetKey: nullish(form.assetKey), pageCount: nullableNumber(form.pageCount), availability: form.availability, letterIds: csv(form.letterIds) }),
    rewards: () => ({ key: form.key, title: form.title, cost: number(form.cost, 0), cosmeticType: form.cosmeticType, assetKey: nullish(form.assetKey), active: bool(form.active) }),
    badges: () => ({ key: form.key, title: form.title, rule: { metric: form.ruleMetric, threshold: number(form.ruleThreshold, 0) }, assetKey: nullish(form.assetKey) }),
    missions: () => ({ key: form.key, title: form.title, rule: { metric: form.ruleMetric, threshold: number(form.ruleThreshold, 0) }, rewardAcorns: number(form.rewardAcorns, 0), active: bool(form.active) }),
    assets: () => ({ key: form.key, kind: form.kind, localPath: nullish(form.localPath), objectKey: nullish(form.objectKey), mimeType: form.mimeType, sizeBytes: number(form.sizeBytes, 0), checksum: form.checksum, status: form.status, source: nullish(form.source), licenseStatus: form.licenseStatus ?? "unknown" })
  };
  return map[resourceType]?.() ?? { key: form.key };
}

function csv(value) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value) {
  if (value === "" || value == null) return null;
  return number(value, 0);
}

function nullish(value) {
  return value === "" || value == null ? null : value;
}

function bool(value) {
  return value === true || value === "true";
}

function optionLines(value) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, label, assetKey] = line.split("|");
      return { id: id?.trim(), label: label?.trim(), assetKey: nullish(assetKey?.trim()) };
    });
}

function jsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
