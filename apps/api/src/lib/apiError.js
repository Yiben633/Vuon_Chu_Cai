import { errorCodes } from "@vuon-chu/contracts";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(message = "Khong tim thay tai nguyen.") {
  return new ApiError(404, errorCodes.NOT_FOUND, message);
}

export function dbNotReady(details) {
  return new ApiError(503, errorCodes.DB_NOT_READY, "Database chua san sang.", details);
}

export function validationError(details) {
  return new ApiError(400, errorCodes.VALIDATION_ERROR, "Du lieu khong hop le.", details);
}

export function unauthenticated(message = "Vui long dang nhap.") {
  return new ApiError(401, errorCodes.UNAUTHENTICATED, message);
}

export function forbidden(message = "Khong co quyen thuc hien thao tac nay.") {
  return new ApiError(403, errorCodes.FORBIDDEN, message);
}

export function parentGateRequired(message = "Can mo khoa phu huynh.") {
  return new ApiError(403, errorCodes.PARENT_GATE_REQUIRED, message);
}
