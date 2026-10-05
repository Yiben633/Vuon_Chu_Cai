import { z } from "zod";
import { childProfileInputSchema, loginSchema, parentPinSchema, passwordSchema, registerSchema } from "@vuon-chu/contracts";
import { validationError } from "../../lib/apiError.js";

export { loginSchema, registerSchema };

export const enterChildSchema = z.object({
  childId: z.string().regex(/^[a-f\d]{24}$/i),
  symbolPin: z.array(z.string().trim().min(1).max(32)).length(4).optional()
});

export const parentGateSchema = z.object({
  pin: parentPinSchema
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema
});

export const pinChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  currentPin: parentPinSchema,
  newPin: parentPinSchema
});

export const createChildSchema = childProfileInputSchema;

export const updateChildSchema = z.object({
  nickname: z.string().trim().min(1).max(30).optional(),
  mascotKey: z.string().trim().min(1).max(64).optional(),
  ageBand: childProfileInputSchema.shape.ageBand.optional()
});

export const updateChildSettingsSchema = z.object({
  dailyLimitMinutes: z.number().int().min(15).max(60).optional(),
  breakEveryMinutes: z.number().int().min(10).max(20).optional(),
  breakSeconds: z.number().int().min(20).max(300).optional(),
  ambienceEnabled: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
  dialect: childProfileInputSchema.shape.dialect.optional()
});

export const voiceConsentSchema = z.object({
  recordingEnabled: z.boolean(),
  cloudProcessingEnabled: z.boolean(),
  consentVersion: z.string().trim().min(1).max(32)
});

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }));
    throw validationError(details);
  }
  return result.data;
}

export function symbolPinToSecret(symbolPin) {
  return Array.isArray(symbolPin) ? symbolPin.join("|") : null;
}
