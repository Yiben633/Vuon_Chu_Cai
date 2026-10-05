import crypto from "node:crypto";

export function requestIdMiddleware(req, res, next) {
  const headerRequestId = req.get("x-request-id");
  req.requestId = headerRequestId && headerRequestId.length <= 128 ? headerRequestId : crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}
