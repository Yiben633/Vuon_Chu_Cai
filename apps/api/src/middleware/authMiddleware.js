import { errorCodes, userRoles } from "@vuon-chu/contracts";
import { modelRegistry } from "../models/index.js";
import { ApiError, forbidden, parentGateRequired, unauthenticated } from "../lib/apiError.js";
import { isParentGateOpen } from "../services/auth/sessionService.js";

export async function attachCurrentUser(req, _res, next) {
  try {
    if (!req.session?.userId) {
      next();
      return;
    }

    const user = await modelRegistry.User.findById(req.session.userId).lean();
    if (!user || user.status !== "active" || user.authVersion !== req.session.authVersion) {
      req.session.destroy(() => next(unauthenticated("Phien dang nhap da het hieu luc.")));
      return;
    }

    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.currentUser) {
    next(unauthenticated());
    return;
  }
  next();
}

export function requireChild(req, _res, next) {
  if (!req.currentUser) {
    next(unauthenticated());
    return;
  }
  if (req.session.mode !== "child" || !req.session.currentChildId) {
    next(new ApiError(403, errorCodes.FORBIDDEN, "Can o che do tre em."));
    return;
  }
  next();
}

export function requireParentGate(req, _res, next) {
  if (!req.currentUser) {
    next(unauthenticated());
    return;
  }
  if (req.session.mode === "child") {
    next(parentGateRequired());
    return;
  }
  if (!isParentGateOpen(req)) {
    next(parentGateRequired());
    return;
  }
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.currentUser) {
    next(unauthenticated());
    return;
  }
  if (req.currentUser.role !== userRoles.admin || !isParentGateOpen(req)) {
    next(forbidden());
    return;
  }
  next();
}

export async function requireOwnedChild(req, _res, next) {
  try {
    const childId = req.params.childId ?? req.body?.childId ?? req.query?.childId;
    if (!childId) {
      next(new ApiError(400, errorCodes.VALIDATION_ERROR, "Thieu childId."));
      return;
    }

    const child = await modelRegistry.ChildProfile.findOne({
      _id: childId,
      parentId: req.currentUser._id,
      deletedAt: null
    });

    if (!child) {
      next(new ApiError(404, errorCodes.NOT_FOUND, "Khong tim thay ho so be."));
      return;
    }

    if (req.session.mode === "child" && String(req.session.currentChildId) !== String(child._id)) {
      next(forbidden());
      return;
    }

    req.childProfile = child;
    next();
  } catch (error) {
    next(error);
  }
}
