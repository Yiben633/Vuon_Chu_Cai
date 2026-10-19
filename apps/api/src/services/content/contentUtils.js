import mongoose from "mongoose";
import { z } from "zod";
import { errorCodes } from "@vuon-chu/contracts";
import { ApiError, validationError } from "../../lib/apiError.js";

export const objectIdParamSchema = z.string().regex(/^[a-f\d]{24}$/i, "ObjectId khong hop le");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const boundedSearchSchema = z
  .string()
  .trim()
  .max(50)
  .optional()
  .transform((value) => (value ? value.normalize("NFC") : undefined));

export function parse(schema, value) {
  const result = schema.safeParse(value);
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

export function assertObjectId(value, label = "id") {
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(400, errorCodes.VALIDATION_ERROR, `${label} khong hop le.`);
  }
  return value;
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeSymbol(value) {
  return String(value ?? "").normalize("NFC").toLocaleUpperCase("vi-VN");
}

export function publishedFilter(extra = {}) {
  return { status: "published", ...extra };
}

export function ageBandFilter(ageBand) {
  return ageBand ? { ageBands: ageBand } : {};
}

export function pageMeta(page, limit, total) {
  return { page, limit, total };
}

export function toId(value) {
  return String(value?._id ?? value?.id ?? value);
}
