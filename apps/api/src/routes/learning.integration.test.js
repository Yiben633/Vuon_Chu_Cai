import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const shouldRun = process.env.RUN_MONGO_TESTS === "true";
if (shouldRun) vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

describe.skipIf(!shouldRun)("learning, progress, and rewards API", () => {
  let app;
  let modelRegistry;
  const origin = "http://localhost:5173";
  const createdEmails = new Set();
  const createdRewardIds = [];

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.APP_ORIGIN = origin;
    process.env.MONGODB_URI = testMongoUri("learning");
    process.env.SESSION_SECRET ??= "learning_test_session_secret_at_least_32_bytes";
    process.env.ALLOW_UNREVIEWED_DEMO_CONTENT = "true";

    const database = await import("../lib/database.js");
    await database.connectDatabase();
    const indexes = await import("../services/indexMaintenanceService.js");
    await indexes.createDeclaredIndexes();
    modelRegistry = (await import("../models/index.js")).modelRegistry;
    await cleanTestDatabase();
    const seed = await import("../services/seed/seedDataService.js");
    await seed.importSeed({ dryRun: false });
    app = (await import("../app.js")).createApp();
  }, 30000);

  afterAll(async () => {
    if (!modelRegistry) return;
    await modelRegistry.RewardCatalog.deleteMany({ _id: { $in: createdRewardIds } });
    for (const email of createdEmails) await cleanupEmail(email);
    if (mongoose.connection.readyState === 1) await mongoose.connection.collection("sessions").deleteMany({});
    const database = await import("../lib/database.js");
    await database.disconnectDatabase();
  });

  it("answers from private snapshots idempotently, updates mastery, and reports real data", async () => {
    const family = await childAgent("learn-flow");
    const letter = await modelRegistry.Letter.findOne({ symbol: "A", status: "published" }).lean();
    const exercises = await modelRegistry.Exercise.find({ targetLetterId: letter._id, type: "identify-letter", status: "published" })
      .select("+answer")
      .sort({ key: 1 })
      .limit(2)
      .lean();
    expect(exercises).toHaveLength(2);

    const start = await family.agent
      .post("/api/v1/learning/sessions")
      .set(csrfHeaders(family.csrf))
      .send({ type: "alphabet", contentId: String(letter._id), gameType: "identify-letter" })
      .expect(201);
    expect(JSON.stringify(start.body.data.question)).not.toContain("answer");
    const sessionId = start.body.data.id;

    const firstPayload = answerPayload(exercises[0], 1, "answer-key-a");
    const [first, duplicate] = await Promise.all([
      family.agent.post(`/api/v1/learning/sessions/${sessionId}/answers`).set(csrfHeaders(family.csrf)).send(firstPayload),
      family.agent.post(`/api/v1/learning/sessions/${sessionId}/answers`).set(csrfHeaders(family.csrf)).send(firstPayload)
    ]);
    expect([200, 200]).toContain(first.status);
    expect([200, 200]).toContain(duplicate.status);
    expect(first.body.data.isCorrect || duplicate.body.data.isCorrect).toBe(true);

    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/answers`)
      .set(csrfHeaders(family.csrf))
      .send({ ...firstPayload, response: { optionId: "different" } })
      .expect(409);

    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/answers`)
      .set(csrfHeaders(family.csrf))
      .send(answerPayload(exercises[1], 1, "answer-key-b"))
      .expect(200);

    const progress = await modelRegistry.ChildProgress.findOne({ childId: family.childId, contentId: letter._id }).lean();
    expect(progress.state).toBe("mastered");

    await openParentGate(family);
    const report = await family.agent.get(`/api/v1/children/${family.childId}/reports/overview`).expect(200);
    expect(report.body.data.masteredLetters).toBeGreaterThanOrEqual(1);
    expect(report.body.data.recognitionAccuracy).toBeGreaterThan(0);
  });

  it("keeps reports null without attempts and prevents double redemption in parallel", async () => {
    const family = await childAgent("reward-flow");
    await openParentGate(family);
    const emptyReport = await family.agent.get(`/api/v1/children/${family.childId}/reports/overview`).expect(200);
    expect(emptyReport.body.data.recognitionAccuracy).toBeNull();
    await family.agent.post("/api/v1/auth/enter-child").set(csrfHeaders(family.csrf)).send({ childId: family.childId }).expect(200);

    const reward = await modelRegistry.RewardCatalog.create({
      key: `reward-test-${Date.now()}`,
      version: 1,
      title: "Mu la test",
      cost: 10,
      cosmeticType: "hat",
      assetKey: null,
      active: true
    });
    createdRewardIds.push(reward._id);

    const [a, b] = await Promise.all([
      family.agent
        .post(`/api/v1/children/${family.childId}/redeem`)
        .set(csrfHeaders(family.csrf))
        .send({ rewardId: String(reward._id), idempotencyKey: "redeem-key-a" }),
      family.agent
        .post(`/api/v1/children/${family.childId}/redeem`)
        .set(csrfHeaders(family.csrf))
        .send({ rewardId: String(reward._id), idempotencyKey: "redeem-key-b" })
    ]);

    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await modelRegistry.Inventory.countDocuments({ childId: family.childId, rewardId: reward._id })).toBe(1);
    const wallet = await modelRegistry.Wallet.findOne({ childId: family.childId }).lean();
    expect(wallet.balance).toBe(40);
  });

  it("requires ordered story scene acks and grants story reward once", async () => {
    const family = await childAgent("story-flow");
    const story = await modelRegistry.Story.findOne({ status: "published" }).lean();
    const ending = await modelRegistry.Exercise.findById(story.endingExerciseId).select("+answer").lean();

    const start = await family.agent
      .post("/api/v1/learning/sessions")
      .set(csrfHeaders(family.csrf))
      .send({ type: "story", contentId: String(story._id) })
      .expect(201);
    expect(start.body.data.sceneIds).toEqual(story.scenes.map((scene) => scene.id));
    expect(JSON.stringify(start.body.data.question)).not.toContain("answer");
    const sessionId = start.body.data.id;

    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/scenes/${story.scenes[1].id}/ack`)
      .set(csrfHeaders(family.csrf))
      .send({ idempotencyKey: "story-skip-scene" })
      .expect(409);

    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/complete`)
      .set(csrfHeaders(family.csrf))
      .send({ idempotencyKey: "story-complete-early" })
      .expect(409);

    for (const scene of story.scenes) {
      await family.agent
        .post(`/api/v1/learning/sessions/${sessionId}/scenes/${scene.id}/ack`)
        .set(csrfHeaders(family.csrf))
        .send({ idempotencyKey: `story-ack-${scene.id}` })
        .expect(200);
    }

    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/answers`)
      .set(csrfHeaders(family.csrf))
      .send(answerPayload(ending, 1, "story-ending-answer"))
      .expect(200);

    const complete = await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/complete`)
      .set(csrfHeaders(family.csrf))
      .send({ idempotencyKey: "story-complete-final" })
      .expect(200);
    expect(complete.body.data.rewardGranted.delta).toBe(15);

    const duplicate = await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/complete`)
      .set(csrfHeaders(family.csrf))
      .send({ idempotencyKey: "story-complete-again" })
      .expect(200);
    expect(duplicate.body.data.rewardGranted).toBeUndefined();
    expect(await modelRegistry.RewardLedger.countDocuments({ childId: family.childId, kind: "story" })).toBe(1);
  });

  it("starts quiz rounds with 5 distinct sanitized questions and idempotent rewards", async () => {
    const family = await childAgent("quiz-flow");

    const start = await family.agent
      .post("/api/v1/learning/sessions")
      .set(csrfHeaders(family.csrf))
      .send({ type: "quiz", gameType: "match-rime" })
      .expect(201);

    expect(start.body.data.questions).toHaveLength(5);
    expect(new Set(start.body.data.questions.map((question) => question.id)).size).toBe(5);
    expect(JSON.stringify(start.body.data.questions)).not.toContain("answer");
    const sessionId = start.body.data.id;

    const exercise = await modelRegistry.Exercise.findById(start.body.data.questions[0].id).select("+answer").lean();
    const payload = answerPayload(exercise, 1, "quiz-answer-once");
    const [first, duplicate] = await Promise.all([
      family.agent.post(`/api/v1/learning/sessions/${sessionId}/answers`).set(csrfHeaders(family.csrf)).send(payload),
      family.agent.post(`/api/v1/learning/sessions/${sessionId}/answers`).set(csrfHeaders(family.csrf)).send(payload)
    ]);
    expect([first.status, duplicate.status]).toEqual([200, 200]);
    expect(first.body.data.isCorrect || duplicate.body.data.isCorrect).toBe(true);
    expect(await modelRegistry.RewardLedger.countDocuments({ childId: family.childId, kind: "quiz", sourceId: exercise._id })).toBe(1);

    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/pause`)
      .set(csrfHeaders(family.csrf))
      .send({})
      .expect(200);
    const resumed = await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/resume`)
      .set(csrfHeaders(family.csrf))
      .send({})
      .expect(200);
    expect(resumed.body.data.questions).toHaveLength(5);
    expect(JSON.stringify(resumed.body.data.questions)).not.toContain("answer");
  });

  it("counts heartbeat once, splits midnight in Vietnam, ignores offline gaps, and enforces the daily limit", async () => {
    const family = await childAgent("heartbeat-flow");
    const letter = await modelRegistry.Letter.findOne({ symbol: "A", status: "published" }).lean();
    const startedAt = "2026-01-01T16:59:50.000Z";
    const start = await family.agent
      .post("/api/v1/learning/sessions")
      .set({ ...csrfHeaders(family.csrf), "X-Test-Now": startedAt })
      .send({ type: "alphabet", contentId: String(letter._id), gameType: "identify-letter" })
      .expect(201);

    const sessionId = start.body.data.id;
    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/heartbeat`)
      .set({ ...csrfHeaders(family.csrf), "X-Test-Now": "2026-01-01T17:00:05.000Z" })
      .send({ seq: 1 })
      .expect(200);
    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/heartbeat`)
      .set({ ...csrfHeaders(family.csrf), "X-Test-Now": "2026-01-01T17:00:10.000Z" })
      .send({ seq: 1 })
      .expect(200);

    const beforeMidnight = await modelRegistry.DailyStats.findOne({ childId: family.childId, dayKey: "2026-01-01" }).lean();
    const afterMidnight = await modelRegistry.DailyStats.findOne({ childId: family.childId, dayKey: "2026-01-02" }).lean();
    expect(beforeMidnight.activeSeconds).toBe(10);
    expect(afterMidnight.activeSeconds).toBe(5);

    await family.agent
      .post(`/api/v1/learning/sessions/${sessionId}/heartbeat`)
      .set({ ...csrfHeaders(family.csrf), "X-Test-Now": "2026-01-01T17:00:41.000Z" })
      .send({ seq: 2 })
      .expect(200);
    expect((await modelRegistry.DailyStats.findOne({ childId: family.childId, dayKey: "2026-01-02" }).lean()).activeSeconds).toBe(5);

    await family.agent.post(`/api/v1/learning/sessions/${sessionId}/pause`).set(csrfHeaders(family.csrf)).send({}).expect(200);
    const child = await modelRegistry.ChildProfile.findById(family.childId).lean();
    await modelRegistry.DailyStats.updateOne(
      { childId: family.childId, dayKey: "2026-01-02" },
      { $set: { activeSeconds: child.settings.dailyLimitMinutes * 60 } }
    );
    await family.agent
      .post("/api/v1/learning/sessions")
      .set({ ...csrfHeaders(family.csrf), "X-Test-Now": "2026-01-01T18:00:00.000Z" })
      .send({ type: "alphabet", contentId: String(letter._id), gameType: "identify-letter" })
      .expect(429);
  });

  async function childAgent(prefix) {
    const agent = request.agent(app);
    const csrf = await getCsrf(agent);
    const email = testEmail(prefix);
    createdEmails.add(email);
    const response = await agent.post("/api/v1/auth/register").set(csrfHeaders(csrf)).send(registerPayload(email)).expect(201);
    await agent.post("/api/v1/auth/enter-child").set(csrfHeaders(csrf)).send({ childId: response.body.data.child.id }).expect(200);
    return { agent, csrf, email, childId: response.body.data.child.id };
  }

  async function getCsrf(agent) {
    const response = await agent.get("/api/v1/auth/csrf").expect(200);
    return response.body.data.csrfToken;
  }

  async function openParentGate(family) {
    await family.agent
      .post("/api/v1/auth/parent-gate")
      .set(csrfHeaders(family.csrf))
      .send({ pin: "1234" })
      .expect(200);
  }

  function csrfHeaders(token) {
    return { "X-CSRF-Token": token, Origin: origin };
  }

  function answerPayload(exercise, attemptNo, idempotencyKey) {
    return {
      exerciseId: String(exercise._id),
      attemptNo,
      response: { optionId: exercise.answer.optionId },
      idempotencyKey
    };
  }

  function registerPayload(email) {
    return {
      parent: { displayName: "Parent Test", email, password: "Password123!", pin: "1234" },
      child: { nickname: "Be Test", ageBand: "4-5", dialect: "north", mascotKey: "mascot-test" },
      consent: { termsAccepted: true, termsVersion: "test-v1" }
    };
  }

  function testEmail(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  }

  function testMongoUri(suffix) {
    const base = process.env.MONGODB_URI || "mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0";
    return base.replace(/\/([^/?]+)(\?|$)/, `/vuon_chu_test_${suffix}$2`);
  }

  async function cleanTestDatabase() {
    await Promise.all([
      modelRegistry.Asset.deleteMany({}),
      modelRegistry.Letter.deleteMany({}),
      modelRegistry.Tone.deleteMany({}),
      modelRegistry.Vocabulary.deleteMany({}),
      modelRegistry.SpellingEntry.deleteMany({}),
      modelRegistry.Exercise.deleteMany({}),
      modelRegistry.Lesson.deleteMany({}),
      modelRegistry.Story.deleteMany({}),
      modelRegistry.Resource.deleteMany({}),
      modelRegistry.RewardCatalog.deleteMany({}),
      modelRegistry.Badge.deleteMany({}),
      modelRegistry.Mission.deleteMany({}),
      modelRegistry.User.deleteMany({}),
      modelRegistry.ChildProfile.deleteMany({}),
      modelRegistry.PinAttempt.deleteMany({}),
      modelRegistry.LearningSession.deleteMany({}),
      modelRegistry.Attempt.deleteMany({}),
      modelRegistry.ChildProgress.deleteMany({}),
      modelRegistry.DailyStats.deleteMany({}),
      modelRegistry.Wallet.deleteMany({}),
      modelRegistry.RewardLedger.deleteMany({}),
      modelRegistry.Inventory.deleteMany({}),
      modelRegistry.ChildBadge.deleteMany({}),
      modelRegistry.MissionClaim.deleteMany({}),
      modelRegistry.Recording.deleteMany({}),
      modelRegistry.SpeechAttempt.deleteMany({})
    ]);
  }

  async function cleanupEmail(email) {
    const user = await modelRegistry.User.findOne({ emailNormalized: email }).lean();
    if (!user) return;
    const children = await modelRegistry.ChildProfile.find({ parentId: user._id }).select("_id").lean();
    const childIds = children.map((child) => child._id);
    await modelRegistry.LearningSession.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.Attempt.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.ChildProgress.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.DailyStats.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.Wallet.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.RewardLedger.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.Inventory.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.ChildBadge.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.MissionClaim.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.Recording.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.SpeechAttempt.deleteMany({ childId: { $in: childIds } });
    await modelRegistry.PinAttempt.deleteMany({ userId: user._id });
    await modelRegistry.ChildProfile.deleteMany({ parentId: user._id });
    await modelRegistry.User.deleteOne({ _id: user._id });
  }
});
