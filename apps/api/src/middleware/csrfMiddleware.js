import { errorCodes } from "@vuon-chu/contracts";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function csrfMiddleware(req, _res, next) {
  if (!req.path.startsWith("/api/v1") || !mutationMethods.has(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  if (origin && origin !== env.APP_ORIGIN) {
    next(new ApiError(403, errorCodes.CSRF_INVALID, "Origin khong hop le."));
    return;
  }

  const token = req.get("x-csrf-token");
  if (!token || !req.session.csrfToken || token !== req.session.csrfToken) {
    next(new ApiError(403, errorCodes.CSRF_INVALID, "CSRF token khong hop le."));
    return;
  }

  next();
}
