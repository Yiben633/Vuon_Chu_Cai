import mongoose from "mongoose";
import { createSchema, objectId } from "./utils/schema.js";

const speechAttemptSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  targetId: { type: String, required: true, trim: true, maxlength: 128 },
  targetText: { type: String, required: true, trim: true, maxlength: 160 },
  provider: { type: String, required: true, trim: true, maxlength: 64, default: "unavailable" },
  status: { type: String, enum: ["unavailable", "pending", "completed", "failed"], required: true, default: "unavailable" },
  transcript: { type: String, trim: true, maxlength: 500, default: null },
  transcriptMatch: { type: Boolean, default: null },
  pronunciationScore: { type: Number, min: 0, max: 100, default: null },
  modelVersion: { type: String, trim: true, maxlength: 80, default: null },
  consentVersion: { type: String, trim: true, maxlength: 32, default: null },
  recordedAt: { type: Date, required: true, default: Date.now }
});

speechAttemptSchema.index({ childId: 1, recordedAt: -1 }, { name: "idx_speech_attempts_child_recorded" });
speechAttemptSchema.index({ childId: 1, targetId: 1, recordedAt: -1 }, { name: "idx_speech_attempts_child_target" });

export const SpeechAttempt = mongoose.model("SpeechAttempt", speechAttemptSchema);
