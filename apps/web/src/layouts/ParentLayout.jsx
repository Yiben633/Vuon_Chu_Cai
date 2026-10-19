import { BarChart3, BookOpen, Clock3, Inbox, Menu, Mic2, Settings, ShieldCheck, Sprout, UserRound, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { IconButton } from "../components/common/IconButton.jsx";

const parentNav = [
  { label: "Tổng Quan Tiến Trình", to: "/phu-huynh", icon: BarChart3 },
  { label: "Kỹ Năng Nhận Diện", to: "/phu-huynh/nhan-dien", icon: Mic2 },
  { label: "Kế Hoạch & Bài Học", to: "/phu-huynh/bai-hoc", icon: BookOpen },
  { label: "Thời Lượng Sử Dụng", to: "/phu-huynh/thoi-gian", icon: Clock3 },
  { label: "An Toàn & Cài Đặt", to: "/phu-huynh/cai-dat", icon: ShieldCheck },
  { label: "Tài Nguyên", to: "/phu-huynh/tai-nguyen", icon: Sprout },
  { label: "Hộp Thư", to: "/phu-huynh/hop-thu", icon: Inbox },
  { label: "Hồ sơ bé", to: "/phu-huynh/ho-so", icon: UserRound }
];

export function ParentLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ddfff1_0%,#eafff6_55%,#d9ffef_100%)] lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="hidden min-h-screen bg-[#c6f8df] p-5 lg:block">
        <ParentSidebar />
      </aside>

      <header className="sticky top-0 z-30 border-b border-[var(--vc-outline)] bg-white/95 backdrop-blur lg:hidden">
        <div className="container-page flex min-h-20 items-center justify-between">
          <h1 className="font-display text-2xl font-black text-[var(--vc-primary)]">Góc phụ huynh</h1>
          <IconButton icon={open ? X : Menu} label="Mở menu phụ huynh" onClick={() => setOpen(!open)} />
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 bg-[rgba(0,33,23,0.32)] lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-[min(84vw,320px)] bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <ParentSidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <main className="container-page py-6 lg:w-full lg:max-w-[1180px] lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function ParentSidebar({ onNavigate }) {
  return (
    <div className="flex min-h-[calc(100vh-40px)] flex-col gap-6">
      <div className="flex items-center gap-3">
        <img alt="" className="h-11 w-11 rounded-2xl border border-white bg-white object-contain p-1 shadow-soft" src="/assets/images/brand-logo.png" />
        <div>
          <h2 className="font-display text-xl font-black text-[var(--vc-primary)]">Vườn Chữ</h2>
          <p className="text-sm font-bold text-[var(--vc-muted)]">Góc Phụ Huynh</p>
        </div>
      </div>
      <nav aria-label="Điều hướng phụ huynh" className="grid gap-2">
        {parentNav.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `target-56 flex items-center gap-3 rounded-2xl px-4 font-display font-extrabold ${
                isActive ? "bg-white text-[var(--vc-primary)] shadow-soft" : "text-[var(--vc-text)] hover:bg-white/55"
              }`
            }
            end={item.to === "/phu-huynh"}
            key={item.to}
            onClick={onNavigate}
            to={item.to}
          >
            <item.icon aria-hidden="true" className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-3xl bg-white/80 p-4 shadow-soft">
        <p className="font-display text-sm font-extrabold text-[var(--vc-primary)]">Cài Đặt An Toàn</p>
        <p className="mt-1 text-xs leading-5 text-[var(--vc-muted)]">Đã khóa bằng mã PIN phụ huynh</p>
      </div>
    </div>
  );
}
