import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { sendData } from "../lib/http.js";
import { requireAuth, requireParentGate } from "../middleware/authMiddleware.js";
import {
  getLetter,
  getStory,
  listLessons,
  listLetters,
  listResources,
  listSpellingEntries,
  listStories,
  listTones,
  listVocabulary,
  resolveResourceDownload
} from "../services/content/publicContentService.js";

export const contentRoutes = Router();

contentRoutes.get(
  "/letters",
  asyncHandler(async (req, res) => {
    const result = await listLetters(req.query);
    sendData(req, res, { items: result.items });
  })
);

contentRoutes.get(
  "/letters/:symbol",
  asyncHandler(async (req, res) => {
    sendData(req, res, await getLetter(req.params.symbol));
  })
);

contentRoutes.get(
  "/tones",
  asyncHandler(async (req, res) => {
    const result = await listTones();
    sendData(req, res, { items: result.items });
  })
);

contentRoutes.get(
  "/vocabulary",
  asyncHandler(async (req, res) => {
    const result = await listVocabulary(req.query);
    sendData(req, res, { items: result.items }, 200, result.meta);
  })
);

contentRoutes.get(
  "/spelling-entries",
  asyncHandler(async (req, res) => {
    const result = await listSpellingEntries(req.query);
    sendData(req, res, { items: result.items });
  })
);

contentRoutes.get(
  "/lessons",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await listLessons(req.query, req);
    sendData(req, res, { items: result.items });
  })
);

contentRoutes.get(
  "/stories",
  asyncHandler(async (req, res) => {
    const result = await listStories(req.query);
    sendData(req, res, { items: result.items }, 200, result.meta);
  })
);

contentRoutes.get(
  "/stories/:slug",
  asyncHandler(async (req, res) => {
    sendData(req, res, await getStory(req.params.slug));
  })
);

contentRoutes.get(
  "/resources",
  requireParentGate,
  asyncHandler(async (req, res) => {
    const result = await listResources();
    sendData(req, res, { items: result.items });
  })
);

contentRoutes.get(
  "/resources/:id/download",
  requireParentGate,
  asyncHandler(async (req, res) => {
    const download = await resolveResourceDownload(req.params.id);
    res.type(download.mimeType);
    res.download(download.filePath, download.filename);
  })
);
