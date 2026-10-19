import { z } from "zod";
import { answerSubmissionSchema, objectIdSchema, startLearningSessionSchema } from "@vuon-chu/contracts";
import { validationError } from "../../lib/apiError.js";

export { answerSubmissionSchema, startLearningSessionSchema };

export const heartbeatSchema = z.object({
  seq: z.number().int().min(1)
});

export const idempotencyBodySchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(128)
});

export const redeemSchema = z.object({
  rewardId: objectIdSchema,
  idempotencyKey: z.string().trim().min(8).max(128)
});

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw validationError(
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    );
  }
  return result.data;
}
