import mongoose from "mongoose";
import { errorCodes } from "@vuon-chu/contracts";
import { ApiError, forbidden, notFound, parentGateRequired } from "../../lib/apiError.js";
import { modelRegistry } from "../../models/index.js";
import { isParentGateOpen } from "../auth/sessionService.js";
import { canonicalHash, grantRewardOnce, walletDto } from "./learningService.js";
import { dayKeyVN } from "./time.js";

const MISSION_REWARD_FALLBACK = 10;

export async function assertChildAccess(req, childId) {
  if (!req.currentUser) throw new ApiError(401, errorCodes.UNAUTHENTICATED, "Vui long dang nhap.");
  if (req.session.mode === "child") {
    if (String(req.session.currentChildId) !== String(childId)) throw forbidden();
    const child = await modelRegistry.ChildProfile.findOne({ _id: childId, deletedAt: null }).lean();
    if (!child) throw notFound("Khong tim thay ho so be.");
    return child;
  }
  if (!isParentGateOpen(req)) throw parentGateRequired();
  const child = await modelRegistry.ChildProfile.findOne({
    _id: childId,
    parentId: req.currentUser._id,
    deletedAt: null
  }).lean();
  if (!child) throw notFound("Khong tim thay ho so be.");
  return child;
}

export function assertCurrentChild(req, childId) {
  if (String(req.session.currentChildId) !== String(childId)) throw forbidden();
}

export async function getWallet(childId) {
  const wallet = await modelRegistry.Wallet.findOne({ childId }).lean();
  return walletDto(wallet);
}

export async function getLedger(childId, query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    modelRegistry.RewardLedger.find({ childId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    modelRegistry.RewardLedger.countDocuments({ childId })
  ]);
  return {
    page,
    limit,
    total,
    items: items.map((item) => ({
      id: String(item._id),
      kind: item.kind,
      delta: item.delta,
      eventKey: item.eventKey,
      dayKey: item.dayKey,
      createdAt: item.createdAt
    }))
  };
}

export async function listRewards() {
  const items = await modelRegistry.RewardCatalog.find({ active: true }).sort({ cost: 1, key: 1 }).lean();
  return {
    items: items.map((item) => ({
      id: String(item._id),
      key: item.key,
      title: item.title,
      cost: item.cost,
      cosmeticType: item.cosmeticType,
      assetKey: item.assetKey,
      version: item.version
    }))
  };
}

export async function getInventory(childId) {
  const items = await modelRegistry.Inventory.find({ childId }).populate("rewardId").sort({ acquiredAt: -1 }).lean();
  return {
    items: items.map((item) => ({
      id: String(item._id),
      rewardId: String(item.rewardId?._id ?? item.rewardId),
      title: item.rewardId?.title ?? null,
      cosmeticType: item.cosmeticType,
      equipped: item.equipped,
      acquiredAt: item.acquiredAt
    }))
  };
}

export async function redeemReward(childId, input) {
  const reward = await modelRegistry.RewardCatalog.findOne({ _id: input.rewardId, active: true }).lean();
  if (!reward) throw notFound("Khong tim thay phan thuong.");
  const requestHash = canonicalHash(input);
  const eventKey = `redeem:${reward._id}:${input.idempotencyKey}`;
  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      const existingLedger = await modelRegistry.RewardLedger.findOne({ childId, eventKey }).session(dbSession).lean();
      if (existingLedger) {
        if (existingLedger.requestHash !== requestHash) {
          throw new ApiError(409, errorCodes.IDEMPOTENCY_CONFLICT, "Idempotency key da duoc dung voi payload khac.");
        }
        const wallet = await modelRegistry.Wallet.findOne({ childId }).session(dbSession).lean();
        result = { wallet: walletDto(wallet), duplicate: true };
        return;
      }

      const owned = await modelRegistry.Inventory.exists({ childId, rewardId: reward._id }).session(dbSession);
      if (owned) throw new ApiError(409, errorCodes.REWARD_ALREADY_OWNED, "Be da co phan thuong nay.");

      const walletUpdate = await modelRegistry.Wallet.updateOne(
        { childId, balance: { $gte: reward.cost } },
        { $inc: { balance: -reward.cost, spentTotal: reward.cost } },
        { session: dbSession }
      );
      if (walletUpdate.modifiedCount !== 1) {
        throw new ApiError(409, errorCodes.INSUFFICIENT_ACORNS, "Khong du hat de doi.");
      }

      await modelRegistry.RewardLedger.create(
        [
          {
            childId,
            eventKey,
            kind: "redeem",
            delta: -reward.cost,
            rewardId: reward._id,
            sourceId: reward._id,
            sourceVersion: reward.version,
            requestHash
          }
        ],
        { session: dbSession }
      );
      await modelRegistry.Inventory.create(
        [
          {
            childId,
            rewardId: reward._id,
            cosmeticType: reward.cosmeticType
          }
        ],
        { session: dbSession }
      );
      const wallet = await modelRegistry.Wallet.findOne({ childId }).session(dbSession).lean();
      result = { wallet: walletDto(wallet), rewardId: String(reward._id), duplicate: false };
    });
    return result;
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, errorCodes.REWARD_ALREADY_OWNED, "Be da co phan thuong nay.");
    }
    throw error;
  } finally {
    await dbSession.endSession();
  }
}

