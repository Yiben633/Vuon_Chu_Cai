export function IconButton({ label, icon: Icon, className = "", ...props }) {
  return (
    <button
      aria-label={label}
      className={`target-56 inline-flex items-center justify-center rounded-full border border-[var(--vc-outline)] bg-white text-[var(--vc-primary)] transition hover:bg-[var(--vc-mint)] ${className}`}
      type="button"
      title={label}
      {...props}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
