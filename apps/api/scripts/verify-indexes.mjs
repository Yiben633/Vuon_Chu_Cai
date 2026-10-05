import mongoose from "mongoose";

process.env.MONGODB_URI ??= "mongodb://localhost:27017/vuon_chu_test?replicaSet=rs0";
process.env.SESSION_SECRET ??= "verify_indexes_placeholder_secret_at_least_32_bytes";

const { connectDatabase, disconnectDatabase, getDatabaseState } = await import("../src/lib/database.js");
const { modelRegistry } = await import("../src/models/index.js");

const marker = `verify-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const childId = new mongoose.Types.ObjectId();
const rewardId = new mongoose.Types.ObjectId();
const exerciseId = new mongoose.Types.ObjectId();
const contentId = new mongoose.Types.ObjectId();

await connectDatabase();
const db = getDatabaseState();
if (!db.ready) {
  console.error(JSON.stringify({ status: "BLOCKED", db }, null, 2));
  await disconnectDatabase();
  process.exit(1);
}

const checks = [];

try {
  const email = `${marker}@example.test`;
  await modelRegistry.User.create({
    emailNormalized: email,
    displayName: "Verify Parent",
    passwordHash: "hashed-password",
    parentPinHash: "hashed-pin",
    consent: { termsVersion: "test", acceptedAt: new Date() }
  });
  await expectDuplicate("duplicate email", () =>
    modelRegistry.User.create({
      emailNormalized: email,
      displayName: "Verify Parent 2",
      passwordHash: "hashed-password",
      parentPinHash: "hashed-pin",
      consent: { termsVersion: "test", acceptedAt: new Date() }
    })
  );

  const projectedUser = await modelRegistry.User.findOne({ emailNormalized: email }).lean();
  checks.push({
    name: "hash projection",
    ok: projectedUser.passwordHash === undefined && projectedUser.parentPinHash === undefined
  });

  await modelRegistry.RewardLedger.create({
    childId,
    eventKey: marker,
    kind: "quiz",
    delta: 5,
    sourceId: exerciseId,
    sourceVersion: 1,
    dayKey: "2026-10-06"
  });
  await expectDuplicate("duplicate reward ledger child+event", () =>
    modelRegistry.RewardLedger.create({
      childId,
      eventKey: marker,
      kind: "quiz",
      delta: 5,
      sourceId: exerciseId,
      sourceVersion: 1,
      dayKey: "2026-10-06"
    })
  );

  await modelRegistry.LearningSession.create({
    childId,
    type: "quiz",
    contentId,
    contentVersion: 1,
    status: "active",
    dayKey: "2026-10-06"
  });
  await expectDuplicate("duplicate active learning session", () =>
    modelRegistry.LearningSession.create({
      childId,
      type: "quiz",
      contentId: new mongoose.Types.ObjectId(),
      contentVersion: 1,
      status: "active",
      dayKey: "2026-10-06"
    })
  );

  await modelRegistry.Inventory.create({
    childId,
    rewardId,
    cosmeticType: "hat",
    equipped: false
  });
  await expectDuplicate("duplicate inventory child+reward", () =>
    modelRegistry.Inventory.create({
      childId,
      rewardId,
      cosmeticType: "hat",
      equipped: false
    })
  );

  const failed = checks.filter((check) => !check.ok);
  console.log(JSON.stringify({ status: failed.length ? "FAIL" : "PASS", checks }, null, 2));
  process.exitCode = failed.length ? 1 : 0;
} finally {
  await cleanup();
  await disconnectDatabase();
}

async function expectDuplicate(name, operation) {
  try {
    await operation();
    checks.push({ name, ok: false, reason: "duplicate write succeeded" });
  } catch (error) {
    checks.push({ name, ok: error.code === 11000, code: error.code, message: error.message });
  }
}

async function cleanup() {
  await Promise.all([
    modelRegistry.User.deleteMany({ emailNormalized: new RegExp(`^${escapeRegExp(marker)}@`) }),
    modelRegistry.RewardLedger.deleteMany({ childId }),
    modelRegistry.LearningSession.deleteMany({ childId }),
    modelRegistry.Inventory.deleteMany({ childId })
  ]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
