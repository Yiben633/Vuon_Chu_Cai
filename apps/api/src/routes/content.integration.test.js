import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const shouldRun = process.env.RUN_MONGO_TESTS === "true";
if (shouldRun) vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

describe.skipIf(!shouldRun)("content and admin API", () => {
  let app;
  let modelRegistry;
  const origin = "http://localhost:5173";
  const createdEmails = new Set();
  const createdIds = {
    vocabulary: [],
    resources: []
  };

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.APP_ORIGIN = origin;
    process.env.MONGODB_URI = testMongoUri("content");
    process.env.SESSION_SECRET ??= "content_test_session_secret_at_least_32_bytes";
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
    for (const id of createdIds.vocabulary) await modelRegistry.Vocabulary.deleteOne({ _id: id });
    for (const id of createdIds.resources) await modelRegistry.Resource.deleteOne({ _id: id });
    for (const email of createdEmails) await cleanupEmail(email);
    if (mongoose.connection.readyState === 1) await mongoose.connection.collection("sessions").deleteMany({});
    const database = await import("../lib/database.js");
    await database.disconnectDatabase();
  });

  it("returns published letters by group and never leaks draft vocabulary publicly", async () => {
    const all = await request(app).get("/api/v1/letters").expect(200);
    const vowels = await request(app).get("/api/v1/letters?group=vowel").expect(200);
    const consonants = await request(app).get("/api/v1/letters?group=consonant").expect(200);
    expect(all.body.data.items).toHaveLength(29);
    expect(vowels.body.data.items).toHaveLength(12);
    expect(consonants.body.data.items).toHaveLength(17);

    const draft = await modelRegistry.Vocabulary.create({
      key: `draft-vocab-${Date.now()}`,
      status: "draft",
      reviewStatus: "needs_review",
      version: 1,
      title: "Draft hidden",
      ageBands: ["4-5"],
      word: "ẩn-draft",
      meaning: "Không lọt public",
      category: "draft-test",
      syllables: ["ẩn"],
      letterIds: []
    });
    createdIds.vocabulary.push(draft._id);
    const publicList = await request(app).get("/api/v1/vocabulary?q=ẩn-draft").expect(200);
    expect(publicList.body.data.items).toHaveLength(0);
  });

  it("does not expose exercise answers in public story DTO but exposes them to admin", async () => {
    const story = await modelRegistry.Story.findOne({ status: "published" }).lean();
    const publicStory = await request(app).get(`/api/v1/stories/${story.slug}`).expect(200);
    expect(JSON.stringify(publicStory.body.data)).not.toContain("optionId");
    expect(JSON.stringify(publicStory.body.data)).not.toContain("answer");

    const admin = await adminAgent("answer-admin");
    const exercise = await modelRegistry.Exercise.findOne({ status: "published" }).lean();
    const adminExercise = await admin.agent.get(`/api/v1/admin/exercises/${exercise._id}`).expect(200);
    expect(adminExercise.body.data.answer.optionId).toBeTruthy();
  });

  it("rejects admin access for parent and child sessions", async () => {
    const parent = await parentAgent("parent-admin-forbidden");
    await openGate(parent.agent, parent.csrf, "1234");
    await parent.agent.get("/api/v1/admin/letters").expect(403);

    const child = await parentAgent("child-admin-forbidden");
    await child.agent.post("/api/v1/auth/enter-child").set(csrfHeaders(child.csrf)).send({ childId: child.childId }).expect(200);
    await child.agent.get("/api/v1/admin/letters").expect(403);
  });

  it("validates ObjectId params and reports missing PDF resources", async () => {
    const parent = await parentAgent("resource-check");
    await openGate(parent.agent, parent.csrf, "1234");
    await parent.agent.get("/api/v1/resources/not-an-object-id/download").expect(400);

    const resource = await modelRegistry.Resource.create({
      key: `missing-resource-${Date.now()}`,
      version: 1,
      status: "published",
      reviewStatus: "needs_review",
      title: "Missing PDF",
      ageBands: ["4-5"],
      type: "worksheet",
      assetKey: null,
      pageCount: null,
      letterIds: [],
      availability: "missing"
    });
    createdIds.resources.push(resource._id);
    const missing = await parent.agent.get(`/api/v1/resources/${resource._id}/download`).expect(404);
    expect(missing.body.error.code).toBe("RESOURCE_NOT_READY");
  });

  it("increments version for published admin edits without breaking references", async () => {
    const admin = await adminAgent("version-admin");
    const letter = await modelRegistry.Letter.findOne({ key: "letter-a" }).lean();
    const lessonBefore = await modelRegistry.Lesson.findOne({ letterIds: letter._id }).lean();
    expect(lessonBefore).toBeTruthy();

    const updated = await admin.agent
      .patch(`/api/v1/admin/letters/${letter._id}`)
      .set(csrfHeaders(admin.csrf))
      .send({ title: `Version test ${Date.now()}` })
      .expect(200);
    expect(updated.body.data.id).toBe(String(letter._id));
    expect(updated.body.data.version).toBeGreaterThan(letter.version);
    expect(updated.body.data.status).toBe("draft");

    const lessonAfter = await modelRegistry.Lesson.findById(lessonBefore._id).lean();
    expect(lessonAfter.letterIds.map(String)).toContain(String(letter._id));
  });

  async function adminAgent(prefix) {
    const email = testEmail(prefix);
    createdEmails.add(email);
    await modelRegistry.User.create({
      emailNormalized: email,
      displayName: "Admin Test",
      passwordHash: await bcrypt.hash("Password123!", 4),
      parentPinHash: await bcrypt.hash("1234", 4),
      role: "admin",
      consent: { termsVersion: "test", acceptedAt: new Date() }
    });
    const login = await loginAgent(email, "Password123!");
    await openGate(login.agent, login.csrf, "1234");
    return login;
  }

  async function parentAgent(prefix) {
    const agent = request.agent(app);
    const csrf = await getCsrf(agent);
    const email = testEmail(prefix);
    createdEmails.add(email);
    const response = await agent.post("/api/v1/auth/register").set(csrfHeaders(csrf)).send(registerPayload(email)).expect(201);
    return { agent, csrf, email, childId: response.body.data.child.id };
  }

  async function loginAgent(email, password) {
    const agent = request.agent(app);
    const csrf = await getCsrf(agent);
    await agent.post("/api/v1/auth/login").set(csrfHeaders(csrf)).send({ email, password, rememberMe: false }).expect(200);
    return { agent, csrf, email };
  }

  async function openGate(agent, csrf, pin) {
    return agent.post("/api/v1/auth/parent-gate").set(csrfHeaders(csrf)).send({ pin }).expect(200);
  }

  async function getCsrf(agent) {
    const response = await agent.get("/api/v1/auth/csrf").expect(200);
    return response.body.data.csrfToken;
  }

  function csrfHeaders(token) {
    return { "X-CSRF-Token": token, Origin: origin };
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
      modelRegistry.Recording.deleteMany({})
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
    await modelRegistry.PinAttempt.deleteMany({ userId: user._id });
    await modelRegistry.ChildProfile.deleteMany({ parentId: user._id });
    await modelRegistry.User.deleteOne({ _id: user._id });
  }
});
