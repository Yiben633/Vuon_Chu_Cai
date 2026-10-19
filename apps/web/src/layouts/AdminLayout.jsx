import { FilePenLine, Gauge, LibraryBig, Upload } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const adminNav = [
  { label: "Tổng quan", to: "/admin", icon: Gauge },
  { label: "Học liệu", to: "/admin/hoc-lieu", icon: LibraryBig },
  { label: "Biên tập", to: "/admin/bien-tap", icon: FilePenLine },
  { label: "Tải lên", to: "/admin/tai-len", icon: Upload }
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f8fffb] text-[var(--vc-text)]">
      <header className="border-b border-[var(--vc-outline)] bg-white">
        <div className="container-page flex min-h-20 flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[var(--vc-primary)]">Quản trị nội dung</p>
            <h1 className="font-display text-2xl font-black">Kho học liệu</h1>
          </div>
          <nav aria-label="Điều hướng quản trị" className="flex gap-2 overflow-x-auto pb-1">
            {adminNav.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `target-56 inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 font-display font-extrabold ${
                    isActive ? "bg-[var(--vc-primary)] text-white" : "bg-[var(--vc-surface-soft)] text-[var(--vc-muted)]"
                  }`
                }
                end={item.to === "/admin"}
                key={item.to}
                to={item.to}
              >
                <item.icon aria-hidden="true" className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container-page py-6">
        <Outlet />
      </main>
    </div>
  );
}
