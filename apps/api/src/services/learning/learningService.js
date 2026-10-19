import crypto from "node:crypto";
import mongoose from "mongoose";
import { errorCodes } from "@vuon-chu/contracts";
import { ApiError, forbidden, notFound } from "../../lib/apiError.js";
import { modelRegistry } from "../../models/index.js";
import { dayKeyVN, splitSecondsByVnDay } from "./time.js";

const IDLE_EXPIRY_MS = 5 * 60 * 1000;
const OFFLINE_GAP_MS = 30 * 1000;
const HEARTBEAT_CAP_SECONDS = 15;
const QUIZ_REWARD = 5;
const QUIZ_DAILY_CAP = 50;
const STORY_REWARD = 15;

export function canonicalHash(value) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

export async function startLearningSession(childId, input, { now = new Date() } = {}) {
  const child = await modelRegistry.ChildProfile.findById(childId).lean();
  if (!child || child.deletedAt) throw forbidden();
  await assertDailyLimit(child, now);
  await expireIdleSession(childId, now);

  const prepared = await prepareSessionContent(child, input);
  const sessionDoc = await modelRegistry.LearningSession.create({
    childId,
    type: input.type,
    contentId: prepared.contentId,
    contentVersion: prepared.contentVersion,
    status: "active",
    startedAt: now,
    lastHeartbeatAt: now,
    lastHeartbeatSeq: 0,
    dayKey: dayKeyVN(now),
    questionSnapshots: prepared.questionSnapshots,
    sceneAcks: []
  }).catch((error) => {
    if (error?.code === 11000) {
      throw new ApiError(409, errorCodes.SESSION_CONFLICT, "Be dang co phien hoc dang mo.");
    }
    throw error;
  });

  return sessionDto(sessionDoc, {
    question: prepared.questionDtos[0] ?? null,
    questions: prepared.questionDtos,
    sceneIds: prepared.sceneIds,
    policy: policyDto(child, 0)
  });
}

export async function submitAnswer(childId, sessionId, input, { now = new Date() } = {}) {
  const child = await modelRegistry.ChildProfile.findById(childId).lean();
  if (!child || child.deletedAt) throw forbidden();
  await assertDailyLimit(child, now);

  const requestHash = canonicalHash({
    sessionId,
    exerciseId: input.exerciseId,
    attemptNo: input.attemptNo,
    response: input.response
  });

  const duplicate = await modelRegistry.Attempt.findOne({
    childId,
    idempotencyKey: input.idempotencyKey
  }).lean();
  if (duplicate) {
    if (duplicate.requestHash !== requestHash) {
      throw new ApiError(409, errorCodes.IDEMPOTENCY_CONFLICT, "Idempotency key da duoc dung voi payload khac.");
    }
    return answerResultDto(duplicate, { duplicate: true });
  }

  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      const learningSession = await loadOwnedSession(childId, sessionId, dbSession);
      if (!["active", "paused"].includes(learningSession.status)) {
        throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Phien hoc khong nhan cau tra loi.");
      }

      const committedDuplicate = await modelRegistry.Attempt.findOne({
        childId,
        idempotencyKey: input.idempotencyKey
      })
        .session(dbSession)
        .lean();
      if (committedDuplicate) {
        if (committedDuplicate.requestHash !== requestHash) {
          throw new ApiError(409, errorCodes.IDEMPOTENCY_CONFLICT, "Idempotency key da duoc dung voi payload khac.");
        }
        result = answerResultDto(committedDuplicate, { duplicate: true });
        return;
      }

      const snapshot = learningSession.questionSnapshots.find((item) => String(item.exerciseId) === input.exerciseId);
      if (!snapshot) {
        throw new ApiError(400, errorCodes.VALIDATION_ERROR, "Cau hoi khong thuoc phien hoc.");
      }

      const previousAttempts = await modelRegistry.Attempt.countDocuments({
        sessionId: learningSession._id,
        exerciseId: snapshot.exerciseId
      }).session(dbSession);
      if (input.attemptNo !== previousAttempts + 1 || input.attemptNo > 3) {
        throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Thu tu lan tra loi khong hop le.");
      }

      const isCorrect = snapshot.answer.optionId === input.response.optionId;
      const [attempt] = await modelRegistry.Attempt.create(
        [
          {
            childId,
            sessionId: learningSession._id,
            exerciseId: snapshot.exerciseId,
            contentVersion: snapshot.contentVersion,
            attemptNo: input.attemptNo,
            idempotencyKey: input.idempotencyKey,
            requestHash,
            response: input.response,
            isCorrect,
            responseMode: "text",
            submittedAt: now,
            dayKey: dayKeyVN(now)
          }
        ],
        { session: dbSession }
      );

      await updateDailyAttemptStats(childId, isCorrect, now, dbSession);
      const rewardGranted = await maybeGrantQuizReward(childId, attempt, dbSession);
      await maybeUpdateProgress(childId, snapshot.exerciseId, snapshot.contentVersion, isCorrect, input.attemptNo, now, dbSession);
      const wallet = await modelRegistry.Wallet.findOne({ childId }).session(dbSession).lean();
      result = answerResultDto(attempt, { rewardGranted, wallet });
    });
    return result;
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await modelRegistry.Attempt.findOne({ childId, idempotencyKey: input.idempotencyKey }).lean();
      if (existing?.requestHash === requestHash) return answerResultDto(existing, { duplicate: true });
      if (existing) throw new ApiError(409, errorCodes.IDEMPOTENCY_CONFLICT, "Idempotency key da duoc dung voi payload khac.");
    }
    throw error;
  } finally {
    await dbSession.endSession();
  }
}

