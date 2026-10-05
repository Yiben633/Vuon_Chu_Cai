import { errorCodes } from "@vuon-chu/contracts";
import { ApiError } from "../lib/apiError.js";
import { logError } from "../lib/logger.js";

export function notFoundMiddleware(req, _res, next) {
  next(new ApiError(404, errorCodes.NOT_FOUND, "Không tìm thấy API."));
}

export function errorMiddleware(error, req, res, _next) {
  const status = error.status ?? 500;
  const code = error.code ?? errorCodes.PROVIDER_UNAVAILABLE;
  const isKnownApiError = error instanceof ApiError;

  logError("api error", {
    requestId: req.requestId,
    status,
    code,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });

  res.status(status).json({
    error: {
      code,
      message: status >= 500 && !isKnownApiError ? "Máy chủ đang gặp lỗi." : error.message,
      details: error.details
    },
    requestId: req.requestId
  });
}
