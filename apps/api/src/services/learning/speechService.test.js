import { describe, expect, it } from "vitest";
import { getSpeechCapability, matchTranscriptToTarget } from "./speechService.js";

describe("speech service optional module", () => {
  it("matches transcript by NFC text while preserving Vietnamese tones", () => {
    expect(matchTranscriptToTarget(" ca\u0301 ", "cá")).toBe(true);
    expect(matchTranscriptToTarget("ca", "cá")).toBe(false);
    expect(matchTranscriptToTarget("", "cá")).toBe(null);
  });

  it("keeps pronunciation scoring unavailable when provider is not configured", () => {
    const capability = getSpeechCapability({
      voiceConsent: {
        recordingEnabled: true,
        cloudProcessingEnabled: true,
        version: "local-test"
      }
    });

    expect(capability.featureEnabled).toBe(false);
    expect(capability.providerConfigured).toBe(false);
    expect(capability.pronunciationScoreAvailable).toBe(false);
    expect(capability.pronunciationScore).toBeNull();
  });
});
