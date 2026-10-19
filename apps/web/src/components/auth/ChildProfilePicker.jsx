import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, CirclePlus, LockKeyhole, Plus, ShieldCheck, Sprout } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assetRegistry.js";
import { symbolPinSchema, symbolPinValues } from "../../auth/authSchemas.js";
import { authErrorMessage, useEnterChildMutation, useFamilyProfiles, useMe } from "../../auth/useAuth.js";
import { Button } from "../common/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../common/StatusStates.jsx";

const symbolOptions = [
  { label: "Táo Đỏ", value: "apple", hint: "Đã chọn", icon: "🍎", tone: "emerald" },
  { label: "Mầm Xanh", value: "leaf", hint: "Đã chọn", icon: "🌱", tone: "emerald" },
  { label: "Sao Nhỏ", value: "star", hint: "Đã chọn", icon: "⭐", tone: "amber" },
  { label: "Chim Non", value: "bird", hint: "Đã chọn", icon: "🐦", tone: "slate" }
];

const pinFields = ["symbol1", "symbol2", "symbol3", "symbol4"];

const mascotByKey = {
  "mascot-squirrel": { label: "Sóc Nâu Tháo Vát", image: assets.mascotSquirrel, badge: "🐿️" },
  "mascot-sprout": { label: "Mầm Tinh Nghịch", image: assets.mascotSprout, badge: "🌱" },
  "mascot-lotus": { label: "Cú Mèo Trí Tuệ", image: assets.mascotOwl, badge: "🦉" },
  "mascot-apple": { label: "Nai Con Hiền Lành", image: assets.mascotDeer, badge: "🦌" }
};

function ageLabel(ageBand) {
  return ageBand ? `Độ tuổi: ${ageBand} tuổi` : "Độ tuổi chưa cập nhật";
}

function mascotFor(child) {
  return mascotByKey[child.mascotKey] ?? mascotByKey["mascot-squirrel"];
}

function selectedSymbol(value) {
  return symbolOptions.find((option) => option.value === value);
}

function slotClasses(option) {
  if (!option) {
    return "border-[#cbd5e1] bg-white/70 text-[#64748b]";
  }
  if (option.tone === "amber") {
    return "border-[#fbbf24] bg-[#fffdf3] text-[#92400e]";
  }
  if (option.tone === "slate") {
    return "border-[#cbd5e1] bg-[#f8fafc] text-[#334155]";
  }
  return "border-[#5ee0ad] bg-[#f3fff9] text-[var(--vc-primary)]";
}

