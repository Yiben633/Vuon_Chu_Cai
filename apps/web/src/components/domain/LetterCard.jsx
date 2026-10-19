export function LetterCard({ symbol, word, group }) {
  return (
    <article className="target-56 rounded-[24px] border border-[var(--vc-outline)] bg-white p-4 text-center shadow-soft">
      <div className="font-display text-5xl font-black leading-[1.25] text-[var(--vc-primary)] sm:text-6xl">
        {symbol}
      </div>
      <p className="mt-2 font-display text-lg font-extrabold">{word}</p>
      <p className="mt-1 text-sm font-bold text-[var(--vc-muted)]">{group}</p>
    </article>
  );
}
