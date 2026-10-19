import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, KeyRound, Lock, Mail, ShieldCheck, Users, Volume2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assetRegistry.js";
import { loginFormSchema } from "../../auth/authSchemas.js";
import { authErrorMessage, useLoginMutation } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { TextField } from "../../components/form/TextField.jsx";

const loginBenefits = [
  { icon: Volume2, title: "Phát âm chuẩn Bộ GD", text: "Giọng đọc Bắc - Nam dịu êm." },
  { icon: BookOpen, title: "Học qua trò chơi", text: "Hái nấm ghép vần, tưới cây nhận quà." },
  { icon: ShieldCheck, title: "Báo cáo hằng tuần", text: "Gửi tiến độ trực tiếp cho phụ huynh." }
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const form = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "", rememberMe: false }
  });

  async function onSubmit(values) {
    await loginMutation.mutateAsync(values);
    navigate(location.state?.from?.pathname ?? "/be", { replace: true });
  }

  return (
    <section className="auth-screen container-page py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white p-3 shadow-soft">
          <img alt="Vườn Chữ Diệu Kỳ" className="h-full w-full rounded-full object-contain" src={assets.logo} />
          <span className="absolute -bottom-2 rounded-full bg-[#fbbf24] px-4 py-1 font-display text-sm font-black text-[var(--vc-primary)]">v2.4</span>
        </div>
        <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--vc-mint)] px-5 py-2 font-display text-sm font-extrabold text-[var(--vc-primary)]">
          <Lock aria-hidden="true" className="h-4 w-4" /> Cánh Cổng Thần Tiên Mở Rộng
        </span>
        <h1 className="mt-5 font-display text-4xl font-black leading-tight text-[var(--vc-primary)] md:text-5xl">
          Mở Cánh Cổng Rừng Xanh
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg font-semibold leading-8 text-[var(--vc-muted)]">
          Chào mừng bạn nhỏ và ba mẹ trở lại với thế giới rộn rã thanh âm chữ cái Việt.
        </p>
      </div>

      <div className="auth-card mx-auto mt-12 w-full max-w-2xl p-8 sm:p-10">
        <div className="grid rounded-full bg-[var(--vc-mint)] p-2 sm:grid-cols-2">
          <button className="target-56 rounded-full bg-[var(--vc-primary)] font-display font-black text-white shadow-button" type="button">
            <Users aria-hidden="true" className="mr-2 inline h-5 w-5" /> Ba Mẹ Đăng Nhập
          </button>
          <button
            aria-disabled="true"
            className="target-56 rounded-full font-display font-black text-[var(--vc-muted)]"
            title="Bé tự vào học sẽ được nối với hồ sơ sau khi phụ huynh đăng nhập."
            type="button"
          >
            Bé Tự Vào Học
          </button>
        </div>

        <div className="mt-9 flex items-end justify-between gap-4 border-b border-[#b9f1dd] pb-3">
          <h2 className="font-display text-sm font-black uppercase tracking-wide text-[var(--vc-muted)]">
            Thông tin bảo mật phụ huynh
          </h2>
          <span className="hidden items-center gap-2 text-sm font-black text-[#0b78aa] sm:inline-flex">
            QR đăng nhập nhanh chưa bật
          </span>
        </div>

        <form className="mt-6 grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute left-5 top-[43px] z-10 h-5 w-5 text-[var(--vc-muted)]" />
            <TextField
              autoComplete="email"
              compact
              error={form.formState.errors.email}
              inputClassName="pl-12" label="Email phụ huynh"
              registration={form.register("email")}
              type="email"
            />
          </div>
          <div className="relative">
            <KeyRound aria-hidden="true" className="pointer-events-none absolute left-5 top-[43px] z-10 h-5 w-5 text-[var(--vc-muted)]" />
            <TextField
              autoComplete="current-password"
              compact
              error={form.formState.errors.password}
              inputClassName="pl-12" label="Mật khẩu bảo vệ"
              registration={form.register("password")}
              type="password"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl text-sm font-bold text-[var(--vc-muted)]">
            <input className="h-5 w-5 accent-[var(--vc-primary)]" type="checkbox" {...form.register("rememberMe")} />
            Ghi nhớ hạt mầm trên máy này
          </label>
            <span className="text-sm font-black text-[var(--vc-primary)]">Quên mật khẩu / PIN?</span>
          </div>

          {loginMutation.isError ? (
            <p className="rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">
              {authErrorMessage(loginMutation.error)}
            </p>
          ) : null}
          <Button disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? "Đang mở cổng..." : "Bước Vào Khu Vườn"}
          </Button>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm font-bold text-[var(--vc-muted)]">
            <span className="h-px bg-[#b9f1dd]" />
            <span>liên kết nhanh chưa bật</span>
            <span className="h-px bg-[#b9f1dd]" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="target-56 rounded-full bg-[var(--vc-mint)] font-display font-black text-[var(--vc-muted)] opacity-70" disabled type="button">
              Google
            </button>
            <button className="target-56 rounded-full bg-[var(--vc-mint)] font-display font-black text-[var(--vc-muted)] opacity-70" disabled type="button">
              Zalo Đăng Nhập
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-[#b9f1dd] pt-6">
          <p className="flex gap-3 text-[var(--vc-muted)]">
            <ShieldCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--vc-primary)]" />
            <span>Mã PIN phụ huynh bảo vệ khu vực thanh toán và báo cáo học tập. Trẻ em được học trong môi trường an toàn.</span>
          </p>
        </div>
      </div>

      <div className="auth-strip mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-3 px-6 py-5 text-center text-lg font-bold text-[var(--vc-muted)]">
        <span>Chưa có hạt mầm tài khoản cho bé?</span>
        <Link className="font-black text-[var(--vc-primary)]" to="/dang-ky">
          Đăng ký nhận túi hạt dẻ thần kỳ
        </Link>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
        {loginBenefits.map((item) => (
          <div className="auth-mini-card flex items-center gap-4 p-6" key={item.title}>
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--vc-mint)] text-[var(--vc-primary)]">
              <item.icon aria-hidden="true" className="h-7 w-7" />
            </span>
            <span>
              <span className="block font-display text-lg font-black text-[var(--vc-primary)]">{item.title}</span>
              <span className="text-[var(--vc-muted)]">{item.text}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
