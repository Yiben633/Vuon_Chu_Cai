import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <Outlet />
    </main>
  );
}
