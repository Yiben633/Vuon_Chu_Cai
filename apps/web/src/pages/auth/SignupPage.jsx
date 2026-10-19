import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CheckCircle2, Gift, Leaf, LockKeyhole, Mail, MapPin, Mic2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assetRegistry.js";
import { signupFormSchema, signupToApiPayload } from "../../auth/authSchemas.js";
import { authErrorMessage, useRegisterMutation } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { ChoiceGroup } from "../../components/form/ChoiceGroup.jsx";
import { TextField } from "../../components/form/TextField.jsx";

const ageOptions = [
  { label: "3 - 4 Tuổi", value: "3-4", description: "Nhận mặt chữ & nghe âm" },
  { label: "4 - 5 Tuổi", value: "4-5", description: "Luyện âm vần & nét vẽ" },
  { label: "5 - 6 Tuổi", value: "5-6", description: "Tiến tiểu học tự tin" }
];

const dialectOptions = [
  { label: "Giọng Bắc", value: "north" },
  { label: "Giọng Trung", value: "central" },
  { label: "Giọng Nam", value: "south" }
];

const mascotOptions = [
  { label: "Mầm Tinh Nghịch", value: "mascot-sprout", description: "Thích ca hát", image: assets.mascotSprout },
  { label: "Sóc Nâu Tháo Vát", value: "mascot-squirrel", description: "Thích đố vui", image: assets.mascotSquirrel },
  { label: "Cú Mèo Trí Tuệ", value: "mascot-lotus", description: "Nhớ dai siêu đỉnh", image: assets.mascotOwl },
  { label: "Nai Con Hiền Lành", value: "mascot-apple", description: "Lắng nghe khéo", image: assets.mascotDeer }
];

const guardianBenefits = [
  { icon: Gift, title: "Nhận 50 Hạt Dẻ Khởi Đầu", text: "Phần quà một lần cho hồ sơ bé đầu tiên, được backend ghi vào ví và sổ giao dịch." },
  { icon: BookOpen, title: "Khám Phá 29 Chữ Cái Tiếng Việt", text: "Học nhận diện chữ, ghép vần, đọc truyện và chơi đố vui theo nội dung đang có trong khu vườn." },
  { icon: Mic2, title: "Thu Âm Xem Lại Trên Thiết Bị", text: "Bé có thể thu và nghe lại cục bộ khi trình duyệt cho phép; app không tự gửi giọng nói ra ngoài." },
  { icon: ShieldCheck, title: "Ba Mẹ Kiểm Soát Thời Gian Học", text: "Giới hạn hằng ngày, nhắc nghỉ và báo cáo tiến độ được lưu qua backend theo từng hồ sơ bé." }
];

const stats = [
  { value: "29 chữ", label: "Bảng chữ cái tiếng Việt", icon: BookOpen },
  { value: "6 thanh", label: "Ngang, sắc, huyền, hỏi, ngã, nặng", icon: Mic2 },
  { value: "PIN", label: "Bảo vệ khu vực phụ huynh", icon: LockKeyhole },
  { value: "Không quảng cáo", label: "Trải nghiệm học tập tập trung", icon: ShieldCheck }
];

