import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Check, Crown, Gift, History, Leaf, Lock, Medal, ShoppingBag, Sparkles, Sprout, Wallet } from "lucide-react";
import { useRef } from "react";
import { assets } from "../../assets/assetRegistry.js";
import { useMe } from "../../auth/useAuth.js";
import { Button } from "../../components/common/Button.jsx";
import { ErrorState, LoadingState } from "../../components/common/StatusStates.jsx";
import { AcornCounter } from "../../components/domain/AcornCounter.jsx";
import {
  claimChildMission,
  equipChildInventoryItem,
  getChildBadges,
  getChildInventory,
  getChildMissions,
  getChildProgress,
  getChildRewardLedger,
  getChildWallet,
  getRewardsCatalog,
  redeemChildReward
} from "../../api/childDataApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import { ApiClientError } from "../../api/client.js";

const cosmeticIcons = {
  hat: Crown,
  badge: Medal,
  bag: ShoppingBag
};

export function RewardsPage() {
  const me = useMe();
  const childId = me.data?.currentChildId;
  const queryClient = useQueryClient();
  const idempotencyKeys = useRef(new Map());

  const wallet = useQuery({ queryKey: queryKeys.childWallet(childId), queryFn: () => getChildWallet(childId), enabled: Boolean(childId) });
  const progress = useQuery({ queryKey: queryKeys.childProgress(childId), queryFn: () => getChildProgress(childId), enabled: Boolean(childId) });
  const rewards = useQuery({ queryKey: queryKeys.rewards(), queryFn: getRewardsCatalog });
  const inventory = useQuery({ queryKey: queryKeys.childInventory(childId), queryFn: () => getChildInventory(childId), enabled: Boolean(childId) });
  const badges = useQuery({ queryKey: queryKeys.childBadges(childId), queryFn: () => getChildBadges(childId), enabled: Boolean(childId) });
  const missions = useQuery({ queryKey: queryKeys.childMissions(childId), queryFn: () => getChildMissions(childId), enabled: Boolean(childId) });
  const ledger = useQuery({ queryKey: queryKeys.childLedger(childId), queryFn: () => getChildRewardLedger({ childId }), enabled: Boolean(childId) });

  const invalidateRewardData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.childWallet(childId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.childInventory(childId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.childLedger(childId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.childMissions(childId) })
    ]);
  };

  const redeem = useMutation({
    mutationFn: redeemChildReward,
    onSuccess: async (_data, variables) => {
      idempotencyKeys.current.delete(variables.rewardId);
      await invalidateRewardData();
    },
    onError: async () => {
      await invalidateRewardData();
    }
  });

  const equip = useMutation({
    mutationFn: equipChildInventoryItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.childInventory(childId) });
    }
  });

  const claimMission = useMutation({
    mutationFn: claimChildMission,
    onSuccess: async () => {
      await invalidateRewardData();
    },
    onError: async () => {
      await invalidateRewardData();
    }
  });

  if (me.isLoading) return <LoadingState label="Đang mở rương phần thưởng..." />;
  if (!childId) return <ErrorState title="Chưa chọn hồ sơ bé" message="Bé cần vào chế độ học trước khi đổi quà." />;
  if (wallet.isLoading || progress.isLoading || rewards.isLoading || inventory.isLoading) {
    return <LoadingState label="Đang tải ví hạt dẻ và quà ảo..." />;
  }
  const error = wallet.error || progress.error || rewards.error || inventory.error;
  if (error) return <ErrorState title="Không tải được phần thưởng" message={errorMessage(error)} />;

  const walletData = wallet.data ?? { balance: 0, earnedTotal: 0, spentTotal: 0 };
  const inventoryItems = inventory.data?.items ?? [];
  const ownedRewardIds = new Set(inventoryItems.map((item) => item.rewardId));
  const equippedByType = new Map(inventoryItems.filter((item) => item.equipped).map((item) => [item.cosmeticType, item]));
  const mastered = progress.data?.masteredLetters ?? 0;

  const handleRedeem = (reward) => {
    if (ownedRewardIds.has(reward.id) || walletData.balance < reward.cost || redeem.isPending) return;
    if (!window.confirm(`Đổi "${reward.title}" với ${reward.cost} hạt dẻ?`)) return;
    const key = getStableKey(idempotencyKeys.current, reward.id);
    redeem.mutate({ childId, rewardId: reward.id, idempotencyKey: key });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dcfff1_0%,#f7fff9_54%,#d9fff2_100%)] text-[var(--vc-text)]">
      <section className="mx-auto grid max-w-[1180px] gap-8 px-4 py-4 sm:px-6 lg:px-0">
        <Hero wallet={walletData} mastered={mastered} progress={progress.data} equippedByType={equippedByType} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <RewardCatalog
            balance={walletData.balance}
            inventoryItems={inventoryItems}
            isPending={redeem.isPending}
            onEquip={(item) => equip.mutate({ childId, itemId: item.id })}
            onRedeem={handleRedeem}
            rewards={rewards.data?.items ?? []}
          />
          <SidePanel
            badges={badges.data?.items ?? []}
            claimMission={claimMission}
            childId={childId}
            ledger={ledger.data?.items ?? []}
            missions={missions.data?.items ?? []}
          />
        </div>

        {(redeem.isError || equip.isError || claimMission.isError) ? (
          <p className="rounded-[24px] bg-[#fef2f2] p-4 font-bold text-[var(--vc-error)]">
            {errorMessage(redeem.error || equip.error || claimMission.error)}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Hero({ equippedByType, mastered, progress, wallet }) {
  const stage = progress?.growthStage ?? stageFromMastery(mastered);
  return (
    <section className="grid gap-6 rounded-[34px] bg-[#b9f8de] p-6 shadow-soft lg:grid-cols-[1fr_310px] lg:items-center">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-extrabold text-[var(--vc-primary)]">
          <Gift className="h-4 w-4" /> Rương phần thưởng rừng xanh
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-[var(--vc-primary)] md:text-5xl">
          Đổi Quà Ảo Bằng Hạt Dẻ Bé Kiếm Được
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--vc-muted)]">
          Ví hạt dẻ và vật phẩm đều do backend xác nhận. Cấp độ cây chỉ dựa vào số chữ mastered, không phụ thuộc số hạt còn lại.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <AcornCounter value={wallet.balance} />
          <span className="inline-flex min-h-14 items-center rounded-full bg-white px-5 font-display font-extrabold text-[var(--vc-primary)]">
            Đã kiếm {wallet.earnedTotal} • Đã đổi {wallet.spentTotal}
          </span>
          <span className="inline-flex min-h-14 items-center rounded-full bg-white px-5 font-display font-extrabold text-[var(--vc-primary)]">
            {mastered}/29 chữ • {stage.label}
          </span>
        </div>
      </div>
      <div className="rounded-[30px] bg-white/85 p-5 text-center shadow-soft">
        <MascotPortrait equippedByType={equippedByType} />
        <p className="mt-4 font-display text-xl font-extrabold text-[var(--vc-primary)]">Phụ kiện đang trang bị</p>
        <p className="mt-1 text-sm text-[var(--vc-muted)]">
          {equippedByType.size ? [...equippedByType.values()].map((item) => item.title).join(", ") : "Chưa trang bị phụ kiện"}
        </p>
      </div>
    </section>
  );
}

function MascotPortrait({ equippedByType }) {
  const hasHat = equippedByType.has("hat");
  const hasBadge = equippedByType.has("badge");
  const hasBag = equippedByType.has("bag");
  return (
    <div className="relative mx-auto h-44 w-44">
      <img alt="" className="h-full w-full rounded-full object-cover ring-8 ring-[#eafff6]" src={assets.mascotSquirrel} />
      {hasHat ? <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-5xl">👒</span> : null}
      {hasBadge ? <span className="absolute bottom-8 right-2 grid h-12 w-12 place-items-center rounded-full bg-[#f59e0b] text-2xl shadow-soft">🏅</span> : null}
      {hasBag ? <span className="absolute bottom-4 left-0 grid h-12 w-12 place-items-center rounded-2xl bg-[#a8f3d2] text-2xl shadow-soft">👜</span> : null}
    </div>
  );
}

function RewardCatalog({ balance, inventoryItems, isPending, onEquip, onRedeem, rewards }) {
  const ownedByReward = new Map(inventoryItems.map((item) => [item.rewardId, item]));
  return (
    <section className="rounded-[34px] bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e9fff5] px-3 py-1 text-xs font-extrabold text-[var(--vc-primary)]">
            <Sparkles className="h-4 w-4" /> Cửa hàng quà ảo
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--vc-primary)]">Trang Phục & Huy Hiệu</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {rewards.map((reward) => {
          const owned = ownedByReward.get(reward.id);
          const insufficient = balance < reward.cost && !owned;
          return (
            <RewardCard
              insufficient={insufficient}
              isPending={isPending}
              key={reward.id}
              onEquip={onEquip}
              onRedeem={onRedeem}
              owned={owned}
              reward={reward}
            />
          );
        })}
        {!rewards.length ? <p className="rounded-2xl bg-[#e9fff5] p-4 font-bold text-[var(--vc-primary)]">Chưa có quà active từ backend.</p> : null}
      </div>
    </section>
  );
}

