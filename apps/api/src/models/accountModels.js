import mongoose from "mongoose";
import { ageBands, dialects, userRoles } from "@vuon-chu/contracts";
import { createSchema, objectId } from "./utils/schema.js";
import { normalizeEmail } from "./utils/normalization.js";

const userSchema = createSchema({
  emailNormalized: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    set: normalizeEmail
  },
  displayName: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
  passwordHash: { type: String, required: true, select: false },
  parentPinHash: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(userRoles), required: true, default: userRoles.parent },
  status: { type: String, enum: ["active", "deleting", "disabled"], required: true, default: "active" },
  phone: { type: String, trim: true, maxlength: 32, default: null },
  consent: {
    termsVersion: { type: String, required: true, trim: true, maxlength: 32 },
    acceptedAt: { type: Date, required: true }
  },
  authVersion: { type: Number, required: true, min: 1, default: 1 }
});

userSchema.index({ emailNormalized: 1 }, { unique: true, name: "uniq_users_email_normalized" });
userSchema.index({ status: 1, createdAt: -1 }, { name: "idx_users_status_created" });

const childSettingsSchema = new mongoose.Schema(
  {
    dailyLimitMinutes: { type: Number, min: 15, max: 60, default: 30 },
    breakEveryMinutes: { type: Number, min: 10, max: 20, default: 20 },
    breakSeconds: { type: Number, min: 20, max: 300, default: 20 },
    ambienceEnabled: { type: Boolean, default: true },
    volume: { type: Number, min: 0, max: 1, default: 0.8 }
  },
  { _id: false, strict: "throw" }
);

const voiceConsentSchema = new mongoose.Schema(
  {
    recordingEnabled: { type: Boolean, default: false },
    cloudProcessingEnabled: { type: Boolean, default: false },
    version: { type: String, trim: true, maxlength: 32, default: null },
    acceptedAt: { type: Date, default: null }
  },
  { _id: false, strict: "throw" }
);

const childProfileSchema = createSchema({
  parentId: { type: objectId, ref: "User", required: true, index: true },
  nickname: { type: String, required: true, trim: true, minlength: 1, maxlength: 30 },
  ageBand: { type: String, enum: ageBands, required: true },
  dialect: { type: String, enum: dialects, required: true },
  mascotKey: { type: String, required: true, trim: true, maxlength: 64 },
  symbolPinHash: { type: String, select: false, default: null },
  settings: { type: childSettingsSchema, default: () => ({}) },
  voiceConsent: { type: voiceConsentSchema, default: () => ({}) },
  deletedAt: { type: Date, default: null }
});

childProfileSchema.index({ parentId: 1, createdAt: -1 }, { name: "idx_child_profiles_parent_created" });

const pinAttemptSchema = createSchema({
  userId: { type: objectId, ref: "User", required: true },
  purpose: { type: String, enum: ["parent-gate", "password", "symbol-pin"], required: true },
  failures: { type: Number, min: 0, required: true, default: 0 },
  blockedUntil: { type: Date, default: null },
  expiresAt: { type: Date, required: true }
});

pinAttemptSchema.index({ userId: 1, purpose: 1 }, { unique: true, name: "uniq_pin_attempts_user_purpose" });
pinAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_pin_attempts_expires" });

export const User = mongoose.model("User", userSchema);
export const ChildProfile = mongoose.model("ChildProfile", childProfileSchema);
export const PinAttempt = mongoose.model("PinAttempt", pinAttemptSchema);
