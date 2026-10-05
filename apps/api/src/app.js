import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import MongoStore from "connect-mongo";
import { env } from "./config/env.js";
import { getDatabaseState } from "./lib/database.js";
import { requestIdMiddleware } from "./lib/requestId.js";
import { requestLogger } from "./lib/logger.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { childrenRoutes } from "./routes/childrenRoutes.js";
import { attachCurrentUser } from "./middleware/authMiddleware.js";
import { csrfMiddleware } from "./middleware/csrfMiddleware.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware.js";

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY > 0) {
    app.set("trust proxy", env.TRUST_PROXY);
  }

  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(express.json({ limit: "1mb" }));

  const sessionOptions = {
    name: env.SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000
    }
  };

  app.set("sessionCookieName", env.SESSION_COOKIE_NAME);

  if (getDatabaseState().ready) {
    sessionOptions.store = MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      ttl: env.SESSION_TTL_HOURS * 60 * 60,
      autoRemove: "native",
      touchAfter: 24 * 3600
    });
  }

  app.use(session(sessionOptions));
  app.use(attachCurrentUser);
  app.use(csrfMiddleware);

  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/children", childrenRoutes);
  app.use("/api/v1", notFoundMiddleware);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
