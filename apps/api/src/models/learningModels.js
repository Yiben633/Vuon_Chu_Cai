import mongoose from "mongoose";
import { learningSessionTypes } from "@vuon-chu/contracts";
import { createSchema, objectId, requiredString } from "./utils/schema.js";

const questionSnapshotSchema = new mongoose.Schema(
  {
    exerciseId: { type: objectId, ref: "Exercise", required: true },
    contentVersion: { type: Number, required: true, min: 1 },
    answer: {
      type: new mongoose.Schema({ optionId: requiredString(80) }, { _id: false, strict: "throw" }),
      required: true
    },
    issuedAt: { type: Date, required: true, default: Date.now }
  },
  { _id: false, strict: "throw" }
);

const sceneAckSchema = new mongoose.Schema(
  {
    sceneId: requiredString(80),
    idempotencyKey: requiredString(128),
    acknowledgedAt: { type: Date, required: true, default: Date.now }
  },
  { _id: false, strict: "throw" }
);

const learningSessionSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  type: { type: String, enum: learningSessionTypes, required: true },
  contentId: { type: objectId, required: true },
  contentVersion: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["active", "paused", "completed", "expired"], required: true, default: "active" },
  startedAt: { type: Date, required: true, default: Date.now },
  lastHeartbeatAt: { type: Date, default: null },
  lastHeartbeatSeq: { type: Number, min: 0, default: 0 },
  activeSeconds: { type: Number, min: 0, default: 0 },
  dayKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  questionSnapshots: { type: [questionSnapshotSchema], select: false, default: [] },
  sceneAcks: { type: [sceneAckSchema], default: [] },
  completedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null }
});

learningSessionSchema.index(
  { childId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    name: "uniq_learning_sessions_active_child"
  }
);
learningSessionSchema.index({ childId: 1, startedAt: -1 }, { name: "idx_learning_sessions_child_started" });
learningSessionSchema.index({ status: 1, lastHeartbeatAt: 1 }, { name: "idx_learning_sessions_idle_expiry" });

const attemptSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  sessionId: { type: objectId, ref: "LearningSession", required: true },
  exerciseId: { type: objectId, ref: "Exercise", required: true },
  contentVersion: { type: Number, required: true, min: 1 },
  attemptNo: { type: Number, required: true, min: 1, max: 3 },
  idempotencyKey: requiredString(128),
  response: { type: mongoose.Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, required: true },
  responseMode: { type: String, enum: ["text", "audio", "image"], required: true, default: "text" },
  submittedAt: { type: Date, required: true, default: Date.now },
  dayKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }
});

attemptSchema.index(
  { sessionId: 1, exerciseId: 1, attemptNo: 1 },
  { unique: true, name: "uniq_attempts_session_exercise_attempt" }
);
attemptSchema.index({ childId: 1, idempotencyKey: 1 }, { unique: true, name: "uniq_attempts_child_idempotency" });
attemptSchema.index({ childId: 1, submittedAt: -1 }, { name: "idx_attempts_child_submitted" });

const childProgressSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  contentType: { type: String, enum: ["letter", "spelling", "story", "lesson"], required: true },
  contentId: { type: objectId, required: true },
  contentVersion: { type: Number, required: true, min: 1 },
  state: { type: String, enum: ["seen", "practicing", "mastered", "completed"], required: true },
  correctFirstTryExerciseIds: [{ type: objectId, ref: "Exercise" }],
  lastPracticedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
});

childProgressSchema.index(
  { childId: 1, contentType: 1, contentId: 1, contentVersion: 1 },
  { unique: true, name: "uniq_child_progress_content_version" }
);

const dailyStatsSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  dayKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  activeSeconds: { type: Number, min: 0, default: 0 },
  correctCount: { type: Number, min: 0, default: 0 },
  attemptCount: { type: Number, min: 0, default: 0 },
  completedStories: { type: Number, min: 0, default: 0 },
  earnedQuizAcorns: { type: Number, min: 0, default: 0 },
  lastActiveAt: { type: Date, default: null }
});

dailyStatsSchema.index({ childId: 1, dayKey: 1 }, { unique: true, name: "uniq_daily_stats_child_day" });

export const LearningSession = mongoose.model("LearningSession", learningSessionSchema);
export const Attempt = mongoose.model("Attempt", attemptSchema);
export const ChildProgress = mongoose.model("ChildProgress", childProgressSchema);
export const DailyStats = mongoose.model("DailyStats", dailyStatsSchema);
