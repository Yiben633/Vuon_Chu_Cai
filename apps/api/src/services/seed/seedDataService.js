import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ageBands } from "@vuon-chu/contracts";
import { modelRegistry } from "../../models/index.js";
import { normalizeEmail } from "../../models/utils/normalization.js";

const ROOT = path.resolve(process.cwd(), "../..");
const VIETNAMESE_ALPHABET = [..."AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY"];
const VOWELS = new Set([..."AĂÂEÊIOÔƠUƯY"]);
const TONE_CODES = new Set(["ngang", "sac", "huyen", "hoi", "nga", "nang"]);
const GAME_TYPES = ["identify-letter", "match-rime", "listen-word", "select-tone", "listen-animal"];

const collectionModels = {
  assets: modelRegistry.Asset,
  letters: modelRegistry.Letter,
  tones: modelRegistry.Tone,
  vocabulary: modelRegistry.Vocabulary,
  spellingEntries: modelRegistry.SpellingEntry,
  exercises: modelRegistry.Exercise,
  lessons: modelRegistry.Lesson,
  stories: modelRegistry.Story,
  rewardCatalog: modelRegistry.RewardCatalog,
  badges: modelRegistry.Badge,
  missions: modelRegistry.Mission,
  resources: modelRegistry.Resource
};

export async function loadSeedSource() {
  const manifest = await readJson("data/seed-manifest.json");
  const assetManifest = await readJson(manifest.assetManifest);
  const datasets = {};

  for (const dataset of manifest.datasets) {
    datasets[dataset.collection] = await readJson(dataset.file);
  }

  datasets.assets = assetManifest.assets.map((asset) => ({
    key: asset.key,
    kind: asset.kind,
    localPath: asset.localPath ?? null,
    objectKey: null,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    checksum: asset.checksum,
    status: asset.status,
    source: asset.sourceOriginalPath ?? null,
    licenseStatus: asset.licenseStatus ?? "unknown"
  }));

  return { manifest, assetManifest, datasets };
}

export async function validateSeedSource({ expand = true } = {}) {
  const source = await loadSeedSource();
  const datasets = expand ? expandDatasets(source.datasets) : structuredClone(source.datasets);
  const errors = [];
  const warnings = [];

  validateManifest(source.manifest, source.datasets, errors);
  validateKeys(datasets, errors);
  validateNfc(datasets, errors);
  validateLetters(datasets.letters, errors);
  validateTones(datasets.tones, errors);
  validateReferences(datasets, errors);
  validateExercises(datasets.exercises, datasets.letters, errors);
  validateMediaGaps(datasets, warnings);

  const counts = Object.fromEntries(Object.entries(datasets).map(([name, rows]) => [name, rows.length]));
  const gameTypeCounts = countBy(datasets.exercises, "type");

  return {
    status: errors.length ? "FAIL" : "PASS",
    errors,
    warnings,
    counts,
    gameTypeCounts,
    missingAssets: source.manifest.missingAssets,
    datasets,
    manifest: source.manifest
  };
}

export function expandDatasets(datasets) {
  const expanded = structuredClone(datasets);
  expanded.exercises = expandExercises(expanded);
  return expanded;
}

export function expandExercises(datasets) {
  const exercisesByKey = new Map(datasets.exercises.map((exercise) => [exercise.key, exercise]));
  const letters = datasets.letters;
  const symbols = letters.map((letter) => letter.symbol);

  for (const letter of letters) {
    const suffix = letter.key.replace(/^letter-/, "");
    const upperKey = `ex-letter-${suffix}-1`;
    const lowerKey = `ex-letter-${suffix}-2`;

    if (!exercisesByKey.has(upperKey)) {
      const options = makeLetterOptions(symbols, letter.symbol, letter.order, false);
      exercisesByKey.set(upperKey, makeExercise({
        key: upperKey,
        type: "identify-letter",
        prompt: `Bé hãy chọn chữ ${letter.symbol}.`,
        options,
        answerLabel: letter.symbol,
        targetLetterKey: letter.key
      }));
    }

    if (!exercisesByKey.has(lowerKey)) {
      const lowerSymbols = symbols.map((symbol) => symbol.toLocaleLowerCase("vi-VN"));
      const target = letter.lowerSymbol;
      const options = makeLetterOptions(lowerSymbols, target, letter.order + 7, true);
      exercisesByKey.set(lowerKey, makeExercise({
        key: lowerKey,
        type: "identify-letter",
        prompt: `Tìm thẻ có chữ ${target} giống chữ mẫu nhé.`,
        options,
        answerLabel: target,
        targetLetterKey: letter.key
      }));
    }
  }

  const spelling = datasets.spellingEntries;
  const vocabulary = datasets.vocabulary;
  addMatchRimeExercises(exercisesByKey, spelling);
  addListenWordExercises(exercisesByKey, vocabulary);
  addToneExercises(exercisesByKey, spelling);
  addAnimalExercises(exercisesByKey);

  return [...exercisesByKey.values()].sort((a, b) => a.key.localeCompare(b.key, "vi"));
}

