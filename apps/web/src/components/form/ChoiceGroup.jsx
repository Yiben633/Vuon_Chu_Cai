export function ChoiceGroup({ label, options, value, onChange, error, columns = "sm:grid-cols-3", compact = false }) {
  return (
    <fieldset className={`grid ${compact ? "gap-2" : "gap-3"}`}>
      <legend className={`font-display font-extrabold text-[var(--vc-text)] ${compact ? "text-sm" : ""}`}>{label}</legend>
      <div className={`grid ${compact ? "gap-2" : "gap-3"} ${columns}`}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              className={`${compact ? "min-h-12 px-3 py-2 text-sm" : "target-56 px-4 py-3"} rounded-2xl border text-left font-display font-extrabold transition ${
                selected
                  ? "border-[var(--vc-primary)] bg-[var(--vc-mint)] text-[var(--vc-primary)]"
                  : "border-[var(--vc-outline)] bg-white text-[var(--vc-muted)] hover:bg-[var(--vc-surface-soft)]"
              }`}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span className="block">{option.label}</span>
              {option.description ? <span className={`${compact ? "text-xs" : "text-sm"} mt-1 block font-bold opacity-80`}>{option.description}</span> : null}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-sm font-bold text-[var(--vc-error)]">{error.message}</p> : null}
    </fieldset>
  );
}
