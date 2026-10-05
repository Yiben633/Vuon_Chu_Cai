process.env.MONGODB_URI ??= "mongodb://localhost:27017/vuon_chu_dev?replicaSet=rs0";
process.env.SESSION_SECRET ??= "demo_runner_placeholder_secret_at_least_32_bytes";

const { connectDatabase, disconnectDatabase, getDatabaseState } = await import("../src/lib/database.js");
const { createDemoFamily } = await import("../src/services/seed/seedDataService.js");

await connectDatabase();
const db = getDatabaseState();
if (!db.ready) {
  console.error(JSON.stringify({ status: "BLOCKED", db }, null, 2));
  await disconnectDatabase();
  process.exit(1);
}

try {
  const result = await createDemoFamily();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "BLOCKED", error: error.message }, null, 2));
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
