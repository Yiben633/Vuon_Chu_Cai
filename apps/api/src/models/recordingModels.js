import mongoose from "mongoose";
import { createSchema, objectId, requiredString } from "./utils/schema.js";

const recordingSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  storyId: { type: objectId, ref: "Story", required: true },
  roleKey: requiredString(80),
  objectKey: { type: String, required: true, trim: true, maxlength: 500, select: false },
  mimeType: { type: String, enum: ["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4"], required: true },
  sizeBytes: { type: Number, min: 1, max: 5_242_880, required: true },
  durationSeconds: { type: Number, min: 0.1, max: 15, required: true },
  consentVersion: requiredString(32),
  expiresAt: { type: Date, required: true },
  inboxState: { type: String, enum: ["new", "listened"], default: "new" },
  status: { type: String, enum: ["ready", "deleting"], default: "ready" }
});

recordingSchema.index({ childId: 1, createdAt: -1 }, { name: "idx_recordings_child_created" });
recordingSchema.index({ status: 1, expiresAt: 1 }, { name: "idx_recordings_cleanup" });

export const Recording = mongoose.model("Recording", recordingSchema);
