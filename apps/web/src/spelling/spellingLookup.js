export function nfc(value) {
  return String(value ?? "").trim().normalize("NFC");
}

export function spellingKey({ onset = "", rime = "", toneCode = "ngang" } = {}) {
  return [nfc(onset).toLocaleLowerCase("vi-VN"), nfc(rime).toLocaleLowerCase("vi-VN"), nfc(toneCode)].join("|");
}

export function buildSpellingLookup(entries = []) {
  return new Map(entries.map((entry) => [spellingKey(entry), { ...entry, word: nfc(entry.word) }]));
}

export function findSpellingEntry(entries = [], slots = {}) {
  const lookup = buildSpellingLookup(entries);
  return lookup.get(spellingKey({ onset: slots.onset, rime: slots.rime, toneCode: slots.toneCode })) ?? null;
}

export function choicesFor(entries = [], field) {
  return [...new Set(entries.map((entry) => nfc(entry[field])).filter((value) => value.length > 0))].sort((a, b) =>
    a.localeCompare(b, "vi-VN")
  );
}

export function toneChoicesFor(entries = [], tones = []) {
  const allowed = new Set(entries.map((entry) => nfc(entry.toneCode)));
  return tones.filter((tone) => allowed.has(tone.code)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function isCompleteSlots(slots = {}) {
  return Boolean(nfc(slots.onset) && nfc(slots.rime) && nfc(slots.toneCode));
}
