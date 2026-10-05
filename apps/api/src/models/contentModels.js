import mongoose from "mongoose";
import { ageBands, contentStatuses, exerciseTypes, reviewStatuses } from "@vuon-chu/contracts";
import { audioAssetKeysSchema, createSchema, objectId, requiredString } from "./utils/schema.js";

const contentBase = {
  key: requiredString(120),
  version: { type: Number, required: true, min: 1, default: 1 },
  status: { type: String, enum: contentStatuses, required: true, default: "draft" },
  reviewStatus: { type: String, enum: reviewStatuses, required: true, default: "needs_review" },
  title: { type: String, trim: true, maxlength: 200, default: null },
  ageBands: [{ type: String, enum: ageBands }],
  seedHash: { type: String, trim: true, maxlength: 128, select: false, default: null }
};

const exampleSchema = new mongoose.Schema(
  {
    text: requiredString(80),
    targetOffset: { type: Number, required: true, min: 0 },
    targetLength: { type: Number, required: true, min: 1 },
    baseSymbol: requiredString(8),
    note: { type: String, trim: true, maxlength: 200, default: null }
  },
  { _id: false, strict: "throw" }
);

const letterSchema = createSchema({
  ...contentBase,
  symbol: { type: String, required: true, enum: [..."AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY"] },
  lowerSymbol: { type: String, required: true },
  order: { type: Number, required: true, min: 1, max: 29 },
  group: { type: String, enum: ["vowel", "consonant"], required: true },
  letterName: requiredString(30),
  example: { type: exampleSchema, required: true },
  imageAssetKey: { type: String, default: null },
  audioAssetKeys: { type: audioAssetKeysSchema, default: () => ({}) },
  teachingNote: { type: String, trim: true, maxlength: 1000, default: null }
});

letterSchema.index({ key: 1 }, { unique: true, name: "uniq_letters_key" });
letterSchema.index({ symbol: 1 }, { unique: true, name: "uniq_letters_symbol" });
letterSchema.index({ group: 1, order: 1 }, { name: "idx_letters_group_order" });

const toneSchema = createSchema({
  ...contentBase,
  code: { type: String, enum: ["ngang", "sac", "huyen", "hoi", "nga", "nang"], required: true },
  name: requiredString(40),
  marker: { type: String, maxlength: 2, default: "" },
  order: { type: Number, required: true, min: 0, max: 5 },
  example: requiredString(80)
});

toneSchema.index({ key: 1 }, { unique: true, name: "uniq_tones_key" });
toneSchema.index({ code: 1 }, { unique: true, name: "uniq_tones_code" });

const assetSchema = createSchema({
  key: requiredString(120),
  kind: { type: String, enum: ["image", "svg", "audio", "pdf"], required: true },
  localPath: { type: String, trim: true, maxlength: 500, default: null },
  objectKey: { type: String, trim: true, maxlength: 500, default: null },
  mimeType: requiredString(120),
  sizeBytes: { type: Number, min: 0, required: true },
  checksum: requiredString(128),
  status: { type: String, enum: ["ready", "missing", "quarantined"], required: true },
  source: { type: String, trim: true, maxlength: 500, default: null },
  licenseStatus: { type: String, enum: ["unknown", "verified"], default: "unknown" },
  seedHash: { type: String, trim: true, maxlength: 128, select: false, default: null }
});

assetSchema.index({ key: 1 }, { unique: true, name: "uniq_assets_key" });

const vocabularySchema = createSchema({
  ...contentBase,
  word: requiredString(80),
  meaning: { type: String, trim: true, maxlength: 300, default: null },
  category: { type: String, trim: true, maxlength: 80, default: null },
  syllables: [{ type: String, trim: true, maxlength: 40 }],
  imageAssetKey: { type: String, default: null },
  audioAssetKeys: { type: audioAssetKeysSchema, default: () => ({}) },
  letterIds: [{ type: objectId, ref: "Letter" }],
  teachingNote: { type: String, trim: true, maxlength: 1000, default: null }
});

vocabularySchema.index({ key: 1 }, { unique: true, name: "uniq_vocabulary_key" });
vocabularySchema.index({ category: 1, status: 1 }, { name: "idx_vocabulary_category_status" });

const spellingEntrySchema = createSchema({
  ...contentBase,
  onset: { type: String, trim: true, maxlength: 8, default: "" },
  rime: requiredString(16),
  toneCode: { type: String, enum: ["ngang", "sac", "huyen", "hoi", "nga", "nang"], required: true },
  word: requiredString(80),
  vocabularyId: { type: objectId, ref: "Vocabulary", required: true },
  audioAssetKeys: { type: audioAssetKeysSchema, default: () => ({}) },
  explanation: { type: String, trim: true, maxlength: 500, default: null }
});

spellingEntrySchema.index({ key: 1 }, { unique: true, name: "uniq_spelling_entries_key" });
spellingEntrySchema.index(
  { onset: 1, rime: 1, toneCode: 1 },
  { unique: true, name: "uniq_spelling_entries_combination" }
);

