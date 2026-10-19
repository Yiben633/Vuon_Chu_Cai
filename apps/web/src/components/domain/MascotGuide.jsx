import { assets } from "../../assets/assetRegistry.js";

export function MascotGuide({ title, children }) {
  return (
    <aside className="grid gap-5 rounded-[28px] border border-[#ead7a0] bg-[var(--vc-cream)] p-4 shadow-soft sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-[24px] border border-[#ead7a0] bg-white p-1.5">
        <img
          alt="Linh vật sóc cầm hạt dẻ"
          className="h-full w-full rounded-[18px] object-cover object-center"
          src={assets.mascotSquirrel}
        />
      </div>
      <div>
        <h2 className="font-display text-2xl font-extrabold text-[var(--vc-primary)]">{title}</h2>
        <div className="mt-2 leading-7 text-[var(--vc-muted)]">{children}</div>
      </div>
    </aside>
  );
}