export async function heartbeat(childId, sessionId, input, { now = new Date() } = {}) {
  const child = await modelRegistry.ChildProfile.findById(childId).lean();
  if (!child || child.deletedAt) throw forbidden();
  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      const learningSession = await loadOwnedSession(childId, sessionId, dbSession);
      if (learningSession.status !== "active") {
        throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Phien hoc khong active.");
      }
      if (input.seq <= learningSession.lastHeartbeatSeq) {
        const daily = await getDailyStats(childId, dayKeyVN(now), dbSession);
        result = heartbeatDto(learningSession, daily, child);
        return;
      }

      const elapsedMs = learningSession.lastHeartbeatAt ? now.getTime() - learningSession.lastHeartbeatAt.getTime() : 0;
      const countedSeconds =
        elapsedMs > 0 && elapsedMs <= OFFLINE_GAP_MS ? Math.min(HEARTBEAT_CAP_SECONDS, Math.floor(elapsedMs / 1000)) : 0;
      learningSession.lastHeartbeatAt = now;
      learningSession.lastHeartbeatSeq = input.seq;
      learningSession.activeSeconds += countedSeconds;
      await learningSession.save({ session: dbSession });

      for (const part of splitSecondsByVnDay(new Date(now.getTime() - countedSeconds * 1000), countedSeconds)) {
        await modelRegistry.DailyStats.updateOne(
          { childId, dayKey: part.dayKey },
          { $inc: { activeSeconds: part.seconds }, $set: { lastActiveAt: now } },
          { upsert: true, session: dbSession }
        );
      }
      const daily = await getDailyStats(childId, dayKeyVN(now), dbSession);
      result = heartbeatDto(learningSession, daily, child);
    });
    return result;
  } finally {
    await dbSession.endSession();
  }
}

export async function pauseSession(childId, sessionId) {
  const session = await modelRegistry.LearningSession.findOneAndUpdate(
    { _id: sessionId, childId, status: "active" },
    { $set: { status: "paused" } },
    { new: true }
  ).lean();
  if (!session) throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Khong co phien active de tam dung.");
  return { id: String(session._id), status: session.status };
}

