import crypto from "node:crypto";

export function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("base64url");
  }
  return req.session.csrfToken;
}

export function regenerateSession(req) {
  const csrfToken = req.session.csrfToken;
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      req.session.csrfToken = csrfToken ?? crypto.randomBytes(32).toString("base64url");
      resolve();
    });
  });
}

export function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

export function setAuthenticatedSession(req, user, { rememberMe = false, mode = "parent", currentChildId = null } = {}) {
  const now = Date.now();
  const maxAgeMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
  req.session.cookie.maxAge = maxAgeMs;
  req.session.userId = String(user._id ?? user.id);
  req.session.role = user.role;
  req.session.authVersion = user.authVersion;
  req.session.mode = mode;
  req.session.currentChildId = currentChildId;
  req.session.parentGateUntil = null;
  req.session.authExpiresAt = new Date(now + maxAgeMs).toISOString();
}

export function clearParentGate(req) {
  req.session.parentGateUntil = null;
}

export function openParentGate(req, ttlMinutes) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  req.session.mode = "parent";
  req.session.currentChildId = null;
  req.session.parentGateUntil = expiresAt;
  return expiresAt;
}

export function isParentGateOpen(req) {
  return Boolean(req.session.parentGateUntil && new Date(req.session.parentGateUntil).getTime() > Date.now());
}
