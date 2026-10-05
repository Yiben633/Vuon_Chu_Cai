import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-display text-4xl font-bold">Chưa có lối đi này</h1>
      <p className="text-lg text-[var(--color-muted)]">
        Trang này sẽ được mở ở các bước triển khai giao diện tiếp theo.
      </p>
      <Link
        className="min-h-14 rounded-full bg-[var(--color-primary)] px-6 py-4 font-display font-bold text-white shadow-button"
        to="/"
      >
        Về khu vườn
      </Link>
    </section>
  );
}