export async function equipInventoryItem(childId, itemId) {
  const item = await modelRegistry.Inventory.findOne({ _id: itemId, childId });
  if (!item) throw notFound("Khong tim thay vat pham.");
  await modelRegistry.Inventory.updateMany(
    { childId, cosmeticType: item.cosmeticType, equipped: true, _id: { $ne: item._id } },
    { $set: { equipped: false } }
  );
  item.equipped = true;
  await item.save();
  return { id: String(item._id), equipped: true };
}

export async function listBadges(childId) {
  const badges = await modelRegistry.ChildBadge.find({ childId }).populate("badgeId").sort({ awardedAt: -1 }).lean();
  return {
    items: badges.map((badge) => ({
      id: String(badge._id),
      badgeId: String(badge.badgeId?._id ?? badge.badgeId),
      title: badge.badgeId?.title ?? null,
      awardedAt: badge.awardedAt
    }))
  };
}

export async function listMissions(childId, { now = new Date() } = {}) {
  const missions = await modelRegistry.Mission.find({ active: true }).sort({ key: 1 }).lean();
  const stats = await modelRegistry.DailyStats.findOne({ childId, dayKey: dayKeyVN(now) }).lean();
  const claims = await modelRegistry.MissionClaim.find({ childId, dayKey: dayKeyVN(now) }).lean();
  const claimed = new Set(claims.map((claim) => String(claim.missionId)));
  return {
    items: missions.map((mission) => ({
      id: String(mission._id),
      key: mission.key,
      title: mission.title,
      rewardAcorns: mission.rewardAcorns,
      progress: missionProgress(mission.rule, stats),
      claimable: missionProgress(mission.rule, stats).complete && !claimed.has(String(mission._id)),
      claimed: claimed.has(String(mission._id))
    }))
  };
}

export async function claimMission(childId, missionId, { now = new Date() } = {}) {
  const mission = await modelRegistry.Mission.findOne({ _id: missionId, active: true }).lean();
  if (!mission) throw notFound("Khong tim thay nhiem vu.");
  const stats = await modelRegistry.DailyStats.findOne({ childId, dayKey: dayKeyVN(now) }).lean();
  if (!missionProgress(mission.rule, stats).complete) {
    throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Chua du dieu kien nhan nhiem vu.");
  }
  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      await modelRegistry.MissionClaim.create(
        [{ childId, missionId: mission._id, dayKey: dayKeyVN(now), claimedAt: now }],
        { session: dbSession }
      );
      const rewardGranted = await grantRewardOnce(
        {
          childId,
          eventKey: `mission:${mission._id}:${dayKeyVN(now)}`,
          kind: "mission",
          delta: mission.rewardAcorns || MISSION_REWARD_FALLBACK,
          sourceId: mission._id,
          sourceVersion: mission.version,
          dayKey: dayKeyVN(now),
          requestHash: canonicalHash({ missionId, dayKey: dayKeyVN(now) })
        },
        dbSession
      );
      const wallet = await modelRegistry.Wallet.findOne({ childId }).session(dbSession).lean();
      result = { rewardGranted, wallet: walletDto(wallet) };
    });
    return result;
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, errorCodes.IDEMPOTENCY_CONFLICT, "Nhiem vu da duoc nhan trong ngay.");
    }
    throw error;
  } finally {
    await dbSession.endSession();
  }
}

export async function getProgressOverview(childId) {
  const todayKey = dayKeyVN();
  const [child, progress, attempts, dailyStats, todayStats] = await Promise.all([
    modelRegistry.ChildProfile.findById(childId).lean(),
    modelRegistry.ChildProgress.find({ childId }).lean(),
    modelRegistry.Attempt.find({ childId, attemptNo: 1 }).lean(),
    modelRegistry.DailyStats.find({ childId }).sort({ dayKey: -1 }).limit(30).lean(),
    modelRegistry.DailyStats.findOne({ childId, dayKey: todayKey }).lean()
  ]);
  const firstTryTotal = attempts.length;
  const firstTryCorrect = attempts.filter((attempt) => attempt.isCorrect).length;
  const masteredLetters = progress.filter((item) => item.contentType === "letter" && item.state === "mastered");
  const seenLetters = progress.filter((item) => item.contentType === "letter");
  const vocabPracticed = await countDistinctVocabularyFromAttempts(attempts);
  const dailyLimitMinutes = child?.settings?.dailyLimitMinutes ?? 30;
  return {
    masteredLetters: masteredLetters.length,
    seenLetters: seenLetters.length,
    vocabPracticed,
    activeSecondsToday: todayStats?.activeSeconds ?? 0,
    dailyLimitSeconds: dailyLimitMinutes * 60,
    letters: seenLetters.map((item) => ({
      letterId: String(item.contentId),
      contentVersion: item.contentVersion,
      state: item.state,
      evidenceCount: [...new Set((item.correctFirstTryExerciseIds ?? []).map(String))].length,
      lastPracticedAt: item.lastPracticedAt ?? null,
      completedAt: item.completedAt ?? null
    })),
    recognitionAccuracy: firstTryTotal > 0 ? firstTryCorrect / firstTryTotal : null,
    streakDays: computeStreak(dailyStats.map((stat) => stat.dayKey)),
    level: levelFromMastery(masteredLetters.length),
    growthStage: growthStageFromMastery(masteredLetters.length),
    recommendations: await buildRecommendations(seenLetters)
  };
}

