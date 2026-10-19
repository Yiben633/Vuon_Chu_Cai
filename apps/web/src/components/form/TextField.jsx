import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function TextField({ label, error, type = "text", registration, className = "", inputClassName = "", compact = false, ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;
  const inputSize = compact ? "min-h-12 px-4 text-sm" : "target-56 px-4 text-base";

  return (
    <label className={`grid ${compact ? "gap-1.5" : "gap-2"} ${className}`}>
      <span className={`font-display font-extrabold text-[var(--vc-text)] ${compact ? "text-sm" : ""}`}>{label}</span>
      <span className="relative">
        <input
          className={`${inputSize} w-full rounded-2xl border bg-white text-[var(--vc-text)] transition ${
            error ? "border-[var(--vc-error)]" : "border-[var(--vc-outline)] focus:border-[var(--vc-primary)]"
          } ${isPassword ? "pr-14" : ""} ${inputClassName}`}
          type={inputType}
          {...registration}
          {...props}
        />
        {isPassword ? (
          <button
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-1 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-[var(--vc-muted)] hover:bg-[var(--vc-mint)]"
            onClick={() => setVisible(!visible)}
            type="button"
          >
            {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
          </button>
        ) : null}
      </span>
      {error ? <span className="text-xs font-bold text-[var(--vc-error)]">{error.message}</span> : null}
    </label>
  );
}
