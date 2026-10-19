import { Link } from "react-router-dom";

const variants = {
  primary: "bg-[var(--vc-primary)] text-white shadow-button hover:bg-[var(--vc-primary-container)]",
  secondary: "bg-white text-[var(--vc-primary)] ring-1 ring-[var(--vc-outline)] hover:bg-[var(--vc-surface-soft)]",
  reward: "bg-[var(--vc-reward)] text-[#2a1700] shadow-[0_4px_0_#92400e] hover:bg-[#fbbf24]"
};

export function Button({ children, to, variant = "primary", className = "", icon: Icon, ...props }) {
  const classes = [
    "target-56 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-base font-extrabold transition active:translate-y-[3px]",
    variants[variant] ?? variants.primary,
    className
  ].join(" ");

  const content = (
    <>
      {Icon ? <Icon aria-hidden="true" className="h-5 w-5 shrink-0" /> : null}
      <span>{children}</span>
    </>
  );

  if (to) {
    return (
      <Link className={classes} to={to} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} type={props.type ?? "button"} {...props}>
      {content}
    </button>
  );
}
