import { Volume2 } from "lucide-react";

export function AudioButton({ label = "Âm thanh chưa khả dụng đến bước 15" }) {
  return (
    <button
      aria-label={label}
      className="target-56 inline-flex items-center gap-3 rounded-full border border-[var(--vc-outline)] bg-white px-5 py-3 font-display font-extrabold text-[var(--vc-muted)]"
      disabled
      title={label}
      type="button"
    >
      <Volume2 aria-hidden="true" className="h-5 w-5" />
      <span>Âm thanh chưa có</span>
    </button>
  );
}