export async function getDailyReport(childId, query = {}) {
  const filter = { childId };
  if (query.from || query.to) {
    filter.dayKey = {};
    if (query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from)) filter.dayKey.$gte = query.from;
    if (query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) filter.dayKey.$lte = query.to;
    if (Object.keys(filter.dayKey).length === 0) delete filter.dayKey;
  }
  const items = await modelRegistry.DailyStats.find(filter).sort({ dayKey: -1 }).limit(90).lean();
  return { items };
}

export async function getAttemptsReport(childId, query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    modelRegistry.Attempt.find({ childId }).populate("exerciseId", "type prompt targetLetterId vocabularyId spellingEntryId").sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
    modelRegistry.Attempt.countDocuments({ childId })
  ]);
  return {
    page,
    limit,
    total,
    items: items.map((attempt) => ({
      id: String(attempt._id),
      sessionId: String(attempt.sessionId),
      exerciseId: String(attempt.exerciseId?._id ?? attempt.exerciseId),
      exerciseType: attempt.exerciseId?.type ?? null,
      prompt: attempt.exerciseId?.prompt ?? null,
      attemptNo: attempt.attemptNo,
      isCorrect: attempt.isCorrect,
      responseMode: attempt.responseMode,
      dayKey: attempt.dayKey,
      submittedAt: attempt.submittedAt
    }))
  };
}

export async function rebuildChildAggregates(childId) {
  const attempts = await modelRegistry.Attempt.find({ childId }).lean();
  const grouped = new Map();
  for (const attempt of attempts) {
    const current = grouped.get(attempt.dayKey) ?? { attemptCount: 0, correctCount: 0 };
    current.attemptCount += 1;
    current.correctCount += attempt.isCorrect ? 1 : 0;
    grouped.set(attempt.dayKey, current);
  }
  for (const [dayKey, counts] of grouped) {
    await modelRegistry.DailyStats.updateOne({ childId, dayKey }, { $set: counts }, { upsert: true });
  }
  return { rebuiltDays: grouped.size };
}

function missionProgress(rule, stats) {
  const metric = rule?.metric ?? "attemptCount";
  const target = rule?.target ?? rule?.threshold ?? 1;
  const statMetricMap = {
    firstTryAttempts: "attemptCount",
    completedStoriesToday: "completedStories",
    activeSecondsToday: "activeSeconds"
  };
  const value = stats?.[statMetricMap[metric] ?? metric] ?? 0;
  return { metric, value, target, complete: value >= target };
}

function computeStreak(dayKeys) {
  const unique = [...new Set(dayKeys)].sort().reverse();
  if (unique.length === 0) return 0;
  let streak = 0;
  let expected = dayKeyVN();
  for (const key of unique) {
    if (key === expected) {
      streak += 1;
      expected = previousDayKey(expected);
    } else if (streak > 0) {
      break;
    }
  }
  return streak;
}

async function buildRecommendations(seenLetters) {
  const masteredIds = new Set(seenLetters.filter((item) => item.state === "mastered").map((item) => String(item.contentId)));
  const letters = await modelRegistry.Letter.find({ status: "published", _id: { $nin: [...masteredIds] } })
    .sort({ order: 1 })
    .limit(3)
    .lean();
  return letters.map((letter) => ({
    type: "practice-letter",
    letterId: String(letter._id),
    symbol: letter.symbol,
    reason: "practice-next-letter"
  }));
}

async function countDistinctVocabularyFromAttempts(attempts) {
  const exerciseIds = attempts.map((attempt) => attempt.exerciseId).filter(Boolean);
  if (exerciseIds.length === 0) return 0;
  const exercises = await modelRegistry.Exercise.find({ _id: { $in: exerciseIds }, vocabularyId: { $ne: null } })
    .select("vocabularyId")
    .lean();
  return new Set(exercises.map((exercise) => String(exercise.vocabularyId))).size;
}

function levelFromMastery(masteredCount) {
  if (masteredCount >= 24) return 4;
  if (masteredCount >= 15) return 3;
  if (masteredCount >= 8) return 2;
  return 1;
}

function growthStageFromMastery(masteredCount) {
  if (masteredCount >= 21) return { key: "bloom", label: "Đơm hoa kết trái", range: "21-29" };
  if (masteredCount >= 11) return { key: "sprout", label: "Chồi non", range: "11-20" };
  return { key: "seed", label: "Hạt mầm", range: "0-10" };
}

function previousDayKey(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}
