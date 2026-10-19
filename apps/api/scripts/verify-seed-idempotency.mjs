process.env.MONGODB_URI ??= "mongodb://localhost:27017/vuon_chu_dev?replicaSet=rs0";
process.env.SESSION_SECRET ??= "seed_verify_placeholder_secret_at_least_32_bytes";

import bcrypt from "bcryptjs";

const { connectDatabase, disconnectDatabase, getDatabaseState } = await import("../src/lib/database.js");
const { modelRegistry } = await import("../src/models/index.js");
const { createDeclaredIndexes } = await import("../src/services/indexMaintenanceService.js");
const { canonicalHash } = await import("../src/services/learning/learningService.js");
const { getSeedCollectionCounts, importSeed } = await import("../src/services/seed/seedDataService.js");

const markerEmail = "seed-preserve-check@example.test";
const dayKey = "2026-10-06";

await connectDatabase();
const db = getDatabaseState();
if (!db.ready) {
  console.error(JSON.stringify({ status: "BLOCKED", db }, null, 2));
  await disconnectDatabase();
  process.exit(1);
}

try {
  await createDeclaredIndexes();
  const before = await getSeedCollectionCounts();
  const exercise = await modelRegistry.Exercise.findOne().select("+answer").lean();
  if (!exercise) throw new Error("Cần seed nội dung trước khi chạy verify-seed-idempotency.");

  await cleanupMarker();
  const passwordHash = await bcrypt.hash("marker-password", 4);
  const pinHash = await bcrypt.hash("1234", 4);
  const [user] = await modelRegistry.User.create([
    {
      emailNormalized: markerEmail,
      displayName: "Seed Preserve Check",
      passwordHash,
      parentPinHash: pinHash,
      consent: { termsVersion: "local-check", acceptedAt: new Date() }
    }
  ]);
  const [child] = await modelRegistry.ChildProfile.create([
    {
      parentId: user._id,
      nickname: "Check",
      ageBand: "4-5",
      dialect: "north",
      mascotKey: "mascot-check"
    }
  ]);
  const [session] = await modelRegistry.LearningSession.create([
    {
      childId: child._id,
      type: "quiz",
      contentId: exercise._id,
      contentVersion: exercise.version,
      status: "completed",
      dayKey,
      completedAt: new Date()
    }
  ]);
  await modelRegistry.Attempt.create({
    childId: child._id,
    sessionId: session._id,
    exerciseId: exercise._id,
    contentVersion: exercise.version,
    attemptNo: 1,
    idempotencyKey: "seed-preserve-attempt",
    requestHash: canonicalHash({ marker: "seed-preserve-attempt", optionId: exercise.answer.optionId }),
    response: { optionId: exercise.answer.optionId },
    isCorrect: true,
    dayKey
  });
  await modelRegistry.Wallet.create({ childId: child._id, balance: 5, earnedTotal: 15, spentTotal: 10 });
  await modelRegistry.RewardLedger.create({
    childId: child._id,
    eventKey: "seed-preserve-redemption",
    kind: "redeem",
    delta: -10,
    sourceVersion: 1,
    dayKey
  });

  const seedResult = await importSeed({ dryRun: false });
  const after = await getSeedCollectionCounts();
  const markerStillExists = Boolean(await modelRegistry.Attempt.exists({ childId: child._id }));
  const wallet = await modelRegistry.Wallet.findOne({ childId: child._id }).lean();
  const ledgerStillExists = Boolean(await modelRegistry.RewardLedger.exists({ childId: child._id, eventKey: "seed-preserve-redemption" }));

  const ok =
    seedResult.status === "DONE" &&
    JSON.stringify(before) === JSON.stringify(after) &&
    markerStillExists &&
    ledgerStillExists &&
    wallet?.balance === 5 &&
    wallet?.spentTotal === 10;

  console.log(
    JSON.stringify(
      {
        status: ok ? "PASS" : "FAIL",
        seedStatus: seedResult.status,
        seedCountsBefore: before,
        seedCountsAfter: after,
        personalDataPreserved: { markerStillExists, ledgerStillExists, walletBalance: wallet?.balance, spentTotal: wallet?.spentTotal }
      },
      null,
      2
    )
  );
  if (!ok) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ status: "BLOCKED", error: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  await cleanupMarker();
  await disconnectDatabase();
}

async function cleanupMarker() {
  const user = await modelRegistry.User.findOne({ emailNormalized: markerEmail }).lean();
  if (!user) return;
  const children = await modelRegistry.ChildProfile.find({ parentId: user._id }).select("_id").lean();
  const childIds = children.map((child) => child._id);
  await modelRegistry.Attempt.deleteMany({ childId: { $in: childIds } });
  await modelRegistry.LearningSession.deleteMany({ childId: { $in: childIds } });
  await modelRegistry.Wallet.deleteMany({ childId: { $in: childIds } });
  await modelRegistry.RewardLedger.deleteMany({ childId: { $in: childIds } });
  await modelRegistry.ChildProfile.deleteMany({ parentId: user._id });
  await modelRegistry.User.deleteOne({ _id: user._id });
}
