import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendData, sendNoContent } from "../lib/http.js";
import { requireAuth, requireParentGate } from "../middleware/authMiddleware.js";
import {
  enterChildSchema,
  loginSchema,
  parentGateSchema,
  parseBody,
  passwordChangeSchema,
  pinChangeSchema,
  registerSchema
} from "../services/auth/authSchemas.js";
import {
  assertChildOwner,
  authMeDto,
  changeParentPin,
  changePassword,
  childPublicDto,
  findFamilyProfiles,
  loginWithPassword,
  registerFamily,
  ttlMinutesForGate,
  userDto,
  verifyParentPin,
  verifySymbolPinIfNeeded
} from "../services/auth/authService.js";
import {
  clearParentGate,
  destroySession,
  ensureCsrfToken,
  openParentGate,
  regenerateSession,
  saveSession,
  setAuthenticatedSession
} from "../services/auth/sessionService.js";

export const authRoutes = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const parentGateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.session?.userId ?? "guest"}`
});

authRoutes.get(
  "/csrf",
  asyncHandler(async (req, res) => {
    const csrfToken = ensureCsrfToken(req);
    await saveSession(req);
    sendData(req, res, { csrfToken });
  })
);

authRoutes.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = parseBody(registerSchema, req.body);
    const { user, child } = await registerFamily(input);
    await regenerateSession(req);
    setAuthenticatedSession(req, user, { mode: "parent" });
    await saveSession(req);
    sendData(req, res, { user: userDto(user, { includeEmail: true }), child: childPublicDto(child), mode: "parent" }, 201);
  })
);

authRoutes.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(loginSchema, req.body);
    const user = await loginWithPassword(input);
    await regenerateSession(req);
    setAuthenticatedSession(req, user, { rememberMe: input.rememberMe, mode: "parent" });
    await saveSession(req);
    sendData(req, res, { user: userDto(user, { includeEmail: true }), mode: "parent", parentGateExpiresAt: null });
  })
);

authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    sendData(req, res, authMeDto(req));
  })
);

authRoutes.get(
  "/family-profiles",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await findFamilyProfiles(req.currentUser._id);
    sendData(req, res, { items });
  })
);

authRoutes.post(
  "/enter-child",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = parseBody(enterChildSchema, req.body);
    const child = await assertChildOwner(req.currentUser._id, input.childId);
    await verifySymbolPinIfNeeded(child, input.symbolPin);
    await regenerateSession(req);
    setAuthenticatedSession(req, req.currentUser, { mode: "child", currentChildId: String(child._id) });
    await saveSession(req);
    sendData(req, res, { mode: "child", currentChildId: String(child._id), child: childPublicDto(child) });
  })
);

authRoutes.post(
  "/parent-gate",
  requireAuth,
  parentGateLimiter,
  asyncHandler(async (req, res) => {
    const input = parseBody(parentGateSchema, req.body);
    await verifyParentPin(req.currentUser, input.pin, req);
    await regenerateSession(req);
    setAuthenticatedSession(req, req.currentUser, { mode: "parent" });
    const parentGateExpiresAt = openParentGate(req, ttlMinutesForGate());
    await saveSession(req);
    sendData(req, res, { mode: "parent", parentGateExpiresAt });
  })
);

authRoutes.post(
  "/close-parent-gate",
  requireAuth,
  asyncHandler(async (req, res) => {
    clearParentGate(req);
    await saveSession(req);
    sendData(req, res, { mode: req.session.mode ?? "parent", parentGateExpiresAt: null });
  })
);

authRoutes.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await destroySession(req);
    res.clearCookie(req.app.get("sessionCookieName"));
    sendNoContent(res);
  })
);

authRoutes.patch(
  "/password",
  requireParentGate,
  asyncHandler(async (req, res) => {
    const input = parseBody(passwordChangeSchema, req.body);
    await changePassword(req.currentUser._id, input);
    await destroySession(req);
    res.clearCookie(req.app.get("sessionCookieName"));
    sendNoContent(res);
  })
);

authRoutes.patch(
  "/pin",
  requireParentGate,
  asyncHandler(async (req, res) => {
    const input = parseBody(pinChangeSchema, req.body);
    await changeParentPin(req.currentUser._id, input);
    await destroySession(req);
    res.clearCookie(req.app.get("sessionCookieName"));
    sendNoContent(res);
  })
);
