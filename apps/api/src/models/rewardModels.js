import mongoose from "mongoose";
import { createSchema, objectId, requiredString, ruleSchema } from "./utils/schema.js";

const walletSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  balance: { type: Number, min: 0, required: true, default: 0 },
  earnedTotal: { type: Number, min: 0, required: true, default: 0 },
  spentTotal: { type: Number, min: 0, required: true, default: 0 }
});

walletSchema.index({ childId: 1 }, { unique: true, name: "uniq_wallets_child" });
walletSchema.pre("validate", function validateBalance(next) {
  if (this.balance !== this.earnedTotal - this.spentTotal) {
    next(new Error("Wallet balance must equal earnedTotal - spentTotal."));
    return;
  }
  next();
});

const rewardLedgerSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  eventKey: requiredString(180),
  kind: { type: String, enum: ["welcome", "quiz", "story", "mission", "redeem", "spin"], required: true },
  delta: { type: Number, required: true },
  rewardId: { type: objectId, ref: "RewardCatalog", default: null },
  sourceId: { type: objectId, default: null },
  sourceVersion: { type: Number, min: 1, default: null },
  dayKey: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, default: null },
  requestHash: { type: String, trim: true, maxlength: 128, default: null }
});

rewardLedgerSchema.index({ childId: 1, eventKey: 1 }, { unique: true, name: "uniq_reward_ledger_child_event" });
rewardLedgerSchema.index({ childId: 1, createdAt: -1 }, { name: "idx_reward_ledger_child_created" });

const rewardCatalogSchema = createSchema({
  key: requiredString(120),
  version: { type: Number, required: true, min: 1, default: 1 },
  title: requiredString(120),
  cost: { type: Number, min: 0, required: true },
  cosmeticType: { type: String, trim: true, maxlength: 80, required: true },
  assetKey: { type: String, default: null },
  active: { type: Boolean, default: true },
  seedHash: { type: String, trim: true, maxlength: 128, select: false, default: null }
});

rewardCatalogSchema.index({ key: 1 }, { unique: true, name: "uniq_reward_catalog_key" });

const inventorySchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  rewardId: { type: objectId, ref: "RewardCatalog", required: true },
  cosmeticType: { type: String, trim: true, maxlength: 80, required: true },
  acquiredAt: { type: Date, required: true, default: Date.now },
  equipped: { type: Boolean, default: false }
});

inventorySchema.index({ childId: 1, rewardId: 1 }, { unique: true, name: "uniq_inventory_child_reward" });
inventorySchema.index(
  { childId: 1, cosmeticType: 1, equipped: 1 },
  {
    unique: true,
    partialFilterExpression: { equipped: true },
    name: "uniq_inventory_equipped_per_type"
  }
);

const badgeSchema = createSchema({
  key: requiredString(120),
  version: { type: Number, required: true, min: 1, default: 1 },
  title: requiredString(120),
  rule: { type: ruleSchema, required: true },
  assetKey: { type: String, default: null },
  seedHash: { type: String, trim: true, maxlength: 128, select: false, default: null }
});

badgeSchema.index({ key: 1 }, { unique: true, name: "uniq_badges_key" });

const childBadgeSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  badgeId: { type: objectId, ref: "Badge", required: true },
  awardedAt: { type: Date, required: true, default: Date.now },
  sourceKey: requiredString(180)
});

childBadgeSchema.index({ childId: 1, badgeId: 1 }, { unique: true, name: "uniq_child_badges_child_badge" });

const missionSchema = createSchema({
  key: requiredString(120),
  version: { type: Number, required: true, min: 1, default: 1 },
  title: requiredString(120),
  rule: { type: ruleSchema, required: true },
  rewardAcorns: { type: Number, min: 0, required: true },
  active: { type: Boolean, default: true },
  seedHash: { type: String, trim: true, maxlength: 128, select: false, default: null }
});

missionSchema.index({ key: 1 }, { unique: true, name: "uniq_missions_key" });

const missionClaimSchema = createSchema({
  childId: { type: objectId, ref: "ChildProfile", required: true },
  missionId: { type: objectId, ref: "Mission", required: true },
  dayKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  claimedAt: { type: Date, required: true, default: Date.now }
});

missionClaimSchema.index(
  { childId: 1, missionId: 1, dayKey: 1 },
  { unique: true, name: "uniq_mission_claims_child_mission_day" }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
export const RewardLedger = mongoose.model("RewardLedger", rewardLedgerSchema);
export const RewardCatalog = mongoose.model("RewardCatalog", rewardCatalogSchema);
export const Inventory = mongoose.model("Inventory", inventorySchema);
export const Badge = mongoose.model("Badge", badgeSchema);
export const ChildBadge = mongoose.model("ChildBadge", childBadgeSchema);
export const Mission = mongoose.model("Mission", missionSchema);
export const MissionClaim = mongoose.model("MissionClaim", missionClaimSchema);
