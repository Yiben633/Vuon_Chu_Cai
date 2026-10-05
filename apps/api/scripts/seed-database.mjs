process.env.MONGODB_URI ??= "mongodb://localhost:27017/vuon_chu_dev?replicaSet=rs0";
process.env.SESSION_SECRET ??= "seed_runner_placeholder_secret_at_least_32_bytes";

const dryRun = process.argv.includes("--dry-run");
const forceContent = process.argv.includes("--force-content");

const { connectDatabase, disconnectDatabase, getDatabaseState } = await import("../src/lib/database.js");
const { createDeclaredIndexes, probeTransactions } = await import("../src/services/indexMaintenanceService.js");
const { importSeed } = await import("../src/services/seed/seedDataService.js");

await connectDatabase();
const db = getDatabaseState();

if (!db.ready) {
  console.error(
    JSON.stringify(
      {
        status: "BLOCKED",
        reason: "MongoDB chưa ready hoặc topology không hỗ trợ transaction.",
        db
      },
      null,
      2
    )
  );
  await disconnectDatabase();
  process.exit(1);
}

const transactionProbe = await probeTransactions();
if (!transactionProbe.ok) {
  console.error(JSON.stringify({ status: "BLOCKED", transactionProbe }, null, 2));
  await disconnectDatabase();
  process.exit(1);
}

if (!dryRun) await createDeclaredIndexes();

try {
  const result = await importSeed({ dryRun, forceContent });
  console.log(JSON.stringify({ status: result.status, transactionProbe, seed: result }, null, 2));
  if (result.status === "FAIL" || result.status === "PARTIAL") process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ status: "BLOCKED", error: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