export async function importSeed({ dryRun = false, forceContent = false } = {}) {
  const validation = await validateSeedSource({ expand: true });
  if (validation.status !== "PASS") {
    return { status: "FAIL", validation };
  }

  assertSeedingAllowed(validation.datasets);

  const maps = new Map();
  const summary = {
    status: dryRun ? "DRY_RUN" : "DONE",
    dryRun,
    collections: {},
    refsResolved: {},
    missingAssets: validation.missingAssets,
    conflicts: []
  };

  for (const collection of validation.manifest.importOrder) {
    const model = collectionModels[collection];
    const rows = validation.datasets[collection] ?? [];
    const collectionSummary = { inserted: 0, updated: 0, unchanged: 0, conflicted: 0, skipped: 0 };
    maps.set(collection, new Map());

    for (const row of rows) {
      const resolved = resolveRow(collection, row, maps, summary);
      const seedHash = stableHash(row);
      const payload = { ...resolved, seedHash };
      const existing = await model.findOne({ key: row.key }).select("+seedHash").lean();

      if (!existing) {
        collectionSummary.inserted += 1;
        if (!dryRun) {
          const doc = await model.create(payload);
          maps.get(collection).set(row.key, doc._id);
        } else {
          maps.get(collection).set(row.key, fakeObjectIdForKey(`${collection}:${row.key}`));
        }
        continue;
      }

      maps.get(collection).set(row.key, existing._id);

      if (existing.version > row.version) {
        collectionSummary.skipped += 1;
        continue;
      }

      if (existing.version === row.version && existing.seedHash && existing.seedHash !== seedHash && !forceContent) {
        collectionSummary.conflicted += 1;
        summary.conflicts.push({ collection, key: row.key, reason: "same-version-different-content" });
        continue;
      }

      if (existing.seedHash === seedHash) {
        collectionSummary.unchanged += 1;
        continue;
      }

      collectionSummary.updated += 1;
      if (!dryRun) {
        await model.updateOne({ key: row.key }, { $set: payload }, { runValidators: true });
      }
    }

    summary.collections[collection] = collectionSummary;
  }

  summary.dbCounts = dryRun ? null : await getSeedCollectionCounts();
  summary.expandedCounts = validation.counts;
  summary.gameTypeCounts = validation.gameTypeCounts;
  summary.status = summary.conflicts.length ? "PARTIAL" : summary.status;
  return summary;
}

export async function getSeedCollectionCounts() {
  const counts = {};
  for (const [collection, model] of Object.entries(collectionModels)) {
    counts[collection] = await model.countDocuments();
  }
  return counts;
}

