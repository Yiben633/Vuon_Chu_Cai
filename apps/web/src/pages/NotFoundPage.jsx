import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-5 py-12 text-center">
      <h1 className="font-display text-4xl font-black">Chưa có lối đi này</h1>
      <p className="max-w-lg text-lg leading-8 text-[var(--vc-muted)]">
        Trang bạn mở chưa nằm trong bản đồ hiện tại của khu vườn.
      </p>
      <Link
        className="target-56 inline-flex items-center rounded-full bg-[var(--vc-primary)] px-6 py-3 font-display font-extrabold text-white shadow-button"
        to="/"
      >
        Về trang giới thiệu
      </Link>
    </section>
  );
}