function RewardCard({ insufficient, isPending, onEquip, onRedeem, owned, reward }) {
  const Icon = cosmeticIcons[reward.cosmeticType] ?? Gift;
  return (
    <article className={`rounded-[28px] border-2 p-5 shadow-sm ${owned ? "border-[#a8f3d2] bg-[#f2fff8]" : "border-[#e6f4ec] bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-16 w-16 place-items-center rounded-[24px] bg-[#fff4cf] text-[#9a5b00]">
          <Icon className="h-8 w-8" />
        </span>
        <span className="rounded-full bg-[#fff4cf] px-3 py-1 text-sm font-extrabold text-[#9a5b00]">{reward.cost} hạt</span>
      </div>
      <h3 className="mt-4 font-display text-xl font-extrabold">{reward.title}</h3>
      <p className="mt-1 text-sm text-[var(--vc-muted)]">Phụ kiện loại {reward.cosmeticType}. {reward.assetKey ? "Có asset registry." : "Dùng phụ kiện CSS đơn giản."}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {owned ? (
          <>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#c9ffe9] px-4 text-sm font-extrabold text-[var(--vc-primary)]">
              <Check className="h-4 w-4" /> Đã sở hữu
            </span>
            <Button className="px-4 py-2 text-sm" disabled={owned.equipped} onClick={() => onEquip(owned)} variant="secondary">
              {owned.equipped ? "Đang trang bị" : "Trang bị"}
            </Button>
          </>
        ) : (
          <Button className="px-4 py-2 text-sm" disabled={insufficient || isPending} icon={insufficient ? Lock : Gift} onClick={() => onRedeem(reward)}>
            {insufficient ? "Chưa đủ hạt" : "Đổi quà"}
          </Button>
        )}
      </div>
    </article>
  );
}

function SidePanel({ badges, childId, claimMission, ledger, missions }) {
  return (
    <aside className="grid gap-5">
      <section className="rounded-[30px] bg-white p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[var(--vc-primary)]">
          <BadgeCheck className="h-5 w-5" /> Nhiệm vụ hôm nay
        </h2>
        <div className="mt-4 grid gap-3">
          {missions.map((mission) => (
            <article className="rounded-[22px] bg-[#e9fff5] p-4" key={mission.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{mission.title}</p>
                  <p className="text-sm text-[var(--vc-muted)]">{mission.progress.value}/{mission.progress.target} • +{mission.rewardAcorns} hạt</p>
                </div>
                <button
                  className="rounded-full bg-[var(--vc-primary)] px-4 py-2 text-sm font-extrabold text-white disabled:bg-[#cdeede] disabled:text-[var(--vc-muted)]"
                  disabled={!mission.claimable || claimMission.isPending}
                  onClick={() => claimMission.mutate({ childId, missionId: mission.id })}
                  type="button"
                >
                  {mission.claimed ? "Đã nhận" : "Nhận"}
                </button>
              </div>
            </article>
          ))}
          {!missions.length ? <p className="text-sm font-bold text-[var(--vc-muted)]">Chưa có mission active từ backend.</p> : null}
        </div>
      </section>

      <section className="rounded-[30px] bg-white p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[var(--vc-primary)]">
          <Medal className="h-5 w-5" /> Huy hiệu
        </h2>
        <div className="mt-4 grid gap-2">
          {badges.map((badge) => (
            <span className="rounded-2xl bg-[#e9fff5] px-4 py-3 text-sm font-bold text-[var(--vc-primary)]" key={badge.id}>
              {badge.title ?? "Huy hiệu"}
            </span>
          ))}
          {!badges.length ? <p className="text-sm font-bold text-[var(--vc-muted)]">Chưa có huy hiệu được backend cấp.</p> : null}
        </div>
      </section>

      <section className="rounded-[30px] bg-white p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-[var(--vc-primary)]">
          <History className="h-5 w-5" /> Lịch sử ví
        </h2>
        <div className="mt-4 grid gap-2">
          {ledger.slice(0, 8).map((item) => (
            <div className="flex items-center justify-between rounded-2xl bg-[#f8fffb] px-4 py-3 text-sm" key={item.id}>
              <span className="font-bold">{ledgerLabel(item.kind)}</span>
              <span className={`font-display font-extrabold ${item.delta >= 0 ? "text-[var(--vc-primary)]" : "text-[#9a5b00]"}`}>
                {item.delta > 0 ? "+" : ""}{item.delta}
              </span>
            </div>
          ))}
          {!ledger.length ? <p className="text-sm font-bold text-[var(--vc-muted)]">Chưa có giao dịch ví.</p> : null}
        </div>
      </section>
    </aside>
  );
}

function getStableKey(map, rewardId) {
  if (!map.has(rewardId)) {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    map.set(rewardId, `redeem-${rewardId}-${id}`);
  }
  return map.get(rewardId);
}

function stageFromMastery(mastered) {
  if (mastered >= 21) return { label: "Đơm hoa kết trái", range: "21-29" };
  if (mastered >= 11) return { label: "Chồi non", range: "11-20" };
  return { label: "Hạt mầm", range: "0-10" };
}

function ledgerLabel(kind) {
  return {
    welcome: "Chào mừng",
    quiz: "Đố vui",
    story: "Hoàn thành truyện",
    mission: "Nhiệm vụ",
    redeem: "Đổi quà",
    spin: "Vòng quay"
  }[kind] ?? kind;
}

function errorMessage(error) {
  if (error instanceof ApiClientError) return error.message;
  return "Không thể hoàn tất thao tác phần thưởng. Vui lòng thử lại.";
}