export async function createDemoFamily() {
  assertNonProduction("db:demo");
  const password = process.env.DEMO_PARENT_PASSWORD;
  const pin = process.env.DEMO_PARENT_PIN;
  const email = normalizeEmail(process.env.DEMO_PARENT_EMAIL || "demo@example.test");
  if (!password || !pin) throw new Error("DEMO_PARENT_PASSWORD và DEMO_PARENT_PIN là bắt buộc.");
  if (!/^\d{4}$/.test(pin)) throw new Error("DEMO_PARENT_PIN phải gồm 4 chữ số.");

  const existing = await modelRegistry.User.findOne({ emailNormalized: email }).lean();
  if (existing) return { status: "UNCHANGED", email };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const passwordHash = await bcrypt.hash(password, 12);
      const parentPinHash = await bcrypt.hash(pin, 12);
      const [user] = await modelRegistry.User.create(
        [{
          emailNormalized: email,
          displayName: "Phụ huynh demo",
          passwordHash,
          parentPinHash,
          consent: { termsVersion: "demo-local", acceptedAt: new Date() }
        }],
        { session }
      );
      const [child] = await modelRegistry.ChildProfile.create(
        [{
          parentId: user._id,
          nickname: "Bé Mầm",
          ageBand: "4-5",
          dialect: "north",
          mascotKey: "mascot-squirrel"
        }],
        { session }
      );
      await modelRegistry.Wallet.create([{ childId: child._id, balance: 50, earnedTotal: 50, spentTotal: 0 }], {
        session
      });
      await modelRegistry.RewardLedger.create(
        [{
          childId: child._id,
          eventKey: "welcome",
          kind: "welcome",
          delta: 50,
          sourceVersion: 1
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return { status: "CREATED", email };
}

export async function createAdminUser() {
  assertNonProduction("admin:create");
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  const pin = process.env.ADMIN_PIN;
  if (!email || !password || !pin) throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD và ADMIN_PIN là bắt buộc.");
  if (!/^\d{4}$/.test(pin)) throw new Error("ADMIN_PIN phải gồm 4 chữ số.");

  const existing = await modelRegistry.User.findOne({ emailNormalized: email }).lean();
  if (existing) return { status: "UNCHANGED", email };

  const passwordHash = await bcrypt.hash(password, 12);
  const parentPinHash = await bcrypt.hash(pin, 12);
  await modelRegistry.User.create({
    emailNormalized: email,
    displayName: "Quản trị nội dung",
    passwordHash,
    parentPinHash,
    role: "admin",
    consent: { termsVersion: "admin-local", acceptedAt: new Date() }
  });
  return { status: "CREATED", email };
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(ROOT, relativePath), "utf8"));
}

function validateManifest(manifest, rawDatasets, errors) {
  for (const dataset of manifest.datasets) {
    const rows = rawDatasets[dataset.collection] ?? [];
    if (rows.length !== dataset.count) errors.push(`Count mismatch ${dataset.collection}: ${rows.length}`);
  }
}

function validateKeys(datasets, errors) {
  for (const [name, rows] of Object.entries(datasets)) {
    const keys = rows.map((row) => row.key);
    if (new Set(keys).size !== keys.length) errors.push(`Duplicate key in ${name}`);
  }
}

function validateNfc(value, errors, pointer = "seed") {
  if (typeof value === "string") {
    if (value !== value.normalize("NFC")) errors.push(`NFC mismatch at ${pointer}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNfc(item, errors, `${pointer}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) validateNfc(item, errors, `${pointer}.${key}`);
  }
}

function validateLetters(letters, errors) {
  const symbols = letters.map((letter) => letter.symbol);
  if (JSON.stringify(symbols) !== JSON.stringify(VIETNAMESE_ALPHABET)) errors.push("Alphabet order/29 mismatch");
  if (letters.filter((letter) => letter.group === "vowel").length !== 12) errors.push("Vowel count mismatch");
  if (letters.filter((letter) => letter.group === "consonant").length !== 17) errors.push("Consonant count mismatch");
  for (const letter of letters) {
    if (VOWELS.has(letter.symbol) !== (letter.group === "vowel")) errors.push(`Letter group mismatch ${letter.key}`);
    const graphemes = [...letter.example.text.normalize("NFC")];
    const target = graphemes.slice(letter.example.targetOffset, letter.example.targetOffset + letter.example.targetLength).join("");
    if (removeToneMarks(target).toLocaleUpperCase("vi-VN") !== letter.example.baseSymbol) {
      errors.push(`Example target/base mismatch ${letter.key}: ${target}`);
    }
    if (letter.example.baseSymbol !== letter.symbol) errors.push(`Example baseSymbol must equal symbol ${letter.key}`);
  }
}

function validateTones(tones, errors) {
  const codes = new Set(tones.map((tone) => tone.code));
  for (const code of TONE_CODES) {
    if (!codes.has(code)) errors.push(`Missing tone ${code}`);
  }
  const ngang = tones.find((tone) => tone.code === "ngang");
  if (!ngang || ngang.marker !== "") errors.push("Thanh ngang marker must be empty");
}

function validateReferences(datasets, errors) {
  const keySets = Object.fromEntries(Object.entries(datasets).map(([name, rows]) => [name, new Set(rows.map((r) => r.key))]));
  for (const row of datasets.vocabulary) {
    for (const key of row.letterKeys ?? []) if (!keySets.letters.has(key)) errors.push(`Vocabulary letter ref ${row.key}`);
  }
  for (const row of datasets.spellingEntries) {
    if (!keySets.vocabulary.has(row.vocabularyKey)) errors.push(`Spelling vocabulary ref ${row.key}`);
    if (!TONE_CODES.has(row.toneCode)) errors.push(`Spelling tone ref ${row.key}`);
  }
  for (const row of datasets.exercises) {
    for (const [field, collection] of [["targetLetterKey", "letters"], ["vocabularyKey", "vocabulary"], ["spellingEntryKey", "spellingEntries"]]) {
      if (row[field] && !keySets[collection].has(row[field])) errors.push(`Exercise ${field} ref ${row.key}`);
    }
  }
  for (const row of datasets.lessons) {
    for (const key of row.letterKeys ?? []) if (!keySets.letters.has(key)) errors.push(`Lesson letter ref ${row.key}`);
    for (const key of row.exerciseKeys ?? []) if (!keySets.exercises.has(key)) errors.push(`Lesson exercise ref ${row.key}`);
  }
  for (const row of datasets.stories) {
    if (!keySets.exercises.has(row.endingExerciseKey)) errors.push(`Story ending ref ${row.key}`);
    for (const key of row.vocabularyKeys ?? []) if (!keySets.vocabulary.has(key)) errors.push(`Story vocabulary ref ${row.key}`);
    for (const scene of row.scenes ?? []) {
      for (const hotspot of scene.hotspots ?? []) {
        if (!keySets.vocabulary.has(hotspot.vocabularyKey)) errors.push(`Story hotspot ref ${row.key}`);
      }
    }
  }
}

function validateExercises(exercises, letters, errors) {
  const byType = countBy(exercises, "type");
  const identifyByLetter = new Map();
  for (const exercise of exercises) {
    const ids = exercise.options.map((option) => option.id);
    const labels = exercise.options.map((option) => option.label);
    if (new Set(ids).size !== ids.length) errors.push(`Duplicate option ids ${exercise.key}`);
    if (new Set(labels).size !== labels.length) errors.push(`Duplicate option labels ${exercise.key}`);
    if (!ids.includes(exercise.answer.optionId)) errors.push(`Answer not in options ${exercise.key}`);
    if (exercise.type === "identify-letter") {
      identifyByLetter.set(exercise.targetLetterKey, (identifyByLetter.get(exercise.targetLetterKey) ?? 0) + 1);
      const answer = exercise.options.find((option) => option.id === exercise.answer.optionId);
      const letter = letters.find((item) => item.key === exercise.targetLetterKey);
      if (!letter || !answer || answer.label.toLocaleUpperCase("vi-VN") !== letter.symbol) {
        errors.push(`Identify target mismatch ${exercise.key}`);
      }
    }
  }

  for (const letter of letters) {
    if ((identifyByLetter.get(letter.key) ?? 0) < 2) errors.push(`Missing 2 identify-letter exercises for ${letter.key}`);
  }
  for (const type of GAME_TYPES) {
    if ((byType[type] ?? 0) < 5) errors.push(`Need at least 5 exercises for ${type}`);
  }
}

function validateMediaGaps(datasets, warnings) {
  const audioMissing = ["letters", "vocabulary", "spellingEntries", "exercises"].every((collection) =>
    datasets[collection].every((row) => Object.values(row.audioAssetKeys ?? {}).every((value) => value === null))
  );
  if (audioMissing) warnings.push("No region narration audio supplied; all audioAssetKeys are null.");
  const missingResources = datasets.resources.filter((row) => row.availability === "missing");
  if (missingResources.length) warnings.push(`${missingResources.length} resources are draft/missing without PDF assets.`);
}

function resolveRow(collection, row, maps, summary) {
  const output = structuredClone(row);

  if (collection === "vocabulary") {
    output.letterIds = resolveKeys(row.letterKeys, maps.get("letters"), "vocabulary.letterKeys", summary);
    delete output.letterKeys;
  }
  if (collection === "spellingEntries") {
    output.vocabularyId = resolveKey(row.vocabularyKey, maps.get("vocabulary"), "spellingEntries.vocabularyKey", summary);
    delete output.vocabularyKey;
  }
  if (collection === "exercises") {
    output.targetLetterId = resolveNullableKey(row.targetLetterKey, maps.get("letters"), "exercises.targetLetterKey", summary);
    output.vocabularyId = resolveNullableKey(row.vocabularyKey, maps.get("vocabulary"), "exercises.vocabularyKey", summary);
    output.spellingEntryId = resolveNullableKey(row.spellingEntryKey, maps.get("spellingEntries"), "exercises.spellingEntryKey", summary);
    delete output.targetLetterKey;
    delete output.vocabularyKey;
    delete output.spellingEntryKey;
  }
  if (collection === "lessons") {
    output.letterIds = resolveKeys(row.letterKeys, maps.get("letters"), "lessons.letterKeys", summary);
    output.exerciseIds = resolveKeys(row.exerciseKeys, maps.get("exercises"), "lessons.exerciseKeys", summary);
    delete output.letterKeys;
    delete output.exerciseKeys;
  }
  if (collection === "stories") {
    output.vocabularyIds = resolveKeys(row.vocabularyKeys, maps.get("vocabulary"), "stories.vocabularyKeys", summary);
    output.endingExerciseId = resolveKey(row.endingExerciseKey, maps.get("exercises"), "stories.endingExerciseKey", summary);
    output.scenes = row.scenes.map((scene) => ({
      ...scene,
      hotspots: (scene.hotspots ?? []).map((hotspot) => ({
        ...hotspot,
        vocabularyId: resolveKey(hotspot.vocabularyKey, maps.get("vocabulary"), "stories.hotspots.vocabularyKey", summary),
        vocabularyKey: undefined
      }))
    }));
    delete output.vocabularyKeys;
    delete output.endingExerciseKey;
  }
  if (collection === "resources") {
    output.letterIds = resolveKeys(row.letterKeys, maps.get("letters"), "resources.letterKeys", summary);
    delete output.letterKeys;
  }

  return stripUndefined(output);
}

function resolveKeys(keys = [], map, label, summary) {
  return keys.map((key) => resolveKey(key, map, label, summary));
}

function resolveNullableKey(key, map, label, summary) {
  return key ? resolveKey(key, map, label, summary) : null;
}

function resolveKey(key, map, label, summary) {
  const id = map?.get(key);
  if (!id) throw new Error(`Cannot resolve ${label}: ${key}`);
  summary.refsResolved[label] = (summary.refsResolved[label] ?? 0) + 1;
  return id;
}

function assertSeedingAllowed(datasets) {
  const hasUnreviewedPublished = Object.values(datasets)
    .flat()
    .some((row) => row.status === "published" && row.reviewStatus === "needs_review");
  if (process.env.NODE_ENV === "production" && hasUnreviewedPublished) {
    throw new Error("Production seed không được publish nội dung needs_review.");
  }
  if (hasUnreviewedPublished && process.env.ALLOW_UNREVIEWED_DEMO_CONTENT !== "true") {
    throw new Error("Seed demo needs_review cần ALLOW_UNREVIEWED_DEMO_CONTENT=true ở nonproduction.");
  }
}

function assertNonProduction(commandName) {
  if (process.env.NODE_ENV === "production") throw new Error(`${commandName} không được chạy trong production.`);
}

function makeExercise({ key, type, prompt, options, answerLabel, targetLetterKey = null, vocabularyKey = null, spellingEntryKey = null }) {
  const answer = options.find((option) => option.label === answerLabel);
  return {
    key,
    version: 1,
    status: "published",
    reviewStatus: "needs_review",
    ageBands,
    type,
    prompt,
    options,
    answer: { optionId: answer.id },
    targetLetterKey,
    vocabularyKey,
    spellingEntryKey,
    difficulty: 1,
    maxAttempts: 3,
    audioAssetKeys: { north: null, central: null, south: null }
  };
}

function makeLetterOptions(symbols, target, offset) {
  const pool = deterministicRotate(symbols.filter((symbol) => symbol !== target), offset).slice(0, 3);
  const labels = deterministicRotate([target, ...pool], offset % 4);
  return labels.map((label, index) => ({ id: `option-${index + 1}`, label, assetKey: null }));
}

function addMatchRimeExercises(map, spelling) {
  const rows = spelling.filter((row) => row.rime.length >= 1).slice(0, 5);
  const rimes = [...new Set(spelling.map((row) => row.rime.toLocaleUpperCase("vi-VN")))];
  rows.forEach((row, index) => {
    const key = `ex-rime-auto-${row.key.replace(/^spelling-/, "")}`;
    if (map.has(key) || mapHasTypeCount(map, "match-rime", 5)) return;
    const answerLabel = row.rime.toLocaleUpperCase("vi-VN");
    const options = makeOptionSet(answerLabel, rimes, index);
    map.set(key, makeExercise({
      key,
      type: "match-rime",
      prompt: `Từ ${row.word.toLocaleUpperCase("vi-VN")} có vần nào?`,
      options,
      answerLabel,
      spellingEntryKey: row.key,
      vocabularyKey: row.vocabularyKey
    }));
  });
}

function addListenWordExercises(map, vocabulary) {
  const rows = vocabulary.filter((row) => row.word.length <= 4).slice(0, 8);
  rows.forEach((row, index) => {
    const key = `ex-word-auto-${row.key.replace(/^vocab-/, "")}`;
    if (map.has(key) || mapHasTypeCount(map, "listen-word", 5)) return;
    const answerLabel = row.word.toLocaleUpperCase("vi-VN");
    const options = makeOptionSet(answerLabel, rows.map((item) => item.word.toLocaleUpperCase("vi-VN")), index);
    map.set(key, makeExercise({
      key,
      type: "listen-word",
      prompt: `Chọn từ ${answerLabel} theo lời hướng dẫn.`,
      options,
      answerLabel,
      vocabularyKey: row.key
    }));
  });
}

function addToneExercises(map, spelling) {
  const labels = {
    ngang: "Thanh ngang",
    sac: "Thanh sắc",
    huyen: "Thanh huyền",
    hoi: "Thanh hỏi",
    nga: "Thanh ngã",
    nang: "Thanh nặng"
  };
  spelling.forEach((row, index) => {
    const key = `ex-tone-auto-${row.key.replace(/^spelling-/, "")}`;
    if (map.has(key) || mapHasTypeCount(map, "select-tone", 5)) return;
    const answerLabel = labels[row.toneCode];
    const options = makeOptionSet(answerLabel, Object.values(labels), index);
    map.set(key, makeExercise({
      key,
      type: "select-tone",
      prompt: `Từ ${row.word.toLocaleUpperCase("vi-VN")} mang thanh nào?`,
      options,
      answerLabel,
      spellingEntryKey: row.key,
      vocabularyKey: row.vocabularyKey
    }));
  });
}

function addAnimalExercises(map) {
  const animals = [
    { key: "vocab-ga-huyen", label: "Gà", prompt: "Con vật nào thường gáy ò ó o?" },
    { key: "vocab-bo-huyen", label: "Bò", prompt: "Con vật nào thường kêu bò ò?" },
    { key: "vocab-tho-hoi", label: "Thỏ", prompt: "Con vật nào có đôi tai dài?" },
    { key: "vocab-ca-sac", label: "Cá", prompt: "Con vật nào bơi dưới nước?" },
    { key: "vocab-co-huyen", label: "Cò", prompt: "Con vật nào là loài chim chân dài?" }
  ];
  const labels = animals.map((animal) => animal.label);
  animals.forEach((animal, index) => {
    const key = `ex-animal-auto-${animal.key.replace(/^vocab-/, "")}`;
    if (map.has(key) || mapHasTypeCount(map, "listen-animal", 5)) return;
    const options = makeOptionSet(animal.label, labels, index);
    map.set(key, makeExercise({
      key,
      type: "listen-animal",
      prompt: animal.prompt,
      options,
      answerLabel: animal.label,
      vocabularyKey: animal.key
    }));
  });
}

function mapHasTypeCount(map, type, targetCount) {
  return [...map.values()].filter((exercise) => exercise.type === type).length >= targetCount;
}

function makeOptionSet(answerLabel, allLabels, offset) {
  const pool = deterministicRotate([...new Set(allLabels)].filter((label) => label !== answerLabel), offset).slice(0, 3);
  const labels = deterministicRotate([answerLabel, ...pool], offset % 4);
  return labels.map((label, index) => ({ id: `option-${index + 1}`, label, assetKey: null }));
}

function deterministicRotate(items, amount) {
  if (!items.length) return [];
  const start = amount % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function removeToneMarks(text) {
  return text.normalize("NFD").replace(/[\u0300\u0301\u0303\u0309\u0323]/g, "").normalize("NFC");
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    acc[row[field]] = (acc[row[field]] ?? 0) + 1;
    return acc;
  }, {});
}

function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(sortObject(value))).digest("hex");
}

function fakeObjectIdForKey(key) {
  return new mongoose.Types.ObjectId(crypto.createHash("sha1").update(key).digest("hex").slice(0, 24));
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (isAtomicObject(value)) return value;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortObject(value[key])]));
}

function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (isAtomicObject(value)) return value;
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, stripUndefined(item)])
  );
}

function isAtomicObject(value) {
  return value instanceof Date || value instanceof mongoose.Types.ObjectId || Buffer.isBuffer(value);
}
