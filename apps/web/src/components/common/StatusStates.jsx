import { AlertCircle, LoaderCircle, Sprout } from "lucide-react";
import { Button } from "./Button.jsx";

export function LoadingState({ label = "Đang tải..." }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 rounded-[24px] border border-[var(--vc-outline)] bg-white p-6 text-[var(--vc-muted)]">
      <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Có lỗi xảy ra", message, onRetry }) {
  return (
    <div className="rounded-[24px] border border-[#fecaca] bg-white p-6 text-[var(--vc-text)]">
      <div className="flex items-center gap-3 font-display text-xl font-extrabold text-[var(--vc-error)]">
        <AlertCircle aria-hidden="true" className="h-6 w-6" />
        {title}
      </div>
      <p className="mt-3 leading-7 text-[var(--vc-muted)]">{message ?? "Vui lòng thử lại sau."}</p>
      {onRetry ? <Button className="mt-5" onClick={onRetry}>Thử lại</Button> : null}
    </div>
  );
}

export function EmptyState({ title = "Chưa có dữ liệu", message }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--vc-outline)] bg-white/80 p-8 text-center">
      <Sprout aria-hidden="true" className="mx-auto h-9 w-9 text-[var(--vc-primary)]" />
      <h2 className="mt-4 font-display text-2xl font-extrabold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md leading-7 text-[var(--vc-muted)]">
        {message ?? "Khi có dữ liệu thật từ hệ thống, khu vực này sẽ tự cập nhật."}
      </p>
    </div>
  );
}
