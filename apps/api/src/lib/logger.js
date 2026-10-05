const redactedKeys = new Set([
  "password",
  "newPassword",
  "currentPassword",
  "pin",
  "newPin",
  "currentPin",
  "cookie",
  "authorization",
  "session_secret",
  "SESSION_SECRET",
  "MONGODB_URI"
]);

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      redactedKeys.has(key) || redactedKeys.has(key.toLowerCase()) ? "[REDACTED]" : redact(item)
    ])
  );
}

export function logInfo(message, meta = {}) {
  console.log(JSON.stringify({ level: "info", message, ...redact(meta) }));
}

export function logError(message, meta = {}) {
  console.error(JSON.stringify({ level: "error", message, ...redact(meta) }));
}

export function requestLogger(req, res, next) {
  const startedAt = Date.now();
  res.on("finish", () => {
    logInfo("request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      latencyMs: Date.now() - startedAt
    });
  });
  next();
}
