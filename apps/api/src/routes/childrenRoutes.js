import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendData, sendNoContent } from "../lib/http.js";
import { requireOwnedChild, requireParentGate } from "../middleware/authMiddleware.js";
import {
  createChildSchema,
  parseBody,
  updateChildSchema,
  updateChildSettingsSchema,
  voiceConsentSchema
} from "../services/auth/authSchemas.js";
import {
  childParentDto,
  createChildForParent,
  deleteChildProfile,
  findFamilyProfiles,
  updateChild,
  updateChildSettings,
  updateVoiceConsent
} from "../services/auth/authService.js";

export const childrenRoutes = Router();

childrenRoutes.use(requireParentGate);

childrenRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await findFamilyProfiles(req.currentUser._id, { parentView: true });
    sendData(req, res, { items });
  })
);

childrenRoutes.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = parseBody(createChildSchema, req.body);
    const child = await createChildForParent(req.currentUser._id, input);
    sendData(req, res, childParentDto(child), 201);
  })
);

childrenRoutes.get(
  "/:childId",
  requireOwnedChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, childParentDto(req.childProfile));
  })
);

childrenRoutes.patch(
  "/:childId",
  requireOwnedChild,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateChildSchema, req.body);
    const child = await updateChild(req.childProfile, input);
    sendData(req, res, childParentDto(child));
  })
);

childrenRoutes.patch(
  "/:childId/settings",
  requireOwnedChild,
  asyncHandler(async (req, res) => {
    const input = parseBody(updateChildSettingsSchema, req.body);
    const child = await updateChildSettings(req.childProfile, input);
    sendData(req, res, childParentDto(child));
  })
);

childrenRoutes.put(
  "/:childId/voice-consent",
  requireOwnedChild,
  asyncHandler(async (req, res) => {
    const input = parseBody(voiceConsentSchema, req.body);
    const child = await updateVoiceConsent(req.childProfile, input);
    sendData(req, res, childParentDto(child));
  })
);

childrenRoutes.get(
  "/:childId/export",
  requireOwnedChild,
  asyncHandler(async (req, res) => {
    sendData(req, res, { child: childParentDto(req.childProfile), exportedAt: new Date().toISOString() });
  })
);

childrenRoutes.delete(
  "/:childId",
  requireOwnedChild,
  asyncHandler(async (_req, res) => {
    await deleteChildProfile(_req.childProfile);
    sendNoContent(res);
  })
);
