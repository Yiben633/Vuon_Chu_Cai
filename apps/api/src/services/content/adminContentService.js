import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ageBands, contentStatuses, exerciseTypes, reviewStatuses } from "@vuon-chu/contracts";
import { env } from "../../config/env.js";
import { ApiError, notFound } from "../../lib/apiError.js";
import { modelRegistry } from "../../models/index.js";
import { adminDto } from "./contentDto.js";
import { assertObjectId, boundedSearchSchema, escapeRegex, pageMeta, paginationSchema, parse } from "./contentUtils.js";

const ROOT = path.resolve(process.cwd(), "../..");
const UPLOAD_DIR = path.resolve(ROOT, "apps/api/var/private-media/public-assets");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const nullableString = (max = 500) => z.string().trim().max(max).nullable().optional();
const objectIdString = z.string().regex(/^[a-f\d]{24}$/i);
const audioAssetKeysSchema = z
  .object({
    north: z.string().trim().max(120).nullable().optional(),
    central: z.string().trim().max(120).nullable().optional(),
    south: z.string().trim().max(120).nullable().optional()
  })
  .strict()
  .optional();

const contentBaseSchema = z
  .object({
    key: z.string().trim().min(1).max(120),
    title: z.string().trim().max(200).nullable().optional(),
    ageBands: z.array(z.enum(ageBands)).optional(),
    reviewStatus: z.enum(reviewStatuses).optional()
  })
  .strict();

