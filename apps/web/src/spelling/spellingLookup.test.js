import { describe, expect, it } from "vitest";
import { findSpellingEntry, isCompleteSlots } from "./spellingLookup.js";

const entries = [
  { onset: "c", rime: "a", toneCode: "sac", word: "cá" },
  { onset: "b", rime: "a", toneCode: "huyen", word: "bà" },
  { onset: "m", rime: "e", toneCode: "nang", word: "mẹ" },
  { onset: "b", rime: "a", toneCode: "ngang", word: "ba" }
];

describe("spelling lookup", () => {
  it("resolves canonical Vietnamese combinations from data", () => {
    expect(findSpellingEntry(entries, { onset: "C", rime: "A", toneCode: "sac" })?.word).toBe("cá");
    expect(findSpellingEntry(entries, { onset: "B", rime: "A", toneCode: "huyen" })?.word).toBe("bà");
    expect(findSpellingEntry(entries, { onset: "M", rime: "E", toneCode: "nang" })?.word).toBe("mẹ");
  });

  it("keeps ngang as an allowed no-tone combination", () => {
    expect(findSpellingEntry(entries, { onset: "b", rime: "a", toneCode: "ngang" })?.word).toBe("ba");
  });

  it("rejects invalid combinations instead of composing a fake word", () => {
    expect(findSpellingEntry(entries, { onset: "q", rime: "a", toneCode: "sac" })).toBeNull();
  });

  it("requires all three slots before lookup feedback", () => {
    expect(isCompleteSlots({ onset: "c", rime: "a", toneCode: "sac" })).toBe(true);
    expect(isCompleteSlots({ onset: "c", rime: "", toneCode: "sac" })).toBe(false);
  });
});