const exerciseOptionSchema = new mongoose.Schema(
  {
    id: requiredString(80),
    label: requiredString(120),
    assetKey: { type: String, default: null }
  },
  { _id: false, strict: "throw" }
);

const exerciseSchema = createSchema({
  ...contentBase,
  type: { type: String, enum: exerciseTypes, required: true },
  prompt: requiredString(500),
  options: {
    type: [exerciseOptionSchema],
    validate: {
      validator(options) {
        return options.length >= 2 && new Set(options.map((option) => option.id)).size === options.length;
      },
      message: "Exercise options must have unique ids and at least two choices."
    }
  },
  answer: {
    type: new mongoose.Schema({ optionId: requiredString(80) }, { _id: false, strict: "throw" }),
    required: true,
    select: false
  },
  targetLetterId: { type: objectId, ref: "Letter", default: null },
  vocabularyId: { type: objectId, ref: "Vocabulary", default: null },
  spellingEntryId: { type: objectId, ref: "SpellingEntry", default: null },
  difficulty: { type: Number, min: 1, max: 5, default: 1 },
  maxAttempts: { type: Number, min: 1, max: 3, default: 3 },
  audioAssetKeys: { type: audioAssetKeysSchema, default: () => ({}) }
});

exerciseSchema.index({ key: 1 }, { unique: true, name: "uniq_exercises_key" });
exerciseSchema.index({ type: 1, status: 1 }, { name: "idx_exercises_type_status" });

const lessonSchema = createSchema({
  ...contentBase,
  module: { type: String, enum: ["alphabet", "spelling", "story", "quiz"], required: true },
  contentKey: requiredString(120),
  letterIds: [{ type: objectId, ref: "Letter" }],
  exerciseIds: [{ type: objectId, ref: "Exercise" }],
  order: { type: Number, required: true, min: 1 },
  durationHintMinutes: { type: Number, min: 1, max: 60, default: null }
});

lessonSchema.index({ key: 1 }, { unique: true, name: "uniq_lessons_key" });
lessonSchema.index({ module: 1, status: 1, order: 1 }, { name: "idx_lessons_module_status_order" });

const hotspotSchema = new mongoose.Schema(
  {
    id: requiredString(80),
    label: requiredString(120),
    vocabularyId: { type: objectId, ref: "Vocabulary", required: true },
    x: { type: Number, min: 0, max: 1, required: true },
    y: { type: Number, min: 0, max: 1, required: true }
  },
  { _id: false, strict: "throw" }
);

const sceneSchema = new mongoose.Schema(
  {
    id: requiredString(80),
    text: requiredString(2000),
    imageAssetKey: { type: String, default: null },
    audioAssetKeys: { type: audioAssetKeysSchema, default: () => ({}) },
    hotspots: [hotspotSchema]
  },
  { _id: false, strict: "throw" }
);

const storySchema = createSchema({
  ...contentBase,
  slug: requiredString(160),
  category: requiredString(80),
  scenes: {
    type: [sceneSchema],
    validate: {
      validator(scenes) {
        return scenes.length > 0 && new Set(scenes.map((scene) => scene.id)).size === scenes.length;
      },
      message: "Story scenes must have unique ids."
    }
  },
  endingExerciseId: { type: objectId, ref: "Exercise", required: true },
  vocabularyIds: [{ type: objectId, ref: "Vocabulary" }],
  moral: { type: String, trim: true, maxlength: 500, default: null },
  durationHintMinutes: { type: Number, min: 1, max: 60, default: null }
});

storySchema.index({ key: 1 }, { unique: true, name: "uniq_stories_key" });
storySchema.index({ slug: 1 }, { unique: true, name: "uniq_stories_slug" });
storySchema.index({ category: 1, status: 1 }, { name: "idx_stories_category_status" });

const resourceSchema = createSchema({
  ...contentBase,
  type: { type: String, enum: ["worksheet", "flashcard", "guide"], required: true },
  assetKey: { type: String, default: null },
  pageCount: { type: Number, min: 1, default: null },
  letterIds: [{ type: objectId, ref: "Letter" }],
  availability: { type: String, enum: ["missing", "ready"], required: true, default: "missing" }
});

resourceSchema.index({ key: 1 }, { unique: true, name: "uniq_resources_key" });

export const Asset = mongoose.model("Asset", assetSchema);
export const Letter = mongoose.model("Letter", letterSchema);
export const Tone = mongoose.model("Tone", toneSchema);
export const Vocabulary = mongoose.model("Vocabulary", vocabularySchema);
export const SpellingEntry = mongoose.model("SpellingEntry", spellingEntrySchema);
export const Exercise = mongoose.model("Exercise", exerciseSchema);
export const Lesson = mongoose.model("Lesson", lessonSchema);
export const Story = mongoose.model("Story", storySchema);
export const Resource = mongoose.model("Resource", resourceSchema);
