export function normalizeNfc(value) {
  return typeof value === "string" ? value.normalize("NFC") : value;
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeObjectStrings(value, seen = new WeakSet()) {
  if (typeof value === "string") return normalizeNfc(value);
  if (Array.isArray(value)) return value.map((item) => normalizeObjectStrings(item, seen));
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return value;
  if (value._bsontype === "ObjectId") return value;
  if (seen.has(value)) return value;
  seen.add(value);

  const proto = Object.getPrototypeOf(value);
  const isPlainObject = proto === Object.prototype || proto === null;
  if (!isPlainObject) return value;

  for (const [key, item] of Object.entries(value)) {
    value[key] = normalizeObjectStrings(item, seen);
  }
  return value;
}

export function applyNfcPlugin(schema) {
  schema.pre("validate", function normalizeDocument(next) {
    normalizeObjectStrings(this._doc);
    next();
  });
}