export async function resumeSession(childId, sessionId, { now = new Date() } = {}) {
  const child = await modelRegistry.ChildProfile.findById(childId).lean();
  if (!child || child.deletedAt) throw forbidden();
  await assertDailyLimit(child, now);
  await expireIdleSession(childId, now);
  const session = await modelRegistry.LearningSession.findOneAndUpdate(
    { _id: sessionId, childId, status: "paused" },
    { $set: { status: "active", lastHeartbeatAt: now } },
    { new: true }
  )
    .select("+questionSnapshots")
    .lean()
    .catch((error) => {
      if (error?.code === 11000) throw new ApiError(409, errorCodes.SESSION_CONFLICT, "Be dang co phien hoc dang mo.");
      throw error;
    });
  if (!session) throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Khong the tiep tuc phien nay.");
  const questionDtos = await hydrateQuestionDtos(session.questionSnapshots);
  return sessionDto(session, {
    question: questionDtos[0] ?? null,
    questions: questionDtos,
    policy: policyDto(child, 0)
  });
}

export async function acknowledgeScene(childId, sessionId, sceneId, input, { now = new Date() } = {}) {
  const story = await loadSessionStory(childId, sessionId);
  const existing = story.session.sceneAcks.find((ack) => ack.idempotencyKey === input.idempotencyKey);
  if (existing) return { sceneId: existing.sceneId, acknowledgedAt: existing.acknowledgedAt };

  const expectedScene = story.story.scenes[story.session.sceneAcks.length];
  if (!expectedScene || expectedScene.id !== sceneId) {
    throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Can doc truyen dung thu tu canh.");
  }
  story.session.sceneAcks.push({ sceneId, idempotencyKey: input.idempotencyKey, acknowledgedAt: now });
  await story.session.save();
  return { sceneId, acknowledgedAt: now.toISOString(), nextSceneId: story.story.scenes[story.session.sceneAcks.length]?.id ?? null };
}

export async function completeSession(childId, sessionId, input, { now = new Date() } = {}) {
  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      const learningSession = await loadOwnedSession(childId, sessionId, dbSession);
      if (learningSession.status === "completed") {
        result = { id: String(learningSession._id), status: "completed", duplicate: true };
        return;
      }
      if (!["active", "paused"].includes(learningSession.status)) {
        throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Phien hoc khong the hoan thanh.");
      }

      let rewardGranted = null;
      if (learningSession.type === "story") {
        const story = await modelRegistry.Story.findById(learningSession.contentId).session(dbSession).lean();
        if (!story) throw notFound("Khong tim thay truyen.");
        const acked = new Set(learningSession.sceneAcks.map((ack) => ack.sceneId));
        const allScenesAcked = story.scenes.every((scene) => acked.has(scene.id));
        const endingAnswered = await modelRegistry.Attempt.exists({
          childId,
          sessionId: learningSession._id,
          exerciseId: story.endingExerciseId,
          isCorrect: true
        }).session(dbSession);
        if (!allScenesAcked || !endingAnswered) {
          throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Chua du bang chung de hoan thanh truyen.");
        }
        rewardGranted = await grantRewardOnce(
          {
            childId,
            eventKey: `story:${story._id}:${story.version}`,
            kind: "story",
            delta: STORY_REWARD,
            sourceId: story._id,
            sourceVersion: story.version,
            dayKey: dayKeyVN(now),
            requestHash: canonicalHash({ sessionId, idempotencyKey: input.idempotencyKey })
          },
          dbSession
        );
        await modelRegistry.DailyStats.updateOne(
          { childId, dayKey: dayKeyVN(now) },
          { $inc: { completedStories: 1 }, $set: { lastActiveAt: now } },
          { upsert: true, session: dbSession }
        );
        await upsertProgress(childId, "story", story._id, story.version, { state: "completed", completedAt: now }, dbSession);
      }

      learningSession.status = "completed";
      learningSession.completedAt = now;
      await learningSession.save({ session: dbSession });
      const wallet = await modelRegistry.Wallet.findOne({ childId }).session(dbSession).lean();
      result = { id: String(learningSession._id), status: "completed", rewardGranted, wallet: walletDto(wallet) };
    });
    return result;
  } finally {
    await dbSession.endSession();
  }
}

