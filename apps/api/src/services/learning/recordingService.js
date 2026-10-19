import { errorCodes } from "@vuon-chu/contracts";
import { env } from "../../config/env.js";
import { ApiError, notFound } from "../../lib/apiError.js";
import { modelRegistry } from "../../models/index.js";

function capabilityDto(child) {
  const consent = child?.voiceConsent ?? {};
  return {
    featureEnabled: env.ENABLE_SERVER_RECORDINGS,
    recordingConsentEnabled: Boolean(consent.recordingEnabled),
    cloudProcessingEnabled: Boolean(consent.cloudProcessingEnabled),
    consentVersion: consent.version ?? null,
    maxBytes: env.MAX_RECORDING_BYTES,
    maxSeconds: env.MAX_RECORDING_SECONDS,
    acceptedAt: consent.acceptedAt ?? null,
    storageMode: env.ENABLE_SERVER_RECORDINGS ? "private" : "unavailable",
    message: env.ENABLE_SERVER_RECORDINGS
      ? "May chu da bat ghi am rieng tu."
      : "Ghi am gui may chu chua bat vi chua cau hinh storage va kiem dinh media that."
  };
}

function recordingDto(recording) {
  return {
    id: String(recording._id),
    childId: String(recording.childId),
    storyId: String(recording.storyId),
    roleKey: recording.roleKey,
    mimeType: recording.mimeType,
    sizeBytes: recording.sizeBytes,
    durationSeconds: recording.durationSeconds,
    inboxState: recording.inboxState,
    status: recording.status,
    createdAt: recording.createdAt,
    expiresAt: recording.expiresAt
  };
}

export function getRecordingCapability(child) {
  return capabilityDto(child);
}

export async function listChildRecordings(childId, child) {
  const capability = capabilityDto(child);
  if (!capability.featureEnabled) {
    return {
      capability,
      items: [],
      total: 0
    };
  }

  const items = await modelRegistry.Recording.find({ childId, status: { $ne: "deleting" } })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return {
    capability,
    items: items.map(recordingDto),
    total: items.length
  };
}

export async function rejectRecordingUpload(child) {
  const capability = capabilityDto(child);
  if (!capability.featureEnabled) {
    throw new ApiError(
      503,
      errorCodes.PROVIDER_UNAVAILABLE,
      "Ghi am gui ba me chua bat tren may chu. Be van co the thu va nghe lai tren may nay."
    );
  }
  if (!capability.recordingConsentEnabled) {
    throw new ApiError(403, errorCodes.CONSENT_REQUIRED, "Can phu huynh bat dong y ghi am truoc khi gui.");
  }
  throw new ApiError(
    503,
    errorCodes.PROVIDER_UNAVAILABLE,
    "May chu chua cau hinh kho rieng va cong cu kiem dinh codec/thoi luong, nen chua nhan file ghi am."
  );
}

export async function markRecordingDeleting(childId, recordingId) {
  if (!env.ENABLE_SERVER_RECORDINGS) {
    throw new ApiError(503, errorCodes.PROVIDER_UNAVAILABLE, "Ghi am tren may chu chua bat.");
  }
  const recording = await modelRegistry.Recording.findOne({ _id: recordingId, childId });
  if (!recording) throw notFound("Khong tim thay ghi am.");
  recording.status = "deleting";
  await recording.save();
  return { id: String(recording._id), status: recording.status };
}
