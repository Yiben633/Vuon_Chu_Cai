import http from "node:http";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase, getDatabaseState } from "./lib/database.js";
import { logError, logInfo } from "./lib/logger.js";
import { createApp } from "./app.js";

await connectDatabase();

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () => {
  const db = getDatabaseState();
  logInfo("API listening", {
    port: env.PORT,
    dbReady: db.ready,
    dbReason: db.reason,
    message: db.ready ? "API ready" : "API live nhưng chưa ready vì DB chưa sẵn sàng"
  });
});

async function shutdown(signal) {
  logInfo("shutdown requested", { signal });
  server.close(async (error) => {
    if (error) {
      logError("server close failed", { error: error.message });
      process.exit(1);
    }

    await disconnectDatabase();
    process.exit(0);
  });

  setTimeout(() => {
    logError("forced shutdown timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
