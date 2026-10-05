import "./accountModels.js";
import "./contentModels.js";
import "./learningModels.js";
import "./rewardModels.js";
import "./recordingModels.js";
import mongoose from "mongoose";

export const modelRegistry = Object.freeze({
  User: mongoose.model("User"),
  ChildProfile: mongoose.model("ChildProfile"),
  PinAttempt: mongoose.model("PinAttempt"),
  Asset: mongoose.model("Asset"),
  Letter: mongoose.model("Letter"),
  Tone: mongoose.model("Tone"),
  Vocabulary: mongoose.model("Vocabulary"),
  SpellingEntry: mongoose.model("SpellingEntry"),
  Exercise: mongoose.model("Exercise"),
  Lesson: mongoose.model("Lesson"),
  Story: mongoose.model("Story"),
  Resource: mongoose.model("Resource"),
  LearningSession: mongoose.model("LearningSession"),
  Attempt: mongoose.model("Attempt"),
  ChildProgress: mongoose.model("ChildProgress"),
  DailyStats: mongoose.model("DailyStats"),
  Wallet: mongoose.model("Wallet"),
  RewardLedger: mongoose.model("RewardLedger"),
  RewardCatalog: mongoose.model("RewardCatalog"),
  Inventory: mongoose.model("Inventory"),
  Badge: mongoose.model("Badge"),
  ChildBadge: mongoose.model("ChildBadge"),
  Mission: mongoose.model("Mission"),
  MissionClaim: mongoose.model("MissionClaim"),
  Recording: mongoose.model("Recording")
});

export function getModel(name) {
  const model = modelRegistry[name];
  if (!model) {
    throw new Error(`Model is not registered: ${name}`);
  }
  return model;
}

export function listModelIndexSpecs() {
  return Object.entries(modelRegistry).map(([name, model]) => ({
    name,
    collection: model.collection.name,
    indexes: model.schema.indexes().map(([keys, options]) => ({
      keys,
      options: {
        ...options,
        partialFilterExpression: options.partialFilterExpression
      }
    }))
  }));
}