const schemas = {
  letters: contentBaseSchema.extend({
    symbol: z.string().trim().min(1).max(4),
    lowerSymbol: z.string().trim().min(1).max(4),
    order: z.number().int().min(1).max(29),
    group: z.enum(["vowel", "consonant"]),
    letterName: z.string().trim().min(1).max(30),
    example: z
      .object({
        text: z.string().trim().min(1).max(80),
        targetOffset: z.number().int().min(0),
        targetLength: z.number().int().min(1),
        baseSymbol: z.string().trim().min(1).max(8),
        note: z.string().trim().max(200).nullable().optional()
      })
      .strict(),
    imageAssetKey: nullableString(120),
    audioAssetKeys: audioAssetKeysSchema,
    teachingNote: nullableString(1000)
  }),
  tones: contentBaseSchema.extend({
    code: z.enum(["ngang", "sac", "huyen", "hoi", "nga", "nang"]),
    name: z.string().trim().min(1).max(40),
    marker: z.string().max(2).optional(),
    order: z.number().int().min(0).max(5),
    example: z.string().trim().min(1).max(80)
  }),
  vocabulary: contentBaseSchema.extend({
    word: z.string().trim().min(1).max(80),
    meaning: nullableString(300),
    category: nullableString(80),
    syllables: z.array(z.string().trim().max(40)).optional(),
    imageAssetKey: nullableString(120),
    audioAssetKeys: audioAssetKeysSchema,
    letterIds: z.array(objectIdString).optional(),
    teachingNote: nullableString(1000)
  }),
  "spelling-entries": contentBaseSchema.extend({
    onset: z.string().trim().max(8).optional(),
    rime: z.string().trim().min(1).max(16),
    toneCode: z.enum(["ngang", "sac", "huyen", "hoi", "nga", "nang"]),
    word: z.string().trim().min(1).max(80),
    vocabularyId: objectIdString,
    audioAssetKeys: audioAssetKeysSchema,
    explanation: nullableString(500)
  }),
  lessons: contentBaseSchema.extend({
    module: z.enum(["alphabet", "spelling", "story", "quiz"]),
    contentKey: z.string().trim().min(1).max(120),
    letterIds: z.array(objectIdString).optional(),
    exerciseIds: z.array(objectIdString).optional(),
    order: z.number().int().min(1),
    durationHintMinutes: z.number().int().min(1).max(60).nullable().optional()
  }),
  exercises: contentBaseSchema.extend({
    type: z.enum(exerciseTypes),
    prompt: z.string().trim().min(1).max(500),
    options: z.array(
      z
        .object({
          id: z.string().trim().min(1).max(80),
          label: z.string().trim().min(1).max(120),
          assetKey: z.string().trim().max(120).nullable().optional()
        })
        .strict()
    ),
    answer: z.object({ optionId: z.string().trim().min(1).max(80) }).strict(),
    targetLetterId: objectIdString.nullable().optional(),
    vocabularyId: objectIdString.nullable().optional(),
    spellingEntryId: objectIdString.nullable().optional(),
    difficulty: z.number().int().min(1).max(5).optional(),
    maxAttempts: z.number().int().min(1).max(3).optional(),
    audioAssetKeys: audioAssetKeysSchema
  }),
  stories: contentBaseSchema.extend({
    slug: z.string().trim().min(1).max(160),
    category: z.string().trim().min(1).max(80),
    scenes: z.array(
      z
        .object({
          id: z.string().trim().min(1).max(80),
          text: z.string().trim().min(1).max(2000),
          imageAssetKey: z.string().trim().max(120).nullable().optional(),
          audioAssetKeys: audioAssetKeysSchema,
          hotspots: z
            .array(
              z
                .object({
                  id: z.string().trim().min(1).max(80),
                  label: z.string().trim().min(1).max(120),
                  vocabularyId: objectIdString,
                  x: z.number().min(0).max(1),
                  y: z.number().min(0).max(1)
                })
                .strict()
            )
            .optional()
        })
        .strict()
    ),
    endingExerciseId: objectIdString,
    vocabularyIds: z.array(objectIdString).optional(),
    moral: nullableString(500),
    durationHintMinutes: z.number().int().min(1).max(60).nullable().optional()
  }),
  resources: contentBaseSchema.extend({
    type: z.enum(["worksheet", "flashcard", "guide"]),
    assetKey: nullableString(120),
    pageCount: z.number().int().min(1).nullable().optional(),
    letterIds: z.array(objectIdString).optional(),
    availability: z.enum(["missing", "ready"]).optional()
  }),
  assets: z
    .object({
      key: z.string().trim().min(1).max(120),
      kind: z.enum(["image", "svg", "audio", "pdf"]),
      localPath: nullableString(500),
      objectKey: nullableString(500),
      mimeType: z.string().trim().min(1).max(120),
      sizeBytes: z.number().int().min(0),
      checksum: z.string().trim().min(1).max(128),
      status: z.enum(["ready", "missing", "quarantined"]),
      source: nullableString(500),
      licenseStatus: z.enum(["unknown", "verified"]).optional()
    })
    .strict()
};

schemas.rewards = z
  .object({
    key: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(120),
    cost: z.number().min(0),
    cosmeticType: z.string().trim().min(1).max(80),
    assetKey: nullableString(120),
    active: z.boolean().optional()
  })
  .strict();
schemas["reward-catalog"] = schemas.rewards;
schemas.badges = z
  .object({
    key: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(120),
    rule: z.object({ metric: z.string().trim().min(1), threshold: z.number().min(0) }).strict(),
    assetKey: nullableString(120)
  })
  .strict();
schemas.missions = z
  .object({
    key: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(120),
    rule: z.object({ metric: z.string().trim().min(1), threshold: z.number().min(0) }).strict(),
    rewardAcorns: z.number().min(0),
    active: z.boolean().optional()
  })
  .strict();

