export function Card({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component
      className={`rounded-[var(--vc-card-radius)] border border-[var(--vc-outline)] bg-white p-5 shadow-soft ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
