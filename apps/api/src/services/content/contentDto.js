import { toId } from "./contentUtils.js";

export function audioAvailability(audioAssetKeys = {}) {
  return Object.fromEntries(
    ["north", "central", "south"].map((dialect) => {
      const assetKey = audioAssetKeys?.[dialect] ?? null;
      return [dialect, { assetKey, available: Boolean(assetKey), status: assetKey ? "registered" : "missing" }];
    })
  );
}

export function assetAvailability(assetKey) {
  return { assetKey: assetKey ?? null, available: Boolean(assetKey), status: assetKey ? "registered" : "missing" };
}

export function contentBaseDto(doc) {
  return {
    id: toId(doc),
    key: doc.key,
    version: doc.version,
    title: doc.title ?? null,
    ageBands: doc.ageBands ?? []
  };
}

export function letterDto(doc) {
  return {
    ...contentBaseDto(doc),
    symbol: doc.symbol,
    lowerSymbol: doc.lowerSymbol,
    order: doc.order,
    group: doc.group,
    letterName: doc.letterName,
    example: doc.example,
    image: assetAvailability(doc.imageAssetKey),
    audio: audioAvailability(doc.audioAssetKeys),
    teachingNote: doc.teachingNote ?? null
  };
}

export function toneDto(doc) {
  return {
    ...contentBaseDto(doc),
    code: doc.code,
    name: doc.name,
    marker: doc.marker,
    order: doc.order,
    example: doc.example
  };
}

export function vocabularyDto(doc) {
  return {
    ...contentBaseDto(doc),
    word: doc.word,
    meaning: doc.meaning ?? null,
    category: doc.category ?? null,
    syllables: doc.syllables ?? [],
    image: assetAvailability(doc.imageAssetKey),
    audio: audioAvailability(doc.audioAssetKeys),
    teachingNote: doc.teachingNote ?? null
  };
}

export function spellingEntryDto(doc) {
  return {
    ...contentBaseDto(doc),
    onset: doc.onset,
    rime: doc.rime,
    toneCode: doc.toneCode,
    word: doc.word,
    vocabularyId: doc.vocabularyId ? toId(doc.vocabularyId) : null,
    audio: audioAvailability(doc.audioAssetKeys),
    explanation: doc.explanation ?? null
  };
}

export function lessonDto(doc) {
  return {
    ...contentBaseDto(doc),
    module: doc.module,
    contentKey: doc.contentKey,
    order: doc.order,
    durationHintMinutes: doc.durationHintMinutes ?? null,
    letterIds: (doc.letterIds ?? []).map(toId),
    exerciseIds: (doc.exerciseIds ?? []).map(toId)
  };
}

export function storySummaryDto(doc) {
  return {
    ...contentBaseDto(doc),
    slug: doc.slug,
    category: doc.category,
    moral: doc.moral ?? null,
    durationHintMinutes: doc.durationHintMinutes ?? null,
    vocabularyIds: (doc.vocabularyIds ?? []).map(toId)
  };
}

export function storyDetailDto(doc, vocabularyById = new Map()) {
  return {
    ...storySummaryDto(doc),
    scenes: (doc.scenes ?? []).map((scene) => ({
      id: scene.id,
      text: scene.text,
      image: assetAvailability(scene.imageAssetKey),
      audio: audioAvailability(scene.audioAssetKeys),
      hotspots: (scene.hotspots ?? []).map((hotspot) => ({
        id: hotspot.id,
        label: hotspot.label,
        x: hotspot.x,
        y: hotspot.y,
        vocabulary: vocabularyById.get(toId(hotspot.vocabularyId)) ?? { id: toId(hotspot.vocabularyId) }
      }))
    })),
    vocabulary: (doc.vocabularyIds ?? []).map((id) => vocabularyById.get(toId(id))).filter(Boolean),
    endingExerciseId: doc.endingExerciseId ? toId(doc.endingExerciseId) : null
  };
}

export function resourceDto(doc) {
  return {
    ...contentBaseDto(doc),
    type: doc.type,
    assetKey: doc.assetKey ?? null,
    pageCount: doc.pageCount ?? null,
    availability: doc.availability,
    letterIds: (doc.letterIds ?? []).map(toId)
  };
}

export function publicExerciseDto(doc) {
  return {
    ...contentBaseDto(doc),
    type: doc.type,
    prompt: doc.prompt,
    options: doc.options,
    targetLetterId: doc.targetLetterId ? toId(doc.targetLetterId) : null,
    vocabularyId: doc.vocabularyId ? toId(doc.vocabularyId) : null,
    spellingEntryId: doc.spellingEntryId ? toId(doc.spellingEntryId) : null,
    difficulty: doc.difficulty,
    maxAttempts: doc.maxAttempts,
    audio: audioAvailability(doc.audioAssetKeys)
  };
}

export function adminDto(doc, { includeAnswer = false } = {}) {
  const raw = typeof doc.toObject === "function" ? doc.toObject({ virtuals: false }) : { ...doc };
  const id = toId(raw);
  delete raw._id;
  delete raw.seedHash;
  if (!includeAnswer) delete raw.answer;
  return { id, ...raw };
}
