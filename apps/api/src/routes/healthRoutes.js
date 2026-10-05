import { Router } from "express";
import { dbNotReady } from "../lib/apiError.js";
import { getDatabaseState, refreshDatabaseReadiness } from "../lib/database.js";

export const healthRoutes = Router();

healthRoutes.get("/live", (req, res) => {
  res.json({
    data: {
      live: true,
      service: "vuon-chu-api"
    },
    requestId: req.requestId
  });
});

healthRoutes.get("/ready", async (req, res, next) => {
  const db = await refreshDatabaseReadiness();
  if (!db.ready) {
    next(dbNotReady({ reason: db.reason, connected: db.connected, transactionCapable: db.transactionCapable }));
    return;
  }

  res.json({
    data: {
      ready: true,
      db: getDatabaseState()
    },
    requestId: req.requestId
  });
});
