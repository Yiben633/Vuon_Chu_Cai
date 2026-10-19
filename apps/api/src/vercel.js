import { createApp } from "./app.js";
import { connectDatabase, getDatabaseState } from "./lib/database.js";

let appPromise;

function loadApp() {
  appPromise ??= connectDatabase()
    .then(() => {
      const database = getDatabaseState();
      if (!database.ready) {
        throw new Error(`MongoDB chưa sẵn sàng: ${database.reason}`);
      }
      return createApp();
    })
    .catch((error) => {
      appPromise = undefined;
      throw error;
    });

  return appPromise;
}

export default async function vercelHandler(request, response) {
  const app = await loadApp();
  return app(request, response);
}
