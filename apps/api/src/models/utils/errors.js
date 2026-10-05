import { errorCodes } from "@vuon-chu/contracts";
import { ApiError } from "../../lib/apiError.js";

const duplicateMappings = [
  { collection: "users", fields: ["emailNormalized"], code: "EMAIL_EXISTS", message: "Email đã được sử dụng." },
  { collection: "rewardledgers", fields: ["childId", "eventKey"], code: "IDEMPOTENCY_CONFLICT", message: "Sự kiện thưởng đã được ghi nhận." },
  { collection: "learningsessions", fields: ["childId", "status"], code: "SESSION_CONFLICT", message: "Bé đang có phiên học active." },
  { collection: "inventories", fields: ["childId", "rewardId"], code: "REWARD_ALREADY_OWNED", message: "Phần thưởng đã có trong túi đồ." }
];

export function mapMongoDuplicateError(error) {
  if (error?.code !== 11000) return error;

  const collection = error.collection?.collectionName?.toLowerCase() ?? "";
  const keyPattern = Object.keys(error.keyPattern ?? {});
  const matched = duplicateMappings.find(
    (item) => (!collection || item.collection === collection) && item.fields.every((field) => keyPattern.includes(field))
  );

  if (!matched) {
    return new ApiError(409, errorCodes.IDEMPOTENCY_CONFLICT, "Dữ liệu bị trùng khóa duy nhất.", {
      fields: keyPattern
    });
  }

  return new ApiError(409, errorCodes[matched.code], matched.message, { fields: keyPattern });
}
