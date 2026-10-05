process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/vuon_chu_dev?replicaSet=rs0";
process.env.SESSION_SECRET ??= "index_runner_placeholder_secret_at_least_32_bytes";

const dryRun = process.argv.includes("--dry-run");

const { connectDatabase, disconnectDatabase, getDatabaseState } = await import("../src/lib/database.js");
const { getIndexPlan, createDeclaredIndexes, probeTransactions } = await import(
  "../src/services/indexMaintenanceService.js"
);

if (dryRun) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        wouldCreateIndexes: getIndexPlan()
      },
      null,
      2
    )
  );
  process.exit(0);
}

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

const indexResults = await createDeclaredIndexes();
console.log(JSON.stringify({ status: "DONE", transactionProbe, indexResults }, null, 2));
await disconnectDatabase();
