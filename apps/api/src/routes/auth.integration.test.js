import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const shouldRun = process.env.RUN_MONGO_TESTS === "true";
if (shouldRun) vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

describe.skipIf(!shouldRun)("auth and family API", () => {
  let app;
  let modelRegistry;
  const createdEmails = new Set();
  const origin = "http://localhost:5173";

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.APP_ORIGIN = origin;
    process.env.MONGODB_URI ??= "mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0";
    process.env.SESSION_SECRET ??= "auth_test_session_secret_at_least_32_bytes";
    process.env.PARENT_GATE_TTL_MINUTES = "0.001";

    const database = await import("../lib/database.js");
    await database.connectDatabase();
    const indexes = await import("../services/indexMaintenanceService.js");
    await indexes.createDeclaredIndexes();
    modelRegistry = (await import("../models/index.js")).modelRegistry;
    app = (await import("../app.js")).createApp();
  }, 30000);

  afterAll(async () => {
    for (const email of createdEmails) {
      await cleanupEmail(email);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.collection("sessions").deleteMany({});
    }
    const database = await import("../lib/database.js");
    await database.disconnectDatabase();
  });

  it("registers in a transaction, regenerates session, and rolls back duplicate email", async () => {
    const agent = request.agent(app);
    const csrf = await getCsrf(agent);
    const beforeCookie = csrf.cookie;
    const email = testEmail("register");
    const response = await agent.post("/api/v1/auth/register").set(csrfHeaders(csrf.token)).send(registerPayload(email)).expect(201);
    createdEmails.add(email);

    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.child.nickname).toBe("Be La");
    expect(response.headers["set-cookie"]?.join(";")).not.toBe(beforeCookie);

    const childId = response.body.data.child.id;
    const wallet = await modelRegistry.Wallet.findOne({ childId }).lean();
    const ledger = await modelRegistry.RewardLedger.findOne({ childId, eventKey: "welcome" }).lean();
    expect(wallet.balance).toBe(50);
    expect(ledger.delta).toBe(50);

    const duplicateAgent = request.agent(app);
    const duplicateCsrf = await getCsrf(duplicateAgent);
    await duplicateAgent.post("/api/v1/auth/register").set(csrfHeaders(duplicateCsrf.token)).send(registerPayload(email)).expect(409);
    expect(await modelRegistry.User.countDocuments({ emailNormalized: email })).toBe(1);
  });

  it("rejects missing or invalid CSRF on mutations", async () => {
    const agent = request.agent(app);
    await getCsrf(agent);
    await agent.post("/api/v1/auth/register").set("Origin", origin).send(registerPayload(testEmail("csrf-missing"))).expect(403);
    await agent
      .post("/api/v1/auth/register")
      .set(csrfHeaders("wrong-token"))
      .send(registerPayload(testEmail("csrf-wrong")))
      .expect(403);
  });

  it("rejects bad login and prevents another parent from reading a child", async () => {
    const a = await registerAgent("owner-a");
    const b = await registerAgent("owner-b");

    const loginAgent = request.agent(app);
    const loginCsrf = await getCsrf(loginAgent);
    await loginAgent
      .post("/api/v1/auth/login")
      .set(csrfHeaders(loginCsrf.token))
      .send({ email: a.email, password: "wrong-password", rememberMe: false })
      .expect(401);

    await openGate(a.agent, a.csrf, "1234");
    await a.agent.get(`/api/v1/children/${b.childId}`).expect(404);
  });

  it("blocks parent APIs from child mode", async () => {
    const family = await registerAgent("child-mode");
    await family.agent
      .post("/api/v1/auth/enter-child")
      .set(csrfHeaders(family.csrf))
      .send({ childId: family.childId })
      .expect(200);

    const response = await family.agent.get(`/api/v1/children/${family.childId}`).expect(403);
    expect(response.body.error.code).toBe("PARENT_GATE_REQUIRED");
  });

  it("locks parent gate after repeated bad PIN attempts and expires a valid gate", async () => {
    const family = await registerAgent("pin-lock");
    for (let index = 0; index < 4; index += 1) {
      await family.agent.post("/api/v1/auth/parent-gate").set(csrfHeaders(family.csrf)).send({ pin: "9999" }).expect(403);
    }
    const locked = await family.agent.post("/api/v1/auth/parent-gate").set(csrfHeaders(family.csrf)).send({ pin: "9999" }).expect(429);
    expect(locked.body.error.code).toBe("PIN_LOCKED");

    const expiring = await registerAgent("pin-expire");
    await openGate(expiring.agent, expiring.csrf, "1234");
    await new Promise((resolve) => setTimeout(resolve, 90));
    const response = await expiring.agent.get(`/api/v1/children/${expiring.childId}`).expect(403);
    expect(response.body.error.code).toBe("PARENT_GATE_REQUIRED");
  });

  it("revokes sessions on logout and password change", async () => {
    const family = await registerAgent("revocation");
    await family.agent.post("/api/v1/auth/logout").set(csrfHeaders(family.csrf)).send({}).expect(204);
    await family.agent.get("/api/v1/auth/me").expect(401);

    const first = await loginAgent(family.email, "Password123!");
    const second = await loginAgent(family.email, "Password123!");
    await openGate(first.agent, first.csrf, "1234");
    await first.agent
      .patch("/api/v1/auth/password")
      .set(csrfHeaders(first.csrf))
      .send({ currentPassword: "Password123!", newPassword: "NewPassword123!" })
      .expect(204);

    await first.agent.get("/api/v1/auth/me").expect(401);
    await second.agent.get("/api/v1/auth/me").expect(401);

    const oldLogin = request.agent(app);
    const oldCsrf = await getCsrf(oldLogin);
    await oldLogin
      .post("/api/v1/auth/login")
      .set(csrfHeaders(oldCsrf.token))
      .send({ email: family.email, password: "Password123!", rememberMe: false })
      .expect(401);
    await loginAgent(family.email, "NewPassword123!");
  });

  async function registerAgent(prefix) {
    const agent = request.agent(app);
    const csrf = await getCsrf(agent);
    const email = testEmail(prefix);
    const response = await agent.post("/api/v1/auth/register").set(csrfHeaders(csrf.token)).send(registerPayload(email)).expect(201);
    createdEmails.add(email);
    return { agent, csrf: csrf.token, email, childId: response.body.data.child.id };
  }

  async function loginAgent(email, password) {
    const agent = request.agent(app);
    const csrf = await getCsrf(agent);
    await agent.post("/api/v1/auth/login").set(csrfHeaders(csrf.token)).send({ email, password, rememberMe: false }).expect(200);
    return { agent, csrf: csrf.token };
  }

  async function openGate(agent, csrf, pin) {
    return agent.post("/api/v1/auth/parent-gate").set(csrfHeaders(csrf)).send({ pin }).expect(200);
  }

  async function getCsrf(agent) {
    const response = await agent.get("/api/v1/auth/csrf").expect(200);
    return {
      token: response.body.data.csrfToken,
      cookie: response.headers["set-cookie"]?.join(";") ?? ""
    };
  }

  function csrfHeaders(token) {
    return { "X-CSRF-Token": token, Origin: origin };
  }

  function registerPayload(email) {
    return {
      parent: {
        displayName: "Phu huynh test",
        email,
        password: "Password123!",
        pin: "1234"
      },
      child: {
        nickname: "Be La",
        ageBand: "4-5",
        dialect: "north",
        mascotKey: "mascot-test"
      },
      consent: {
        termsAccepted: true,
        termsVersion: "test-v1"
      }
    };
  }

  function testEmail(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
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