function SymbolSlot({ field, form, index }) {
  const [isOpen, setIsOpen] = useState(false);
  const option = selectedSymbol(form.watch(field));
  const menuItems = [{ label: "Không dùng", value: "", hint: "Trống", icon: "?" }, ...symbolOptions];

  function choose(value) {
    form.setValue(field, value, { shouldDirty: true, shouldValidate: true });
    setIsOpen(false);
  }

  return (
    <label className="group grid gap-2">
      <span className="flex items-center justify-between text-xs font-black text-[#14213d]">
        Biểu tượng {index + 1}
        <span className={option ? "text-[var(--vc-primary)]" : "text-[#64748b]"}>
          {option ? "Chạm đổi" : "Trống"}
        </span>
      </span>
      <span className="relative">
        <button
          aria-expanded={isOpen}
          className={`flex min-h-20 w-full items-center gap-3 rounded-3xl border-2 border-dashed px-4 text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-[var(--vc-mint)] ${slotClasses(option)}`}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-3xl shadow-sm">
            {option?.icon ?? "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-black text-[var(--vc-text)]">
              {option?.label ?? "Chưa cài"}
            </span>
            <span className="block text-sm font-bold">{option?.hint ?? "Không dùng"}</span>
          </span>
          <ChevronDown aria-hidden="true" className={`ml-auto h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen ? (
          <span className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 grid overflow-hidden rounded-3xl border border-[#a7f3d0] bg-white p-2 shadow-[0_18px_45px_rgba(6,95,70,0.16)]">
            {menuItems.map((item) => {
              const isSelected = (option?.value ?? "") === item.value;
              return (
                <button
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition ${
                    isSelected ? "bg-[#d8fff0] text-[var(--vc-primary)]" : "text-[#334155] hover:bg-[#f1fff8]"
                  }`}
                  key={item.value || "empty"}
                  onClick={() => choose(item.value)}
                  type="button"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg shadow-sm">{item.icon}</span>
                  <span>
                    <span className="block">{item.label}</span>
                    <span className="block text-xs font-semibold text-[#64748b]">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function ProfileCard({ child, isPending, onEnter }) {
  const mascot = mascotFor(child);

  return (
    <article className="relative grid w-full max-w-[270px] rounded-[24px] border border-[var(--vc-outline)] bg-white p-4 shadow-soft">
      <div className="rounded-[20px] border border-[#b7f5d3] bg-[#edfff6] p-2">
        <div className="relative overflow-hidden rounded-2xl">
          <img alt={child.nickname} className="aspect-[4/3] w-full object-cover" src={mascot.image} />
          <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white text-base shadow-soft">
            {mascot.badge}
          </span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <h3 className="font-display text-xl font-black text-[#14213d]">{child.nickname}</h3>
        <p className="mt-1 text-sm font-bold text-[#536079]">{ageLabel(child.ageBand)}</p>
      </div>
      <div className="mt-4 rounded-2xl bg-[#edfff6] p-3">
        <div className="flex items-center justify-between gap-3 text-xs font-black text-[#075f49]">
          <span>{mascot.label}</span>
          <span>Sẵn sàng</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#dff7ea]">
          <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#10b981] to-[#fbbf24]" />
        </div>
        <p className="mt-2 text-xs font-bold text-[#536079]">Tiến độ chi tiết sẽ cập nhật sau khi bé vào khu học.</p>
      </div>
      <Button className="mt-4 w-full py-2.5 text-sm" disabled={isPending} onClick={onEnter}>
        Vào khu học
      </Button>
    </article>
  );
}

export function ChildProfilePicker() {
  const me = useMe();
  const profiles = useFamilyProfiles(me.isSuccess);
  const enterChildMutation = useEnterChildMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const welcomeWallet = location.state?.welcomeWallet;
  const form = useForm({
    resolver: zodResolver(symbolPinSchema),
    defaultValues: { symbol1: "", symbol2: "", symbol3: "", symbol4: "" }
  });

  if (me.isLoading) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />;
  if (me.isError) {
    return (
      <EmptyState
        title="Phụ huynh cần đăng nhập"
        message="Danh sách hồ sơ bé chỉ hiển thị sau khi đăng nhập."
      />
    );
  }
  if (profiles.isLoading) return <LoadingState label="Đang tải hồ sơ bé..." />;
  if (profiles.isError) return <ErrorState message={authErrorMessage(profiles.error)} onRetry={() => profiles.refetch()} />;

  const items = profiles.data?.items ?? [];

  async function enterChild(childId) {
    const values = form.getValues();
    const symbolPin = symbolPinValues(values);
    const data = await enterChildMutation.mutateAsync({ childId, ...(symbolPin ? { symbolPin } : {}) });
    navigate("/be/bang-chu-cai", { replace: true, state: { childId: data.currentChildId } });
  }

  return (
    <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#e7fff4] via-[#f4fff9] to-[#fff9db] px-4 py-8 sm:px-7 lg:px-8">
      <div className="pointer-events-none absolute right-10 top-20 text-3xl text-[#facc15]">✨</div>
      <section className="max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#86efac] bg-[#c8ffe6] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--vc-primary)]">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          Khu học của bé
        </span>
        <h1 className="mt-4 font-display text-3xl font-black leading-tight text-[#062f29] sm:text-4xl">
          Chào mừng đến khu vườn!
        </h1>
        <p className="mt-2 font-display text-lg font-black text-[var(--vc-primary)] sm:text-xl">
          Bé nào sẽ vào khu học hôm nay? <span aria-hidden="true">✨</span>
        </p>
      </section>

      {welcomeWallet ? (
        <p className="mt-6 rounded-3xl border border-[#fed7aa] bg-[#fff7ed] p-4 font-bold text-[#7c2d12]">
          Ví chào mừng từ server: {welcomeWallet.balance} hạt dẻ.
        </p>
      ) : null}

      <section className="mt-10 rounded-[28px] border border-[var(--vc-outline)] bg-white/95 p-5 shadow-soft sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-black text-[#14213d]">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#d8fff0] text-lg">🔒</span>
              Mã biểu tượng bảo vệ nếu hồ sơ đã cài
            </h2>
            <p className="mt-2 text-sm font-medium text-[#536079]">
              Bé chạm vào đúng 4 hình vẽ thân quen để mở khóa hồ sơ cá nhân.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e7fff4] px-4 py-2 text-sm font-bold text-[var(--vc-primary)]">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            Sẵn sàng nhập mã
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pinFields.map((field, index) => (
            <SymbolSlot field={field} form={form} index={index} key={field} />
          ))}
        </div>
        {form.formState.errors.root ? (
          <p className="mt-3 text-sm font-bold text-[var(--vc-error)]">{form.formState.errors.root.message}</p>
        ) : null}
      </section>

      {enterChildMutation.isError ? (
        <p className="mt-5 rounded-2xl bg-[#fef2f2] p-3 text-sm font-bold text-[var(--vc-error)]">
          {authErrorMessage(enterChildMutation.error)}
        </p>
      ) : null}

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-black text-[#0f2a2c]">
            <Sprout aria-hidden="true" className="h-6 w-6 text-[#65a30d]" />
            Danh sách hồ sơ các bé ({items.length} bé)
          </h2>
          <p className="rounded-full bg-[#dfffea] px-4 py-2 text-sm font-bold text-[var(--vc-primary)]">
            Nhấn “Vào khu học” để bắt đầu
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Chưa có hồ sơ bé" message="Phụ huynh có thể tạo hồ sơ bé trong khu vực quản lý hồ sơ." />
          </div>
        ) : (
          <div className="mx-auto mt-6 grid max-w-6xl justify-center gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,270px)]">
            {items.map((child) => (
              <ProfileCard
                child={child}
                isPending={enterChildMutation.isPending}
                key={child.id}
                onEnter={() => enterChild(child.id)}
              />
            ))}
            <article className="grid min-h-[300px] w-full max-w-[270px] place-items-center rounded-[24px] border-2 border-dashed border-[#5ee0ad] bg-white/60 p-4 text-center">
              <div>
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#c7ffe2] text-[var(--vc-primary)]">
                  <Plus aria-hidden="true" className="h-10 w-10" />
                </span>
                <h3 className="mt-5 font-display text-xl font-black text-[#14213d]">Thêm hồ sơ bé mới</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm font-medium text-[#536079]">
                  Tạo hồ sơ trong Góc phụ huynh để backend xác minh quyền quản lý.
                </p>
                <Button className="mt-5 px-5 py-2.5 text-sm" icon={CirclePlus} to="/phu-huynh" variant="secondary">
                  Tạo hồ sơ
                </Button>
              </div>
            </article>
          </div>
        )}
      </section>

      <section className="mt-10 flex flex-col gap-5 rounded-[28px] border border-[#a7f3d0] bg-white/70 p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <img
            alt="Bạn Nai Con Hiền Lành"
            className="h-24 w-24 shrink-0 rounded-3xl border border-[#a7f3d0] object-cover shadow-soft"
            src={assets.mascotDeer}
          />
          <div>
            <h2 className="font-display text-lg font-black text-[#14213d]">Bạn Nai Con Hiền Lành đang đợi các bé! 🦌</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[var(--vc-primary)]">
              Mỗi ngày học 15 phút cùng Vườn Chữ Diệu Kỳ sẽ giúp bé nhớ mặt 29 chữ cái, tự tin phát âm đúng chuẩn ngữ âm
              tiếng Việt và gieo mầm tình yêu đọc sách từ sớm.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center justify-center gap-2 rounded-full border border-[#fbbf24] bg-[#fff7d6] px-5 py-3 text-sm font-black text-[#9a3412]">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Hôm nay bé chưa luyện từ mới!
        </span>
      </section>

      <footer className="mt-10 flex flex-wrap items-center gap-3 rounded-full border border-[#86efac] bg-white/65 px-5 py-3 text-sm font-bold text-[#075f49]">
        <span className="inline-flex items-center gap-2">
          <LockKeyhole aria-hidden="true" className="h-4 w-4" />
          100% Không quảng cáo
        </span>
        <span aria-hidden="true">•</span>
        <span>Bảo vệ thị giác chuẩn 20/20</span>
        <span aria-hidden="true">•</span>
        <span>Giọng đọc chuẩn Hà Nội & Sài Gòn</span>
      </footer>
    </div>
  );
}