async function prepareSessionContent(child, input) {
  if (input.type === "story") {
    const story = await modelRegistry.Story.findOne({ _id: input.contentId, status: "published" }).lean();
    if (!story) throw notFound("Khong tim thay truyen.");
    assertAgeAllowed(story, child);
    const exercise = await modelRegistry.Exercise.findById(story.endingExerciseId).select("+answer").lean();
    return {
      contentId: story._id,
      contentVersion: story.version,
      sceneIds: story.scenes.map((scene) => scene.id),
      questionDtos: [questionDto(exercise)],
      questionSnapshots: [snapshotFromExercise(exercise)]
    };
  }

  const query = { status: "published" };
  let contentVersion = null;
  if (input.type === "alphabet") {
    const letter = await modelRegistry.Letter.findOne({ _id: input.contentId, status: "published" }).lean();
    if (!letter) throw notFound("Khong tim thay chu cai.");
    assertAgeAllowed(letter, child);
    contentVersion = letter.version;
    query.targetLetterId = input.contentId;
  } else if (input.type === "spelling") {
    const spelling = await modelRegistry.SpellingEntry.findOne({ _id: input.contentId, status: "published" }).lean();
    if (!spelling) throw notFound("Khong tim thay van.");
    assertAgeAllowed(spelling, child);
    contentVersion = spelling.version;
    query.spellingEntryId = input.contentId;
  } else if (input.gameType) {
    query.type = input.gameType;
  }
  const exercises = await modelRegistry.Exercise.find(query).select("+answer").sort({ key: 1 }).limit(5).lean();
  if (exercises.length === 0) throw notFound("Khong co bai tap phu hop.");
  for (const exercise of exercises) assertAgeAllowed(exercise, child);
  return {
    contentId: input.contentId ?? exercises[0]._id,
    contentVersion: contentVersion ?? exercises[0].version,
    sceneIds: [],
    questionDtos: exercises.map(questionDto),
    questionSnapshots: exercises.map(snapshotFromExercise)
  };
}

async function hydrateQuestionDtos(questionSnapshots = []) {
  if (questionSnapshots.length === 0) return [];
  const ids = questionSnapshots.map((snapshot) => snapshot.exerciseId);
  const exercises = await modelRegistry.Exercise.find({ _id: { $in: ids } }).lean();
  const byId = new Map(exercises.map((exercise) => [String(exercise._id), exercise]));
  return questionSnapshots.map((snapshot) => byId.get(String(snapshot.exerciseId))).filter(Boolean).map(questionDto);
}

async function maybeUpdateProgress(childId, exerciseId, contentVersion, isCorrect, attemptNo, now, session) {
  const exercise = await modelRegistry.Exercise.findById(exerciseId).session(session).lean();
  if (!exercise) return;

  if (exercise.targetLetterId) {
    const letter = await modelRegistry.Letter.findById(exercise.targetLetterId).session(session).lean();
    const progressVersion = letter?.version ?? contentVersion;
    const progress = await modelRegistry.ChildProgress.findOneAndUpdate(
      { childId, contentType: "letter", contentId: exercise.targetLetterId, contentVersion: progressVersion },
      {
        $setOnInsert: { state: "seen" },
        $set: { lastPracticedAt: now },
        ...(isCorrect && attemptNo === 1 && exercise.type === "identify-letter"
          ? { $addToSet: { correctFirstTryExerciseIds: exercise._id } }
          : {})
      },
      { upsert: true, new: true, session }
    );
    if ((progress.correctFirstTryExerciseIds ?? []).map(String).filter((id, index, arr) => arr.indexOf(id) === index).length >= 2) {
      progress.state = "mastered";
      progress.completedAt ??= now;
      await progress.save({ session });
    } else if (isCorrect) {
      progress.state = "practicing";
      await progress.save({ session });
    }
  }

  if (exercise.spellingEntryId) {
    const spelling = await modelRegistry.SpellingEntry.findById(exercise.spellingEntryId).session(session).lean();
    const progressVersion = spelling?.version ?? contentVersion;
    const progress = await modelRegistry.ChildProgress.findOneAndUpdate(
      { childId, contentType: "spelling", contentId: exercise.spellingEntryId, contentVersion: progressVersion },
      {
        $setOnInsert: { state: "seen" },
        $set: { lastPracticedAt: now },
        ...(isCorrect && attemptNo === 1 ? { $addToSet: { correctFirstTryExerciseIds: exercise._id } } : {})
      },
      { upsert: true, new: true, session }
    );
    progress.state = isCorrect ? "completed" : "practicing";
    if (isCorrect) progress.completedAt ??= now;
    await progress.save({ session });
  }
}

