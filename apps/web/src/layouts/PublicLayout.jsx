import { Menu, ShieldCheck, Volume2, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { assets } from "../assets/assetRegistry.js";
import { Button } from "../components/common/Button.jsx";
import { IconButton } from "../components/common/IconButton.jsx";
import { publicNav } from "../content/landingContent.js";

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <header className="sticky top-0 z-30 border-b border-[#d6f5e8] bg-[rgba(231,255,243,0.94)] backdrop-blur">
        <div className="container-page flex min-h-[76px] items-center justify-between gap-3 py-2">
          <Link className="flex min-w-0 items-center gap-3 sm:min-w-[260px] lg:min-w-[300px]" to="/">
            <img alt="Vườn Chữ Diệu Kỳ" className="h-12 w-12 shrink-0 rounded-full bg-[#fff8dc] object-contain p-1 shadow-soft" src={assets.logo} />
            <span className="hidden min-w-0 sm:block">
              <span className="block whitespace-nowrap font-display text-xl font-black leading-6 text-[var(--vc-primary)] lg:text-2xl">
                Vườn Chữ Diệu Kỳ
              </span>
              <span className="hidden whitespace-nowrap text-sm font-semibold text-[var(--vc-muted)] xl:block">Bé vui học Tiếng Việt cùng muôn loài</span>
            </span>
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden items-center gap-2 xl:flex">
            {publicNav.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-4 py-3 text-center font-display text-sm font-extrabold leading-tight ${
                    isActive ? "bg-[var(--vc-mint)] text-[var(--vc-primary)]" : "text-[var(--vc-muted)] hover:bg-white"
                  }`
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <Button className="!min-h-12 whitespace-nowrap px-5 py-2 text-sm" to="/dang-nhap" variant="secondary">Đăng Nhập</Button>
            <Button className="!min-h-12 whitespace-nowrap px-5 py-2 text-sm" to="/dang-ky">Đăng Ký Tài Khoản Cho Bé</Button>
            <img alt="" className="h-12 w-12 rounded-full border-2 border-[var(--vc-mint)] object-cover shadow-soft" src={assets.mascotSquirrel} />
          </div>

          <IconButton className="md:hidden" icon={menuOpen ? X : Menu} label="Mở điều hướng" onClick={() => setMenuOpen(!menuOpen)} />
        </div>

        {menuOpen ? (
          <div className="container-page grid gap-2 pb-4 md:hidden">
            {[...publicNav, { label: "Đăng nhập", to: "/dang-nhap" }, { label: "Bắt đầu", to: "/dang-ky" }].map((item) => (
              <NavLink
                className="target-56 flex items-center rounded-2xl bg-white px-4 font-display font-extrabold text-[var(--vc-primary)]"
                key={item.to}
                onClick={() => setMenuOpen(false)}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </header>

      <main className="auth-main" id="main-content">
        <Outlet />
      </main>

      <footer className="border-t border-[#b9f1dd] bg-[#c8ffe8]">
        <div className="container-page grid gap-6 py-10 text-sm text-[var(--vc-muted)] lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div>
            <p className="font-display text-2xl font-black text-[var(--vc-primary)]">Vườn Chữ Diệu Kỳ 🌿</p>
            <p className="mt-3 max-w-md leading-6">Nơi mỗi mầm chữ nảy chồi thành tình yêu ngôn ngữ, đồng hành cùng bước chân khám phá thiên nhiên của bé.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--vc-mint)] px-5 py-2 font-bold text-[var(--vc-primary)]">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" /> An Toàn Cho Trẻ Em
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--vc-mint)] px-5 py-2 font-bold text-[var(--vc-primary)]">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" /> 100% Không Quảng Cáo
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--vc-mint)] px-5 py-2 font-bold text-[var(--vc-primary)]">
              <Volume2 aria-hidden="true" className="h-4 w-4" /> Âm Thanh Trực Quan
            </span>
          </div>
          <p className="text-left font-semibold text-[var(--vc-text)] lg:text-right">© 2025 Vườn Chữ Diệu Kỳ. Tận tâm vì nụ cười trẻ thơ.</p>
        </div>
      </footer>
    </div>
  );
}
