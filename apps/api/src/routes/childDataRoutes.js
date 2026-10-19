import { Router } from "express";
import rateLimit from "express-rate-limit";
import { errorCodes } from "@vuon-chu/contracts";
import { ApiError } from "../lib/apiError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendData } from "../lib/http.js";
import { requireAuth, requireChild, requireParentGate } from "../middleware/authMiddleware.js";
import { parseBody, redeemSchema } from "../services/learning/learningSchemas.js";
import {
  assertChildAccess,
  assertCurrentChild,
  claimMission,
  equipInventoryItem,
  getAttemptsReport,
  getDailyReport,
  getInventory,
  getLedger,
  getProgressOverview,
  getWallet,
  listBadges,
  listMissions,
  listRewards,
  redeemReward
} from "../services/learning/childDataService.js";
import {
  getRecordingCapability,
  listChildRecordings,
  markRecordingDeleting,
  rejectRecordingUpload
} from "../services/learning/recordingService.js";
import {
  getSpeechCapability,
  parseSpeechAssessment,
  rejectOrAssessSpeech
} from "../services/learning/speechService.js";

export const childDataRoutes = Router();

const speechLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: errorCodes.RATE_LIMITED,
      message: "Thu nhan dien giong noi qua nhanh. Vui long nghi mot chut roi thu lai."
    }
  }
});

childDataRoutes.get(
  "/rewards",
  requireAuth,
  asyncHandler(async (req, res) => {
    sendData(req, res, await listRewards());
  })
);

childDataRoutes.get(
  "/children/:childId/progress",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await getProgressOverview(req.params.childId));
  })
);

childDataRoutes.get(
  "/children/:childId/wallet",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await getWallet(req.params.childId));
  })
);

childDataRoutes.get(
  "/children/:childId/reward-ledger",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await getLedger(req.params.childId, req.query));
  })
);

childDataRoutes.get(
  "/children/:childId/inventory",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await getInventory(req.params.childId));
  })
);

childDataRoutes.post(
  "/children/:childId/redeem",
  validateChildId,
  requireChild,
  asyncHandler(async (req, res) => {
    assertCurrentChild(req, req.params.childId);
    const input = parseBody(redeemSchema, req.body);
    sendData(req, res, await redeemReward(req.params.childId, input));
  })
);

childDataRoutes.patch(
  "/children/:childId/inventory/:itemId/equip",
  validateChildId,
  validateItemId,
  requireChild,
  asyncHandler(async (req, res) => {
    assertCurrentChild(req, req.params.childId);
    sendData(req, res, await equipInventoryItem(req.params.childId, req.params.itemId));
  })
);

childDataRoutes.get(
  "/children/:childId/badges",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await listBadges(req.params.childId));
  })
);

childDataRoutes.get(
  "/children/:childId/missions",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await listMissions(req.params.childId));
  })
);

childDataRoutes.post(
  "/children/:childId/missions/:missionId/claim",
  validateChildId,
  validateMissionId,
  requireChild,
  asyncHandler(async (req, res) => {
    assertCurrentChild(req, req.params.childId);
    sendData(req, res, await claimMission(req.params.childId, req.params.missionId));
  })
);

childDataRoutes.get(
  "/children/:childId/reports/overview",
  validateChildId,
  requireParentGate,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await getProgressOverview(req.params.childId));
  })
);

childDataRoutes.get(
  "/children/:childId/reports/daily",
  validateChildId,
  requireParentGate,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await getDailyReport(req.params.childId, req.query));
  })
);

childDataRoutes.get(
  "/children/:childId/reports/attempts",
  validateChildId,
  requireParentGate,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await getAttemptsReport(req.params.childId, req.query));
  })
);

childDataRoutes.get(
  "/children/:childId/recordings/capability",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, getRecordingCapability(req.childProfile));
  })
);

childDataRoutes.get(
  "/children/:childId/recordings",
  validateChildId,
  requireParentGate,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await listChildRecordings(req.params.childId, req.childProfile));
  })
);

childDataRoutes.post(
  "/children/:childId/recordings",
  validateChildId,
  requireChild,
  loadAccessibleChild,
  asyncHandler(async (req, _res) => {
    assertCurrentChild(req, req.params.childId);
    await rejectRecordingUpload(req.childProfile);
  })
);

childDataRoutes.delete(
  "/children/:childId/recordings/:recordingId",
  validateChildId,
  validateRecordingId,
  requireParentGate,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, await markRecordingDeleting(req.params.childId, req.params.recordingId));
  })
);

childDataRoutes.get(
  "/children/:childId/speech/capability",
  validateChildId,
  requireAuth,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, getSpeechCapability(req.childProfile));
  })
);

childDataRoutes.post(
  "/children/:childId/speech/assess",
  validateChildId,
  speechLimiter,
  requireChild,
  loadAccessibleChild,
  asyncHandler(async (req, res) => {
    assertCurrentChild(req, req.params.childId);
    const input = parseSpeechAssessment(req.body);
    sendData(req, res, await rejectOrAssessSpeech(req.childProfile, input), 202);
  })
);

async function loadAccessibleChild(req, _res, next) {
  try {
    req.childProfile = await assertChildAccess(req, req.params.childId);
    next();
  } catch (error) {
    next(error);
  }
}

function validateChildId(req, _res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.childId)) {
    next(new ApiError(400, errorCodes.VALIDATION_ERROR, "childId khong hop le."));
    return;
  }
  next();
}

function validateItemId(req, _res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.itemId)) {
    next(new ApiError(400, errorCodes.VALIDATION_ERROR, "itemId khong hop le."));
    return;
  }
  next();
}

function validateMissionId(req, _res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.missionId)) {
    next(new ApiError(400, errorCodes.VALIDATION_ERROR, "missionId khong hop le."));
    return;
  }
  next();
}

function validateRecordingId(req, _res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.recordingId)) {
    next(new ApiError(400, errorCodes.VALIDATION_ERROR, "recordingId khong hop le."));
    return;
  }
  next();
}