async function maybeGrantQuizReward(childId, attempt, session) {
  if (!attempt.isCorrect || attempt.attemptNo !== 1) return null;
  const stats = await getDailyStats(childId, attempt.dayKey, session);
  if ((stats?.earnedQuizAcorns ?? 0) >= QUIZ_DAILY_CAP) return null;
  const delta = Math.min(QUIZ_REWARD, QUIZ_DAILY_CAP - (stats?.earnedQuizAcorns ?? 0));
  if (delta <= 0) return null;
  const granted = await grantRewardOnce(
    {
      childId,
      eventKey: `quiz:${attempt.exerciseId}:${attempt.contentVersion}:${attempt.dayKey}`,
      kind: "quiz",
      delta,
      sourceId: attempt.exerciseId,
      sourceVersion: attempt.contentVersion,
      dayKey: attempt.dayKey,
      requestHash: attempt.requestHash
    },
    session
  );
  if (granted) {
    await modelRegistry.DailyStats.updateOne(
      { childId, dayKey: attempt.dayKey },
      { $inc: { earnedQuizAcorns: delta } },
      { upsert: true, session }
    );
  }
  return granted;
}

export async function grantRewardOnce(entry, session) {
  try {
    await modelRegistry.RewardLedger.create([entry], { session });
    await modelRegistry.Wallet.updateOne(
      { childId: entry.childId },
      { $inc: { balance: entry.delta, earnedTotal: entry.delta } },
      { upsert: true, session }
    );
    return { kind: entry.kind, delta: entry.delta, eventKey: entry.eventKey };
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

async function updateDailyAttemptStats(childId, isCorrect, now, session) {
  await modelRegistry.DailyStats.updateOne(
    { childId, dayKey: dayKeyVN(now) },
    {
      $inc: { attemptCount: 1, correctCount: isCorrect ? 1 : 0 },
      $set: { lastActiveAt: now }
    },
    { upsert: true, session }
  );
}

async function assertDailyLimit(child, now) {
  const key = dayKeyVN(now);
  const daily = await modelRegistry.DailyStats.findOne({ childId: child._id, dayKey: key }).lean();
  const limitSeconds = (child.settings?.dailyLimitMinutes ?? 30) * 60;
  if ((daily?.activeSeconds ?? 0) >= limitSeconds) {
    throw new ApiError(429, errorCodes.DAILY_LIMIT_REACHED, "Da het thoi gian hoc hom nay.");
  }
}

async function expireIdleSession(childId, now) {
  await modelRegistry.LearningSession.updateMany(
    {
      childId,
      status: "active",
      lastHeartbeatAt: { $lt: new Date(now.getTime() - IDLE_EXPIRY_MS) }
    },
    { $set: { status: "expired", expiresAt: now } }
  );
}

async function loadOwnedSession(childId, sessionId, dbSession) {
  const learningSession = await modelRegistry.LearningSession.findOne({ _id: sessionId, childId })
    .select("+questionSnapshots")
    .session(dbSession);
  if (!learningSession) throw notFound("Khong tim thay phien hoc.");
  return learningSession;
}

async function loadSessionStory(childId, sessionId) {
  const session = await modelRegistry.LearningSession.findOne({ _id: sessionId, childId }).select("+questionSnapshots");
  if (!session || session.type !== "story") throw new ApiError(409, errorCodes.INVALID_SESSION_STATE, "Phien nay khong phai truyen.");
  const story = await modelRegistry.Story.findById(session.contentId).lean();
  if (!story) throw notFound("Khong tim thay truyen.");
  return { session, story };
}

async function getDailyStats(childId, dayKey, session) {
  return modelRegistry.DailyStats.findOne({ childId, dayKey }).session(session).lean();
}

async function upsertProgress(childId, contentType, contentId, contentVersion, update, session) {
  await modelRegistry.ChildProgress.updateOne(
    { childId, contentType, contentId, contentVersion },
    { $set: update },
    { upsert: true, session }
  );
}

function assertAgeAllowed(content, child) {
  if (Array.isArray(content.ageBands) && content.ageBands.length > 0 && !content.ageBands.includes(child.ageBand)) {
    throw forbidden("Noi dung khong phu hop ho so be.");
  }
}

function snapshotFromExercise(exercise) {
  return {
    exerciseId: exercise._id,
    contentVersion: exercise.version,
    answer: { optionId: exercise.answer.optionId },
    issuedAt: new Date()
  };
}

function questionDto(exercise) {
  return {
    id: String(exercise._id),
    type: exercise.type,
    prompt: exercise.prompt,
    options: exercise.options.map((option) => ({
      id: option.id,
      label: option.label,
      assetKey: option.assetKey ?? null
    })),
    audioAssetKeys: exercise.audioAssetKeys ?? {},
    maxAttempts: exercise.maxAttempts,
    version: exercise.version
  };
}

function answerResultDto(attempt, extras = {}) {
  return {
    attemptId: String(attempt._id),
    isCorrect: attempt.isCorrect,
    feedback: attempt.isCorrect ? "correct" : "try-again",
    nextAttemptNo: attempt.isCorrect || attempt.attemptNo >= 3 ? null : attempt.attemptNo + 1,
    rewardGranted: extras.rewardGranted ?? null,
    wallet: walletDto(extras.wallet),
    duplicate: Boolean(extras.duplicate)
  };
}

function sessionDto(session, extras = {}) {
  return {
    id: String(session._id),
    type: session.type,
    status: session.status,
    contentId: String(session.contentId),
    contentVersion: session.contentVersion,
    question: extras.question ?? null,
    questions: extras.questions ?? (extras.question ? [extras.question] : []),
    sceneIds: extras.sceneIds ?? [],
    policy: extras.policy ?? null
  };
}

function heartbeatDto(session, daily, child) {
  const limitSeconds = (child.settings?.dailyLimitMinutes ?? 30) * 60;
  const dailySeconds = daily?.activeSeconds ?? 0;
  return {
    activeSeconds: session.activeSeconds,
    dailySeconds,
    remainingSeconds: Math.max(0, limitSeconds - dailySeconds),
    breakRequired: session.activeSeconds >= (child.settings?.breakEveryMinutes ?? 20) * 60
  };
}

function policyDto(child, dailySeconds) {
  const limitSeconds = (child.settings?.dailyLimitMinutes ?? 30) * 60;
  return {
    dailyLimitSeconds: limitSeconds,
    remainingSeconds: Math.max(0, limitSeconds - dailySeconds),
    breakEverySeconds: (child.settings?.breakEveryMinutes ?? 20) * 60,
    breakSeconds: child.settings?.breakSeconds ?? 20
  };
}

export function walletDto(wallet) {
  return {
    balance: wallet?.balance ?? 0,
    earnedTotal: wallet?.earnedTotal ?? 0,
    spentTotal: wallet?.spentTotal ?? 0
  };
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}