export function SignupPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const form = useForm({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      parentDisplayName: "",
      email: "",
      password: "",
      pin: "",
      childNickname: "",
      ageBand: "4-5",
      dialect: "north",
      mascotKey: "mascot-squirrel",
      termsAccepted: false
    }
  });

  async function onSubmit(values) {
    const data = await registerMutation.mutateAsync(signupToApiPayload(values));
    navigate("/be", { replace: true, state: { welcomeWallet: data.wallet } });
  }

  return (
    <section className="auth-screen container-page py-14">
      <div className="mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--vc-mint)] px-5 py-2 font-display text-sm font-extrabold text-[var(--vc-primary)]">
          <Sparkles aria-hidden="true" className="h-4 w-4" /> Hành trình gieo tình yêu tiếng Việt mầm non
        </span>
        <h1 className="mt-5 font-display text-4xl font-black leading-tight text-[var(--vc-primary)] md:text-5xl">
          Gia Nhập Khu Vườn Diệu Kỳ
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-8 text-[var(--vc-muted)]">
          Cùng con nuôi dưỡng tình yêu tiếng Việt qua 29 chữ cái, ghép vần, truyện và trò chơi phù hợp lứa tuổi mầm non.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.35fr] lg:items-start">
        <aside className="space-y-8">
          <div className="auth-card p-8">
            <span className="inline-flex rounded-full bg-[#ffe3bd] px-4 py-2 text-sm font-black text-[#6b3a00]">Món quà chào đón bé</span>
            <h2 className="mt-5 font-display text-3xl font-black leading-tight text-[var(--vc-primary)]">
              Chào mừng gia đình nhỏ đến với Khu Vườn!
            </h2>
            <p className="mt-4 leading-7 text-[var(--vc-muted)]">
              Tạo tài khoản phụ huynh và hồ sơ bé để bắt đầu học chữ, ghép vần, đọc truyện và theo dõi tiến độ.
            </p>
            <div className="mt-7 overflow-hidden rounded-[28px] bg-[var(--vc-cream)]">
              <img alt="Sóc nhỏ trong khu vườn chữ" className="h-56 w-full object-cover" src={assets.forest} />
              <div className="m-4 -mt-8 relative rounded-full bg-white px-5 py-3 text-sm font-black text-[var(--vc-primary)] shadow-soft">
                Sóc Nhí & Cây Mầm đang chờ bé khám phá!
              </div>
            </div>
            <h3 className="mt-7 font-display text-xl font-black">Đặc quyền gia viên dành riêng cho bé:</h3>
            <div className="mt-4 grid gap-4">
              {guardianBenefits.map((item) => (
                <div className="rounded-[28px] bg-[var(--vc-mint)] p-5" key={item.title}>
                  <div className="flex gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d7fff0] text-[var(--vc-primary)]">
                      <item.icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-display font-black text-[var(--vc-primary)]">{item.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-[var(--vc-muted)]">{item.text}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-strip flex items-center gap-4 p-6">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--vc-primary)] text-white">
              <ShieldCheck aria-hidden="true" className="h-7 w-7" />
            </span>
            <p className="leading-7 text-[var(--vc-text)]">
              <strong>Dữ liệu học tập được tách theo từng hồ sơ bé.</strong> Khu vực phụ huynh cần PIN; ứng dụng không hiển thị quảng cáo và có cài đặt nhắc nghỉ.
            </p>
          </div>
        </aside>

        <form className="auth-card p-7 sm:p-9" onSubmit={form.handleSubmit(onSubmit)}>
          <section>
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--vc-primary)] font-display font-black text-white">1</span>
              <span>
                <h2 className="font-display text-2xl font-black text-[var(--vc-primary)]">Thông Tin Ba Mẹ (Bảo Mật & Đồng Hành)</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--vc-muted)]">Dành cho phụ huynh nhận báo cáo học tập và quản lý thời lượng.</p>
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <TextField compact error={form.formState.errors.parentDisplayName} inputClassName="bg-[var(--vc-mint)]" label="Họ và tên Phụ huynh" registration={form.register("parentDisplayName")} />
              <TextField compact autoComplete="email" error={form.formState.errors.email} inputClassName="bg-[var(--vc-mint)]" label="Email phụ huynh" registration={form.register("email")} type="email" />
              <TextField compact autoComplete="new-password" error={form.formState.errors.password} inputClassName="bg-[var(--vc-mint)]" label="Mật khẩu đăng nhập" registration={form.register("password")} type="password" />
              <TextField compact autoComplete="new-password" error={form.formState.errors.pin} inputClassName="bg-[var(--vc-mint)]" inputMode="numeric" label="Mã PIN Góc Phụ Huynh" maxLength={4} registration={form.register("pin")} type="password" />
            </div>
          </section>

          <div className="my-8 h-px bg-[#b9f1dd]" />

          <section>
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] font-display font-black text-white">2</span>
              <span>
                <h2 className="font-display text-2xl font-black text-[var(--vc-primary)]">Hồ Sơ Của Bé Yêu & Lựa Chọn Học</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--vc-muted)]">Giúp khu vườn điều chỉnh độ khó và nội dung phù hợp nhất cho con.</p>
              </span>
            </div>

            <div className="mt-6 grid gap-5">
              <TextField compact error={form.formState.errors.childNickname} inputClassName="bg-[var(--vc-mint)]" label="Tên gọi thân mật ở nhà của bé" registration={form.register("childNickname")} />
              <Controller
                control={form.control}
                name="ageBand"
                render={({ field, fieldState }) => (
                  <ChoiceGroup compact error={fieldState.error} label="Độ tuổi hiện tại của con" onChange={field.onChange} options={ageOptions} value={field.value} />
                )}
              />
              <Controller
                control={form.control}
                name="dialect"
                render={({ field, fieldState }) => (
                  <ChoiceGroup compact error={fieldState.error} label="Chất giọng phát âm bé muốn nghe" onChange={field.onChange} options={dialectOptions} value={field.value} />
                )}
              />

              <Controller
                control={form.control}
                name="mascotKey"
                render={({ field, fieldState }) => (
                  <fieldset className="grid gap-3">
                    <legend className="font-display font-black text-[var(--vc-primary)]">
                      Bé hãy chọn "Hạt Mầm Hộ Vệ" đồng hành đầu tiên:
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-4">
                      {mascotOptions.map((option) => {
                        const selected = field.value === option.value;
                        return (
                          <button
                            className={`relative min-h-44 rounded-[28px] border p-3 text-center transition ${
                              selected ? "border-[var(--vc-primary)] bg-[var(--vc-mint)]" : "border-[#b9f1dd] bg-[#d7fff0] hover:bg-[var(--vc-mint)]"
                            }`}
                            key={option.value}
                            onClick={() => field.onChange(option.value)}
                            type="button"
                          >
                            {selected ? <CheckCircle2 aria-hidden="true" className="absolute right-3 top-3 h-5 w-5 text-[var(--vc-primary)]" /> : null}
                            <img alt="" className="mx-auto h-20 w-20 rounded-full bg-white object-cover p-1 shadow-soft" src={option.image} />
                            <span className="mt-3 block font-display text-sm font-black text-[var(--vc-primary)]">{option.label}</span>
                            <span className="mt-1 block text-xs font-bold text-[var(--vc-muted)]">{option.description}</span>
                          </button>
                        );
                      })}
                    </div>
                    {fieldState.error ? <p className="text-sm font-bold text-[var(--vc-error)]">{fieldState.error.message}</p> : null}
                  </fieldset>
                )}
              />
            </div>
          </section>

          <label className="mt-7 flex items-start gap-3 rounded-[28px] bg-[var(--vc-mint)] p-5">
            <input className="mt-1 h-5 w-5 accent-[var(--vc-primary)]" type="checkbox" {...form.register("termsAccepted")} />
            <span>
              <span className="block font-display font-extrabold">Ba mẹ đồng ý với Điều khoản Vườn Chữ và cam kết cho bé học trong khoảng thời gian khuyến nghị.</span>
              {form.formState.errors.termsAccepted ? (
                <span className="mt-2 block text-sm font-bold text-[var(--vc-error)]">{form.formState.errors.termsAccepted.message}</span>
              ) : null}
            </span>
          </label>

          {registerMutation.isError ? (
            <p className="mt-5 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">
              {authErrorMessage(registerMutation.error)}
            </p>
          ) : null}

          <Button className="mt-7 w-full !min-h-14 gap-3 py-3 text-base" disabled={registerMutation.isPending} icon={Leaf} type="submit">
            {registerMutation.isPending ? "Đang gieo hạt..." : "Gieo Hạt Mầm - Tạo Tài Khoản Cho Bé"}
          </Button>

          <p className="mt-6 text-center text-[var(--vc-muted)]">
            Gia đình đã có khu vườn riêng?{" "}
            <Link className="font-black text-[var(--vc-primary)]" to="/dang-nhap">
              Đăng nhập vào Vườn ngay
            </Link>
          </p>
        </form>
      </div>

      <div className="mx-auto mt-20 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div className="auth-mini-card p-6 text-center" key={item.value}>
            <item.icon aria-hidden="true" className="mx-auto h-8 w-8 text-[var(--vc-primary)]" />
            <p className="mt-3 font-display text-xl font-black text-[var(--vc-primary)]">{item.value}</p>
            <p className="mt-1 text-sm text-[var(--vc-muted)]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
