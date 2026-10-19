import { BookOpen, Flower2, Gamepad2, Home, LockKeyhole, Puzzle, Sprout } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { getChildWallet } from "../api/childDataApi.js";
import { queryKeys } from "../api/queryKeys.js";
import { useAudioController } from "../audio/audioContext.js";
import { assets } from "../assets/assetRegistry.js";
import { useMe } from "../auth/useAuth.js";
import { AcornCounter } from "../components/domain/AcornCounter.jsx";

const childNav = [
  { label: "Vườn", fullLabel: "Khu Vườn Bảng Chữ Cái", to: "/be/bang-chu-cai", icon: Sprout },
  { label: "Ghép vần", fullLabel: "Rừng Ghép Vần", to: "/be/ghep-van", icon: Puzzle },
  { label: "Truyện", fullLabel: "Đầm Kể Chuyện", to: "/be/truyen", icon: BookOpen },
  { label: "Đố vui", fullLabel: "Thử Thách Đố Vui", to: "/be/do-vui", icon: Gamepad2 },
  { label: "Thưởng", fullLabel: "Phần Thưởng", to: "/be/phan-thuong", icon: Flower2 }
];

export function ChildLayout() {
  const me = useMe();
  const childId = me.data?.currentChildId;
  const location = useLocation();
  const { stopNarration } = useAudioController();
  const wallet = useQuery({
    queryKey: queryKeys.childWallet(childId),
    queryFn: () => getChildWallet(childId),
    enabled: Boolean(childId)
  });

  useEffect(() => {
    stopNarration();
  }, [childId, location.pathname, stopNarration]);

  return (
    <div className="page-shell pb-24">
      <header className="sticky top-0 z-40 border-b border-[#c8efdc] bg-white/95 backdrop-blur">
        <div className="container-page flex min-h-16 items-center justify-between gap-4 py-2">
          <Link className="flex min-w-0 items-center gap-3" to="/be">
            <img
              alt="Vườn Chữ Diệu Kỳ"
              className="h-11 w-11 shrink-0 rounded-xl border border-[#a7f3d0] bg-[#fff8dc] object-contain p-1 shadow-soft"
              src={assets.logo}
            />
            <span className="hidden min-w-0 sm:block">
              <span className="block font-display text-xl font-black leading-none text-[var(--vc-primary)]">
                Vườn Chữ <span className="text-[#f59e0b]">Diệu Kỳ</span>
              </span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--vc-primary)]">
                Học chữ tiếng Việt vui nhộn
              </span>
            </span>
          </Link>

          <nav aria-label="Khu học" className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-2">
            {childNav.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-full px-3 py-2.5 font-display text-xs font-black transition xl:px-4 xl:text-sm ${
                    isActive
                      ? "bg-[var(--vc-primary)] px-4 py-3.5 text-white shadow-button xl:px-5 xl:py-4"
                      : "text-[#14213d] hover:bg-[#f1fff8]"
                  }`
                }
                key={item.to}
                to={item.to}
              >
                {item.fullLabel}
              </NavLink>
            ))}
            <NavLink
              className="rounded-full px-4 py-2.5 font-display text-sm font-black text-[#14213d] transition hover:bg-[#f1fff8]"
              to="/phu-huynh"
            >
              Góc Phụ Huynh
            </NavLink>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <AcornCounter value={wallet.data?.balance ?? null} />
            <Link
              className="target-56 hidden items-center justify-center gap-2 rounded-full bg-[var(--vc-primary)] px-5 py-3 font-display text-sm font-black text-white shadow-button transition active:translate-y-[3px] md:inline-flex"
              to="/phu-huynh"
            >
              <LockKeyhole aria-hidden="true" className="h-4 w-4" />
              Chế độ Ba Mẹ
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page py-6">
        <Outlet />
      </main>

      <nav
        aria-label="Điều hướng học tập"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--vc-outline)] bg-white/95 px-2 py-2 backdrop-blur md:left-1/2 md:w-min md:-translate-x-1/2 md:rounded-t-[28px] md:border md:px-4 lg:hidden"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          {childNav.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `target-56 flex flex-col items-center justify-center rounded-2xl px-2 text-center text-[11px] font-extrabold ${
                  isActive ? "bg-[var(--vc-mint)] text-[var(--vc-primary)]" : "text-[var(--vc-muted)]"
                }`
              }
              key={item.to}
              to={item.to}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <Link className="sr-only" to="/be">
          <Home aria-hidden="true" />
          Trang bé
        </Link>
      </nav>
    </div>
  );
}
