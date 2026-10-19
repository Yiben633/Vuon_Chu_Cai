import { z } from "zod";
import { errorCodes } from "@vuon-chu/contracts";
import { ApiError, validationError } from "../../lib/apiError.js";
import { env } from "../../config/env.js";

export const speechAssessmentSchema = z.object({
  targetId: z.string().trim().min(1).max(128),
  targetText: z.string().trim().min(1).max(160),
  transcript: z.string().trim().max(500).optional()
});

export function parseSpeechAssessment(body) {
  const result = speechAssessmentSchema.safeParse(body);
  if (!result.success) {
    throw validationError(
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    );
  }
  return result.data;
}

export function getSpeechCapability(child) {
  const consent = child?.voiceConsent ?? {};
  const providerConfigured = Boolean(env.SPEECH_PROVIDER && env.SPEECH_PROVIDER_API_KEY);
  const cloudFeatureEnabled = Boolean(env.ENABLE_CLOUD_SPEECH && providerConfigured);
  const cloudConsentEnabled = Boolean(consent.cloudProcessingEnabled);
  return {
    featureEnabled: cloudFeatureEnabled,
    browserSpeechEnabled: env.ENABLE_BROWSER_SPEECH,
    provider: providerConfigured ? env.SPEECH_PROVIDER : null,
    providerConfigured,
    cloudConsentEnabled,
    consentVersion: consent.version ?? null,
    timeoutMs: env.SPEECH_TIMEOUT_MS,
    backoffMs: env.SPEECH_BACKOFF_MS,
    retentionDays: env.RECORDING_RETENTION_DAYS,
    pronunciationScoreAvailable: false,
    pronunciationScore: null,
    message: speechCapabilityMessage({ cloudFeatureEnabled, providerConfigured, cloudConsentEnabled })
  };
}

export async function rejectOrAssessSpeech(child, _input) {
  const capability = getSpeechCapability(child);
  if (!capability.cloudConsentEnabled) {
    throw new ApiError(403, errorCodes.CONSENT_REQUIRED, "Phu huynh chua bat dong y xu ly giong noi tren may chu.");
  }
  if (!capability.featureEnabled) {
    throw new ApiError(503, errorCodes.PROVIDER_UNAVAILABLE, capability.message);
  }

  // Real provider calls will be added only after a Vietnamese speech assessment
  // provider is configured and independently tested. Until then scores stay null.
  throw new ApiError(503, errorCodes.PROVIDER_UNAVAILABLE, "Chua co provider speech tieng Viet da kiem chung.");
}

export function matchTranscriptToTarget(transcript, targetText) {
  const normalizedTranscript = normalizeSpeechText(transcript);
  const normalizedTarget = normalizeSpeechText(targetText);
  if (!normalizedTranscript || !normalizedTarget) return null;
  return normalizedTranscript === normalizedTarget;
}

function normalizeSpeechText(value) {
  return String(value ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi-VN");
}

function speechCapabilityMessage({ cloudFeatureEnabled, providerConfigured, cloudConsentEnabled }) {
  if (!providerConfigured) return "Chua cau hinh provider speech, nen khong cham diem phat am.";
  if (!cloudFeatureEnabled) return "Tinh nang speech dang tat bang feature flag.";
  if (!cloudConsentEnabled) return "Can phu huynh bat dong y xu ly giong noi truoc khi gui len provider.";
  return "Provider speech san sang, nhung diem phat am van chi tra ve khi provider ho tro danh gia tieng Viet da kiem chung.";
}
