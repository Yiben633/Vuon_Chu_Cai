import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiReadiness } from "../api/client.js";
import { useUiStore } from "../state/useUiStore.js";

export function HomePage() {
  const ambienceEnabled = useUiStore((state) => state.ambienceEnabled);
  const setAmbienceEnabled = useUiStore((state) => state.setAmbienceEnabled);
  const readiness = useQuery({
    queryKey: ["api-readiness"],
    queryFn: getApiReadiness,
    retry: false
  });

  const apiStatus =
    readiness.data?.data?.ready === true
      ? "API đã sẵn sàng"
      : "API chưa kết nối MongoDB sẵn sàng";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[var(--color-outline)] bg-white/90 px-5 py-4 shadow-soft">
        <Link className="font-display text-xl font-bold text-[var(--color-primary)]" to="/">
          Vườn Chữ Diệu Kỳ
        </Link>
        <button
          className="min-h-14 rounded-full bg-[var(--color-reward)] px-5 font-display font-bold text-[#2a1700] shadow-button transition active:translate-y-1"
          type="button"
          onClick={() => setAmbienceEnabled(!ambienceEnabled)}
        >
          {ambienceEnabled ? "Tắt âm nền" : "Bật âm nền"}
        </button>
      </header>

      <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="font-display text-base font-bold uppercase tracking-normal text-[var(--color-primary)]">
            Khởi tạo workspace
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-[var(--color-text)] sm:text-5xl">
            Học chữ tiếng Việt trong một khu vườn dịu mắt.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            Bước này dựng nền React, Express và contracts dùng chung. Nội dung học,
            đăng nhập, tiến độ và phần thưởng thật sẽ được nối ở các bước sau.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--color-mint)] px-4 py-3 font-display font-bold text-[var(--color-primary)]">
              ReactJS + Vite
            </span>
            <span className="rounded-full bg-[#fff7ed] px-4 py-3 font-display font-bold text-[#9a3412]">
              Express + MongoDB
            </span>
            <span className="rounded-full bg-[#eff6ff] px-4 py-3 font-display font-bold text-[#075985]">
              Zod contracts
            </span>
          </div>
        </div>

        <aside className="rounded-[32px] border-2 border-[#dcfce7] bg-white p-6 shadow-soft">
          <div className="rounded-[24px] bg-[#fefce8] p-5">
            <p className="font-display text-lg font-bold text-[#684000]">Trạng thái API</p>
            <p className="mt-3 text-base leading-7 text-[var(--color-muted)]">{apiStatus}</p>
            {readiness.isError ? (
              <p className="mt-3 text-sm text-[var(--color-error)]">
                Chưa gọi được API local. Hãy chạy `npm run dev:api`.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
