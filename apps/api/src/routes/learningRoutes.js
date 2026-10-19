import { Router } from "express";
import { errorCodes } from "@vuon-chu/contracts";
import { ApiError } from "../lib/apiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendData } from "../lib/http.js";
import { requireChild } from "../middleware/authMiddleware.js";
import {
  answerSubmissionSchema,
  heartbeatSchema,
  idempotencyBodySchema,
  parseBody,
  startLearningSessionSchema
} from "../services/learning/learningSchemas.js";
import {
  acknowledgeScene,
  completeSession,
  heartbeat,
  pauseSession,
  resumeSession,
  startLearningSession,
  submitAnswer
} from "../services/learning/learningService.js";

export const learningRoutes = Router();

learningRoutes.use(requireChild);

learningRoutes.post(
  "/sessions",
  asyncHandler(async (req, res) => {
    const input = parseBody(startLearningSessionSchema, req.body);
    const data = await startLearningSession(req.session.currentChildId, input, { now: requestNow(req) });
    sendData(req, res, data, 201);
  })
);

learningRoutes.post(
  "/sessions/:sessionId/heartbeat",
  validateSessionId,
  asyncHandler(async (req, res) => {
    const input = parseBody(heartbeatSchema, req.body);
    const data = await heartbeat(req.session.currentChildId, req.params.sessionId, input, { now: requestNow(req) });
    sendData(req, res, data);
  })
);

learningRoutes.post(
  "/sessions/:sessionId/pause",
  validateSessionId,
  asyncHandler(async (req, res) => {
    sendData(req, res, await pauseSession(req.session.currentChildId, req.params.sessionId));
  })
);

learningRoutes.post(
  "/sessions/:sessionId/resume",
  validateSessionId,
  asyncHandler(async (req, res) => {
    sendData(req, res, await resumeSession(req.session.currentChildId, req.params.sessionId, { now: requestNow(req) }));
  })
);

learningRoutes.post(
  "/sessions/:sessionId/answers",
  validateSessionId,
  asyncHandler(async (req, res) => {
    const input = parseBody(answerSubmissionSchema, req.body);
    const data = await submitAnswer(req.session.currentChildId, req.params.sessionId, input, { now: requestNow(req) });
    sendData(req, res, data);
  })
);

learningRoutes.post(
  "/sessions/:sessionId/scenes/:sceneId/ack",
  validateSessionId,
  asyncHandler(async (req, res) => {
    const input = parseBody(idempotencyBodySchema, req.body);
    const data = await acknowledgeScene(req.session.currentChildId, req.params.sessionId, req.params.sceneId, input, {
      now: requestNow(req)
    });
    sendData(req, res, data);
  })
);

learningRoutes.post(
  "/sessions/:sessionId/complete",
  validateSessionId,
  asyncHandler(async (req, res) => {
    const input = parseBody(idempotencyBodySchema, req.body);
    const data = await completeSession(req.session.currentChildId, req.params.sessionId, input, { now: requestNow(req) });
    sendData(req, res, data);
  })
);

function validateSessionId(req, _res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.sessionId)) {
    next(new ApiError(400, errorCodes.VALIDATION_ERROR, "sessionId khong hop le."));
    return;
  }
  next();
}

function requestNow(req) {
  if (process.env.NODE_ENV === "test" && req.get("X-Test-Now")) {
    return new Date(req.get("X-Test-Now"));
  }
  return new Date();
}
