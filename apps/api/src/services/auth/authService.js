import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { errorCodes, userRoles } from "@vuon-chu/contracts";
import { env } from "../../config/env.js";
import { ApiError, forbidden, unauthenticated } from "../../lib/apiError.js";
import { modelRegistry } from "../../models/index.js";
import { normalizeEmail } from "../../models/utils/normalization.js";
import { mapMongoDuplicateError } from "../../models/utils/errors.js";
import { symbolPinToSecret } from "./authSchemas.js";

const WELCOME_ACORNS = 50;
const PIN_MAX_FAILURES = 5;
const PIN_WINDOW_MINUTES = 15;
const PIN_LOCK_MINUTES = 15;

export function userDto(user, { includeEmail = false } = {}) {
  return {
    id: String(user._id ?? user.id),
    role: user.role,
    displayName: user.displayName,
    ...(includeEmail ? { email: user.emailNormalized } : {})
  };
}

export function childPublicDto(child) {
  return {
    id: String(child._id ?? child.id),
    nickname: child.nickname,
    ageBand: child.ageBand,
    mascotKey: child.mascotKey
  };
}

export function childParentDto(child) {
  return {
    ...childPublicDto(child),
    dialect: child.dialect,
    settings: child.settings,
    voiceConsent: child.voiceConsent
  };
}

export async function registerFamily(input) {
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      const emailNormalized = normalizeEmail(input.parent.email);
      const passwordHash = await bcrypt.hash(input.parent.password, 12);
      const parentPinHash = await bcrypt.hash(input.parent.pin, 12);
      const [user] = await modelRegistry.User.create(
        [
          {
            emailNormalized,
            displayName: input.parent.displayName,
            passwordHash,
            parentPinHash,
            role: userRoles.parent,
            consent: {
              termsVersion: input.consent.termsVersion,
              acceptedAt: new Date()
            }
          }
        ],
        { session }
      );
      const [child] = await modelRegistry.ChildProfile.create([{ ...input.child, parentId: user._id }], { session });
      await modelRegistry.Wallet.create([{ childId: child._id, balance: WELCOME_ACORNS, earnedTotal: WELCOME_ACORNS, spentTotal: 0 }], {
        session
      });
      await modelRegistry.RewardLedger.create(
        [
          {
            childId: child._id,
            eventKey: "welcome",
            kind: "welcome",
            delta: WELCOME_ACORNS,
            sourceVersion: 1
          }
        ],
        { session }
      );
      created = { user, child };
    });
    return created;
  } catch (error) {
    throw mapMongoDuplicateError(error);
  } finally {
    await session.endSession();
  }
}

export async function loginWithPassword({ email, password }) {
  const user = await modelRegistry.User.findOne({ emailNormalized: normalizeEmail(email), status: "active" })
    .select("+passwordHash")
    .lean();

  if (!user) throw unauthenticated("Email hoac mat khau khong dung.");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthenticated("Email hoac mat khau khong dung.");
  return user;
}

export async function findFamilyProfiles(userId, { parentView = false } = {}) {
  const children = await modelRegistry.ChildProfile.find({ parentId: userId, deletedAt: null }).sort({ createdAt: 1 }).lean();
  return children.map((child) => (parentView ? childParentDto(child) : childPublicDto(child)));
}

export async function assertChildOwner(userId, childId) {
  const child = await modelRegistry.ChildProfile.findOne({ _id: childId, parentId: userId, deletedAt: null }).select("+symbolPinHash");
  if (!child) throw new ApiError(404, errorCodes.NOT_FOUND, "Khong tim thay ho so be.");
  return child;
}

export async function verifySymbolPinIfNeeded(child, symbolPin) {
  if (!child.symbolPinHash) return;
  const secret = symbolPinToSecret(symbolPin);
  if (!secret) throw forbidden("Can ma bieu tuong cua be.");
  const ok = await bcrypt.compare(secret, child.symbolPinHash);
  if (!ok) throw forbidden("Ma bieu tuong khong dung.");
}

