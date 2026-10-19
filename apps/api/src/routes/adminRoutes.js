import express from "express";
import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendData } from "../lib/http.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
import {
  archiveAdminResource,
  createAdminResource,
  getAdminDashboardSummary,
  getAdminResourceById,
  listAdminResourceTypes,
  listAdminResources,
  publishAdminResource,
  updateAdminResource,
  uploadAdminAsset
} from "../services/content/adminContentService.js";

export const adminRoutes = Router();

adminRoutes.use(requireAdmin);

adminRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    sendData(req, res, { resourceTypes: listAdminResourceTypes() });
  })
);

adminRoutes.post(
  "/assets/upload",
  express.raw({ type: ["image/png", "image/jpeg", "image/svg+xml", "audio/mpeg", "audio/wav", "application/pdf"], limit: "5mb" }),
  asyncHandler(async (req, res) => {
    const asset = await uploadAdminAsset(
      {
        key: req.query.key,
        kind: req.query.kind,
        source: req.query.source,
        licenseStatus: req.query.licenseStatus,
        actorId: req.currentUser._id
      },
      { mimeType: req.get("content-type"), buffer: req.body }
    );
    sendData(req, res, asset, 201);
  })
);

adminRoutes.get(
  "/:resourceType",
  asyncHandler(async (req, res) => {
    if (req.params.resourceType === "summary") {
      sendData(req, res, await getAdminDashboardSummary());
      return;
    }
    const result = await listAdminResources(req.params.resourceType, req.query);
    sendData(req, res, { items: result.items }, 200, result.meta);
  })
);

adminRoutes.post(
  "/:resourceType",
  asyncHandler(async (req, res) => {
    const item = await createAdminResource(req.params.resourceType, req.body, req.currentUser._id);
    sendData(req, res, item, 201);
  })
);

adminRoutes.get(
  "/:resourceType/:id",
  asyncHandler(async (req, res) => {
    sendData(req, res, await getAdminResourceById(req.params.resourceType, req.params.id));
  })
);

adminRoutes.patch(
  "/:resourceType/:id",
  asyncHandler(async (req, res) => {
    sendData(req, res, await updateAdminResource(req.params.resourceType, req.params.id, req.body, req.currentUser._id));
  })
);

adminRoutes.post(
  "/:resourceType/:id/publish",
  asyncHandler(async (req, res) => {
    sendData(req, res, await publishAdminResource(req.params.resourceType, req.params.id, req.currentUser._id));
  })
);

adminRoutes.post(
  "/:resourceType/:id/archive",
  asyncHandler(async (req, res) => {
    sendData(req, res, await archiveAdminResource(req.params.resourceType, req.params.id, req.currentUser._id));
  })
);