const registry = {
  letters: { model: modelRegistry.Letter, schema: schemas.letters, includeAnswer: false },
  tones: { model: modelRegistry.Tone, schema: schemas.tones, includeAnswer: false },
  vocabulary: { model: modelRegistry.Vocabulary, schema: schemas.vocabulary, includeAnswer: false },
  "spelling-entries": { model: modelRegistry.SpellingEntry, schema: schemas["spelling-entries"], includeAnswer: false },
  lessons: { model: modelRegistry.Lesson, schema: schemas.lessons, includeAnswer: false },
  exercises: { model: modelRegistry.Exercise, schema: schemas.exercises, includeAnswer: true },
  stories: { model: modelRegistry.Story, schema: schemas.stories, includeAnswer: false },
  rewards: { model: modelRegistry.RewardCatalog, schema: schemas.rewards, includeAnswer: false },
  "reward-catalog": { model: modelRegistry.RewardCatalog, schema: schemas["reward-catalog"], includeAnswer: false },
  badges: { model: modelRegistry.Badge, schema: schemas.badges, includeAnswer: false },
  missions: { model: modelRegistry.Mission, schema: schemas.missions, includeAnswer: false },
  resources: { model: modelRegistry.Resource, schema: schemas.resources, includeAnswer: false },
  assets: { model: modelRegistry.Asset, schema: schemas.assets, includeAnswer: false }
};

export function getAdminResource(resourceType) {
  const resource = registry[resourceType];
  if (!resource) {
    throw new ApiError(404, "NOT_FOUND", "Resource type khong duoc ho tro.");
  }
  return resource;
}

export function listAdminResourceTypes() {
  return Object.keys(registry);
}

export async function getAdminDashboardSummary() {
  const resourceTypes = listAdminResourceTypes();
  const counts = await Promise.all(
    resourceTypes.map(async (resourceType) => {
      const { model } = getAdminResource(resourceType);
      const [total, draft, published, archived, needsReview, approved, ready, missing, active, inactive] = await Promise.all([
        model.countDocuments({}),
        model.countDocuments({ status: "draft" }),
        model.countDocuments({ status: "published" }),
        model.countDocuments({ status: "archived" }),
        model.countDocuments({ reviewStatus: "needs_review" }),
        model.countDocuments({ reviewStatus: "approved" }),
        model.countDocuments({ status: "ready" }),
        model.countDocuments({ $or: [{ status: "missing" }, { availability: "missing" }] }),
        model.countDocuments({ active: true }),
        model.countDocuments({ active: false })
      ]);
      return {
        resourceType,
        total,
        draft,
        published,
        archived,
        needsReview,
        approved,
        ready,
        missing,
        active,
        inactive
      };
    })
  );
  const recentAudit = await modelRegistry.ContentAudit.find({}).sort({ createdAt: -1 }).limit(10).lean();
  return {
    resourceTypes,
    counts,
    recentAudit: recentAudit.map((item) => ({
      id: String(item._id),
      resourceType: item.resourceType,
      resourceId: String(item.resourceId),
      action: item.action,
      actorId: String(item.actorId),
      contentVersion: item.contentVersion ?? null,
      status: item.status ?? null,
      reviewStatus: item.reviewStatus ?? null,
      createdAt: item.createdAt
    }))
  };
}

export const adminListQuerySchema = paginationSchema.extend({
  status: z.enum([...contentStatuses, "ready", "missing", "quarantined", "active", "inactive"]).optional(),
  q: boundedSearchSchema
});

export async function listAdminResources(resourceType, query) {
  const { model, includeAnswer } = getAdminResource(resourceType);
  const { page, limit, status, q } = parse(adminListQuerySchema, query);
  const filter = {};
  if (status) {
    if (status === "active") filter.active = true;
    else if (status === "inactive") filter.active = false;
    else filter.status = status;
  }
  if (q) {
    const regex = new RegExp(escapeRegex(q), "iu");
    filter.$or = [{ key: regex }, { title: regex }, { word: regex }, { slug: regex }];
  }
  const baseQuery = model.find(filter);
  if (includeAnswer) baseQuery.select("+answer");
  const [items, total] = await Promise.all([
    baseQuery
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    model.countDocuments(filter)
  ]);
  return { items: items.map((item) => adminDto(item, { includeAnswer })), meta: pageMeta(page, limit, total) };
}

