import { connectDatabase, disconnectDatabase } from "../src/lib/database.js";
import { modelRegistry } from "../src/models/index.js";
import { rebuildChildAggregates } from "../src/services/learning/childDataService.js";

const childId = process.argv.find((arg) => arg.startsWith("--childId="))?.split("=")[1];

if (!childId) {
  console.error("Usage: npm run db:rebuild-aggregates --workspace @vuon-chu/api -- --childId=<ObjectId>");
  process.exitCode = 1;
} else {
  await connectDatabase();
  const child = await modelRegistry.ChildProfile.findById(childId).lean();
  if (!child) {
    console.error(`Child not found: ${childId}`);
    process.exitCode = 1;
  } else {
    const result = await rebuildChildAggregates(childId);
    console.log(JSON.stringify(result, null, 2));
  }
  await disconnectDatabase();
}
