import mongoose from "mongoose";
import { createSchema, objectId, requiredString } from "./utils/schema.js";

const contentAuditSchema = createSchema({
  resourceType: requiredString(80),
  resourceId: { type: objectId, required: true },
  action: { type: String, enum: ["create", "update", "publish", "archive", "upload"], required: true },
  actorId: { type: objectId, ref: "User", required: true },
  contentVersion: { type: Number, min: 1, default: null },
  status: { type: String, trim: true, maxlength: 40, default: null },
  reviewStatus: { type: String, trim: true, maxlength: 40, default: null }
});

contentAuditSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 }, { name: "idx_content_audit_resource" });
contentAuditSchema.index({ actorId: 1, createdAt: -1 }, { name: "idx_content_audit_actor" });

export const ContentAudit = mongoose.model("ContentAudit", contentAuditSchema);