export async function createAdminResource(resourceType, body, actorId = null) {
  const { model, schema, includeAnswer } = getAdminResource(resourceType);
  const input = parse(schema, body);
  const payload = withCreateDefaults(resourceType, input);
  const doc = await model.create(payload);
  await writeAudit({ resourceType, doc, action: "create", actorId });
  const full = includeAnswer ? await model.findById(doc._id).select("+answer").lean() : doc;
  return adminDto(full, { includeAnswer });
}

export async function getAdminResourceById(resourceType, id) {
  const { model, includeAnswer } = getAdminResource(resourceType);
  assertObjectId(id);
  const query = model.findById(id);
  if (includeAnswer) query.select("+answer");
  const doc = await query.lean();
  if (!doc) throw notFound("Khong tim thay noi dung.");
  return adminDto(doc, { includeAnswer });
}

export async function updateAdminResource(resourceType, id, body, actorId = null) {
  const { model, schema, includeAnswer } = getAdminResource(resourceType);
  assertObjectId(id);
  const input = parse(schema.partial(), body);
  delete input.key;
  delete input.status;
  delete input.version;
  const doc = await model.findById(id).select(includeAnswer ? "+answer" : "");
  if (!doc) throw notFound("Khong tim thay noi dung.");
  Object.assign(doc, stripUndefined(input));
  if ("status" in doc && doc.status === "published") {
    doc.version += 1;
    doc.status = "draft";
    doc.reviewStatus = "needs_review";
  }
  await doc.save();
  await writeAudit({ resourceType, doc, action: "update", actorId });
  const full = includeAnswer ? await model.findById(doc._id).select("+answer").lean() : doc;
  return adminDto(full, { includeAnswer });
}

export async function publishAdminResource(resourceType, id, actorId = null) {
  const { model, includeAnswer } = getAdminResource(resourceType);
  assertObjectId(id);
  const doc = await model.findById(id).select(includeAnswer ? "+answer" : "");
  if (!doc) throw notFound("Khong tim thay noi dung.");
  const hasStatus = Boolean(doc.schema?.path("status"));
  const hasReviewStatus = Boolean(doc.schema?.path("reviewStatus"));
  const hasActive = Boolean(doc.schema?.path("active"));
  if (env.NODE_ENV === "production" && hasReviewStatus && doc.reviewStatus !== "approved") {
    throw new ApiError(403, "FORBIDDEN", "Production chi publish noi dung da duyet.");
  }
  await assertPublishReady(resourceType, doc);
  if (hasStatus) doc.status = "published";
  else if (hasActive) doc.active = true;
  else throw new ApiError(400, "UNSUPPORTED_RESOURCE", "Loai hoc lieu nay chua ho tro publish.");
  await doc.save();
  await writeAudit({ resourceType, doc, action: "publish", actorId });
  const full = includeAnswer ? await model.findById(doc._id).select("+answer").lean() : doc;
  return adminDto(full, { includeAnswer });
}

export async function archiveAdminResource(resourceType, id, actorId = null) {
  const { model, includeAnswer } = getAdminResource(resourceType);
  assertObjectId(id);
  const doc = await model.findById(id).select(includeAnswer ? "+answer" : "");
  if (!doc) throw notFound("Khong tim thay noi dung.");
  if (doc.schema?.path("status")) doc.status = "archived";
  else if (doc.schema?.path("active")) doc.active = false;
  else throw new ApiError(400, "UNSUPPORTED_RESOURCE", "Loai hoc lieu nay chua ho tro archive.");
  await doc.save();
  await writeAudit({ resourceType, doc, action: "archive", actorId });
  const full = includeAnswer ? await model.findById(doc._id).select("+answer").lean() : doc;
  return adminDto(full, { includeAnswer });
}

