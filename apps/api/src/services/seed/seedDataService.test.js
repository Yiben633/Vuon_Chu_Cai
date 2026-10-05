import { describe, expect, it } from "vitest";
import { validateSeedSource } from "./seedDataService.js";

describe("seedDataService", () => {
  it("validates expanded learning seed offline", async () => {
    const result = await validateSeedSource({ expand: true });

    expect(result.status).toBe("PASS");
    expect(result.counts.letters).toBe(29);
    expect(result.counts.tones).toBe(6);
    expect(result.gameTypeCounts["identify-letter"]).toBe(58);
    expect(result.gameTypeCounts["match-rime"]).toBeGreaterThanOrEqual(5);
    expect(result.gameTypeCounts["listen-word"]).toBeGreaterThanOrEqual(5);
    expect(result.gameTypeCounts["select-tone"]).toBeGreaterThanOrEqual(5);
    expect(result.gameTypeCounts["listen-animal"]).toBeGreaterThanOrEqual(5);

    const q = result.datasets.letters.find((letter) => letter.key === "letter-q");
    expect(q.example.text.normalize("NFC")).toContain("qu");
    expect(q.teachingNote.toLocaleLowerCase("vi-VN")).toContain("q");
    expect(q.teachingNote.toLocaleLowerCase("vi-VN")).toContain("u");
  });
});
