import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { ageBands, dialects } from "@vuon-chu/contracts";
import { modelRegistry } from "./index.js";
import { normalizeEmail, normalizeNfc } from "./utils/normalization.js";

describe("model definitions", () => {
  it("normalizes Vietnamese text to NFC and email to lowercase", () => {
    expect(normalizeNfc("a\u0301")).toBe("á");
    expect(normalizeEmail("  ME@Example.TEST ")).toBe("me@example.test");
  });

  it("keeps the MVP age bands and dialects constrained", async () => {
    const ChildProfile = modelRegistry.ChildProfile;
    const valid = new ChildProfile({
      parentId: new mongoose.Types.ObjectId(),
      nickname: "Na",
      ageBand: ageBands[0],
      dialect: dialects[0],
      mascotKey: "mascot-squirrel"
    });

    await expect(valid.validate()).resolves.toBeUndefined();

    const invalid = new ChildProfile({
      parentId: new mongoose.Types.ObjectId(),
      nickname: "Na",
      ageBand: "7-8",
      dialect: "west",
      mascotKey: "mascot-squirrel"
    });

    await expect(invalid.validate()).rejects.toThrow();
  });

  it("rejects invalid child settings ranges", async () => {
    const ChildProfile = modelRegistry.ChildProfile;
    const invalid = new ChildProfile({
      parentId: new mongoose.Types.ObjectId(),
      nickname: "Bo",
      ageBand: "3-4",
      dialect: "north",
      mascotKey: "mascot-squirrel",
      settings: {
        dailyLimitMinutes: 120
      }
    });

    await expect(invalid.validate()).rejects.toThrow();
  });

  it("keeps secret fields and learner answers select:false", () => {
    expect(modelRegistry.User.schema.path("passwordHash").options.select).toBe(false);
    expect(modelRegistry.User.schema.path("parentPinHash").options.select).toBe(false);
    expect(modelRegistry.ChildProfile.schema.path("symbolPinHash").options.select).toBe(false);
    expect(modelRegistry.Exercise.schema.path("answer").options.select).toBe(false);
    expect(modelRegistry.LearningSession.schema.path("questionSnapshots").options.select).toBe(false);
    expect(modelRegistry.Recording.schema.path("objectKey").options.select).toBe(false);
    expect(modelRegistry.SpeechAttempt.schema.path("pronunciationScore").options.default).toBe(null);
  });

  it("declares the critical unique indexes required by step 02", () => {
    expect(hasUniqueIndex(modelRegistry.User, ["emailNormalized"])).toBe(true);
    expect(hasUniqueIndex(modelRegistry.RewardLedger, ["childId", "eventKey"])).toBe(true);
    expect(hasUniqueIndex(modelRegistry.Inventory, ["childId", "rewardId"])).toBe(true);
    expect(hasUniqueIndex(modelRegistry.LearningSession, ["childId", "status"], { status: "active" })).toBe(true);
  });

  it("does not add non-Vietnamese alphabet letters", () => {
    const enumValues = modelRegistry.Letter.schema.path("symbol").options.enum;
    expect(enumValues).toHaveLength(29);
    expect(enumValues).not.toEqual(expect.arrayContaining(["F", "J", "W", "Z"]));
  });
});

function hasUniqueIndex(model, expectedKeys, expectedPartial = null) {
  return model.schema.indexes().some(([keys, options]) => {
    const keyNames = Object.keys(keys);
    const sameKeys = expectedKeys.length === keyNames.length && expectedKeys.every((key) => keyNames.includes(key));
    const samePartial = expectedPartial
      ? JSON.stringify(options.partialFilterExpression) === JSON.stringify(expectedPartial)
      : true;
    return sameKeys && options.unique === true && samePartial;
  });
}