export async function uploadAdminAsset({ key, kind, source, licenseStatus, actorId }, file) {
  if (!key || !/^[a-z0-9][a-z0-9-]{1,118}$/i.test(key)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Asset key khong hop le.");
  }
  if (!file?.buffer?.length) throw new ApiError(400, "VALIDATION_ERROR", "Thieu file upload.");
  if (file.buffer.length > MAX_UPLOAD_BYTES) throw new ApiError(413, "FILE_TOO_LARGE", "File qua lon.");
  const detected = detectUpload(file.mimeType, file.buffer);
  if (kind && kind !== detected.kind) throw new ApiError(400, "VALIDATION_ERROR", "Loai file khong khop MIME.");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${key}.${detected.ext}`;
  const absolutePath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(absolutePath, file.buffer);
  const localPath = path.relative(ROOT, absolutePath).replaceAll("\\", "/");
  const checksum = crypto.createHash("sha256").update(file.buffer).digest("hex");
  const doc = await modelRegistry.Asset.findOneAndUpdate(
    { key },
    {
      $set: {
        key,
        kind: detected.kind,
        mimeType: detected.mimeType,
        sizeBytes: file.buffer.length,
        checksum,
        localPath,
        objectKey: null,
        status: "ready",
        source: source ?? null,
        licenseStatus: licenseStatus === "verified" ? "verified" : "unknown"
      }
    },
    { upsert: true, new: true, runValidators: true }
  );
  await writeAudit({ resourceType: "assets", doc, action: "upload", actorId });
  return adminDto(doc);
}

function withCreateDefaults(resourceType, input) {
  if (resourceType === "assets") return input;
  const payload = { ...input };
  if (!("version" in payload)) payload.version = 1;
  if (!("status" in payload) && hasContentStatus(resourceType)) payload.status = "draft";
  if (!("reviewStatus" in payload) && hasContentStatus(resourceType)) payload.reviewStatus = "needs_review";
  return payload;
}

function hasContentStatus(resourceType) {
  return ["letters", "tones", "vocabulary", "spelling-entries", "lessons", "exercises", "stories", "resources"].includes(
    resourceType
  );
}

async function assertPublishReady(resourceType, doc) {
  if (resourceType !== "resources") return;
  if (doc.availability !== "ready" || !doc.assetKey) {
    throw new ApiError(404, "RESOURCE_NOT_READY", "Resource chua co file san sang.");
  }
  const asset = await modelRegistry.Asset.findOne({ key: doc.assetKey, status: "ready", kind: "pdf" }).lean();
  if (!asset || asset.mimeType !== "application/pdf") {
    throw new ApiError(404, "RESOURCE_NOT_READY", "Resource can PDF asset ready.");
  }
}

function detectUpload(mimeType, buffer) {
  const normalized = String(mimeType ?? "").split(";")[0].trim().toLowerCase();
  const allowed = {
    "image/png": { kind: "image", ext: "png" },
    "image/jpeg": { kind: "image", ext: "jpg" },
    "image/svg+xml": { kind: "svg", ext: "svg" },
    "audio/mpeg": { kind: "audio", ext: "mp3" },
    "audio/wav": { kind: "audio", ext: "wav" },
    "application/pdf": { kind: "pdf", ext: "pdf" }
  };
  const detected = allowed[normalized];
  if (!detected) throw new ApiError(400, "VALIDATION_ERROR", "MIME upload khong duoc ho tro.");
  if (normalized === "image/svg+xml") {
    const text = buffer.toString("utf8").toLowerCase();
    if (text.includes("<script") || text.includes("javascript:") || /\son[a-z]+\s*=/.test(text)) {
      throw new ApiError(422, "AUDIO_INVALID", "SVG co script/handler khong duoc chap nhan.");
    }
  }
  return { ...detected, mimeType: normalized };
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

async function writeAudit({ resourceType, doc, action, actorId }) {
  if (!actorId || !doc?._id) return;
  await modelRegistry.ContentAudit.create({
    resourceType,
    resourceId: doc._id,
    action,
    actorId,
    contentVersion: doc.version ?? null,
    status: doc.status ?? (doc.active === false ? "inactive" : doc.active === true ? "active" : null),
    reviewStatus: doc.reviewStatus ?? null
  });
}
