import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Pause, Play, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRecordingCapability, uploadChildRecording } from "../api/childDataApi.js";
import { queryKeys } from "../api/queryKeys.js";
import { authErrorMessage } from "../auth/useAuth.js";

const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", ""];

function isLocalSecureContext() {
  if (typeof window === "undefined") return false;
  return window.isSecureContext || ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return preferredTypes.find((type) => !type || MediaRecorder.isTypeSupported(type)) ?? "";
}

export function RecordingPanel({ childId, storyId, roleKey = "storyteller" }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const previewUrlRef = useRef(null);
  const stopTimerRef = useRef(null);
  const tickRef = useRef(null);

  const capability = useQuery({
    queryKey: queryKeys.recordingCapability(childId),
    queryFn: () => getRecordingCapability(childId),
    enabled: Boolean(childId),
    retry: false
  });

  const upload = useMutation({
    mutationFn: uploadChildRecording,
    onSuccess: async () => {
      discard();
      await queryClient.invalidateQueries({ queryKey: queryKeys.childRecordings(childId) });
    }
  });

  const supported = useMemo(() => {
    return Boolean(isLocalSecureContext() && navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
  }, []);
  const canUpload = Boolean(capability.data?.featureEnabled && capability.data?.recordingConsentEnabled && blob);
  const disabledReason = !capability.data?.featureEnabled
    ? "May chu chua bat kho ghi am rieng tu."
    : !capability.data?.recordingConsentEnabled
      ? "Can ba me bat dong y ghi am trong ho so be."
      : null;

  function cleanupMedia() {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    stopTimerRef.current = null;
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }

  function discard() {
    cleanupMedia();
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setBlob(null);
    setElapsed(0);
    setStatus("idle");
    setError(null);
  }

  async function startRecording() {
    if (!supported) {
      setError("Trinh duyet chi cho thu am tren HTTPS hoac localhost va can ho tro MediaRecorder.");
      return;
    }
    discard();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(recordedBlob);
        setBlob(recordedBlob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setStatus("preview");
        cleanupMedia();
      };
      recorder.start();
      setStatus("recording");
      tickRef.current = window.setInterval(() => setElapsed((value) => Math.min(15, value + 1)), 1000);
      stopTimerRef.current = window.setTimeout(stopRecording, 15000);
    } catch (recordingError) {
      cleanupMedia();
      setStatus("idle");
      setError(recordingError?.name === "NotAllowedError" ? "Be chua cap quyen micro. Khong co file nao duoc gui." : "Khong mo duoc micro tren thiet bi nay.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    } else {
      cleanupMedia();
      setStatus("idle");
    }
  }

  function sendRecording() {
    if (!blob || !canUpload) return;
    upload.mutate({
      childId,
      blob,
      storyId,
      roleKey,
      idempotencyKey: `recording-${storyId}-${roleKey}-${Date.now()}`
    });
  }

  useEffect(() => {
    return () => {
      cleanupMedia();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  return (
    <section className="rounded-[28px] bg-white p-6 text-center shadow-soft">
      <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-white ${status === "recording" ? "bg-[#dc2626]" : "bg-[var(--vc-primary)]"}`}>
        <Mic className="h-9 w-9" />
      </div>
      <h3 className="mt-4 font-display text-xl font-black text-[#06382e]">Thu am ke chuyen</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#3d4a42]">
        Thu toi da 15 giay tren may nay. Ban nhap co the nghe lai; gui cho ba me chi bat khi server co storage rieng va consent.
      </p>
      {status === "recording" ? (
        <p className="mt-3 rounded-full bg-[#fee2e2] px-4 py-2 text-sm font-extrabold text-[#b91c1c]">Dang thu {elapsed}s / 15s</p>
      ) : null}
      {previewUrl ? (
        <audio className="mt-4 w-full" controls src={previewUrl}>
          <track kind="captions" />
        </audio>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {status === "recording" ? (
          <button className="target-56 inline-flex items-center gap-2 rounded-full bg-[#dc2626] px-5 font-display text-sm font-black text-white shadow-button" onClick={stopRecording} type="button">
            <Pause className="h-4 w-4" /> Dung thu
          </button>
        ) : (
          <button className="target-56 inline-flex items-center gap-2 rounded-full bg-[var(--vc-primary)] px-5 font-display text-sm font-black text-white shadow-button disabled:opacity-60" disabled={!supported || upload.isPending} onClick={startRecording} type="button">
            <Play className="h-4 w-4" /> Bat dau thu
          </button>
        )}
        <button className="target-56 inline-flex items-center gap-2 rounded-full bg-white px-5 font-display text-sm font-black text-[var(--vc-primary)] shadow-sm disabled:opacity-50" disabled={!blob || upload.isPending} onClick={discard} type="button">
          <Trash2 className="h-4 w-4" /> Xoa nhap
        </button>
        <button className="target-56 inline-flex items-center gap-2 rounded-full bg-[#f59e0b] px-5 font-display text-sm font-black text-[#2a1700] shadow-[0_4px_0_#9a5b00] disabled:opacity-50" disabled={!canUpload || upload.isPending} onClick={sendRecording} type="button">
          <Send className="h-4 w-4" /> Gui ba me
        </button>
      </div>
      {disabledReason ? <p className="mt-3 rounded-2xl bg-[#fff4cf] p-3 text-xs font-bold text-[#9a5b00]">{disabledReason}</p> : null}
      {error ? <p className="mt-3 rounded-2xl bg-[#fef2f2] p-3 text-xs font-bold text-[var(--vc-error)]">{error}</p> : null}
      {upload.isError ? <p className="mt-3 rounded-2xl bg-[#fef2f2] p-3 text-xs font-bold text-[var(--vc-error)]">{authErrorMessage(upload.error)}</p> : null}
    </section>
  );
}
