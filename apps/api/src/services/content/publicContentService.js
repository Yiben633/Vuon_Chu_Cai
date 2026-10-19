import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { errorCodes, ageBands } from "@vuon-chu/contracts";
import { ApiError, notFound } from "../../lib/apiError.js";
import { modelRegistry } from "../../models/index.js";
import {
  ageBandFilter,
  assertObjectId,
  boundedSearchSchema,
  escapeRegex,
  normalizeSymbol,
  pageMeta,
  paginationSchema,
  parse,
  publishedFilter,
  toId
} from "./contentUtils.js";
import {
  letterDto,
  lessonDto,
  resourceDto,
  spellingEntryDto,
  storyDetailDto,
  storySummaryDto,
  toneDto,
  vocabularyDto
} from "./contentDto.js";

const ROOT = path.resolve(process.cwd(), "../..");

export const letterListQuerySchema = z.object({
  group: z.enum(["all", "vowel", "consonant"]).default("all")
});

export const vocabularyQuerySchema = paginationSchema.extend({
  category: z.string().trim().max(80).optional(),
  q: boundedSearchSchema
});

export const spellingQuerySchema = z.object({
  onset: z.string().trim().max(8).optional(),
  rime: z.string().trim().max(16).optional(),
  tone: z.enum(["ngang", "sac", "huyen", "hoi", "nga", "nang"]).optional()
});

export const lessonsQuerySchema = z.object({
  module: z.enum(["alphabet", "spelling", "story", "quiz"]).optional(),
  ageBand: z.enum(ageBands).optional()
});

export const storiesQuerySchema = paginationSchema.extend({
  category: z.string().trim().max(80).optional(),
  ageBand: z.enum(ageBands).optional()
});

export async function listLetters(query) {
  const { group } = parse(letterListQuerySchema, query);
  const filter = publishedFilter(group === "all" ? {} : { group });
  const rows = await modelRegistry.Letter.find(filter).sort({ order: 1 }).lean();
  return { items: rows.map(letterDto) };
}

export async function getLetter(symbol) {
  const row = await modelRegistry.Letter.findOne(publishedFilter({ symbol: normalizeSymbol(symbol) })).lean();
  if (!row) throw notFound("Khong tim thay chu cai.");
  return letterDto(row);
}

export async function listTones() {
  const rows = await modelRegistry.Tone.find(publishedFilter()).sort({ order: 1 }).lean();
  return { items: rows.map(toneDto) };
}

export async function listVocabulary(query) {
  const { page, limit, category, q } = parse(vocabularyQuerySchema, query);
  const filter = publishedFilter();
  if (category) filter.category = category.normalize("NFC");
  if (q) {
    const regex = new RegExp(escapeRegex(q), "iu");
    filter.$or = [{ word: regex }, { meaning: regex }, { category: regex }];
  }
  const [items, total] = await Promise.all([
    modelRegistry.Vocabulary.find(filter)
      .sort({ word: 1, key: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    modelRegistry.Vocabulary.countDocuments(filter)
  ]);
  return { items: items.map(vocabularyDto), meta: pageMeta(page, limit, total) };
}

export async function listSpellingEntries(query) {
  const { onset, rime, tone } = parse(spellingQuerySchema, query);
  const filter = publishedFilter();
  if (onset !== undefined) filter.onset = onset.normalize("NFC");
  if (rime !== undefined) filter.rime = rime.normalize("NFC");
  if (tone) filter.toneCode = tone;
  const rows = await modelRegistry.SpellingEntry.find(filter).sort({ onset: 1, rime: 1, toneCode: 1 }).lean();
  return { items: rows.map(spellingEntryDto) };
}

export async function listLessons(query, req) {
  const parsed = parse(lessonsQuerySchema, query);
  const filter = publishedFilter();
  if (parsed.module) filter.module = parsed.module;
  const childAgeBand = await resolveChildAgeBand(req);
  Object.assign(filter, ageBandFilter(childAgeBand ?? parsed.ageBand));
  const rows = await modelRegistry.Lesson.find(filter).sort({ module: 1, order: 1 }).lean();
  return { items: rows.map(lessonDto) };
}

export async function listStories(query) {
  const { page, limit, category, ageBand } = parse(storiesQuerySchema, query);
  const filter = publishedFilter({ ...ageBandFilter(ageBand) });
  if (category) filter.category = category.normalize("NFC");
  const [items, total] = await Promise.all([
    modelRegistry.Story.find(filter)
      .sort({ createdAt: -1, slug: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    modelRegistry.Story.countDocuments(filter)
  ]);
  return { items: items.map(storySummaryDto), meta: pageMeta(page, limit, total) };
}

export async function getStory(slug) {
  const normalizedSlug = String(slug ?? "").trim().normalize("NFC");
  if (!normalizedSlug || normalizedSlug.length > 160) throw new ApiError(400, errorCodes.VALIDATION_ERROR, "Slug khong hop le.");
  const story = await modelRegistry.Story.findOne(publishedFilter({ slug: normalizedSlug })).lean();
  if (!story) throw notFound("Khong tim thay truyen.");
  const vocabularyIds = [
    ...new Set([
      ...(story.vocabularyIds ?? []).map(toId),
      ...(story.scenes ?? []).flatMap((scene) => (scene.hotspots ?? []).map((hotspot) => toId(hotspot.vocabularyId)))
    ])
  ];
  const vocabulary = await modelRegistry.Vocabulary.find({ _id: { $in: vocabularyIds }, status: "published" }).lean();
  const vocabularyById = new Map(vocabulary.map((row) => [toId(row), vocabularyDto(row)]));
  return storyDetailDto(story, vocabularyById);
}

export async function listResources() {
  const rows = await modelRegistry.Resource.find(publishedFilter({ availability: "ready" })).sort({ title: 1 }).lean();
  return { items: rows.map(resourceDto) };
}

export async function resolveResourceDownload(resourceId) {
  assertObjectId(resourceId, "resourceId");
  const resource = await modelRegistry.Resource.findById(resourceId).lean();
  if (!resource || resource.status !== "published") throw notFound("Khong tim thay hoc lieu.");
  if (resource.availability !== "ready" || !resource.assetKey) {
    throw new ApiError(404, errorCodes.RESOURCE_NOT_READY, "Hoc lieu chua co file san sang.");
  }
  const asset = await modelRegistry.Asset.findOne({ key: resource.assetKey, status: "ready", kind: "pdf" }).lean();
  if (!asset || asset.mimeType !== "application/pdf" || !asset.localPath) {
    throw new ApiError(404, errorCodes.RESOURCE_NOT_READY, "File PDF chua san sang.");
  }
  const filePath = path.resolve(ROOT, asset.localPath);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
    throw new ApiError(404, errorCodes.RESOURCE_NOT_READY, "File PDF khong ton tai tren server.");
  }
  return { filePath, filename: `${resource.key}.pdf`, mimeType: asset.mimeType };
}

async function resolveChildAgeBand(req) {
  if (req?.session?.mode !== "child" || !req.session.currentChildId) return null;
  const child = await modelRegistry.ChildProfile.findOne({
    _id: req.session.currentChildId,
    parentId: req.currentUser?._id,
    deletedAt: null
  })
    .select("ageBand")
    .lean();
  return child?.ageBand ?? null;
}