export async function verifyParentPin(user, pin) {
  const now = new Date();
  const attempts = await getPinAttempt(user._id);
  if (attempts.blockedUntil && attempts.blockedUntil > now) {
    throw new ApiError(429, errorCodes.PIN_LOCKED, "PIN dang bi khoa tam thoi.", {
      blockedUntil: attempts.blockedUntil.toISOString()
    });
  }

  const fullUser = await modelRegistry.User.findById(user._id).select("+parentPinHash").lean();
  const ok = await bcrypt.compare(pin, fullUser.parentPinHash);
  if (ok) {
    await modelRegistry.PinAttempt.deleteOne({ userId: user._id, purpose: "parent-gate" });
    return true;
  }

  const failures = attempts.failures + 1;
  const blockedUntil = failures >= PIN_MAX_FAILURES ? new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000) : null;
  await modelRegistry.PinAttempt.updateOne(
    { userId: user._id, purpose: "parent-gate" },
    {
      $set: {
        failures,
        blockedUntil,
        expiresAt: new Date(Date.now() + PIN_WINDOW_MINUTES * 60 * 1000)
      },
      $setOnInsert: { userId: user._id, purpose: "parent-gate" }
    },
    { upsert: true, runValidators: true }
  );

  if (blockedUntil) {
    throw new ApiError(429, errorCodes.PIN_LOCKED, "PIN dang bi khoa tam thoi.", {
      blockedUntil: blockedUntil.toISOString()
    });
  }
  throw forbidden("PIN khong dung.");
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await modelRegistry.User.findById(userId).select("+passwordHash");
  if (!user) throw unauthenticated();
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw unauthenticated("Mat khau hien tai khong dung.");
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.authVersion += 1;
  await user.save();
  return user;
}

export async function changeParentPin(userId, { currentPassword, currentPin, newPin }) {
  const user = await modelRegistry.User.findById(userId).select("+passwordHash +parentPinHash");
  if (!user) throw unauthenticated();
  const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
  const pinOk = await bcrypt.compare(currentPin, user.parentPinHash);
  if (!passwordOk || !pinOk) throw unauthenticated("Thong tin xac thuc hien tai khong dung.");
  user.parentPinHash = await bcrypt.hash(newPin, 12);
  user.authVersion += 1;
  await user.save();
  await modelRegistry.PinAttempt.deleteOne({ userId: user._id, purpose: "parent-gate" });
  return user;
}

export async function createChildForParent(parentId, input) {
  const count = await modelRegistry.ChildProfile.countDocuments({ parentId, deletedAt: null });
  if (count >= 5) throw new ApiError(409, errorCodes.SESSION_CONFLICT, "Moi tai khoan toi da 5 ho so be.");
  return modelRegistry.ChildProfile.create({ ...input, parentId });
}

export async function updateChild(child, input) {
  Object.assign(child, input);
  await child.save();
  return child;
}

export async function updateChildSettings(child, input) {
  if (input.dialect) child.dialect = input.dialect;
  const settings = { ...(child.settings?.toObject?.() ?? child.settings ?? {}) };
  for (const [key, value] of Object.entries(input)) {
    if (key !== "dialect" && value !== undefined) settings[key] = value;
  }
  child.settings = settings;
  await child.save();
  return child;
}

export async function updateVoiceConsent(child, input) {
  child.voiceConsent = {
    recordingEnabled: input.recordingEnabled,
    cloudProcessingEnabled: input.cloudProcessingEnabled,
    version: input.consentVersion,
    acceptedAt: new Date()
  };
  await child.save();
  return child;
}

export async function deleteChildProfile(child) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const childId = child._id;
      await modelRegistry.LearningSession.deleteMany({ childId }, { session });
      await modelRegistry.Attempt.deleteMany({ childId }, { session });
      await modelRegistry.ChildProgress.deleteMany({ childId }, { session });
      await modelRegistry.DailyStats.deleteMany({ childId }, { session });
      await modelRegistry.Wallet.deleteMany({ childId }, { session });
      await modelRegistry.RewardLedger.deleteMany({ childId }, { session });
      await modelRegistry.Inventory.deleteMany({ childId }, { session });
      await modelRegistry.ChildBadge.deleteMany({ childId }, { session });
      await modelRegistry.MissionClaim.deleteMany({ childId }, { session });
      await modelRegistry.Recording.deleteMany({ childId }, { session });
      await modelRegistry.ChildProfile.deleteOne({ _id: childId }, { session });
    });
  } finally {
    await session.endSession();
  }
}

export function authMeDto(req) {
  return {
    user: userDto(req.currentUser, { includeEmail: req.session.mode !== "child" }),
    mode: req.session.mode ?? "parent",
    currentChildId: req.session.currentChildId ?? null,
    parentGateExpiresAt: req.session.parentGateUntil ?? null
  };
}

export function ttlMinutesForGate() {
  return env.PARENT_GATE_TTL_MINUTES;
}

async function getPinAttempt(userId) {
  const expiresAt = new Date(Date.now() + PIN_WINDOW_MINUTES * 60 * 1000);
  const doc = await modelRegistry.PinAttempt.findOneAndUpdate(
    { userId, purpose: "parent-gate" },
    { $setOnInsert: { userId, purpose: "parent-gate", failures: 0, expiresAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return doc;
}
