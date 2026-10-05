import { z } from "zod";
import { ageBands, dialects, exerciseTypes, learningSessionTypes } from "./enums.js";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "ObjectId không hợp lệ");

export const emailSchema = z.string().trim().email().max(254);

export const passwordSchema = z.string().min(8).max(128);

export const parentPinSchema = z.string().regex(/^\d{4}$/, "PIN phải gồm 4 chữ số");

export const childProfileInputSchema = z.object({
  nickname: z.string().trim().min(1).max(30),
  ageBand: z.enum(ageBands),
  dialect: z.enum(dialects),
  mascotKey: z.string().trim().min(1).max(64)
});

export const registerSchema = z.object({
  parent: z.object({
    displayName: z.string().trim().min(1).max(80),
    email: emailSchema,
    password: passwordSchema,
    pin: parentPinSchema
  }),
  child: childProfileInputSchema,
  consent: z.object({
    termsAccepted: z.literal(true),
    termsVersion: z.string().trim().min(1).max(32)
  })
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false)
});

export const startLearningSessionSchema = z.object({
  type: z.enum(learningSessionTypes),
  contentId: objectIdSchema,
  gameType: z.string().trim().max(64).optional()
});

export const answerSubmissionSchema = z.object({
  exerciseId: objectIdSchema,
  attemptNo: z.number().int().min(1).max(3),
  response: z.object({
    optionId: z.string().trim().min(1).max(80)
  }),
  idempotencyKey: z.string().trim().min(8).max(128)
});

export const exerciseTypeSchema = z.enum(exerciseTypes);

export function normalizeVietnameseText(value) {
  return value.normalize("NFC");
}
